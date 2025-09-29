/*
 * K2HR3 REST API
 *
 * Copyright 2017 Yahoo Japan Corporation.
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

import	* as https	from 'https';
import	* as http	from 'http';
import	r3token		from './k2hr3tokens';
import	apiutil		from './k2hr3apiutil';
import	r3logger	from './dbglogging';

import	{ ca }									from './cacerts';
import type	{ resTypeParseUrl }					from './k2hr3apiutil';
import type	{ valTypeAll }						from './types';
import type	{ ClientRequest, IncomingMessage  }	from 'http';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type resTypeACRVerifyResponseKeys = {
	[key: string]:	string | null;
};

type dkcTypeACRVerifyOneResponseBodyData = {
	name:			string;
	expire?:		number;
	type?:			string | null;
	data?:			valTypeAll;
	keys?:			resTypeACRVerifyResponseKeys;
	[key: string]:	valTypeAll | undefined;						// for the key name specified variable to access object members
};

//
// Callbacks
//
type cbTypeACRSendVerifyEx = (err: Error | null, result: dkcTypeACRVerifyOneResponseBodyData[] | null) => void;

//
// Type chekcer
//
const rawIsResTypeACRVerifyResponseKeys = (val: unknown): val is resTypeACRVerifyResponseKeys => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	for(const [, value] of Object.entries(val)){
		if(null !== value && !apiutil.isString(value)){
			return false;
		}
	}
	return true;
};

const rawIsDkcTypeACRVerifyOneResponseBodyData = (val: unknown): val is dkcTypeACRVerifyOneResponseBodyData => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	const _obj		= val as Record<string, unknown>;
	const _isName	= (key: string) => apiutil.isString(_obj[key]);
	const _isExpire	= (key: string) => 'undefined' === typeof _obj[key]	|| apiutil.isSafeNumber(_obj[key]);
	const _isType	= (key: string) => null === _obj[key]				|| apiutil.isString(_obj[key]);
	const _isData	= (key: string) => 'undefined' === typeof _obj[key]	|| apiutil.isValTypeAll(_obj[key]);
	const _isKeys	= (key: string) => 'undefined' === typeof _obj[key]	|| rawIsResTypeACRVerifyResponseKeys(_obj[key]);

	return (
		_isName('name')		&&
		_isExpire('expire')	&&
		_isType('data')		&&
		_isData('type')		&&
		_isKeys('keys')
	);
};

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
//		dkcTypeACRVerifyOneResponseBodyData = {
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
const rawACRSendVerifyEx = (
	scopedtoken:	string | null,
	urlobj:			resTypeParseUrl | null,
	callback:		cbTypeACRSendVerifyEx
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	const	_callback = callback;

	if(!apiutil.isSafeString(scopedtoken) || !apiutil.isSafeEntity(urlobj)){
		const	error = new Error('some parameters are wrong : scopedtoken=' + JSON.stringify(scopedtoken) + ', urlobj=' + JSON.stringify(urlobj));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		scopedtoken ?? undefined					// [NOTE] this token string does not have 'U=' prefix.
	};
	const	caCert	= (urlobj && urlobj.https) ? ca() : null;
	const	options = {
		'host':				apiutil.getSafeString(urlobj.host),
		'port':				urlobj.port,
		'path': 			apiutil.getSafeString(urlobj.path),
		'method':			'GET',
		'headers':			headers,
		'ca':				caCert ?? undefined
	};
	const	agent	= (urlobj && urlobj.https) ? https : http;

	r3logger.dlog('request options   = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	// send request
	const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void => {
		let		_body	= '';
		const	_status	= res.statusCode;
		const	_headers= res.headers;

		r3logger.dlog('verify response status: ' + _status);
		r3logger.dlog('verify response header: ' + JSON.stringify(_headers));
		res.setEncoding('utf8');

		res.on('data', (chunk: string) => {
			//r3logger.dlog('verify response chunk: ' + chunk);
			_body += chunk;
		});

		res.on('end', (): void => {
			let _error: Error | null							= null;
			let	resobj: dkcTypeACRVerifyOneResponseBodyData[]	= [];

			if(300 <= (_status ?? 500)){
				_error = new Error('got error response for verify request by status=' + String(_status ?? 0));
				r3logger.elog(_error.message);
				_callback(_error, null);
				return;
			}
			//r3logger.dlog('response body: ' + _body);

			// check response body
			if(!apiutil.isSafeString(_body)){
				_error = new Error('verify resource is not json string : response(json) =' + JSON.stringify(_body));
			}else{
				// check response string(json)
				if(apiutil.checkSimpleJSON(_body)){
					const tmp_resobj = JSON.parse(_body);
					if(apiutil.isArray(tmp_resobj)){
						if(tmp_resobj.every((element) => rawIsDkcTypeACRVerifyOneResponseBodyData(element))){
							resobj = tmp_resobj;
						}
					}
				}else if(apiutil.isArray(_body)){
					if(_body.every((element) => rawIsDkcTypeACRVerifyOneResponseBodyData(element))){
						resobj = _body;
					}
				}else if(rawIsDkcTypeACRVerifyOneResponseBodyData(_body)){	// This format is not officially permitted (maybe it should be removed)
					resobj = [_body];
				}

				if(!apiutil.isArray(resobj)){
					_error = new Error('verify resource is not array : response(object) =' + JSON.stringify(resobj));
				}else{
					// check each object in array
					const	namemap: { [key: string]: boolean } = {};
					for(let cnt = 0; cnt < resobj.length; ++cnt){
						// check name field
						if(!apiutil.isSafeString(resobj[cnt].name)){
							_error = new Error('empty resource name in verify response is found : response pos=' + cnt);
							break;
						}
						if(apiutil.isSafeEntity(namemap[resobj[cnt].name])){
							_error = new Error('same resource name in verify response is found : response pos=' + cnt + ', name=' + JSON.stringify(resobj[cnt].name));
							break;
						}
						namemap[resobj[cnt].name] = true;					// set any value.

						// check expire field
						if(!apiutil.isSafeEntity(resobj[cnt].expire)){
							resobj[cnt].expire = -1;						// set no expire
						}else if(!apiutil.isSafeNumber(resobj[cnt].expire)){
							_error = new Error('wrong expire value in verify response is found : response pos=' + cnt + ', expire=' + JSON.stringify(resobj[cnt].expire));
							break;
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
	req.on('error', (exception: Error) => {
		r3logger.elog('problem with verify request: ' + exception.message);
		_callback(exception, null);
		return;
	});
	req.end();
};

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
const rawACRSendVerifyByUser = (
	user:		string | null,
	passwd:		string | null,
	tenant:		string | null,
	verifyurl:	string | null,
	callback:	cbTypeACRSendVerifyEx
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	const	_callback	= callback;

	if(!apiutil.isSafeString(verifyurl)){
		const error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(apiutil.checkSimpleJSON(verifyurl)){
		// verifyurl is formatted by JSON, it means static value.
		_callback(null, JSON.parse(verifyurl));
		return;
	}
	const	urlobj	= apiutil.parseUrl(verifyurl);						// parse verify url string to url obejct.
	if(null === urlobj){
		const error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant)){
		const error = new Error('some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	const	_user		= user;
	const	_tenant		= tenant;
	const	_passwd		= passwd;

	// get scoped token directly.
	r3token.getUserToken(_user, _passwd, _tenant, (err: Error | null, token: string | null): void => {
		if(null !== err){
			const	error = new Error('could not get scoped user token for user=' + _user + ', tenant=' + _tenant + ' by ' + apiutil.getSafeString(err.message));
			r3logger.elog(error.message);
			_callback(error, null);
		}
		r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

		// call verify url
		rawACRSendVerifyEx(token, urlobj, _callback);
	});
};

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
const rawACRSendVerifyByUnscopedToken = (
	unscopedtoken:	string | null,
	user:			string | null,
	tenant:			string | null,
	verifyurl:		string | null,
	callback:		cbTypeACRSendVerifyEx
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	const	_callback	= callback;

	if(!apiutil.isSafeString(verifyurl)){
		const error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(apiutil.checkSimpleJSON(verifyurl)){
		// verifyurl is formatted by JSON, it means static value.
		_callback(null, JSON.parse(verifyurl));
		return;
	}
	const	urlobj	= apiutil.parseUrl(verifyurl);
	if(null === urlobj){
		const error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	if(!apiutil.isSafeString(unscopedtoken) || !apiutil.isSafeString(user) || !apiutil.isSafeString(tenant)){
		const error = new Error('some parameters are wrong : unscopedtoken=' + JSON.stringify(unscopedtoken) + ', user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	const	_unscopedtoken	= unscopedtoken;
	const	_user			= user;
	const	_tenant			= tenant;

	// get scoped token from unscoped token
	r3token.getScopedUserToken(_unscopedtoken, _user, _tenant, (err: Error | null, token: string | null): void => {
		if(null !== err){
			const	error = new Error('could not get scoped user token for user=' + _user + ', tenant=' + _tenant + ' by ' + apiutil.getSafeString(err.message));
			r3logger.elog(error.message);
			_callback(error, null);
		}
		r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

		// call verify url
		rawACRSendVerifyEx(token, urlobj, _callback);
	});
};

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
const rawACRSendVerifyByScopedToken = (
	scopedtoken:	string | null,
	verifyurl:		string | null,
	callback:		cbTypeACRSendVerifyEx
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	const	_callback	= callback;

	if(!apiutil.isSafeString(verifyurl)){
		const error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	if(apiutil.checkSimpleJSON(verifyurl)){
		// verifyurl is formatted by JSON, it means static value.
		_callback(null, JSON.parse(verifyurl));
		return;
	}
	const	urlobj	= apiutil.parseUrl(verifyurl);
	if(null === urlobj){
		const error = new Error('parameter is wrong : verifyurl=' + JSON.stringify(verifyurl));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	if(!apiutil.isSafeString(scopedtoken)){
		const error = new Error('parameter is wrong : scopedtoken=' + JSON.stringify(scopedtoken));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}
	const	_scopedtoken = scopedtoken;

	// parse token to get user/tenant
	const	_token_res	= r3token.checkUserToken(_scopedtoken);
	if(	null === _token_res						||
		!apiutil.isSafeString(_token_res.user)	||
		!apiutil.isSafeString(_token_res.tenant)||
		!apiutil.isSafeEntity(_token_res.scoped)||
		!apiutil.isBoolean(_token_res.scoped)	||
		true !== _token_res.scoped				)
	{
		const error = new Error('parameter scopedtoken(' + _scopedtoken + ' -> ' + JSON.stringify(_token_res) + ') is something wrong,');
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	// get scoped token from unscoped token
	//
	// [NOTE]
	// getScopedUserToken is allowed scoped token when is has as same as tenant name specified.
	//
	r3token.getScopedUserToken(_scopedtoken, _token_res.user, _token_res.tenant, (err: Error | null, token: string | null): void => {
		if(null !== err){
			const	error = new Error('could not get scoped user token for user=' + _token_res.user + ', tenant=' + _token_res.tenant + ' by ' + apiutil.getSafeString(err.message));
			r3logger.elog(error.message);
			_callback(error, null);
		}
		r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

		// call verify url
		rawACRSendVerifyEx(token, urlobj, _callback);
	});
};

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
const rawACRSendVerify = (
	token:		string | null,
	user:		string | null,
	passwd:		string | null,
	tenant:		string | null,
	verifyurl:	string | null,
	callback:	cbTypeACRSendVerifyEx
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	const	_callback			= callback;
	let		error: Error | null	= null;

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
};

//---------------------------------------------------------
// Export types
//---------------------------------------------------------
export const k2hr3acrutil = {
	getACRVerifyByUser:				 rawACRSendVerifyByUser,
	getACRVerifyByUnscopedToken:	 rawACRSendVerifyByUnscopedToken,
	getACRVerifyByScopedToken:		 rawACRSendVerifyByScopedToken,
	getACRSendVerify:				 rawACRSendVerify
};

export default k2hr3acrutil;

//
// Variables
//
export {
	resTypeACRVerifyResponseKeys,
	dkcTypeACRVerifyOneResponseBodyData
};

//
// Callbacks
//
export { cbTypeACRSendVerifyEx };

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
