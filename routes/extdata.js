/*
 * K2HR3 REST API
 *
 * Copyright 2018 Yahoo Japan Corporation.
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
 * CREATE:   Tue May 13 2020
 * REVISION:
 *
 */

'use strict';

var express		= require('express');
var router		= express.Router();

var	apiutil		= require('../lib/k2hr3apiutil');
var	resutil		= require('../lib/k2hr3resutil');
var	r3extdata	= require('../lib/k2hr3extdata');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//---------------------------------------------------------
// Router GET
//---------------------------------------------------------
//
// Mountpath									: '/v1/extdata/*'
//
// GET '/v1/extdata/<exturi>/<encrypted data>'	: get extra(user-defined) data on version 1
// response										: compressed(gzip) extdata(binary)
//
// This mount point is for getting compressed user defined extra data.
// The user can define this extra data as a template in the configuration.
// The variables can be used in templates, and those are replaced real values
// as like userdata entry point.
// The returned data is encrypted and compressed with the specified algorithm.
//
router.get('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head(not defined) function.
		next();
		return;
	}

	var	result;
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	||
		!apiutil.isSafeEntity(req.headers)	)							// Must User-Agent in header
	{
		result = {
			result: 	false,
			message:	'GET request or url is wrong'
		};

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// Check headers
	//------------------------------
	if(!apiutil.isSafeEntity(req.headers['user-agent'])){
		// 'User-Agent' Must be existed
		r3logger.elog('GET request does not have User-Agent header');

		result = {
			result: 	false,
			message:	'GET request does not have User-Agent header'
		};

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	userAgent	= req.headers['user-agent'].toLowerCase();

	var	isGzip		= false;
	if(apiutil.isSafeEntity(req.headers['accept-encoding'])){
		if(apiutil.hasPartString(req.headers['accept-encoding'], ',', ['gzip', 'deflate'], true)){
			isGzip = true;
		}else if(!isGzip){
			// Accept-Encoding should have 'gzip' or 'deflate', but all type is allowed
			r3logger.dlog('Get request Accept-Encoding does not have gzip nor deflate, but continue...');
		}
	}else{
		//r3logger.dlog('GET request doe not have Accept-Encoding, but continue...');
	}

	if(apiutil.isSafeEntity(req.headers['content-type'])){
		if(!apiutil.hasPartString(req.headers['content-type'], ';', 'application/octet-stream', true)){
			// should be 'application/octet-stream', but all type is allowed
			r3logger.dlog('GET request Content-Type is not application/octet-stream, but continue...');
		}
	}else{
		//r3logger.dlog('GET request doe not have Content-Type, but continue...');
	}

	//------------------------------
	// get url paths and decode
	//------------------------------
	// check path matching
	var	requestptn	= new RegExp('^/v1/extdata/(.*)/(.*)');				// regex = /^\/v1\/extdata\/(.*)\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 3 || '' === apiutil.getSafeString(reqmatchs[1]) || '' === apiutil.getSafeString(reqmatchs[2])){
		result = {
			result: 	false,
			message:	'GET request url does not have extdata path parameter'
		};

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// decode and check extdata parameter
	var	extdataproc	= new r3extdata.extdataProcess;
	var	suburi		= apiutil.getSafeString(reqmatchs[1]);
	var	roleinfo	= extdataproc.decryptRoleInfo(reqmatchs[2]);
	if(!extdataproc.checkSuburi(suburi)){
		result = {
			result: 	false,
			message:	'GET request URL path(' + suburi + ') does not exist'
		};

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	if(!extdataproc.checkUserAgent(userAgent, suburi)){
		result = {
			result: 	false,
			message:	'GET request is not allowed from your client'
		};

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	if(!apiutil.isSafeEntity(roleinfo)){
		result = {
			result: 	false,
			message:	'GET /extdata/' + suburi + '/<path> is invalid'
		};

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	contype		= extdataproc.getContentType(suburi);

	//------------------------------
	// Make response
	//------------------------------
	var	responsebody = null;
	if(isGzip){
		// Gzip
		responsebody = extdataproc.getGzipExtdata(roleinfo, suburi);
		if(null == responsebody){
			result = {
				result: 	false,
				message:	'Could not make gzip response'
			};

			r3logger.elog(result.message);
			res.type('application/json; charset=utf-8');
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		res.type('application/zip');
		res.setHeader('Content-Encoding', 'gzip');
		res.setHeader('Content-Transfer-Encoding', 'binary');
		res.setHeader('Content-Disposition', 'attachment; filename=k2hr3-extdata.gz');
		res.setHeader('Content-Length', responsebody.length);

		r3logger.dlog('succeed : (response body is gzip compressed)');
		res.status(200);												// 200: OK
		res.send(responsebody.data);
	}else{
		// Text
		responsebody = extdataproc.getExtdata(roleinfo, suburi);
		if(null == responsebody){
			result = {
				result: 	false,
				message:	'Could not make response'
			};

			r3logger.elog(result.message);
			res.type('application/json; charset=utf-8');
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		res.type(apiutil.isSafeString(contype) ? contype : 'text/plain');
		res.setHeader('Content-Length', responsebody.length);

		r3logger.dlog('succeed : (response body is not gzip compressed)');
		res.status(200);												// 200: OK
		res.send(responsebody);
	}
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
