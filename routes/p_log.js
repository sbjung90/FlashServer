/*
 * p_log.js
 */

exports.run=function(res,data)
{
	new Log(res,data);
}

function Log(res,data)
{
	this.run(res, data);
}

Log.func={};
 
//static init
Log.init =  function()
{
	Log.func[_protocol.protocol["log"]["P_LOG_DUMP"]] = Log.prototype.pDumpLog;
	Log.func[_protocol.protocol["log"]["P_BETATEST_LOG"]] = Log.prototype.pGameLog;	
	
	_logger.log("Log init Call", "info");
}

Log.prototype = {
	run:function(res, data)
	{
		var ret = {cmd : data.cmd, rnd : null, errno : 0};

		(Log.func[data.cmd] == undefined) ? res.end("protocol not found"):Log.func[data.cmd].apply(this,[data.info,ret,res]);
	},
	
	pDumpLog : function(info, ret, res)
	{
		var client_error = new Buffer(info[0], 'base64').toString('utf8');
		//console.log(client_error);
		_logger.log({data : client_error}, "error");
		_shard.query_master("INSERT INTO l_client_error(lce_text) VALUES (?)",client_error,  function(err) {
            		if(err) _log.log(err, "error");
			});
		_utilFunc.sendResult(res,ret);
	},
	
	pGameLog : function(info, ret, res)
	{
		var beta_log = new Buffer(info[0], 'base64').toString('utf8');
		//console.log(client_error);
		_logger.log({log : beta_log}, "game");
		_util_func.sendResult(res, ret);
	}
	
}

Log.init();
