let db =  require('../utils/dbmanager');

function makeid(length) 
{
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (let i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
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

        //////////////////////
        // Redis Push new User
        //////////////////////
        db.storeObject(idObj.id, newUser, (reply) => 
        {
            
            db.storeObject(newUser.username, idObj, (reply) => 
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
    });
}

// login user route
function loginUser(req, res, next) 
{
    let tempUsername = req.body.username || req.query.username || req.params.username;
    let tempPassword = req.body.password || req.query.password || req.params.password;

    console.log("**********************************************\n");
    console.log("Try: Login");

    db.getObject(tempUsername, (replyID) => 
    {
        if (replyID != null)
        {
            db.getObject(replyID.id, (replyUser) => 
            {
                if (replyUser.password == tempPassword)
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
            db.getObject(tempID, (reply) => 
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
            console.log("User ID Found for this session: " + replySession.userID);
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
            db.getObject(tempUsername, (reply2) => 
            {
                if (reply2 != null)
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

    // Access the session, get the token, the userID back
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

                        let tempuser = userReply;
                        // Store the object to update the redis entry
                        db.storeObject(userReply.id, tempuser, (reply) => 
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
                        userReply.avatar = newAvatar;
                        retVal.data.avatar = newAvatar;
                        
                        let tempuser = userReply;

                        // Store the object to update the redis entry
                        db.storeObject(userReply.id, tempuser, (reply) => 
                        {
                            retVal.data.passwordChanged = false;
                            //res.send(JSON.stringify(retVal));    
                            return;
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