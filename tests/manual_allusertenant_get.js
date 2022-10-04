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

var	k2hr3		= require('../lib/k2hr3dkc');

// Debug logging objects
//var r3logger	= require('../lib/dbglogging');

//
// call library function directly
//
function printAllUserTenantService()
{
	//
	// This is not API, so access to k2hdkc directly.
	//
	var	allservices	= k2hr3.getAllServices();
	console.log('all service list   : ' + JSON.stringify(allservices));

	var	alltenants	= k2hr3.getAllTenants();
	console.log('all tenant list : ' + JSON.stringify(alltenants));

	var	allusers	= k2hr3.getAllUsers();
	console.log('all user list   : ' + JSON.stringify(allusers));
}

//
// run
//
printAllUserTenantService();

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
