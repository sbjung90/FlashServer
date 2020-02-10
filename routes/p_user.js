/*
 * m_user.js
 * user 와 관련된 프로토콜 처리
 */

// 유저 실행
var EventEmitter = require("events").EventEmitter;
var iap = require('in-app-purchase');
iap.config({

        googlePublicKeyStrSandBox: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjB+Hd5JivvXaCsvkLWKQ3iV83XdQpp00w8GTzp9RgJ2SKzhXgRZfuNkkjxJU2/9u9VTMBYKFnnuwWVnoxTDW45EblOVbcQmrcT6PW/wiZ4f3i8VlpwXQz4k95llCfd4zAe8I+tyJi0n9AfG375M4ORj4GKr4479eZ29oIWZgmSN2oNFSSonN2mQrChmXdIUFYJ1kyAFqIWPFOh46I8dfvXVy7YlBkyTp5SfyaNzOZkMq4Q5rwdSMgGNrgqSb5w87Y+PuRo48qRsKnbGTuXs3kzYBMnss9yl3njawh8lXTqobnBXayeRpbxMamrvUfYnEXjdRpqP1YbZEVhNz1nmGOQIDAQAB",
        googlePublicKeyStrLive: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjB+Hd5JivvXaCsvkLWKQ3iV83XdQpp00w8GTzp9RgJ2SKzhXgRZfuNkkjxJU2/9u9VTMBYKFnnuwWVnoxTDW45EblOVbcQmrcT6PW/wiZ4f3i8VlpwXQz4k95llCfd4zAe8I+tyJi0n9AfG375M4ORj4GKr4479eZ29oIWZgmSN2oNFSSonN2mQrChmXdIUFYJ1kyAFqIWPFOh46I8dfvXVy7YlBkyTp5SfyaNzOZkMq4Q5rwdSMgGNrgqSb5w87Y+PuRo48qRsKnbGTuXs3kzYBMnss9yl3njawh8lXTqobnBXayeRpbxMamrvUfYnEXjdRpqP1YbZEVhNz1nmGOQIDAQAB",
        appleExcludeOldTransactions: true, // if you want to exclude old transaction, set this to true. Default is false
        applePassword: 'ee3a094875b24e868741e70eb9b812d6', // this comes from iTunes Connect (You need this to valiate subscriptions)  

});



exports.run=function(res,data)
{
	User.run(res,data);
}
exports.getObj = function()
{
	return User.Protocol;
}


User ={};
// 프로토콜 별 실행할 함수를 저장할 배열
User.func={};

//객체 생성 이전 초기화작업을 여기서 한다. 
//static init
//전역 적으로한번만 호출되며 .. 파일로드시 적어도 한번은 호출됨 ..
User.init =  function()
{
	// 프로토콜에 함수 대입
	// p로 시작하는 함수가 프로토콜 전용 함수


	
	const theProtoName = "user";
	for (var x in _protocol.protocol[theProtoName])
	{
		
		if(!User.Protocol[x]) 
		{
			console.log(x + "= ERROR");
		}
		User.func[_protocol.protocol[theProtoName][x]] =User.Protocol[x];
	}
	for (var x in User.Protocol)
	{
		if(!_protocol.protocol[theProtoName][x])
		{
			console.log(theProtoName+" ==> " + x + "= BIND error");
		}
	}
	//User.func[1004] = User.Protocol.pPushTest;
	//User.func[1005] = User.Protocol.pIABTest;
	
	_logger.log("User init Call", "info");
}

        


//var data = {}
//_util_func.requestTest("p_user test",data,User);



User.Evt = new EventEmitter();
User.Protocol={}
// 객체생성 시점에서 실행되는것들임 
User.run=function(res, data)
{
	var ret = {cmd : data.cmd, rnd : null, errno : 0};
	
	if(data.cmd != _protocol.protocol["user"]["P_USER_LOGIN"])
	{
		ret['uuid'] = data.info[0];
		_logger.onlineLog(ret['uuid']);
	}
	
	(User.func[data.cmd] == undefined) ? res.end("protocol not found"):User.func[data.cmd](data,ret,res);
}
	

User.Evt.on("OnRegister", function (data, ret,res , callback)
{
	var info = data.info;
	var bidx = data.bidx;
	var uuid = info[0];

	var insert = {};
	insert["u_reg_ts"]  = new Date();
	insert["u_uuid_vc"]  = uuid;
	insert["u_last_login_ts"]  = new Date();
	insert["u_merge_i"]  = _util_func.unixtime();
	var query = "INSERT INTO  u_info SET ?;";
	console.log(insert);
	
	_shard.query_without_trans(bidx, query,[insert],function (err, result)
	{
		if(err)
		{
			callback(err);
			return;
		}
		ret["isNew"] = 1;
		var query = "SELECT * FROM  u_info WHERE u_idx_i=?;";
		_shard.query_without_trans(bidx, query,[result.insertId],function (err, result)
		{
			callback(err, result);				
		});
		

	});
});
User.Protocol.P_USER_GET_VALUE = function (data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx= info[0];
	var key = info[1];
	
	var keyName  =_util.format("h:%d", uidx);
	_rds.hget(Constants.REDIS_SNS,keyName, key, function (err, val)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'redis', _error.ERR_DB);
		}
		ret["value"] = val;

		_util_func.sendResult(res, ret);
	});

}
User.Protocol.P_USER_SET_VALUE = function (data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx= info[0];
	var key = info[1];
	var value= info[2];
	
	var keyName  =_util.format("h:%d", uidx);
	_rds.hset(Constants.REDIS_SNS,keyName, key, value, function (err)
	{
		console.log(err);
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'redis', _error.ERR_DB);
		}

		_util_func.sendResult(res, ret);
	});
}
User.Protocol.P_USER_LOGIN=  function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uuid = info[0];
		
	
	//b-fa a-fa a 게정 초기화
	var query = "SELECT * FROM u_info WHERE u_uuid_vc=?;";
	ret["isNew"] = 0;
	
	_shard.query_without_trans(bidx, query,[uuid],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(result.length == 0 )
		{
			//가입 
			User.Evt.emit("OnRegister", data, ret, res,function (err, results)
			{
				if(err)
				{
					_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
				var row  = results[0];
				_util_func.setRnkey(row["u_idx_i"], function (err, rndkey)
				{
					ret["rnd"] = rndkey;
					ret["info"] = _user_func.makeUserInfo(row);
					_util_func.sendResult(res, ret);
					//_logger.loginLog(row["uuid"],  row["uidx"], row["name"],res.req.ip);
				});
			});
			return;
		}
		var row =result[0];
		_util_func.setRnkey(row["u_idx_i"], function (err, rndkey)
		{
			ret["rnd"] = rndkey;
			ret["info"] = _user_func.makeUserInfo(row);
			_util_func.sendResult(res, ret);
			//_logger.loginLog(row["uuid"],  row["uidx"], row["name"],res.req.ip);
		});
		
	});
	

}
	
User.Protocol.P_USER_SET_NICK_NAME=function (data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx= info[0];
	var nickname= info[1];
	if(!nickname)
	{
		return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
	}
	//b-fa a-fa a 게정 초기화
	nickname = nickname.trim();
	if(!nickname) return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
	var query = "SELECT * FROM u_info WHERE u_name_vc=?;";
	
	_shard.query_without_trans(bidx, query,[nickname],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(result.length > 0 )
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		var update={};
		update.u_name_vc= nickname;
		var query = "UPDATE u_info SET ?  WHERE  u_idx_i=?;";
		_shard.query_without_trans(bidx, query,[update, uidx],function (err, result)
		{
			_util_func.sendResult(res, ret);
			//_logger.loginLog(row["uuid"],  row["uidx"], row["name"],res.req.ip);
		});
		
	});
}
User.Protocol.P_USER_SNS_LOGIN=function (data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var sns = info[0];
	var snsType= info[1];
	
		
	
	//b-fa a-fa a 게정 초기화
	var query = "SELECT * FROM u_info WHERE u_sns_vc=? AND u_sns_ti=?;";
	ret["isNew"] = 0;
	
	_shard.query_without_trans(bidx, query,[sns, snsType],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(result.length == 0 )
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		var row =result[0];
		_util_func.setRnkey(row["u_idx_i"], function (err, rndkey)
		{
			ret["rnd"] = rndkey;
			ret["info"] = _user_func.makeUserInfo(row);
			_util_func.sendResult(res, ret);
			//_logger.loginLog(row["uuid"],  row["uidx"], row["name"],res.req.ip);
		});
		
	});

}
User.Protocol.P_USER_SNS_CONNECT=function (data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var sns = info[1];
	var uuid_vc = info[2];
	var snsType = info[3];
	
	var query = "SELECT * FROM u_info WHERE u_idx_i=?;";
	_shard.query_without_trans(bidx, query,[uidx],function (err, results)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}

		var userInfo = results[0];
		if(userInfo.u_sns_vc &&  userInfo.u_sns_vc != sns)
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_DIFF_FACBOOK);
		}
		if(userInfo.u_sns_vc ) 
		{
			return _util_func.sendResult(res, ret);
		}
			

		var query = "SELECT * FROM u_info WHERE u_sns_vc=? AND u_sns_ti =? ;";
			
		_shard.query_without_trans(bidx, query,[sns,snsType],function (err, results)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			// 
			if(results.length == 0 )
			{
				//가입이다
				var update={};
				update.u_sns_vc = sns;
				update.u_sns_ti= snsType;
				var query = "UPDATE u_info SET ?  WHERE  u_idx_i=?;";
				//update.u_merge_i  = _util_func.unixtime();
				
				_shard.query_without_trans(bidx, query,[update, uidx],function (err, result)
				{
					if(err)
					{
						_logger.log({data : info, err : JSON.stringify(err)}, "error");
						return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
					}
					var query = "SELECT * FROM  u_info WHERE u_idx_i=?;";
					_shard.query_without_trans(bidx, query,[uidx],function (err, results)
					{
						if(err)
						{
							_logger.log({data : info, err : JSON.stringify(err)}, "error");
							return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
						}
						var row  =results[0];
						_util_func.sendResult(res, ret);
							//_logger.loginLog(row["uuid"],  row["uidx"], row["name"],res.req.ip);
					});
				});
			}
			else
			{
				var snsUserInfo =  results[0];
				if(snsUserInfo.u_uuid_vc != userInfo.u_uuid_vc)
				{
					ret["snsUserInfo"]  = snsUserInfo;
					return _util_func.returnError(res, ret, 'db', _error.ERR_DIFF_UUID);
				}
			}
		});
		

		
		
	});
}
//P_USER_ASSET_INFO __PRO {cmd:1004, info:[uuid, uidx, type], bidx=0 } 
//__PRO type:  equip, pet_item, skill_book,stack 
//

User.Protocol.P_USER_SAVE_USER= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var sns = info[1];
	var type= info[2];
	var snsType= info[3];
	
	
	if(type == 1)
	{	
		var query = "SELECT * FROM u_info WHERE u_idx_i=?;";
		_shard.query_without_trans(bidx, query,[uidx],function (err, results)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}

			var uInfo = results[0];
			var query = "UPDATE u_info SET ? WHERE u_idx_i= ? ;";
			
			var update ={};
			update.u_uuid_vc = _util_func.randomInt(1, 99999)+ "__" + uInfo.u_uuid_vc;
			

			_shard.query_with_trans(bidx, query,[update,uidx],function (err, result)
			{
				if(err)
				{
					_logger.log({data : info, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
				var updateObj = {};
				updateObj.u_uuid_vc =  results[0].u_uuid_vc;
				updateObj["u_merge_i"]  = _util_func.unixtime();
				var query = "UPDATE u_info SET ? WHERE u_sns_vc= ? AND u_sns_ti=? ;";
				_shard.query_without_trans(bidx, query,[updateObj, sns, snsType],function (err, result)
				{
					if(err)
					{
						_logger.log({data : info, err : JSON.stringify(err)}, "error");
						return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
					}

					var userInfo = results[0];
					ret["reLogin"] = true;
					_util_func.sendResult(res, ret);
				});
			});
		});
	}
	else
	{
		var query = "SELECT * FROM u_info WHERE u_sns_vc=? AND u_sns_ti=?;";
		_shard.query_without_trans(bidx, query,[sns,snsType],function (err, results)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}

			var uInfo = results[0];
			var query = "UPDATE u_info SET ? WHERE u_sns_vc= ? ;";
			
			var update ={};
			update.u_sns_vc= null;
			update.u_sns_ti= 0;
			

			_shard.query_with_trans(bidx, query,[update,sns],function (err, result)
			{
				if(err)
				{
					_logger.log({data : info, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
				var updateObj = {};
				updateObj.u_sns_vc=  sns;
				updateObj.u_sns_ti= snsType;
				//updateObj["u_merge_i"]  = _util_func.unixtime();
				
				var query = "UPDATE u_info SET ? WHERE u_idx_i= ? ;";
				_shard.query_without_trans(bidx, query,[updateObj, uidx],function (err, result)
				{
					if(err)
					{
						_logger.log({data : info, err : JSON.stringify(err)}, "error");
						return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
					}

					_util_func.sendResult(res, ret);
				});
			});
		});
	}
}

User.Protocol.P_USER_MERGE= function(data, ret, res)
{
	console.log(bidx);
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var userData= info[1]; // Login시주는 로그인데이타이다 
	var lastChangeTime= info[2]; // Login시주는 로그인데이타이다 
	
/*

*/	
	
	var fields = ['u_idx_i', 'u_uuid_vc', 'u_sns_vc', "u_sns_ti",'u_name_vc', 'u_profile_url_txt', 'u_plaform_ti', 'u_star_i', 'u_coin_i', 'u_heart_i', 'u_heart_fill_time_server_dt', 'u_heart_fill_time_client_dt', 'u_unlimit_heart_dur_i', 'u_unlimit_heart_end_server_dt', 'u_unlimit_heart_end_client_dt', 'u_item0_i', 'u_item1_i', 'u_item2_i', 'u_item3_i', 'u_item4_i', 'u_max_stage_i', 'u_spent_i', 'u_reg_ts', 'u_last_login_ts', 'u_update_ts', 'u_is_facebook_logged_in_ti', 'u_facebook_rewarded_ti', 'u_watched_intro_movie_ti', 'u_quest_floor_i', 'u_quest_id_i', 'u_quest_list_jsn_txt', 'u_home_jsn_txt', 'u_side_jsn_txt', 'u_page_gift_name_list_jsn_txt', 'u_story_read_list_jsn_txt', 'u_last_attend_date_i', 'u_day_attend_i', 'u_init_data_ti', 'u_merge_i', 'u_g_idx_i', 'u_gpoint_i', 'u_ghelper_i', 'u_player_data_ver_ti', "u_has_mable_gift_ti"]
	var query = "SELECT * FROM u_info WHERE u_idx_i= ? ;";

	_shard.query_without_trans(bidx, query,[uidx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(userData.u_idx_i != uidx)
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
		}

		var uInfo  = result[0];
		if(uInfo.u_merge_i > lastChangeTime )
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_OLD_DATA);
		}
		var Gap = 200;
		var maxCoin   = (userData['u_max_stage_i'] - uInfo['u_max_stage_i']  ) *Gap
		var gap_coin = userData['u_coin_i'] - uInfo['u_coin_i'] ;
		
		if(gap_coin > maxCoin)
		{
			//return _util_func.returnError(res, ret, 'server11', _error.ERR_PARAMS);
		}

		
		var tempData = {};	
		var keys = Object.keys(uInfo)

		for( var i  = 0 ; i < keys.length; i++)
		{
			var field = keys[i];
			if(userData[field] !== undefined ) tempData[field] = userData[field];
		}
		delete tempData.u_idx_i;
		delete tempData.u_sns_vc;
		delete tempData.u_sns_ti;
		delete tempData.u_uuid_vc;
		userData.u_merge_i = _util_func.unixtime();

		var update = _user_func.makeUserDbInfo(tempData);
		console.log(update, tempData);
		//머지ㄱ록을 남겨야한다. 	
		//최신데이타가 아닙니다
		var query = "UPDATE u_info SET ? WHERE u_idx_i=? AND u_merge_i <= ?";
		
		_shard.query_without_trans(bidx, query,[update , uidx, lastChangeTime],function (err, result)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			
			_util_func.sendResult(res, ret);
			var insert = {};
			insert["lm_u_idx_i"] = uidx;
			insert["lm_data_txt"] = JSON.stringify(update);
			insert["lm_s_data_txt"] = JSON.stringify(uInfo);
			var query = "INSERT INTO l_merge  SET ?; ";
			_shard.query_without_trans(bidx, query,[insert],function (err, result)
			{
				if(err)
				{
					_logger.log({data : info, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
		
			});
		});
		return;
	});
}


User.Protocol.P_USER_ITEM_BUY= function(data, ret, res)
{
}
User.Protocol.P_USER_ADD_ITEM= function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var lastChangeTime= info[1]; // [1,0,0,0,0]
	var items= info[2]; // [1,0,0,0,0]
		
	var fields =[];
	var args =[];
	var checker=[];
	var where=[];
	for(var i = 0 ; i <items.length; i++)
	{
		if(items[i]> 0 )
		{
			fields.push("u_item"+i+"_i=u_item"+i+"_i+?");
			where.push("u_item"+i+"_i >=?");
			args.push(items[i]);
			checker.push(items[i]);
		}
		
		
	}
	
	
	var query = "UPDATE u_info SET "+fields.join(",")+ "   WHERE u_idx_i= ? AND " +where.join(" AND ") +"  ;";

	args.push(uidx);
	args  = args.concat(checker);
	_shard.query_without_trans(bidx, query,args,function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}

		var uInfo  = result[0];
		if(uInfo.u_merge_i > lastChangeTime )
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_OLD_DATA);
		}
		delete userData.u_idx_i;
		//최신데이타가 아닙니다
		var query = "UPDAET u_info SET ? WHERE u_idx_i=? AND u_merge_i <= ?";
		_shard.query_without_trans(bidx, query,[userData, uidx, lastChangeTimek],function (err, result)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			_util_func.sendResult(res, ret);
		});
		return;
	});
}
//이후 ㄹ모든 데이터는 로그인 => merge 과정을 겇야합니다.   그걸 판단하는기준은 u_merge_i
//랜드키가 없는경우 이는 로그인 이아니라 본다
//랟느키가있는경우에는 머지라는과정으로 바로간다. 머지성공이거나. 랜ㅌ드키가 서버저장값ㅇ하고같으면. 현재 인정된 클라이언트이다. 

//ret=>mreg_i값을 업데이트해줌. 
User.Protocol.P_USER_USE_ITEM = function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var lastChangeTime= info[1]; // [1,0,0,0,0]
	var items= info[2]; // [1,0,0,0,0]
		
	
	
	var fields =[];
	var args =[];
	var checker=[];
	var where=[];
	for(var i = 0 ; i <items.length; i++)
	{
		if(items[i]> 0 )
		{
			fields.push("u_item"+i+"_i=u_item"+i+"_i-?");
			where.push("u_item"+i+"_i >=?");
			args.push(items[i]);
			checker.push(items[i]);
		}
		
		
	}
	
	
	var query = "UPDATE u_info SET "+fields.join(",")+ "   WHERE u_idx_i= ? AND " +where.join(" AND ") +"  ;";

	args.push(uidx);
	args  = args.concat(checker);
	_shard.query_without_trans(bidx, query,args,function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}

		var uInfo  = result[0];
		if(uInfo.u_merge_i > lastChangeTime )
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_OLD_DATA);
		}
		delete userData.u_idx_i;
		//최신데이타가 아닙니다
		var query = "UPDAET u_info SET ? WHERE u_idx_i=? AND u_merge_i <= ?";
		_shard.query_without_trans(bidx, query,[userData, uidx,lastChangeTime],function (err, result)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			_util_func.sendResult(res, ret);
		});
		return;
	});
}
//P_USER_REGISTER __PRO {cmd:1001, info:[uuid] }
User.Protocol.P_USER_PING=  function(data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var userData= info[1]; // Login시주는 로그인데이타이다 
	var lastChangeTime= info[2]; // Login시주는 로그인데이타이다 
	
	
	
	var query = "SELECT * FROM u_info WHERE u_idx_i= ? ;";
	_shard.query_without_trans(bidx, query,[uidx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}

		var uInfo  = result[0];
		if(uInfo.u_merge_i > lastChangeTime )
		{
			return _util_func.returnError(res, ret, 'db', _error.ERR_OLD_DATA);
		}
		delete userData.u_idx_i;
		//최신데이타가 아닙니다
		var query = "UPDAET u_info SET ? WHERE u_idx_i=? AND u_merge_i <= ?";
		_shard.query_without_trans(bidx, query,[userData, uidx, lastChangeTime],function (err, result)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			_util_func.sendResult(res, ret);
		});
		return;
	});
}
User.Protocol.P_USER_CAL_UPDT =function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uidx= info[1];

	if ( uuid == undefined || uidx == undefined )
	{
		return _util_func.returnError(res, ret, 'server', _error.ERR_PARAMS);
	}
	var query = "SELECT * FROM u_info WHERE u_idx_i= ? ;";
	_shard.query_without_trans(bidx, query,[uidx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		var update ={};
		var leftTime  = _util_func.unixtime()- 	user_info["u_last_haert_check_i"];

		if(user_info["u_heart_i"] > 0 )
		{
			var time  = 30 * 60;
			var addTimeCnt = parseInt(leftTime / time );
			console.log(subTimeCnt, addPointInfo)
			update["u_heart_i"] = user_info["u_heart_i"] + addTimeCnt;
			update["u_last_haert_check_i"] = user_info["u_last_haert_check_i"]+(subTimeCnt* addPointInfo.m_nrefreshtime);
			if(update["u_last_haert_check_i"] < 0 )
			{
				update["u_heart_i"] = 0;
				update["u_last_haert_check_i"] = _util_func.unixtime();
			}
			//cnt * addPointInfo.m_nrefreshtime;
		}
		else
		{
			update["u_heart_i"] = 0;
			update["u_last_haert_check_i"] = _util_func.unixtime();
		}
		var args = [];
		var query= "UPDATE u_info SET u_heart_i= ? ,u_last_haert_check_i = ? WHERE u_idx_i=?;"; 
		query += "SELECT * FROM u_info WHERE u_idx_i=?;";
		args.push(update["u_heart_i"]);
		args.push(update["u_last_haert_check_i"]);
		args.push(uidx);
		args.push(uidx);
		_shard.query_with_trans(bidx, query, args, function (err,results)	
		{
			if(err)
			{
				_logger.log({data : data, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			ret["user_info"] =results[1][0];
			_util_func.sendResult(res, ret);

		});
	});

}
User.Protocol.P_IAP_PAYLOAD=function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uidx= info[0];
	var market_ti= info[1];
	var code= info[2];
	var price= info[3];

	if ( market_ti == undefined || uidx == undefined  || code == undefined || price == undefined)
	{
		return _util_func.returnError(res, ret, 'server', _error.ERR_PARAMS);
	}
	var insert = {};
	insert['p_u_idx_i'] = uidx;
	insert['p_market_ti'] = market_ti;
	insert['p_code_vc'] = code;
	insert['p_price_i'] =price;
	var query = "INSERT INTO p_info SET ?;";
	var rData =[];
		
	_shard.query_without_trans(bidx, query,[insert],function (err, result)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		rData.push(uidx);
		rData.push(market_ti);
		rData.push(code);
		rData.push(price);
		rData.push(result.insertId);
		ret["payLoad"] = _util_func.base64_encode(JSON.stringify(rData));
		_util_func.sendResult(res, ret);

		
	});
	
	
}
User.Evt.on("OnGoogle", function (data, ret, res)
{

	var info = data.info;
	var bidx= data.bidx;
	
	var uidx= info[0];
	var market_ti= info[1];
	var code= info[2];
	var price= info[3];
	var payLoad= info[4];
	var purchaseId= info[5];
	var receipt= info[6];
	iap.setup().then(function ()
	{
		var deReceipt = _util_func.base64_decode(receipt);
		console.log(deReceipt);


		iap.validate(deReceipt).then(function (validate)
		{
		    var options = {
			ignoreCanceled: true, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
			ignoreExpired: true // purchaseData will NOT contain exipired subscription items
		    };	
		console.log(validate);
		    var purchaseData = iap.getPurchaseData(validate, options);
			var nData = purchaseData[0];
			if(!nData.status)
			{
				nData.orderId		
				nData.productId
				var retData =null;
				try
				{	
					var retDataObj = JSON.parse(validate.developerPayload);
					var payLoadchecker = _util_func.base64_decode(retDataObj.developerPayload.trim());
					if(payLoad != payLoadchecker)
					{
						return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
					}
					retData = JSON.parse(_util_func.base64_decode(payLoadchecker));
					
				}
				catch(e)
				{
					_logger.log(e.toString())
					return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
				}
				if(retData[0]  != uidx  ||  market_ti != retData[1] || code != retData[2] )
				{
					console.log("rdate ..error");
					return;  
				}
				var update ={};	
				update["p_purchase_vc"] = purchaseId;
				update["p_receipt_txt"] = receipt;
				update["p_status_ti"] = 1;
				var query = "UPDATE p_info SET ? WHERE p_u_idx_i= ? AND p_idx_i=? AND p_status_ti = 0  ";	
				_shard.query_with_trans(bidx, query,[update, uidx, retData[4]],function (err, result)
				{
					if(err)
					{
						_logger.log({data : info, err : JSON.stringify(err)}, "error");
						return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
					}
					ret["check"] = true;
					_util_func.sendResult(res, ret);

					
				});
			}
		}).catch(function (e)
		{
			console.log(e);
		});
	});
});
User.Evt.on("OnApple", function (data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	
	var uidx= info[0];
	var market_ti= info[1];
	var code= info[2];
	var price= info[3];
	var payLoad= info[4];
	var purchaseId= info[5];
	var receipt= info[6];

	iap.setup().then(function ()
	{
		var deReceipt = _util_func.base64_decode(receipt);
		iap.validate(deReceipt).then(function (validate)
		{
		    var options = {
			ignoreCanceled: true, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
			ignoreExpired: true // purchaseData will NOT contain exipired subscription items
		    };	
		    var purchaseData = iap.getPurchaseData(validate, options);
			var nData = purchaseData[0];
			if(!validate.status)
			{
				var retData =null;
				try
				{	
					//console.log("validate",validate,"purchaseData",  purchaseData, "-wwwwwwwwwwwwwwwwwww")
					//console.log("inapp",validate.receipt,"purchaseData",  purchaseData, "-wwwwwwwwwwwwwwwwwww")
					if(validate.receipt.in_app[0].transaction_id != purchaseId|| nData.transactionId!=  purchaseId)
					{
						return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
					}
					//console.log(payLoad,"xxx-----");
					var retData= JSON.parse(_util_func.base64_decode(payLoad));
					console.log(retData,"xxx-----ret ");
					
				}
				catch(e)
				{
					_logger.log({data : data, err : _error.ERR_DB}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
				}

				if(retData[0]  != uidx  ||  market_ti != retData[1] || code != retData[2] )
				{
					console.log("rdate ..error");
					return;  
				}
				

				var args  =  [ update, retData[2], retData[1], retData[0],nData.productId ]
				ret["p_idx"] = retData[2];
				var update ={};	
				update["p_purchase_vc"] = purchaseId;
				update["p_receipt_txt"] = receipt;
				update["p_status_ti"] = 1;
				var query = "UPDATE p_info SET ? WHERE p_u_idx_i= ? AND p_idx_i=? AND p_status_ti = 0  ";	
				_shard.query_with_trans(bidx, query,[update, uidx, retData[4]],function (err, result)
				{
					if(err)
					{
						_logger.log({data : info, err : JSON.stringify(err)}, "error");
						return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
					}
					ret["check"] = true;
					_util_func.sendResult(res, ret);

					
				});
			}
			else
			{
				return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
			}
		}).catch(function (err)
		{
			console.log(err, "catch...");
			return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
		});
		
	}).catch(function (err)
	{
		return _util_func.returnError(res, ret, 'db', _error.ERR_PARAMS);
	});
});
User.Protocol.P_IAP_CONFIRM=function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	

	var uidx= info[0];
	var market_ti= info[1];
	var code= info[2];
	var price= info[3];
	var payLoad= info[4];
	var purchaseId= info[5];
	var receipt= info[6];
	if ( market_ti == undefined || uidx == undefined  || code == undefined || price == undefined)
	{
		return _util_func.returnError(res, ret, 'server', _error.ERR_PARAMS);
	}
	if(market_ti == _cnf["game"]["marketType"].ANDROID)
	{
		User.Evt.emit("OnGoogle", data, ret, res);
	}
	else if(market_ti == _cnf["game"]["marketType"].APPLE)
	{
		User.Evt.emit("OnApple", data, ret, res);
	}

	
}
User.Protocol.P_IAP_TEST=function(data, ret, res)
{
	var info = data.info;
	var bidx= data.bidx;
	

	var uidx= info[0];
	var query = "SELECT * FROM u_info WHERE u_idx_i=?;";

	ret["isNew"] = 0;
	
	_shard.query_without_trans(bidx, query,[uidx],function (err, result)
	{
		if(err)
		{
			_logger.log({data : data, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		_util_func.sendResult(res, ret);
	});

	
}
User.Protocol.P_USER_SNS_DISCONNECT=function (data, ret, res)
{
	var info = data.info;
	var bidx = data.bidx;
	var uidx = info[0];
	var sns = info[1];
	var snsType = info[2];
	
	if ( sns== undefined || uidx == undefined  || snsType== undefined )
	{
		return _util_func.returnError(res, ret, 'server', _error.ERR_PARAMS);
	}
	var query = "SELECT * FROM u_info WHERE u_idx_i=? AND u_sns_vc=? AND u_sns_ti=?;";
	_shard.query_without_trans(bidx, query,[uidx, sns,snsType],function (err, results)
	{
		if(err)
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
		}
		if(results.length == 0 )
		{
			_logger.log({data : info, err : JSON.stringify(err)}, "error");
			return _util_func.returnError(res, ret, 'db', _error.ERR_DIFF_FACBOOK);
		}

		var userInfo = results[0];
			

		var update={};
		update.u_sns_vc =null; 
		update.u_sns_ti= 0;
		var query = "UPDATE u_info SET ?  WHERE  u_idx_i=?;";
		//update.u_merge_i  = _util_func.unixtime();
		
		_shard.query_without_trans(bidx, query,[update, uidx],function (err, result)
		{
			if(err)
			{
				_logger.log({data : info, err : JSON.stringify(err)}, "error");
				return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
			}
			var query = "SELECT * FROM  u_info WHERE u_idx_i=?;";
			_shard.query_without_trans(bidx, query,[uidx],function (err, results)
			{
				if(err)
				{
					_logger.log({data : info, err : JSON.stringify(err)}, "error");
					return _util_func.returnError(res, ret, 'db', _error.ERR_DB);
				}
					
				ret["user_info"] =results[0];
				_util_func.sendResult(res, ret);
					//_logger.loginLog(row["uuid"],  row["uidx"], row["name"],res.req.ip);
			});
		});
	});
		

		
		
}
setTimeout (function ()
{
	//res={};
	//res.end = function (data)
	//{	
	//	console.log(data);
	//}
	//ret= {}
	//var data = {"cmd":1005, "info": [1, { u_idx_i: 1, u_uuid_vc: '', u_facebook_vc: '1111', u_plaform_ti: 0, u_device_token_vc: null, u_star_i: 0, u_coin_i: 0, u_heart_i: 3, u_unlimit_heart_dur_i: 0, u_unlimit_heart_end_dt: null, u_item0_i: 3, u_item1_i: 4, u_item2_i: 3, u_item3_i: 3, u_item4_i: -1, u_max_stage_i: 1, u_spent_i: 0, u_reg_ts: null, u_last_login_ts: null, u_update_ts: '2019-06-07 02:46:15', u_free_roulette_ts: null, u_fb_rewarded_ti: 0, u_webuser_jsn_txt: null, u_quest_id_i: 1, u_home_jsn_txt: null, u_side_jsn_txt: null, u_page_gift_name_list_jsn_txt: null, u_story_read_list_jsn_txt: null, u_prgs_point_i: 0, u_last_attend_dt: null, u_day_attend_i: 0, u_merge_iw: _util_func.unixtime() } , 1560393775] , "bidx":0}
	//User.run(res, data);
}, 1000)

// 최초 초기화
User.init();
