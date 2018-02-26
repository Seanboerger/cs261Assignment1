let db =  require('../utils/dbmanager');

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

    db.getObject(tempUsername, (reply) => 
    {
        if (reply != null)
        {
            let retVal = 
            {
                'status' : 'fail',
                'reason' : 
                {
                       'username' : 'Already taken'
                }
            }   
        
            res.send(JSON.stringify(retVal));
            return;
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

        //////////////////////
        // Redis Push new User
        //////////////////////
        db.storeObject(newUser.id, newUser, (reply) => 
        {
            let idObj = { 'id': newUser.id };
            db.storeObject(newUser.username, idObj, (reply) => 
            {
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
            });
        });
    });
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
    let tempUsername = req.body.username || req.query.username || req.params.username;
    let tempPassword = req.body.password || req.query.password || req.params.password;

    db.getObject(tempUsername, (reply) => 
    {
        if (reply != null)
        {
            db.getObject(reply.id, (reply) => 
            {
                if (reply.password == tempPassword)
                {
                    let sessionToken = makeid(10);
                    let sessionID = makeid(5);

                    let newSession = {};
                    newSession.userID = reply.id;
                    newSession.sessionID = sessionID;
                    newSession.sessionToken = sessionToken;
                    
                    db.storeObject(sessionID, newSession, (reply) => 
                    {
                        console.log("Created session for user ID: " + reply.id + '\n');
                        console.log("Session and Token ID: " + sessionID + ", " + sessionToken + '\n');
                        console.log("Active Sessions: " + sessions.length);
        
                        let retVal = 
                        {
                            'status' : 'success',
                            'data' : 
                            {
                                   'id' : reply.id,
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
                
                    res.send(JSON.stringify(retVal));
                }
            });
        }
        else
        {
            let retVal = 
            {
                'status' : 'fail',
                'reason' : 'Username/password mismatch'
            }   
        
            res.send(JSON.stringify(retVal));
        }
    });
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

    // Access the session, get the token, the userID back
    db.getObject(tempSessionID, (reply) => 
    {
        // If the session exists, and the userID is correct, and the token is correct, continue
        if (reply != null && tempID == reply.userID && reply.sessionToken == tempSessionToken)
        {
            // Get the user object from the user ID
            db.getObject(reply.userID, (reply) => 
            {
                if (reply != null)
                {
                    let retVal = 
                    {
                        'status' : 'success',
                        'data' : 
                        {
                               'id' : reply.id,
                               'username' : reply.username,
                               'avatar' : reply.avatar
                        }
                    }   
                
                    res.send(JSON.stringify(retVal));
                    return;
                }
                else
                {
                    let retVal = 
                    {
                        'status' : 'fail',
                        'reason' : 'User does not exist'
                    }       
                    res.send(JSON.stringify(retVal));
                    return;
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
            res.send(JSON.stringify(retVal));
            return;
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
            db.getObject(tempUsername, (reply2) => 
            {
                if (reply2 != null && reply2.id == reply1.userID)
                {
                    let retVal = 
                    {
                        'status' : 'success',
                        'data' : 
                        {
                               'id' : reply2.id,
                               'username' : tempUsername
                        }
                    }   
                
                    res.send(JSON.stringify(retVal));
                    return;
                }
                else
                {
                    let retVal = 
                    {
                        'status' : 'fail',
                        'reason' : 'Failed to validate username/session/token'
                    }               
                    res.send(JSON.stringify(retVal));
                    return;
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
            return;
        }
    });
}

function updateUser(req, res, next) 
{
    let tempID = req.body.id || req.query.id || req.params.id;
    let tempSessionID = req.body._session || req.query._session || req.params._session;
    let tempSessionToken = req.body._token || req.query._token || req.params._token;

    // Access the session, get the token, the userID back
    db.getObject(tempSessionID, (sessionReply) => 
    {
        // Authenticate session with user id
        if (sessionReply != null && sessionReply.id == tempID)
        {
            // Get new password/avatar information
            let oldPass = req.body.oldPassword || req.query.oldPassword || req.params.oldPassword;
            let newPass = req.body.newPassword || req.query.newPassword || req.params.newPassword;
            let newAvatar = req.body.avatar || req.query.avatar || req.params.avatar;
            let retVal = { 'status' : 'success', 'data' : {} };

            // Get the user object with their id
            db.getObject(tempID, (userReply) => 
            {
                // If an old password was passed in AND a new password was passed in
                if (oldPass != undefined && newPass != undefined)
                {
                    // Validate the old password with the user object
                    if (oldPass == userReply.password)
                    {
                        // Set the new password on the temporary user object that was returned
                        userReply.password = newPass;

                        // If they also passed in an avatar, set it
                        if (newAvatar != undefined)
                        {
                            userReply.avatar = newAvatar;
                            retVal.data.avatar = newAvatar;
                        }

                        // Store the object to update the redis entry
                        db.storeObject(userReply.id, userReply, (reply) => 
                        {
                            retVal.data.passwordChanged = true;

                            res.send(JSON.stringify(retVal));
                            return;    
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
                        userReply.avatar = newAvatar;
                        retVal.data.avatar = newAvatar;
                        
                        // Store the object to update the redis entry
                        db.storeObject(userReply.id, userReply, (reply) => 
                        {
                            retVal.data.passwordChanged = false;
                            res.send(JSON.stringify(retVal));    
                        });
                    }
                }
                res.send(JSON.stringify(retVal)); 
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
            return;
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