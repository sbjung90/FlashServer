var EventEmitter = require('events').EventEmitter;
var util = require('util');
function RedisMng() {
  EventEmitter.call(this);
}
util.inherits(RedisMng, EventEmitter);
var obj = new RedisMng();
obj.on("setUser", function (data)
{
	console.log(data);
});
obj.on("setUser" , function (user, sData)
{
	_rds.hset(Constants.REDIS_DB, ["info_user",user,  JSON.stringify(sData)], function (err,result)
	{
		console.log(result);
			
	});
});
obj.on("send",function (res, ret)
{
	console.log("wwww");
//	_util_func.sendResult(res, ret);
});
module.exports = obj;
//RedisMng.on("", 
