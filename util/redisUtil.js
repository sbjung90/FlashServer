var poolModule = require('generic-pool');
var redis = require('redis');
var redisInfo =_redisInfo;
var redisUtil= module.exports = poolModule.Pool({
    name     : 'redis',
    create   : function(callback) {
	var c = redis.createClient(redisInfo.port, redisInfo.host, redisInfo);
	c.auth(redisInfo.auth);

        // parameter order: err, resource
        // new in 1.0.6
        callback(null, c);
    },
    destroy  : function(client) {  client.quit()},
    max      : 100,
    // optional. if you set this, make sure to drain() (see step 3)
    min      : 2, 
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis : 100000,
     // if true, logs via console.log - can also be a function
    log : false//true 
});
_commonFunc=function (funName)
{
	var args = Array.prototype.slice.call(arguments, 1);
	var dbName=args.shift();
	var callback=args.pop();
	redisUtil.acquire(function (err, rds)
	{
		if(err)
        	{
			callback(err);
			if(rds) redisUtil.release(rds);
			return;
        	}
		rds.select(dbName, function(err,result)
		{
			if(err)
			{
				callback(err);
				redisUtil.release(rds);
				return;
			}
			args.push(function (err, results)		
			{
				redisUtil.release(rds);
				callback(err, results);
			});
			rds[funName].apply(rds, args);
				
			
		});
	});
};
init =function ()
{
	var lists = ["hget","exists", "expire", "hset", "get","keys","set","zrevrange","mget", "zrevrank","zscore", "zadd" ,"zrem", "mset", "del", "zcard", "zrangebyscore","zrevrangebyscore", "hmget", "ttl"];
	for (var i = 0,j = lists.length; i < j; i++) 
	{
		var funName = lists[i];
		redisUtil[funName] = _commonFunc.bind(null, funName);
	}
};
init();
redisUtil.status=function ()
{
	console.log(redisUtil.getName() +":[poolSize:" +redisUtil.getPoolSize()+  ", available_objects_Count:"+redisUtil.availableObjectsCount()+ ", watingclientcount:" +redisUtil.waitingClientsCount() +"]")
};
