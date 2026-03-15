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
 * CREATE:   Thu, Aug 21 2025
 * REVISION:
 *
 */

import type	{ K2hdkc }	from 'k2hdkc';
import type	{ cbTypeGetUserScopedToken, cbTypeGetUserUnscopedToken, cbTypeGetUserTenantList }	from './k2hr3tokens';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Basic types to replace "any"
//
// For example, these are using from JSON parser(and Avoiding self-referencing type aliases)
//
type valTypeAllArray = valTypeAll[];

type valTypeAllObject = {
	[key: string]: valTypeAll;
};

type valTypeAll = null | boolean | number | string | valTypeAllArray | valTypeAllObject;

//
// Variables
//
type valTypeMultipartBoundary = {
	type:			string;
	filename:		string;
	contents:		string | null;
};

type valTypeMultipartBoundaries = valTypeMultipartBoundary[];

type valTypeMultipartResult = {
	body:			string;
	type:			string | null;
	mimeverkey:		string;
	mimeverval:		string;
	partcntkey:		string;
	partcntval:		number;
};

// [NOTE][TODO]
// This type is equivalent to dkcTypeTenantInfo.
// The difference is the "description" and "desc".
// Each type is used as an interface, so there is currently no unification.
// Ideally, this type should be dkcTypeTenantInfo.
//
type valTypeOsapiTenantInfo = {
	name:			string;
	id:				string;
	description:	string | null;
	display:		string | null;
	users?:			string[];
};

type valTypeOsapiTenantInfoList = valTypeOsapiTenantInfo[];

type valTypeRoleInfo = {
	role?:			string;
	token?:			string;
	[key: string]:	valTypeAll | undefined;
};

type valTypeTokenSeed = {
	publisher:	string;
	userexid:	string;
	date:		string;
	expire:		string;
	creator:	string;
	base:		string;
	user:		string | null;
	ip:			string | null;
	hostname:	string | null;
	port:		number;
	cuk:		string | null;
	extra:		string | null;
	tenant:		string | null;
};

type resTypeBaseResult = {
	result:		boolean;
	message:	string | null;
};

type resTypeStatusResult = resTypeBaseResult & {
	status?:	number;
};

//
// Callbacks
//
type cbTypeCommonK2hr3Api<T = unknown> = (err: Error | null, result: T | null) => void;
type cbTypeK2hr3ApiNoBodyResponse = (err: Error | null) => void;
type LoggerFunction = (...args: string[]) => void;

//
// Osapi interface
//
interface Osapi {
	getUserUnscopedToken(uname: string | null, passwd: string | null, callback: cbTypeGetUserUnscopedToken): void;
	getUserUnscopedTokenByToken(token: string | null, callback:	cbTypeGetUserUnscopedToken): void;
	getUserScopedToken(unscopedtoken: string | null, tenant: string | null, callback: cbTypeGetUserScopedToken): void;
	verifyUserTokenPublisher(token_seed: string | null): resTypeBaseResult;
	verifyUserToken(dkcobj_permanent: K2hdkc | null, user: string | null, tenant: string | null, token: string | null, token_seed: string | null): resTypeBaseResult;
	getUserTenantList(unscopedtoken: string | null, userid: string | null, callback: cbTypeGetUserTenantList): void;
}

//---------------------------------------------------------
// Export
//---------------------------------------------------------
//
// Variables
//
export {
	valTypeMultipartBoundary,
	valTypeMultipartBoundaries,
	valTypeMultipartResult,
	valTypeOsapiTenantInfo,
	valTypeOsapiTenantInfoList,
	valTypeRoleInfo,
	valTypeTokenSeed,
	resTypeBaseResult,
	resTypeStatusResult,
	valTypeAllArray,
	valTypeAllObject,
	valTypeAll,
	Osapi
};

//
// Callbacks
//
export {
	cbTypeCommonK2hr3Api,
	cbTypeK2hr3ApiNoBodyResponse,
	LoggerFunction
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
