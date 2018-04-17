let redis = require('redis');
var mysql = require('mysql'),
	crypto = require('crypto');
let cache = null;
var sqlConnection = null;

module.exports.sqlConnect = function (callback)
{
    sqlConnection = mysql.createConnection({
        host: 'ip-172-31-19-141.us-west-2.compute.internal',
        user: 'cs261-app',
        password: 'password'
       });
    
    sqlConnection.connect();
    sqlConnection.query('USE massteroids');

    callback();
}

module.exports.sql = sqlConnection;

module.exports.connect = function (callback)
{
    cache = redis.createClient(6379, 'ip-172-31-19-141.us-west-2.compute.internal');
    cache.on('connect', function() 
    {
        callback();
    });
}

module.exports.storeObject = function (key, value, callback)
{
    cache.hmset(key, value, function (err, reply)
    {
        if (err)
            return process.nextTick(() => { callback(null); });

        return process.nextTick(() => { callback(reply); });
    });
}

module.exports.getObject = function (key, callback)
{
    cache.hgetall(key, function (err, reply)
    {
        if (err)
            return process.nextTick(() => { callback(null); });

        return process.nextTick(() => { callback(reply); });
    });
}