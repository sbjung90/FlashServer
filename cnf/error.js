var EventEmitter = require("events").EventEmitter;
exports.errcode = {};

exports.ERR_PARAMS= -1;
exports.ERR_RNKDEY= -1000;
exports.ERR_DB= -1001;
exports.ERR_LOGIN_NO_ID= -1002;
exports.ERR_LOGIN_NOT_JOIN= -1003;
exports.ERR_LOGIN_INCORRECT_PASSWORD= -1004;
//export["= -1005; //이미존재한닉네임 디비에서.
exports.ERR_COUPON_ALEADY_USE= -1006;
exports.ERR_COUPON_NOT_FOUND= -1007; 
exports.ERR_ALEADY_REVIEW_REWARD= -1008; 
exports.ERR_SEND_LIMIT_TIME= -1009; 
exports.ERR_SEND_LIMIT_CNT= -1010; 
exports.ERR_NOT_FOUND_USER= -1011; 
exports.ERR_EXISTS_USER= -1012;
exports.ERR_OVER_MAX_SLOT= -1013;
exports.ERR_OLD_DATA= -1014
exports.ERR_DIFF_FACBOOK= -1045
exports.ERR_DIFF_UUID= -1046

exports.ERR_CHARACTER_WRONG_ID= -2001;
exports.ERR_CHARACTER_ALREADY_CONNECTED = -2002;
exports.ERR_CHARACTER_ALREADY_CREATE = -2003;
exports.ERR_NOT_ENOUGH_CASH= -2004;
exports.ERR_EXISTS_EQUIP_ITEM= -2005;
exports.ERR_NOT_FOUND_PET= -2006;
exports.ERR_LOCKED_PET= -2007;
exports.ERR_INCLUDE_DECK= -2008;
exports.ERR_NOT_ENOUGH_GHOSTPOINT= -2009;
exports.ERR_PET_NOT_ENOUGH_LEVEL= -2010;
exports.ERR_PET_NOT_ENOUGH_JAM= -2011;


exports.ERR_ITEM_CANNOT_SEL= -3004;

exports.ERR_ITEM_WRONG_ID = -3001;
exports.ERR_ITEM_NOT_ENOUGH_GOLD= -3002;
exports.ERR_ITEM_ALREADY_HAVE= -3003;
exports.ERR_ITEM_NOT_EQUIP_CLASS= -3005;
exports.ERR_ITEM_WRONG_SLOT_ID= -3006;
exports.ERR_ITEM_NOT_EQUIP_ITEM= -3007;
exports.ERR_ITEM_NO_HAVE_ITEM= -3008;
exports.ERR_ITEM_ALREADY_EQUIP= -3009;
exports.ERR_ITEM_NOT_ENOUGH_LEVEL= -3010;
exports.ERR_ITEM_NO_MORE_UPGRADE= -3011;
exports.ERR_ITEM_NOT_SELL_EQUIP= -3012;
exports.ERR_ITEM_NOT_SAME_GRADE= -3013;
exports.ERR_ITEM_OVER_ATTEND= -3014;
exports.ERR_ITEM_OVER_MAX_ATTEND= -3015;
exports.ERR_ITEM_UNIT_NOT_FOUND= -3016;
exports.ERR_ITEM_ALREADY_DO= -3017;
exports.ERR_ITEM_NOT_FOUND= -3010;

exports.ERR_ITEM_CANT_BUY= -3021;

exports.ERR_GAME_CANNOT_MATCHING_RECONNECTING = -4001;
exports.ERR_GAME_CANNOT_FIND_EMPTY_SERVER = -4002;
exports.ERR_GAME_WRONG_STAGE_ID = -4003;
exports.ERR_GAME_WRONG_SLOT_ID = -4004;
exports.ERR_GAME_NOT_REWARD = -4005;

exports.ERR_GAME_NOT_FIND_MATCHING_TARGET = -4006;

exports.ERR_GAME_REDIS_NOT_CONNECT = -5000;

exports.ERR_CTIME_LIMIT = -6001; //kakao 친구초대 실패ctime
exports.ERR_DATA = -9998;
exports.ERR_SYSTEM = -9999;
/*
exports.errorEvent = new process.EventEmitter();

exports.error_event = function(res, ret, errcode){
    ret['errcode'] = errcode;
    res.end(JSON.stringify(ret));
}*/

exports.errorEvent = new EventEmitter();

exports.errorEvent.on('error', function(errcode, ret, res)
{
	if(errcode instanceof Buffer)
	{
		errcode = parseInt(errcode.toString("utf8"));
	}
	ret['errno'] = errcode;
	_util_func.sendResult(res, ret);
});
