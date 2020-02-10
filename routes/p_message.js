/*
 * p_user.js
 * user 와 관련된 프로토콜 처리
 */

// 유저 실행
var EventEmitter = require("events").EventEmitter;
var Model={}
Model.Enum ={};
Model.Enum.Platform ={
	None:0,
	IOS:1,
	Android:2,
	Web:3,
}
Model.Enum.MessageStatus= {
	RequestHeart : 0,
	ResponseHeart: 1,
	ReceiveHeart : 1,
	RequestHelp : 2,
	ReceiveHelp : 3,
}
Model.Enum.StageType={
	Normal: 0,
	Bonus: 1,
}
exports.run=function(res,data)
{
	Message.run(res,data);
}
exports.getObj = function()
{
	return Message.Protocol;
}


Message ={};
// 프로토콜 별 실행할 함수를 저장할 배열
Message.func={};

//객체 생성 이전 초기화작업을 여기서 한다. 
//static init
//전역 적으로한번만 호출되며 .. 파일로드시 적어도 한번은 호출됨 ..
Message.init =  function()
{
	// 프로토콜에 함수 대입
	// p로 시작하는 함수가 프로토콜 전용 함수


	
	const theProtoName = "message";
	for (var x in _protocol.protocol[theProtoName])
	{
		
		if(!Message.Protocol[x]) 
		{
			console.log(x + "= ERROR");
		}
		Message.func[_protocol.protocol[theProtoName][x]] =Message.Protocol[x];
	}
	for (var x in Message.Protocol)
	{
		if(!_protocol.protocol[theProtoName][x])
		{
			console.log(theProtoName+" ==> " + x + "= BIND error");
		}
	}
	//Message.func[1004] = Message.Protocol.pPushTest;
	//Message.func[1005] = Message.Protocol.pIABTest;
	
	_logger.log("Message init Call", "info");
}

        


//var data = {cmd:2003, info:[ 12,1 ], bidx:0 } // ITEM  정보  
//_util_func.requestTest("p_message",data,Message);


Message.Evt = new EventEmitter();
Message.Protocol={}
// 객체생성 시점에서 실행되는것들임 
Message.run=function(res, data)
{
	var ret = {cmd : data.cmd, rnd : null, errno : 0};
	
	if(data.cmd != _protocol.protocol["user"]["P_USER_LOGIN"])
	{
		ret['uuid'] = data.info[0];
		_logger.onlineLog(ret['uuid']);
	}
	
	(Message.func[data.cmd] == undefined) ? res.end("protocol not found"):Message.func[data.cmd](data,ret,res);
}
	
Message.Protocol.P_LIST_MESSAGE= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx= info[0];

	
	var query = "SELECT * FROM u_message WHERE (um_target_u_idx_i=? AND um_status_ti=0) OR (um_u_idx_i=? AND um_status_ti=1) ; "
	
	_shard.query_without_trans(bidx, query,[uidx, uidx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}

		ret["messages"]  =result;
		_util_func.sendResult(res, ret);
	
	});
	
	
}
Message.Protocol.P_DELETE_MESSAGE= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx= info[0];
	var umidx= info[1];
	var targetUIdx= info[2];

	
	var query = "DELETE FROM u_message WHERE um_idx_bi =? AND um_u_idx_i=? AND  um_sender_u_idx_i=?";
	
	_shard.query_without_trans(bidx, query,[umidx, uidx, targetUIdx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}

		ret["messages"]  =result;
		_util_func.sendResult(res, ret);
	
	});
	
	
}
Message.Protocol.P_REQUEST_HEART= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0]
	var facbookvc= info[1]
	var targetFacebookId = info[2]

	
	var obj = {};

	//TODO xxx 수신 쪽에서 가져와서 처리하나?
	//obj["userId"] = targetFacebookId;
	var query = "SELECT * FROM u_info WHERE u_facebook_vc=?;";
	
	_shard.query_without_trans(bidx, query,[targetFacebookId],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(result.length == 0 )
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'server', _error.ERR_EXISTS_USER);
		}
		obj["um_u_idx_i"] =uidx;
		obj["um_u_facebook_vc"] = facbookvc;
		obj["um_target_u_idx_i"] = result[0].u_idx_i;
		obj["um_target_u_facebook_vc"] = targetFacebookId
		obj["um_status_ti"] =  Model.Enum.MessageStatus.RequestHeart;
		var query = "INSERT INTO u_message SET ?;";
		_shard.query_without_trans(bidx, query,[obj],function (err, result)
		{
			if(err)
			{
				_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}

			ret["messages"]  =result;
			_util_func.sendResult(res, ret);
		
		});
	});
	
	
	
}
Message.Protocol.P_ACCEPT_HEART= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0]
	var idx = info[1]

	
	//obj["userId"] = targetFacebookId;
	var query = "DELETE FROM u_message WHERE um_u_idx_i = ? AND um_status_ti=? AND um_idx_bi=?" 
	
	_shard.query_without_trans(bidx, query,[uidx, Model.Enum.MessageStatus.ResponseHeart,idx ],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		ret["updated"] = result.affctedRows > 0   ? true: false;
		_util_func.sendResult(res, ret);
	});
	
	
	
}
Message.Protocol.P_REQUEST_HEART_MULTI= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0]
	var facbookvc= info[1]
	var targetFacebookIds = info[2]
	var funcs =[];
	for(var i=  0 ; i< targetFacebookIds.length ; i++)
	{
		funcs.push( ( function(targetFacebookId)
		{
			return function (cb)
			{
				var query = "SELECT * FROM u_info WHERE u_facebook_vc=?;";
				
				_shard.query_without_trans(bidx, query,[targetFacebookId],function (err, result)
				{
					if(result.length == 0 )
					{
						err =  _error.ERR_EXISTS_USER;
					}
					if(err)
					{	
						cb(err);
						return;
					}
					var obj = {};
					obj["um_u_idx_i"] =uidx;
					obj["um_u_facebook_vc"] = facbookvc;
					obj["um_target_u_idx_i"] = result[0].u_idx_i;
					obj["um_target_u_facebook_vc"] = targetFacebookId
					obj["um_status_ti"] =  Model.Enum.MessageStatus.RequestHeart;
					var query = "INSERT INTO u_message SET ?;";
					_shard.query_without_trans(bidx, query,[obj],function (err, result)
					{
						//ret["messages"]  =result;
						cb(err);
					
					});
				});
			}
		})(targetFacebookIds[i]));
	}
	_async.waterfall(funcs, function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		_util_func.sendResult(res, ret);
	});
}
	
Message.Protocol.P_RESPONSE_HEART = function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0]
	var friend_uidx= info[1]
	var idx = info[2]

	
	//obj["userId"] = targetFacebookId;
	var update = {};
	update["um_status_ti"] = Model.Enum.MessageStatus.ResponseHeart
	var query = "UPDATE u_message SET ? WHERE um_target_u_idx_i = ? AND um_u_idx_i =? AND um_status_ti=? AND um_idx_bi=?" 
	
	_shard.query_without_trans(bidx, query,[update, uidx, friend_uidx, Model.Enum.MessageStatus.RequestHeart,idx ],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		ret["messages"]  =result;
		_util_func.sendResult(res, ret);
	});
	
	
	
}
Message.Protocol.P_SEND_HEART= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0]
	var facbookvc= info[1]
	var targetFacebookId = info[2]

	
	//obj["userId"] = targetFacebookId;
	var query = "SELECT * FROM u_info WHERE u_facebook_vc=?;";
	
	_shard.query_without_trans(bidx, query,[targetFacebookId],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(result.length == 0 )
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'server', _error.ERR_EXISTS_USER);
		}
		obj["um_u_idx_i"] = result[0].u_idx_i;
		obj["um_u_facebook_vc"] = targetFacebookId
		obj["um_target_u_idx_i"] =uidx;
		obj["um_target_u_facebook_vc"] = facbookvc;
		obj["um_status_ti"] =  Model.Enum.MessageStatus.ResponseHeart;
		var query = "INSERT INTO u_message SET ?;";
		_shard.query_without_trans(bidx, query,[obj],function (err, result)
		{
			if(err)
			{
				_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
	
			_util_func.sendResult(res, ret);
		});
	});
	
	
	
}
	
Message.Protocol.P_SEND_HEART_MULTI= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0]
	var facbookvc= info[1]
	var targetFacebookIds = info[2]
	var funcs =[];
	for(var i=  0 ; i< targetFacebookIds.length ; i++)
	{
		funcs.push( ( function(targetFacebookId)
		{
			return function (cb)
			{
				var query = "SELECT * FROM u_info WHERE u_facebook_vc=?;";
				
				_shard.query_without_trans(bidx, query,[targetFacebookId],function (err, result)
				{
					if(result.length == 0 )
					{
						err =  _error.ERR_EXISTS_USER;
					}
					if(err)
					{	
						cb(err);
						return;
					}
					var obj = {};

					obj["um_u_idx_i"] = result[0].u_idx_i;
					obj["um_u_facebook_vc"] = targetFacebookId
					obj["um_target_u_idx_i"] =uidx;
					obj["um_target_u_facebook_vc"] = facbookvc;
					obj["um_status_ti"] =  Model.Enum.MessageStatus.ResponseHeart;
					var query = "INSERT INTO u_message SET ?;";
					_shard.query_without_trans(bidx, query,[obj],function (err, result)
					{
						//ret["messages"]  =result;
						cb(err);
					
					});
				});
			}
		})(targetFacebookIds[i]));
	}
	_async.waterfall(funcs, function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		_util_func.sendResult(res, ret);
	});
}
	
// 최초 초기화
Message.init();
