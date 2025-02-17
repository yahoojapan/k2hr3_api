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
 * CREATE:   Mon Sep 11 2017
 * REVISION:
 *
 */

'use strict';

var express	= require('express');
var router	= express.Router();

var	r3token	= require('../lib/k2hr3tokens');
var	apiutil	= require('../lib/k2hr3apiutil');
var	resutil	= require('../lib/k2hr3resutil');
var	k2hr3	= require('../lib/k2hr3dkc');
var	r3keys	= require('../lib/k2hr3keys').getK2hr3Keys;

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Common Utility function
//
function rawGetChildrenList(req, expand)
{
	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
	{
		result = {
			result: 	false,
			message:	'GET/HEAD request or url is wrong',
			status:		400										// 400: Bad Request
		};
		return result;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		return token_result;
	}
	var	token_info	= token_result.token_info;
	var	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// parse uri
	//------------------------------
	var	requestptn	= new RegExp('^/v1/list/(.*)');						// regex = /^\/v1\/list\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'GET/HEAD request url does not have list type{role, resource, policy}',
			status:		400										// 400: Bad Request
		};
		return result;
	}

	// parse type & path
	var	_pos		= reqmatchs[1].indexOf('/');
	var	_firstpath	= null;
	var	_secondpath	= null;
	var	_type		= null;
	var	_path		= null;
	var	_service	= null;

	if(-1 !== _pos){
		_firstpath	= reqmatchs[1].substr(0, _pos);
		_secondpath	= reqmatchs[1].substr(_pos + 1);
	}else{
		_firstpath	= reqmatchs[1];
	}
	// check
	if(apiutil.compareCaseString(keys.TYPE_ROLE, _firstpath)){
		_type	= keys.TYPE_ROLE;
		_path	= _secondpath;
	}else if(apiutil.compareCaseString(keys.TYPE_RESOURCE, _firstpath)){
		_type	= keys.TYPE_RESOURCE;
		_path	= _secondpath;
	}else if(apiutil.compareCaseString(keys.TYPE_POLICY, _firstpath)){
		_type	= keys.TYPE_POLICY;
		_path	= _secondpath;											// should be empty
	}else if(apiutil.compareCaseString(keys.TYPE_SERVICE, _firstpath)){
		_type 	= keys.TYPE_SERVICE;

	}else if(apiutil.isSafeString(_secondpath)){
		// try to check firstpath is service name
		var	_thirdpath	= null;
		_pos			= _secondpath.indexOf('/');
		if(-1 !== _pos){
			_thirdpath	= _secondpath.substr(_pos + 1);
			_secondpath	= _secondpath.substr(0, _pos);
		}
		_service		= _firstpath.toLowerCase();

		if(apiutil.compareCaseString(keys.TYPE_ROLE, _secondpath)){
			_type	= keys.TYPE_ROLE;
			_path	= _thirdpath;
		}else if(apiutil.compareCaseString(keys.TYPE_RESOURCE, _secondpath)){
			_type	= keys.TYPE_RESOURCE;
			_path	= _thirdpath;
		}else if(apiutil.compareCaseString(keys.TYPE_POLICY, _secondpath)){
			_type	= keys.TYPE_POLICY;
			_path	= _thirdpath;										// should be empty
		}else{
			result = {
				result: 	false,
				message:	'GET/HEAD request url has wrong list type, it must be "service/role" or "service/resource" or "service/policy"',
				status:		400									// 400: Bad Request
			};
			return result;
		}

	}else{
		result = {
			result: 	false,
			message:	'GET/HEAD request url has wrong list type, it must be "role" or "resource" or "policy" or "service"',
			status:		400										// 400: Bad Request
		};
		return result;
	}

	//------------------------------
	// expand type(only user token type)
	//------------------------------
	var	is_expand = false;
	if(undefined === expand && 'boolean' === typeof expand){
		// Case for HEAD
		is_expand = expand;

	}else if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.expand)){
		if(apiutil.compareCaseString(keys.VALUE_TRUE, req.query.expand)){
			is_expand = true;
		}else if(apiutil.compareCaseString(keys.VALUE_FALSE, req.query.expand)){
			is_expand = false;
		}else{
			result = {
				result: 	false,
				message:	'GET/HEAD expand url argument parameter(' + JSON.stringify(req.query.expand) + ') is wrong, it must be ' + keys.VALUE_TRUE + ' or ' + keys.VALUE_FALSE + '.',
				status:		400									// 400: Bad Request
			};
			return result;
		}
	}

	//------------------------------
	// get children list
	//------------------------------
	result = k2hr3.getChildrenList(token_info.tenant, _service, _type, _path, is_expand);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from getChildrenList',
				status:		400									// 400: Bad Request
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from getChildrenList';
			}
			result.status		= 400;									// 400: Bad Request(if children are not exists, but we should get empty object.)
		}
		return result;
	}
	return result;
}

//
// Mountpath					: '/v1/list/{role, resource, policy, service}{/...}'
// 								: '/v1/list/<service>/{role, resource, policy}{/...}'
//
// GET '/v1/list/.../{path}'	: get list on version 1
// HEADER						: X-Auth-Token	= User token
// URL arguments				: expand		= "true"(default) or "false"
//
// response body				: result		=> true/false
//								  message		=> error message
//								  object		=> nested objects...
//
router.get('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	//
	// get children list
	//
	var	result = rawGetChildrenList(req);
	if(!result.result){
		r3logger.elog(result.message);
		var	_status = result.status;
		delete result.status;
		resutil.errResponse(req, res, _status, result);
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(200);										// 200: OK
	res.send(JSON.stringify(result));
});

//
// Mountpath					: '/v1/list/{role, resource, policy, service}{/...}'
// 								: '/v1/list/<service>/{role, resource, policy}{/...}'
//
// HEAD '/v1/list/.../{path}'	: get list on version 1
// HEADER						: X-Auth-Token	= User token
// URL arguments				: expand		= "true"(default) or "false"
//
router.head('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	if('HEAD' !== req.method){
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	//
	// get children list
	//
	var	result = rawGetChildrenList(req, false);			// Force set expand as false
	if(!result.result){
		r3logger.elog(result.message);
		var	_status = result.status;
		delete result.status;
		resutil.errResponse(req, res, _status);
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(204);										// 204: No Content
	res.send(JSON.stringify(result));
});

module.exports = router;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
