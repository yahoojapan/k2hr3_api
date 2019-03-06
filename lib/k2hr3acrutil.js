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
 * CREATE:   Fri Oct 27 2017
 * REVISION:
 *
 */

'use strict';

var	https		= require('https');
var	http		= require('http');
var	cacerts		= require('../lib/cacerts');
var	r3token		= require('./k2hr3tokens');
var	apiutil		= require('./k2hr3apiutil');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//---------------------------------------------------------
// Common send verify request
//---------------------------------------------------------
//
// Send and Get response from verify URL
//
// Inputs
//	scopedtoken						:	scoped user token
//	urlobj							:	url object built by apiutil.parseUrl()
//	callback(error, response)		:	callback function received response data
//
// Response							:	following formatted array
//
// Ex.) Response format from verify url
//
//	response body	= [				:	undefined/null or resource array(if one element, allows only it not array)
//		{
//			name					:	resource name which is key name(path) for resource
//			expire					:	undefined/null or integer
//			type					:	resource data type(string or object), if date is null or '', this value must be string.
//			data					:	resource data which must be string or object or null/undefined.
//			keys = {				:	resource has keys(associative array), or null/undefined.
//				'foo':	bar,		:		any value is allowed
//				...					:
//			}						:
//		},
//		...
//	]
//
function rawACRSendVerifyEx(scopedtoken, urlobj, callback)
{
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	var	_callback = callback;

	if(!apiutil.isSafeString(scopedtoken) || !apiutil.isSafeEntity(urlobj)){
		var	error = new Error('some parameters are wrong : scopedtoken=' + JSON.stringify(scopedtoken) + ', urlobj=' + JSON.stringify(urlobj));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
						'X-Auth-Token':		scopedtoken							// [NOTE] this token string does not have 'U=' prefix.
					  };
	var	options		= {
						'host':				apiutil.getSafeString(urlobj.host),
						'port':				urlobj.port,
						'path': 			apiutil.getSafeString(urlobj.path),
						'method':			'GET',
						'headers':			headers
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	var	agent;
	if(urlobj.https){
		if(null !== cacerts.ca){
			options.ca	= cacerts.ca;
		}
		options.agent	= new https.Agent(options);
		agent			= https;
	}else{
		agent			= http;
	}

	// send request
	var	req	= agent.request(options, function(res)
	{
		var	_body	= '';
		var	_status	= res.statusCode;
		var	_headers= res.headers;

		r3logger.dlog('verify response status: ' + _status);
		r3logger.dlog('verify response header: ' + JSON.stringify(_headers));
		res.setEncoding('utf8');

		res.on('data', function(chunk)
		{
			//r3logger.dlog('verify response chunk: ' + chunk);
			_body += chunk;
		});

		res.on('end', function(result)											// eslint-disable-line no-unused-vars
		{
			var	_error = null;
			if(300 <= _status){
				_error = new Error('got error response for verify request by status=' + String(_status));
				r3logger.elog(_error.message);
				_callback(_error, null);
				return;
			}
			//r3logger.dlog('response body: ' + _body);

			// check response body
			var	resobj = null;
			if(!apiutil.isSafeString(_body)){
				_error = new Error('verify resource is not json string : response(json) =' + JSON.stringify(_body));
			}else{
				// check response string(json)
				resobj = _body;
				if(apiutil.checkSimpleJSON(_body)){
					resobj = JSON.parse(_body);
				}
				if(!apiutil.isArray(resobj)){
					_error = new Error('verify resource is not array : response(object) =' + JSON.stringify(resobj));
				}else{
					// check each object in array
					var	namemap	= {};
					for(var cnt = 0; cnt < resobj.length; ++cnt){
						// check name field
						if(!apiutil.isSafeString(resobj[cnt].name)){
							_error = new Error('empty resource name in verify response is found : response pos=' + cnt);
							break;
						}
						if(apiutil.isSafeEntity(namemap[resobj[cnt].name])){
							_error = new Error('same resource name in verify response is found : response pos=' + cnt + ', name=' + JSON.stringify(resobj[cnt].name));
							break;
						}
						namemap[resobj[cnt].name] = true;						// set any value.

						// check expire field
						if(!apiutil.isSafeEntity(resobj[cnt].expire) && isNaN(resobj[cnt].expire)){
							_error = new Error('wrong expire value in verify response is found : response pos=' + cnt + ', expire=' + JSON.stringify(resobj[cnt].expire));
							break;
						}
						if(!apiutil.isSafeEntity(resobj[cnt].expire)){
							resobj[cnt].expire = -1;							// set no expire
						}else{
							resobj[cnt].expire = parseInt(resobj[cnt].expire);	// overwrite integer value
						}
					}
				}
			}
			if(null !== _error){
				r3logger.elog(_error.message);
				_callback(_error, null);
				return;
			}

			// return response
			_callback(null, resobj);
			return;
		});
	});
	req.on('error', function(exception) {
		r3logger.elog('problem with verify request: ' + exception.message);
		_callback(exception, null);
		return;
	});
	req.end();
}

//---------------------------------------------------------
// Send verify request
//---------------------------------------------------------
//
// Send and Get response from verify URL
//
// Inputs
//	user							:	user name
//	passwd							:	pass phrase for user
//	tenant							:	tenant name for scoped
//	verifyurl						:	verify url(allow not url string, it means static value formatted JSON)
//	callback(error, response)		:	callback function received response data
//
// Response							:	see rawACRSendVerifyEx()
//
function rawACRSendVerifyByUser(user, passwd, tenant, verifyurl, callback)
{
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	var	error		= null;
	var	_callback	= callback;

	var	_user		= user;
	var	_passwd		= passwd;
	var	_tenant		= tenant;

	if(!apiutil.isSafeEntity(verifyurl)){
		error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(apiutil.checkSimpleJSON(verifyurl)){
		// verifyurl is formatted by JSON, it means static value.
		_callback(null, JSON.parse(verifyurl));
		return;
	}
	var	urlobj		= apiutil.parseUrl(verifyurl);						// parse verify url string to url obejct.
	if(null === urlobj){
		error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(!apiutil.isSafeStrings(_user, _tenant)){
		error = new Error('some parameters are wrong : user=' + JSON.stringify(_user) + ', tenant=' + JSON.stringify(_tenant));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	// get scoped token directly.
	r3token.getUserToken(_user, _passwd, _tenant, function(err, token)
	{
		if(null !== err){
			var	error = new Error('could not get scoped user token for user=' + _user + ', tenant=' + _tenant + ' by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
		}
		r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

		// call verify url
		rawACRSendVerifyEx(token, urlobj, _callback);
	});
}

//---------------------------------------------------------
// Send verify request
//---------------------------------------------------------
//
// Send and Get response from verify URL
//
// Inputs
//	unscopedtoken					:	unscoped user token
//	user							:	user name
//	tenant							:	tenant name for scoped
//	verifyurl						:	verify url(allow not url string, it means static value formatted JSON)
//	callback(error, response)		:	callback function received response data
//
// Response							:	see rawACRSendVerifyEx()
//
function rawACRSendVerifyByUnscopedToken(unscopedtoken, user, tenant, verifyurl, callback)
{
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	var	error			= null;
	var	_callback		= callback;

	var	_unscopedtoken	= unscopedtoken;
	var	_user			= user;
	var	_tenant			= tenant;

	if(!apiutil.isSafeEntity(verifyurl)){
		error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(apiutil.checkSimpleJSON(verifyurl)){
		// verifyurl is formatted by JSON, it means static value.
		_callback(null, JSON.parse(verifyurl));
		return;
	}
	var	urlobj		= apiutil.parseUrl(verifyurl);
	if(null === urlobj){
		error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(!apiutil.isSafeStrings(_unscopedtoken, _user, _tenant)){
		error = new Error('some parameters are wrong : unscopedtoken=' + JSON.stringify(_unscopedtoken) + ', user=' + JSON.stringify(_user) + ', tenant=' + JSON.stringify(_tenant));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	// get scoped token from unscoped token
	r3token.getScopedUserToken(_unscopedtoken, _user, _tenant, function(err, token)
	{
		if(null !== err){
			var	error = new Error('could not get scoped user token for user=' + _user + ', tenant=' + _tenant + ' by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
		}
		r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

		// call verify url
		rawACRSendVerifyEx(token, urlobj, _callback);
	});
}

//---------------------------------------------------------
// Send verify request
//---------------------------------------------------------
//
// Send and Get response from verify URL
//
// Inputs
//	scopedtoken						:	scoped user token
//	verifyurl						:	verify url(allow not url string, it means static value formatted JSON)
//	callback(error, response)		:	callback function received response data
//
// Response							:	see rawACRSendVerifyEx()
//
function rawACRSendVerifyByScopedToken(scopedtoken, verifyurl, callback)
{
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	var	error			= null;
	var	_callback		= callback;
	var	_scopedtoken	= scopedtoken;

	if(!apiutil.isSafeEntity(verifyurl)){
		error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(apiutil.checkSimpleJSON(verifyurl)){
		// verifyurl is formatted by JSON, it means static value.
		_callback(null, JSON.parse(verifyurl));
		return;
	}
	var	urlobj		= apiutil.parseUrl(verifyurl);
	if(null === urlobj){
		error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(!apiutil.isSafeString(_scopedtoken)){
		error = new Error('parameter is wrong : scopedtoken=' + JSON.stringify(_scopedtoken));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	// parse token to get user/tenant
	var	_token_res	= r3token.checkUserToken(_scopedtoken);
	if(	null === _token_res						||
		!apiutil.isSafeString(_token_res.user)	||
		!apiutil.isSafeString(_token_res.tenant)||
		!apiutil.isSafeEntity(_token_res.scoped)||
		'boolean' !== typeof _token_res.scoped	||
		true !== _token_res.scoped				)
	{
		error = new Error('parameter scopedtoken(' + _scopedtoken + ' -> ' + JSON.stringify(_token_res) + ') is something wrong by ' + apiutil.getSafeString(_token_res.message));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	// get scoped token from unscoped token
	//
	// [NOTE]
	// getScopedUserToken is allowed scoped token when is has as same as tenant name specified.
	//
	r3token.getScopedUserToken(_scopedtoken, _token_res.user, _token_res.tenant, function(err, token)
	{
		if(null !== err){
			var	error = new Error('could not get scoped user token for user=' + _token_res.user + ', tenant=' + _token_res.tenant + ' by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
		}
		r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

		// call verify url
		rawACRSendVerifyEx(token, urlobj, _callback);
	});
}

//---------------------------------------------------------
// Send verify request for all pattern
//---------------------------------------------------------
//
// Send and Get response from verify URL
//
// Inputs
//	unscopedtoken					:	unscoped user token
//	user							:	user name
//	passwd							:	pass phrase for user
//	token							:	(un)scoped user token
//	tenant							:	tenant name for scoped
//	verifyurl						:	verify url(allow not url string, it means static value formatted JSON)
//	callback(error, response)		:	callback function received response data
//
// Response							:	see rawACRSendVerifyEx()
//
// [NOTE]
// This function automatically decides raw functions by parameters.
// 
//	1) no token
//		Both user and passwd parameters must be specified, and token must be null(undefined).
//	2) unscoped token
//		Both user and token parameters must be specified, and passwd must be null(undefined).
//		The token parameter should be "unscoped" user token.
//	3) scoped token
//		token parameter must be specified, and both user and passwd must be null(undefined).
//		The token parameter should be "scoped" user token.
//
function rawACRSendVerify(token, user, passwd, tenant, verifyurl, callback)
{
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	var	error		= null;
	var	_callback	= callback;

	// check pattern
	if(apiutil.isSafeString(user)){
		if(apiutil.isSafeString(token)){
			if(apiutil.isSafeEntity(passwd)){
				error = new Error('all parameters user(' + JSON.stringify(user) + ') and token(' + JSON.stringify(token) + ') and passwd(xxxxx) are specified.');
			}else{
				// case : user + unscoped token
				rawACRSendVerifyByUser(user, passwd, tenant, verifyurl, _callback);
			}
		}else{
			token = null;
			if(apiutil.isSafeEntity(passwd)){
				// case : user + passwd
			}else{
				// case : user + passwd(null)
				//
				// [NOTE]
				// This case is not error pattern, because empty passwd is allowed by some authorizing system.
			}
			rawACRSendVerifyByUnscopedToken(token, user, tenant, verifyurl, _callback);
		}
	}else{
		user = null;
		if(apiutil.isSafeString(token)){
			if(apiutil.isSafeEntity(passwd)){
				error = new Error('user parameter is empty, but passwd(xxxx) is specified.');
			}else{
				// case : scoped token
				rawACRSendVerifyByScopedToken(token, verifyurl, _callback);
			}
		}else{
			error = new Error('user parameter is empty, but scoped token is not specified.');
		}
	}
	if(null !== error){
		r3logger.elog(error.message);
		_callback(error, null);
	}
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.getACRVerifyByUser = function(user, passwd, tenant, verifyurl, callback)
{
	return rawACRSendVerifyByUser(user, passwd, tenant, verifyurl, callback);
};

exports.getACRVerifyByUnscopedToken = function(unscopedtoken, user, tenant, verifyurl, callback)
{
	return rawACRSendVerifyByUnscopedToken(unscopedtoken, user, tenant, verifyurl, callback);
};

exports.getACRVerifyByScopedToken = function(scopedtoken, verifyurl, callback)
{
	return rawACRSendVerifyByScopedToken(scopedtoken, verifyurl, callback);
};

exports.getACRSendVerify = function(token, user, passwd, tenant, verifyurl, callback)
{
	return rawACRSendVerify(token, user, passwd, tenant, verifyurl, callback);
};


/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
