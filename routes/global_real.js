global._serverId = 1;
global.DEV_SERVER = false;

//node--core library
global._util= require('util');

global._util_func = require('./../util/util_func');
global._user_func = require('./../util/user_funcs');
global._logger = require('./../util/logger');

global._fs = require('fs');
global._async = require('async');
global._crypto = require('crypto');
global._http_request = require('request');
global._protocol = require('./../cnf/protocol');
global._error = require('./../cnf/error');
global._cnf= {};

global._cnf["game"] = require('./../cnf/game');



global._shardMaster= {
		host:"ip-172-31-28-65.ap-northeast-2.compute.internal",
		user : "flashdev",
		password : "roqkftjqj!",
		database : "secrethouse",
		connectionLimit : 10,
		multipleStatements : true,
		bigNumberStrings:true, 
		dateStrings:true, 
	};
global._db_info= [
		{
		host:"ip-172-31-28-65.ap-northeast-2.compute.internal",
		user : "flashdev",
		password : "roqkftjqj!",
		database : "secrethouse",
		connectionLimit : 10,
		multipleStatements : true,
		dateStrings:true, 
		bigNumberStrings:true, 
		} ]
global._redisInfo = {
		host     : 'ip-172-31-18-103.ap-northeast-2.compute.internal',
		port 		: 6379,
		auth: "roqkftjqj",
		connectionLimit : 10,
		socket_nodelay : true
//  waitForConnections : false,
	};

global._shard = require('./../util/shard');

global._user = require('./p_user');
global._message= require('./p_message');
global._team = require('./p_club');




global.Constants = {
	REDIS_DB :0,
	REDIS_SLAVE_DB :1,
	REDIS_ONLINE:2,
	REDIS_SNS:8,
	REDIS_RNDKEY:1,
	MAssetLogType: {
		INVITE:1,
		SELTTLE:2,
		GAME:3,
		ITEM:4,
		GACHA:5,
		MAIL:6,
	},
	
	AssetLogType:{
		CASH:1,
		GOLD:2,
		HEART:3,
		UNIT:4,
		ITEM:5,
		STAMP:6,
		INF_STAMP:7,
		RAID_STAMP:8,
	},
	CashItemType: {
		ASSET:1,
		UNIT:2,
		ITEM:3,
		STRLEN:4,
	},
	MsgType: {
		NORMAL: 1 ,
		TICKET_ADV: 2 ,
		TICKET_INF : 3,
		TICKET_VS  : 4,
		TICKET_RAID: 5 ,
		GOLD  : 6,
		HEART : 7,
		CASH  : 8,
		GATCHA_ACTOR : 9,
		GATCHA_ITEM : 10,
		ITEM  : 11,
		UNIT  : 12,
	},
		
}
//XXX 
global._rds= require('./../util/redisUtil');
//user redis tool

