let users = [];
let sessions = [];
let id = 0;

// creating a user account
function createUser(req, res, next) 
{
    let tempUsername = req.query.username;

    if (users.length > 0)
    {
        for (let i = 0; i < users.length; i++) 
        {
            if (users[i].username == tempUsername)
            {
                let retVal = 
                {
                    'status' : 'failure',
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
    newUser.id = id++;
    newUser.password = req.query.password;
    if (req.query.avatar == undefined)
        newUser.avatar = "default image";
    else
        newUser.avatar = req.query.avatar;

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
        'status' : 'failure',
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
    console.log("From " + sessions.length + " Total Sessions\n");

    for (let i = 0; i < sessions.length; i++)
    {
        if (sessions[i].userID == userID && sessions[i].sessionID == sessionID && sessions[i].sessionToken == sessionToken)
            return true;
    }

    return false;
}

function getUser(req, res, next) 
{
    let tempID = req.body.id || req.query.id || req.params.id;
    if (!authenticateUser(tempID, req.query._session, req.query._token))
    {
        let retVal = 
        {
            'status' : 'failure',
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
    let id = -1;
    for (let i = 0; i < users.length; i++)
    {
        if (users[i].username == tempUsername)
        {
            id = users[i].id;
        }
    }

    if (!authenticateUser(id, req.query._session, req.query._token))
    {
        let retVal = 
        {
            'status' : 'failure',
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

    if (!authenticateUser(tempID, req.query._session, req.query._token))
    {
        let retVal = 
        {
            'status' : 'failure',
            'reason' : { 'id' : "Forbidden" }
        }   
    
        res.send(JSON.stringify(retVal));
        return;
    }

    let oldPass = req.query.oldPassword;
    let newPass = req.query.newPassword;
    let newAvatar = req.query.avatar;
    let retVal = { 'status' : 'success', 'data' : {} };

    for (let i = 0; i < users.length; i++)
    {
        if (tempID == users[i].id)
        {
            if (oldPass != undefined && newPass != undefined)
            {
                if (oldPass == users[i].password)
                {
                    users[i].data.password = newPass;
                    retVal.passwordChanged = true;
                }
                else
                {
                    let failRetVal = 
                    {
                        'status' : 'failure',
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