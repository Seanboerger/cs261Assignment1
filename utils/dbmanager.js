let redis = require('redis');
let mysql = require('mysql');
let crypto = require('crypto');
let cache = null;

let sqlConnection = mysql.createConnection({
    host: 'ip-172-31-19-141.us-west-2.compute.internal',
    user: 'cs261-app',
    password: 'password',
    database: 'massteroids'
   });

module.exports.GetMySql = () => { return sqlConnection; }

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