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

import	apiutil				from '../lib/k2hr3apiutil';
import	resutil				from '../lib/k2hr3resutil';
import	k2hr3				from '../lib/k2hr3dkc';
import	r3tokens			from '../lib/k2hr3tokens';
import	r3logger			from '../lib/dbglogging';
import	express				from 'express';
import	{ getK2hr3Keys }	from '../lib/k2hr3keys';

import type { resTypeChildrenTree }				from '../lib/k2hr3dkc';
import type	{ Request, Response, NextFunction }	from 'express';

const	router	= express.Router();

//---------------------------------------------------------
// Router GET/HEAD
//---------------------------------------------------------
//
// Common Utility function
//
const rawGetChildrenList = (
	req:		Request,
	expand?:	boolean
): resTypeChildrenTree => {

	let	result: resTypeChildrenTree = {
		result: 	true,
		message:	null,
		status:		200
	};

	if(	!apiutil.isPlainObject(req) 		||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		result.result 	= false;
		result.message	= 'GET/HEAD request or url is wrong';
		result.status	= 400;										// 400: Bad Request
		return result;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);	// scoped, user token
	if(!token_result.result){
		result.result 	= token_result.result;
		result.message	= apiutil.getSafeString(token_result.message);
		result.status	= apiutil.isSafeNumber(token_result.status) ? token_result.status : 400;	// default : 400(Bad Request)
		return result;
	}

	const	token_info	= token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		result.result	= false;
		result.message	= 'specified wrong token or it is not scoped user token';
		result.status	= apiutil.isSafeNumber(token_result.status) ? token_result.status : 400;	// default : 400(Bad Request)
		return result;
	}
	const	keys		= getK2hr3Keys((apiutil.isString(token_info.user) ? token_info.user : null), (apiutil.isString(token_info.tenant) ? token_info.tenant : null));

	//------------------------------
	// parse uri
	//------------------------------
	const	requestptn	= new RegExp('^/v1/list/(.*)');				// regex = /^\/v1\/list\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result.result 	= false;
		result.message	= 'GET/HEAD request url does not have list type{role, resource, policy}';
		result.status	= 400;										// 400: Bad Request
		return result;
	}

	// parse type & path
	let	_pos						= reqmatchs[1].indexOf('/');
	let	_secondpath: string | null	= null;
	let	_path: string | null		= null;
	let	_service: string | null		= null;
	let	_firstpath: string | null;
	let	_type: string | null;

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
		_path	= _secondpath;										// should be empty
	}else if(apiutil.compareCaseString(keys.TYPE_SERVICE, _firstpath)){
		_type 	= keys.TYPE_SERVICE;
	}else if(null !== _secondpath && apiutil.isSafeString(_secondpath)){
		// try to check firstpath is service name
		let	_thirdpath: string | null	= null;
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
			_path	= _thirdpath;									// should be empty
		}else{
			result.result 	= false;
			result.message	= 'GET/HEAD request url has wrong list type, it must be "service/role" or "service/resource" or "service/policy"';
			result.status	= 400;									// 400: Bad Request
			return result;
		}
	}else{
		result.result 	= false;
		result.message	= 'GET/HEAD request url has wrong list type, it must be "role" or "resource" or "policy" or "service"';
		result.status	= 400;										// 400: Bad Request
		return result;
	}

	//------------------------------
	// expand type(only user token type)
	//------------------------------
	let	is_expand = false;
	if(apiutil.isBoolean(expand)){
		// Case for HEAD
		is_expand = expand;

	}else if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.expand)){
		if(apiutil.compareCaseString(keys.VALUE_TRUE, req.query.expand)){
			is_expand = true;
		}else if(apiutil.compareCaseString(keys.VALUE_FALSE, req.query.expand)){
			is_expand = false;
		}else{
			result.result 	= false;
			result.message	= 'GET/HEAD expand url argument parameter(' + JSON.stringify(req.query.expand as string) + ') is wrong, it must be ' + keys.VALUE_TRUE + ' or ' + keys.VALUE_FALSE + '.';
			result.status	= 400;									// 400: Bad Request
			return result;
		}
	}

	//------------------------------
	// get children list
	//------------------------------
	const list_result = k2hr3.getChildrenList(token_info.tenant, _service, _type, _path, is_expand);
	if(k2hr3.isResTypeChildrenTree(list_result)){
		result = list_result;
		if(!result.result){
			result.message	= apiutil.isSafeString(result.message) ? result.message : 'Could not get error message in response from getChildrenList';
			result.status	= apiutil.isSafeNumber(result.status) ? result.status : 400;	// default : 400(Bad Request)
		}
	}else{
		result.result 	= false;
		result.message	= 'Could not get response from getChildrenList';
		result.status	= 400;										// 400: Bad Request
	}
	return result;
};

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
router.get('/', (req: Request, res: Response, next: NextFunction): void => {

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
	const result	= rawGetChildrenList(req);
	const _message	= k2hr3.isResTypeChildrenTree(result) ? apiutil.getSafeString(result.message) : 'Failed to get list.';
	const _status	= (k2hr3.isResTypeChildrenTree(result) && apiutil.isSafeNumber(result.status)) ? result.status : 500;

	if(!k2hr3.isResTypeChildrenTree(result) || !result.result){
		r3logger.elog(_message);
		resutil.errResponse(req, res, _status, result);
		return;
	}

	r3logger.dlog('succeed : ' + _message);
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
router.head('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	if('HEAD' !== req.method){
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	//
	// get children list
	//
	const result	= rawGetChildrenList(req, false);	// Force set expand as false
	const _message	= k2hr3.isResTypeChildrenTree(result) ? apiutil.getSafeString(result.message) : 'Failed to get list.';
	const _status	= (k2hr3.isResTypeChildrenTree(result) && apiutil.isSafeNumber(result.status)) ? result.status : 500;

	if(!k2hr3.isResTypeChildrenTree(result) || !result.result){
		r3logger.elog(_message);
		resutil.errResponse(req, res, _status);
		return;
	}

	r3logger.dlog('succeed : ' + _message);
	res.status(204);										// 204: No Content
	res.send(JSON.stringify(result));
});

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Functions
//
export default router;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
