let users = [];
let sessions = [];
let id = 0;

// creating a user account
function createUser(req, res, next) 
{
    let tempUsername = req.query.username;

    //console.log("Requested Username: " + req.query.username);

    if (users.length > 0)
    {
        for (let i = 0; i < users.length; i++) 
        {
            if (users[i].username == tempUsername)
            {
                //console.log("attempted username: " + tempUsername + "\n");
                //console.log("conflicted username: " + users[i].username + "\n");

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
               'id' : id,
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
        'data' : 
        {
               'reason' : 'Username/password mismatch',
        }
    }   

    res.send(JSON.stringify(retVal));
}

// login user route
function getUser(req, res, next) 
{
    res.send("Get User");
}

function findUser(req, res, next) 
{
    res.send("Get User");
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
    app.get (root + 'get',  getUser);
    app.get (root + 'find',  getUser);
    app.post (root + 'update',  getUser);
}