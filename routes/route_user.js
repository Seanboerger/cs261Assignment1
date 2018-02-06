let users = [];
let id = 0;

// creating a user account
function createUser(req, res, next) 
{
    let tempUsername = req.params.username;

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
                           'username attempted' : tempUsername,
                           'username found' : users[i].username
                    }
                }   
            
                res.send(JSON.stringify(retVal));
            }
        }
    }

    let newUser = {};

    newUser.username = tempUsername;
    newUser.id = id;
    id++;
    newUser.password = req.params.password;
    newUser.avatar = req.params.avatar;

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

// login user route
function loginUser(req, res, next) 
{
    res.send("Login");
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