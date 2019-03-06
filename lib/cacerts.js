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
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

'use strict';

var	fs	= require('fs');

var	apiutil	= require('./k2hr3apiutil');

// Debug logging objects
var r3logger	= require('./dbglogging');

function loadCACert()
{
	// load CA Path environment
	if(apiutil.isSafeString(process.env.CAPATH)){
		try{
			fs.statSync(process.env.CAPATH);
			return fs.readFileSync(process.env.CAPATH);
		}catch(err){
			r3logger.elog('CAPATH environment' + process.env.CAPATH + ' file does not exist, then use default ca certs.');
		}
	}

	// load one of CA certs
	/* eslint-disable indent */
	var	def_certs = [	'/etc/ssl/certs/ca-certificates.crt',
						'/etc/pki/tls/certs/ca-bundle.crt',
						'/etc/ssl/certs/ca-bundle.crt',
						'/etc/ssl/certs/ca-bundle.trust.crt'];
	/* eslint-enable indent */

	for(var cnt = 0; cnt < def_certs.length; ++cnt){
		try{
			fs.statSync(def_certs[cnt]);
			return fs.readFileSync(def_certs[cnt]);
		}catch(err){
			continue;
		}
	}
	return null;
}

exports.ca = loadCACert();

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
