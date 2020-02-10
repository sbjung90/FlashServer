module.exports.protocol = {};
/*
 * MSG_TYPE
1	NORMAL
2	TICKET_ADV
3	TICKER_INF
4	TICKET_VS
5	TICKET_RAID
6	GOLD
7	HEART
8	CASH
9	GATCHA_ACTOR
10	GATCHA_ITEM
11	ITEM
12	UNIT
 * */

exports.protocol["base"] = {};
exports.protocol["base"]["user"] = 1;
exports.protocol["base"]["message"] = 2;
exports.protocol["base"]["item"] = 3;

exports.protocol["user"] = {};
exports.protocol["user"]["P_USER_LOGIN"] = 1001;
exports.protocol["user"]["P_USER_SNS_LOGIN"] = 1002;
exports.protocol["user"]["P_USER_SAVE_USER"] = 1003;
exports.protocol["user"]["P_USER_MERGE"] = 1005;
//exports.protocol["user"]["P_USER_PING"] = 1003;

//저장용도로만 사용가능한  protocol  
//UserId ==> redis

exports.protocol["user"]["P_USER_SET_VALUE"] = 1006;
exports.protocol["user"]["P_USER_GET_VALUE"] = 1007;
exports.protocol["user"]["P_USER_SNS_CONNECT"] = 1008;
exports.protocol["user"]["P_SET_NICK_NAME"] = 1009;
exports.protocol["user"]["P_IAP_PAYLOAD"] = 1010;
exports.protocol["user"]["P_IAP_CONFIRM"] = 1011;
exports.protocol["user"]["P_IAP_TEST"] = 1012;
exports.protocol["user"]["P_USER_SNS_DISCONNECT"] = 1013;

//기준으로 1일 한번  1주 초기화  한번이라도 체크안받으면 리셋 일 리셋  
//




exports.protocol["message"] = {};
exports.protocol["message"]["P_LIST_MESSAGE"] = 2000;
exports.protocol["message"]["P_REQUEST_HEART"] = 2001;
exports.protocol["message"]["P_RESPONSE_HEART"] = 2002;
exports.protocol["message"]["P_ACCEPT_HEART"] = 2003;
exports.protocol["message"]["P_REQUEST_HEART_MULTI"] = 2004;
exports.protocol["message"]["P_SEND_HEART"] = 2005;
exports.protocol["message"]["P_SEND_HEART_MULTI"] = 2006;

exports.protocol["club"] = {};
exports.protocol["club"]["P_CREATE_CLUB"] = 3000;
exports.protocol["club"]["P_CLUB_LIST"] = 3001;
exports.protocol["club"]["P_JOIN_CLUB"] = 3002;
exports.protocol["club"]["P_CLUB_INFO"] = 3003;
exports.protocol["club"]["P_LEAVE_CLUB"] = 3004;
exports.protocol["club"]["P_DROP_MEMBER"] = 3005; //방장권환
exports.protocol["club"]["P_MYCLUB_RANK"] = 3006; 

exports.protocol["item"] = {};
exports.protocol["item"]["P_PAY_VERIFY_RECEIPT"] = 3001;




exports.protocol["log"] = {};
exports.protocol["log"]["P_LOG_DUMP"] = 5001;

for( var x in exports.protocol)
{
	var obj  = exports.protocol[x]
	for( var t in obj)
	{
		console.log(t+" "+obj[t])
	}
	
}
