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
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

'use strict';

var util		= require('util');

var	apiutil		= require('../lib/k2hr3apiutil');
var cliutil		= require('../lib/k2hr3cliutil');
var	r3keys		= require('../lib/k2hr3keys').getK2hr3Keys;

// Debug logging objects
//var r3logger	= require('../lib/dbglogging');

//
// run
//
cliutil.getConsoleInput('user(allow null)    : ', true, false, function(isbreak, user)
{
	if(isbreak){
		process.exit(0);
	}
	var	_user = null;
	if('' !== apiutil.getSafeString(user) && !apiutil.compareCaseString('null', apiutil.getSafeString(user))){
		_user = user;
	}

	cliutil.getConsoleInput('tenant(allow null)  : ', true, false, function(isbreak, tenant)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_tenant = null;
		if('' !== apiutil.getSafeString(tenant) && !apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
			_tenant = tenant;
		}

		cliutil.getConsoleInput('service(allow null) : ', true, false, function(isbreak, service)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_service = null;

			if('' !== apiutil.getSafeString(service) && !apiutil.compareCaseString('null', apiutil.getSafeString(service))){
				_service = service;
			}

			var	keys		= r3keys(_user, _tenant, _service);
			var	dumpdata	= util.inspect(keys, {showHidden: true, depth: null, maxArrayLength: 1000});

			console.log('user    = ' + apiutil.getSafeString(user));
			console.log('tenant  = ' + apiutil.getSafeString(tenant));
			console.log('service = ' + apiutil.getSafeString(service));
			console.log('keys    = \n' + dumpdata);
		});
	});
});

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
