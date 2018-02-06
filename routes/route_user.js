let users = [];
let sessions = [];
let id = 0;

// creating a user account
function createUser(req, res, next) 
{
    let tempUsername = req.body.username || req.query.username || req.params.username;
    let tempPassword = req.body.password || req.query.password || req.params.password;
    let tempAvatar = req.body.avatar || req.query.avatar || req.params.avatar;

    if (tempUsername == undefined || tempPassword == undefined)
    {
        let retVal = 
        {
            'status' : 'fail',
            'reason' : "Username/Password undefined"
        }  
        res.send(JSON.stringify(retVal));
        return;
    }

    if (users.length > 0)
    {
        for (let i = 0; i < users.length; i++) 
        {
            if (users[i].username == tempUsername)
            {
                let retVal = 
                {
                    'status' : 'fail',
                    'reason' : 
                    {
                           'username' : 'Already taken',
                    }
                }   
            
                res.send(JSON.stringify(retVal));
                return;
            }
        }
    }

    let newUser = {};

    newUser.username = tempUsername;
    newUser.id = id;
    id += 1;
    newUser.password = tempPassword;
    if (tempAvatar == undefined)
        newUser.avatar = "default image";
    else
        newUser.avatar = tempAvatar;

    users.push(newUser);

    let retVal = 
    {
        'status' : 'success',
        'data' : 
        {
               'id' : newUser.id,
               'username' : tempUsername
        }
    }   

    console.log("id is " + newUser.id);
    console.log("username is " + tempUsername);
    console.log(JSON.stringify(retVal))

    res.send(JSON.stringify(retVal));
}

function makeid(length) 
{
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (let i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

// login user route
function loginUser(req, res, next) 
{
    for (let i = 0; i < users.length; i++) 
    {
        if (users[i].username == req.query.username)
        {
            if (users[i].password == req.query.password)
            {
                let sessionToken = makeid(10);
                let sessionID = makeid(5);

                let newSession = {};
                newSession.userID = users[i].id;
                newSession.sessionID = sessionID;
                newSession.sessionToken = sessionToken;
                sessions.push(newSession);

                console.log("Created session for user ID: " + users[i].id + '\n');
                console.log("Session and Token ID: " + sessionID + ", " + sessionToken + '\n');
                console.log("Active Sessions: " + sessions.length);

                let retVal = 
                {
                    'status' : 'success',
                    'data' : 
                    {
                           'id' : users[i].id,
                           'session' : sessionID,
                           'token' : sessionToken
                    }
                }   
            
                res.send(JSON.stringify(retVal));
                return;
            }
            else
                break;
        }
    }

    let retVal = 
    {
        'status' : 'fail',
        'reason' : 'Username/password mismatch',
    }   

    res.send(JSON.stringify(retVal));
}

function authenticateUser(userID, sessionID, sessionToken)
{
    console.log("\nAttempting to authenticate");
    console.log("User ID: " + userID);
    console.log("Session ID: " + sessionID);
    console.log("Session Token: " + sessionToken);
    console.log("From " + sessions.length + " Total Sessions");

    for (let i = 0; i < sessions.length; i++)
    {
        if (sessions[i].userID == userID)
        {
            console.log("Found User ID! ID: " + userID + " with Session ID: " + sessions[i].sessionID);
            
            if (sessions[i].sessionID == sessionID && sessions[i].sessionToken == sessionToken)
            {
                console.log("Authentication Successful!");
                return true;
            }
        }
    }

    return false;
}

function getUser(req, res, next) 
{
    let tempID = req.body.id || req.query.id || req.params.id;
    let tempSessionID = req.body._session || req.query._session || req.params._session;
    let tempSessionToken = req.body._token || req.query._token || req.params._token;

    if (!authenticateUser(tempID, tempSessionID, tempSessionToken))
    {
        console.log("***********************")
        console.log("Failing to authenticate with id: " + tempID);
        console.log("Active Sessions: " + sessions.length);        

        let retVal = 
        {
            'status' : 'fail',
            'reason' : 'Failed to validate id/session/token'
        }   
    
        res.send(JSON.stringify(retVal));
        return;
    }

    for (let i = 0; i < users.length; i++)
    {
        if (users[i].id == tempID)
        {
            let retVal = 
            {
                'status' : 'success',
                'data' : 
                {
                       'id' : users[i].id,
                       'username' : users[i].username,
                       'avatar' : users[i].avatar
                }
            }   
        
            res.send(JSON.stringify(retVal));
            return;
        }
    }
}

function findUser(req, res, next) 
{
    let tempUsername = req.body.username || req.query.username || req.params.username;    
    let tempSessionID = req.body._session || req.query._session || req.params._session;
    let tempSessionToken = req.body._token || req.query._token || req.params._token;

    let id = -1;
    for (let i = 0; i < users.length; i++)
    {
        if (users[i].username == tempUsername)
        {
            id = users[i].id;
        }
    }

    if (!authenticateUser(id, tempSessionID, tempSessionToken))
    {
        console.log("***********************")
        console.log("Failing to authenticate with username: " + tempUsername);
        console.log("Active Sessions: " + sessions.length);

        let retVal = 
        {
            'status' : 'fail',
            'reason' : 'Failed to validate username/session/token'
        }   
    
        res.send(JSON.stringify(retVal));
        return;
    }

    for (let i = 0; i < users.length; i++)
    {
        if (users[i].username == tempUsername)
        {
            let retVal = 
            {
                'status' : 'success',
                'data' : 
                {
                       'id' : users[i].id,
                       'username' : users[i].username
                }
            }   
        
            res.send(JSON.stringify(retVal));
            return;
        }
    }
}

function updateUser(req, res, next) 
{
    let tempID = req.body.id || req.query.id || req.params.id;
    let tempSessionID = req.body._session || req.query._session || req.params._session;
    let tempSessionToken = req.body._token || req.query._token || req.params._token;

    if (!authenticateUser(tempID, tempSessionID, tempSessionToken))
    {
        let retVal = 
        {
            'status' : 'fail',
            'reason' : { 'id' : "Forbidden" }
        }   
    
        res.send(JSON.stringify(retVal));
        return;
    }

    let oldPass = req.body.oldPassword || req.query.oldPassword || req.params.oldPassword;
    let newPass = req.body.newPassword || req.query.newPassword || req.params.newPassword;
    let newAvatar = req.body.avatar || req.query.avatar || req.params.avatar;
    let retVal = { 'status' : 'success', 'data' : {} };

    for (let i = 0; i < users.length; i++)
    {
        if (tempID == users[i].id)
        {
            if (oldPass != undefined && newPass != undefined)
            {
                if (oldPass == users[i].password)
                {
                    users[i].password = newPass;
                    retVal.data.passwordChanged = true;
                }
                else
                {
                    let failRetVal = 
                    {
                        'status' : 'fail',
                        'reason' : { 'oldPassword' : "Forbidden" }
                    }   
                    res.send(JSON.stringify(failRetVal));
                    return;
                }
            }

            if (newAvatar != undefined)
            {
                users[i].avatar = newAvatar;
                retVal.data.avatar = newAvatar;
            }
        }
    }

    res.send(JSON.stringify(retVal));    
}


// this function is exported so it can be called from app.js
module.exports.register = function (app, root) 
{
    app.post(root + 'create', createUser);
    app.get (root + 'login',  loginUser);
    app.get (root + ':id/get',  getUser);
    app.get (root + 'find/:username',  findUser);
    app.post (root + ':id/update',  updateUser);
}