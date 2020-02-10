
exports.makeUserInfo=function(row)
{
	for(var x in row)
	{
		if(x.indexOf("jsn_txt") > 0)
		{
			if(row[x]) row[x]= JSON.parse(row[x]);
		}
	}
	row["u_watched_intro_movie_ti"] = row["u_watched_intro_movie_ti"] ? true :false;
	row["u_facebook_rewarded_ti"] = row["u_facebook_rewarded_ti"] ?  true : false;
	row["u_is_facebook_logged_in_ti"] = row["u_is_facebook_logged_in_ti"] ? true: false;
	row["u_has_marble_gift_ti"] = row["u_has_marble_gift_ti"] ? true : false;
	return row;
}
exports.makeUserDbInfo=function(row)
{
	for(var x in row)
	{
		if(x.indexOf("jsn_txt") > 0)
		{
			if(row[x]) row[x]= JSON.stringify(row[x]);
		}
	}
	row["u_watched_intro_movie_ti"] = row["u_watched_intro_movie_ti"] ? 1:0;
	row["u_facebook_rewarded_ti"] = row["u_facebook_rewarded_ti"] ?  1: 0;
	row["u_is_facebook_logged_in_ti"] = row["u_is_facebook_logged_in_ti"] ? 1: 0;
	row["u_has_marble_gift_ti"] = row["u_has_marble_gift_ti"] ? 1 : 0;
	return row;
}
