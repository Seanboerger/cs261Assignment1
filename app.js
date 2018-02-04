let express = require('express');
let app = express();
let port = 7000;
let hits = 1;

app.get('/', function(req, res)
{
    res.send("The server is working and your hit number is " + hits + "\n");
    hits = hits + 1;
});

app.listen(7000);