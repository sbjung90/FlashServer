/**
 * dispatcher.js
 */
 
var func = [null, global._user, global._message, global._club]

exports.dispatch = function(req, res)
{
	var data= null;

	if(req.query.enc != null)	// get
	{
		body = req.query;
	}
	else if(req.body.enc != null)		// post
	{
		body = req.body;
	}
	else
	{
		res.end("error ");
		_logger.log("return data : "+"bye bye sayonara 1111111 "+body,"info");
		return;
	}
	if(body.enc[0] === '{')
	{
		crypt = false;

	}
	else
	{
		crypt = true;
		body.enc = body.enc.replace(/ /g, '+');

	}

	
	if(crypt == true) {

		data= JSON.parse(_util_func.packet_decrypt(body.enc));

		// 로그를 찍기 위해 복호화 된 데이터를 저장
		//req.body.enc = json;
	}
	else
	{
		console.log(body.enc)		
		data= JSON.parse(body.enc);
	
	}
	_logger.log("request=>"+JSON.stringify(data));
	var skipUserCheckProtocl = [	_protocol.protocol["user"]["P_USER_LOGIN"],
					_protocol.protocol["user"]["P_USER_REGISTER"],
					_protocol.protocol["user"]["P_USER_FACEBOOK_LOGIN"],
					];
	res.crypt = crypt;
	var cmd = parseInt(data.cmd/1000);
	if(func[cmd] == null || func[cmd] == undefined)
	{
		//res.end("func[cmd] = " + func[cmd]);
		res.end("1xxxxxx");
		return;
	}
	
	if( skipUserCheckProtocl.indexOf(data.cmd) < 0 )
	{
			
		_util_func.checkRandkey(data.info[0], function (err, rndkey)
		{
			console.log(rndkey, data,data.rnd,"-------");
			if(!rndkey || data.rnd != parseInt(rndkey))
			{
				var ret = {cmd : data.cmd, rnd : null, errno : 0, uuid : data.info[0]};
				_logger.log({data: data, err : "ERR_RNKDEY"}, "error");
		
				_error.errorEvent.emit('error', _error.ERR_RNKDEY, ret, res);
			}
			else
			{
				console.log(rndkey, data.rnd);
				func[cmd].run(res, data);	
			}
		});
	}		
	else
	{
		func[cmd].run(res, data);	
	}

}
