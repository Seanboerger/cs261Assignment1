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
                    'data' : 
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
    console.log("\nAttempting to authenticate\n");
    console.log("User ID: " + userID + '\n');
    console.log("Session ID: " + sessionID + '\n');
    console.log("Session Token: " + sessionToken + '\n');
    console.log("From " + sessions.length + " Total Sessions\n");

    for (let i = 0; i < sessions.length; i++)
    {
        console.log("Value of i in auth look: " + i + "\n");
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
    res.send("Get User");
}


// this function is exported so it can be called from app.js
module.exports.register = function (app, root) 
{
    app.post(root + 'create', createUser);
    app.get (root + 'login',  loginUser);
    app.get (root + ':id/get',  getUser);
    app.get (root + 'find/:username',  findUser);
    app.get (root + ':id/update',  updateUser);
}