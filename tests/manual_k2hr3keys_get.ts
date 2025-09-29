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

import	* as util			from 'util';
import	apiutil				from '../src/lib/k2hr3apiutil';
import	cliutil				from '../src/lib/k2hr3cliutil';
//import	r3logger		from '../src/lib/dbglogging';
import	{ getK2hr3Keys }	from '../src/lib/k2hr3keys';
const	r3keys	= getK2hr3Keys;

//
// run
//
cliutil.getConsoleInput('user(allow null)    : ', true, false, function(isbreak: boolean, user?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}
	let _user: string | null = null;
	if(apiutil.isSafeString(user) && !apiutil.compareCaseString('null', apiutil.getSafeString(user))){
		_user = user;
	}

	cliutil.getConsoleInput('tenant(allow null)  : ', true, false, function(isbreak: boolean, tenant?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		let _tenant: string | null = null;
		if(apiutil.isSafeString(tenant) && !apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
			_tenant = tenant;
		}

		cliutil.getConsoleInput('service(allow null) : ', true, false, function(isbreak: boolean, service?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			let _service: string | null = null;

			if(apiutil.isSafeString(service) && !apiutil.compareCaseString('null', apiutil.getSafeString(service))){
				_service = service;
			}

			const	keys		= r3keys(_user, _tenant, _service);
			const	dumpdata	= util.inspect(keys, {showHidden: true, depth: null, maxArrayLength: 1000});

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
