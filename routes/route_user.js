let db = require('../utils/dbmanager');
let crypto = require('crypto');

function makeid(length) 
{
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (let i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function GetSalt()
{
    return Math.round((Date.now() * Math.random())) + '';
}

function GeneratePasswordHash(password, salt)
{
    crypto.createHash('sha512').update(salt + password, 'utf8').digest('hex');
}

// creating a user account
function createUser(req, res, next) 
{
    let tempUsername = req.body.username || req.query.username || req.params.username;
    let tempPassword = req.body.password || req.query.password || req.params.password;
    let tempAvatar = req.body.avatar || req.query.avatar || req.params.avatar;

    console.log("**********************************************\n");
    console.log("Try: Create User");

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

    db.sqlConnection.query('SELECT * FROM `user` WHERE username = ?', [tempUsername], (error, result) => 
    {
        if (result.length > 0)
        {
            let retVal = 
            {
                'status' : 'fail',
                'reason' : 
                {
                       'username' : 'Already taken'
                }
            }   
        
            console.log("Create user: Fail");
            console.log("Name already taken");

            res.send(JSON.stringify(retVal));
            return;
        }

        let newUser = {};
        let thisID = makeid(5);
        let idObj = { 'id': thisID };

        newUser.username = tempUsername;
        newUser.id = idObj.id;
        newUser.password = tempPassword;
        if (tempAvatar == undefined)
            newUser.avatar = "default image";
        else
            newUser.avatar = tempAvatar;

        let salt = GetSalt();
        let passHash = GeneratePasswordHash(newUser.password, salt);

        //////////////////////
        // MySql Push new User
        //////////////////////
        db.sqlConnection.query('INSERT INTO user (id, username, passwordhash, salt, avatar_url) VALUES ?', 
        [newUser.id, newUser.username, passHash, salt, newUser.avatar], (error, result) => 
        {
            let retVal = 
            {
                'status' : 'success',
                'data' : 
                {
                       'id' : idObj.id,
                       'username' : tempUsername
                }
            }   
        
            console.log("Create User: Success");
            console.log("id is " + idObj.id);
            console.log("username is " + tempUsername);
            console.log(JSON.stringify(retVal))
        
            res.send(JSON.stringify(retVal));
        });
    });
}

// login user route
function loginUser(req, res, next) 
{
    let tempUsername = req.body.username || req.query.username || req.params.username;
    let tempPassword = req.body.password || req.query.password || req.params.password;

    console.log("**********************************************\n");
    console.log("Try: Login");

    db.sqlConnection.query('SELECT * FROM `user` WHERE username = ?', [tempUsername], (error, result) => 
    {
        if (result.length > 0 && result.passwordhash == GeneratePasswordHash(result.salt, tempPassword))
        {
            let sessionToken = makeid(10);
            let sessionID = makeid(5);

            let newSession = {};
            newSession.userID = replyID.id;
            newSession.sessionID = sessionID;
            newSession.sessionToken = sessionToken;
            
            db.storeObject(sessionID, newSession, (replySession) => 
            {
                console.log("Login: Success");
                console.log("Created session for user ID: " + replyID.id + '\n');
                console.log("Session and Token ID: " + sessionID + ", " + sessionToken + '\n');

                let retVal = 
                {
                    'status' : 'success',
                    'data' : 
                    {
                           'id' : replyID.id,
                           'session' : sessionID,
                           'token' : sessionToken
                    }
                }

                res.send(JSON.stringify(retVal));
            });
        }
        else
        {
            let retVal = 
            {
                'status' : 'fail',
                'reason' : 'Username/password mismatch'
            }   
        
            console.log("Login: Fail");
            
            res.send(JSON.stringify(retVal));
        }
    });
}

function getUser(req, res, next) 
{
    let tempID = req.body.id || req.query.id || req.params.id;
    let tempSessionID = req.body._session || req.query._session || req.params._session;
    let tempSessionToken = req.body._token || req.query._token || req.params._token;

    console.log("**********************************************\n");
    console.log("Try: Get User");

    // Access the session, get the token, the userID back
    db.getObject(tempSessionID, (replySession) => 
    {
        // If the session exists, and the userID is correct, and the token is correct, continue
        if (replySession != null && replySession.sessionToken == tempSessionToken)
        {
            // Get the user object from the user ID
            db.sqlConnection.query('SELECT * FROM `user` WHERE id = ?', [tempID], (error, result) => 
            {
                if (result.length > 0)
                {
                    let retVal = 
                    {
                        'status' : 'success',
                        'data' : 
                        {
                               'id' : result.id,
                               'username' : result.username,
                               'avatar' : result.avatar
                        }
                    }   
                
                    console.log("Get User: Success");
                    res.send(JSON.stringify(retVal));
                }
                else
                {
                    let retVal = 
                    {
                        'status' : 'fail',
                        'reason' : 'User does not exist'
                    }       
                    res.send(JSON.stringify(retVal));
                }
            });
        }
        else
        {
            let retVal = 
            {
                'status' : 'fail',
                'reason' : 'Failed to validate id/session/token'
            }       
            console.log("Get User: Fail");
            console.log("User ID Passed: " + tempID);
            res.send(JSON.stringify(retVal));
        }
    });
}

function findUser(req, res, next) 
{
    let tempUsername = req.body.username || req.query.username || req.params.username;    
    let tempSessionID = req.body._session || req.query._session || req.params._session;
    let tempSessionToken = req.body._token || req.query._token || req.params._token;

        // Access the session, get the token, the userID back
        db.getObject(tempSessionID, (reply1) => 
        {
            // if session exists and token is correct
            if (reply1 != null && reply1.sessionToken == tempSessionToken)
            {
                // Access the user id by the username
                db.sqlConnection.query('SELECT * FROM `user` WHERE username = ?', [tempUsername], (error, result) =>  
                {
                    if (result.length > 0)
                    {
                        let retVal = 
                        {
                            'status' : 'success',
                            'data' : 
                            {
                                   'id' : result.id,
                                   'username' : tempUsername
                            }
                        }   
                    
                        res.send(JSON.stringify(retVal));
                    }
                    else
                    {
                        let retVal = 
                        {
                            'status' : 'fail',
                            'reason' : 'Failed to validate username/session/token'
                        }               
                        res.send(JSON.stringify(retVal));
                    }
                });
            }
            else
            {
                let retVal = 
                {
                    'status' : 'fail',
                    'reason' : { 'id' : "Forbidden" }
                }   
                res.send(JSON.stringify(retVal));
            }
        });
}

function updateUser(req, res, next) 
{
    let tempID = req.body.id || req.query.id || req.params.id;
    let tempSessionID = req.body._session || req.query._session || req.params._session;
    let tempSessionToken = req.body._token || req.query._token || req.params._token;

    db.getObject(tempSessionID, (sessionReply) => 
    {
        // Authenticate session with user id
        if (sessionReply != null)
        {
            // Get new password/avatar information
            let oldPass = req.body.oldPassword || req.query.oldPassword || req.params.oldPassword;
            let newPass = req.body.newPassword || req.query.newPassword || req.params.newPassword;
            let newAvatar = req.body.avatar || req.query.avatar || req.params.avatar;
            let retVal = { 'status' : 'success', 'data' : {} };
            
            // Get the user object with their id
            db.sqlConnection.query('SELECT * FROM `user` WHERE id = ?', [tempID], (error, result) =>
            {
                // If an old password was passed in AND a new password was passed in
                if (oldPass != undefined && newPass != undefined)
                {
                    // Validate the old password with the user object
                    if (oldPass == result.password)
                    {
                        // Set the new password on the temporary user object that was returned
                        let updatePass = newPass;
                        let updateAvatar = result.avatar_url;

                        // If they also passed in an avatar, set it
                        if (newAvatar != undefined)
                        {
                            updateAvatar = newAvatar;
                            retVal.data.avatar = newAvatar;
                        }
                    
                        // Store the object to update the redis entry
                        db.sqlConnection.query('UPDATE user SET password=?, avatar_url=? WHERE id = ?', [updatePass, updateAvatar, tempID], (error, result) =>
                        {
                            retVal.data.passwordChanged = true;
                            res.send(JSON.stringify(retVal));
                        });
                    }
                    else
                    {
                        // Password didn't validate, so user is forbidden
                        let failRetVal = 
                        {
                            'status' : 'fail',
                            'reason' : { 'oldPassword' : "Forbidden" }
                        }   
                        res.send(JSON.stringify(failRetVal));
                        return;
                    }
                }
                else
                {
                    // They didn't pass a new password, but they did pass a new avatar
                    if (newAvatar != undefined)
                    {
                        let updateAvatar = newAvatar;
                        retVal.data.avatar = newAvatar;

                        // Store the object to update the redis entry
                        db.sqlConnection.query('UPDATE user SET avatar_url=? WHERE id = ?', [updateAvatar, tempID], (error, result) =>
                        {
                            retVal.data.passwordChanged = false;
                            res.send(JSON.stringify(retVal));    
                        });
                    }
                    else
                    {
                        res.send(JSON.stringify(retVal)); 
                    }
                }
            });
        }
        else
        {
            // ID didn't validate so user is forbidden
            let retVal = 
            {
                'status' : 'fail',
                'reason' : { 'id' : "Forbidden" }
            }   
            
            res.send(JSON.stringify(retVal));
        }
    });
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