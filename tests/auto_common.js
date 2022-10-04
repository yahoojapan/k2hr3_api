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
 * CREATE:   Tue Dec 19 2017
 * REVISION:
 *
 */

'use strict';

//
// Common Chai objects for each test modules.
//
var chai		= require('chai');
var chaiHttp	= require('chai-http');
var app			= require('../app');

//
// Setup Chai
//
chai.use(chaiHttp);

//
// Exports
//
exports.chai	= chai;
exports.chaiHttp= chaiHttp;
exports.app		= app;
exports.assert	= chai.assert;
exports.expect	= chai.expect;

exports.json2url = function json2url(json){
	var lines = [];
	for(var prop in json){
		if(typeof(json[prop]) == 'string'){
			lines.push(prop + '=' + encodeURI(json[prop]));
		}else{
			lines.push(prop + '=' + encodeURI(JSON.stringify(json[prop])));
		}
	}
	return lines.join('&');
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
