/*
 * p_user.js
 * user 와 관련된 프로토콜 처리
 */

// 유저 실행
var EventEmitter = require("events").EventEmitter;
exports.run=function(res,data)
{
	Club.run(res,data);
}


Club ={};
// 프로토콜 별 실행할 함수를 저장할 배열
Club.func={};

//객체 생성 이전 초기화작업을 여기서 한다. 
//static init
//전역 적으로한번만 호출되며 .. 파일로드시 적어도 한번은 호출됨 ..
Club.init =  function()
{
	// 프로토콜에 함수 대입
	// p로 시작하는 함수가 프로토콜 전용 함수

	const theProtoName = "club";
	for (var x in _protocol.protocol[theProtoName])
	{
		if(!Club.Protocol[x]) 
		{
			console.log(x + "= ERROR");
		}
		Club.func[_protocol.protocol[theProtoName][x]] =Club.Protocol[x];
	}
	for (var x in Club.Protocol)
	{
		if(!_protocol.protocol[theProtoName][x])
		{
			console.log(theProtoName+" ==> " + x + "= BIND error");
		}
	}

	
	//Club.func[1004] = Club.Protocol.pPushTest;
	//Club.func[1005] = Club.Protocol.pIABTest;
	
	_logger.log("Club init Call", "info");
}

        


Club.Evt = new EventEmitter();
//var data = {cmd:1006, info:["121212", 75, "armor1", 1, 1, 1], bidx:0 } // ITEM  정보  
//_util_func.requestTest("p_mail", data,Club);


Club.Protocol={}
// 객체생성 시점에서 실행되는것들임 
Club.run=function(res, data)
{
	var ret = {cmd : data.cmd, rnd : null, errno : 0};
	
	if(data.cmd != _protocol.protocol["user"]["P_USER_LOGIN"])
	{
		ret['uuid'] = data.info[0];
		_logger.onlineLog(ret['uuid']);
	}
	
	(Club.func[data.cmd] == undefined) ? res.end("protocol not found"):Club.func[data.cmd](data,ret,res);
}
	
//  //__check
//
//P_GET_DONATE_POINT_INFO __PRO {cmd:9005, info:[uuid, cidx, money_type] } //가격정보
//__PRO money_type : 공헌도를 살타입
Club.Protocol.P_CREATE_CLUB=  function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var name = info[1];
	var desc= info[2];
	var query = "SELECT * FROM u_info WHERE u_idx_i = ?";
	var clubCreatePossibleLevel = 10;
	_shard.query_without_trans(bidx, query,[uuid],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		var uInfo = result[0];
		if(uInfo.u_max_stage_i < clubCreatePossibleLevel)
		{
			//TODO _ERR_CAN_NOT_ENOUGH_LEVEL;
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(uInfo.g_idx_i != 0)
		{
			//TODO _ERR_ALEADY_JOIN_CLUB
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		var query = "SELECT  * FROM g_info WHERE g_name_vc =?;";
		_shard.query_without_trans(bidx, query,[name],function (err, result)
		{
			if(err)
			{
				_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			if(result.length > 0 ) 
			{
				_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			
			var insert  = {};	
			insert["g_name_vc"] = name;
			insert["g_desc_txt"] = desc;
			var query = "INSERT INTO  g_info SET ? ;";
			_shard.query_without_trans(bidx, query,[insert],function (err, result)
			{
					
				if(err)
				{
					_logger.log({data : data, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
				insert["g_idx_i"] = result.insertId;
				ret["g_info"] =  insert;
				Club.Evt.emit("OnJoinClub", data, ret, res, function (err)
				{
					if(err)
					{
						_logger.log({data : data, err : JSON.stringify(err)}, "error");
						return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
					}
					_util_func.sendResult(res, ret);
				});

			});

		});
	});
}
Club.Evt.on("OnJoinClub", function(data, res, ret, callback)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];
	var update= {} ;
	update["u_g_idx_i"] = gidx;
	var query = "UPDATE  u_info SET ? WHERE u_idx_i =?;";
	_shard.query_without_trans(bidx, query,[update, uuid],function (err, result)
	{
			
		callback(err, result);
	});
});
Club.Evt.on("OnLeaveClub", function(data, res, ret, callback)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];
	var update= {} ;
	update["u_g_idx_i"] = 0;
	var query = "UPDATE  u_info SET ? WHERE u_idx_i =?;";
	_shard.query_without_trans(bidx, query,[update, uuid],function (err, result)
	{
			
		callback(err, result);
	});
});

Club.Protocol.P_LEAVE_CLUB=  function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];
	

	//방장인가?
	
	Club.Evt.emit("onCheckLeader", data, ret, res,function (err, bCheck)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(bCheck)
		{
			//방장 탈퇴
			var query = "SELECT  u_idx_i, u_name_vc, u_ghelp_i, u_max_stage_i FROM u_info WHERE u_g_idx_i = ? ORDER BY u_max_stage_i, u_ghelper_i DESC LIMIT 0,2";
			_shard.query_without_trans(bidx, query,[gidx],function (err, result)
			{
					
				if(err)
				{
					_logger.log({data : data, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
				var newGUidx = 0;
				if(result.length >=2  )
				{
					for(var i = 0 ; i< result.length; i++)
					{
						var row = result[i];
						if(row.u_idx_i !=uuid)
						{	
							newGUidx = row.u_idx_i ;
							break;
						}
					}
					//ㅣ	
					if(newGUidx>0)
					{
						var update ={};
						update["g_u_idx_i"] = newGUidx;
						var query = "UPDATE  g_nfo SET ? WHERE g_idx_i=?;";
						_shard.query_without_trans(bidx, query,[update ,gidx],function (err, result)
						{
						});
						
					}
					Club.Evt.emit("OnLeaveClub", data,ret, res, function()
					{
						_util_func.sendResult(res, ret);
					});
				
					//TODO 마지막 한명일?
				}
			});
		//가입시 JOIN LOG
			return;
		}

		Club.Evt.emit("OnLeaveClub", data,ret, res, function()
		{
			_util_func.sendResult(res, ret);
		});
	});
}


//P_BUY_DONATE_POINT __PRO {cmd:9000, info:[uuid, cidx, money_type] } //가격정보
//__PRO money_type : 공헌도를 살타입
Club.Protocol.P_JOIN_CLUB=  function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];
	
	var query = "SELECT * FROM u_info WHERE u_idx_i = ?; SELECT * FROM g_info WHERE g_idx_i = ?;  ";
	_shard.query_without_trans(bidx, query,[uuid, gidx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		var uInfo = result[0][0];
		var gInfo = result[1][0];
		if(!uInfo || !gInfo)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(gInfo.g_level_bound_i > uInfo.u_max_stage_i)
		{
			//TODO LEVEL_NOT_ENOUGH
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}

		var query = "SELECT count(*)  as CNT FROM u_info WHERE g_idx_i= ?";
	
		_shard.query_without_trans(bidx, query,[update ,gidx],function (err, result)
		{
				
			if(err)
			{
				_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			if(result[0].CNT >= 30)
			{
				//TODO OVER_MEMBER
				_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			Club.Evt.emit("OnJoinClub", data, ret, res, function (err)
			{
				if(err)
				{
					_logger.log({data : data, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
				_util_func.sendResult(res, ret);
			});
		});

		
	});
}

Club.Protocol.P_CLUB_LIST=  function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var name = info[1];
	

	var query = "SELECT g.*  FROM g_info g , u_info u WHERE  g_u_idx_i =  u_idx_i AND g_name_vc LIKE '?%';";
	_shard.query_without_trans(bidx, query,[name],function (err, result)
	{
			
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		//가입시 JOIN LOG
		
		ret["list"] = result;
		_util_func.sendResult(res, ret);

	});
}
Club.Protocol.P_MYCLUB_RANK=  function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];
	

	var query = "SELECT  u_idx_i, u_name_vc, u_ghelp_i, u_max_stage_i FROM u_info WHERE u_g_idx_i = ? ORDER BY u_max_stage_i, u_ghelper_i DESC";
	_shard.query_without_trans(bidx, query,[gidx],function (err, result)
	{
			
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		//가입시 JOIN LOG
		
		var k= 0 ;
		var rankList= [];
		for(var i= 0 ; i < result.length; i++)
		{
			var row = result[i];
			k++;
			row.rank= rank;
			rankList.push(row);
				
		}
		ret["list"] = rankList;
		_util_func.sendResult(res, ret);

	});
}
Club.Evt.on("onCheckLeader", function (data, ret, res, callback)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];

	var query = "SELECT * FROM v_u_g WHERE u_idx_i = ?; SELECT * FROM g_info WHERE g_idx_i = ?;  ";
	_shard.query_without_trans(bidx, query,[uuid, gidx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		var uInfo = result[0][0];
		var gInfo = result[1][0];
		if(!uInfo || !gInfo)
		{
			callback(_error.ERR_DB);
			return;
		}
		if(gInfo.g_u_idx_i !=  uInfo.u_idx_i)
		{
			//TODO _ERR_PERMISSION_DENY
			callback(null, false);
		}
		else
		{
			callback(null, true);
		}
	});
});
Club.Protocol.P_DROP_MEMBER=  function(data, ret, res) //강제 추방
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];
	var target_uuid= info[2];
	

	Club.Evt.emit("onCheckLeader", data, ret, res,function (err, bCheck)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(bCheck)
		{
			var update= {} ;
			update["u_g_idx_i"] = 0;
			var query = "UPDATE  u_info SET ? WHERE u_idx_i =?;";
			_shard.query_without_trans(bidx, query,[update, target_uuid],function (err, result)
			{
						
				_util_func.sendResult(res, ret);
			});
		}	

	});
}
Club.Protocol.P_MODIFY_CLUB=  function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uuid = info[0];
	var gidx = info[1];
	var desc= info[2];
	//var bound_level= info[3];
	
	Club.Evt.emit("onCheckLeader", data, ret, res,function (err, bCheck)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(bCheck)
		{

			var update= {} ;
			update["g_desc_txt"] = desc;
			var query = "UPDATE  g_info SET ? WHERE u_idx_i =?;";
			_shard.query_without_trans(bidx, query,[update, target_uuid],function (err, result)
			{
				if(err)
				{
					_logger.log({data : data, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
						
				_util_func.sendResult(res, ret);
			});
		}

	});
}
	
// 최초 초기화
Club.init();
