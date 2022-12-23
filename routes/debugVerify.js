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

'use strict';

var express		= require('express');
var router		= express.Router();
var	http		= require('http');
var	https		= require('https');

var	cacerts		= require('../lib/cacerts');
var	r3token	= require('../lib/k2hr3tokens');
var	apiutil		= require('../lib/k2hr3apiutil');
var	resutil		= require('../lib/k2hr3resutil');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

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
router.get('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	var	_req	= req;
	var	_res	= res;
	var	_next	= next;
	if('GET' !== _req.method){
		// HEAD request comes here, so it should be routed to head function.
		_next();
		return;
	}
	_res.type('application/json; charset=utf-8');

	//
	// Check request
	//
	if(	!apiutil.isSafeEntity(_req)													||
		!apiutil.isSafeString(_req.baseUrl)											||
		!apiutil.isSafeString(_req.method)											||
		!apiutil.isSafeString(_req.protocol)										||
		!apiutil.isSafeEntity(_req.query)											||
		(!apiutil.isSafeString(_req.host) && !apiutil.isSafeString(_req.hostname))	||
		!apiutil.isSafeEntity(_req.headers)											||
		!apiutil.isSafeEntity(_req.headers.host)									)
	{
		r3logger.elog('GET request or url or token is wrong');
		resutil.errResponse(_req, _res, 400);														// 400: Bad Request
		return;
	}

	//
	// check token
	//
	var	token_result = r3token.checkToken(req, true, true);											// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	_token_info	= token_result.token_info;


	//
	// check arguments
	//
	var	_service_name = 'testservice';																// [NOTE] default service name
	if(apiutil.isSafeString(req.query.service) && apiutil.isSafeString(req.query.service.trim())){
		_service_name = req.query.service.trim();
	}

	//
	// Check localhost information for ACR API
	//
	var	urlobj	= apiutil.parseUrl(_req.protocol + '://' + _req.headers.host);
	if(!urlobj.https){
		if(!apiutil.compareCaseString(_req.protocol, 'http')){
			r3logger.elog('Original request url method is not as same as request method');
			resutil.errResponse(_req, _res, 400);													// 400: Bad Request
			return;
		}
	}else{
		if(!apiutil.compareCaseString(_req.protocol, 'https')){
			r3logger.elog('Original request url method is not as same as request method');
			resutil.errResponse(_req, _res, 400);													// 400: Bad Request
			return;
		}
	}
	if(urlobj.host !== apiutil.getSafeString(_req.host) && urlobj.host !== apiutil.getSafeString(_req.hostname)){
		r3logger.elog('Original request url host is not as same as request host');
		resutil.errResponse(_req, _res, 400);														// 400: Bad Request
		return;
	}

	//
	// Make request data
	//
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
						'X-Auth-Token':		apiutil.getSafeString(_req.headers['x-auth-token'])	// Transfer
					  };
	var	options		= {
						'host':				urlobj.host,
						'port':				urlobj.port,
						'path': 			'/v1/acr/' + _service_name,
						'method':			'GET',
						'headers':			headers
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */
	var	agent;
	if(urlobj.https){
		if(null !== cacerts.ca){
			options.ca = cacerts.ca;
		}
		options.agent	= new https.Agent(options);
		agent			= https;
	}else{
		options.agent	= new http.Agent(options);
		agent			= http;
	}
	r3logger.dlog('request options = ' + JSON.stringify(options));
	r3logger.dlog('request headers = ' + JSON.stringify(headers));

	//
	// Send request to localhost
	//
	var	subreq = agent.request(options, function(subres)
	{
		var	_body	= '';
		var	_status	= subres.statusCode;
		var	_headers= subres.headers;

		r3logger.dlog('/v1/acr/testservice response status: ' + _status);
		r3logger.dlog('/v1/acr/testservice response header: ' + JSON.stringify(_headers));
		subres.setEncoding('utf8');

		subres.on('data', function(chunk)
		{
			//r3logger.dlog('/v1/acr/testservice response chunk: ' + chunk);
			_body += chunk;
		});

		subres.on('end', function(result)															// eslint-disable-line no-unused-vars
		{
			var	_error = null;
			if(300 <= _status){
				_error = new Error('got error response for verify request by status=' + String(_status));
				r3logger.elog(_error.message);
				resutil.errResponse(_req, _res, _status, _error.message);							// 4xx, 5xx
				return;
			}
			//r3logger.dlog('/v1/acr/testservice response body: ' + _body);

			//
			// Check response body
			//
			if(apiutil.checkSimpleJSON(_body)){
				_body = JSON.parse(_body);
			}
			if(	!apiutil.isSafeEntity(_body)											||
				!apiutil.isSafeEntity(_body.tokeninfo)									||
				!apiutil.isSafeString(_body.tokeninfo.service)							||
				!apiutil.compareCaseString(_body.tokeninfo.service, _service_name)		||
				!apiutil.isSafeString(_body.tokeninfo.user)								||
				!apiutil.isSafeString(_body.tokeninfo.tenant)							)
			{
				_error = new Error('/v1/acr/testservice response is something wrong(' + JSON.stringify(_body) + ').');
				r3logger.elog(_error.message);
				resutil.errResponse(_req, _res, 400, _error.message);								// 400: Bad Request
				return;
			}
			r3logger.dlog('Call Verify URL: verified user(' + _body.user + ') and tenant(' + _body.tenant + ')');

			//
			// Make response body for debug
			//
			var	resobj	= [
				{
					name:					_service_name + '_resource',					// resource name
					expire:					null,											// no expire
					type:					'string',										// resource is string type
					data:					_service_name + ' resource data for debug',		// resource data(string)
					keys: {
						'creator':			apiutil.getSafeString(_token_info.user),
						'owner_tenant':		apiutil.getSafeString(_token_info.tenant),
						'service_name':		_service_name,
						'token':			'sample_token_value',
						'accesskey':		'sample_accesskey_value',
						'secretkey':		'sample_secretkey_value',
						'anykey':			'sample_value'
					}
				}
			];

			//
			// Return response
			//
			r3logger.dlog('succeed : ' + JSON.stringify(resobj));
			_res.status(200);																	// 200: OK
			_res.send(JSON.stringify(resobj));
		});
	});
	subreq.on('error', function(exception) {
		r3logger.elog(exception.message);
		resutil.errResponse(_req, _res, exception.code, exception.message);						// 4xx, 5xx
		return;
	});

	subreq.end();
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
