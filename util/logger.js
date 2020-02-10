var winston = require('winston');
var fs= require('fs');
var EventEmitter= require('events').EventEmitter;

var logEvent = new EventEmitter();
logEvent.on("asset", function (title,ltype,type,  before,after,uidx,kakao_id,kuid,  callback)
{
	var insert ={};
	insert.la_title_vc= title;
	insert.la_ltype_ti= ltype;
	insert.la_kakao_bi= kakao_id;
	insert.la_kuid_bi= kuid;
	insert.la_type_ti= type
	insert.la_ul_idx_i= uidx;
	insert.la_before_i= before;
	insert.la_after_i= after;
	insert.la_server_i= global._serverId;
	_shard.query_master("INSERT INTO l_asset SET ?", [insert], function (err, result)
	{
		if(callback)callback(err,result);
	});
});
//강화로그
logEvent.on("itemStrength", function (msg,idx, itemid,matidx,  before, after,suc,  uidx,kakaoid,  kuid, callback)
{
	var insert= {};	
	insert.li_ul_idx_i=uidx;
	insert.li_kuid_bi =kuid;
	insert.li_ui_idx_bi=idx;
	insert.li_itemid_i=itemid;
	insert.li_before_level_i=before;
	insert.li_after_level_i=after;
	insert.li_kakao_bi=kakaoid;
	insert.li_material_ui_idx_bi=matidx;
	insert.li_success_ti=suc;
	insert.li_msg_vc =msg;
	_shard.query_master("INSERT INTO l_item SET ?", [insert], function (err, result)
	{
		if(callback)callback(err,result);
	});
		
});
logEvent.on("unitStrength", function (msg,idx, unitid,matidx, before, after,suc,  uidx,kakaoid,  kuid, callback)
{
	var insert= {};	
	insert.lu_ul_idx_i=uidx;
	insert.lu_kuid_bi =kuid;
	insert.lu_uu_idx_bi=idx;
	insert.lu_unitid_i=unitid;
	insert.lu_before_level_i=before;
	insert.lu_after_level_i=after;
	insert.lu_kakao_bi=kakaoid;
	insert.lu_success_ti=suc;
	insert.lu_material_uu_idx_bi=matidx;
	insert.lu_msg_vc =msg;
	console.log(JSON.stringify(insert));
	_shard.query_master("INSERT INTO l_unit SET ?", [insert], function (err, result)
	{
		console.log(err);
		if(callback)callback(err,result);
	});
		
});
//---------------end 강화로그
logEvent.on("game", function (title,ltype, type, before, after,  uidx, kkuid,  callback)
{
	console.log("game");
});
logEvent.on("loginLog", function(kunId,uuid, user_name, user_ip)
{
	var cTime = _util_func.chinaunixtime();
	var logInfo = [kunId, uuid, user_name,user_ip ,cTime,_pid, _serverId];
	var dt= _util_func.dateFormat(new Date(cTime*1000), "%Y%m%d");		
	var dm= _util_func.dateFormat(new Date(cTime*1000), "%Y%m");		
	var fNames=["login",_pid, _serverId, dt];
	var fileName =_klogDir+"/"+fNames.join("_")+".log";
	fs.writeFile(fileName, logInfo.join("\t")+"\n", {flag:"a+"}   ,function (err)
	{
		if(err) console.log(err);
	});
	
	
	
	
		
});
logEvent.on("activeLog", function(kunId,cid, user_name, user_ip)
{
	var cTime = _util_func.chinaunixtime();
	var logInfo = [kunId, cid, user_name,user_ip ,cTime ,_pid, _serverId];
	var dt= _util_func.dateFormat(new Date(cTime* 1000), "%Y%m%d");		
	var dm= _util_func.dateFormat(new Date(cTime*1000), "%Y%m");		
	var fNames=["active",_pid, _serverId, dt];
	var fileName =_klogDir+"/"+fNames.join("_")+".log";
	console.log(fileName);
	fs.writeFile(fileName, logInfo.join("\t")+"\n", {flag:"a+"}   ,function (err)
	{
		if(err) console.log(err);
	});
	
});
logEvent.on("cashLog", function(kunId,uuid, amount, goodsid, goodstype, goodsnum)
{
	if(amount == 0 )
	{
		console.log(new Error());
	}
	var cTime = _util_func.chinaunixtime();
	var mTime = (new Date()).getTime() + "|"+_serverId +"|"+goodsid;
	var logInfo = [_pid, _serverId, kunId, uuid, amount,goodsid,goodsnum,cTime, mTime  ];
	var dt= _util_func.dateFormat(new Date(cTime*1000), "%Y%m%d");		
	var dm= _util_func.dateFormat(new Date(cTime*1000), "%Y%m");		
	//propsused_pid_rid_yyyymmdd.log
	var fNames=["propsused",_pid, _serverId, dt];
	var fileName =_klogDir+"/"+dm+"/"+fNames.join("_")+".log";
	fs.writeFile(fileName, logInfo.join("\t")+"\n", {flag:"a+"}   ,function (err)
	{
		if(err) console.log(err);
	});
	
});
logEvent.on("onlineLog", function(uuid)
{
	var cTime = _util_func.chinaunixtime();
	_rds.hset(Constants.REDIS_ONLINE, "online"+_serverId,  uuid,  cTime , function (err, result)
	{
		if(err) console.log(err);
	});
	
});
var __logger = {
	debug : null,
	info : null,
	warning : null,
	error : null,
	game : null,
	
	init : function()
	{
		// log folder가 없으면 폴더 생성
		{
			var fs = require('fs');
			var _ret = fs.readdirSync('./');
			var _is = false;
			for(var i in _ret)
			{
				if(_ret[i] == 'log')
				{
					_is = true;
					break;
				}
			}
			
			if(!_is)
			{
				fs.mkdir('./log', 0777);
			}
			delete fs;
		}
	
		if(this.debug == null)
		{
			this.debug = new winston.Logger(
			{
				transports: [
				new winston.transports.Console(
				{
					colorize : true,
					level      : "debug"
				}),
				new winston.transports.DailyRotateFile(
				{
					timestamp	: true,
					datePattern : ".yyyyMMdd",
					level		: "debug",
					json		: true,
					filename	: "./log/debug.log",
				})]
			});
			
			this.debug.setLevels(winston.config.syslog.levels);
			this.debug.exitOnError = false;
		}
		
		if(this.info == null)
		{
			this.info = new winston.Logger(
			{
				transports: [
				new winston.transports.Console(
				{
					colorize : true,
					level      : "info"
				}),
				new winston.transports.DailyRotateFile(
				{
					timestamp	: true,
					datePattern : ".yyyyMMdd",
					level		: "info",
					json		: true,
					filename	: "./log/info.log",
				})]
			});
			
			this.info.setLevels(winston.config.syslog.levels);
			this.info.exitOnError = false;
		}
		
		if(this.warning == null)
		{
			this.warning = new winston.Logger(
			{
				transports: [
				new winston.transports.Console(
				{
					colorize : true,
					level      : "warning"
				}),
				new winston.transports.DailyRotateFile(
				{
					timestamp	: true,
					datePattern : ".yyyyMMdd",
					level		: "warning",
					json		: true,
					filename	: "./log/warning.log",
				})]
			});
			
			this.warning.setLevels(winston.config.syslog.levels);
			this.warning.exitOnError = false;
		}
		
		if(this.error == null)
		{
			this.error = new winston.Logger(
			{
				transports: [
				new winston.transports.Console(
				{
					colorize : true,
					level      : "error"
				}),
				new winston.transports.DailyRotateFile(
				{
					timestamp	: true,
					datePattern : ".yyyyMMdd",
					level		: "error",
					json		: true,
					filename	: "./log/error.log",
				})]
			});
			
			this.error.setLevels(winston.config.syslog.levels);
			this.error.exitOnError = false;
		}
		
		if(this.game == null)
		{
			this.game = new winston.Logger(
			{
				transports: [					
				new winston.transports.File(
				{
					timestamp	: true,
					datePattern : ".yyyyMMdd",
					level		: "info",
					json		: true,
					filename	: "./log/game.log",
				})]
			});			
			
			this.debug.setLevels(winston.config.syslog.levels);
			this.debug.exitOnError = false;
		}
	},
	
	log : function(log_string, level)
	{
		if(level == null || level == undefined)
			level = "info";

		var message = {
			log : log_string
		};
		
		if(level == 'warning' || level == 'error')
		{
			var e = new Error();
			message = {
				filename : e.stack.split('\n')[2].split('at ')[1].split(':')[0],
				line : e.stack.split('\n')[2].split('at ')[1].split(':')[1],
				log : log_string
			};
			delete e;
		}
		
		if(!this[level])
		{
			this.error.error(level + ' logger has not');
		}
		else if(level === "game")
		{
			this[level]["info"](message);
		}
		else
		{	
			this[level][level](message);
		}
	},
	//assetLog($title, $lType,$type, $before, $after, $serverId, $uidx, $kkuid) 
	assetLog: logEvent.emit.bind(logEvent, "asset"),
	gameLog	: logEvent.emit.bind(logEvent, "game"),
	//logEvent.on("loginLog", function(kunId,uuid, user_name, user_ip)
	loginLog: logEvent.emit.bind(logEvent, "loginLog"),
	activeLog: logEvent.emit.bind(logEvent, "activeLog"),
	cashLog: logEvent.emit.bind(logEvent, "cashLog"),
	onlineLog: logEvent.emit.bind(logEvent, "onlineLog"),
	itemStrength: logEvent.emit.bind(logEvent, "itemStrength"),
	unitStrength: logEvent.emit.bind(logEvent, "unitStrength"),
};

__logger.init();

module.exports = __logger;
