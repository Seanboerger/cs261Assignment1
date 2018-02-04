


// creating a user account
function createUser(req, res, next) {
    res.send("Create User");
}

// login user route
function loginUser(req, res, next) {
    res.send("Login");
}

// login user route
function getUser(req, res, next) {
    res.send("Get User");
}


// this function is exported so it can be called from app.js
module.exports.register = function (app, root) 
{
    app.post(root + 'create', createUser);
    app.get (root + 'login',  loginUser);
    app.get (root + 'get',  getUser);
}