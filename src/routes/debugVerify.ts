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
 * CREATE:   Mon Nov 6 2017
 * REVISION:
 *
 */

import	apiutil			from '../lib/k2hr3apiutil';
import	resutil			from '../lib/k2hr3resutil';
import	r3tokens		from '../lib/k2hr3tokens';
import	r3logger		from '../lib/dbglogging';
import	* as https		from 'https';
import	* as http		from 'http';
import	express			from 'express';
import	{ ca }			from '../lib/cacerts';

import type	{ resTypeBaseResult }				from '../lib/types';
import type	{ ClientRequest, IncomingMessage  }	from 'http';
import type	{ Request, Response, NextFunction }	from 'express';

const	router	= express.Router();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeOneDebugVerifyKeys = {
	creator:		string;
	owner_tenant:	string;
	service_name:	string;
	token:			string;
	accesskey:		string;
	secretkey:		string;
	anykey:			string;
};

type valTypeOneDebugVerify = {
	name:			string;
	expire?:		string | null;
	type:			string;
	data:			string;
	keys:			valTypeOneDebugVerifyKeys;
};

type resTypeDebugVerify = valTypeOneDebugVerify[];

//
// Debug Verify URL
//
// This router is for debugging verify url for dummy service.
// This is called only on development environment.
//
// Mountpath					:	'/v1/debug/verify'
//
// GET '/v1/debug/verify'		:	get verify for debug on version 1
// URL argument
//	service						:	service name(default testservice)
// HEADER						:	X-Auth-Token	=>	Scoped User token(without 'U=' prefix)
//	response body	= [			:	undefined/null or resource array(if one element, allows only it not array)
//		{
//			name				:	resource name which is key name(path) for resource
//			expire				:	undefined/null or integer
//			type				:	resource data type(string or object), if date is null or '', this value must be string.
//			data				:	resource data which must be string or object or null/undefined.
//			keys = {			:	resource has keys(associative array), or null/undefined.
//				'foo':	bar,	:		any value is allowed
//				...				:
//			}					:
//		},
//	]
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
	// Check request
	//
	if(	!apiutil.isPlainObject(req)				||
		!apiutil.isSafeString(req.baseUrl)		||
		!apiutil.isSafeString(req.method)		||
		!apiutil.isSafeString(req.protocol)		||
		!apiutil.isPlainObject(req.query)		||
		(!apiutil.isSafeString(req.host) && !apiutil.isSafeString(req.hostname)) ||
		!apiutil.isPlainObject(req.headers)		||
		!apiutil.isSafeEntity(req.headers.host)	)
	{
		r3logger.elog('GET request or url or token is wrong');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}
	const	_req = req;
	const	_res = res;

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(apiutil.getSafeString(token_result.message));
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	_token_info	= token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(_token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	//
	// check arguments
	//
	let	_service_name = 'testservice';											// [NOTE] default service name
	if(apiutil.isSafeString(req.query.service) && apiutil.isSafeString(req.query.service.trim())){
		_service_name = req.query.service.trim();
	}

	//
	// Check localhost information for ACR API
	//
	const	urlobj	= apiutil.parseUrl(_req.protocol + '://' + _req.headers.host);
	if(null === urlobj || !urlobj.https){
		if(!apiutil.compareCaseString(_req.protocol, 'http')){
			r3logger.elog('Original request url method is not as same as request method');
			resutil.errResponse(_req, _res, 400);								// 400: Bad Request
			return;
		}
	}else{
		if(!apiutil.compareCaseString(_req.protocol, 'https')){
			r3logger.elog('Original request url method is not as same as request method');
			resutil.errResponse(_req, _res, 400);								// 400: Bad Request
			return;
		}
	}
	if(null === urlobj || (urlobj.host !== apiutil.getSafeString(_req.host) && urlobj.host !== apiutil.getSafeString(_req.hostname))){
		r3logger.elog('Original request url host is not as same as request host');
		resutil.errResponse(_req, _res, 400);									// 400: Bad Request
		return;
	}

	//
	// Make request data
	//
	const	agent	= apiutil.compareCaseString('https:', _req.protocol) ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		apiutil.getSafeString(_req.headers['x-auth-token'])	// Transfer
	};
	const	options = {
		'host':				urlobj.host,
		'port':				urlobj.port,
		'path': 			'/v1/acr/' + _service_name,
		'method':			'GET',
		'headers':			headers,
		'ca':				(apiutil.compareCaseString('https:', _req.protocol) && null !== ca) ? (ca() ?? undefined) : undefined
	};
	r3logger.dlog('request options = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers = ' + JSON.stringify(headers));

	//
	// Send request to localhost
	//
	const	subreq: ClientRequest = agent.request(options, (subres: IncomingMessage): void => {
		let		_body	= '';
		const	_status	= subres.statusCode;
		const	_headers= subres.headers;

		r3logger.dlog('/v1/acr/testservice response status: ' + _status);
		r3logger.dlog('/v1/acr/testservice response header: ' + JSON.stringify(_headers));
		subres.setEncoding('utf8');

		res.on('data', (chunk: string) => {
			//r3logger.dlog('/v1/acr/testservice response chunk: ' + chunk);
			_body += chunk;
		});

		res.on('end', (): void => {
			if(300 <= (_status ?? 500)){
				const	_error = new Error('got error response for verify request by status=' + String(_status ?? 500));
				r3logger.elog(_error.message);
				resutil.errResponse(_req, _res, _status, _error.message);		// 4xx, 5xx
				return;
			}
			//r3logger.dlog('/v1/acr/testservice response body: ' + _body);

			//
			// Check response body
			//
			let	res_body: unknown = _body;
			if(apiutil.checkSimpleJSON(_body)){
				res_body = JSON.parse(_body);
			}
			if(	!apiutil.isPlainObject(res_body)										||
				!apiutil.isPlainObject(res_body.tokeninfo)								||
				!apiutil.isSafeString(res_body.tokeninfo.service)						||
				!apiutil.compareCaseString(res_body.tokeninfo.service, _service_name)	||
				!apiutil.isSafeString(res_body.tokeninfo.user)							||
				!apiutil.isSafeString(res_body.tokeninfo.tenant)						)
			{
				const	_error = new Error('/v1/acr/testservice response is something wrong(' + JSON.stringify(res_body) + ').');
				r3logger.elog(_error.message);
				resutil.errResponse(_req, _res, 400, _error.message);			// 400: Bad Request
				return;
			}
			r3logger.dlog('Call Verify URL: verified user(' + apiutil.getSafeString(res_body.user) + ') and tenant(' + apiutil.getSafeString(res_body.tenant) + ')');

			//
			// Make response body for debug
			//
			const	resobj: resTypeDebugVerify = 
			[
				{
					name:	_service_name + '_resource',						// resource name
					expire:	null,												// no expire
					type:	'string',											// resource is string type
					data:	_service_name + ' resource data for debug',			// resource data(string)
					keys: 	{
						'creator':		apiutil.getSafeString(_token_info.user),
						'owner_tenant':	apiutil.getSafeString(_token_info.tenant),
						'service_name':	_service_name,
						'token':		'sample_token_value',
						'accesskey':	'sample_accesskey_value',
						'secretkey':	'sample_secretkey_value',
						'anykey':		'sample_value'
					}
				}
			];

			//
			// Return response
			//
			r3logger.dlog('succeed : ' + JSON.stringify(resobj));
			_res.status(200);													// 200: OK
			_res.send(JSON.stringify(resobj));
		});
	});

	subreq.on('error', (exception: NodeJS.ErrnoException) => {
		r3logger.elog(exception.message);

		const	maybeErrno	= exception.errno;
		const	maybeCode	= exception.code;
		let		status_code	= 500;
		if(apiutil.isSafeNumber(maybeErrno)){
			status_code = maybeErrno;
		}else{
			let	tmpSatus = apiutil.cvtToNumber(maybeErrno);
			if(!apiutil.isSafeNumber(tmpSatus)){
				tmpSatus = apiutil.cvtToNumber(maybeCode);
			}
			if(apiutil.isSafeNumber(tmpSatus)){
				status_code = tmpSatus;
			}
		}
		resutil.errResponse(_req, _res, status_code, exception.message);
		return;
	});

	subreq.end();
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
	valTypeOneDebugVerifyKeys,
	valTypeOneDebugVerify,
	resTypeDebugVerify
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
