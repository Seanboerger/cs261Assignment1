let db =  require('./utils/dbmanager');
var express = require('express');   // express server
var app = express();                // init express
const bodyParser = require('body-parser');
app.use(bodyParser.json())

let users = require('./routes/route_user.js'); // user route

// defines the root route for the server end api
let apiRoot = "/api/v1/";

// calls register function in route_user.js to register the other URL routes
users.register(app, apiRoot + "users/");


app.get(apiRoot, function(req, res)
{
	res.send('Hello world!');
});

db.GetMySql().connect();

db.connect(function()
{
	app.listen(8123);
	console.log("listening");
});

//let server = app.listen(8123);