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
 * CREATE:   Fri Sep 8 2017
 * REVISION:
 *
 */

'use strict';

var	apiutil	= require('./k2hr3apiutil');

function rawSendErrorResponse(req, res, status, msgbody, strType)
{
	if(!apiutil.isSafeEntity(res) || !apiutil.isSafeEntity(status) || isNaN(status)){
		if(!apiutil.isSafeEntity(res)){
			// can do nothing
			return false;
		}
		status	= 500;										// 500: Internal Error
		msgbody	= 'Wrong parameters are got.';
	}

	// set response type
	if(apiutil.isSafeString(strType)){
		res.type(strType);
	}

	// set response status
	res.status(status);

	// body message to JSON
	var	jsonbody;
	if(apiutil.isSafeEntity(msgbody)){
		if(!apiutil.checkSimpleJSON(msgbody)){
			jsonbody = JSON.stringify(msgbody);
		}else{
			jsonbody = msgbody;
		}
	}

	// set 'x-k2hr3-error' header
	if(	apiutil.isSafeEntity(req)							&&
		apiutil.isSafeEntity(req.headers)					&&
		apiutil.isSafeEntity(req.headers['x-k2hr3-debug'])	&&
		(	apiutil.compareCaseString('ON',		req.headers['x-k2hr3-debug'])		||
			apiutil.compareCaseString('OK',		req.headers['x-k2hr3-debug'])		||
			apiutil.compareCaseString('debug',	req.headers['x-k2hr3-debug'])		||
			apiutil.compareCaseString('dbg',	req.headers['x-k2hr3-debug'])		||
			apiutil.compareCaseString('1',		String(req.headers['x-k2hr3-debug']))
		)
	){
		var	errheader;
		if(apiutil.isSafeString(jsonbody)){
			errheader = jsonbody;
		}else{
			errheader = JSON.stringify({ status: status });
		}
		res.header('x-k2hr3-error', errheader);
	}

	// send body
	res.send(jsonbody);

	return true;
}

//
// <argument>	<default>	<note>
//	req						request object
//	res						response object
//	status					status code for error, must be number
//	msgbody		null		response error body if need
//	strType		null		response type if need
//
exports.errResponse = function(req, res, status, msgbody, strType)
{
	return rawSendErrorResponse(req, res, status, msgbody, strType);
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
