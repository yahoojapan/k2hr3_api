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
 * CREATE:   Tue Dec 19 2017
 * REVISION:
 *
 */

//
// Common Chai objects for each test modules.
//
import	app									from '../src/app';
import	* as chai							from 'chai';
import	{ default as chaiHttp, request }	from 'chai-http';

//
// Setup Chai
//
chai.use(chaiHttp);

//
// Exports
//
export { app, chai, chaiHttp, request };
export const assert = chai.assert;
export const expect = chai.expect;

export function json2url(json: Record<string, unknown>): string {

	const lines: string[] = [];

	for(const prop in json){
		if(typeof(json[prop]) == 'string'){
			lines.push(prop + '=' + encodeURI(json[prop]));
		}else{
			lines.push(prop + '=' + encodeURI(JSON.stringify(json[prop])));
		}
	}
	return lines.join('&');
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
