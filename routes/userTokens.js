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

var express	= require('express');
var router	= express.Router();

var	r3token	= require('../lib/k2hr3tokens');
var	apiutil	= require('../lib/k2hr3apiutil');
var	resutil	= require('../lib/k2hr3resutil');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Common utility function
//
function rawCommonGetUserToken(req, res, unscopedToken, username, passwd, tenant)
{
	if(!apiutil.isSafeString(username)){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	error = {
						result: 	false,
						message:	'Some parameter(user name or unscoped token) is wrong.'
					};
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(error.message);
		resutil.errResponse(req, res, 400, error);				// 400: Bad Request
		return;
	}

	// arguments
	var	_req			= req;
	var	_res			= res;
	var	_unscopedToken	= apiutil.getSafeString(unscopedToken);
	var	_username		= apiutil.getSafeString(username);
	var	_passwd			= apiutil.getSafeString(passwd);
	var	_tenant			= apiutil.getSafeString(tenant);

	if(!apiutil.isSafeString(_unscopedToken)){
		//
		// Get token from User Credentials
		//
		r3token.getUserToken(_username, _passwd, _tenant, function(err, token)
		{
			if(null !== err){
				/* eslint-disable indent, no-mixed-spaces-and-tabs */
				var	error = {
								result: 	false,
								message:	'could not get scoped user token for user=' + _username + ', tenant=' + _tenant + ' by ' + err.message
							};
				/* eslint-enable indent, no-mixed-spaces-and-tabs */

				r3logger.elog(error.message);
				resutil.errResponse(_req, _res, 404, error);		// 404: Not Found
				return;
			}
			r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			var	result = {	result:		true,
							message:	'succeed',
							scoped:		apiutil.isSafeString(_tenant),
							token:		token
						 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			_res.status(201);										// 201: Created
			_res.send(JSON.stringify(result));
		});

	}else{
		//
		// Get Scoped token from Unscoped token
		//
		r3token.getScopedUserToken(_unscopedToken, _username, _tenant, function(err, token)
		{
			if(null !== err){
				/* eslint-disable indent, no-mixed-spaces-and-tabs */
				var	error = {
								result: 	false,
								message:	'could not get scoped user token for user=' + _username + ', tenant=' + _tenant + ' by ' + err.message
							};
				/* eslint-enable indent, no-mixed-spaces-and-tabs */

				r3logger.elog(error.message);
				resutil.errResponse(_req, _res, 404, error);		// 404: Not Found
				return;
			}
			r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			var	result = {
							result:		true,
							message:	'succeed',
							scoped:		apiutil.isSafeString(_tenant),
							token:		token
						 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			_res.status(201);										// 201: Created
			_res.send(JSON.stringify(result));
		});
	}
}

//
// Common utility function
//
function rawGetUnscopedUserToken(req)
{
	// check unscoped token in request
	var	resobj = r3token.checkToken(req, false, true);
	if(!resobj.result){
		return resobj;
	}

	if(	!apiutil.isSafeString(resobj.token)						||
		!apiutil.compareCaseString('user', resobj.token_type)	||
		!apiutil.isSafeEntity(resobj.token_info)				||
		!apiutil.isSafeString(resobj.token_info.user)			||
		false !== resobj.token_info.scoped						)
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		return {
			result: 	false,
			status:		400,						// 400: Bad Request
			message:	'could not get unscoped user token in request.'
		};
		/* eslint-enable indent, no-mixed-spaces-and-tabs */
	}

	return {
		result: 	true,
		status:		200,
		message:	null,
		token:		resobj.token,
		username:	resobj.token_info.user
	};
}

// Mountpath				: '/v1/user/tokens'
// POST '/v1/user/tokens'	: post(create) user token on version 1
// response body			: result	=> true/false
//							  message	=> messages
//							  scoped	=> true/false
//							  token		=> token(unscoped or scoped)
//
router.post('/', function(req, res, next)						// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	error;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.body) )
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		error = {
					result: 	false,
					message:	'POST body does not have auth key'
				};
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(error.message);
		resutil.errResponse(req, res, 400, error);				// 400: Bad Request
		return;
	}

	// arguments
	var	tenant			= apiutil.isSafeEntity(req.body.auth) ? apiutil.getSafeString(req.body.auth.tenantName) : null;
	var	unscopedtoken	= null;
	var	username		= null;
	var	passwd			= null;

	if(!apiutil.isSafeEntity(req.body.auth) || !apiutil.isSafeEntity(req.body.auth.passwordCredentials)){
		//
		// case of unscoped token
		//
		if(!apiutil.isSafeEntity(req.body.auth) || !apiutil.isSafeString(req.body.auth.tenantName)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			error = {
						result: 	false,
						message:	'POST body does not have tenant name(or user credentials)'
					};
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(error.message);
			resutil.errResponse(req, res, 400, error);			// 400: Bad Request
			return;
		}

		// get unscoped token
		var	resobj = rawGetUnscopedUserToken(req);
		if(!resobj.result){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			error = {
						result: 	false,
						message:	resobj.message
					};
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(resobj.message);
			resutil.errResponse(req, res, resobj.status, error);	// 40X
			return;
		}
		username		= resobj.username;
		unscopedtoken	= resobj.token;

	}else{
		//
		// case of user credentials
		//
		username	= apiutil.getSafeString(req.body.auth.passwordCredentials.username);
		passwd		= apiutil.getSafeString(req.body.auth.passwordCredentials.password);	// password is allowed empty, it depends on the authentication system.
	}

	return rawCommonGetUserToken(req, res, unscopedtoken, username, passwd, tenant);
});

// Mountpath				: '/v1/user/tokens'
// PUT '/v1/user/tokens'	: put(create) user token on version 1
// response body			: result	=> true/false
//							  message	=> messages
//							  scoped	=> true/false
//							  token		=> token(unscoped or scoped)
//
router.put('/', function(req, res, next)						// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	error;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.query) )
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		error = {
					result: 	false,
					message:	'PUT argument does not have any data'
			 	};
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(error.message);
		resutil.errResponse(req, res, 400, error);				// 400: Bad Request
		return;
	}

	// arguments
	var	tenant			= apiutil.getSafeString(req.query.tenantname);
	var	unscopedtoken	= null;
	var	username		= null;
	var	passwd			= null;

	if(!apiutil.isSafeString(req.query.username)){
		//
		// case of unscoped token
		//
		if(!apiutil.isSafeString(req.query.tenantname)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			error = {
						result: 	false,
						message:	'POST body does not have tenant name(or user credentials)'
					};
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(error.message);
			resutil.errResponse(req, res, 400, error);			// 400: Bad Request
			return;
		}

		// get unscoped token
		var	resobj = rawGetUnscopedUserToken(req);
		if(!resobj.result){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			error = {
						result: 	false,
						message:	resobj.message
					};
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(resobj.message);
			resutil.errResponse(req, res, resobj.status, error);	// 40X
			return;
		}
		username		= resobj.username;
		unscopedtoken	= resobj.token;

	}else{
		//
		// case of user credentials
		//
		username	= apiutil.getSafeString(req.query.username);
		passwd		= apiutil.isSafeEntity(req.query.password) ? decodeURIComponent(apiutil.getSafeString(req.query.password)) : null;	// password is allowed empty, it depends on the authentication system.
	}

	return rawCommonGetUserToken(req, res, unscopedtoken, username, passwd, tenant);
});

//
// Mountpath				: '/v1/user/tokens'
//
// GET '/v1/user/tokens'	: get user token on version 1
// response body			: result	=> true/false
//							  message	=> messages
//							  scoped	=> true/false
//							  user		=> user name
//							  tenants	=>	[
//												{
//													name:		"tenant name"
//													display:	"display name"
//												},
//												...
//											]
//
// [NOTE]
// If token is scoped, tenants array has only 1 element.
// Which element has name and display member, but display is as same as name.
// It is not real display name, because we take a cost getting it from APIs.
//
router.get('/', function(req, res, next)						// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);
	if('HEAD' === req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}

	var	_res = res;
	var	_req = req;
	var	result;

	_res.type('application/json; charset=utf-8');

	//------------------------------
	// get token
	//------------------------------
	var	token_result = r3token.checkToken(_req, false, true);	// not scope check, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(_req, _res, _status, token_result);
		return;
	}
	var	token_info = token_result.token_info;

	// build response body
	if(token_info.scoped){
		// scoped token
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result:				true,
					message:			'succeed',
					scoped:				true,
					user:				token_info.user,
					tenants: [
						{
							name:		token_info.tenant,
							display:	token_info.tenant			// [NOTE] this is not real display name.
						}
					]
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		_res.status(200);										// 200: OK
		_res.send(JSON.stringify(result));

	}else{
		// check and initialize tenant list
		r3token.initializeTenantList(token_result.token, token_info.user, function(error, tenant_list)
		{
			if(null !== error){
				/* eslint-disable indent, no-mixed-spaces-and-tabs */
				var	result = {
								result: 	false,
								message:	'failed to get tenant list for user (' + token_info.user + ') by unscoped token(' + token_result.token + ')'
						  	};
				/* eslint-enable indent, no-mixed-spaces-and-tabs */

				r3logger.elog(result.message);
				resutil.errResponse(_req, _res, 404, result);	// 404: Not Found
				return;
			}

			// reget tenant list
			tenant_list = r3token.getTenantList(token_info.user);
			if(null === tenant_list || apiutil.isEmptyArray(tenant_list)){
				/* eslint-disable indent, no-mixed-spaces-and-tabs */
				result = {
							result: 	false,
							message:	'token(' + token_result.token + ') for user (' + token_info.user + ') does not have any tenant.'
						  };
				/* eslint-enable indent, no-mixed-spaces-and-tabs */

				r3logger.elog(result.message);
				resutil.errResponse(_req, _res, 404, result);	// 404: Not Found
				return;
			}

			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {	result:		true,
						message:	'succeed',
						scoped:		false,
						user:		token_info.user,
						tenants:	tenant_list	};
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			_res.status(200);									// 200: OK
			_res.send(JSON.stringify(result));
		});
	}
});

// Mountpath				: '/v1/user/tokens'
// HEAD '/v1/user/tokens'	: check user token on version 1
// response body			: no
//
router.head('/', function(req, res, next)						// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	var	_res = res;
	var	_req = req;

	_res.type('application/json; charset=utf-8');

	//------------------------------
	// get token
	//------------------------------
	var	token_result = r3token.checkToken(_req, false, true);	// not scope check, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		resutil.errResponse(_req, _res, token_result.status);
		return;
	}
	var	token_info = token_result.token_info;

	// token is not expired and it is safe.
	r3logger.mlog(r3logger.dump(token_info));

	_res.status(204);											// 204:	No Content
	_res.send();
});

module.exports = router;

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
