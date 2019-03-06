/*
 * K2HR3 REST API
 *
 * Copyright 2017 Yahoo! Japan Corporation.
 *
 * K2HR3 is K2hdkc based Resource and Roles and policy Rules, gathers 
 * common management information for the cloud.
 * K2HR3 can dynamically manage information as "who", "what", "operate".
 * These are stored as roles, resources, policies in K2hdkc, and the
 * client system can dynamically read and modify these information.
 *
 * For the full copyright and license information, please view
 * the license file that was distributed with this source code.
 *
 * AUTHOR:   Takeshi Nakatani
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

'use strict';

var	k2hr3		= require('./k2hr3dkc');
var	r3keys		= require('./k2hr3keys').getK2hr3Keys;
var	apiutil		= require('./k2hr3apiutil');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//---------------------------------------------------------
// Keystone api wrapper
//---------------------------------------------------------
// [NOTE]
// We use config which has keystone.type value.
// Default value is "keystone_v3".
//
var	osapi = null;

(function()
{
	var	r3Conf			= require('./k2hr3config').r3ApiConfig;
	var	apiConf			= new r3Conf();
	var	keystone_type	= './' + apiConf.getKeystoneType();
	osapi = require(keystone_type);
}());

//---------------------------------------------------------
// Get User Token
//---------------------------------------------------------
// 
// Get scoped/unscoped user token from keystone
// 
function rawGetUserToken(user, passwd, tenant, callback)
{
	var	_callback = callback;

	if(!apiutil.isSafeString(user)){
		var	error = new Error('user parameter is wrong');
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	var	_tenant	= apiutil.isSafeString(tenant) ? tenant.toLowerCase() : '';
	var	_user	= user;
	var	_passwd	= apiutil.isSafeString(passwd) ? passwd : '';

	// try to get not expired user token
	var	exist_token	= rawGetExistUserToken(_user, _tenant);
	if(apiutil.isSafeEntity(exist_token) && apiutil.isSafeString(exist_token.token)){
		// found existed token
		_callback(null, exist_token.token);
		return;
	}
	r3logger.dlog('Now do not have user token, thus try to get new user token.');

	// get unscoped token
	rawGetUserUnscopedTokenWrap(_user, _passwd, function(err, jsonres)
	{
		var	error;
		if(null !== err){
			error = new Error('could not get user access token by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// save to local val
		_user				= jsonres.user;								// over write
		var	_userid			= jsonres.userid;
		var	_username		= jsonres.user;
		var	_unscopedtoken	= jsonres.token;
		var	_tokenexpire	= jsonres.expire;							// eslint-disable-line no-unused-vars
		var	_region			= jsonres.region;							// eslint-disable-line no-unused-vars

		// break when unscoped token
		if(!apiutil.isSafeString(_tenant)){
			_callback(null, _unscopedtoken);
			return;
		}

		// get scoped user token
		return rawGetScopedUserToken(_unscopedtoken, _username, _userid, _tenant, _callback);
	});
}

// 
// Get scoped user token from unscoped user token
// 
function rawGetScopedUserTokenByUnscoped(unscopedtoken, username, tenant, callback)
{
	var	error;
	if(!apiutil.isSafeStrings(unscopedtoken, username, tenant)){
		error = new Error('unscopedtoken or username or tenant parameters are wrong');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// user id from user name
	var	_tenant		= tenant.toLowerCase();
	var	user_info	= k2hr3.getUserId(username);				// user id from user name
	if(null === user_info || !apiutil.isSafeEntity(user_info.name) || !apiutil.isSafeEntity(user_info.id)){
		error = new Error('could not find username(' + username + ') from unscoped token in k2hdkc.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// get scoped user token
	return rawGetScopedUserToken(unscopedtoken, user_info.name, user_info.id, _tenant, callback);
}

// 
// Get scoped user token from keystone
// 
function rawGetScopedUserToken(unscopedtoken, username, userid, tenant, callback)
{
	if(!apiutil.isSafeStrings(unscopedtoken, username, userid, tenant)){
		var	error = new Error('unscopedtoken or username or userid or tenant parameters are wrong');
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	var	_unscopedtoken	= unscopedtoken;
	var	_username		= username;
	var	_userid			= userid;
	var	_tenant			= apiutil.isSafeString(tenant) ? tenant.toLowerCase() : '';
	var	_callback		= callback;

	// get tenant list for check
	osapi.getUserTenantList(_unscopedtoken, _userid, function(err, jsonres)
	{
		var	error;
		if(null !== err){
			error = new Error('could not get tenant list for user ' + _username + '(token=' + _unscopedtoken + ') by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		//r3logger.dlog('get user tenant list jsonres=\n' + JSON.stringify(jsonres));

		// check tenants(and initialize tenants)
		var	_tenant_id		= null;
		var	_tenant_name	= null;
		var	_tenant_desc	= null;									// eslint-disable-line no-unused-vars
		var	_tenant_display	= null;									// eslint-disable-line no-unused-vars
		var	_tenant_list	= new Array(0);
		for(var cnt = 0; cnt < jsonres.length; ++cnt){
			if(!apiutil.isSafeEntity(jsonres[cnt])){
				continue;
			}
			// over write
			var	resobj = k2hr3.initUserTenant(_username, _userid, _username, jsonres[cnt].name, jsonres[cnt].id, jsonres[cnt].description, jsonres[cnt].display);
			if(!resobj.result){
				error = new Error(resobj.message);
				r3logger.elog(error.message);
				_callback(error, null);
				return;
			}
			if(apiutil.compareCaseString(jsonres[cnt].name, _tenant)){
				// find target tenant
				_tenant_id		= jsonres[cnt].id;
				_tenant_name	= jsonres[cnt].name;
				_tenant_desc	= jsonres[cnt].description;
				_tenant_display	= jsonres[cnt].display;
			}
			_tenant_list.push(jsonres[cnt].name);
		}
		// check and remove old tenant for user
		if(!k2hr3.removeComprehensionByNewTenants(_username, _tenant_list)){
			r3logger.elog('failed to remove some tenant for user, but continue...');
		}

		// get scoped token
		osapi.getUserScopedToken(_unscopedtoken, _tenant_name, _tenant_id, function(err, jsonres)
		{
			var	error;
			if(null !== err){
				error = new Error('could not get scoped user token for user ' + _username + ' by ' + err.message);
				r3logger.elog(error.message);
				_callback(error, null);
				return;
			}
			//r3logger.dlog('get user scoped token jsonres=\n' + JSON.stringify(jsonres));

			var	token_seed = apiutil.isSafeString(jsonres.token_seed) ? jsonres.token_seed : null;
			if(!rawSetUserToken(_username, _tenant_name, jsonres.token, jsonres.expire, jsonres.region, token_seed)){
				error = new Error('failed to set unscoped/scoped user token');
				r3logger.elog(error.message);
				_callback(error, null);
				return;
			}

			// succeed
			_callback(null, jsonres.token);
			return;
		});
	});
}

//---------------------------------------------------------
// set user/tenant token
//---------------------------------------------------------
//	tenant		undefined(or null) thus token must be unscoped.
//	expire		UTC ISO 8601 format
//
//	[NOTE]		Must initialize User/Tenant before calling this function.
//
function rawSetUserToken(user, tenant, token, expire, region, seed)
{
	if(!apiutil.isSafeStrings(user, token, expire, region)){								// allow tenant/seed is null
		r3logger.elog('some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', token=' + JSON.stringify(token) + ', expire=' + JSON.stringify(expire) + ', region=' + JSON.stringify(region));
		return false;
	}

	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	var	keys			= r3keys(user, tenant);
	var	subkeylist;
	if(!apiutil.isSafeEntity(dkcobj)){
		return false;
	}

	//
	// Check user key exists and create these.
	//
	var	expire_limit			= apiutil.calcExpire(expire);								// UTC ISO 8601 to unixtime
	var	token_value_key			= keys.TOKEN_USER_TOP_KEY + '/' + token;					// "yrn:yahoo::::token:user/<token>"
	var	user_token_key			= keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY + '/' + token;		// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	var	user_token_seed_key		= user_token_key + '/' + keys.SEED_KW;						// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"

	// [NOTE]
	// If tenant is null, following keys have not tenant keyword in that key string.
	//												[ not have tenant name ]				vs		[ have tenant name ]
	// keys.USER_TENANT_AMBIGUOUS_KEY			---> "yrn:yahoo::::user:<user>:tenant/"			or "yrn:yahoo::::user:<user>:tenant/<tenant>"
	// keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY		---> "yrn:yahoo::::user:<user>:tenant//token"	or "yrn:yahoo::::user:<user>:tenant/<tenant>/token"
	//

	// token top
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.USER_TENANT_AMBIGUOUS_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY)){
		if(!dkcobj.setSubkeys(keys.USER_TENANT_AMBIGUOUS_KEY, subkeylist)){					// add subkey yrn:yahoo::::user:<user>:tenant/{<tenant>}/token -> yrn:yahoo::::user:<user>:tenant/{<tenant>}
			r3logger.elog('could not add ' + keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY + ' subkey under ' + keys.USER_TENANT_AMBIGUOUS_KEY + ' key');
			dkcobj.clean();
			return false;
		}
	}

	// to token key
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, user_token_key)){
		if(!dkcobj.setSubkeys(keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY, subkeylist)){			// add subkey yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token> -> yrn:yahoo::::user:<user>:tenant/{<tenant>}/token
			r3logger.elog('could not add ' + user_token_key + ' subkey under ' + keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY + ' key');
			dkcobj.clean();
			return false;
		}
	}

	// get/set token value
	var	old_value = dkcobj.getValue(user_token_key, null, true, null);
	if(old_value != region){
		if(!dkcobj.setValue(user_token_key, region, null, null, expire_limit)){				// update new token key(value with region and expire) -> yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>
			r3logger.elog('could not set ' + region + '(expire=' + expire + ') to ' + user_token_key + ' key');
			dkcobj.clean();
			return false;
		}
	}

	// get/set seed value
	if(apiutil.isSafeString(seed)){
		old_value = dkcobj.getValue(user_token_seed_key, null, true, null);
		if(old_value != seed){
			if(!dkcobj.setValue(user_token_seed_key, seed, null, null, expire_limit)){		// update new token seed key(value with expire) -> yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed
				r3logger.elog('could not set ' + seed + '(expire=' + expire + ') to ' + user_token_seed_key + ' key');
				dkcobj.clean();
				return false;
			}
		}
		subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(user_token_key, true));
		if(apiutil.tryAddStringToArray(subkeylist, user_token_seed_key)){
			if(!dkcobj.setSubkeys(user_token_key, subkeylist)){								// add subkey yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed -> yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>
				r3logger.elog('could not add ' + user_token_seed_key + ' subkey under ' + user_token_key + ' key');
				dkcobj.clean();
				return false;
			}
		}
	}

	// create new token under token top key
	//
	// [NOTE]
	// This key is not set expire limit. if you need to check expire,
	// you look up key under user key.
	//
	if(!dkcobj.setValue(token_value_key, user_token_key)){									// create(over write) value(="yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>") without expire -> yrn:yahoo::::token/<token>
		r3logger.elog('could not set ' + user_token_key + ' value without expire to ' + token_value_key + ' key');
		dkcobj.clean();
		return false;
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.TOKEN_USER_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, token_value_key)){
		if(!dkcobj.setSubkeys(keys.TOKEN_USER_TOP_KEY, subkeylist)){						// add subkey yrn:yahoo::::token:user/<token> -> yrn:yahoo::::token:user
			r3logger.elog('could not add ' + token_value_key + ' subkey under ' + keys.TOKEN_USER_TOP_KEY + ' key');
			dkcobj.clean();
			return false;
		}
	}

	dkcobj.clean();
	return true;
}

//---------------------------------------------------------
// get user unscoped token
//---------------------------------------------------------
// 
// Get user token from keystone
//
//	result		null or object
//				{
//					user:		user name(if existed, from parameter)
//					userid:		user id(if existed, from "yrn:yahoo::::user:<user name>:id")
//					scoped:		false(always false)
//					token:		token string(id)
//					expire:		expire string(if existed, null)
//					region:		region string
//				}
//
// [NOTE]
// This function is wrapper for osapi.getUserUnscopedToken().
// This function checks existing unscoped token before call it.
//
function rawGetUserUnscopedTokenWrap(user, passwd, callback)
{
	var	_user		= user;
	var	_passwd		= apiutil.isSafeString(passwd) ? passwd : '';
	var	_callback	= callback;

	// try to get not expired user token
	var	exist_token	= rawGetExistUserToken(_user, null);
	if(apiutil.isSafeEntity(exist_token)){
		// found existed token
		_callback(null, exist_token);
		return;
	}

	// get unscoped token
	osapi.getUserUnscopedToken(_user, _passwd, function(err, jsonres)
	{
		var	error;
		if(null !== err){
			error = new Error('could not get user access token by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// init user
		var	resobj = k2hr3.initUser(jsonres.user, jsonres.userid, jsonres.user, null);
		if(!resobj.result){
			error = new Error(resobj.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// set unscoped token
		var	token_seed = apiutil.isSafeString(jsonres.token_seed) ? jsonres.token_seed : null;
		if(!rawSetUserToken(jsonres.user, null, jsonres.token, jsonres.expire, jsonres.region, token_seed)){
			error = new Error('failed to set unscoped/scoped user token');
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// succeed
		_callback(null, jsonres);
		return;
	});
}

//---------------------------------------------------------
// get user/tenant token
//---------------------------------------------------------
//
//	tenant		undefined(or null) thus token must be unscoped.
//
//	result		null or object
//				{
//					user:		user name(if existed, from parameter)
//					userid:		user id(if existed, from "yrn:yahoo::::user:<user name>:id")
//					scoped:		false(always false)
//					token:		token string(id)
//					expire:		expire string(if existed, null)
//					region:		region string
//				}
//
//	[NOTE]		Must initialize User/Tenant before calling this function.
//
function rawGetExistUserToken(user, tenant)
{
	if(!apiutil.isSafeStrings(user)){														// allow tenant is null
		r3logger.elog('some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant));
		return null;
	}

	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	if(!apiutil.isSafeEntity(dkcobj)){
		return null;
	}

	//
	// Check user key exists and create these.
	//
	var	keys	= r3keys(user, tenant);

	// get token list from user/tenant token top key
	var	subkeylist = apiutil.getSafeArray(dkcobj.getSubkeys(keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY, true));
	if(apiutil.isEmptyArray(subkeylist)){
		dkcobj.clean();
		return null;
	}

	// loop until get value
	var	keyptn = new RegExp('^' + keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY + '/');				// regex = /^yrn:yahoo::::user:<user>\:tenant\/{<tenant>}\/token\//
	var	rmkeys = new Array(0);
	var	resobj = null;
	for(var cnt = 0; cnt < subkeylist.length; ++cnt){
		var	token = subkeylist[cnt].replace(keyptn, '');									// get only token string
		if(!apiutil.isSafeStrings(token)){
			// why?
			continue;
		}

		var	region = dkcobj.getValue(subkeylist[cnt], null, true, null);					// get token region
		if(!apiutil.isSafeStrings(region)){
			// token region is not existed, probably it is expired.
			// then check and remove key under token.
			//
			var	token_key = keys.TOKEN_USER_TOP_KEY + '/' + token;
			if(!dkcobj.remove(token_key, true)){											// remove token key and it's children ---> "yrn:yahoo::::token:user/<token>"
				r3logger.elog('could not remove token key ' + token_key + ', but continue...');
			}
			// register removing keys
			rmkeys.push(subkeylist[cnt]);

		}else{
			// found token
			var	userid = dkcobj.getValue(keys.USER_ID_KEY, null, true, null);				// get user id from "yrn:yahoo::::user:<user name>:id"
			if(!apiutil.isSafeStrings(userid)){
				r3logger.wlog('user(' + user + ') id is empty, but continue...');
			}
			resobj			= {};
			resobj.user		= user;
			resobj.userid	= userid;
			resobj.scoped	= apiutil.isSafeString(tenant) ? true : false;
			resobj.token	= token;
			resobj.expire	= null;
			resobj.region	= region;
			break;
		}
	}
	if(0 < rmkeys.length){
		// need to remove keys from subkey list
		var	is_update	= false;
		subkeylist		= dkcobj.getSubkeys(keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY, true);	// re-get subkeys under "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token"
		for(cnt = 0; cnt < rmkeys.length; ++cnt){
			if(apiutil.removeStringFromArray(subkeylist, rmkeys[cnt])){
				is_update = true;
			}
		}
		if(is_update){
			if(!dkcobj.setSubkeys(keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY, subkeylist)){		// update subkey -> "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token"
				r3logger.elog('could not update subkey under ' + keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY + ' key, but continue...');
			}
		}
	}

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// remove scoped user token
//---------------------------------------------------------
//
//	token		scoped user token
//
//	[NOTE]		This removes(force expire) scoped user token for
//				using ACR API.
//				The token used by ACR must be removed after checking
//				it, because this case allows using token one time.
//
function rawRemoveScopedUserToken(token)
{
	if(!apiutil.isSafeString(token)){
		r3logger.elog('parameter is wrong : token=' + JSON.stringify(token));
		return false;
	}

	//
	// Check token
	//
	if(0 === token.indexOf('R=')){
		r3logger.elog('token(' + JSON.stringify(token) + ') is role token.');
		return false;
	}else if(0 === token.indexOf('U=')){
		token = token.substr(2);															// cut 'U='
	}
	var	token_info = rawCheckUserToken(token);
	if(	null === token_info							||
		!apiutil.isSafeString(token_info.user)		||
		!apiutil.isSafeString(token_info.tenant)	||
		!apiutil.isSafeEntity(token_info.scoped)	||
		'boolean' !== typeof token_info.scoped		||
		true !== token_info.scoped					)
	{
		r3logger.elog('token(' + JSON.stringify(token) + ') is something wrong.');
		return false;
	}

	//
	// Remove token
	//
	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	var	subkeylist;
	var	errmsg			= '';
	if(!apiutil.isSafeEntity(dkcobj)){
		return false;
	}

	//
	// Keys
	//
	var	keys			= r3keys(token_info.user, token_info.tenant);
	var	token_top_key	= keys.TOKEN_USER_TOP_KEY;											// "yrn:yahoo::::token:user"
	var	token_value_key	= keys.TOKEN_USER_TOP_KEY + '/' + token;							// "yrn:yahoo::::token:user/<token>"
	var	utoken_top_key	= keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY;								// "yrn:yahoo::::user:<user>:tenant/<tenant>/token"
	var	utoken_token_key= keys.USER_TENANT_AMBIGUOUS_TOKEN_KEY + '/' + token;				// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	var	utoken_seed_key	= utoken_token_key + '/' + keys.SEED_KW;							// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"

	//
	// check under token top
	//
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(token_top_key, true));
	if(apiutil.removeStringFromArray(subkeylist, token_value_key)){							// remove subkeys "yrn:yahoo::::token:user/<token>" -> "yrn:yahoo::::token:user"
		if(!dkcobj.setSubkeys(token_top_key, subkeylist)){
			errmsg += 'could not remove ' + token_value_key + ' subkey under ' + token_top_key + ' key, ';
		}
	}
	if(!dkcobj.remove(token_value_key, false)){												// remove key "yrn:yahoo::::token:user/<token>"
		errmsg += 'could not remove ' + token_value_key + 'key, probably it is not existed, ';
	}

	//
	// check under user top
	//
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(utoken_top_key, true));
	if(apiutil.removeStringFromArray(subkeylist, utoken_token_key)){						// remove subkeys "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>" -> "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token"
		if(!dkcobj.setSubkeys(utoken_top_key, subkeylist)){
			errmsg += 'could not remove ' + utoken_token_key + ' subkey under ' + utoken_top_key + ' key, ';
		}
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(utoken_token_key, true));
	if(apiutil.removeStringFromArray(subkeylist, utoken_seed_key)){							// remove subkeys "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed" -> "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
		if(!dkcobj.setSubkeys(utoken_token_key, subkeylist)){
			errmsg += 'could not remove ' + utoken_seed_key + ' subkey under ' + utoken_token_key + ' key, ';
		}
	}
	if(!dkcobj.remove(utoken_seed_key, false)){												// remove key "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"
		errmsg += 'could not remove ' + utoken_seed_key + 'key, probably it is not existed, ';
	}
	if(!dkcobj.remove(utoken_token_key, false)){											// remove key "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
		errmsg += 'could not remove ' + utoken_token_key + 'key, probably it is not existed, ';
	}

	if(apiutil.isSafeString(errmsg)){
		r3logger.elog(errmsg);
	}

	dkcobj.clean();
	return true;																			// Returns true even if there is an error in deletion processing
}

//---------------------------------------------------------
// Check User Token
//---------------------------------------------------------
// 
// Check User Token
// 
// result		:	null or token information
//					{
//						role:		role name
//						user:		user name
//						hostname:	always null
//						ip:			always null
//						port:		port number(if host is existed), 0 means any
//						tenant:		tenant name
//						scoped:		role token is always scoped(true)
//						region:		when user token, the creator region name of the token
//					}
// 
function rawCheckUserToken(token)
{
	if(!apiutil.isSafeString(token)){
		r3logger.elog('token parameter is wrong');
		return null;
	}

	// get user/tenant from token
	var	token_info = rawGetUserTenantByToken(token);
	if(null === token_info || !apiutil.isSafeEntity(token_info.user)){
		r3logger.elog('token is not any user/tenant(expired or wrong token)');
		return null;
	}
	// add scoped flag
	if(apiutil.isSafeEntity(token_info.tenant)){
		token_info.scoped = true;
	}else{
		token_info.scoped = false;
	}
	token_info.role		= null;
	token_info.ip		= null;
	token_info.hostname	= null;
	token_info.port		= 0;

	return token_info;
}

//---------------------------------------------------------
// [Role Token]
//---------------------------------------------------------
//
// Token:				Token Id(################)
// X-Auth-Token:		R=Token Id
// Token Id:			The "Token Id" is a unique hex number string for 128bit.
//						"Token Id" = "(<base id(64bit:8byte)> ^ <crypt id(64bit:8byte)>)" + "(<role id(64bit:8byte)> ^ <crypt id(64bit:8byte)>)"
// Role Token Key:		"yrn:yahoo::::token:role/<Token Id>"
// Role Token Value:	{
//							role:		"role full yrn"
//							date:		"UTC ISO 8601 time at create"
//							expire:		"UTC ISO 8601 time at expire"
//							creator:	"Host full yrn" or "User full yrn"
//							base:		"id from host" or "last 64bit string in UserToken"
//							user:		"user name", if creator is user, this value is user name.(if not, this is null)
//							ip:			"ip address", if creator is host, this value is ip address.(if not, this is null)
//							hostname:	"hostname", if creator is host, this value is hostname.(if not, this is null)
//							port:		port number, if creator is host, this value is port number.(if not, this is 0)
//							tenant:		"tenant name" for this role token(this mean token is scoped)
//							verify:		"random 64bit id for verify token"
//						}
//
// [NOTE]
// "role id" which is in "Token Id" is included from role key(yrn:yahoo:<Tenant>:::role:<role name>/id).
// This value is secret, any API could not get this value directly.
//

//---------------------------------------------------------
// Get Role Token From user(token)
//---------------------------------------------------------
// 
// user			:	this value is parsed from user token
// tenant		:	this value is parsed from user token
// base_id		:	this value is array which is lower 64 bit data from user token(used by convertHexStringToBin64() for parsing)
// role			:	target role name(full yrn or only role name)
// expire_limit	:	specify expire second(default 24H = 24 * 60 * 60 sec)
// 
// result		:	{
//						result:		true/false
//						message:	null or error message string
//						token:		undefined(error) or role token string
// 					}
// 
// [NOTE]
// set role token value is following
// 					{
//						role:		token's role yrn("yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}")
//						date:		create date(UTC ISO 8601)
//						expire:		expire date(UTC ISO 8601)
//						creator:	creator yrn("yrn:yahoo::::user:<user>" or "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/<ip:port>")
//						user:		if creator is user, this value is user name.
//						hostname:	always null
//						ip:			always null
//						port:		if creator is host, this value is port number.(if not, this is 0)
//						tenant:		tenant name for this role token(this mean token is scoped)
//						base:		base id value(this value is only used by check)
//						verify:		for verify check value
//					}
// 
function rawGetRoleTokenByUser(user, tenant, base_id, role, expire_limit)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant, role)){											// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isEmptyArray(base_id) || 4 !== base_id.length){								// base_id must be array(4)
		resobj.result	= false;
		resobj.message	= 'base_id parameters are wrong : base_id=' + JSON.stringify(base_id);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeEntity(expire_limit) || isNaN(expire_limit)){							// expire_limit must be number or null(undefined)
		expire_limit = 24 * 60 * 60;														// default 24H
	}

	// check role name is only name or full yrn path
	var	keys		= r3keys(user, tenant);
	role			= role.toLowerCase();
	var	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematchs	= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematchs) || rolematchs.length < 4){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(role.match(roleptn)){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') is not role yrn path)';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check tenant name
		if(tenant !== rolematchs[2]){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') yrn has tenant(' + rolematchs[2] + '), but it is not specified tenant(' + tenant + ')';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is set only role name
		role = rolematchs[3];
	}

	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	var	subkeylist;
	if(!apiutil.isSafeEntity(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	//
	// keys
	//
	var	role_key		= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	role_id_key		= role_key + '/' + keys.ID_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"

	// role id
	var	role_id	= dkcobj.getValue(role_id_key, null, true, null);
	role_id		= JSON.parse(role_id);
	if(apiutil.isEmptyArray(role_id) || role_id.length < 4){
		resobj.result	= false;
		resobj.message	= 'could not get role id(' + role_id_key + ') value, or it is wrong value(' + JSON.stringify(role_id) + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// make token value
	var	now_unixtime	= apiutil.getUnixtime();
	var	token_value		= {};
	token_value.role	= role_key;															// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	token_value.date	= (new Date(now_unixtime * 1000)).toISOString();					// now date(UTC ISO 8601)
	token_value.expire	= (new Date((now_unixtime + expire_limit) * 1000)).toISOString();	// expire date(UTC ISO 8601)
	token_value.creator	= keys.USER_KEY;													// "yrn:yahoo::::user:<user>"
	token_value.user	= user;																// user(creator)
	token_value.hostname= null;																// hostname(creator)
	token_value.ip		= null;																// ip(creator)
	token_value.port	= 0;																// port(creator)
	token_value.tenant	= tenant;															// tenant(scope)
	token_value.base	= base_id;															// base id

	// role token and yrn key
	var	role_token		= '';
	var	token_role_key	= null;

	// create key
	for(var is_loop = true; is_loop; ){														// for eslint
		// set verify value
		token_value.verify	= apiutil.getRandomBin64();										// random value

		// make role token
		var	hiBinToken		= apiutil.makeXorValue(token_value.base, token_value.verify);
		var	lowBinToken		= apiutil.makeXorValue(role_id, token_value.verify);
		role_token			= apiutil.convertBin64ToHexString(hiBinToken);
		role_token			+= apiutil.convertBin64ToHexString(lowBinToken);

		// role token key
		token_role_key		= keys.TOKEN_ROLE_TOP_KEY + '/' + role_token;					// "yrn:yahoo::::token:role/<role token>"

		// get role token for existing check
		var	value			= dkcobj.getValue(token_role_key, null, true, null);
		if(!apiutil.isSafeEntity(value)){
			// set value to role token
			if(!dkcobj.setValue(token_role_key, JSON.stringify(token_value), null, null, expire_limit)){	// set token value -> yrn:yahoo::::token:role/<role token>
				resobj.result	= false;
				resobj.message	= 'could not set ' + JSON.stringify(token_value) + ' value to ' + token_role_key + ' key';
				r3logger.elog(resobj.message);
				dkcobj.clean();
				return resobj;
			}
			break;
		}else{
			r3logger.dlog('conflict role token(' + role_token + ') which already is used, so remake token for uniq.');
		}
	}

	// Add token to role token top key's subkey list
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.TOKEN_ROLE_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, token_role_key)){
		if(!dkcobj.setSubkeys(keys.TOKEN_ROLE_TOP_KEY, subkeylist)){						// add subkey yrn:yahoo::::token:role/<role token> -> yrn:yahoo::::token:role
			resobj.result	= false;
			resobj.message	= 'could not add ' + token_role_key + ' subkey under ' + keys.TOKEN_ROLE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	// Add role token into result object.
	resobj.token = role_token;

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Get Role Token From ip address
//---------------------------------------------------------
// ip			:	ip address
// port			:	port number(0, undefined, null means any port)
// cuk			:	container unique key(undefined, null means any)
// tenant		:	tenant name
// role			:	target role name(full yrn or only role name)
// expire_limit	:	specify expire second(default 24H = 24 * 60 * 60 sec)
// 
// result		:	{
//						result:		true/false
//						message:	null or error message string
//						token:		undefined(error) or role token string
// 					}
// 
// [NOTE]
// set role token value is following
// 					{
//						role:		token's role yrn("yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}")
//						date:		create date(UTC ISO 8601)
//						expire:		expire date(UTC ISO 8601)
//						creator:	creator yrn("yrn:yahoo::::user:<user>" or "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/<ip:port>")
//						user:		always null
//						hostname:	always null
//						ip:			if creator is host, this value is ip address.
//						port:		if creator is host, this value is port number.(if not, this is 0)
//						tenant:		tenant name for this role token(this mean token is scoped)
//						base:		base id value(this value is only used by check)
//						verify:		for verify check value
//					}
// 
// The role token which is built by host is made by only IP address.
// Hostname can not build a role token, because it is not secure.(= Hostname can easily be disguised.)
// Then only IP address can build a role token without UserToken.
// 
function rawGetRoleTokenByIP(ip, port, cuk, tenant, role, expire_limit)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, role, ip)){											// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role) + ', ip' + JSON.stringify(ip);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(ip)){
		resobj.result	= false;
		resobj.message	= 'ip parameter is empty.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeEntity(port) || isNaN(port)){											// port must be number or null(undefined)
		port = 0;																			// force set port 0(any).
	}
	if(!apiutil.isSafeEntity(expire_limit) || isNaN(expire_limit)){							// expire_limit must be number or null(undefined)
		expire_limit = 24 * 60 * 60;														// default 24H
	}

	// check role name is only name or full yrn path
	var	keys		= r3keys(null, tenant);
	role			= role.toLowerCase();
	var	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematchs	= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematchs) || rolematchs.length < 4){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(role.match(roleptn)){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') is not role yrn path)';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check tenant name
		if(tenant !== rolematchs[2]){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') yrn has tenant(' + rolematchs[2] + '), but it is not specified tenant(' + tenant + ')';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is set only role name
		role = rolematchs[3];
	}

	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	var	subkeylist;
	if(!apiutil.isSafeEntity(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	//
	// keys
	//
	var	role_key		= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	role_id_key		= role_key + '/' + keys.ID_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"

	// find host key and get host id for base id
	var	host_info		= k2hr3.findRoleHost(dkcobj, role_key, null, ip, port, cuk);
	if(apiutil.isEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'Not found ip(' + ip + ') with port(' + String(port) + ') in tenant(' + tenant + ') + role(' + role + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	var	host_value = null;
	for(var pos = 0; pos < host_info.length; ++pos){
		if(!apiutil.isSafeEntity(host_info[pos]) || !apiutil.isSafeString(host_info[pos].key)){
			r3logger.dlog('Found ip(' + ip + ') with port(' + String(port) + ') in tenant(' + tenant + ') + role(' + role + '), but this host info(' + JSON.stringify(host_info[pos]) + ') is something wrong, skip it');
			continue;
		}
		host_value	= dkcobj.getValue(host_info[pos].key, null, true, null);
		host_value	= JSON.parse(host_value);
		if(	!apiutil.isSafeEntity(host_value)				||
			(!apiutil.isSafeString(host_value.hostname) && !apiutil.isSafeString(host_value.ip)) ||	// hostname or ip is existed
			!apiutil.isSafeEntity(host_value.port)			||
			apiutil.isEmptyArray(host_value[keys.ID_KW])	||										// host id(array[4])
			4 !== host_value[keys.ID_KW].length				)
		{
			r3logger.dlog('Found ip(' + ip + ') with port(' + String(port) + ') in tenant(' + tenant + ') + role(' + role + '), but this host value(' + JSON.stringify(host_value) + ') is something wrong, skip it');
		}else{
			// found safe host info, we use this.
			host_value.key = host_info[pos].key;
			break;
		}
		host_value = null;
	}
	if(null === host_value){
		resobj.result	= false;
		resobj.message	= 'Found ip(' + ip + ') with port(' + String(port) + ') in tenant(' + tenant + ') + role(' + role + '), but there is not safe any host info';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// role id
	var	role_id	= dkcobj.getValue(role_id_key, null, true, null);
	role_id		= JSON.parse(role_id);
	if(apiutil.isEmptyArray(role_id) || role_id.length < 4){
		resobj.result	= false;
		resobj.message	= 'could not get role id(' + role_id_key + ') value, or it is wrong value(' + JSON.stringify(role_id) + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// make token value
	var	now_unixtime	= apiutil.getUnixtime();
	var	token_value		= {};
	token_value.role	= role_key;															// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	token_value.date	= (new Date(now_unixtime * 1000)).toISOString();					// now date(UTC ISO 8601)
	token_value.expire	= (new Date((now_unixtime + expire_limit) * 1000)).toISOString();	// expire date(UTC ISO 8601)
	token_value.creator	= host_value.key;													// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/<ip:port>"
	token_value.user	= null;																// user(creator)
	token_value.hostname= null;																// hostname(null)
	token_value.ip		= host_value.ip;													// ip(creator)
	token_value.port	= host_value.port;													// port(creator)
	token_value.tenant	= tenant;															// tenant(scope)
	token_value.base	= host_value[keys.ID_KW];											// host id

	// role token and yrn key
	var	role_token		= '';
	var	token_role_key	= null;

	// create key
	for(var is_loop = true; is_loop; ){														// for eslint
		// set verify value
		token_value.verify	= apiutil.getRandomBin64();										// random value

		// make role token
		var	hiBinToken		= apiutil.makeXorValue(token_value.base, token_value.verify);
		var	lowBinToken		= apiutil.makeXorValue(role_id, token_value.verify);
		role_token			= apiutil.convertBin64ToHexString(hiBinToken);
		role_token			+= apiutil.convertBin64ToHexString(lowBinToken);

		// role token key
		token_role_key		= keys.TOKEN_ROLE_TOP_KEY + '/' + role_token;					// "yrn:yahoo::::token:role/<role token>"

		// get role token for existing check
		var	value			= dkcobj.getValue(token_role_key, null, true, null);
		if(!apiutil.isSafeEntity(value)){
			// set value to role token
			if(!dkcobj.setValue(token_role_key, JSON.stringify(token_value), null, null, expire_limit)){	// set token value -> yrn:yahoo::::token:role/<role token>
				resobj.result	= false;
				resobj.message	= 'could not set ' + JSON.stringify(token_value) + ' value to ' + token_role_key + ' key';
				r3logger.elog(resobj.message);
				dkcobj.clean();
				return resobj;
			}
			break;
		}else{
			r3logger.dlog('conflict role token(' + role_token + ') which already is used, so remake token for uniq.');
		}
	}

	// Add token to role token top key's subkey list
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.TOKEN_ROLE_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, token_role_key)){
		if(!dkcobj.setSubkeys(keys.TOKEN_ROLE_TOP_KEY, subkeylist)){						// add subkey yrn:yahoo::::token:role/<role token> -> yrn:yahoo::::token:role
			r3logger.elog('could not add ' + token_role_key + ' subkey under ' + keys.TOKEN_ROLE_TOP_KEY + ' key');
			dkcobj.clean();
			return resobj;
		}
	}

	// Add role token into result object.
	resobj.token = role_token;

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Remove Role Token by User/IP
//---------------------------------------------------------
// token		:	role token
// user			:	this value is parsed from user token(or null)
// tenant		:	this value is parsed from user token(or null)
// ip			:	client ip address(or null)
// 
// result		:	{
//						result:		true/false
//						message:	null or error message string
// 					}
// 
function rawRemoveRoleToken(token, user, tenant, ip)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(token)){										// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'token parameter is empty';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(	(apiutil.isSafeString(ip)	&& (apiutil.isSafeString(user)	|| apiutil.isSafeString(tenant))) 	||
		(!apiutil.isSafeString(ip)	&& (!apiutil.isSafeString(user)	|| !apiutil.isSafeString(tenant)))	)
	{
		resobj.result	= false;
		resobj.message	= 'tenant(' + JSON.stringify(tenant) + '), user(' + JSON.stringify(user) + '), ip(' + JSON.stringify(ip) + ') parameters are wrong pattern.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	var	subkeylist;
	var	value;
	if(!apiutil.isSafeEntity(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	//
	// keys
	//
	var	keys			= (apiutil.isSafeString(ip) ? r3keys() : r3keys(user, tenant));
	var	role_token_key	= keys.TOKEN_ROLE_TOP_KEY + '/' + token;							// "yrn:yahoo::::token:role/<role token>"

	// get role token value
	value	= dkcobj.getValue(role_token_key, null, true, null);
	value	= JSON.parse(value);
	if(!apiutil.isSafeEntity(value)){
		// already role token is removed or expired.
		r3logger.dlog('could not get role token(' + role_token_key + ') value, or it is wrong value(' + JSON.stringify(value) + '). We check all role token for expire here.');
		dkcobj.clean();
		//
		// check and remove old role token under token top key("yrn:yahoo::::token:role") if old token is expired
		//
		// [NOTE]
		// This processing is taking time, so it runs asynchronously.
		// And for notes on this processing, refer to NOTE of rawCleanupRoleToken function.
		//
		rawCleanupRoleToken(function(result)
		{
			if(!result){
				r3logger.wlog('Failed to cleanup expired role tokens under ' + keys.TOKEN_ROLE_TOP_KEY + ' key, but continue...');
			}
		});
		// return success
		return resobj;
	}

	// check token value
	if(	!apiutil.isSafeString(value.role)			||
		!apiutil.isSafeString(value.date)			||
		!apiutil.isSafeString(value.expire)			||
		!apiutil.isSafeString(value.creator)		||
		(!apiutil.isSafeString(value.user) && !apiutil.isSafeString(value.hostname) && !apiutil.isSafeString(value.ip)) ||
		isNaN(value.port)							||
		!apiutil.isSafeString(value.tenant)			||
		apiutil.isEmptyArray(value.base)			||
		4 !== value.base.length						)
	{
		//
		// Not check expired token and ip address is empty here.
		//
		resobj.result	= false;
		resobj.message	= 'could not get role token(' + role_token_key + ') value, or it is wrong value(' + JSON.stringify(value) + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// check expire
	if(apiutil.isExpired(value.expire)){
		resobj.result	= false;
		resobj.message	= 'role token(' + role_token_key + ') is expired by expire date(' + value.expire + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// check requester
	if(apiutil.isSafeString(ip)){
		// check ip address
		//
		// [NOTE]
		// findHost() is creating k2hdkc object in it, thus we close dkc object here.
		// and re-create dkc object after returning that function.
		//
		dkcobj.clean();

		var	find_result = k2hr3.findHost(value.tenant, value.role, null, ip, 0);			// port = any
		if(!find_result.result || apiutil.isEmptyArray(find_result.host_info)){
			// ip address is not member of role
			resobj.result	= false;
			resobj.message	= 'could not remove role token(' + token + '), because ip(' + ip + ') is not role host member.';
			r3logger.elog(resobj.message);
			return resobj;
		}
		dkcobj = k2hr3.getK2hdkc(true, false);												// re-creating permanent object(need to clean)

	}else{
		// check tenant name
		if(0 !== value.role.indexOf(keys.ROLE_TOP_KEY)){
			// not same tenant name
			resobj.result	= false;
			resobj.message	= 'could not remove role token(' + token + '), because user(' + user + ')/tenant(' + tenant + ') is not role member.';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	// remove token
	if(!dkcobj.remove(role_token_key, false)){												// remove yrn:yahoo::::token:role/<role token>
		resobj.result	= false;
		resobj.message	= 'could not remove role token(' + token + '), probably it is not existed.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= dkcobj.getSubkeys(keys.TOKEN_ROLE_TOP_KEY, true);
	if(apiutil.removeStringFromArray(subkeylist, role_token_key)){
		if(!dkcobj.setSubkeys(keys.TOKEN_ROLE_TOP_KEY, subkeylist)){						// update subkey -> yrn:yahoo::::token:role
			resobj.result	= false;
			resobj.message	= 'could not update subkey under ' + keys.TOKEN_ROLE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Check Role Token
//---------------------------------------------------------
// token		:	role token
// ip			:	client ip address
// 
// result		:	null or token information
//					{
//						role:		role name
//						user:		null or user name
//						hostname:	null or host name
//						ip:			null or ip address
//						port:		port number(if host is existed), 0 means any
//						tenant:		tenant name
//						scoped:		role token is always scoped(true)
//						region:		role token is always null
//					}
// 
function rawCheckRoleToken(token, ip)
{
	if(!apiutil.isSafeString(token)){
		r3logger.elog('some parameters are wrong : token=' + JSON.stringify(token));
		return null;
	}

	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	var	value;
	if(!apiutil.isSafeEntity(dkcobj)){
		return null;
	}

	//
	// keys
	//
	var	keys			= r3keys();
	var	role_token_key	= keys.TOKEN_ROLE_TOP_KEY + '/' + token;							// "yrn:yahoo::::token:role/<role token>"

	// get role token value
	value	= dkcobj.getValue(role_token_key, null, true, null);
	value	= JSON.parse(value);
	if(!apiutil.isSafeEntity(value)){
		r3logger.dlog('could not get role token(' + role_token_key + ') value, or it is wrong value(' + JSON.stringify(value) + '). We check all role token for expire here.');
		dkcobj.clean();
		//
		// check and remove old role token under token top key("yrn:yahoo::::token:role") if old token is expired
		//
		// [NOTE]
		// This processing is taking time, so it runs asynchronously.
		// And for notes on this processing, refer to NOTE of rawCleanupRoleToken function.
		//
		rawCleanupRoleToken(function(result)
		{
			if(!result){
				r3logger.wlog('Failed to cleanup expired role tokens under ' + keys.TOKEN_ROLE_TOP_KEY + ' key, but continue...');
			}
		});
		return null;
	}
	if(	!apiutil.isSafeString(value.role)			||
		!apiutil.isSafeString(value.date)			||
		!apiutil.isSafeString(value.expire)			||
		!apiutil.isSafeString(value.creator)		||
		(!apiutil.isSafeString(value.user) && !apiutil.isSafeString(value.hostname) && !apiutil.isSafeString(value.ip)) ||
		isNaN(value.port)							||
		!apiutil.isSafeString(value.tenant)			||
		apiutil.isEmptyArray(value.base)			||
		4 !== value.base.length						)
	{
		//
		// Not check expired token and ip address is empty here.
		//
		r3logger.dlog('could not get role token(' + role_token_key + ') value, or it is wrong value(' + JSON.stringify(value) + ').');
		dkcobj.clean();
		return null;
	}

	// compare ip address, if they are specified and token is not created by user
	if(!apiutil.isSafeString(value.user)){
		if(!apiutil.isSafeString(ip) || ip !== value.ip){
			r3logger.dlog('role token(' + role_token_key + ') has value(' + JSON.stringify(value) + '), but it is not same ip(' + ip + ').');
			dkcobj.clean();
			return null;
		}
	}

	// check expire
	if(apiutil.isExpired(value.expire)){
		r3logger.dlog('token(' + token + ') is expired.');
		dkcobj.clean();
		return null;
	}

	// get role id for verify
	keys				= r3keys(null, value.tenant);										// remake keys
	var	role_key		= value.role;														// role member is full yrn => "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	role_id_key		= role_key + '/' + keys.ID_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	var	role_id			= dkcobj.getValue(role_id_key, null, true, null);
	role_id				= JSON.parse(role_id);
	if(apiutil.isEmptyArray(role_id) || role_id.length < 4){
		r3logger.dlog('could not get role id(' + role_id_key + ') value, or it is wrong value(' + JSON.stringify(role_id) + '), maybe expired this token');
		dkcobj.clean();
		return null;
	}
	dkcobj.clean();

	// make verify token
	var	verifyval		= apiutil.convertBin64ToHexString(apiutil.makeXorValue(value.base, value.verify));
	verifyval			+= apiutil.convertBin64ToHexString(apiutil.makeXorValue(role_id, value.verify));
	if(token !== verifyval){
		r3logger.elog('token(' + token + ') verify is failure, verify token is ' + verifyval + '.');
		return null;
	}

	// make result
	var	token_info		= {};
	token_info.role		= value.role;
	token_info.user		= value.user;
	token_info.hostname	= value.hostname;													// hostname
	token_info.ip		= value.ip;
	token_info.port		= value.port;
	token_info.tenant	= value.tenant;
	token_info.scoped	= true;																// role token is always scoped
	token_info.region	= null;

	return token_info;
}

//---------------------------------------------------------
// cleanup user/tenant by token
//---------------------------------------------------------
//	utility local function
//
// [NOTE]
// This process can be time consuming when subkey list is too many.
// In that case, there is a possibility that the consistency of the subkey will be lost.
// If a new token is added to the subkey list during processing with this function, that 
// token subkey will be overwritten(lost) when this function completes processing.
// Originally, this subkey list of "yrn:yahoo::::token:user" key has no direct use, so this
// is not a problem. Because it normally reads the sub key(token key) directly.
// Please do not read subkey(token key) from the subkey list of "yrn:yahoo::::token:user" key.
// This subkeys are only useful for "notes".
//
function rawCleanupUserToken(callback)
{
	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	if(!apiutil.isSafeEntity(dkcobj)){
		callback(false);
		return;
	}

	var	keys			= r3keys();
	var	subkeylist		= dkcobj.getSubkeys(keys.TOKEN_USER_TOP_KEY, true);					// get subkeys under "yrn:yahoo::::token:user"
	var	retrive_skeys	= new Array(0);
	for(var cnt = 0; cnt < subkeylist.length; ++cnt){
		var	user_token_key = dkcobj.getValue(subkeylist[cnt], null, true, null);
		if(!apiutil.isSafeStrings(user_token_key)){
			// value is not existed, so this key should be removing
			retrive_skeys.push(subkeylist[cnt]);
		}else{
			//
			// user_token_key => "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
			//
			var	value = dkcobj.getValue(user_token_key, null, true, null);
			if(!apiutil.isSafeStrings(value)){
				// user_token_key is not existed or expired.
				retrive_skeys.push(subkeylist[cnt]);

				// try remove user_token_key from "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token" subkey list
				var	parent_user_key = apiutil.getParentPath(user_token_key);
				if(apiutil.isSafeStrings(parent_user_key)){
					var	user_skeys = dkcobj.getSubkeys(parent_user_key, true);				// get subkeys under "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token"
					if(apiutil.removeStringFromArray(user_skeys, user_token_key)){
						if(!dkcobj.setSubkeys(parent_user_key, user_skeys)){				// update subkey -> "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token"
							r3logger.wlog('could not update subkey under ' + parent_user_key + ' key, but continue...');
						}
					}
				}else{
					r3logger.wlog('could not get parent key from ' + user_token_key + ' key, but skip it and continue...');
				}
			}
		}
	}
	if(0 < retrive_skeys.length){
		// need to remove keys from subkey list
		var	is_update	= false;
		subkeylist		= dkcobj.getSubkeys(keys.TOKEN_USER_TOP_KEY, true);					// re-get subkeys under "yrn:yahoo::::token:user"

		for(cnt = 0; cnt < retrive_skeys.length; ++cnt){
			if(apiutil.removeStringFromArray(subkeylist, retrive_skeys[cnt])){
				is_update = true;
			}
		}
		if(is_update){
			if(!dkcobj.setSubkeys(keys.TOKEN_USER_TOP_KEY, subkeylist)){					// update subkey -> "yrn:yahoo::::token:user"
				r3logger.elog('could not update subkey under ' + keys.TOKEN_USER_TOP_KEY + ' key, but continue...');
				dkcobj.clean();
				callback(false);
				return;
			}
		}
	}

	dkcobj.clean();
	callback(true);
}

//---------------------------------------------------------
// cleanup role by token
//---------------------------------------------------------
//	utility local function
//
// [NOTE]
// This process can be time consuming when subkey list is too many.
// In that case, there is a possibility that the consistency of the subkey will be lost.
// If a new token is added to the subkey list during processing with this function, that 
// token subkey will be overwritten(lost) when this function completes processing.
// Originally, this subkey list of "yrn:yahoo::::token:role" key has no direct use, so this
// is not a problem. Because it normally reads the sub key(token key) directly.
// Please do not read subkey(token key) from the subkey list of "yrn:yahoo::::token:role" key.
// This subkeys are only useful for "notes".
//
function rawCleanupRoleToken(callback)
{
	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	if(!apiutil.isSafeEntity(dkcobj)){
		callback(false);
		return;
	}

	var	keys			= r3keys();
	var	subkeylist		= dkcobj.getSubkeys(keys.TOKEN_ROLE_TOP_KEY, true);					// get subkeys under "yrn:yahoo::::token:role"
	var	is_changed		= false;
	var	newsubkeylist	= new Array(0);
	for(var cnt = 0; cnt < subkeylist.length; ++cnt){
		var	value = dkcobj.getValue(subkeylist[cnt], null, true, null);
		if(!apiutil.isSafeStrings(value)){
			is_changed	= true;
		}else{
			newsubkeylist.push(subkeylist[cnt]);
		}
	}
	if(false === is_changed){
		dkcobj.clean();
		callback(true);
		return;
	}
	if(!dkcobj.setSubkeys(keys.TOKEN_ROLE_TOP_KEY, newsubkeylist)){							// add subkeys -> yrn:yahoo::::token:role
		r3logger.elog('could not update subkeys(tokens) under ' + keys.TOKEN_ROLE_TOP_KEY + ' key');
		dkcobj.clean();
		callback(false);
		return;
	}
	dkcobj.clean();
	callback(true);
}

//---------------------------------------------------------
// get tenant list by token
//---------------------------------------------------------
//	result		{user: xxx, tenant: xxxx, region: xxxxx}
//
//	[NOTE]		Must initialize User/Tenant before calling this function.
//
function rawGetUserTenantByToken(token)
{
	if(!apiutil.isSafeStrings(token)){
		r3logger.elog('token parameters are wrong : token=' + JSON.stringify(token));
		return null;
	}

	var	dkcobj					= k2hr3.getK2hdkc(true, false);								// use permanent object(need to clean)
	if(!apiutil.isSafeEntity(dkcobj)){
		return null;
	}

	//
	// Get subkeys under token top key
	//
	var	keys					= r3keys();
	var	token_value_key			= keys.TOKEN_USER_TOP_KEY + '/' + token;					// "yrn:yahoo::::token:user/<token>"

	// get token key under user key
	var	user_token_key			= dkcobj.getValue(token_value_key, null, true, null);		// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	if(!apiutil.isSafeString(user_token_key)){
		r3logger.dlog('token key(' + token_value_key + ') for token(' + token + ') is not existed.');
		dkcobj.clean();
		//
		// check and remove old token under token top key("yrn:yahoo::::token:user" and "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>")
		// if old token is expired
		//
		// [NOTE]
		// This processing is taking time, so it runs asynchronously.
		// And for notes on this processing, refer to NOTE of rawCleanupUserToken function.
		//
		rawCleanupUserToken(function(result)
		{
			if(!result){
				r3logger.wlog('Failed to cleanup expired user tokens under ' + keys.TOKEN_USER_TOP_KEY + ' key, but continue...');
			}
		});
		return null;
	}

	// get user token key's value which is region
	var	region = dkcobj.getValue(user_token_key, null, true, null);							// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>" value is region
	if(!apiutil.isSafeString(region)){
		r3logger.dlog('token key(' + user_token_key + ') for token(' + token + ') is not existed.');
		dkcobj.clean();
		//
		// check and remove old token under token top key("yrn:yahoo::::token:user" and "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>")
		// if old token is expired
		//
		// [NOTE] look forwards
		//
		rawCleanupUserToken(function(result)
		{
			if(!result){
				r3logger.wlog('Failed to cleanup expired user tokens under ' + keys.TOKEN_USER_TOP_KEY + ' key, but continue...');
			}
		});
		return null;
	}

	// user_token_key format is "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	var	pattern		= new RegExp('^' + keys.MATCH_ANY_USER_TOKEN);							// regex = /^yrn:yahoo::::user:(.*):tenant/(.*)/token/(.*)/
	var	matches		= user_token_key.match(pattern);										// reverse to user/tenant names
	if(apiutil.isEmptyArray(matches) || matches.length < 4 || '' === apiutil.getSafeString(matches[1])){
		r3logger.elog('token key(' + token_value_key + ') for token(' + token + ') has wrong format value(' + user_token_key + ')');
		dkcobj.clean();
		return null;
	}
	var	username	= apiutil.getSafeString(matches[1]);
	var	tenantname	= apiutil.getSafeString(matches[2]);
	if('' === tenantname){
		tenantname	= null;
	}

	// if token has seed, need to check seed
	var	user_token_seed_key = user_token_key + '/' + keys.SEED_KW;							// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"
	var	token_seed			= dkcobj.getValue(user_token_seed_key, null, true, null);
	dkcobj.clean();

	if(apiutil.isSafeString(token_seed)){
		// token has seed, then we need to check manually.
		//
		//r3logger.dlog('token key(' + user_token_key + ') has seed.');

		var	vres = osapi.verifyUserToken(username, tenantname, token, token_seed);
		if(!vres.result){
			r3logger.elog('failed to verify token(' + token + ') with seed by ' + vres.message);
			return null;
		}
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	result	= {
					user:	username,
					tenant:	tenantname,
					region:	region
				  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	return result;
}

//---------------------------------------------------------
// get tenant list by user
//---------------------------------------------------------
//	result		[
//					{
//						name:		"tenant name",				=> tenant name which is "key" in k2hdkc
//						display:	"display tenant name"		=> display alias name for tenant
//					},
//					...
//				]
//
//	[NOTE]		Must initialize User/Tenant before calling this function.
//
function rawGetTenantListByUserWithDkc(dkcobj_permanent, user)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('dkcobj_parameters are wrong : dkcobj_permanent=' + JSON.stringify(dkcobj_permanent));
		return null;
	}
	if(!apiutil.isSafeStrings(user)){
		r3logger.elog('user parameters are wrong : user=' + JSON.stringify(user));
		return null;
	}

	//
	// Get subkeys under token top key
	//
	var	keys			= r3keys(user);
	var	subkeylist		= dkcobj_permanent.getSubkeys(keys.USER_TENANT_TOP_KEY, true);		// get subkeys from "yrn:yahoo::::user:<user>:tenant"

	// remove no tenant key in tenant subkey list
	if(apiutil.removeStringFromArray(subkeylist, keys.USER_TENANT_COMMON_KEY)){				// remove "yrn:yahoo::::user:<user>:tenant/"
		r3logger.dlog('found ' + keys.USER_TENANT_COMMON_KEY + ' subkey in ' + keys.USER_TENANT_TOP_KEY + ' = user(' + user + ') tenant top key');
	}else{
		r3logger.dlog('not found ' + keys.USER_TENANT_COMMON_KEY + ' subkey in ' + keys.USER_TENANT_TOP_KEY + ' = user(' + user + ') tenant top key');
	}
	if(apiutil.isEmptyArray(subkeylist)){
		r3logger.wlog('There is no tenant for user(' + user + ')');
		return null;
	}

	// modify tenant name from yrn full path to only tenant name
	var	pattern				= new RegExp('^' + keys.USER_TENANT_COMMON_KEY + '(.*)');		// regex = /^yrn:yahoo::::user:<user>\:tenant\/(.*)/
	var	name_list			= new Array(0);
	for(var cnt = 0; cnt < subkeylist.length; ++cnt){
		var	tenant_matches	= subkeylist[cnt].match(pattern);								// reverse to tenant name
		if(!apiutil.isEmptyArray(tenant_matches) && 2 <= tenant_matches.length && '' !== apiutil.getSafeString(tenant_matches[1])){
			name_list.push(apiutil.getSafeString(tenant_matches[1]));
		}
	}
	if(apiutil.isEmptyArray(name_list)){
		r3logger.wlog('There is no tenant for user(' + user + ')');
		return null;
	}

	// get display name for each tenant
	var	tenant_list			= new Array(0);
	for(cnt = 0; cnt < name_list.length; ++cnt){
		var	tenant_keys		= r3keys(user, name_list[cnt]);
		var	display_name	= dkcobj_permanent.getValue(tenant_keys.TENANT_DISP_KEY, null, true, null);
		if(!apiutil.isSafeEntity(display_name)){
			display_name = '';
		}
		tenant_list.push({
			name:			name_list[cnt],
			display:		display_name
		});
	}

	return tenant_list;
}

//	result		[
//					{
//						name:		"tenant name",				=> tenant name which is "key" in k2hdkc
//						display:	"display tenant name"		=> display alias name for tenant
//					},
//					...
//				]
//
//	[NOTE]		Must initialize User/Tenant before calling this function.
//
function rawGetTenantListByUser(user)
{
	var	dkcobj	= k2hr3.getK2hdkc(true, false);								// use permanent object(need to clean)
	if(!apiutil.isSafeEntity(dkcobj)){
		return null;
	}
	var	result	= rawGetTenantListByUserWithDkc(dkcobj, user);
	dkcobj.clean();
	return result;
}

// 
// Initialize tenant list by unscoped user token
// 
function rawInitializeTenantListByUnscoped(unscopedtoken, username, callback)
{
	var	error;
	if(!apiutil.isSafeStrings(unscopedtoken, username)){
		error = new Error('unscopedtoken or username parameters are wrong');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// user id from user name
	var	user_info = k2hr3.getUserId(username);					// user id from user name
	if(null === user_info || !apiutil.isSafeEntity(user_info.name) || !apiutil.isSafeEntity(user_info.id)){
		error = new Error('could not find username(' + username + ') from unscoped token in k2hdkc.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// get scoped user token
	return rawInitializeTenantListByToken(unscopedtoken, user_info.name, user_info.id, callback);
}

// 
// Initialize tenant list
// 
function rawInitializeTenantListByToken(unscopedtoken, username, userid, callback)
{
	if(!apiutil.isSafeStrings(unscopedtoken, username, userid)){
		var	error = new Error('unscopedtoken or username or userid parameters are wrong');
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	var	_unscopedtoken	= unscopedtoken;
	var	_username		= username;
	var	_userid			= userid;
	var	_callback		= callback;

	// get tenant list for check
	osapi.getUserTenantList(_unscopedtoken, _userid, function(err, jsonres)
	{
		var	error;
		if(null !== err){
			error = new Error('could not get tenant list for user ' + _username + '(token=' + _unscopedtoken + ') by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		//r3logger.dlog('get user tenant list jsonres=\n' + JSON.stringify(jsonres));

		// check tenants(and initialize tenants)
		var	_name_list		= new Array(0);
		var	_tenant_list	= new Array(0);
		for(var cnt = 0; cnt < jsonres.length; ++cnt){
			if(!apiutil.isSafeEntity(jsonres[cnt])){
				continue;
			}
			// over write
			var	resobj = k2hr3.initUserTenant(_username, _userid, _username, jsonres[cnt].name, jsonres[cnt].id, jsonres[cnt].description, jsonres[cnt].display);
			if(!resobj.result){
				error = new Error(resobj.message);
				r3logger.elog(error.message);
				_callback(error, null);
				return;
			}

			_name_list.push(jsonres[cnt].name);
			_tenant_list.push({
				name:		jsonres[cnt].name,
				display:	jsonres[cnt].display
			});
		}
		// check and remove old tenant for user
		if(!k2hr3.removeComprehensionByNewTenants(_username, _name_list)){
			r3logger.elog('failed to remove some tenant for user, but continue...');
		}

		// succeed
		_callback(null, _tenant_list);
		return;
	});
}

function rawCheckTenantInTenantList(tenants, tenant)
{
	if(apiutil.isEmptyArray(tenants) || (!apiutil.isSafeString(tenant) && isNaN(tenant))){
		return false;
	}
	for(var cnt = 0; cnt < tenants.length; ++cnt){
		if(!apiutil.isSafeString(tenants[cnt].name) && isNaN(tenants[cnt].name)){
			continue;
		}
		if(String(tenants[cnt].name).trim().toLowerCase() === String(tenant).trim().toLowerCase()){
			// found
			return true;
		}
	}
	return false;
}

//---------------------------------------------------------
// Check Token Automatically
//---------------------------------------------------------
// req			:	request from http(s)
// is_scoped	:	check scoped token(default not scoped check)
// is_user		:	= true	: token must be user token
//					= false	: token must be role token
//					= other	: both token type is allowed, automatically checking.
//
// result		:	{
//						result:		true/false
//						message:	null or error message string
//						status:		status code
//						token:		undefined(error) or token string
//						token_type;	undefined(error) or "user" or "role"
//						token_info:	undefined(error) or token information object
// 					}
//
// token is following:
//					{
//						role:		role name
//						user:		null or user name
//						hostname:	null or host name
//						ip:			null or host ip address
//						port:		port number(if host is existed), 0 means any
//						tenant:		tenant name
//						scoped:		role token is always scoped(true)
//					}

function rawCheckToken(req, is_scoped, is_user)
{
	var	resobj = {result: true, status: 200, message: null};

	if(!apiutil.isSafeEntity(req)){
		resobj.result	= false;
		resobj.message	= 'POST body does not have policy data';
		resobj.status	= 400;								// 400: Bad Request
		r3logger.elog(resobj.message);
		return resobj;
	}
	if('boolean' !== typeof is_scoped){
		is_scoped = false;									// default no scope check
	}
	var	user_type = true;
	var	role_type = true;
	if('boolean' === typeof is_user){
		if(is_user){
			role_type = false;
		}else{
			user_type = false;
		}
	}

	//------------------------------
	// check token
	//------------------------------
	var	token;
	var	token_type;
	var	token_info;
	if(rawIsRoleAuthToken(req)){
		// Get IP address
		var	ip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(ip)){
			resobj.result	= false;
			resobj.message	= 'Could not get client ip address from request';
			resobj.status	= 401;								// 401: Unauthorized
			r3logger.elog(resobj.message);
			return resobj;
		}
		// Token is ROLE
		if(!role_type){
			resobj.result	= false;
			resobj.message	= 'x-auth-token header token is not role token';
			resobj.status	= 400;								// 400: Bad Request
			r3logger.elog(resobj.message);
			return resobj;
		}
		// get token
		token = rawGetAuthTokenHeader(req, true);
		if(null === token){
			resobj.result	= false;
			resobj.message	= 'There is no x-auth-token header';
			resobj.status	= 400;								// 400: Bad Request
			r3logger.elog(resobj.message);
			return resobj;
		}
		// get token information
		//
		// [NOTE]
		// we set always ip address to token(and role/hosts) value now.
		// then we do not need to convert ip to hostname here.
		//
		token_info = rawCheckRoleToken(token, ip);
		if(null === token_info || !apiutil.isSafeEntity(token_info.role)){
			resobj.result	= false;
			resobj.message	= 'token(' + token + ') is not existed, because it is expired or not set yet.';
			resobj.status	= 401;								// 401: Unauthorized
			r3logger.elog(resobj.message);
			return resobj;

		}else if(is_scoped && !token_info.scoped){
			resobj.result	= false;
			resobj.message	= 'token(' + token + ') is not scoped.';
			resobj.status	= 401;								// 401: Unauthorized
			r3logger.elog(resobj.message);
			return resobj;
		}
		token_type = 'role';

	}else{
		// Token is USER
		if(!user_type){
			resobj.result	= false;
			resobj.message	= 'x-auth-token header token is not user token';
			resobj.status	= 400;								// 400: Bad Request
			r3logger.elog(resobj.message);
			return resobj;
		}
		// get token
		token = rawGetAuthTokenHeader(req, false);
		if(null === token){
			resobj.result	= false;
			resobj.message	= 'There is no x-auth-token header';
			resobj.status	= 400;								// 400: Bad Request
			r3logger.elog(resobj.message);
			return resobj;
		}
		// get token information
		token_info = rawCheckUserToken(token);
		if(null === token_info || !apiutil.isSafeEntity(token_info.user)){
			resobj.result	= false;
			resobj.message	= 'token(' + token + ') is not existed, because it is expired or not set yet.';
			resobj.status	= 401;								// 401: Unauthorized
			r3logger.elog(resobj.message);
			return resobj;

		}else if(is_scoped && !token_info.scoped){
			resobj.result	= false;
			resobj.message	= 'token(' + token + ') is not scoped.';
			resobj.status	= 401;								// 401: Unauthorized
			r3logger.elog(resobj.message);
			return resobj;
		}
		token_type = 'user';
	}

	resobj.token		= token;
	resobj.token_type	= token_type;
	resobj.token_info	= token_info;

	return resobj;
}

//---------------------------------------------------------
// Parse Token from X-Auth-Token header in request
//---------------------------------------------------------
function rawHasAuthTokenHeader(req)
{
	if(	apiutil.isSafeEntity(req) &&
		apiutil.isSafeEntity(req.headers) &&
		apiutil.isSafeEntity(req.headers['x-auth-token']) )
	{
		return true;
	}
	return false;
}

function rawGetAuthTokenHeader(req, is_role)
{
	if('boolean' !== typeof is_role){
		is_role = false;
	}
	if(	apiutil.isSafeEntity(req) &&
		apiutil.isSafeEntity(req.headers) &&
		apiutil.isSafeEntity(req.headers['x-auth-token']) &&
		apiutil.isSafeString(req.headers['x-auth-token']) )
	{
		var	token = req.headers['x-auth-token'];
		if(is_role){
			if(0 !== token.indexOf('R=')){
				return null;
			}
			token = token.substr(2);														// cut 'R='
		}else{
			if(0 === token.indexOf('U=')){
				token = token.substr(2);													// cut 'U='
			}
		}
		return token;
	}
	return null;
}

function rawIsUserAuthToken(req)
{
	if(	apiutil.isSafeEntity(req) &&
		apiutil.isSafeEntity(req.headers) &&
		apiutil.isSafeEntity(req.headers['x-auth-token']) &&
		apiutil.isSafeString(req.headers['x-auth-token']) )
	{
		var	token = req.headers['x-auth-token'];
		if(-1 === token.indexOf('U=')){														// user token has 'U='
			return true;
		}else if(-1 === token.indexOf('R=')){
			return true;																	// user token does not have any prefix
		}
	}
	return false;
}

function rawIsRoleAuthToken(req)
{
	if(	apiutil.isSafeEntity(req) &&
		apiutil.isSafeEntity(req.headers) &&
		apiutil.isSafeEntity(req.headers['x-auth-token']) &&
		apiutil.isSafeString(req.headers['x-auth-token']) )
	{
		var	token = req.headers['x-auth-token'];
		if(0 === token.indexOf('R=')){
			return true;																	// role token has 'R='
		}
	}
	return false;
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.getUserToken = function(user, passwd, tenant, callback)
{
	return rawGetUserToken(user, passwd, tenant, callback);
};

exports.getScopedUserToken = function(unscopedtoken, username, tenant, callback)
{
	return rawGetScopedUserTokenByUnscoped(unscopedtoken, username, tenant, callback);
};

exports.removeScopedUserToken = function(token)
{
	return rawRemoveScopedUserToken(token);
};

exports.checkUserToken = function(token)
{
	return rawCheckUserToken(token);
};

exports.getRoleTokenByUser = function(user, tenant, base_id, role, expire_limit)
{
	return rawGetRoleTokenByUser(user, tenant, base_id, role, expire_limit);
};

exports.getRoleTokenByIP = function(ip, port, cuk, tenant, role, expire_limit)
{
	return rawGetRoleTokenByIP(ip, port, cuk, tenant, role, expire_limit);
};

exports.removeRoleTokenByUser = function(token, user, tenant)
{
	return rawRemoveRoleToken(token, user, tenant, null);
};

exports.removeRoleTokenByIP = function(token, ip)
{
	return rawRemoveRoleToken(token, null, null, ip);
};

exports.checkRoleToken = function(token, ip)
{
	return rawCheckRoleToken(token, ip);
};

exports.getTenantListWithDkc = function(dkcobj_permanent, user)
{
	return rawGetTenantListByUserWithDkc(dkcobj_permanent, user);
};

exports.getTenantList = function(user)
{
	return rawGetTenantListByUser(user);
};

exports.initializeTenantList = function(unscopedtoken, username, callback)
{
	return rawInitializeTenantListByUnscoped(unscopedtoken, username, callback);
};

exports.checkTenantInTenantList = function(tenants, tenant)
{
	return rawCheckTenantInTenantList(tenants, tenant);
};

exports.hasAuthTokenHeader = function(req)
{
	return rawHasAuthTokenHeader(req);
};

exports.getAuthTokenHeader = function(req, is_role)
{
	return rawGetAuthTokenHeader(req, is_role);
};

exports.isUserAuthToken = function(req)
{
	return rawIsUserAuthToken(req);
};

exports.isRoleAuthToken = function(req)
{
	return rawIsRoleAuthToken(req);
};

exports.checkToken = function(req, is_scoped, is_user)
{
	return rawCheckToken(req, is_scoped, is_user);
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
