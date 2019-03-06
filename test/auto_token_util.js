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
// Using token functions directly
//
var	r3token	= require('../lib/k2hr3tokens');
var	apiutil	= require('../lib/k2hr3apiutil');

//
// All tokens for test
//
// alltoken = {
// 	username:								'dummyuser'
// 	unscopedtoken:							'U=<token>',		: for 'dummyuser'
// 	scopedtoken: {
// 		tenant0:							'U=<token>',		: for 'tenant0'
// 		tenant1:							'U=<token>',		: for 'tenant1'
//	}
// 	roletoken: {
// 		tenant0_k2hr3_entest_str_role_01:	'R=<token>',		: for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
// 		tenant0_k2hr3_entest_obj_role_01:	'R=<token>',		: for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
// 		tenant0_k2hr3_entest_str_role_02:	'R=<token>',		: for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
// 		tenant0_k2hr3_entest_obj_role_02:	'R=<token>',		: for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
// 		tenant0_k2hr3_entest_str_role_03:	'R=<token>',		: for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
// 		tenant0_k2hr3_entest_obj_role_03:	'R=<token>',		: for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
// 		tenant0_test_service_tenant:		'R=<token>'			: for yrn:yahoo:::tenant0:role:test_service_tenant
// 		tenant1_test_service_owner:			'R=<token>'			: for yrn:yahoo:::tenant1:role:test_service_owner
// 	}
// }
// 
// [NOTE]
// yrn:yahoo:testservice::tenant0:role:acr-role does not support role-token, because this role is service-role.
// 
function clearAllToken(alltoken)
{
	var	scopedtoken = {
		tenant0:	null,
		tenant1:	null
	};
	var	roletoken = {
		tenant0_k2hr3_entest_str_role_01:	null,
		tenant0_k2hr3_entest_obj_role_01:	null,
		tenant0_k2hr3_entest_str_role_02:	null,
		tenant0_k2hr3_entest_obj_role_02:	null,
		tenant0_k2hr3_entest_str_role_03:	null,
		tenant0_k2hr3_entest_obj_role_03:	null,
		tenant0_test_service_tenant:		null,
		tenant1_test_service_owner:			null
	};
	alltoken.username		= 'dummyuser';
	alltoken.unscopedtoken	= null;
	alltoken.scopedtoken	= scopedtoken;
	alltoken.roletoken		= roletoken;
}

//
// Before function : create all tokens for test data in k2hdkc
//
exports.before = function(parentobj, alltoken, done)
{
	var	_parentobj	= parentobj;
	var	_alltoken	= alltoken;
	var	_done		= done;									// eslint-disable-line no-unused-vars
	var _buptimeout	= _parentobj.timeout(10000);

	// clear
	clearAllToken(_alltoken);

	// Get unscoped token
	r3token.getUserToken('dummyuser', null, null, function(error, token)
	{
		if(null !== error){
			clearAllToken(_alltoken);
			_parentobj.timeout(_buptimeout);
			done();
			return;
		}
		alltoken.unscopedtoken = 'U=' + token;

		// Get scoped token for tenant0
		r3token.getUserToken('dummyuser', null, 'tenant0', function(error, token)
		{
			if(null !== error){
				clearAllToken(_alltoken);
				_parentobj.timeout(_buptimeout);
				done();
				return;
			}
			var	unscopedtoken0			 = token;
			alltoken.scopedtoken.tenant0 = 'U=' + token;

			// Get scoped token for tenant1
			r3token.getUserToken('dummyuser', null, 'tenant1', function(error, token)
			{
				if(null !== error){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				var	unscopedtoken1			 = token;
				alltoken.scopedtoken.tenant1 = 'U=' + token;

				var	result;
				var	expire	= 24 * 60 * 60;										// expire is 24H
				var	base_id	= apiutil.convertHexString128ToBin64(unscopedtoken0);

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
				result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_str_role_01 = 'R=' + result.token;

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
				result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_obj_role_01 = 'R=' + result.token;

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
				result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_str_role_02 = 'R=' + result.token;

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
				result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_obj_role_02 = 'R=' + result.token;

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
				result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_str_role_03 = 'R=' + result.token;

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
				result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_obj_role_03 = 'R=' + result.token;

				// Get role token for yrn:yahoo:::tenant0:role:test_service_tenant
				base_id	= apiutil.convertHexString128ToBin64(unscopedtoken1);
				result	= r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:test_service_tenant', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant0_test_service_tenant = 'R=' + result.token;

				// Get role token for yrn:yahoo:::tenant1:role:test_service_owner
				base_id	= apiutil.convertHexString128ToBin64(unscopedtoken1);
				result	= r3token.getRoleTokenByUser('dummyuser', 'tenant1', base_id, 'yrn:yahoo:::tenant1:role:test_service_owner', expire);
				if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					done();
					return;
				}
				alltoken.roletoken.tenant1_test_service_owner = 'R=' + result.token;

				_parentobj.timeout(_buptimeout);
				done();
			});
		});
	});
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
