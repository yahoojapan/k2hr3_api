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

import	apiutil						from './k2hr3apiutil';
import type	{ resTypeBaseResult }	from './types';
import type	{ Request, Response }	from 'express';

//---------------------------------------------------------
// Functions
//---------------------------------------------------------
const rawSendErrorResponse = (
	req:		Request,
	res:		Response,
	status?:	number,
	msgbody?:	resTypeBaseResult | string | null,
	strType?:	string | null
): boolean => {

	if(!apiutil.isSafeEntity(res) || !apiutil.isSafeEntity(status) || !apiutil.isSafeNumber(status)){
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
	res.status(status ?? 500);

	// body message to JSON
	let	jsonbody: string = '';
	if(null !== msgbody){
		if(apiutil.isString(msgbody)){
			if(apiutil.checkSimpleJSON(msgbody)){
				jsonbody = msgbody;
			}else{
				// msgbody is string, but it is not JSON.
				jsonbody = JSON.stringify(msgbody);
			}
		}else{
			jsonbody = JSON.stringify(msgbody);
		}
	}

	// set 'x-k2hr3-error' header
	if(	apiutil.isPlainObject(req)			&&
		apiutil.isPlainObject(req.headers)	)
	{
		const	tmpDbgHead = req.headers['x-k2hr3-debug'];
		if(	apiutil.isSafeEntity(tmpDbgHead)	&&
			(	apiutil.compareCaseString('ON',		apiutil.isArray(tmpDbgHead) ? apiutil.getSafeString(tmpDbgHead[0]) : apiutil.getSafeString(tmpDbgHead))	||
				apiutil.compareCaseString('OK',		apiutil.isArray(tmpDbgHead) ? apiutil.getSafeString(tmpDbgHead[0]) : apiutil.getSafeString(tmpDbgHead))	||
				apiutil.compareCaseString('debug',	apiutil.isArray(tmpDbgHead) ? apiutil.getSafeString(tmpDbgHead[0]) : apiutil.getSafeString(tmpDbgHead))	||
				apiutil.compareCaseString('dbg',	apiutil.isArray(tmpDbgHead) ? apiutil.getSafeString(tmpDbgHead[0]) : apiutil.getSafeString(tmpDbgHead))	||
				apiutil.compareCaseString('1',		apiutil.isArray(tmpDbgHead) ? apiutil.getSafeString(tmpDbgHead[0]) : apiutil.getSafeString(tmpDbgHead))	||
				apiutil.compareCaseString('1',		apiutil.isArray(tmpDbgHead) ? apiutil.getSafeString(tmpDbgHead[0]) : apiutil.getSafeString(tmpDbgHead))
			)
		){
			let	errheader: string;
			if(apiutil.isSafeString(jsonbody)){
				errheader = jsonbody;
			}else{
				errheader = JSON.stringify({ status: status });
			}
			res.header('x-k2hr3-error', errheader);
		}
	}

	// send body
	res.send(jsonbody);

	return true;
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const k2hr3resutil = {
	//
	// <argument>	<default>	<note>
	//	req						request object
	//	res						response object
	//	status					status code for error, must be number
	//	msgbody		null		response error body if need
	//	strType		null		response type if need
	//
	errResponse:	rawSendErrorResponse
};

//
// Default
//
export default k2hr3resutil;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
