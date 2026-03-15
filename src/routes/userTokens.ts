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
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

import	apiutil			from '../lib/k2hr3apiutil';
import	resutil			from '../lib/k2hr3resutil';
import	r3tokens		from '../lib/k2hr3tokens';
import	r3logger		from '../lib/dbglogging';
import	express			from 'express';

import type	{ Request, Response, NextFunction }	from 'express';
import type	{ dkcTypeTenantNameList }			from '../lib/k2hr3tokens';
import type	{ valTypeOsapiTenantInfoList, valTypeOsapiTenantInfo, resTypeBaseResult, resTypeStatusResult }	from '../lib/types';

const	router	= express.Router();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type resTypeUserTokenResult = resTypeStatusResult & {
	token:		string;
	scoped?:	boolean;
	username?:	string;
};

type resTypeGetUserToken = resTypeBaseResult & {
	scoped:		boolean;
	user:		string;
	tenants:	valTypeOsapiTenantInfoList;
};

//
// Common utility function
//
const rawCommonGetUserToken = (
	req:			Request,
	res:			Response,
	unscopedToken:	string | null,
	otherToken:		string | null,
	username:		string | null,
	passwd:			string | null,
	tenant:			string | null
): void => {

	// arguments
	const	_req			= req;
	const	_res			= res;
	const	_unscopedToken	= apiutil.getSafeString(unscopedToken);
	const	_otherToken		= apiutil.getSafeString(otherToken);
	const	_username		= apiutil.getSafeString(username);
	const	_passwd			= apiutil.getSafeString(passwd);
	const	_tenant			= apiutil.getSafeString(tenant);

	if(!apiutil.isSafeString(_unscopedToken) && !apiutil.isSafeString(_otherToken)){
		//
		// Get token from User Credentials
		//
		if(!apiutil.isSafeString(_username)){
			const	error: resTypeBaseResult = {
				result: 	false,
				message:	'Some parameter(user name or unscoped token) is wrong.'
			};
			r3logger.elog(error.message);
			resutil.errResponse(req, res, 400, error);				// 400: Bad Request
			return;
		}

		r3tokens.getUserToken(_username, _passwd, _tenant, (err: Error | null, token: string | null): void => {
			if(null !== err || null === token){
				const	error: resTypeBaseResult = {
					result: 	false,
					message:	'could not get scoped user token for user=' + _username + ', tenant=' + _tenant + ' by ' + (err?.message ?? '')
				};
				r3logger.elog(error.message);
				resutil.errResponse(_req, _res, 404, error);		// 404: Not Found
				return;
			}
			r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

			const	result: resTypeUserTokenResult = {
				result:		true,
				message:	'succeed',
				scoped:		apiutil.isSafeString(_tenant),
				token:		token
			};
			_res.status(201);										// 201: Created
			_res.send(JSON.stringify(result));
		});

	}else if(apiutil.isSafeString(_unscopedToken)){
		//
		// Get Scoped token from Unscoped token
		//
		if(!apiutil.isSafeString(_username)){
			const	error: resTypeBaseResult = {
				result: 	false,
				message:	'Some parameter(user name or unscoped token) is wrong.'
			};
			r3logger.elog(error.message);
			resutil.errResponse(req, res, 400, error);				// 400: Bad Request
			return;
		}

		r3tokens.getScopedUserToken(_unscopedToken, _username, _tenant, (err: Error | null, token: string | null): void => {
			if(null !== err || null === token){
				const	error: resTypeBaseResult = {
					result: 	false,
					message:	'could not get scoped user token for user=' + _username + ', tenant=' + _tenant + ' by ' + (err?.message ?? '')
				};
				r3logger.elog(error.message);
				resutil.errResponse(_req, _res, 404, error);		// 404: Not Found
				return;
			}
			r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

			const	result: resTypeUserTokenResult = {
				result:		true,
				message:	'succeed',
				scoped:		apiutil.isSafeString(_tenant),
				token:		token
			};
			_res.status(201);										// 201: Created
			_res.send(JSON.stringify(result));
		});

	}else if(apiutil.isSafeString(_otherToken)){
		//
		// Get Scoped/Unscoped token from other token
		//
		r3tokens.getUserTokenByToken(_otherToken, _tenant, (err: Error | null, token: string | null): void => {
			if(null !== err || null === token){
				const	error: resTypeBaseResult = {
					result: 	false,
					message:	'could not get scoped user token for other token, tenant=' + _tenant + ' by ' + (err?.message ?? '')
				};
				r3logger.elog(error.message);
				resutil.errResponse(_req, _res, 404, error);		// 404: Not Found
				return;
			}
			r3logger.dlog('get user token jsonres = ' + JSON.stringify(token));

			const	result: resTypeUserTokenResult = {
				result:		true,
				message:	'succeed',
				scoped:		apiutil.isSafeString(_tenant),
				token:		token
			};
			_res.status(201);										// 201: Created
			_res.send(JSON.stringify(result));
		});
	}
};

//
// Common utility function
//
const rawGetUnscopedUserToken = (req: Request): resTypeUserTokenResult => {

	// check unscoped token in request
	const	resobj = r3tokens.checkToken(req, false, true);
	if(!resobj.result){
		const	result: resTypeUserTokenResult = {
			result: 	resobj.result,
			message:	apiutil.getSafeString(resobj.message),
			status:		resobj.status,
			token:		''
		};
		return result;
	}

	const	token_info	= resobj.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeUserTokenResult = {
			result: 	false,
			message:	'could not get unscoped user token in request.',
			status:		400,						// 400: Bad Request
			token:		''
		};
		return result;
	}

	const	func_result: resTypeUserTokenResult = {
		result: 	true,
		message:	'',
		status:		200,
		token:		apiutil.getSafeString(resobj.token),
		username:	apiutil.getSafeString(token_info.user)
	};
	return func_result;
};

// Mountpath				: '/v1/user/tokens'
// POST '/v1/user/tokens'	: post(create) user token on version 1
// response body			: result	=> true/false
//							  message	=> messages
//							  scoped	=> true/false
//							  token		=> token(unscoped or scoped)
//
router.post('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isPlainObject(req.body) )
	{
		const	error: resTypeBaseResult = {
			result: 	false,
			message:	'POST body does not have auth key'
		};
		r3logger.elog(error.message);
		resutil.errResponse(req, res, 400, error);				// 400: Bad Request
		return;
	}

	// arguments
	const	tenant							= (apiutil.isPlainObject(req.body.auth) && apiutil.isSafeString(req.body.auth.tenantName)) ? apiutil.getSafeString(req.body.auth.tenantName) : null;
	let		unscopedtoken: string | null	= null;
	let		otherToken: string | null		= null;
	let		username: string | null			= null;
	let		passwd: string | null			= null;

	if(!apiutil.isPlainObject(req.body.auth) || !apiutil.isPlainObject(req.body.auth.passwordCredentials)){
		//
		// Token is required if no user credentials are specified.
		//
		// [NOTE]
		// There are two cases in this case:
		// (1) Specify the UnscopedToken registered in k2hr3 to get the ScopedToken(must specify the tenant name)
		// (2) Specify a token other than k2hr3 (OpenStack, etc.) and perform Unauthenticated Token after user authentication.
		//     In this case, if tenant is specified, ScopedToken can be obtained directly.
		//

		// get unscoped token
		const	resobj = rawGetUnscopedUserToken(req);
		if(resobj.result){
			//
			// (1) case of unscoped token registered in k2hr3
			//
			if(!apiutil.isPlainObject(req.body.auth) || !apiutil.isSafeString(req.body.auth.tenantName)){
				const	error: resTypeBaseResult = {
					result: 	false,
					message:	'POST body does not have tenant name(or user credentials)'
				};
				r3logger.elog(error.message);
				resutil.errResponse(req, res, 400, error);				// 400: Bad Request
				return;
			}
			username		= apiutil.getSafeString(resobj.username);
			unscopedtoken	= resobj.token;

		}else{
			//
			// (2) get (un)scoped token from other a token other than k2hr3(OpenStack, etc.)
			//
			otherToken = r3tokens.getAuthTokenHeader(req, false);
			if(!apiutil.isSafeString(otherToken)){
				const	error: resTypeBaseResult = {
					result: 	false,
					message:	resobj.message
				};
				r3logger.elog(resobj.message);
				resutil.errResponse(req, res, resobj.status, error);	// 40X
				return;
			}
		}
	}else{
		//
		// case of user credentials
		//
		username	= apiutil.getSafeString(req.body.auth.passwordCredentials.username);
		passwd		= apiutil.getSafeString(req.body.auth.passwordCredentials.password);	// password is allowed empty, it depends on the authentication system.
	}

	return rawCommonGetUserToken(req, res, unscopedtoken, otherToken, username, passwd, tenant);
});

// Mountpath				: '/v1/user/tokens'
// PUT '/v1/user/tokens'	: put(create) user token on version 1
// response body			: result	=> true/false
//							  message	=> messages
//							  scoped	=> true/false
//							  token		=> token(unscoped or scoped)
//
router.put('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isPlainObject(req.query) )
	{
		const	error: resTypeBaseResult = {
			result: 	false,
			message:	'PUT argument does not have any data'
		};
		r3logger.elog(error.message);
		resutil.errResponse(req, res, 400, error);				// 400: Bad Request
		return;
	}

	// arguments
	const	tenant							= apiutil.getSafeString(req.query.tenantname);
	let		unscopedtoken: string | null	= null;
	let		otherToken: string | null		= null;
	let		username: string | null			= null;
	let		passwd: string | null			= null;

	if(!apiutil.isSafeString(req.query.username)){
		//
		// Token is required if no user credentials are specified.
		//
		// [NOTE]
		// There are two cases in this case:
		// (1) Specify the UnscopedToken registered in k2hr3 to get the ScopedToken(must specify the tenant name)
		// (2) Specify a token other than k2hr3 (OpenStack, etc.) and perform Unauthenticated Token after user authentication.
		//     In this case, if tenant is specified, ScopedToken can be obtained directly.
		//

		// get unscoped token
		const	resobj = rawGetUnscopedUserToken(req);
		if(resobj.result){
			//
			// (1) case of unscoped token registered in k2hr3
			//
			if(!apiutil.isSafeString(req.query.tenantname)){
				const	error: resTypeBaseResult = {
					result: 	false,
					message:	'POST body does not have tenant name(or user credentials)'
				};
				r3logger.elog(error.message);
				resutil.errResponse(req, res, 400, error);			// 400: Bad Request
				return;
			}
			username		= apiutil.getSafeString(resobj.username);
			unscopedtoken	= resobj.token;

		}else{
			//
			// (2) get (un)scoped token from other a token other than k2hr3(OpenStack, etc.)
			//
			otherToken = r3tokens.getAuthTokenHeader(req, false);
			if(!apiutil.isSafeString(otherToken)){
				const	error: resTypeBaseResult = {
					result: 	false,
					message:	resobj.message
				};
				r3logger.elog(resobj.message);
				resutil.errResponse(req, res, resobj.status, error);	// 40X
				return;
			}
		}
	}else{
		//
		// case of user credentials
		//
		username	= apiutil.getSafeString(req.query.username);
		passwd		= apiutil.isSafeEntity(req.query.password) ? decodeURIComponent(apiutil.getSafeString(req.query.password)) : null;	// password is allowed empty, it depends on the authentication system.
	}

	return rawCommonGetUserToken(req, res, unscopedtoken, otherToken, username, passwd, tenant);
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
//													name:			"tenant name"
//													display:		"display name"
//													id:				"tenant id"
//													description:	"tenant description"
//												},
//												...
//											]
//
// [NOTE]
// If token is scoped, tenants array has only 1 element.
// Which element has name and display member, but display is as same as name.
// It is not real display name, because we take a cost getting it from APIs.
//
router.get('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	if('HEAD' === req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}

	const	_res = res;
	const	_req = req;
	_res.type('application/json; charset=utf-8');

	//------------------------------
	// get token
	//------------------------------
	const	token_result = r3tokens.checkToken(_req, false, true);	// not scope check, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info = token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// build response body
	if(token_info.scoped){
		// scoped token
		const	tenant_info: valTypeOsapiTenantInfo = {
			name:			apiutil.getSafeString(token_info.tenant),
			display:		apiutil.isSafeString(token_info.display) ? token_info.display : null,
			id:				apiutil.getSafeString(token_info.id),
			description:	apiutil.isSafeString(token_info.description) ? token_info.description : null
		};
		const	result: resTypeGetUserToken = {
			result:			true,
			message:		'succeed',
			scoped:			true,
			user:			apiutil.getSafeString(token_info.user),
			tenants:		[tenant_info]
		};
		_res.status(200);										// 200: OK
		_res.send(JSON.stringify(result));

	}else{
		// check and initialize tenant list
		r3tokens.initializeTenantList((apiutil.isSafeString(token_result.token) ? token_result.token : null), token_info.user, (err: Error | null, tenant_list: dkcTypeTenantNameList[] | null): void => {
			if(null !== err || null === tenant_list){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'failed to get tenant list for user (' + token_info.user + ') by unscoped token(' + token_result.token + ') : ' + (err?.message ?? '')
				};
				r3logger.elog(result.message);
				resutil.errResponse(_req, _res, 404, result);	// 404: Not Found
				return;
			}

			// reget tenant list
			const	tenant_info_list = r3tokens.getTenantList(token_info.user);
			if(!apiutil.isArray(tenant_info_list) || !apiutil.isNotEmptyArray(tenant_info_list)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'token(' + token_result.token + ') for user (' + token_info.user + ') does not have any tenant.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(_req, _res, 404, result);	// 404: Not Found
				return;
			}

			const	resobj: resTypeGetUserToken = {
				result:		true,
				message:	'succeed',
				scoped:		false,
				user:		apiutil.getSafeString(token_info.user),
				tenants:	tenant_info_list
			};
			_res.status(200);									// 200: OK
			_res.send(JSON.stringify(resobj));
		});
	}
});

// Mountpath				: '/v1/user/tokens'
// HEAD '/v1/user/tokens'	: check user token on version 1
// response body			: no
//
router.head('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	const	_res = res;
	const	_req = req;

	_res.type('application/json; charset=utf-8');

	//------------------------------
	// get token
	//------------------------------
	const	token_result = r3tokens.checkToken(_req, false, true);	// not scope check, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		resutil.errResponse(_req, _res, token_result.status);
		return;
	}

	const	token_info = token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		r3logger.elog('specified wrong token or it is not scoped user token');
		resutil.errResponse(_req, _res, 400);						// 400: Bad Request
		return;
	}

	// token is not expired and it is safe.
	r3logger.mlog(r3logger.dump(token_info));

	_res.status(204);											// 204:	No Content
	_res.send();
});

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Functions
//
export default router;

//
// Variables
//
export {
	resTypeUserTokenResult,
	resTypeGetUserToken
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
