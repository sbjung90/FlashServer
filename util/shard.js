var mysql= require('mysql');
//var poolCluster = mysql.createPoolCluster({defaultSelector:'ORDER'});
// loginMaster , servero0, server1, sever2
var shard = module.exports ={};
var _pools=[]; //static init 
function __init()
{
	_logger.log("sharding init Call", "info");
	//_pools.master = mysql.createPool(_masterInfo);
	_pools.loginMaster= mysql.createPool(global._shardMaster);
	for( var i = 0 ; i < _db_info.length; i++)
	{
		_pools.push(mysql.createPool(_db_info[i]));
	}
}
__init();
function checkPool()
{
        _logger.log("#################################### TRANS Login");
        _logger.log(" _allConnections :" + _pools.loginMaster._allConnections.length );
        _logger.log(" _freeConnections:" + _pools.loginMaster._freeConnections.length);
        _logger.log(" _connectionQueue:" + _pools.loginMaster._connectionQueue.length );
        _logger.log("#################################### TRANS 0");
        _logger.log(" _allConnections :" + _pools[0]._allConnections.length );
        _logger.log(" _freeConnections:" + _pools[0]._freeConnections.length);
        _logger.log(" _connectionQueue:" + _pools[0]._connectionQueue.length );
        setTimeout(checkPool, 10000);
}
//checkPool();

function __parseResult(result)
{
	if(!result)
		return null;
		
	//if(result.length == 0)
	//	return null;
	

	if(!Array.isArray(result[0]))
	{
		return result;
	}
	var newResult = [];
	for(var i = 0; i < result.length; i++)
	{
		if(result[i]['fieldCount'] == null && result[i]['affectedRows'] == null)
		{
			if(Array.isArray(result[i]) && result[i].length == 1)
			{
				newResult.push(result[i]);
			}
			else if(result[i].length == 0)
			{
				newResult.push(null);
			}
			else
			{
				newResult.push(result[i]);
			}
		}
	}
	//console.log(newResult);
	return newResult;
}

shard.query = function(strQuery, args, endFunc)
{
	var sCnt  = _pools.length;
	var results =[];
	for ( var i = 0; i < _pools.length; i++)
	{
		_pools[i].getConnection( function (_err, _con)
		{	
			if(_err)
			{
				_con.release();
				//TODO error 
				endFunc(_err, null);
				return;
			}
			_con.query(strQuery, args, function (err, result)
			{
				sCnt -- ;	
				_con.release();
				if(err)
				{
					endFunc(_err, null);
					return;
				}
				//console.log(_con._pool.config );
				//console.log(result);
				results.push(result);
				if(sCnt == 0 )
				{
					var return_array = [];
					for(var index in results)
					{
						// console.log(results[index]);
						if(results[index].length > 0)
							return_array = return_array.concat(results[index]);
					}
					// console.log(return_array);
					if(return_array.length == 0)
						return_array = null;
					endFunc(err, return_array);
				}
			});
		});
	}
};
shard.getUidxByKakao = function (uidx, func)
{
	_pools.loginMaster.getConnection( function (_err, _con)
	{
		if(_err)
		{
			_err['errno'] = -1001;
			_con.release();
			func(_err, null);
		}
		else
		{
			_con.query("SELECT * FROM u_login_master WHERE ulm_kakao_bi =?;",[uidx],function (err, result)
			{
				_con.release();
				if(err || result == null)
				{
					err['errno'] = -1001;
					func(err, null);
				}
				else
				{
					func(null, result);
				}
			});
		}
	});
};

shard.setMasterUserJoin = function (kakaoIdx, serverIdx, func)
{
	_pools.loginMaster.getConnection( function (_err, _con)
	{
		if(_err)
		{
			_err = {};
			_err['errno'] = -1001;
			_con.release();
			func(_err, null);
		}
		else
		{
			_con.query("CALL set_user_join_master_info(?,?);",[kakaoIdx, serverIdx],function (err, result)
			{
				_con.release();
				if(err || result == null)
				{
					err['errno'] = -1001;
					func(err, null);
				}
				else if(result[0][0]['errno'])
				{
					err['errno'] = result[0][0]['errno'];
					func(err, null);
				}
				else
				{
					func(null, result);
				}
			});
		}
	});
};

shard.query_master = function(strQuery, args, func)
{
	_logger.log('strQuery : ' + strQuery);
	_logger.log('args : ' + args);
	_pools.loginMaster.getConnection( function (err,  con)
	{
		con.query(strQuery, args, function (err, result)
		{
			con.release();
			if(err || result == null)
			{
				err['errno'] = -1001;
			}
			else
			{
				////result = __parseResult(result);
				for(var i in result)
				{
					if(result[i] && result[i]['errno'])
					{
						err = {};
						err['errno'] = result[i]['errno'];
						break;
					}
				}
			}
			
			func(err, result);
		});
	});
};

shard.getInfoByUidx=function (uuidx, func)
{
	_pools.loginMaster.getConnection( function (_err, _con)
	{
		if(_err)
		{
			_con.release();
			func(_err, null);
			return;
		}
		_con.query("SELECT * FROM u_login_master WHERE ulm_idx_i =?;",[uuidx],function (err, result)
		{
			_con.release();
			if(err || result == null || result.length == 0)
			{
				err['errno'] = -1001;
			}
			func(err, result);
		});
	});
}
shard.query_with_master = function (uuidx, strQuery, args, func)
{
	_pools.loginMaster.getConnection( function (_err, _con)
	{
		if(_err)
		{
			_con.release();
			func(_err, null);
		}
		else
		{
			_con.query("SELECT * FROM u_login_master WHERE ulm_idx_i =?;",[uuidx],function (err, result)
			{
				_con.release();
				if(err || result == null || result.length == 0)
				{
					err['errno'] = -1001;
					func(err, null);
				}
				else
				{
					var idx = parseInt(result[0]["ulm_rs_idx_si"]);
					_pools[idx-1].getConnection( function (err,  con)
					{
						con.query(strQuery, args, function (err, result)
						{
							con.release();
							func(err,result);
						});
					});
				}
			});
		}
	});
};

shard.query_with_trans = function (bidx, strQuery, args, func, noCheckAffectedRows)
{
	_logger.log('bidx : ' + bidx, "info");
	_logger.log('strQuery : ' + strQuery, "info");
	_logger.log('args : ' + args, "info");
	_pools[bidx].getConnection( function (err,  con)
	{
		con.query("START TRANSACTION;", function(err, result)
		{
			con.query(strQuery, args, function (err, result)
			{
				if(err || result == null)
				{
					if(!err) err={};
					err['errno'] = -1001;
				}
				else
				{
					if (!Array.isArray(result ))
					{
						if(!noCheckAffectedRows && result["affectedRows"] === 0 )
						{
							err = {};
							err['errno'] = -1348;
						}
					}
					else
					{
						for(var i = 0; i < result.length; i++)
						{
							if(result[i]['errno'])
							{
								err = {};
								err['errno'] = result[i]['errno'];
								break;
							}
							if (!noCheckAffectedRows && result[i]['affectedRows'] !== undefined && result[i]['affectedRows'] == 0)
							{
								err = {};
								err['errno'] = -1348;
								break;
							}
						}
					}
				}
				
				
				if(err && err['errno'])
				{
					con.query("ROLLBACK;", function(err2, result2)
					{
						con.release();
						func(err,null);
					});
				}
				else
				{
					con.query("COMMIT;", function(err2, result2)
					{
						con.release();
						func(err,result);
					});
				}
				
			});

		});
	});
};

shard.query_without_trans = function (bidx, strQuery, args, func)
{
	_logger.log('bidx : ' + bidx, "info");
	_logger.log('strQuery : ' + strQuery, "info");
	_logger.log('args : ' + args, "info");

	_pools[bidx].getConnection( function (err,  con)
	{
		if(err)
		{
			con.release();
			func(err);
			return;
		}
		con.query(strQuery, args, function (err, result)
		{
			con.release();
			
			if(err || result == null)
			{
				err['errno'] = -1001;
			}
			else
			{
				for(var i in result)
				{
					if(result[i] && result[i]['errno'])
					{
						err = {};
						err['errno'] = result[i]['errno'];
						break;
					}
				}
			}
			
			func(err, result);
		});
	});
};
shard.callProcByNum=function(bidx, proc, num, args, func)
{
	
	//TODO  num은 받을 필요가 없으나. 혹시나하는 에러 상황에 대비
		//var _args = new Array(args.length);
	var _args = new Array(num);
	for(var i= 0  ; i < num ; i++)
	{
		_args.push("?");			
	}
	var strProc= proc+"("+_args.join(",")+");";
				
	shard.query_without_trans(bidx,"CALL "+strProc, args, func);
};
shard.callProc=function(bidx, proc,  args, func)
{
	shard.callProc(bidx, proc, args.length, args, func);	
};
