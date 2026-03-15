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
// Using token functions directly
//
import	apiutil						from '../src/lib/k2hr3apiutil';
import	r3tokens					from '../src/lib/k2hr3tokens';
import type { resTypeGetRoleToken }	from '../src/lib/k2hr3tokens';

//
// Types
//
export interface ScopedToken {
	tenant0:	string | null;
	tenant1:	string | null;
}

export interface RoleToken {
	tenant0_k2hr3_entest_str_role_01:	string | null;
	tenant0_k2hr3_entest_obj_role_01:	string | null;
	tenant0_k2hr3_entest_str_role_02:	string | null;
	tenant0_k2hr3_entest_obj_role_02:	string | null;
	tenant0_k2hr3_entest_str_role_03:	string | null;
	tenant0_k2hr3_entest_obj_role_03:	string | null;
	tenant0_test_service_tenant:		string | null;
	tenant1_test_service_owner:			string | null;
}

export interface AllToken {
	username:		string;
	unscopedtoken:	string | null;
	scopedtoken:	ScopedToken;
	roletoken:		RoleToken;
}

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
export function clearAllToken(alltoken: AllToken): void
{
	const	scopedtoken = {
		tenant0:	null,
		tenant1:	null
	};
	const	roletoken = {
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
// Create object
//
export function createAllToken(): AllToken
{
	return {
		username:								'',
		unscopedtoken:							null,
		scopedtoken: {
			tenant0:							null,
			tenant1:							null
		},
		roletoken: {
			tenant0_k2hr3_entest_str_role_01:	null,
			tenant0_k2hr3_entest_obj_role_01:	null,
			tenant0_k2hr3_entest_str_role_02:	null,
			tenant0_k2hr3_entest_obj_role_02:	null,
			tenant0_k2hr3_entest_str_role_03:	null,
			tenant0_k2hr3_entest_obj_role_03:	null,
			tenant0_test_service_tenant:		null,
			tenant1_test_service_owner:			null
		}
	};
}

//
// Before function : create all tokens for test data in k2hdkc
//
export function before(parentobj: Mocha.Context, alltoken: AllToken, done: Mocha.Done): void
{
	const _parentobj	= parentobj;
	const _alltoken		= alltoken;
	const _done			= done;
	const _buptimeout	= _parentobj.timeout();
	_parentobj.timeout(10000);

	// clear
	clearAllToken(_alltoken);

	// Get unscoped token
	r3tokens.getUserToken('dummyuser', null, null, function(error: Error | null, token: string | null): void
	{
		if(null !== error){
			clearAllToken(_alltoken);
			_parentobj.timeout(_buptimeout);
			_done();
			return;
		}
		alltoken.unscopedtoken = 'U=' + token;

		// Get scoped token for tenant0
		r3tokens.getUserToken('dummyuser', null, 'tenant0', function(error: Error | null, token: string | null): void
		{
			if(null !== error){
				clearAllToken(_alltoken);
				_parentobj.timeout(_buptimeout);
				_done();
				return;
			}
			alltoken.scopedtoken.tenant0 = 'U=' + token;

			// Get scoped token for tenant1
			r3tokens.getUserToken('dummyuser', null, 'tenant1', function(error: Error | null, token: string | null): void
			{
				if(null !== error){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.scopedtoken.tenant1 = 'U=' + token;

				let		result: resTypeGetRoleToken | null;
				const	expire = 24 * 60 * 60;									// expire is 24H

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
				result = r3tokens.getRoleTokenByUser('dummyuser', 'tenant0', 'yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_str_role_01 = 'R=' + apiutil.getSafeString(result.token);

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
				result = r3tokens.getRoleTokenByUser('dummyuser', 'tenant0', 'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_obj_role_01 = 'R=' + apiutil.getSafeString(result.token);

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
				result = r3tokens.getRoleTokenByUser('dummyuser', 'tenant0', 'yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_str_role_02 = 'R=' + apiutil.getSafeString(result.token);

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
				result = r3tokens.getRoleTokenByUser('dummyuser', 'tenant0', 'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_obj_role_02 = 'R=' + apiutil.getSafeString(result.token);

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
				result = r3tokens.getRoleTokenByUser('dummyuser', 'tenant0', 'yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_str_role_03 = 'R=' + apiutil.getSafeString(result.token);

				// Get role token for yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
				result = r3tokens.getRoleTokenByUser('dummyuser', 'tenant0', 'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant0_k2hr3_entest_obj_role_03 = 'R=' + apiutil.getSafeString(result.token);

				// Get role token for yrn:yahoo:::tenant0:role:test_service_tenant
				result	= r3tokens.getRoleTokenByUser('dummyuser', 'tenant0', 'yrn:yahoo:::tenant0:role:test_service_tenant', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant0_test_service_tenant = 'R=' + apiutil.getSafeString(result.token);

				// Get role token for yrn:yahoo:::tenant1:role:test_service_owner
				result	= r3tokens.getRoleTokenByUser('dummyuser', 'tenant1', 'yrn:yahoo:::tenant1:role:test_service_owner', expire);
				if(!apiutil.isPlainObject(result) || !apiutil.isBoolean(result.result) || false === result.result){
					clearAllToken(_alltoken);
					_parentobj.timeout(_buptimeout);
					_done();
					return;
				}
				alltoken.roletoken.tenant1_test_service_owner = 'R=' + apiutil.getSafeString(result.token);

				_parentobj.timeout(_buptimeout);
				_done();
			});
		});
	});
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
