let redis = require('redis');

let cache = null

module.exports.connect = function (callback)
{
    cache = redis.createClient();
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