var alg = 'des-ede3-cbc';
var Iv = new Buffer("kunlunco", "ascii");
var Key = new Buffer("i!ovesmaku@WWW@z-qwerqrr", "ascii");
exports.randomInt = function(from, to)   
{  
	return Math.floor((Math.random()*(to - from + 1)) + from);  
}

exports.getLength = function(object)
{
	if(Array.isArray(object))
		return object.length;
		
	return Object.keys(object).length; 
}

exports.objectCopy = function (obj)
{
	return JSON.parse(JSON.stringify(obj));
}
exports.trim = function(str) 
{ 
	return str.replace(/^\s+|\s+$/g,""); 
}


exports.makeArray = function (obj)
{
	if(!Array.isArray(obj) && obj !== null)
	{
		obj = [obj];
	}	
	return obj;
}
exports.dateFormat =function (date, fstr, utc) 
{

  if(typeof date == "string" ) date  = new Date(date);
  utc = utc ? 'getUTC' : 'get';
  fstr= fstr||"%Y-%m-%d %H:%M:%S";
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    	return ('0' + m).slice (-2);
    });
}
exports.dateYmd=function (date) 
{

	return exports.dateFormat(date, "Ymd") 
}
exports.sendResult = function(res, ret)
{
        if(!res || !ret)
                return;

	if(res.req)
	{	
		var date = new Date();
		var res_time = parseInt(date.getTime()) - res.req.connection._idleStart;
		var recv_data = res.req.route.method === "post" ? res.req.body : res.req.query;

		var log = {
			date : date,
			method : res.req.route.method,
			recv_data : res.crypt ? this.packet_decrypt(recv_data.enc) : recv_data.enc,
			send_data : ret,
			time : res_time
		};
	}

        if(res.crypt)
                res.end(this.packet_encrypt(new Buffer(JSON.stringify(ret),"utf-8")));
        else
                res.end(new Buffer(JSON.stringify(ret),"utf-8"));



        //if(ret.errno != 0 && ret.errno != _error.errcode["ERR_BLOCK_ACCOUNT"] && ret.errno != _error.errcode["ERR_DUP_NICKNAME"])
         //       _logger.log(log, "error");
        _logger.log("return data : "+JSON.stringify(ret), "info");
}

exports.chinaunixtime = function ()
{
	return parseInt((new Date()).getTime()/1000)-3600;
}
exports.unixtime = function ()
{
	return parseInt((new Date()).getTime()/1000);
}
exports.merge=function(obj1, obj2)
{
	for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
	return obj1;
}
exports.packet_decrypt = function(enc_data)
{
	enc_data = new Buffer(enc_data, 'base64');

	var decipher = _crypto.createDecipheriv(alg, Key, Iv);

	//var decoded = decipher.update(enc_data, 'utf8', 'ascii');
	var decoded = decipher.update(enc_data);

	decoded += decipher.final('ascii');
	
	return decoded;
}

exports.packet_encrypt = function(data)
{
	var cipher = _crypto.createCipheriv(alg, Key, Iv);
	
	var encoded = cipher.update(data, 'utf8', 'base64');
	
	encoded += cipher.final('base64');
	
	return encoded;
}
exports.base64_encode = function(str)
{
	return new Buffer(str).toString("base64");
}

exports.base64_decode = function(str)
{
	return new Buffer(str,"base64").toString("utf8");
}
exports.checkRandkey= function (uuid, callback)
{
	_rds.hget(Constants.REDIS_RNDKEY, "rndkeys",  uuid, function (err, rndkey)
	{
		callback(err,rndkey);
	
	});
}
exports.setRnkey= function (uuid, callback)
{
	var rndkey= _util_func.randomInt(1, 10000000);
	_rds.hset(Constants.REDIS_RNDKEY, "rndkeys",  uuid,rndkey, function (err, result)
	{
	
		callback(err,rndkey);
		
	});
}
exports.requestTest=function (logPoint, data, Obj)
{
	setTimeout( function ()
	{
		console.log(logPoint, " --- settimeoutStart");
		var res={};
		res.end=function ()
		{
		//	console.log(JSON.stringify(arguments))
		}
		res.req ={};
		res.req.connection={};
		res.req.connection._idleStart = 0;
		res.req.route={};
		res.req.route.method="post";
		res.req.route.method = "post";
		res.req.body={"enc":"wwww"};
		var recv_data = res.req.route.method === "post" ? res.req.body : res.req.query;
        
		var ret = {cmd : data.cmd, rnd : null, errno : 0};
		Obj.run(res,data);
		console.log(logPoint, " --- settimeout END");
	}, 1000);
}
exports.shuffle =function(a)
{
	var j, x, i;
	for (i = a.length; i; i--) {
		j = Math.floor(Math.random() * i);
		x = a[i - 1];
		a[i - 1] = a[j];
		a[j] = x;
	}
};
exports.baseRandomSuccess = function (val)
{

	var max = 100000
	var success = _util_func.randomInt(1, max)
	return (val >= success)
}
exports.baseRandomCheck= function (val)
{

	return exports.baseRandomSuccess(val);
}
exports.planArrayCheck=function(arr)
{
	if(!arr || arr.length  == 0 || (arr.length == 1 && arr[0]==0)) return false;
	return true;
}
setTimeout( function ()
{
	
	//for(var i= 0;  i <  100; i++)
	//console.log(exports.baseRandomSuccess(80000));
	
	//exports.sendMail= function (bidx,uuid, cidx,send_cidx , mail_type ,expire, itemList,  callback)
	//100
	//addItem=function(bidx,uuid, cidx , itemid, cnt, whereget, callback )
	//exports.addItem(32101001).dbs);
	//exports.makeNewPet(0,1212,75, 103466, 2, function (err, results)
	//{
	//	console.log(err, results);
	//});
}, 1000);


exports.returnError = function(res, ret, err_type, err_code, err_str)
{
	ret['error'] = { err_type : err_type, err_code : err_code, err_str : err_str };
	ret['errno'] = err_code;
	if (global.DEV_SERVER)
	{
		console.error(ret);
	}
	_util_func.sendResult(res, ret);
};
