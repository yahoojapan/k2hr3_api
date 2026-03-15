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

import	apiutil			from '../lib/k2hr3apiutil';
import	r3logger		from '../lib/dbglogging';
import	resutil			from '../lib/k2hr3resutil';
import	userdataProcess	from '../lib/k2hr3userdata';
import	express			from 'express';

import type	{ resTypeBaseResult, valTypeRoleInfo }	from '../lib/types';
import type	{ Request, Response, NextFunction }		from 'express';

const	router	= express.Router();

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
router.get('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head(not defined) function.
		next();
		return;
	}

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	||
		!apiutil.isPlainObject(req.headers)	)							// Must User-Agent in header
	{
		const	result: resTypeBaseResult = {
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
	let		isGzip: boolean	= false;
	const	tmpAgent		= req.headers['user-agent'];
	if(!apiutil.isSafeEntity(tmpAgent)){
		// 'User-Agent' Must have 'Cloud-Init'
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request does not have User-Agent header'
		};
		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}else{
		const	strtmp = tmpAgent.toLowerCase();
		if(-1 == strtmp.indexOf('cloud-init')){
			// 'User-Agent' Must have 'Cloud-Init'
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request is not allowed from your client'
			};
			r3logger.elog(result.message);
			res.type('application/json; charset=utf-8');
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// Check version
		const	ciptn	= new RegExp('cloud-init/([0-9]+).([0-9]+).([0-9]+)');	// regex = /Cloud-Init\/([0-9]+)\.([0-9]+)\.([0-9]+)/
		const	cimatchs= decodeURI(strtmp).match(ciptn);
		if(apiutil.isStringArray(cimatchs) && apiutil.isNotEmptyArray(cimatchs) && 3 < cimatchs.length){
			const	tmp_match_1	= apiutil.cvtToNumber(cimatchs[1]);
			const	tmp_match_2	= apiutil.cvtToNumber(cimatchs[2]);
			const	tmp_match_3	= apiutil.cvtToNumber(cimatchs[3]);

			if(	(apiutil.isSafeNumber(tmp_match_1) && 0 < tmp_match_1) ||
				(apiutil.isSafeNumber(tmp_match_2) && 7 < tmp_match_2) ||
				(apiutil.isSafeNumber(tmp_match_3) && 9 <= tmp_match_3))
			{
				// [FORCE]
				// Cloud-Init is 0.7.9 or after it, this version supports gzip compressed
				// userdata. Thus we return gzip compressed userdata.
				r3logger.dlog('Cloud-Init version is over 0.7.9, thus we force return gzip compressed userdata');
				isGzip = true;
			}
		}
	}

	const	tmpContent = req.headers['content-type'];
	if(apiutil.isSafeString(tmpContent)){
		if(!apiutil.hasPartString(tmpContent, ';', 'application/octet-stream', true)){
			// should be 'application/octet-stream', but all type is allowed
			r3logger.dlog('GET request Content-Type is not application/octet-stream, but continue...');
		}
	}else{
		//r3logger.dlog('GET request doe not have Content-Type, but continue...');
	}

	const	tmpEnc = req.headers['accept-encoding'];
	if(apiutil.isSafeEntity(tmpEnc)){
		if(apiutil.hasPartString(tmpEnc, ',', ['gzip', 'deflate'], true)){
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
	const	requestptn	= new RegExp('^/v1/userdata/(.*)');				// regex = /^\/v1\/userdata\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request url does not have userdata path parameter'
		};
		r3logger.elog(result.message);
		res.type('application/json; charset=utf-8');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// decode and check userdata parameter
	const	udproc		= new userdataProcess;
	const	roleinfo	= udproc.decryptRoleInfo(reqmatchs[1]);
	let		errorMsg: string | null	= null;
	if(!apiutil.isValTypeRoleInfo(roleinfo)){
		// [NOTE]
		// continue for returning error script
		//
		errorMsg	= 'Get userdata path is invalid.';
		r3logger.elog(errorMsg);
	}

	//------------------------------
	// Make response
	//------------------------------
	if(isGzip){
		// Gzip
		const	responsebody= udproc.getGzipMultipartUserdata((apiutil.isValTypeRoleInfo(roleinfo) ? roleinfo : {} as valTypeRoleInfo), errorMsg);
		const	tmp_length	= (apiutil.isPlainObject(responsebody) && apiutil.isSafeNumber(responsebody.length)) ? responsebody.length : 0;

		res.type('application/zip');
		res.setHeader('Content-Encoding', 'gzip');
		res.setHeader('Content-Transfer-Encoding', 'binary');
		res.setHeader('Content-Disposition', 'attachment; filename=k2hr3-userdata.gz');
		res.setHeader('Content-Length', tmp_length);

		r3logger.dlog('succeed : (response body is gzip compressed)');
		res.status(200);												// 200: OK
		res.send(responsebody?.data?? '');

	}else{
		// Text
		const	multiobj	= udproc.getMultipartUserdata((apiutil.isValTypeRoleInfo(roleinfo) ? roleinfo : {} as valTypeRoleInfo), errorMsg);
		const	responsebody= multiobj.body;

		if(apiutil.isSafeString(multiobj.type)){
			res.type(multiobj.type);
		}else{
			res.type('application/json; charset=utf-8');
		}
		res.setHeader(multiobj.mimeverkey, multiobj.mimeverval);
		res.setHeader(multiobj.partcntkey, multiobj.partcntval);

		r3logger.dlog('succeed : (response body is not gzip compressed)');
		res.status(200);												// 200: OK
		res.send(responsebody);
	}
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
