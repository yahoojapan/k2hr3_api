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
 * CREATE:   Tue Oct 2 2018
 * REVISION:
 *
 */

'use strict';

var express		= require('express');
var router		= express.Router();

var	apiutil		= require('../lib/k2hr3apiutil');
var	resutil		= require('../lib/k2hr3resutil');
var	r3userdata	= require('../lib/k2hr3userdata');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//---------------------------------------------------------
// Router GET
//---------------------------------------------------------
//
// Mountpath							: '/v1/userdata/*'
//
// GET '/v1/userdata/<encrypted data>'	: get userdata for openstack on version 1
// response								: compressed(gzip) userdata(binary) for openstack
//
// This mount point is for getting compressed userdata of openstack which is
// used at creating instance.
// The response data is compressed by gzip, and it included multipart userdata.
// The userdata probably has "cloud-config" and "script" for registering ip
// address to k2hr3 role as its member.
// The url last path part is url encoded string which is base64 and encrypted
// role-token and role name. This userdata script will register ip address.
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
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'GET request or url is wrong'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// Check headers
	//------------------------------
	var	isGzip = false;
	if(!apiutil.isSafeEntity(req.headers['user-agent'])){
		// 'User-Agent' Must have 'Cloud-Init'
		r3logger.elog('GET request does not have User-Agent header');

		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'GET request does not have User-Agent header'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}else{
		var	strtmp = req.headers['user-agent'].toLowerCase();
		if(-1 == strtmp.indexOf('cloud-init')){
			// 'User-Agent' Must have 'Cloud-Init'
			r3logger.elog('GET request User-Agent does not have Cloud-Init');

			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'GET request is not allowed from your client'
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(result.message);
			res.type('application/json; charset=utf-8');
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// Check version
		var	ciptn	= new RegExp('cloud-init/([0-9]+).([0-9]+).([0-9]+)');		// regex = /Cloud-Init\/([0-9]+)\.([0-9]+)\.([0-9]+)/
		var	cimatchs= decodeURI(strtmp).match(ciptn);
		if(	!apiutil.isEmptyArray(cimatchs)	&&
			3 < cimatchs.length				&&
			(	0 < Number(cimatchs[1])		||
				7 < Number(cimatchs[2])		||
				9 <= Number(cimatchs[3])	)
		){
			// [FORCE]
			// Cloud-Init is 0.7.9 or after it, this version supports gzip compressed
			// userdata. Thus we return gzip compressed userdata.
			r3logger.dlog('Cloud-Init version is over 0.7.9, thus we force return gzip compressed userdata');
			isGzip = true;
		}
	}

	if(apiutil.isSafeEntity(req.headers['content-type'])){
		if(!apiutil.hasPartString(req.headers['content-type'], ';', 'application/octet-stream', true)){
			// should be 'application/octet-stream', but all type is allowed
			r3logger.dlog('GET request Content-Type is not application/octet-stream, but continue...');
		}
	}else{
		//r3logger.dlog('GET request doe not have Content-Type, but continue...');
	}

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

	//------------------------------
	// get url last path and decode it
	//------------------------------
	// check path matching
	var	requestptn	= new RegExp('^/v1/userdata/(.*)');				// regex = /^\/v1\/userdata\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'GET request url does not have userdata path parameter'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// decode and check userdata parameter
	var	udproc		= new r3userdata.userdataProcess;
	var	roleinfo	= udproc.decryptRoleInfo(reqmatchs[1]);
	var	errorMsg	= null;
	if(!apiutil.isSafeEntity(roleinfo)){
		// [NOTE]
		// continue for returning error script
		//
		errorMsg	= 'Get userdata path is invalid.';
		r3logger.elog(errorMsg);
	}

	//------------------------------
	// Make response
	//------------------------------
	var	responsebody = null;
	if(isGzip){
		// Gzip
		responsebody = udproc.getGzipMultipartUserdata(roleinfo, errorMsg);

		res.type('application/zip');
		res.setHeader('Content-Encoding', 'gzip');
		res.setHeader('Content-Transfer-Encoding', 'binary');
		res.setHeader('Content-Disposition', 'attachment; filename=k2hr3-userdata.gz');
		res.setHeader('Content-Length', responsebody.length);

		r3logger.dlog('succeed : (response body is gzip compressed)');
		res.status(200);												// 200: OK
		res.send(responsebody.data);
	}else{
		// Text
		var	multiobj = udproc.getMultipartUserdata(roleinfo, errorMsg);
		responsebody = multiobj.body;

		res.type(multiobj.type);
		res.setHeader(multiobj.mimeverkey, multiobj.mimeverval);
		res.setHeader(multiobj.partcntkey, multiobj.partcntval);

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
