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

//-------------------------------------------------------------------
// [TODO][NOTE]{IMPORTANT]
//-------------------------------------------------------------------
// Do fix this line after changing k2hdkc nodejs addon.
//
import k2hdkc, { type K2hdkc }	from 'k2hdkc';

import	apiutil				from './k2hr3apiutil';
import	r3token				from './k2hr3tokens';
import	acrutil				from './k2hr3acrutil';
import	r3logger			from './dbglogging';

import	{ r3ApiConfig }		from './k2hr3config';
const	apiConf				= new r3ApiConfig();

import	r3template, { isValTypeTemplateVariablesMap, isK2hr3TemplateResult }	from './k2hr3template';
import	{ getK2hr3Keys, type K2hr3Keys }										from './k2hr3keys';
import type	{ dkcTypeACRVerifyOneResponseBodyData }								from './k2hr3acrutil';
import type	{ cbTypeK2hr3ApiNoBodyResponse, LoggerFunction, resTypeBaseResult, resTypeStatusResult, valTypeAllObject, valTypeAll }	from './types';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type dkcTypeHostRawValue = {
	port:			number;
	cuk:			string | null;
	extra:			string | null;
	tag:			string | null;
	inboundip:		string | null;
	outboundip:		string | null;
};

type dkcTypeHostRawValueSet = dkcTypeHostRawValue & {
	hostname?:		string | null;
	ip?:			string | null;
	key?:			string | null;
	id?:			string | null;
	alive?: 		boolean;
	[key: string]:	valTypeAll | undefined;			// for the key name specified variable to access object members
};

type dkcTypeServiceRawValue = {
	name:			string;
	owner:			string;
	verify:			valTypeAll;
	tenant:			string[] | null;
};

type dkcTypeTenantInfo = {
	name:			string;
	id:				string;
	desc:			string | null;
	display:		string | null;
	users?:			string[];
};

type dkcTypeTenantInfoList = dkcTypeTenantInfo[];

type resTypeFindTenant = resTypeBaseResult & {
	tenant?:		dkcTypeTenantInfo;
};

type resTypeLocalTenantList = resTypeBaseResult & {
	tenants?:		string[] | dkcTypeTenantInfoList;
};

type resTypeGetServiceAll = resTypeBaseResult & {
	service?:		dkcTypeServiceRawValue;
};

type resTypeFindHost = resTypeBaseResult & {
	host_info?:		dkcTypeHostRawValueSet[];
};

type resTypeGetAllIpDatas = {
	error:			Error | null;
	data:			dkcTypeHostRawValueSet[] | null;
};

type resTypeBasicUserInfo = {
	name:			string;
	id:				string;
};

type dkcTypeOneRoleHostBaseValue = Partial<dkcTypeHostRawValue> & {
	host?:			string | null;
};

type dkcTypeOneRoleHostK8SValue = {
	k8s_namespace?:			string;
	k8s_service_account?:	string;
	k8s_node_name?:			string;
	k8s_node_ip?:			string;
	k8s_pod_name?:			string;
	k8s_pod_id?:			string;
	k8s_pod_ip?:			string;
	k8s_container_id?:		string;
	k8s_k2hr3_rand?:		string;
	[key: string]:			valTypeAll | undefined;	// for the key name specified variable to access object members
};

type dkcTypeOneRoleHostDetailValue = dkcTypeOneRoleHostBaseValue & dkcTypeOneRoleHostK8SValue;

type dkcTypeOneRoleHostValue = {
	host_normal:	string;
	host_all:		string;
	detail_key:		string;
	detail:			dkcTypeOneRoleHostDetailValue;
};

type dkcTypeRoleHostNormalList = {
	hostnames:		string[];
	ips:			string[];
};

type dkcTypeRoleHostFullValueList = {
	hostnames:		string[];
	ips:			string[];
};

type dkcTypeRoleHostDetailPair = {
	[key: string]:	dkcTypeOneRoleHostDetailValue;
};

type dkcTypeRoleHostDetailList = {
	host:			dkcTypeRoleHostDetailPair;
	ip:				dkcTypeRoleHostDetailPair;
};

type dkcTypeRoleHostList = {
	normal:			dkcTypeRoleHostNormalList;
	all:			dkcTypeRoleHostFullValueList;
	detail:			dkcTypeRoleHostDetailList;
};

type dkcTypeRoleValue = {
	policies:		string[],
	aliases?:		string[],
	hosts?:			dkcTypeRoleHostNormalList,
	[key: string]:	valTypeAll | undefined;			// for the key name specified variable to access object members
};

type dkcTypeAddIpsByCuk = {
	cuk:			string;
	subkey:			string;
	extra:			string;
};

type dkcTypeResourceRawKeysValue = {
	[key: string]:	valTypeAll;						// for the key name specified variable to access object members
};

type dkcTypeResourceRawDataValue = {
	string?:		string | null;
	object?:		valTypeAllObject | null;
	keys?:			dkcTypeResourceRawKeysValue | null;
	expire?:		number | null;
	aliases?:		boolean | string[] | null;
	[key: string]:	valTypeAll | undefined;			// for the key name specified variable to access object members
};

type dkcTypeResourceRawValue = {
	name:			string | null;
	expire?:		number | null;
	type?:			string | null;
	data?:			valTypeAll;
	keys?:			dkcTypeResourceRawKeysValue | null;
	[key: string]:	valTypeAll | undefined;			// for the key name specified variable to access object members
};

type dkcTypePolicyRawValue = {
	name?:			string | null;
	effect:			string,
	action:			string[],
	resource:		string[],
	condition:		string[],
	reference:		number,
	alias:			string[]
};

type dkcTypeKeystoneEndpointStatus = {
	status:			number;
};

type dkcTypeKeystoneEndpointStatuses = {
	[key: string]:	dkcTypeKeystoneEndpointStatus;
};

type dkcTypeKeystoneEndpoint = {
	url?:			string | null;
	type?:			string;
	status?:		string | number;
	date?:			string;
};

type dkcTypeKeystoneEndpoints = {
	[key: string]:	dkcTypeKeystoneEndpoint;
};

type dkcTypeChildrenTree = {
	name:			string;
	owner?:			boolean;
	children:		dkcTypeChildrenTree[];
};

type resTypeGetServiceTenantResources = resTypeBaseResult & {
	resources?:		dkcTypeACRVerifyOneResponseBodyData[] | null;
};

type resTypeGetRole = resTypeBaseResult & {
	role?:			dkcTypeRoleValue | null;
};

type resTypeGetResource = resTypeBaseResult & {
	resource?:		dkcTypeResourceRawDataValue | null;
};

type resTypeGetResourceElementValue = resTypeBaseResult & {
	resource?:		valTypeAll;
};

type resTypeGetPolicyValue = resTypeBaseResult & {
	policy?:		dkcTypePolicyRawValue;
};

type resTypeKeystoneEndpoints = resTypeBaseResult & {
	keystones?:		dkcTypeKeystoneEndpoints;
};

type resTypeChildrenTree = resTypeStatusResult & {
	children?:		dkcTypeChildrenTree[];
};

//
// Type chekcer
//
const rawIsDkcTypeTenantInfo = (val: unknown): val is dkcTypeTenantInfo => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(	apiutil.isString(val.name)									&&
		apiutil.isString(val.id)									&&
		(null === val.desc		|| apiutil.isString(val.desc))		&&
		(null === val.display	|| apiutil.isString(val.display)) 	&&
		(undefined === val.users|| apiutil.isStringArray(val.users)))
	{
		return true;
	}
	return false;
};

const rawIsDkcTypeTenantInfoList = (arr: unknown): arr is dkcTypeTenantInfoList => {
	return (Array.isArray(arr) && arr.every((element) => rawIsDkcTypeTenantInfo(element)));
};

const rawIsDkcTypeServiceRawValue = (val: unknown): val is dkcTypeServiceRawValue => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(	apiutil.isString(val.name)			&&
		apiutil.isString(val.owner)			&&
		apiutil.isValTypeAll(val.verify)	&&
		(null === val.tenant || apiutil.isStringArray(val.tenant)))
	{
		return true;
	}
	return false;
};

// [NOTE]
// This type checker is not used now.
/*
const rawIsDkcTypeHostRawValue = (val: unknown): val is dkcTypeHostRawValue => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(	apiutil.isSafeNumber(val.port)								&&
		(null === val.cuk		|| apiutil.isString(val.cuk)		) &&
		(null === val.extra		|| apiutil.isString(val.extra)		) &&
		(null === val.tag		|| apiutil.isString(val.tag)		) &&
		(null === val.inboundip	|| apiutil.isString(val.inboundip)	) &&
		(null === val.outboundip|| apiutil.isString(val.outboundip)	) )
	{
		return true;
	}
	return false;
};
*/

const rawIsDkcTypeOneRoleHostBaseValue = (val: unknown): val is dkcTypeOneRoleHostBaseValue => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(undefined === val.host || null === val.host || apiutil.isString(val.host)){
		return true;
	}
	return false;
};

const rawIsDkcTypeOneRoleHostDetailValue = (val: unknown): val is dkcTypeOneRoleHostDetailValue => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(	(undefined === val.k8s_namespace		|| apiutil.isString(val.k8s_namespace))			&&
		(undefined === val.k8s_service_account	|| apiutil.isString(val.k8s_service_account))	&&
		(undefined === val.k8s_node_name		|| apiutil.isString(val.k8s_node_name))			&&
		(undefined === val.k8s_node_ip			|| apiutil.isString(val.k8s_node_ip))			&&
		(undefined === val.k8s_pod_name			|| apiutil.isString(val.k8s_pod_name))			&&
		(undefined === val.k8s_pod_id			|| apiutil.isString(val.k8s_pod_id))			&&
		(undefined === val.k8s_pod_ip			|| apiutil.isString(val.k8s_pod_ip))			&&
		(undefined === val.k8s_container_id		|| apiutil.isString(val.k8s_container_id))		&&
		(undefined === val.k8s_k2hr3_rand		|| apiutil.isString(val.k8s_k2hr3_rand))		&&
		rawIsDkcTypeOneRoleHostBaseValue(val)													)
	{
		return true;
	}
	return false;
};

const rawIsDkcTypeResourceRawKeysValue = (val: unknown): val is dkcTypeResourceRawKeysValue => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	for(const [, value] of Object.entries(val)){
		if(undefined !== value && null !== value && !apiutil.isSafeEntity(value)){	// This means "any"
			return false;
		}
	}
	return true;
};

const rawMergeDkcTypeResourceRawKeysValue = (
	obj1?: dkcTypeResourceRawKeysValue | null,
	obj2?: dkcTypeResourceRawKeysValue | null
): dkcTypeResourceRawKeysValue => {

	const localSafeKey = (key: string) => {
		return ('__proto__' !== key && 'constructor' !== key && 'prototype' !== key);
	};

	const _obj1 = rawIsDkcTypeResourceRawKeysValue(obj1) ? obj1 : {};
	const _obj2 = rawIsDkcTypeResourceRawKeysValue(obj2) ? obj2 : {};

	const resobj: dkcTypeResourceRawKeysValue = {};

	for(const key of Object.keys(_obj1)){
		if(localSafeKey(key)){
			resobj[key] = _obj1[key];
		}
	}
	for(const key of Object.keys(_obj2)){
		if(localSafeKey(key)){
			resobj[key] = _obj2[key];
		}
	}
	return resobj;
};

const cvtToDkcTypeResourceRawDataValue = (val?: dkcTypeRoleHostDetailPair | null): dkcTypeResourceRawKeysValue => {
	const result: dkcTypeResourceRawKeysValue = {};
	if(!apiutil.isSafeEntity(val)) {
		return result;
	}
	for(const key of Object.keys(val)){
		const oneval = val[key];
		if(	apiutil.isPlainObject(oneval)										&&
			apiutil.isSafeNumber(oneval.port)									&&
			(null === oneval.cuk		|| apiutil.isString(oneval.cuk))		&&
			(null === oneval.extra		|| apiutil.isString(oneval.extra))		&&
			(null === oneval.tag		|| apiutil.isString(oneval.tag))		&&
			(null === oneval.inboundip	|| apiutil.isString(oneval.inboundip))	&&
			(null === oneval.outboundip	|| apiutil.isString(oneval.outboundip))	&&
			(null === oneval.host		|| apiutil.isString(oneval.host))		)
		{
			result[key] = oneval as unknown as valTypeAll;
		}else{
			result[key] = null as unknown as valTypeAll;
		}
	}
	return result;
};

const rawIsDkcTypeChildrenTree = (val: unknown): val is dkcTypeChildrenTree => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(	!apiutil.isString(val.name)											||
		(undefined !== val.owner && !apiutil.isBoolean(val.owner))			||
		!apiutil.isArray(val.children)										||
		!val.children.every((element) => rawIsDkcTypeChildrenTree(element))	)
	{
		return false;
	}
	return true;
};

const rawIsResTypeChildrenTree = (val: unknown): val is resTypeChildrenTree => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(	!apiutil.isBoolean(val.result)									||
		(null !== val.message && !apiutil.isString(val.message))		||
		(undefined !== val.status && !apiutil.isSafeNumber(val.status))	||
		(undefined !== val.children && !apiutil.isArray(val.children))	||
		(apiutil.isArray(val.children) && !val.children.every((element) => rawIsDkcTypeChildrenTree(element)))	)
	{
		return false;
	}
	return true;
};

//---------------------------------------------------------
// Configuration and port number from Environment
//---------------------------------------------------------
let dkcconf: string | null	= null;
let	dkcport: number | null	= null;
let	dkccuk: string | null	= null;

(() => {
	if(!apiutil.isSafeEntity(dkcconf)){
		let	tmpdkcconf = apiConf.getK2hdkcConfig();
		if(!apiutil.checkFileExist(tmpdkcconf)){
			r3logger.elog('k2hdkc slave configuration file(' + tmpdkcconf + ') specified in config json does not exist, then try to check K2HDKC_SLAVE_CONF environemnt.');

			tmpdkcconf = apiutil.getSafeString(process.env.K2HDKC_SLAVE_CONF);
			if(!apiutil.checkFileExist(tmpdkcconf)){
				r3logger.elog('k2hdkc slave configuration file(' + tmpdkcconf + ') specified by K2HDKC_SLAVE_CONF environemnt does not exist, then use default path(/etc/k2hdkc/slave.ini).');
				tmpdkcconf = '/etc/k2hdkc/slave.ini';
			}
		}
		dkcconf = tmpdkcconf;
	}
	if(!apiutil.isSafeEntity(dkcport)){
		let	tmpdkcport = apiConf.getK2hdkcPort();
		if(!apiutil.isSafeNumeric(tmpdkcport)){
			r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified in config json is something wrong, then try to check K2HDKC_SLAVE_PORT environemnt.');
			tmpdkcport = apiutil.getSafeString(process.env.K2HDKC_SLAVE_PORT);
		}
		if(apiutil.isSafeNumeric(tmpdkcport)){
			const tmpPort = apiutil.cvtToNumber(tmpdkcport);
			if(apiutil.isSafeNumber(tmpPort)){
				dkcport = tmpPort;
			}else{
				r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified by K2HDKC_SLAVE_PORT environment is something wrong, then use default port number(8031).');
				dkcport = 8031;
			}
		}else{
			r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified by K2HDKC_SLAVE_PORT environment is something wrong, then use default port number(8031).');
			dkcport = 8031;
		}
	}
	if(!apiutil.isSafeEntity(dkccuk)){
		let	tmpdkccuk = apiConf.getK2hdkcCuk();
		if(null === tmpdkccuk){
			r3logger.mlog('k2hdkc slave cuk is not specified. then try to check K2HDKC_SLAVE_CUK environemnt.');

			tmpdkccuk = apiutil.getSafeString(process.env.K2HDKC_SLAVE_CUK);
			if(!apiutil.isSafeString(tmpdkccuk)){
				r3logger.mlog('k2hdkc slave cuk is not specified by K2HDKC_SLAVE_CUK environment is something wrong, then not use cuk(null).');
				tmpdkccuk = null;
			}
		}
		dkccuk = tmpdkccuk;
	}
})();

//---------------------------------------------------------
// Configuration for confirmation level of Service Tenant
//---------------------------------------------------------
const	is_allow_dummy_tenant = !(apiConf.isConfirmTenantForService());

//---------------------------------------------------------
// Normalization host information
//---------------------------------------------------------
//
// input_info	:	input is allow following
//					(1) string	= ip address or hostname
//					(2) dkcTypeHostRawValueSet	= {
//									ip:			ip address string(or null/undefined)
//									hostname:	hostname string(or null/undefined)
//									port:		port number(or null/undefined)
//									cuk:		container unique key(or null/undefined)
//									extra:		string(or null/undefined)
//									tag:		string(or null/undefined)
//									inboundip:	ip address string(or null/undefined)
//									outboundip:	ip address string(or null/undefined)
//									(key:		undefined)
//									(id:		undefined)
//									(alive: 	undefined)
//								  }
//					(3) array	= dkcTypeHostRawValueSet[]
//
// result		:	result is following, this array can be specified by rawCreateRole()
//					dkcTypeHostRawValueSet[] = [
//						dkcTypeHostRawValueSet = {
//							hostname:	"x.y.x.yahoo.co.jp"	(or null)
//							ip:			"172.1.1.1"			(or null)
//							port:		8000				(if not specify, the value is 0="any")
//							cuk:		"any string"		(if not specify, the value is null or undefined)
//							extra:		"explain, etc"		(if not specify, the value is null or undefined)
//							tag:		"tag string"		(if not specify, the value is null or undefined)
//							inboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//							outboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//							(key:		undefined)
//							(id:		undefined)
//							(alive: 	undefined)
//						},
//						....
//					]
//
// [NOTE]
// If both ip address and hostname are specified, the result is array[2].
// It is an array with two elements divided into a hostname and an ip address.
//
const getSafeHosts = (input_info: string | dkcTypeHostRawValueSet | dkcTypeHostRawValueSet[]): dkcTypeHostRawValueSet[] => {

	let	result: dkcTypeHostRawValueSet[] = [];

	if(!apiutil.isSafeEntity(input_info)){
		return result;
	}

	if(apiutil.isArray(input_info)){
		// a case of dkcTypeHostRawValueSet[]
		for(let cnt = 0; cnt < input_info.length; ++cnt){
			// reentrant
			const	tmp	= getSafeHosts(input_info[cnt]);
			result		= result.concat(tmp);
		}

	}else if(apiutil.isString(input_info)){
		// a case of string
		let	ipaddr: string | null	= null;
		let	hostname: string | null	= null;
		if(apiutil.isIpAddressString(input_info)){
			ipaddr	= input_info;
		}else{
			hostname= input_info;
		}

		const host_info: dkcTypeHostRawValueSet = {
			hostname:	hostname,
			ip:			ipaddr,
			port:		0,
			cuk:		null,
			extra:		null,
			tag:		null,
			inboundip:	null,
			outboundip:	null
		};
		result.push(host_info);

	}else{
		// a case of dkcTypeHostRawValueSet
		const host_info: dkcTypeHostRawValueSet = {
			hostname:	null,
			ip:			null,
			port:		0,
			cuk:		null,
			extra:		null,
			tag:		null,
			inboundip:	null,
			outboundip:	null
		};

		// A case of object
		if(apiutil.isSafeString(input_info.ip) && apiutil.isIpAddressString(input_info.ip)){
			host_info.ip		= input_info.ip;
		}
		if(apiutil.isSafeString(input_info.hostname)){
			host_info.hostname	= input_info.hostname;
		}
		if(apiutil.isSafeNumber(input_info.port)){
			host_info.port		= input_info.port;
		}
		if(apiutil.isSafeString(input_info.cuk)){
			host_info.cuk		= input_info.cuk;
		}
		if(apiutil.isSafeString(input_info.extra)){
			host_info.extra		= input_info.extra;
		}
		if(apiutil.isSafeString(input_info.tag)){
			host_info.tag		= input_info.tag;
		}
		// optional keys
		if(apiutil.isSafeString(input_info.inboundip) && apiutil.isIpAddressString(input_info.inboundip)){
			host_info.inboundip	= input_info.inboundip;
		}
		if(apiutil.isSafeString(input_info.outboundip) && apiutil.isIpAddressString(input_info.outboundip)){
			host_info.outboundip= input_info.outboundip;
		}

		if(apiutil.isSafeString(host_info.ip) && apiutil.isSafeString(host_info.hostname)){
			const	hostname_bup= host_info.hostname;
			host_info.hostname	= null;

			// add ip address object
			result.push(host_info);

			// set up for hostanme
			host_info.hostname	= hostname_bup;
			host_info.ip		= null;
		}
		result.push(host_info);
	}
	return result;
};

//---------------------------------------------------------
// increment/decrement reference count raw function
//---------------------------------------------------------
// fullyrn				:	full yrn for main key(example: "yrn:yahoo:<service>::<tenant>:policy:<policy>")
// increment			:	increment(true) or decrement(false)
//
const rawIncDecReferenceCount = (
	dkcobj_permanent:	K2hdkc,
	fullyrn?:			string | null,
	increment?:			boolean | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(fullyrn)){
		resobj.result	= false;
		resobj.message	= 'some parameters aree wrong : fullyrn=' + JSON.stringify(fullyrn) + ', increment=' + JSON.stringify(increment);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isBoolean(increment)){
		resobj.result	= false;
		resobj.message	= 'some parameters aree wrong : fullyrn=' + JSON.stringify(fullyrn) + ', increment=' + JSON.stringify(increment);
		r3logger.elog(resobj.message);
		return resobj;
	}

	//
	// keys
	//
	const	keys			= getK2hr3Keys();
	const	reference_key	= fullyrn + '/' + keys.REFERENCE_KW;

	// check fullyrn key
	const	subkeylist		= dkcobj_permanent.getSubkeys(fullyrn, true);
	if(!apiutil.findStringInArray(subkeylist, reference_key)){
		// [NOTE]
		// In case of decrement, it is warning rather than error.
		//
		if(increment){
			resobj.result	= false;
			resobj.message	= 'Could not find fullyrn key(' + fullyrn + ') or reference key for increment';
			r3logger.elog(resobj.message);
		}else{
			r3logger.wlog('Could not find fullyrn key(' + fullyrn + ') or reference key for decrement');
		}
		return resobj;
	}

	// increment/decrement reference count
	if(!dkcobj_permanent.casIncDec(reference_key, increment)){
		resobj.result	= false;
		resobj.message	= 'Could not increment/decrement reference in fullyrn key(' + fullyrn + ')';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
};

//---------------------------------------------------------
// create simple key tree
//---------------------------------------------------------
//	keys		string or array
//				string:		one or more keys with '/' separator(ex. "foo", "foo/bar/...")
//				array:		array has elements which is one or more keys with '/' separator
//							ex.	["foo", "bar"], ["foo", "foo/bar/..."]
//
const rawCreateKeyTree = (
	dkcobj_permanent:	K2hdkc,
	parent_key?:		string | null,
	keys?:				string | string[] | null,
	allow_empty_key?:	boolean | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(parent_key)){
		r3logger.elog('parameters are wrong : parent_key=' + JSON.stringify(parent_key));
		return false;
	}

	// build hierarchy array
	const	hierarchy = apiutil.expandHierarchy(parent_key, keys, '/', allow_empty_key);
	if(null === hierarchy){
		r3logger.elog('could not expand hierarchy array for parent and children.');
		return false;
	}

	// loop for creating subkey in parent
	for(const parent in hierarchy){
		if(!apiutil.isNotEmptyArray(hierarchy[parent])){
			r3logger.wlog('parent key(' + parent + ') does not have new subkeys');
			continue;
		}

		// get parent's subkeys
		let	subkeylist	= dkcobj_permanent.getSubkeys(parent, true);
		if(!apiutil.isNotEmptyArray(subkeylist)){
			subkeylist	= new Array(0);
		}

		// check new subkey
		let	is_cahnged	= false;
		for(let cnt = 0; cnt < hierarchy[parent].length; ++cnt){
			if(!apiutil.findStringInArray(subkeylist, hierarchy[parent][cnt])){
				subkeylist.push(hierarchy[parent][cnt]);
				is_cahnged = true;
			}
		}
		if(is_cahnged){
			// over write(add) subkey to parent
			if(!dkcobj_permanent.setSubkeys(parent, subkeylist)){		// add subkey to parent
				r3logger.elog('could not add ' + JSON.stringify(subkeylist) + ' under ' + parent + ' key');
				return false;
			}
		}
	}
	return true;
};

//---------------------------------------------------------
// Small utility for tenant name
//---------------------------------------------------------
const rawGetKeysFromResourceKey = (
	user:			string | null,
	resource_key:	string
): K2hr3Keys => {

	const	keys = getK2hr3Keys(user);

	// make resource name from resource yrn path
	const	nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);				// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	const	namematches	= resource_key.match(nameptn);
	if(!apiutil.isNotEmptyArray(namematches) || null === namematches || namematches.length < 4 || !apiutil.isSafeString(namematches[2])){
		// res_yrn is not full yrn to resource
		return keys;
	}
	let	service: string | null = namematches[1];
	if(!apiutil.isSafeString(service)){
		service	= null;
	}
	return getK2hr3Keys(user, namematches[2], service);
};

//---------------------------------------------------------
// initialize k2hdkc data
//---------------------------------------------------------
//
// global flag for all keys up in k2hdkc
//
let	is_init_key_hierarchy = false;

const rawInitKeyHierarchy = (dkcobj_permanent: K2hdkc): boolean => {

	if(is_init_key_hierarchy){
		return true;
	}
	let	dkcobj		= dkcobj_permanent;
	let	need_clean	= false;
	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		if(null === dkcconf || null === dkcport){
			r3logger.elog('Configuration is not set.');
			return false;
		}
		need_clean	= true;
		dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	}
	const	keys	= getK2hr3Keys();

	//
	// Check top key "yrn" exists.
	//
	let	subkeylist	= dkcobj.getSubkeys(keys.YRN_KEY, true);
	if(apiutil.isNotEmptyArray(subkeylist) && 0 < subkeylist.length && keys.DOMAIN_KEY == subkeylist[0]){
		is_init_key_hierarchy = true;
		if(need_clean){
			dkcobj.clean();
		}
		return true;
	}

	//
	// Build key hierarchy
	//
	subkeylist	= [keys.DOMAIN_KEY];
	if(!dkcobj.setSubkeys(keys.YRN_KEY, subkeylist)){							// set subkey yrn:yahoo -> yrn
		r3logger.elog('could not set ' + keys.DOMAIN_KEY + ' subkey under ' + keys.YRN_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.NO_SERVICE_KEY];
	if(!dkcobj.setSubkeys(keys.DOMAIN_KEY, subkeylist)){						// set subkey yrn:yahoo:<no service> -> yrn:yahoo
		r3logger.elog('could not set ' + keys.NO_SERVICE_KEY + ' subkey under ' + keys.DOMAIN_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.NO_SERVICE_REGION_KEY];
	if(!dkcobj.setSubkeys(keys.NO_SERVICE_KEY, subkeylist)){					// set subkey yrn:yahoo::<no region> -> yrn:yahoo:<no service>
		r3logger.elog('could not set ' + keys.NO_SERVICE_REGION_KEY + ' subkey under ' + keys.NO_SERVICE_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.NO_SERVICE_TENANT_KEY];
	if(!dkcobj.setSubkeys(keys.NO_SERVICE_REGION_KEY, subkeylist)){			// set subkey yrn:yahoo:::<no tenant> -> yrn:yahoo::<no region>
		r3logger.elog('could not set ' + keys.NO_SERVICE_TENANT_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.USER_TOP_KEY, keys.TOKEN_TOP_KEY, keys.ACTION_TOP_KEY, keys.KEYSTONE_TOP_KEY, keys.MASTER_SERVICE_TOP_KEY, keys.IAAS_TOP_KEY];
	if(!dkcobj.setSubkeys(keys.NO_SERVICE_TENANT_KEY, subkeylist)){			// set subkey yrn:yahoo::::{user, token, action, keystone, service, iaas} -> yrn:yahoo:::<no tenant>
		r3logger.elog('could not set ' + keys.USER_TOP_KEY + ', ' + keys.ACTION_TOP_KEY + ', ' + keys.TOKEN_TOP_KEY + ', ' + keys.KEYSTONE_TOP_KEY + ', ' + keys.MASTER_SERVICE_TOP_KEY + ', ' + keys.IAAS_TOP_KEY + ' subkeys under ' + keys.NO_SERVICE_TENANT_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// yrn:yahoo::::action
	//
	// [NOTE]
	// We do not need value for read/write action key, but we need to make this key.
	// Thus we set value as dummy into it.
	//
	subkeylist	= [keys.ACTION_READ_KEY, keys.ACTION_WRITE_KEY];
	if(!dkcobj.setSubkeys(keys.ACTION_TOP_KEY, subkeylist)){					// set subkey yrn:yahoo::::action:{read, write} -> yrn:yahoo::::action
		r3logger.elog('could not set ' + keys.ACTION_READ_KEY + ', ' + keys.ACTION_WRITE_KEY + ' subkeys under ' + keys.ACTION_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.ACTION_READ_KEY, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo::::action:read
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ACTION_READ_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.ACTION_WRITE_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo::::action:write
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ACTION_WRITE_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// yrn:yahoo::::user
	//
	// [NOTE]
	// We do not need value for user top key, but we need to make this key
	// for adding subkeys after processing. Thus we set value as dummy into it.
	//
	if(!dkcobj.setValue(keys.USER_TOP_KEY, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo::::user
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.USER_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// yrn:yahoo::::token
	//
	// [NOTE]
	// We do not need value for token user/role top key, but we need to make this key
	// for adding subkeys after processing. Thus we set value as dummy into it.
	//
	subkeylist	= [keys.TOKEN_USER_TOP_KEY, keys.TOKEN_ROLE_TOP_KEY];
	if(!dkcobj.setSubkeys(keys.TOKEN_TOP_KEY, subkeylist)){					// set subkey yrn:yahoo::::token:{user, role} -> yrn:yahoo::::token
		r3logger.elog('could not set ' + keys.TOKEN_USER_TOP_KEY + ', ' + keys.TOKEN_ROLE_TOP_KEY + ' subkeys under ' + keys.TOKEN_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.TOKEN_USER_TOP_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo::::token:user
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ACTION_READ_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.TOKEN_ROLE_TOP_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo::::token:role
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ACTION_WRITE_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// yrn:yahoo::::keystone
	//
	// [NOTE]
	// We do not need value for keystone top key, but we need to make this key
	// for adding subkeys after processing. Thus we set value as dummy into it.
	//
	if(!dkcobj.setValue(keys.KEYSTONE_TOP_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo::::keystone
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.KEYSTONE_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// yrn:yahoo::::iaas
	//
	// [NOTE]
	// We do not need value for iaas and iaas:{openstack|k8s} top key, but we need to make this key
	// for adding subkeys after processing. Thus we set value as dummy into it.
	//
	if(!dkcobj.setValue(keys.IAAS_TOP_KEY, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo::::iaas
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.IAAS_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// create openstack and kubernetes key
	subkeylist	= [keys.IAAS_OS_TOP_KEY, keys.IAAS_K8S_TOP_KEY];
	if(!dkcobj.setSubkeys(keys.IAAS_TOP_KEY, subkeylist)){						// set subkey yrn:yahoo::::iaas:{openstack|k8s} -> yrn:yahoo::::iaas
		r3logger.elog('could not set ' + keys.IAAS_OS_TOP_KEY + ' and ' + keys.IAAS_K8S_TOP_KEY + ' subkey under ' + keys.IAAS_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.IAAS_OS_TOP_KEY, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo::::iaas:openstack
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.IAAS_OS_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.IAAS_K8S_TOP_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo::::iaas:k8s
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.IAAS_K8S_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// yrn:yahoo::::service
	//
	// [NOTE]
	// We do not need value for service top key, but we need to make this key
	// for adding subkeys after processing. Thus we set value as dummy into it.
	//
	if(!dkcobj.setValue(keys.MASTER_SERVICE_TOP_KEY, keys.VALUE_ENABLE)){		// set value enable(dummy) -> yrn:yahoo::::service
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.SERVICE_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	// create any tenant key
	subkeylist	= [keys.ANYTENANT_SERVICE_TOP_KEY];
	if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_TOP_KEY, subkeylist)){			// set subkey yrn:yahoo::::service: -> yrn:yahoo::::service
		r3logger.elog('could not set ' + keys.ANYTENANT_SERVICE_TOP_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.ANYTENANT_SERVICE_KEY];
	if(!dkcobj.setSubkeys(keys.ANYTENANT_SERVICE_TOP_KEY, subkeylist)){		// set subkey yrn:yahoo::::service::anytenant -> yrn:yahoo::::service:
		r3logger.elog('could not set ' + keys.ANYTENANT_SERVICE_KEYANYTENANT_SERVICE_TOP_KEY + ' subkey under ' + keys.ANYTENANT_SERVICE_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.ANYTENANT_SERVICE_KEY, keys.VALUE_ENABLE)){		// set value enable(dummy) -> yrn:yahoo::::service::anytenant
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ANYTENANT_SERVICE_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	is_init_key_hierarchy = true;
	if(need_clean){
		dkcobj.clean();
	}
	return true;
};

//---------------------------------------------------------
// create service key
//---------------------------------------------------------
//
// Create Service Main key
//
//	tenant			: service owner tenant name
//	servicename		: service name
//	verify			: verify URL or any object
//
// [NOTE]
// Must create tenant(service owner) before calling this function.
//
const rawCreateService = (
	tenant?:		string | null,
	servicename?:	string | null,
	verify?:		unknown
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(servicename)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(servicename);
		r3logger.elog(resobj.message);
		return resobj;
	}
	let	_verify: string;
	if(!apiutil.isSafeEntity(verify)){
		_verify = JSON.stringify(null);														// default null
	}else if(apiutil.isSafeString(verify) && apiutil.isSafeUrl(verify)){
		// allow any URL
		//
		// Verify URL is called as like following:
		//	GET http://<verify host[:port]>{/<path>}?service=<service name>&tenant=<tenant name>&tenantid=<tenant id>&user=<user name>&userid=<user id>
		//
		//	service		: service name
		// 	tenant		: tenant name
		//	tenantid	: tenant id
		//	user		: user name
		//	userid		: user id
		//
		_verify = verify;
	}else if(!apiutil.isSafeString(verify)){
		// allow any object
		_verify = JSON.stringify(verify);													// formatted JSON
	}else{
		_verify = verify;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys(null, tenant, servicename);
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// check tenant key exists
	//
	if(!rawCheckTenantEnable(dkcobj, tenant, servicename)){
		resobj.result	= false;
		resobj.message	= 'service owner tenant(' + tenant + ') is not found.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check service key exists and owner
	//
	let subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){						// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service

		subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
		if(apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){					// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>

			const value_tmp = dkcobj.getValue(keys.SERVICE_OWNER_KEY, null, true, null);	// get value -> yrn:yahoo::::service:<service>:owner
			if(apiutil.isSafeString(value_tmp)){
				if(value_tmp != keys.MASTER_TENANT_TOP_KEY){
					// existing service owner is not specified owner(tenant)
					resobj.result	= false;
					resobj.message	= 'already existed service owner is tenant(' + value_tmp + '), it is not as same as  specified owner tenant(' + tenant + ')';
					r3logger.elog(resobj.message);
					dkcobj.clean();
					return resobj;
				}
			}
		}
	}

	//
	// Check service key exists and create these.
	//
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_TOP_KEY, subkeylist)){			// add subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	//
	// Check owner/tenant/verify key in service key
	//
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_OWNER_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_KEY, subkeylist)){				// add subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_TENANT_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_KEY, subkeylist)){				// add subkey yrn:yahoo::::service:<service>:tenant -> yrn:yahoo::::service:<service>
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.SERVICE_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_VERIFY_TENANT_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_KEY, subkeylist)){				// add subkey yrn:yahoo::::service:<service>:verify -> yrn:yahoo::::service:<service>
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.SERVICE_VERIFY_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	//
	// Update owner tenant key in service key
	//
	let value = dkcobj.getValue(keys.SERVICE_OWNER_KEY, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj.setValue(keys.SERVICE_OWNER_KEY, keys.MASTER_TENANT_TOP_KEY)){	// update(set) value -> yrn:yahoo::::service:<service>:owner
			resobj.result	= false;
			resobj.message	= 'could not set ' + keys.MASTER_TENANT_TOP_KEY + ' value to ' + keys.SERVICE_OWNER_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}else if(value != keys.MASTER_TENANT_TOP_KEY){
		resobj.result	= false;
		resobj.message	= 'could not set service owner tenant(' + keys.MASTER_TENANT_TOP_KEY + '), because it already set another tenant(' + JSON.stringify(value) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Update tenant key in service's tenant list key
	//
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){
		// add master tenant key to service's tenant list
		if(!dkcobj.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){				// add subkey yrn:yahoo:::<tenant> -> yrn:yahoo::::service:<service>:tenant
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.SERVICE_TENANT_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	//
	// Update service key to tenant's service list
	//
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.TENANT_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
		// add tenant's service key to master tenant key
		if(!dkcobj.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){				// add subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.TENANT_SERVICE_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	//
	// Update verify/tenant key in service key
	//
	value = dkcobj.getValue(keys.SERVICE_VERIFY_TENANT_KEY, null, true, null);
	if(value != _verify){
		if(!dkcobj.setValue(keys.SERVICE_VERIFY_TENANT_KEY, _verify)){				// update value verify -> yrn:yahoo::::service:<service>:verify
			resobj.result	= false;
			resobj.message	= 'could not set ' + _verify + ' value to ' + keys.SERVICE_VERIFY_TENANT_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// check tenant is service owner
//---------------------------------------------------------
//
// Check tenant in service's owner
//
//	tenant			: tenant name
//	servicename		: service name
//
const rawCheckTenantInServiceOwner = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(service)){
		r3logger.elog('parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return false;
	}
	const	cvt_tenant	= tenant;

	// normalize tenant(if tenant is full yrn path, it should be tenant name)
	let		keys		= getK2hr3Keys(null, tenant, service);
	const	yrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_MAIN);						// regex = /^yrn:yahoo:(.*)::(.*)/
	const	matches		= cvt_tenant.match(yrnptn);
	if(apiutil.isNotEmptyArray(matches) && 3 <= matches.length){
		if(!apiutil.isSafeString(matches[2]) || !apiutil.isSafeString(matches[2].trim())){
			r3logger.elog('parameters are wrong : tenant=' + JSON.stringify(cvt_tenant));
			return false;
		}
		tenant	= matches[2].trim();
		keys	= getK2hr3Keys(null, tenant, service);										// remake
	}

	//
	// Check tenant is owner
	//
	const value = dkcobj_permanent.getValue(keys.SERVICE_OWNER_KEY, null, true, null);		// check value in yrn:yahoo::::service:<service>:owner
	if(!apiutil.isSafeString(value) || !apiutil.compareCaseString(value, keys.MASTER_TENANT_TOP_KEY)){
		r3logger.dlog('tenant(' + keys.MASTER_TENANT_TOP_KEY + ') is not owner for service(' + keys.MASTER_SERVICE_KEY + ')');
		return false;
	}
	return true;
};

//---------------------------------------------------------
// Get service raw function
//---------------------------------------------------------
//	resTypeGetServiceAll = {
//		"result":	true/false
//		"message":	<error message> / null / undefined
//		"service":	dkcTypeServiceRawValue = {
//			"name":			<service name>
//			"owner":		<owner tenant name>
//			"verify":		<verify url> or <verify object>
//			"tenant":		[<tenant yrn full path>, ...]
//		}
//	}
//
const rawGetServiceAll = (
	tenant?:		string | null,
	servicename?:	string | null
): resTypeGetServiceAll => {

	const	resobj: resTypeGetServiceAll = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(servicename)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(servicename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Keys
	//
	const	keys			= getK2hr3Keys(null, tenant, servicename);
	const	service_key		= keys.MASTER_SERVICE_KEY;										// "yrn:yahoo::::service:<service>"
	const	owner_key		= keys.SERVICE_OWNER_KEY;										// "yrn:yahoo::::service:<service>:owner"
	const	tenant_key		= keys.SERVICE_TENANT_KEY;										// "yrn:yahoo::::service:<service>:tenant"
	const	verify_key		= keys.SERVICE_VERIFY_TENANT_KEY;								// "yrn:yahoo::::service:<service>:verify"

	//
	// Check service main key & children keys
	//
	let subkeylist	= dkcobj.getSubkeys(service_key, true);						// get subkey list in "yrn:yahoo::::service:<service>"
	if(	!apiutil.findStringInArray(subkeylist, owner_key)	||
		!apiutil.findStringInArray(subkeylist, tenant_key)	||
		!apiutil.findStringInArray(subkeylist, verify_key)	)
	{
		resobj.result	= false;
		resobj.message	= owner_key + ' or ' + tenant_key + ' or ' + verify_key + ' are not found in ' + service_key + ' subkey list.';
		dkcobj.clean();
		return resobj;
	}

	//
	// Check tenant is owner
	//
	if(!rawCheckTenantInServiceOwner(dkcobj, tenant, servicename)){
		resobj.result	= false;
		resobj.message	= 'tenant(' + tenant + ') is not owner for service(' + JSON.stringify(servicename) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Get verify
	//
	const value = dkcobj.getValue(verify_key, null, true, null);						// check value in yrn:yahoo::::service:<service>:verify
	if(!apiutil.isSafeString(value)){
		resobj.result	= false;
		resobj.message	= 'key(' + verify_key + ') does not have safe verify url nor JSON string : ' + JSON.stringify(value);
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	let	service_verify: valTypeAll;
	if(apiutil.checkSimpleJSON(value)){
		service_verify = JSON.parse(value);
	}else{
		service_verify = value;
	}

	//
	// Get tenant list
	//
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(tenant_key, true));		// get subkey list in yrn:yahoo::::service:<service>:tenant
	let service_tenant: string[] | null = null;
	if(apiutil.isNotEmptyArray(subkeylist)){
		service_tenant = subkeylist;
	}

	// set policy key into result object
	const	service_data: dkcTypeServiceRawValue = {
		name:		servicename,
		owner:		tenant,
		verify:		service_verify,
		tenant:		service_tenant
	};
	resobj.service	= service_data;

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// Common remove tenant under service
//---------------------------------------------------------
//	tenantname						: tenant name
//	servicename						: service name
//	is_remove_tenant_from_service	: remove tenant name from tenant list under service key(default: true)
//
const rawRemoveServiceTenantEx = (
	dkcobj_permanent:				K2hdkc,
	tenantname?:					string | null,
	servicename?:					string | null,
	is_remove_tenant_from_service?:	boolean | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenantname) || !apiutil.isSafeString(servicename)){
		r3logger.elog('parameters are wrong : tenantname=' + JSON.stringify(tenantname) + ', service=' + JSON.stringify(servicename));
		return false;
	}
	if(!apiutil.isBoolean(is_remove_tenant_from_service)){
		is_remove_tenant_from_service = true;
	}

	//
	// Keys
	//
	const keys = getK2hr3Keys(null, tenantname, servicename);

	//
	// Remove key and subkeys under 'yrn:yahoo:<service>::<tenant>'
	// Keys:	yrn:yahoo:<service>::<tenant>:*					: keys.TENANT_TOP_KEY
	//			yrn:yahoo:<service>::<tenant>:role/*			: keys.ROLE_TOP_KEY
	//			yrn:yahoo:<service>::<tenant>:policy/*			: keys.POLICY_TOP_KEY
	//			yrn:yahoo:<service>::<tenant>:resource/*		: keys.RESOURCE_TOP_KEY
	//
	if(	!rawRemoveServiceTenantRole(dkcobj_permanent, tenantname, servicename)			||	// remove yrn:yahoo:<service>::<tenant>:role
		!rawRemoveServiceTenantPolicy(dkcobj_permanent, tenantname, servicename)		||	// remove yrn:yahoo:<service>::<tenant>:policy
		!rawRemoveServiceTenantAllResource(dkcobj_permanent, tenantname, servicename)	)	// remove yrn:yahoo:<service>::<tenant>:resource
	{
		r3logger.elog('could not remove subkeys(role/policy/resources) under service(' + JSON.stringify(servicename) + ') and tenant(' + JSON.stringify(tenantname) + ')');
		return false;
	}
	if(!dkcobj_permanent.remove(keys.TENANT_TOP_KEY, false)){						// remove key yrn:yahoo:<service>::<tenant>
		r3logger.elog('could not remove key(' + keys.TENANT_TOP_KEY + ') under service(' + JSON.stringify(servicename) + ') and tenant(' + JSON.stringify(tenantname) + ')');
		return false;
	}

	//
	// Remove tenant top from region subkey list
	//
	let subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.SERVICE_NO_REGION_KEY, true));
	if(apiutil.removeStringFromArray(subkeylist, keys.TENANT_TOP_KEY)){
		// remove tenant top key under service(no region)
		if(!dkcobj_permanent.setSubkeys(keys.SERVICE_NO_REGION_KEY, subkeylist)){	// remove subkey yrn:yahoo:<service>::<tenant> -> yrn:yahoo:<service>:
			r3logger.elog('could not remove key(' + keys.TENANT_TOP_KEY + ') from ' + keys.SERVICE_NO_REGION_KEY);
			return false;
		}
	}
	if(!apiutil.isNotEmptyArray(subkeylist)){
		// Service no region key does not have any children,
		// on this case it can remove service(+tenant) top key
		//
		if(!dkcobj_permanent.remove(keys.SERVICE_NO_REGION_KEY, false)){			// remove key yrn:yahoo:<service>:
			r3logger.elog('could not remove key(' + keys.SERVICE_NO_REGION_KEY + '), but continue...');
		}
		if(!dkcobj_permanent.remove(keys.SERVICE_TOP_KEY, false)){					// remove key yrn:yahoo:<service>
			r3logger.elog('could not remove key(' + keys.SERVICE_TOP_KEY + '), but continue...');
		}

		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.DOMAIN_KEY, true));
		if(apiutil.removeStringFromArray(subkeylist, keys.SERVICE_TOP_KEY)){
			// remove tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.DOMAIN_KEY, subkeylist)){			// remove subkey yrn:yahoo:<service> -> yrn:yahoo
				r3logger.elog('could not remove key(' + keys.SERVICE_TOP_KEY + ') from ' + keys.DOMAIN_KEY + '), but continue...');
			}
		}
	}

	//
	// Remove service name from tenant's service list
	//
	if(is_remove_tenant_from_service){
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_SERVICE_KEY, true));
		if(apiutil.removeStringFromArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			// remove tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){	// remove subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
				r3logger.elog('could not remove key(' + keys.MASTER_SERVICE_KEY + ') from ' + keys.TENANT_SERVICE_KEY);
				return false;
			}
		}
	}

	//
	// Remove tenant name from service's tenant list
	//
	if(is_remove_tenant_from_service){
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TENANT_KEY, true));
		if(apiutil.removeStringFromArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){
			// remove tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){	// remove subkey yrn:yahoo:::<tenant> -> yrn:yahoo::::service:<service>:tenant
				r3logger.elog('could not remove key(' + keys.MASTER_TENANT_TOP_KEY + ') from ' + keys.SERVICE_TENANT_KEY);
				return false;
			}
		}
	}
	return true;
};

//---------------------------------------------------------
// Remove service raw function
//---------------------------------------------------------
const rawRemoveServiceAll = (
	tenant?:		string | null,
	servicename?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(servicename)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(servicename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Keys
	//
	const	keys			= getK2hr3Keys(null, tenant, servicename);
	const	service_key		= keys.MASTER_SERVICE_KEY;										// "yrn:yahoo::::service:<service>"
	const	owner_key		= keys.SERVICE_OWNER_KEY;										// "yrn:yahoo::::service:<service>:owner"
	const	tenant_key		= keys.SERVICE_TENANT_KEY;										// "yrn:yahoo::::service:<service>:tenant"
	const	verify_key		= keys.SERVICE_VERIFY_TENANT_KEY;								// "yrn:yahoo::::service:<service>:verify"

	//
	// Check tenant is owner
	//
	if(!rawCheckTenantInServiceOwner(dkcobj, tenant, servicename)){
		resobj.result	= false;
		resobj.message	= 'tenant(' + tenant + ') is not owner for service(' + servicename + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Get tenant list
	//
	let subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(tenant_key, true));	// get subkey list in yrn:yahoo::::service:<service>:tenant
	if(apiutil.isNotEmptyArray(subkeylist)){
		const	tenantlist = subkeylist;
		for(let cnt = 0; cnt < tenantlist.length; ++cnt){
			//
			// Create related key
			//
			const yrnptn				= new RegExp('^' + keys.MATCH_ANY_TENANT_MAIN);		// regex = /^yrn:yahoo:(.*)::(.*)/
			const matches				= tenantlist[cnt].match(yrnptn);
			if(!apiutil.isNotEmptyArray(matches) || matches.length < 3){
				r3logger.elog('tenant(' + tenantlist[cnt] + ') in service tenant list is something wrong, then skip this.');
				continue;
			}
			const servicetenant			= matches[2];							// tenant name under service's tenant
			const tenant_service_key	= tenantlist[cnt] + ':' + keys.SERVICE_KW;			// "yrn:yahoo::::service:<service>"
			const is_owner_service_tenant = apiutil.compareCaseString(keys.MASTER_TENANT_TOP_KEY, tenantlist[cnt]);

			//
			// Remove service key from all tenant member's service list
			//
			subkeylist = apiutil.getSafeStringArray(dkcobj.getSubkeys(tenant_service_key, true));	// remove subkey "yrn:yahoo::::service:<service>" -> "yrn:yahoo:::<tenant>:service"
			if(apiutil.removeStringFromArray(subkeylist, service_key)){
				if(!dkcobj.setSubkeys(tenant_service_key, subkeylist)){			// reset new service list -> yrn:yahoo:::<tenant>:service
					resobj.result	= false;
					resobj.message	= 'could not set new(removed service) list under ' + keys.TENANT_SERVICE_KEY + ' key';
					r3logger.elog(resobj.message);
					dkcobj.clean();
					return resobj;
				}
			}

			//
			// Remove service + tenant
			//
			if(!rawRemoveServiceTenantEx(dkcobj, servicetenant, servicename, !is_owner_service_tenant)){
				resobj.result	= false;
				resobj.message	= 'could not remove subkeys(role/policy/resources) under service(' + JSON.stringify(servicename) + ') and tenant(' + JSON.stringify(servicetenant) + ')';
				r3logger.elog(resobj.message);
				dkcobj.clean();
				return resobj;
			}
		}
	}

	//
	// Remove service name in anytenant key
	//
	subkeylist = apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.ANYTENANT_SERVICE_KEY, true));	// get subkey list in yrn:yahoo::::service::anytenant
	if(apiutil.removeStringFromArray(subkeylist, service_key)){
		if(!dkcobj.setSubkeys(keys.ANYTENANT_SERVICE_KEY, subkeylist)){			// reset new service list -> yrn:yahoo::::service::anytenant
			resobj.result	= false;
			resobj.message	= 'could not set new(removed service) list under ' + keys.ANYTENANT_SERVICE_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	//
	// Remove verify/owner/tenant under service key
	//
	if(!dkcobj.remove(tenant_key, false)){											// remove "yrn:yahoo::::service:<service>:tenant"
		r3logger.elog('could not remove ' + tenant_key + 'key, probably it is not existed.');
	}
	if(!dkcobj.remove(verify_key, false)){											// remove "yrn:yahoo::::service:<service>:verify"
		r3logger.elog('could not remove ' + verify_key + 'key, probably it is not existed.');
	}
	if(!dkcobj.remove(owner_key, false)){											// remove "yrn:yahoo::::service:<service>:owner"
		r3logger.elog('could not remove ' + owner_key + 'key, probably it is not existed.');
	}

	//
	// Remove service key
	//
	subkeylist = apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));	// get subkey list in yrn:yahoo::::service
	if(apiutil.removeStringFromArray(subkeylist, service_key)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_TOP_KEY, subkeylist)){			// reset new service list -> yrn:yahoo::::service
			resobj.result	= false;
			resobj.message	= 'could not set new(removed service) list under ' + keys.MASTER_SERVICE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	if(!dkcobj.remove(service_key, false)){										// remove "yrn:yahoo::::service:<service>"
		r3logger.elog('could not remove ' + service_key + 'key, probably it is not existed.');
	}

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// raw allow tenant to service
//---------------------------------------------------------
//
// Raw function for adding Service member tenants
//
//	ownertenant		: service owner tenant name
//	servicename		: service name
//	tenantname		: tenant name
//
const rawAllowTenantToServiceEx = (
	dkcobj_permanent:	K2hdkc,
	ownertenant?:		string | null,
	servicename?:		string | null,
	tenantname?:		string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(ownertenant) || !apiutil.isSafeString(servicename) || !apiutil.isSafeString(tenantname)){
		r3logger.elog('parameters are wrong : ownertenant=' + JSON.stringify(ownertenant) + ', service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname));
		return false;
	}

	const	keys = getK2hr3Keys(null, tenantname, servicename);

	//
	// Check service key/owner key/tenant key exists.
	//
	let subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){					// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
		// not found master service key in master service top key.
		r3logger.elog('Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)');
		return false;
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){						// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
		// not found owner key in master service key.
		r3logger.elog('Not found ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no owner key in master service key)');
		return false;
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_TENANT_KEY)){					// check subkey yrn:yahoo::::service:<service>:tenant -> yrn:yahoo::::service:<service>
		// not found tenant top key in master service key.
		r3logger.elog('Not found ' + keys.SERVICE_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no tenant key in master service key)');
		return false;
	}

	//
	// Check tenant is owner
	//
	if(!rawCheckTenantInServiceOwner(dkcobj_permanent, ownertenant, servicename)){
		r3logger.elog('tenant(' + ownertenant + ') is not owner for service(' + servicename + ')');
		return false;
	}

	//
	// Check tenant key exists.
	//
	const is_any_tenant	= (keys.VALUE_WILDCARD === tenantname ? true : false);
	if(!is_any_tenant){
		// case for not any tenant
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){				// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
			// not found tenant
			if(is_allow_dummy_tenant){
				// [NOTE]
				// Allow addition of unregistered tenant as service member.
				// Unregistered tenants are temporarily registered here.
				// The temporarily registered tenant is officially registered
				// when the tenant owner user accesses it.
				//
				r3logger.dlog('Not found ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key. It should be existed before adding it into master service key, but it tries to create it temporary.');

				if(!rawCreateTenantTemporary(dkcobj_permanent, tenantname)){
					r3logger.elog('Could not register tenant(' + tenantname + ') as temporary for service(' + servicename + ').');
					return false;
				}
			}else{
				r3logger.elog('Not found ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key. It should be existed before adding it into master service key.');
				return false;
			}
		}
	}

	//
	// Add tenant key in service's tenant list key
	//
	const add_tenant_key= (is_any_tenant ? keys.VALUE_WILDCARD : keys.MASTER_TENANT_TOP_KEY);
	subkeylist			= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TENANT_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, add_tenant_key)){
		// add master tenant key to service's tenant list
		if(!dkcobj_permanent.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){		// add subkey yrn:yahoo:::<tenant> or '*' -> yrn:yahoo::::service:<service>:tenant
			r3logger.elog('could not add ' + add_tenant_key + ' subkey under ' + keys.SERVICE_TENANT_KEY + ' key');
			return false;
		}
	}

	//
	// Add service key to tenant's service list
	//
	if(!is_any_tenant){
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_SERVICE_KEY)){
			// add tenant's service key to master tenant key
			if(!dkcobj_permanent.setSubkeys(keys.MASTER_TENANT_TOP_KEY, subkeylist)){	// add subkey yrn:yahoo:::<tenant>:service -> yrn:yahoo::::service:<service>
				r3logger.elog('could not add ' + keys.TENANT_SERVICE_KEY + ' subkey under ' + keys.MASTER_TENANT_TOP_KEY + ' key');
				return false;
			}
		}
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_SERVICE_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			// add tenant's service key to master tenant key
			if(!dkcobj_permanent.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){	// add subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
				r3logger.elog('could not add ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.TENANT_SERVICE_KEY + ' key');
				return false;
			}
		}
	}else{
		//
		// If allow any tenant, we set service path into anytenant.
		//
		subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.ANYTENANT_SERVICE_KEY, true));	// get subkey list in yrn:yahoo::::service::anytenant
		if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			if(!dkcobj_permanent.setSubkeys(keys.ANYTENANT_SERVICE_KEY, subkeylist)){	// set service path -> yrn:yahoo::::service::anytenant
				r3logger.elog('could not add subkey(' + keys.MASTER_SERVICE_KEY + ') to ' + keys.ANYTENANT_SERVICE_KEY + ' key');
				return false;
			}
		}
	}
	return true;
};

//---------------------------------------------------------
// allow tenant to service
//---------------------------------------------------------
//
// Add Service member tenants
//
//	ownertenant		: service owner tenant name
//	servicename		: service name
//	tenantname		: tenant name(any tenant string or '*')
//
// [NOTE]
// Must create tenant and service keys before calling this function.
//
const rawAllowTenantToService = (
	ownertenant?:	string | null,
	servicename?:	string | null,
	tenantname?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(ownertenant) || !apiutil.isSafeString(servicename) || !apiutil.isSafeString(tenantname)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : ownertenant=' + JSON.stringify(ownertenant) + ', service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// Add tenant to allowed list
	if(!rawAllowTenantToServiceEx(dkcobj, ownertenant, servicename, tenantname)){
		resobj.result	= false;
		resobj.message	= 'could not set tenant(' + tenantname + ') to service(' + servicename + ') member which is owner(' + ownertenant + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// deny tenant from service
//---------------------------------------------------------
//
// Deny(delete) Service member tenants
//
//	ownertenant		: service owner tenant name
//	servicename		: service name
//	tenantname		: tenant name(any tenant string or '*')
//
// [NOTE]
// Must create tenant and service keys before calling this function.
//
const rawDenyTenantFromService = (
	ownertenant?:	string | null,
	servicename?:	string | null,
	tenantname?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(ownertenant) || !apiutil.isSafeString(servicename) || !apiutil.isSafeString(tenantname)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : ownertenant=' + JSON.stringify(ownertenant) + ', service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys(null, tenantname, servicename);
	const	ownerkeys	= getK2hr3Keys(null, ownertenant, null);
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check removing service+tenant is under owner tenant
	//
	let	is_owner_service_tenant = false;
	if(ownerkeys.MASTER_TENANT_TOP_KEY === keys.MASTER_TENANT_TOP_KEY){
		is_owner_service_tenant = true;
	}

	//
	// Check tenant is owner
	//
	if(!rawCheckTenantInServiceOwner(dkcobj, ownertenant, servicename)){
		resobj.result	= false;
		resobj.message	= 'tenant(' + ownertenant + ') is not owner for service(' + servicename + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check service key/owner key/tenant key exists.
	//
	let subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){					// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
		// not found master service key in master service top key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){						// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
		// not found owner key in master service key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no owner key in master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_TENANT_KEY)){					// check subkey yrn:yahoo::::service:<service>:tenant -> yrn:yahoo::::service:<service>
		// not found tenant top key in master service key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.SERVICE_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no tenant key in master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check tenant is in service's tenant list key
	//
	const	is_any_tenant		= (keys.VALUE_WILDCARD === tenantname ? true : false);
	const	delete_tenant_key	= (is_any_tenant ? keys.VALUE_WILDCARD : keys.MASTER_TENANT_TOP_KEY);
	subkeylist					= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));
	if(!apiutil.removeStringFromArray(subkeylist, delete_tenant_key)){						// check(remove) subkey yrn:yahoo:::<tenant> or '*' -> yrn:yahoo::::service:<service>:tenant
		// not found tenant key in master service's tenant list.
		if(!is_any_tenant){
			resobj.result	= false;
			resobj.message	= 'could not found ' + delete_tenant_key + ' subkey under ' + keys.SERVICE_TENANT_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	//
	// Set new tenant list to service's tenant list key
	//
	if(!is_owner_service_tenant && !is_any_tenant){
		if(!dkcobj.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){				// set new tenant list -> yrn:yahoo::::service:<service>:tenant
			resobj.result	= false;
			resobj.message	= 'could not set new(removed tenant) list under ' + keys.SERVICE_TENANT_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	//
	// Check tenant's service list and removed service key from it
	//
	if(!is_any_tenant){
		if(!is_owner_service_tenant){
			// case for not any tenant
			subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
			if(!apiutil.findStringInArray(subkeylist, keys.TENANT_SERVICE_KEY)){			// check subkey yrn:yahoo:::<tenant>:service -> yrn:yahoo:::<tenant>
				// not found service list key in tenant master key.
				r3logger.wlog('Not found ' + keys.TENANT_SERVICE_KEY + ' subkey under ' + keys.MASTER_TENANT_TOP_KEY + ' key');
			}else{
				// check service name in tenant's service list
				subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.TENANT_SERVICE_KEY, true));
				if(!apiutil.removeStringFromArray(subkeylist, keys.MASTER_SERVICE_KEY)){	// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
					// not found service name in tenant's service list.
					r3logger.dlog('Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.TENANT_SERVICE_KEY + ' key');
				}else{
					// remove master service key to service's tenant list
					if(!dkcobj.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){	// set new service list -> yrn:yahoo:::<tenant>:service
						resobj.result	= false;
						resobj.message	= 'could not set new(removed service) list under ' + keys.TENANT_SERVICE_KEY + ' key';
						r3logger.elog(resobj.message);
						dkcobj.clean();
						return resobj;
					}
				}
			}
		}
	}else{
		//
		// If allow any tenant, we set service path into anytenant.
		//
		subkeylist = apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.ANYTENANT_SERVICE_KEY, true));	// get subkey list in yrn:yahoo::::service::anytenant
		if(apiutil.removeStringFromArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			if(!dkcobj.setSubkeys(keys.ANYTENANT_SERVICE_KEY, subkeylist)){		// remove service path -> yrn:yahoo::::service::anytenant
				resobj.result	= false;
				resobj.message	= 'could not remove subkey(' + keys.MASTER_SERVICE_KEY + ') to ' + keys.ANYTENANT_SERVICE_KEY + ' key';
				r3logger.elog(resobj.message);
				dkcobj.clean();
				return resobj;
			}
		}
	}

	//
	// Remove key and subkeys under 'yrn:yahoo:<service>::<tenant>'
	//
	if(!is_any_tenant){
		if(!rawRemoveServiceTenantEx(dkcobj, tenantname, servicename, !is_owner_service_tenant)){
			resobj.result	= false;
			resobj.message	= 'could not remove subkeys(role/policy/resources) under service(' + JSON.stringify(servicename) + ') and tenant(' + JSON.stringify(tenantname) + ')';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// check tenant allowed to service
//---------------------------------------------------------
//
// Check tenant in service's tenant list
//
//	servicename		: service name
//	tenantname		: tenant name
//
// [NOTE]
// Must create tenant and service keys before calling this function.
//
const rawCheckTenantInServiceMember = (
	servicename?:	string | null,
	tenantname?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(servicename) || !apiutil.isSafeString(tenantname)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys(null, tenantname, servicename);
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check tenant key exists.
	//
	// [NOTE]
	// Tenant is allowed as temporary.
	//
	let subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){					// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		// not found tenant top key in master service key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key(must set tenant before adding it to master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check service key/owner key/tenant key exists.
	//
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){					// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
		// not found master service key in master service top key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){						// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
		// not found owner key in master service key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no owner key in master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_TENANT_KEY)){					// check subkey yrn:yahoo::::service:<service>:tenant -> yrn:yahoo::::service:<service>
		// not found tenant top key in master service key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.SERVICE_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no tenant key in master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check tenant is owner
	//
	if(rawCheckTenantInServiceOwner(dkcobj, tenantname, servicename)){
		// tenant is service owner
		dkcobj.clean();
		return resobj;
	}

	//
	// Check tenant in service's tenant list
	//
	if(keys.VALUE_WILDCARD === tenantname){
		// allow any tenant
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));	// check tenant is in service's tenant list -> yrn:yahoo::::service:<service>:tenant
	if(apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){
		// found tenant in service's tenant list
		dkcobj.clean();
		return resobj;
	}

	// not found tenant in service's tenant list
	resobj.result	= false;
	resobj.message	= 'Not found ' + keys.MASTER_TENANT_TOP_KEY + ' key under ' + keys.MASTER_SERVICE_KEY + ' key';
	r3logger.elog(resobj.message);
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// Common raw find tenant key
//---------------------------------------------------------
//	tenant			: tenant name
//	user			: user name
//	id				: tenant id (if user is specified, need this.)
//
//	result			: null is not found
//					  tenant object is found:
//						{
//							name:		<name>
//							id:			<id>
//							desc:		<description>
//							display:	<display tenant name>
//							users:		[user, ...]					<-- "user name"(not yrn path)
//						}
//
// [NOTE]
// If user and id are not specified, all tenants will be searched.
// If user and id are specified, it will be searched by those exact matches.
//
const rawFindTenantEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	user?:				string | null,
	id?:				string | null
): dkcTypeTenantInfo | null => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(tenant)){														// allow user and id are null
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant));
		return null;
	}
	if(apiutil.isSafeString(user) != apiutil.isSafeString(id)){								// allow both user and id are empty or not empty
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', user=' + JSON.stringify(user) + ', id=' + JSON.stringify(id));
		return null;
	}
	tenant	= apiutil.getSafeString(tenant);
	user	= apiutil.getSafeString(user);
	id		= apiutil.getSafeString(id);

	//
	// Keys
	//
	const	keys = getK2hr3Keys(user, tenant);

	//
	// Check tenant
	//
	const	tenantval = dkcobj_permanent.getValue(keys.MASTER_TENANT_TOP_KEY, null, true, null);	// get value in yrn:yahoo:::<tenant>
	if(!apiutil.isSafeString(tenantval) || tenantval != keys.VALUE_ENABLE){
		r3logger.dlog('not found tenant(' + tenant + ') or its value is not ' + keys.VALUE_ENABLE + '.');
		return null;
	}

	const	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){						// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		r3logger.dlog('not found tenant(' + tenant + ') under ' + keys.NO_SERVICE_REGION_KEY + ' key.');
		return null;
	}

	//
	// Get tenant information
	//
	const id_value		= apiutil.getSafeString(dkcobj_permanent.getValue(keys.TENANT_ID_KEY, null, true, null));
	const desc_value	= dkcobj_permanent.getValue(keys.TENANT_DESC_KEY, null, true, null);
	const display_value	= dkcobj_permanent.getValue(keys.TENANT_DISP_KEY, null, true, null);
	const userlist		= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_USER_KEY, true));

	//
	// Check id and user
	//
	if(apiutil.isSafeString(id) && apiutil.isSafeString(user)){
		//
		// Check id value
		//
		if(id_value != id){
			r3logger.elog('Tenant(' + tenant + ') id(' + id_value + ') is not as same as id(' + id + ')');
			return null;
		}
		//
		// Check user in list
		//
		if(!apiutil.findStringInArray(userlist, keys.USER_KEY)){
			r3logger.elog('Tenant(' + tenant + ') does not have user(' + user + ')');
			return null;
		}
	}

	//
	// Make result user list
	//
	const	username_list: string[] = [];
	for(let cnt = 0; cnt < userlist.length; ++cnt){
		let	tmpuser = apiutil.getSafeString(userlist[cnt]);
		if(0 !== tmpuser.indexOf(keys.USER_TOP_KEY + ':')){
			r3logger.wlog('Tenant(' + tenant + ') has unknown formatted user value(' + tmpuser + ')');
			continue;
		}
		// cut yrn path
		tmpuser = tmpuser.replace(keys.USER_TOP_KEY + ':', '');

		// add
		apiutil.tryAddStringToArray(username_list, tmpuser);
	}
	username_list.sort();

	//
	// result object
	//
	const resobj: dkcTypeTenantInfo = {
		name:		tenant,
		id:			id_value,
		desc:		desc_value,
		display:	display_value,
		users:		username_list
	};
	return resobj;
};

//
//	tenant			: tenant name
//	user			: user name
//	id				: tenant id, if user is specified(service is specified, do not need this)
//
//	result			{
//						result:			true/false
//						message:		null or error message
//						tenant:			undefined or object
//										{
//											name:		<name>
//											id:			<id>
//											desc:		<description>
//											display:	<display tenant name>
//											users:		[user, ...]					<-- "user name"(not yrn path)
//										}
//					}
//
// [NOTE]
// If user and id are not specified, all tenants will be searched.
// If user and id are specified, it will be searched by those exact matches.
//
const rawFindTenant = (
	tenant?:	string | null,
	user?:		string | null,
	id?:		string | null
): resTypeFindTenant => {

	const	resobj: resTypeFindTenant = {result: true, message: null};

	if(!apiutil.isSafeString(tenant)){														// allow user and id are null
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(user) != apiutil.isSafeString(id)){								// allow both user and id are empty or not empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', user=' + JSON.stringify(user) + ', id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Find tenant
	//
	const foundTenant = rawFindTenantEx(dkcobj, tenant, user, id);
	if(!apiutil.isSafeEntity(foundTenant) || null === foundTenant){
		resobj.result	= false;
		resobj.message	= 'could not find tenant(' + tenant + ') with user=' + JSON.stringify(user) + ' and id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();

	//
	// Set found tenant object
	//
	resobj.tenant = foundTenant;
	return resobj;
};

//---------------------------------------------------------
// Common raw list local tenant
//---------------------------------------------------------
//
//	user			: user name
//
//	result			: null is not found
//					  tenant object is found:
//						{
//							name:		<name>
//							id:			<id>
//							desc:		<description>
//							display:	<display tenant name>
//							users:		[user, ...]					<-- "user name"(not yrn path)
//						}
//
const rawGetLocalTenantList = (
	dkcobj_permanent:	K2hdkc,
	user?:				string | null
): dkcTypeTenantInfoList | null => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(user)){															// allow user and id are null
		r3logger.elog('some parameters are wrong : user =' + JSON.stringify(user));
		return null;
	}

	//
	// Keys
	//
	let	keys = getK2hr3Keys(user);

	//
	// Loop: tenant key
	//
	const	tenants: dkcTypeTenantInfoList = [];
	const	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
	for(let cnt = 0; cnt < subkeylist.length; ++cnt){
		// tenant path
		const	tenant = apiutil.getSafeString(subkeylist[cnt]);					// tenant => "yrn:yahoo:::<tenant>"

		// check
		if(0 !== tenant.indexOf(keys.NO_SERVICE_TENANT_KEY)){
			r3logger.wlog('Tenant yrn path (' + tenant + ') is unknown format, skip it...');
			continue;
		}
		if(tenant === keys.NO_SERVICE_TENANT_KEY){									// tenant => "yrn:yahoo:::"
			continue;
		}

		// cut yrn path
		const	tenant_name = tenant.replace(keys.USER_TENANT_COMMON_KEY, '');

		// check local tenant
		if(0 !== tenant_name.indexOf(keys.VALUE_PREFIX_LOCAL_TENANT)){
			continue;
		}

		// change keys
		keys = getK2hr3Keys(user, tenant_name);

		//
		// Get tenant information
		//
		const id_value		= dkcobj_permanent.getValue(keys.TENANT_ID_KEY, null, true, null);
		const desc_value	= dkcobj_permanent.getValue(keys.TENANT_DESC_KEY, null, true, null);
		const display_value	= dkcobj_permanent.getValue(keys.TENANT_DISP_KEY, null, true, null);
		const userlist		= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_USER_KEY, true));

		//
		// Check id value
		//
		if(!apiutil.isSafeString(id_value)){
			r3logger.wlog('Tenant yrn path (' + tenant + ') has wrong id value, skip it...');
			continue;
		}

		//
		// Check user in list
		//
		if(!apiutil.findStringInArray(userlist, keys.TENANT_USER_KEY)){
			r3logger.dlog('User(' + user + ') is not Tenant(' + tenant + ') member, skip it.');
			return null;
		}

		//
		// Make result user list
		//
		const	username_list: string[] = [];
		for(let cnt2 = 0; cnt2 < userlist.length; ++cnt2){
			let tmpuser = apiutil.getSafeString(userlist[cnt2]);
			if(0 !== tmpuser.indexOf(keys.USER_TOP_KEY + ':')){
				r3logger.wlog('Tenant(' + tenant_name + ') has unknown formatted user value(' + tmpuser + ')');
				continue;
			}
			// cut yrn path
			tmpuser = tmpuser.replace(keys.USER_TOP_KEY + ':', '');

			// add
			apiutil.tryAddStringToArray(username_list, tmpuser);
		}
		username_list.sort();

		//
		// add tenant object
		//
		const one_tenant: dkcTypeTenantInfo = {
			name:		tenant_name,
			id:			id_value,
			desc:		desc_value,
			display:	display_value,
			users:		username_list
		};
		tenants.push(one_tenant);
	}
	return tenants;
};

//
//	user		: user name
//	is_expand	: expand tenant object
//
//	result		{
//					result:			true/false
//					message:		null or error message
//					tenants:		undefined or object array
//									[
//										"tenant name",
//										...
//									]
//									or
//									[
//										{
//											name:		<name>
//											id:			<id>
//											desc:		<description>
//											display:	<display tenant name>
//											users:		[user, ...]					<-- "user name"(not yrn path)
//										},
//									]
//				}
//
// [NOTE]
// If find an unnecessary tenant key, update it.
//
const rawListLocalTenant = (
	user?:		string | null,
	is_expand?:	boolean | null
): resTypeLocalTenantList => {

	const	resobj: resTypeLocalTenantList = {result: true, message: null};

	if(!apiutil.isBoolean(is_expand)){
		is_expand	= false;														// default not expand
	}

	if(!apiutil.isSafeString(user)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);			// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Keys
	//
	const keys = getK2hr3Keys(user);

	//
	// Check all local tenant list for user (if not existed, add it)
	//
	const	localtenantlist = apiutil.getSafeArray<dkcTypeTenantInfo>(rawGetLocalTenantList(dkcobj, user));
	const	usertenantlist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.USER_TENANT_TOP_KEY, true));
	let		need_update		= false;
	for(let cnt = 0; cnt < localtenantlist.length; ++cnt){
		// tmpkeys
		const	tmpkeys = getK2hr3Keys(user, localtenantlist[cnt].name);

		// check
		if(!apiutil.findStringInArray(usertenantlist, tmpkeys.USER_TENANT_KEY)){
			r3logger.dlog('user(' + user + ') does not have local tenant(' + localtenantlist[cnt].name + '), so add it.');
			usertenantlist.push(tmpkeys.USER_TENANT_KEY);
			need_update	= true;														// for add local tenant
		}
	}
	if(need_update){
		if(!dkcobj.setSubkeys(keys.USER_TENANT_TOP_KEY, usertenantlist)){	//  Update subkey "yrn:yahoo::::user:<user>:tenant"
			r3logger.elog('could not update (' + keys.USER_TENANT_TOP_KEY + ') subkey, but continue...');
		}
	}

	//
	// Make list from tenant list in users
	//
	const	obj_list: dkcTypeTenantInfoList	= [];
	const	name_list: string[]				= [];
	const	update_list: string[]			= [];
	const	subkeylist						= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.USER_TENANT_TOP_KEY, true));
	need_update								= false;
	for(let cnt = 0; cnt < subkeylist.length; ++cnt){
		let	tenant_name = apiutil.getSafeString(subkeylist[cnt]);					// tenant_name => "yrn:yahoo::::user:<user>:tenant/" or "yrn:yahoo::::user:<user>:tenant/<name>"

		if(0 !== tenant_name.indexOf(keys.USER_TENANT_COMMON_KEY)){
			r3logger.wlog('Tenant yrn path (' + tenant_name + ') in user(' + user + ') is unknown format, remove this subkey...');
			need_update	= true;														// for cut this invalid subkey
			continue;
		}

		// cut yrn path
		tenant_name = tenant_name.replace(keys.USER_TENANT_COMMON_KEY, '');
		if(!apiutil.isSafeString(tenant_name)){										// tenant key is "yrn:yahoo::::user:<user>:tenant/"
			apiutil.tryAddStringToArray(update_list, subkeylist[cnt]);				// set subkey list(if update it)
			continue;
		}

		// check local tenant
		if(0 !== tenant_name.indexOf(keys.VALUE_PREFIX_LOCAL_TENANT)){
			apiutil.tryAddStringToArray(update_list, subkeylist[cnt]);				// set subkey list(if update it)
			continue;
		}

		// get tenant object
		const res_findtenant = rawFindTenantEx(dkcobj, tenant_name);
		if(!apiutil.isSafeEntity(res_findtenant) || null === res_findtenant){
			r3logger.wlog('could not get tenant object for tenant(' + tenant_name + ') in user(' + user + '), remove this subkey...');
			need_update	= true;														// for cut this invalid subkey
			continue;
		}

		// check user in list
		if(!apiutil.findStringInArray(res_findtenant.users, user)){
			r3logger.wlog('could not find user(' + user + ') in tenant(' + tenant_name + '), remove this subkey...');
			need_update	= true;														// for cut this invalid subkey
			continue;
		}

		// set values
		const tenant_obj: dkcTypeTenantInfo = {
			name:		res_findtenant.name,
			id:			res_findtenant.id,
			desc:		res_findtenant.desc,
			display:	res_findtenant.display,
			users:		res_findtenant.users
		};

		apiutil.tryAddStringToArray(update_list, subkeylist[cnt]);					// set subkey list(if update it)

		// make result
		obj_list.push(tenant_obj);
		name_list.push(tenant_name);
	}

	// update
	if(need_update){
		if(!dkcobj.setSubkeys(keys.USER_TENANT_TOP_KEY, update_list)){		//  Update subkey "yrn:yahoo::::user:<user>:tenant"
			r3logger.elog('could not update (' + keys.USER_TENANT_TOP_KEY + ') subkey, but continue...');
		}
	}
	dkcobj.clean();

	if(is_expand){
		resobj.tenants = obj_list;
	}else{
		resobj.tenants = name_list;
	}
	return resobj;
};

//---------------------------------------------------------
// Remove tenant from user
//---------------------------------------------------------
//	user		user name
//	tenant		tenant name
//
// [NOTE]
// Call this function together with rawRemoveUserFromTenant.
// And it should be called before rawRemoveUserFromTenant.
//
const rawRemoveTenantFromUser = (
	dkcobj_permanent:	K2hdkc,
	user?:				string | null,
	tenant?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant)){
		r3logger.elog('parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant));
		return false;
	}

	//
	// Keys
	//
	let		result	= true;
	const	keys	= getK2hr3Keys(user, tenant);

	//
	// Get tenant list under user key
	//
	const	user_tenants = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.USER_TENANT_TOP_KEY, true));	// get user's tenant list
	if(apiutil.findStringInArray(user_tenants, keys.USER_TENANT_KEY)){
		//
		// Found tenant yrn path in list, update tenant list in user
		//
		if(!apiutil.removeStringFromArray(user_tenants, keys.USER_TENANT_KEY)){
			r3logger.wlog('not found tenant(' + tenant + ') in subkey list for user(' + user + '), but continue...');
		}else{
			if(!dkcobj_permanent.setSubkeys(keys.USER_TENANT_TOP_KEY, user_tenants)){	// update subkey in "yrn:yahoo::::user:<user>:tenant"
				r3logger.elog('could not remove tenant(' + tenant + ') in subkey list for user(' + user + '), but continue...');
				result = false;
			}
		}
	}

	//
	// Remove token for tenant key/tenant key in user
	//
	if(!dkcobj_permanent.remove(keys.USER_TENANT_SCOPE_TOKEN_KEY, false)){		// remove "yrn:yahoo::::user:<user>:tenant/<tenant>/token"
		r3logger.dlog('could not remove token key(' + keys.USER_TENANT_SCOPE_TOKEN_KEY + '), probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(keys.USER_TENANT_KEY, false)){					// remove "yrn:yahoo::::user:<user>:tenant/<tenant>"
		r3logger.dlog('could not remove token key(' + keys.USER_TENANT_SCOPE_TOKEN_KEY + '), probably it is not existed.');
	}

	return result;
};

//---------------------------------------------------------
// Remove user from tenant
//---------------------------------------------------------
//	tenant		tenant name
//	user		user name
//
// [NOTE]
// Call this function together with rawRemoveTenantFromUser.
// And you have to call rawRemoveTenantFromUser before calling it.
//
// If there are no users or services in the target tenant, the tenant will also be deleted.
//
const rawRemoveUserFromTenant = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	user?:				string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(user)){
		r3logger.elog('parameters are wrong : tenant=' + JSON.stringify(tenant) + ', user=' + JSON.stringify(user));
		return false;
	}

	//
	// Keys
	//
	let		result	= true;
	const	keys	= getK2hr3Keys(user, tenant);

	//
	// Get user list under tenant key
	//
	const	tenant_users = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_USER_KEY, true));		// get tenant's user list
	if(apiutil.findStringInArray(tenant_users, keys.USER_KEY)){
		//
		// Found user yrn path in list, update user list in tenant
		//
		if(!apiutil.removeStringFromArray(tenant_users, keys.USER_KEY)){
			r3logger.wlog('not found user(' + user + ') in subkey list for tenant(' + tenant + '), but continue...');
		}else{
			if(!dkcobj_permanent.setSubkeys(keys.TENANT_USER_KEY, tenant_users)){			// update subkey in "yrn:yahoo:::<tenant>:user"
				r3logger.elog('could not remove user(' + user + ') in subkey list for tenant(' + tenant + '), but continue...');
				result = false;
			}
		}

	}

	//
	// Check users and services for tenant, if both are empty, remove tenant
	//
	const	tenant_services = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_SERVICE_KEY, true));	// get tenant's service list
	if(!apiutil.isNotEmptyArray(tenant_users) && !apiutil.isNotEmptyArray(tenant_services)){
		//
		// Remove tenant subkey in "yrn:yahoo:::"
		//
		let subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
		if(!apiutil.removeStringFromArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){
			r3logger.wlog('not found tenant(' + tenant + ') in subkey list for no region key(' + keys.NO_SERVICE_REGION_KEY + '), but continue...');
		}else{
			if(!dkcobj_permanent.setSubkeys(keys.NO_SERVICE_REGION_KEY, subkeylist)){		// update subkey in "yrn:yahoo:::"
				r3logger.elog('could not remove tenant(' + tenant + ') in subkey list for no region key(' + keys.NO_SERVICE_REGION_KEY + '), but continue...');
				result = false;
			}
		}

		//
		// Remove all resources("yrn:yahoo:<service>::<tenant>:resource:*")
		//
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.RESOURCE_TOP_KEY, true));
		if(apiutil.isNotEmptyArray(subkeylist)){
			for(let cnt = 0; cnt < subkeylist.length; ++cnt){
				let tmpsubkey = apiutil.getSafeString(subkeylist[cnt]);
				if(0 !== tmpsubkey.indexOf(keys.RESOURCE_TOP_KEY + ':')){
					r3logger.wlog('tenant(' + tenant + ') has unknown formatted resource value(' + tmpsubkey + ')');
					continue;
				}
				// cut yrn path
				tmpsubkey = tmpsubkey.replace(keys.RESOURCE_TOP_KEY + ':', '');

				if(!rawRemovePolicyEx(dkcobj_permanent, tenant, null, tmpsubkey)){
					r3logger.elog('failed to remove resource(' + tmpsubkey + ') in tenant(' + tenant + '), but continue...');
					result = false;
				}
			}
		}

		//
		// Remove all policies("yrn:yahoo:<service>::<tenant>:policy:*")
		//
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.POLICY_TOP_KEY, true));
		if(apiutil.isNotEmptyArray(subkeylist)){
			for(let cnt = 0; cnt < subkeylist.length; ++cnt){
				let tmpsubkey = apiutil.getSafeString(subkeylist[cnt]);
				if(0 !== tmpsubkey.indexOf(keys.POLICY_TOP_KEY + ':')){
					r3logger.wlog('tenant(' + tenant + ') has unknown formatted policy value(' + tmpsubkey + ')');
					continue;
				}
				// cut yrn path
				tmpsubkey = tmpsubkey.replace(keys.POLICY_TOP_KEY + ':', '');

				if(!rawRemovePolicyEx(dkcobj_permanent, tenant, null, tmpsubkey)){
					r3logger.elog('failed to remove policy(' + tmpsubkey + ') in tenant(' + tenant + '), but continue...');
					result = false;
				}
			}
		}

		//
		// Remove all roles("yrn:yahoo:<service>::<tenant>:role:*")
		//
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.ROLE_TOP_KEY, true));
		if(apiutil.isNotEmptyArray(subkeylist)){
			for(let cnt = 0; cnt < subkeylist.length; ++cnt){
				let tmpsubkey = apiutil.getSafeString(subkeylist[cnt]);
				if(0 !== tmpsubkey.indexOf(keys.ROLE_TOP_KEY + ':')){
					r3logger.wlog('tenant(' + tenant + ') has unknown formatted role value(' + tmpsubkey + ')');
					continue;
				}
				// cut yrn path
				tmpsubkey = tmpsubkey.replace(keys.ROLE_TOP_KEY + ':', '');

				if(!rawRemoveRoleEx(dkcobj_permanent, tenant, null, tmpsubkey)){
					r3logger.elog('failed to remove role(' + tmpsubkey + ') in tenant(' + tenant + '), but continue...');
					result = false;
				}
			}
		}

		//
		// Remove all subkey in tenant
		//
		if(!dkcobj_permanent.remove(keys.TENANT_ID_KEY, false)){							// remove "yrn:yahoo:::<tenant>:id"
			r3logger.elog('could not remove id key(' + keys.TENANT_ID_KEY + '), probably it is not existed.');
			result = false;
		}
		if(!dkcobj_permanent.remove(keys.TENANT_DESC_KEY, false)){							// remove "yrn:yahoo:::<tenant>:desc"
			r3logger.elog('could not remove description key(' + keys.TENANT_DESC_KEY + '), probably it is not existed.');
			result = false;
		}
		if(!dkcobj_permanent.remove(keys.TENANT_DISP_KEY, false)){							// remove "yrn:yahoo:::<tenant>:display"
			r3logger.elog('could not remove display key(' + keys.TENANT_DISP_KEY + '), probably it is not existed.');
			result = false;
		}
		if(!dkcobj_permanent.remove(keys.TENANT_USER_KEY, false)){							// remove "yrn:yahoo:::<tenant>:user"
			r3logger.elog('could not remove user key(' + keys.TENANT_USER_KEY + '), probably it is not existed.');
			result = false;
		}
		if(!dkcobj_permanent.remove(keys.TENANT_SERVICE_KEY, false)){						// remove "yrn:yahoo:::<tenant>:service"
			r3logger.elog('could not remove service key(' + keys.TENANT_SERVICE_KEY + '), probably it is not existed.');
			result = false;
		}

		//
		// Remove tenant key
		//
		if(!dkcobj_permanent.remove(keys.MASTER_TENANT_TOP_KEY, false)){					// remove "yrn:yahoo:::<tenant>"
			r3logger.elog('could not remove service key(' + keys.MASTER_TENANT_TOP_KEY + '), probably it is not existed.');
			result = false;
		}
	}
	return result;
};

//---------------------------------------------------------
// Common remove local tenant
//---------------------------------------------------------
//	tenant		: tenant name
//	id			: tenant id
//
//	result		: true/false
//
const rawRemoveLocalTenantEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	user?:				string | null,
	id?:				string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(user) || !apiutil.isSafeString(id)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', user=' + JSON.stringify(user) + ', id=' + JSON.stringify(id));
		return false;
	}

	//
	// Keys
	//
	const keys = getK2hr3Keys(user, tenant);

	//
	// Check tenant name
	//
	if(0 !== tenant.indexOf(keys.VALUE_PREFIX_LOCAL_TENANT)){
		// Not have prefix("local@")
		r3logger.elog('tenant(' + tenant + ') must be start ' + keys.VALUE_PREFIX_LOCAL_TENANT + ' prefix for local tenant.');
		return false;
	}

	//
	// Find tenant
	//
	const find_result = rawFindTenantEx(dkcobj_permanent, tenant, user, id);
	if(!apiutil.isSafeEntity(find_result)){
		r3logger.elog('could not find tenant(' + tenant + ') with user=' + JSON.stringify(user) + ' and id=' + JSON.stringify(id));
		return false;
	}
	const tenant_result: dkcTypeTenantInfo = find_result;

	//
	// Check user in tenant user list
	//
	if(!apiutil.findStringInArray(tenant_result.users, user)){
		r3logger.elog('user(' + user + ') is not tenant(' + tenant + ') user member.');
		return false;
	}

	//
	// Remove all user from tenant
	//
	// [NOTE]
	// Deleting all users of a tenant automatically deletes the tenant.
	//
	let	error = false;
	if(apiutil.isArray(tenant_result.users)){
		for(let cnt = 0; cnt < tenant_result.users.length; ++cnt){
			const delete_user_name = tenant_result.users[cnt].replace(keys.USER_TOP_KEY + ':', '');
			if(!rawRemoveUserFromLocalTenantEx(dkcobj_permanent, tenant, delete_user_name, id)){
				r3logger.elog('could not delete user(' + delete_user_name + ') from local tenant(' + tenant + '), id(' + id + '), but continue...');
				error = true;
			}
		}
	}
	if(error){
		r3logger.elog('failed to remove some user in local tenant.');
		return false;
	}
	return true;
};

//
//	tenant		: tenant name
//	user		: user name
//	id			: tenant id
//
//	result		{
//					result:			true/false
//					message:		null or error message
//				}
//
const rawRemoveLocalTenant = (
	tenant?:	string | null,
	user?:		string | null,
	id?:		string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(user) || !apiutil.isSafeString(id)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', user=' + JSON.stringify(user) + ', id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);			// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	if(!rawRemoveLocalTenantEx(dkcobj, tenant, user, id)){
		resobj.result	= false;
		resobj.message	= 'could not remove local tenant(' + JSON.stringify(tenant) + '), id(' + JSON.stringify(id) + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();

	return resobj;
};

//---------------------------------------------------------
// Common remove user from local tenant
//---------------------------------------------------------
//	tenant		: tenant name
//	user		: user name
//	id			: tenant id
//
//	result		: true/false
//
const rawRemoveUserFromLocalTenantEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	user?:				string | null,
	id?:				string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(user) || !apiutil.isSafeString(id)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', user=' + JSON.stringify(user) + ', id=' + JSON.stringify(id));
		return false;
	}

	//
	// Keys
	//
	const keys = getK2hr3Keys(user, tenant);

	//
	// Check tenant name
	//
	if(0 !== tenant.indexOf(keys.VALUE_PREFIX_LOCAL_TENANT)){
		// Not have prefix("local@")
		r3logger.elog('tenant(' + tenant + ') must be start ' + keys.VALUE_PREFIX_LOCAL_TENANT + ' prefix for local tenant.');
		return false;
	}

	//
	// Find tenant
	//
	const find_result = rawFindTenantEx(dkcobj_permanent, tenant, user, id);
	if(!apiutil.isSafeEntity(find_result)){
		r3logger.elog('could not find tenant(' + tenant + ') with user=' + JSON.stringify(user) + ' and id=' + JSON.stringify(id));
		return false;
	}
	const tenant_result: dkcTypeTenantInfo = find_result;

	//
	// Check user list in tenant
	//
	if(!apiutil.findStringInArray(tenant_result.users, user)){
		r3logger.elog('user(' + user + ') is not tenant(' + tenant + ') member.');
		return false;
	}

	//
	// Remove tenant from user
	//
	if(!rawRemoveTenantFromUser(dkcobj_permanent, user, tenant)){
		r3logger.elog('failed to remove tenant(' + tenant + ') from user(' + user + ').');
		return false;
	}

	//
	// Remove user from tenant
	//
	// [NOTE]
	// If all users of a tenant disappear after deletion, the tenant is automatically deleted.
	//
	if(!rawRemoveUserFromTenant(dkcobj_permanent, tenant, user)){
		r3logger.elog('failed to remove user(' + user + ') from tenant(' + tenant + ').');
		return false;
	}

	return true;
};

//
//	tenant		: tenant name
//	user		: user name
//	id			: tenant id
//
//	result		{
//					result:			true/false
//					message:		null or error message
//				}
//
const rawRemoveUserFromLocalTenant = (
	tenant?:	string | null,
	user?:		string | null,
	id?:		string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(user) || !apiutil.isSafeString(id)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', user=' + JSON.stringify(user) + ', id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);			// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	if(!rawRemoveUserFromLocalTenantEx(dkcobj, tenant, user, id)){
		resobj.result	= false;
		resobj.message	= 'could not remove user(' + JSON.stringify(user) + ') from tenant(' + JSON.stringify(tenant) + '), id(' + JSON.stringify(id) + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();

	return resobj;
};

//---------------------------------------------------------
// Add tenant to existed user key
//---------------------------------------------------------
//	user			: user name
//	tenant			: tenant name
//
//	result			: null for failure
//					  user yrn full path for success
//
// [NOTE]
// Both user and service can not be specified at same time.
// This function create keys without resource/policy/role, you must be careful for service
// case.
//
const rawAddTenantToExistedUser = (
	dkcobj_permanent:	K2hdkc,
	user?:				string | null,
	tenant?:			string | null
): string | null => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant)){
		r3logger.elog('some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant));
		return null;
	}

	const keys = getK2hr3Keys(user, tenant);

	//
	// Check user exists
	//
	let	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.USER_KEY, true));
	if(!apiutil.isNotEmptyArray(subkeylist) || !apiutil.findStringInArray(subkeylist, keys.USER_ID_KEY)){
		r3logger.elog('user(' + user + ') does not exist.');
		return null;
	}

	//
	// Add tenant key to user subkey list
	//
	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.USER_TENANT_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_KEY)){
		if(!dkcobj_permanent.setSubkeys(keys.USER_TENANT_TOP_KEY, subkeylist)){	// add subkey [..., yrn:yahoo::::user:<user>:tenant/<tenant>] -> yrn:yahoo::::user:<user>:tenant
			r3logger.elog('could not add ' + keys.USER_TENANT_KEY + ' subkey under ' + keys.USER_TENANT_TOP_KEY + ' key');
			return null;
		}
	}

	// [NOTE]
	// We do not create "yrn:yahoo::::user:<user>:tenant/<tenant>" keys
	// These keys have token(scoped and unscoped) value, these values is set another function.
	//
	return keys.USER_KEY;
};

//---------------------------------------------------------
// Common raw create tenant key
//---------------------------------------------------------
//	user			: user name(existed main user)
//	tenant			: tenant name
//	service			: service name
//	id				: tenant id, if user is specified(service is specified, do not need this)
//	desc			: tenant description, if user is specified(service is specified, do not need this)
//	display			: display name, if user is specified(service is specified, do not need this)
//	tenant_users	: tenant users in this tenant (this parameter is invalid if service is specified)
//
// [NOTE]
// Both user and service can not be specified at same time.
// This function create keys without resource/policy/role, you must be careful for service
// case.
//
const rawCreateTenantEx = (
	dkcobj_permanent:	K2hdkc,
	user?:				string | null,
	tenant?:			string | null,
	service?:			string | null,
	id?:				string | number | null,
	desc?:				string | null,
	display?:			string | null,
	tenant_users?:		string[] | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant)){														// allow service, user, desc and display are null
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant));
		return false;
	}

	let	_id: string = '';
	if(apiutil.isSafeString(user) && !apiutil.isSafeString(service)){
		//
		// case: specified user parameter
		//
		if(apiutil.isSafeNumber(id)){
			// If id is a number, to string
			//
			_id = String(id);
		}else if(apiutil.isSafeString(id)){
			_id = id;
		}else{
			r3logger.elog('parameter is wrong : id=' + JSON.stringify(id));
			return false;
		}
		service	= null;

		if(!apiutil.isNotEmptyArray(tenant_users)){
			r3logger.elog('parameter is wrong : tenant_users=' + JSON.stringify(tenant_users));
			return false;
		}

	}else if(apiutil.isSafeString(service) && !apiutil.isSafeString(user)){
		//
		// case: specified service parameter
		//
		service		= service.toLowerCase();
		user		= null;
		tenant_users= null;
	}else{
		r3logger.elog('some parameters are wrong(both are empty or not empty) : service=' + JSON.stringify(service) + ', user=' + JSON.stringify(user));
		return false;
	}

	//
	// Keys
	//
	const	keys = getK2hr3Keys(user, tenant, service);

	//
	// Check tenant top key exists and create these.
	//
	if(null !== service){
		//
		// Specified service name
		//
		// Need to check master tenant key and service key exist, because we do not create tenant
		// key under service key without no master tenant key.
		//

		//
		// check master service keys
		//
		let subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_TENANT_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_TOP_KEY)){			// check subkey yrn:yahoo::::service -> yrn:yahoo:::
			// not found service top key.
			r3logger.elog('Not found ' + keys.MASTER_SERVICE_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_TENANT_KEY + ' key(there is no service top key)');
			return false;
		}
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){				// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::service
			// not found master service key.
			r3logger.elog('Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)');
			return false;
		}
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_TENANT_KEY)){				// check subkey yrn:yahoo::::service:<service>:tenant -> yrn:yahoo:::service:<service>
			// not found tenant key in master service key.
			r3logger.elog('Not found ' + keys.SERVICE_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no service key)');
			return false;
		}

		//
		// check tenant is allowed to add service
		//
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TENANT_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){				// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo:::service:<service>:tenant
			// check any tenant allowed
			if(!apiutil.findStringInArray(subkeylist, keys.VALUE_WILDCARD)){				// check subkey '*' -> yrn:yahoo:::service:<service>:tenant
				// not found tenant key in master service key.
				r3logger.elog('Not found ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.SERVICE_TENANT_KEY + ' key(there is no master tenant key in master service tenant)');
				return false;
			}

			// [NOTE]
			// if this tenant is allowed by that service has any tenant key.
			// we need to set tenant's service list and service's tenant list.
			//
			const	ownertenant = dkcobj_permanent.getValue(keys.SERVICE_OWNER_KEY, null, true, null);	// get value in yrn:yahoo::::service:<service>:owner
			if(!apiutil.isSafeString(ownertenant)){
				r3logger.elog('service(' + keys.MASTER_SERVICE_KEY + ') owner key(' + keys.SERVICE_OWNER_KEY + ') is something wrong.');
				return false;
			}
			if(!rawAllowTenantToServiceEx(dkcobj_permanent, ownertenant, service, tenant)){
				r3logger.elog('could not set tenant(' + tenant + ') to service(' + service + ') member which is owner(' + ownertenant + ')');
				return false;
			}
		}

		//
		// check master tenant keys
		//
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){				// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
			// not found master tenant key under no service key.
			r3logger.elog('Not found ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key(there is no tenant master key)');
			return false;
		}
		const tenantval = dkcobj_permanent.getValue(keys.MASTER_TENANT_TOP_KEY, null, true, null);// get value in yrn:yahoo:::<tenant>
		if(!apiutil.isSafeString(tenantval) || tenantval != keys.VALUE_ENABLE){
			// tenant value is not enable, it is temporary tenant which has not been confirmed yet.
			r3logger.elog('tenant(' + keys.MASTER_TENANT_TOP_KEY + ') key does not have ' + keys.VALUE_ENABLE + ' value, it is registered as temporary.');
			return false;
		}

		//
		// check & create tenant key under service path
		//
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.DOMAIN_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_TOP_KEY)){
			// create service top key
			if(!dkcobj_permanent.setSubkeys(keys.DOMAIN_KEY, subkeylist)){			// add subkey yrn:yahoo:<service> -> yrn:yahoo
				r3logger.elog('could not add ' + keys.SERVICE_TOP_KEY + ' subkey under ' + keys.DOMAIN_KEY + ' key');
				return false;
			}
		}
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TOP_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_NO_REGION_KEY)){
			// create service key path without region
			if(!dkcobj_permanent.setSubkeys(keys.SERVICE_TOP_KEY, subkeylist)){	// add subkey yrn:yahoo:<service>: -> yrn:yahoo:<service>
				r3logger.elog('could not add ' + keys.SERVICE_NO_REGION_KEY + ' subkey under ' + keys.SERVICE_TOP_KEY + ' key');
				return false;
			}
		}
		subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.SERVICE_NO_REGION_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_TOP_KEY)){
			// create tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.SERVICE_NO_REGION_KEY, subkeylist)){	// add subkey yrn:yahoo:<service>::<tenant> -> yrn:yahoo:<service>:
				r3logger.elog('could not add ' + keys.TENANT_TOP_KEY + ' subkey under ' + keys.SERVICE_NO_REGION_KEY + ' key');
				return false;
			}
		}

		// [NOTE]
		// This function does not check service's verify url for resource.
		// And not create ACR role/policy for it.
		// You need to create these keys after calling this function.
		//

	}else{
		//
		// Not specify service name
		//
		// Check (master) tenant key exists and create these.
		//
		let subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){			// on this case, MASTER_TENANT_TOP_KEY == TENANT_TOP_KEY
			// create master tenant top key
			if(!dkcobj_permanent.setSubkeys(keys.NO_SERVICE_REGION_KEY, subkeylist)){	// add subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
				r3logger.elog('could not add ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
				return false;
			}
		}

		//
		// Check id/desc/disp/user/service top key under master tenant key
		//
		let need_update	= false;
		subkeylist		= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_ID_KEY)){
			need_update	= true;
		}
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_DESC_KEY)){
			need_update	= true;
		}
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_DISP_KEY)){
			need_update	= true;
		}
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_USER_KEY)){
			need_update	= true;
		}
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_SERVICE_KEY)){
			need_update	= true;
		}
		if(need_update){
			// add id/desc/disp/user keys to master tenant top key's subkey list
			if(!dkcobj_permanent.setSubkeys(keys.MASTER_TENANT_TOP_KEY, subkeylist)){	// add subkey yrn:yahoo:<service>::<tenant>:{id/desc/disp/user/service} -> yrn:yahoo:<service>::<tenant>
				r3logger.elog('could not add id/desc/disp/user key to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
				return false;
			}
		}

		//
		// Update id/desc/user/service key's value
		//
		let value = dkcobj_permanent.getValue(keys.TENANT_ID_KEY, null, true, null);
		if(value != _id){
			if(!dkcobj_permanent.setValue(keys.TENANT_ID_KEY, _id)){				// update value id -> yrn:yahoo:::<tenant>:id
				r3logger.elog('could not set ' + _id + ' value to ' + keys.TENANT_ID_KEY + ' key');
				return false;
			}
		}
		value = dkcobj_permanent.getValue(keys.TENANT_DESC_KEY, null, true, null);
		if(!apiutil.isSafeEntity(desc)){
			desc = '';
		}
		if(value != desc){
			if(!dkcobj_permanent.setValue(keys.TENANT_DESC_KEY, desc)){				// update value desc -> yrn:yahoo:::<tenant>:desc
				r3logger.elog('could not set ' + desc + ' value to ' + keys.TENANT_DESC_KEY + ' key');
				return false;
			}
		}
		value = dkcobj_permanent.getValue(keys.TENANT_DISP_KEY, null, true, null);
		if(!apiutil.isSafeEntity(display)){
			display = '';
		}
		if(value != display){
			if(!dkcobj_permanent.setValue(keys.TENANT_DISP_KEY, display)){				// update value desc -> yrn:yahoo:::<tenant>:display
				r3logger.elog('could not set ' + display + ' value to ' + keys.TENANT_DISP_KEY + ' key');
				return false;
			}
		}
		// [NOTE]
		// Only add direct users here.
		//
		const	user_subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_USER_KEY, true));
		user_subkeylist.sort();
		if(apiutil.tryAddStringToArray(user_subkeylist, keys.USER_KEY)){
			user_subkeylist.sort();
			if(!dkcobj_permanent.setSubkeys(keys.TENANT_USER_KEY, user_subkeylist)){	// add subkey yrn:yahoo::::user:<user> -> yrn:yahoo:::<tenant>:user
				r3logger.elog('could not add ' + keys.USER_KEY + ' subkey under ' + keys.TENANT_USER_KEY + ' key');
				return false;
			}
		}
		value = dkcobj_permanent.getValue(keys.TENANT_SERVICE_KEY, null, true, null);
		if(value != keys.VALUE_ENABLE){
			if(!dkcobj_permanent.setValue(keys.TENANT_SERVICE_KEY, keys.VALUE_ENABLE)){	// set value enable(dummy) -> yrn:yahoo:::<tenant>:service
				r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.TENANT_SERVICE_KEY + ' key');
				return false;
			}
		}

		//
		// Update tenant's value
		//
		const tenantval = dkcobj_permanent.getValue(keys.MASTER_TENANT_TOP_KEY, null, true, null);// get value in yrn:yahoo:::<tenant>
		if(!apiutil.isSafeString(tenantval) || tenantval != keys.VALUE_ENABLE){
			if(!dkcobj_permanent.setValue(keys.MASTER_TENANT_TOP_KEY, keys.VALUE_ENABLE)){	// update value -> yrn:yahoo:::<tenant>
				r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
				return false;
			}
		}

		//
		// Add tenant users to tenant
		//
		const	new_user_subkeylist: string[] = [];
		if(apiutil.isStringArray(tenant_users)){
			for(let cnt = 0; cnt < tenant_users.length; ++cnt){
				// add one tenant user
				const	added_other_user = rawAddTenantToExistedUser(dkcobj_permanent, tenant_users[cnt], tenant);
				if(!apiutil.isSafeString(added_other_user)){
					continue;
				}
				// check new adding user
				if(apiutil.tryAddStringToArray(new_user_subkeylist, added_other_user)){
					new_user_subkeylist.sort();
				}
			}
		}

		//
		// Delete tenant users
		//
		for(let cnt = 0; cnt < user_subkeylist.length; ++cnt){
			if(apiutil.findStringInArray(new_user_subkeylist, user_subkeylist[cnt])){
				continue;
			}
			// user does not in new tenant users
			const	delete_user_name = user_subkeylist[cnt].replace(keys.USER_TOP_KEY + ':', '');
			if(!rawRemoveUserFromLocalTenantEx(dkcobj_permanent, tenant, delete_user_name, _id)){
				r3logger.elog('could not delete user(' + delete_user_name + ') from tenant(' + tenant + '), id(' + _id + '), but continue...');
			}
		}

		//
		// Re-update user key in tenant(always update...)
		//
		if(!dkcobj_permanent.setSubkeys(keys.TENANT_USER_KEY, new_user_subkeylist)){	// add subkey yrn:yahoo::::user:<user> -> yrn:yahoo:::<tenant>:user
			r3logger.elog('could not add ' + keys.USER_KEY + ' subkey under ' + keys.TENANT_USER_KEY + ' key');
			return false;
		}
	}

	//
	// Check role/policy/resource key in tenant(with service, without service) key
	//
	let		is_update		= false;
	const	subkeylist_tmp	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.TENANT_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist_tmp, keys.ROLE_TOP_KEY)){
		is_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist_tmp, keys.POLICY_TOP_KEY)){
		is_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist_tmp, keys.RESOURCE_TOP_KEY)){
		is_update	= true;
	}
	if(is_update){
		// add role/policy/resource keys to tenant top key's subkey list
		if(!dkcobj_permanent.setSubkeys(keys.TENANT_TOP_KEY, subkeylist_tmp)){			// add subkey yrn:yahoo:<service or null>::<tenant>:{role/policy/resource} -> yrn:yahoo:<service or null>::<tenant>
			r3logger.elog('could not add role/policy/resource key to ' + keys.TENANT_TOP_KEY + ' key');
			return false;
		}
	}
	let value_tmp = dkcobj_permanent.getValue(keys.ROLE_TOP_KEY, null, true, null);
	if(value_tmp != keys.VALUE_ENABLE){
		if(!dkcobj_permanent.setValue(keys.ROLE_TOP_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo:<service or null>::<tenant>:role
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ROLE_TOP_KEY + ' key');
			return false;
		}
	}
	value_tmp = dkcobj_permanent.getValue(keys.POLICY_TOP_KEY, null, true, null);
	if(value_tmp != keys.VALUE_ENABLE){
		if(!dkcobj_permanent.setValue(keys.POLICY_TOP_KEY, keys.VALUE_ENABLE)){		// set value enable(dummy) -> yrn:yahoo:<service or null>::<tenant>:policy
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.POLICY_TOP_KEY + ' key');
			return false;
		}
	}
	value_tmp = dkcobj_permanent.getValue(keys.RESOURCE_TOP_KEY, null, true, null);
	if(value_tmp != keys.VALUE_ENABLE){
		if(!dkcobj_permanent.setValue(keys.RESOURCE_TOP_KEY, keys.VALUE_ENABLE)){		// set value enable(dummy) -> yrn:yahoo:<service or null>::<tenant>:resource
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.RESOURCE_TOP_KEY + ' key');
			return false;
		}
	}
	return true;
};

//---------------------------------------------------------
// Common raw create tenant key as temporary
//---------------------------------------------------------
//	tenant			: tenant name
//
// [NOTE]
// This function creates the tenant key as temporary.
// This is used when there is a need to provisionally register
// a tenant in a state where the presence of the tenant has
// not been confirmed.
// Current, this is used when registering a tenant as a service
// member in a state where data does not exist now.
//
const rawCreateTenantTemporary = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant));
		return false;
	}

	//
	// Keys
	//
	const	keys = getK2hr3Keys(null, tenant);

	//
	// Check (master) tenant key exists and create these.
	//
	let	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
	if(!apiutil.tryAddStringToArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){			// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		r3logger.dlog('already exists ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
		return true;
	}

	// create master tenant top key
	if(!dkcobj_permanent.setSubkeys(keys.NO_SERVICE_REGION_KEY, subkeylist)){	// add subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		r3logger.elog('could not add ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
		return false;
	}

	//
	// Set tenant key's value as temporary
	//
	if(!dkcobj_permanent.setValue(keys.MASTER_TENANT_TOP_KEY, keys.VALUE_DISABLE)){	// set "disable" value -> yrn:yahoo:::<tenant>
		r3logger.elog('could not set ' + keys.VALUE_DISABLE + ' value to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
		return false;
	}

	//
	// Set tenant's service key ant its value
	//
	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_SERVICE_KEY)){
		// add only service key to master tenant top key's subkey list
		if(!dkcobj_permanent.setSubkeys(keys.MASTER_TENANT_TOP_KEY, subkeylist)){	// add subkey yrn:yahoo:<service>::<tenant>:service -> yrn:yahoo:<service>::<tenant>
			r3logger.elog('could not add service key to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
			return false;
		}
	}
	if(!dkcobj_permanent.setValue(keys.TENANT_SERVICE_KEY, keys.VALUE_ENABLE)){	// set value enable(dummy) -> yrn:yahoo:::<tenant>:service
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.TENANT_SERVICE_KEY + ' key');
		return false;
	}
	return true;
};

//---------------------------------------------------------
// Common raw check tenant key as not temporary
//---------------------------------------------------------
//	tenant			: tenant name
//	servicename		: service name(allowed null/undefined)
//
// [NOTE]
// This function returns true if a tenant key exists ant it
// is not temporary.
//
const rawCheckTenantEnable = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	servicename?:		string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant));
		return false;
	}
	if(!apiutil.isSafeString(servicename)){
		servicename = null;
	}

	//
	// Keys
	//
	const	keys		= getK2hr3Keys(null, tenant, servicename);
	const	tenantval	= dkcobj_permanent.getValue(keys.MASTER_TENANT_TOP_KEY, null, true, null);	// get value in yrn:yahoo:::<tenant>
	if(!apiutil.isSafeString(tenantval) || tenantval != keys.VALUE_ENABLE){
		r3logger.dlog('not found tenant(' + tenant + ') or its value is not ' + keys.VALUE_ENABLE + '.');
		return false;
	}

	const	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){						// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		r3logger.dlog('not found tenant(' + tenant + ') under ' + keys.NO_SERVICE_REGION_KEY + ' key.');
		return false;
	}

	return true;
};

//---------------------------------------------------------
// create tenant key(no service)
//---------------------------------------------------------
//	user			: user name
//	tenant			: tenant name
//	id				: tenant id
//	desc			: tenant description
//	display			: display name
//	tenant_users	: tenant users in this tenant (this parameter is invalid if service is specified)
//	is_replace_users: replace with tenant_users if this flag is true (default). if false, tenant_users will be added.
//
// [NOTE]
// This function does not check the user is a member in tenant, then
// you must check it before calling this function.
//
const rawCreateTenant = (
	user?:				string | null,
	tenant?:			string | null,
	id?:				string | number | null,
	desc?:				string | null,
	display?:			string | null,
	tenant_users?:		string | string[] | null,
	is_replace_users?:	boolean | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(user)){						// allow desc and display are null
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', desc=' + JSON.stringify(desc) + ', user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}

	let	_id: string;
	if(apiutil.isSafeNumber(id)){
		// If id is a number, to string
		//
		_id = String(id);
	}else if(apiutil.isSafeString(id)){
		_id = id;
	}else{
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		return resobj;
	}

	let	_tenant_users: string[] = [];
	if(!apiutil.isStringArray(tenant_users) && !apiutil.isSafeString(tenant_users)){
		// tenant_users must be array or string
		//
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : tenant_users=' + JSON.stringify(tenant_users);
		r3logger.elog(resobj.message);
		return resobj;
	}else if(apiutil.isSafeString(tenant_users)){
		_tenant_users = [tenant_users];
	}else if(apiutil.isStringArray(tenant_users)){
		_tenant_users = tenant_users;
	}

	if(!apiutil.isBoolean(is_replace_users)){
		is_replace_users = true;
	}

	const dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	if(!is_replace_users){
		const	findobj = rawFindTenantEx(dkcobj, tenant, user, _id);
		if(apiutil.isSafeEntity(findobj)){
			// found tenant
			_tenant_users = apiutil.mergeArray(_tenant_users, apiutil.getSafeStringArray(findobj.users));
			_tenant_users.sort();
		}
	}

	//
	// Create tenant top
	//
	if(!rawCreateTenantEx(dkcobj, user, tenant, null, id, desc, display, _tenant_users)){
		resobj.result	= false;
		resobj.message	= 'could not create tenant(' + tenant + ') with id(' + id + '), desc(' + JSON.stringify(desc) + '), display(' + JSON.stringify(display) + '), user(' + user + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// Common raw create tenant key(with service)
//---------------------------------------------------------
//	tenant			: tenant name
//	service			: service name
//	token			: (un)scoped user token(this value is used for calling verify URL)
//	user			: user name(this value is used for calling verify URL)
//	passwd			: user pass phrase(this value is used for calling verify URL)
//	callback		: callback function
//
// [NOTE]
// Calling verify URL with scoped user token which is one shot.
// ACR functions need scoped user token for calling verify url, then this function should
// get user/passwd/token input variables, these parameters is specified following pattern.
//
//	1) no token
//		Both user and passwd parameters must be specified, and token must be null(undefined).
//	2) unscoped token
//		Both user and token parameters must be specified, and passwd must be null(undefined).
//		The token parameter should be "unscoped" user token.
//	3) scoped token
//		token parameter must be specified, and both user and passwd must be null(undefined).
//		The token parameter should be "scoped" user token.
//
// [NOTE]
// Check user is tenant member, before call this function!!!
//
const rawCreateServiceTenantEx = (
	tenant?:	string | null,
	service?:	string | null,
	token?:		string | null,
	user?:		string | null,
	passwd?:	string | null,
	callback?:	cbTypeK2hr3ApiNoBodyResponse
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(service)){					// not check other parameters here.
		const _error = new Error('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		r3logger.elog(_error.message);
		callback(_error);
		return;
	}
	const	_callback				= callback;
	const	_tenant					= tenant;
	let		_service: string | null	= null;
	let		_token: string | null	= null;
	let		_user: string | null	= null;
	let		_passwd: string | null	= null;
	if(apiutil.isSafeString(service)){
		_service	= service.toLowerCase();
	}else{
		_service	= null;
	}
	if(apiutil.isSafeString(token)){
		_token		= token;
	}
	if(apiutil.isSafeString(user)){
		_user		= user;
	}
	if(apiutil.isSafeString(passwd)){
		_passwd		= passwd;
	}

	const	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		const _error = new Error('Not initialize yet, or configuration is not set');
		r3logger.elog(_error.message);
		dkcobj.clean();
		_callback(_error);
		return;
	}

	//
	// Keys for getting verify url
	//
	const	keys		= getK2hr3Keys(_user, _tenant, _service);
	const	verifyurl	= dkcobj.getValue(keys.SERVICE_VERIFY_TENANT_KEY, null, true, null);
	if(!apiutil.isSafeString(verifyurl)){
		const _error = new Error('key(' + keys.SERVICE_VERIFY_TENANT_KEY + ') does not have safe verify url nor JSON string : ' + JSON.stringify(verifyurl));
		r3logger.elog(_error.message);
		dkcobj.clean();
		_callback(_error);
		return;
	}

	//
	// Create tenant top under service
	//
	if(!rawCreateTenantEx(dkcobj, null, _tenant, _service)){
		const _error = new Error('could not create tenant(' + _tenant + ') under service(' + _service + ')');
		r3logger.elog(_error.message);
		dkcobj.clean();
		_callback(_error);
		return;
	}

	// [NOTE] release the object here.
	dkcobj.clean();

	//
	// Get resource from verify url(url or JSON string)
	//
	acrutil.getACRSendVerify(_token, _user, _passwd, _tenant, verifyurl, (error: Error | null, resources: dkcTypeACRVerifyOneResponseBodyData[] | null): void =>{
		if(null !== error){
			r3logger.elog(error.message);
			_callback(error);
			return;
		}

		const dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)

		//
		// Create resource
		//
		const	reskeys = rawCreateServiceTenantResource(dkcobj, _tenant, _service, resources);
		if(null === reskeys || !apiutil.isNotEmptyArray(reskeys)){
			const _error = new Error('could not create any resource key(' + JSON.stringify(resources) + ') for tenant(' + _tenant + ') and service(' + _service + ')');
			r3logger.elog(_error.message);
			dkcobj.clean();
			_callback(_error);
			return;
		}

		//
		// Create policy
		//
		if(!rawCreateServiceTenantPolicy(dkcobj, _tenant, _service, reskeys)){
			const _error = new Error('could not create policy key for tenant(' + _tenant + ') and service(' + _service + ')');
			r3logger.elog(_error.message);
			dkcobj.clean();
			_callback(_error);
			return;
		}

		//
		// Create role
		//
		if(!rawCreateServiceTenantRole(dkcobj, _tenant, _service)){
			const _error = new Error('could not create role key for tenant(' + _tenant + ') and service(' + _service + ')');
			r3logger.elog(_error.message);
			dkcobj.clean();
			_callback(_error);
			return;
		}

		dkcobj.clean();
		_callback(null);
	});
};

//---------------------------------------------------------
// create tenant key(with service, user)
//---------------------------------------------------------
//	tenant			: tenant name
//	service			: service name
//	user			: user name(this value is used for calling verify URL)
//	passwd			: user pass phrase(this value is used for calling verify URL)
//	callback		: callback function
//
const rawCreateServiceTenantByUser = (
	tenant?:	string | null,
	service?:	string | null,
	user?:		string | null,
	passwd?:	string | null,
	callback?:	cbTypeK2hr3ApiNoBodyResponse
): void => {

	return rawCreateServiceTenantEx(tenant, service, null, user, passwd, callback);
};

//---------------------------------------------------------
// create tenant key(with service, unscoped user token)
//---------------------------------------------------------
//	tenant			: tenant name
//	service			: service name
//	unscopedtoken	: unscoped user token(this value is used for calling verify URL)
//	user			: user name(this value is used for calling verify URL)
//	callback		: callback function
//
const rawCreateServiceTenantByUnscopedToken = (
	tenant?:		string | null,
	service?:		string | null,
	unscopedtoken?:	string | null,
	user?:			string | null,
	callback?:		cbTypeK2hr3ApiNoBodyResponse
): void => {

	return rawCreateServiceTenantEx(tenant, service, unscopedtoken, user, null, callback);
};

//---------------------------------------------------------
// create tenant key(with service, scoped user token)
//---------------------------------------------------------
//	tenant			: tenant name
//	service			: service name
//	scopedtoken		: scoped user token(this value is used for calling verify URL)
//	callback		: callback function
//
const rawCreateServiceTenantByScopedToken = (
	tenant?:		string | null,
	service?:		string | null,
	scopedtoken?:	string | null,
	callback?:		cbTypeK2hr3ApiNoBodyResponse
): void => {

	return rawCreateServiceTenantEx(tenant, service, scopedtoken, null, null, callback);
};

//---------------------------------------------------------
// Remove tenant under service
//---------------------------------------------------------
//	user			: user name(user must be tenant member)
//	tenant			: tenant name
//	service			: service name
//
const rawRemoveServiceTenant = (
	user?:		string | null,
	tenant?:	string | null,
	service?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(service)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// check user is tenant member
	//
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to remove tenant(' + tenant + '), service(' + service + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// remove key
	if(!rawRemoveServiceTenantEx(dkcobj, tenant, service, false)){							// always not remove tenant and service relation
		resobj.message	= 'could not remove subkeys(role/policy/resources) under service(' + JSON.stringify(service) + ') and tenant(' + JSON.stringify(tenant) + ')';
		resobj.result	= false;
		r3logger.elog(resobj.message);
	}
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// ACR Get Service Tenant Resources
//---------------------------------------------------------
//
// Get All resources under Service Tenant(ACR)
//
//	service									: service name
//	service_ip								: IP address string from service server
//	service_port							: Port number from service server
//	service_cuk								: cuk from service server
//	service_roleyrn							: Role full yrn path for service server
//	client_ip								: IP address string from client
//	client_port								: Port number from client
//	client_cuk								: cuk from client
//	client_roleyrn							: Role full yrn path for client
//
//	return:
//	resTypeGetServiceTenantResources = {
//		result:			true or false		: result
//		message:		error message		: error message when error
//		resources:		null or array		: all resources when no error
//		[
//			dkcTypeACRVerifyOneResponseBodyData = {
//				name: 	<resource name>		: resource name which is key name(path) for resource
//				expire:	<expire>			: undefined/null or integer
//				type:	<resource type>		: resource data type(string or object), if date is null or '', this value must be string.
//				data:	<resource data>		: resource data which must be string or object or null/undefined.
//				keys:	null or object		: resource has keys(associative array), or null/undefined.
//				{
//					'foo':	bar,:			: any value is allowed
//					...
//				}
//			},
//			...
//		]
//	}
//
// [NOTE]
//	The resources returns the return value from the verify URL.
//	If the result of the verify URL is null (empty), null will be returned.
//	Returns all resources as an array.
//
const rawGetServiceTenantResources = (
	service?:			string | null,
	service_ip?:		string | null,
	service_port?:		number | null,
	service_cuk?:		string | null,
	service_roleyrn?:	string | null,
	client_ip?:			string | null,
	client_port?:		number | null,
	client_cuk?:		string | null,
	client_roleyrn?:	string | null
): resTypeGetServiceTenantResources => {

	const	resobj: resTypeGetServiceTenantResources = {result: true, message: null};

	if(!apiutil.isSafeString(service) || !apiutil.isSafeString(service_ip) || !apiutil.isSafeString(service_roleyrn) || !apiutil.isSafeString(client_ip) || !apiutil.isSafeString(client_roleyrn)){	// service_port, client_port are allowed null
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : service=' + JSON.stringify(service) + ', service_ip=' + JSON.stringify(service_ip) + ', service_roleyrn=' + JSON.stringify(service_roleyrn) + ', client_ip=' + JSON.stringify(client_ip) + ', client_roleyrn=' + JSON.stringify(client_roleyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeNumber(service_port)){
		service_port = 0;																	// clear
	}
	if(!apiutil.isSafeNumber(client_port)){
		client_port = 0;																	// clear
	}
	if(!apiutil.isSafeString(service_cuk)){
		service_cuk = null;																	// clear
	}
	if(!apiutil.isSafeString(client_cuk)){
		client_cuk = null;																	// clear
	}

	//
	// Check service/client role yrns
	//
	let		keys		= getK2hr3Keys(null, null, service);								// temporary
	const	roleyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	let		rolematches	= service_roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + service_roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	const	service_tenant	= rolematches[2].toLowerCase();

	rolematches			= client_roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + client_roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	const client_tenant	= rolematches[2].toLowerCase();

	const dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check service ip+port+cuk is service's role member
	//
	if(!rawFindRoleHost(dkcobj, service_roleyrn, null, service_ip, service_port, service_cuk, false)){	// not strictly checking
		resobj.result	= false;
		resobj.message	= 'service ip(' + service_ip + ') and port(' + String(service_port) + ') and cuk(' + JSON.stringify(service_cuk) + ') is not service role(' + service_roleyrn + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check service tenant is Service owner tenant
	//
	if(!rawCheckTenantInServiceOwner(dkcobj, service_tenant, service)){
		resobj.result	= false;
		resobj.message	= 'service tenant(' + service_tenant + ') is not service(' + service + ') owner tenant.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check client ip+port is service's role member
	//
	if(!rawFindRoleHost(dkcobj, client_roleyrn, null, client_ip, client_port, client_cuk, false)){		// not strictly checking
		resobj.result	= false;
		resobj.message	= 'client ip(' + client_ip + ') and port(' + String(client_port) + ') and cuk(' + JSON.stringify(client_cuk) + ') is not client role(' + client_roleyrn + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check client tenant exists in Service's tenant list
	//
	keys			= getK2hr3Keys(null, client_tenant, service);										// Keys for client
	let subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));		// check client tenant is in service's tenant list -> yrn:yahoo::::service:<service>:tenant
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){
		resobj.result	= false;
		resobj.message	= 'client tenant(' + client_tenant + ') is not service(' + service + ') tenant member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check client role allowed accessing resources
	//
	// get policies in role
	const	roledata: dkcTypeRoleValue = {
		policies:	[] as string[]																		// policies = keys.VALUE_POLICIES_TYPE
	};
	if(!rawGetRoles(dkcobj, client_roleyrn, roledata, true) || !apiutil.isNotEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		resobj.result	= false;
		resobj.message	= 'could not get any policy data for client role(' + client_roleyrn + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// make resource top path to access
	keys				= getK2hr3Keys(null, client_tenant, service);									// Keys for service + tenant(client)
	const target_policy	= keys.POLICY_TOP_KEY + ':' + keys.ACR_POLICY_KW;								// 'yrn:yahoo:<service>::<tenant>:policy:arc-policy'

	// check policies
	const tmp_poltype	= roledata[keys.VALUE_POLICIES_TYPE];
	if(!apiutil.isStringArray(tmp_poltype) || !apiutil.findStringInArray(tmp_poltype, target_policy)){
		resobj.result	= false;
		resobj.message	= 'role(' + client_roleyrn + ') does not allow to read access to resource(' + keys.RESOURCE_TOP_KEY + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Get all service/client_tenant resource keys
	//
	const	resources: dkcTypeACRVerifyOneResponseBodyData[]= [];

	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.RESOURCE_TOP_KEY, true));			// get subkey list from yrn:yahoo:<service>::<tenant>:resource:*
	if(apiutil.isNotEmptyArray(subkeylist)){
		//
		// Get each resource's hole data
		//
		const	ptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);						// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
		for(let cnt = 0; cnt < subkeylist.length; ++cnt){
			// check resource name and path
			const	matches	= subkeylist[cnt].match(ptn);
			if(!apiutil.isNotEmptyArray(matches) || matches.length < 4 || !apiutil.isSafeString(matches[1]) || !apiutil.isSafeString(matches[2]) || !apiutil.isSafeString(matches[3])){
				// wrong path for resource, then skip it.
				r3logger.wlog('subkey(' + JSON.stringify(subkeylist[cnt]) + ') is not safe resource path for tenant(' + JSON.stringify(client_tenant) + ') and service(' + JSON.stringify(service) + ')');
				continue;
			}
			if(!apiutil.compareCaseString(matches[1], service) || !apiutil.compareCaseString(matches[2], client_tenant)){
				// wrong path for resource, then skip it.
				r3logger.wlog('subkey(' + JSON.stringify(subkeylist[cnt]) + ') is not under tenant(' + JSON.stringify(client_tenant) + ') and service(' + JSON.stringify(service) + ')');
				continue;
			}

			//
			// get one resource with template engine
			//
			const	resource_result = rawGetResourceEx(dkcobj, matches[2].toLowerCase(), matches[1].toLowerCase(), subkeylist[cnt], true);
			if(!resource_result.result){
				r3logger.wlog('could not get resource (' + JSON.stringify(subkeylist[cnt]) + ') with expanding, but continue...');
				continue;
			}

			// set one resource object
			const	one_resource: dkcTypeACRVerifyOneResponseBodyData = {
				name:	matches[3].toLowerCase()				// name is keys.ACR_RESOURCE_NAME_KEY, but tsc can not understand key name specified vairable.
			};
			if(apiutil.isSafeEntity(resource_result.resource)){
				const tmp_resource: dkcTypeResourceRawDataValue = resource_result.resource;
				// expire
				if(apiutil.isSafeEntity(tmp_resource[keys.VALUE_EXPIRE_TYPE]) && null !== tmp_resource[keys.VALUE_EXPIRE_TYPE]){
					one_resource[keys.ACR_RESOURCE_EXPIRE_KEY]	= tmp_resource[keys.VALUE_EXPIRE_TYPE];
				}
				// type & data
				if(apiutil.isSafeString(tmp_resource[keys.VALUE_STRING_TYPE])){
					// string type
					one_resource[keys.ACR_RESOURCE_TYPE_KEY]	= keys.VALUE_STRING_TYPE;
					one_resource[keys.ACR_RESOURCE_DATA_KEY]	= tmp_resource[keys.VALUE_STRING_TYPE];
				}else if(apiutil.isSafeString(tmp_resource[keys.VALUE_OBJECT_TYPE])){
					// object type
					one_resource[keys.ACR_RESOURCE_TYPE_KEY]	= keys.VALUE_OBJECT_TYPE;
					one_resource[keys.ACR_RESOURCE_DATA_KEY]	= tmp_resource[keys.VALUE_OBJECT_TYPE];
				}else{
					// default is string type
					one_resource[keys.ACR_RESOURCE_TYPE_KEY]	= keys.VALUE_STRING_TYPE;
					one_resource[keys.ACR_RESOURCE_DATA_KEY]	= apiutil.isSafeEntity(tmp_resource[keys.VALUE_STRING_TYPE]) ? tmp_resource[keys.VALUE_STRING_TYPE] : null;
				}
				// keys
				if(apiutil.isSafeEntity(tmp_resource[keys.VALUE_KEYS_TYPE])){
					one_resource[keys.ACR_RESOURCE_KEYS_KEY]	= tmp_resource[keys.VALUE_KEYS_TYPE];
				}
			}
			resources.push(one_resource);
		}
	}

	// set resources
	if(0 < resources.length){
		resobj.resources = resources;
	}else{
		resobj.resources = null;
	}
	resobj.resources = resources;

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// create user key
//---------------------------------------------------------
const rawCreateUser = (
	user?:		string | null,
	id?:		string | number | null,
	username?:	string | null,
	tenant?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user)){														// allow username/tenant is null
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}

	if(apiutil.isSafeNumber(id)){
		// If id is a number, to string
		//
		id = String(id);
	}else if(!apiutil.isSafeString(id)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys(user, tenant);
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Check user key exists and create these.
	//
	let	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.USER_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_KEY)){
		if(!dkcobj.setSubkeys(keys.USER_TOP_KEY, subkeylist)){						// add subkey yrn:yahoo::::user:<user> -> yrn:yahoo::::user
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.USER_KEY + ' subkey under ' + keys.USER_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	subkeylist		= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.USER_KEY, true));
	let	need_update	= false;
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_ID_KEY)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_TOP_KEY)){
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj.setSubkeys(keys.USER_KEY, subkeylist)){							// add subkey yrn:yahoo::::user:<user>:{id, tenant} -> yrn:yahoo::::user:<user>
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.USER_ID_KEY + ', ' + keys.USER_TENANT_TOP_KEY + ' subkey under ' + keys.USER_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	const	value = dkcobj.getValue(keys.USER_ID_KEY, null, true, null);
	if(value != id){
		if(!dkcobj.setValue(keys.USER_ID_KEY, id)){								// update value user id -> yrn:yahoo::::user:<user>:id
			resobj.result	= false;
			resobj.message	= 'could not set ' + id + ' to ' + keys.USER_ID_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	subkeylist	= apiutil.getSafeStringArray(dkcobj.getSubkeys(keys.USER_TENANT_TOP_KEY, true));
	need_update	= false;
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_COMMON_KEY)){
		need_update	= true;
	}
	if(apiutil.isSafeString(keys.USER_TENANT_KEY) && apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_KEY)){
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj.setSubkeys(keys.USER_TENANT_TOP_KEY, subkeylist)){				// add subkey yrn:yahoo::::user:<user>:tenant{/, /<tenant>} -> yrn:yahoo::::user:<user>:tenant
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.USER_TENANT_COMMON_KEY + ', ' + keys.USER_TENANT_KEY + ' subkey under ' + keys.USER_TENANT_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	// [NOTE]
	// We do not create "yrn:yahoo::::user:<user>:tenant/" and "yrn:yahoo::::user:<user>:tenant/<tenant>" keys
	// These keys have token(scoped and unscoped) value, these values is set another function.
	//

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// get user information
//---------------------------------------------------------
// return:	null or object
//				{
//					'name':	user name,
//					'id':	user id
//				}
//
const rawGetUserId = (username?: string | null): resTypeBasicUserInfo | null => {

	if(!apiutil.isSafeString(username)){
		r3logger.elog('parameter is wrong : username=' + JSON.stringify(username));
		return null;
	}

	const	keys	= getK2hr3Keys(username.toLowerCase(), null);
	const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);						// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		dkcobj.clean();
		return null;
	}

	const	value 	= dkcobj.getValue(keys.USER_ID_KEY, null, true, null);			// get user id from yrn:yahoo::::user:<user>:id
	dkcobj.clean();
	if(!apiutil.isSafeString(value)){
		r3logger.dlog('could not find user(' + username + ')');
		return null;
	}

	const resobj: resTypeBasicUserInfo = {
		name:	username.toLowerCase(),
		id:		value.toLowerCase()
	};
	return resobj;
};

//---------------------------------------------------------
// check and update user/tenant key for comprehension
//---------------------------------------------------------
//	user			user name
//	tenant_list		new tenant name list for user
//
//	[NOTE]
//	If current user's tenant in list is not in new tenant list, that tenant has to
//	remove from user's tenant list and user name has to remove from tenant's user
//	list.
//	This function only works for removing, but not for adding. You must add new
//	tenant before calling this function.
//
const rawRemoveComprehensionByNewTenants = (
	user?:			string | null,
	tenant_list?:	string[] | null
): boolean => {

	if(!apiutil.isSafeString(user)){
		r3logger.elog('user parameter is wrong');
		return false;
	}
	// result
	let	result = true;

	// make new tenant keys
	const	notenant_keys		= getK2hr3Keys(user);										// no tenant keys
	const	new_user_tenants	= [notenant_keys.USER_TENANT_COMMON_KEY];					// "yrn:yahoo::::user:<user>:tenant/"			---> must have unscoped token in tenant list
	if(apiutil.isNotEmptyArray(tenant_list)){
		for(let cnt = 0; cnt < tenant_list.length; ++cnt){
			const	tenant_name	= apiutil.getSafeString(tenant_list[cnt]);
			if('' !== tenant_name){
				const keys = getK2hr3Keys(user, tenant_name);								// user + tenant keys
				new_user_tenants.push(keys.USER_TENANT_KEY);								// "yrn:yahoo::::user:<user>:tenant/<tenant>"	---> add new tenant to list
			}
		}
	}

	// get current tenant list
	const	dkcobj						= k2hdkc(dkcconf, dkcport, dkccuk, true, false);									// use permanent object(need to clean)
	const	cur_user_tenants			= dkcobj.getSubkeys(notenant_keys.USER_TENANT_TOP_KEY, true);				// get current tenant list
	const	rm_user_tenants: string[]	= [];																				// tenant key name in user key which must be removed
	const	tg_tenant_keys: string[]	= [];																				// tenant key name which has user name who must be removed
	const	pattern						= new RegExp('^' + notenant_keys.USER_TENANT_COMMON_KEY + '(.*)');					// regex = /^yrn:yahoo::::user:<user>\:tenant\/(.*)/
	let		is_changed					= false;
	const	localtenant_prefix			= notenant_keys.USER_TENANT_COMMON_KEY + notenant_keys.VALUE_PREFIX_LOCAL_TENANT;	// "yrn:yahoo::::user:<user>:tenant/<local tenant prefix>"

	if(apiutil.isNotEmptyArray(cur_user_tenants)){
		for(let cnt = 0; cnt < cur_user_tenants.length; ){
			const	cur_tenant	= cur_user_tenants[cnt].toLowerCase();

			// check tenant in list and not local tenant
			if(!apiutil.findStringInArray(new_user_tenants, cur_tenant) && 0 !== cur_tenant.indexOf(localtenant_prefix)){
				// not found current tenant key in new tenants list, so add removed key list
				cur_user_tenants.splice(cnt, 1);
				rm_user_tenants.push(cur_tenant);

				// add tenant's user key
				const	match_tenant_names	= cur_tenant.match(pattern);					// reverse to only tenant name
				if(apiutil.isNotEmptyArray(match_tenant_names) && 2 <= match_tenant_names.length && '' !== match_tenant_names[1]){
					const keys = getK2hr3Keys(user, match_tenant_names[1]);					// user + matched tenant name keys
					tg_tenant_keys.push(keys.TENANT_USER_KEY);								// "yrn:yahoo:::<tenant>:user"			---> subkeys: user list
				}
				is_changed	= true;
			}else{
				++cnt;
			}
		}
	}

	// update tenant list(subkeys) and remove old tenant key
	if(is_changed){
		// set tenant list to subkey
		if(!dkcobj.setSubkeys(notenant_keys.USER_TENANT_TOP_KEY, cur_user_tenants)){	// update subkey "yrn:yahoo::::user:<user>:tenant/{<tenant>...}"	---> "yrn:yahoo::::user:<user>:tenant"
			r3logger.elog('could not update tenant subkey list under ' + notenant_keys.USER_TENANT_TOP_KEY + ' key');
			dkcobj.clean();
			return false;
		}

		// remove keys under user's tenant key
		for(let cnt = 0; cnt < rm_user_tenants.length; ++cnt){
			if(!dkcobj.remove(rm_user_tenants[cnt], true)){						// remove old tenant key and it's children		---> "yrn:yahoo::::user:<user>:tenant/<tenant>{/*}"
				r3logger.elog('could not remove user tenant key ' + rm_user_tenants[cnt] + ', but continue...');
				result	= false;
			}
		}

		// remove user name in tenant's subkey
		for(let cnt = 0; cnt < tg_tenant_keys.length; ++cnt){
			const	tg_tenant_userlist	= dkcobj.getSubkeys(tg_tenant_keys[cnt], true);	// get user list in target tenant key
			if(apiutil.findStringInArray(tg_tenant_userlist, notenant_keys.USER_KEY)){
				// remove user name from subkey list
				if(!apiutil.removeStringFromArray(tg_tenant_userlist, notenant_keys.USER_KEY)){
					r3logger.elog('could not remove user subkey list in tenant user key ' + tg_tenant_keys[cnt] + ', but continue...');
					result	= false;
				}else{
					// update user list
					if(!dkcobj.setSubkeys(tg_tenant_keys[cnt], tg_tenant_userlist)){	// update subkey "yrn:yahoo:::<tenant>:user"
						r3logger.elog('could not remove user subkey list in tenant user key ' + tg_tenant_keys[cnt] + ', but continue...');
						result	= false;
					}
				}
			}
		}
	}
	dkcobj.clean();

	return result;
};

//---------------------------------------------------------
// common create role raw function
//---------------------------------------------------------
// user					:	user name
// tenant				:	tenant name
// service				:	service name
// role					:	role name or full yrn role
// policies				:	role policies
//							if policies is null, it means not updating policies.
//							if policies is '', it means clearing role's policies.
// alias_roles			:	role has alias
//							if this is null, it means not updating alias.
//							if this is '' or array(0), it means clearing alias.
// hosts				:	role hostnames(array)
//							if this is enabled value, always add hosts.
//							if hosts is null or '' or array(0), it means not updating hosts.
// clear_old_hostnames	:	clear all existing hostnames
//							if true, clear all existing hostnames
// ips					:	role ips(array)
//							if this is enabled value, always add ips.
//							if ips is null or '' or array(0), it means not updating ips.
// clear_old_ips		:	clear all existing ips
//							if true, clear all existing ips
//
// [hosts elements]		:	element is following
//							hostname allows any string(x.yahoo.co.jp, x[0-9].yahoo.co.jp, *, ...)
//							ether hostname or ip address can be specified, and both can not be specified.
//							dkcTypeHostRawValueSet = {
//								hostname:	"x.y.x.yahoo.co.jp"	(or null)
//								ip:			"172.1.1.1"			(or null)
//								port:		8000				(if not specify, the value is 0="any")
//								cuk:		"any string"		(if not specify, the value is null or undefined)
//								extra:		"explain, etc"		(if not specify, the value is null or undefined)
//								tag:		"tag string"		(if not specify, the value is null or undefined)
//								inboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//								outboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//								(key:		undefined)
//								(id:		undefined)
//							}
//
// [NOTE]				:	if parent role key does not have this role key, set role key
//							into parent's subkey
//							The role, policies, hosts, ips, clear_old_* arguments must not be specified when
//							service name is specified.
//							Must exist yrn:yahoo:<service>::<tenant> key before calling this function.
//
const rawCreateRoleEx = (
	dkcobj_permanent:		K2hdkc,
	user?:					string | null,
	tenant?:				string | null,
	service?:				string | null,
	role?:					string | null,
	policies?:				string | string[] | null,
	alias_roles?:			string | string[] | null,
	hosts?:					string | dkcTypeHostRawValueSet | dkcTypeHostRawValueSet[] | null,
	clear_old_hostnames?:	boolean | null,
	ips?:					string | dkcTypeHostRawValueSet | dkcTypeHostRawValueSet[] | null,
	clear_old_ips?:			boolean | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant)){													// allow other argument is empty
		r3logger.elog('parameter is wrong : tenant=' + JSON.stringify(tenant));
		return false;
	}
	if(!apiutil.isSafeString(user) && !apiutil.isSafeString(service)){					// user or service is not empty
		r3logger.elog('some parameters are wrong : user=' + JSON.stringify(user) + ', service=' + JSON.stringify(service));
		return false;
	}
	if(!apiutil.isSafeString(user)){
		user			= null;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	let	_role: string;
	let	is_policies: boolean;
	let	is_service	= false;
	let	is_alias	= false;
	let keys		= getK2hr3Keys(user, tenant, null);

	if(apiutil.isSafeString(service)){
		// service name is specified.
		// the role is ACR(accessing crossed roles), then checking parameters for it.
		// (policies, hosts, ips, aliases must be empty.)
		//
		is_service	= true;
		service		= apiutil.getSafeString(service).toLowerCase();
		keys		= getK2hr3Keys(user, tenant, service);

		if(apiutil.isSafeString(role)){
			r3logger.elog('parameter role is specified, but this role is ARC : service =' + JSON.stringify(service) + ', tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role));
			return false;
		}
		if(apiutil.isSafeEntity(policies)){
			r3logger.elog('parameter policies is specified, but this role is ARC : service =' + JSON.stringify(service) + ', tenant=' + JSON.stringify(tenant) + ', policies=' + JSON.stringify(policies));
			return false;
		}
		if(apiutil.isSafeEntity(hosts)){
			r3logger.elog('parameter hosts is specified, but this role is ARC : service =' + JSON.stringify(service) + ', tenant=' + JSON.stringify(tenant) + ', hosts=' + JSON.stringify(hosts));
			return false;
		}
		if(apiutil.isSafeEntity(ips)){
			r3logger.elog('parameter ips is specified, but this role is ARC : service =' + JSON.stringify(service) + ', tenant=' + JSON.stringify(tenant) + ', ips=' + JSON.stringify(ips));
			return false;
		}
		if(apiutil.isSafeEntity(alias_roles)){
			r3logger.elog('parameter aliases is specified, but this role is ARC : service =' + JSON.stringify(service) + ', tenant=' + JSON.stringify(tenant) + ', aliases=' + JSON.stringify(alias_roles));
			return false;
		}

		// setting
		_role				= keys.ROLE_TOP_KEY + ':' + keys.ACR_ROLE_KW;			// role yrn path     = 'yrn:yahoo:<service>::<tenant>:role:arc-role'
		policies			= [keys.POLICY_TOP_KEY + ':' + keys.ACR_POLICY_KW];		// set static policy = 'yrn:yahoo:<service>::<tenant>:policy:arc-policy'
		is_policies			= true;
		hosts 				= [];
		ips					= [];
		clear_old_hostnames	= true;
		clear_old_ips		= true;

	}else{
		// service name is not specified.
		// the role is NOT ACR(accessing crossed roles).
		//
		service = null;

		if(!apiutil.isSafeString(role)){
			r3logger.elog('parameter role is wrong : role=' + JSON.stringify(role));
			return false;
		}
		_role = role;

		if(apiutil.isStringArray(policies)){
			is_policies	= true;
		}else if(apiutil.isString(policies) && '' === policies){
			is_policies	= true;
			policies 	= [] as string[];
		}else if(!apiutil.isSafeEntity(policies)){
			is_policies	= false;
			policies 	= [] as string[];
		}else{
			r3logger.elog('parameter policies is wrong : policies=' + JSON.stringify(policies));
			return false;
		}

		if(!apiutil.isSafeEntity(hosts)){
			hosts = [];
		}else{
			hosts = getSafeHosts(hosts);
			for(let filter_cnt = 0; filter_cnt < hosts.length; ){
				if(!apiutil.isSafeString(hosts[filter_cnt].hostname)){
					hosts.splice(filter_cnt, 1);
				}else{
					++filter_cnt;
				}
			}
		}

		if(!apiutil.isBoolean(clear_old_hostnames)){
			clear_old_hostnames = false;
		}

		if(!apiutil.isSafeEntity(ips)){
			ips = [];
		}else{
			ips	= getSafeHosts(ips);
			for(let filter_cnt = 0; filter_cnt < ips.length; ){
				if(!apiutil.isSafeString(ips[filter_cnt].ip)){
					ips.splice(filter_cnt, 1);
				}else{
					++filter_cnt;
				}
			}
		}

		if(!apiutil.isBoolean(clear_old_ips)){
			clear_old_ips = false;
		}

		if(apiutil.isStringArray(alias_roles)){
			is_alias	= true;
		}else if(apiutil.isString(alias_roles) && '' === alias_roles){
			is_alias	= true;
			alias_roles	= [] as string[];
		}else if(!apiutil.isSafeEntity(alias_roles)){
			is_alias	= false;
			alias_roles	= [] as string[];
		}else{
			r3logger.elog('parameter alias_roles is wrong : alias_roles=' + JSON.stringify(alias_roles));
			return false;
		}
	}

	_role				= _role.toLowerCase();
	let		roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= _role.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(_role.match(roleptn)){
			r3logger.elog('role(' + _role + ') is not role yrn path)');
			return false;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check service/tenant name
		if(tenant !== rolematches[2] || (is_service && service !== rolematches[1]) || (!is_service && apiutil.isSafeString(rolematches[1]))){
			r3logger.elog('role(' + _role + ') yrn has service(' + rolematches[1] + ') and tenant(' + rolematches[2] + '), but it is not specified service(' + (is_service ? service : 'null') + ') and tenant(' + tenant + ')');
			return false;
		}
		// role is set only role name
		_role = rolematches[3];
	}

	//
	// keys
	//
	const	role_tmp		= ':' + _role;													// ":<role>{/<role>{...}}"
	const	role_key		= keys.ROLE_TOP_KEY + role_tmp;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	const	policies_key	= role_key	+ '/' + keys.POLICIES_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	const	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	const	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	const	id_key			= role_key	+ '/' + keys.ID_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	const	alias_key		= role_key	+ '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"
	const	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"

	let		need_update		= false;

	// create role key(with subkeys tree from role top key)
	if(!rawCreateKeyTree(dkcobj_permanent, keys.ROLE_TOP_KEY, role_tmp, false)){
		r3logger.elog('could not create role key tree(' + _role + ') from role top key(' + keys.ROLE_TOP_KEY + ')');
		return false;
	}
	let value = dkcobj_permanent.getValue(role_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(role_key, keys.VALUE_ENABLE)){				// set value "enable" for make top key -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + role_key + ' key');
			return false;
		}
	}

	// check policies/reference/alias/hosts key
	let subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(role_key, true));
	if(apiutil.tryAddStringToArray(subkeylist, reference_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, policies_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, hosts_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, id_key)){
		need_update	= true;
	}
	if(is_alias && apiutil.isNotEmptyArray(alias_roles) && apiutil.tryAddStringToArray(subkeylist, alias_key)){	// Make alias key in subkey list only when new alias exists
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){					// add subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/{type, reference, keys, @} -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not add ' + role_key + '/* subkeys under ' + role_key + ' key');
			return false;
		}
	}

	// check name/ip key under hosts key
	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(hosts_key, true));
	if(apiutil.tryAddStringToArray(subkeylist, name_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, ip_key)){
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj_permanent.setSubkeys(hosts_key, subkeylist)){					// add subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name, ip} -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts
			r3logger.elog('could not add ' + name_key + ' and ' + ip_key + ' subkeys under ' + hosts_key + ' key');
			return false;
		}
	}

	// reference key
	const	ref_value = dkcobj_permanent.casGet(reference_key);
	if(!apiutil.isSafeEntity(ref_value)){
		if(!dkcobj_permanent.casInit(reference_key, 0)){							// initialize cas value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference
			r3logger.elog('could not initialize reference value to ' + reference_key + ' key');
			return false;
		}
	}

	// policies key
	value				= dkcobj_permanent.getValue(policies_key, null, true, null);
	const parsed_value	= apiutil.parseJSON(value);
	if((is_policies && (!apiutil.isArray(parsed_value) || !apiutil.compareArray(parsed_value, policies))) || (!is_policies && !apiutil.isSafeEntity(parsed_value))){
		if(!dkcobj_permanent.setValue(policies_key, JSON.stringify(policies))){				// set value "policies" -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies
			r3logger.elog('could not set ' + JSON.stringify(policies) + ' value to ' + policies_key + ' key');
			return false;
		}
	}

	// check hosts/{name, ip} key's value(these key must have dummy value)
	value = dkcobj_permanent.getValue(name_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(name_key, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + name_key + ' key');
			return false;
		}
	}
	value = dkcobj_permanent.getValue(ip_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(ip_key, keys.VALUE_ENABLE)){					// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + ip_key + ' key');
			return false;
		}
	}

	// hosts/name key
	if(apiutil.isNotEmptyArray(hosts) || clear_old_hostnames){
		if(!rawCreateRoleHosts(dkcobj_permanent, role_key, hosts, clear_old_hostnames, false)){		// overwrite/replace hosts(not clear old) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/{hosts, hosts/name/<...>}
			r3logger.elog('could not add / replace ' + JSON.stringify(hosts) + ' key/subkeys under ' + hosts_key + ' key');
			return false;
		}
	}
	// hosts/ip key
	if(apiutil.isNotEmptyArray(ips) || clear_old_ips){
		if(!rawCreateRoleHosts(dkcobj_permanent, role_key, ips, false, clear_old_ips)){		// overwrite/replace ips(not clear old) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/{hosts, hosts/ip/<...>}
			r3logger.elog('could not add / replace ' + JSON.stringify(ips) + ' key/subkeys under ' + hosts_key + ' key');
			return false;
		}
	}

	// id key
	value = dkcobj_permanent.getValue(id_key, null, true, null);
	if(!apiutil.isSafeStrUuid4(value)){
		// If value is made by old version, it is JSON formated from 2byte binary array(4).
		// In any case, reset it to the new value here.
		const uuid_value = apiutil.getStrUuid4();
		if(!dkcobj_permanent.setValue(id_key, uuid_value)){						// set value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id
			r3logger.elog('could not set ' + JSON.stringify(uuid_value) + ' value to ' + id_key + ' key');
			return false;
		}
	}

	// aliases
	value					= dkcobj_permanent.getValue(alias_key, null, true, null);
	const	parsed_aliases	= apiutil.parseJSON(value);
	if(is_alias && apiutil.isStringArray(alias_roles)){
		if(apiutil.isArray(alias_roles) && 0 === alias_roles.length){
			if(null !== parsed_aliases){
				// if there is alias array, alias role reference is needed to decrement
				if(apiutil.isNotEmptyArray(parsed_aliases)){
					for(let cnt = 0; cnt < parsed_aliases.length; ++cnt){
						const	tmp_alias = parsed_aliases[cnt];
						if(apiutil.isSafeString(tmp_alias)){
							const tmpres = rawIncDecReferenceCount(dkcobj_permanent, tmp_alias, false);
							if(!tmpres.result){
								r3logger.wlog('Failed to decrement reference in policy(' + tmp_alias + ') included from role(' + role_key + '), but continue...');
							}
						}
					}
				}
				// New aliases is empty, so we removed alias key
				if(!dkcobj_permanent.remove(alias_key, false)){					// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + role_key + ' key');
					return false;
				}
			}
			// remove subkey(alias:@) in role subkey list
			subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(role_key, true));
			if(apiutil.removeStringFromArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){			// remove subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@ -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + role_key + ' key');
					return false;
				}
			}
		}else{
			// get removing element(alias role) & decrement it's reference
			const	tmp_alias_arr	= apiutil.getSafeStringArray(parsed_aliases);
			const	delarr			= apiutil.getDeletingDifferenceArray(tmp_alias_arr, alias_roles);
			for(let cnt = 0; cnt < delarr.length; ++cnt){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in role(' + delarr[cnt] + ') included from role(' + role_key + '), but continue...');
				}
			}
			// set aliases value
			if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(alias_roles))){	// update value alias -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@
				r3logger.elog('could not set ' + JSON.stringify(alias_roles) + ' value to ' + alias_key + ' key');
				return false;
			}
			// get adding element(alias role) & increment it's reference
			const	addarr	= apiutil.getAddingDifferenceArray(tmp_alias_arr, alias_roles);
			for(let cnt = 0; cnt < addarr.length; ++cnt){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
				if(!tmpres.result){
					r3logger.wlog('Failed to increment reference in role(' + addarr[cnt] + ') included from role(' + role_key + '), but continue...');
				}
			}
			// add subkey(alias:@) in role subkey list
			subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(role_key, true));
			if(apiutil.tryAddStringToArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){			// add subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@ -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
					r3logger.elog('could not add ' + alias_key + ' subkey under ' + role_key + ' key');
					return false;
				}
			}
		}
	}

	// check tokens key
	value = dkcobj_permanent.getValue(tokens_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(tokens_key, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + tokens_key + ' key');
			return false;
		}
	}

	return true;
};

//---------------------------------------------------------
// create role(no service) raw function
//---------------------------------------------------------
// user					:	user name
// tenant				:	tenant name
// role					:	role name or full yrn role
// policies				:	role policies
// alias_roles			:	role has alias
// hosts				:	role hostnames(array)
// clear_old_hostnames	:	clear all existing hostnames
// ips					:	role ips(array)
// clear_old_ips		:	clear all existing ips
//
// [NOTE]				:	See rawCreateRoleEx function
//
const rawCreateRole = (
	user?:					string | null,
	tenant?:				string | null,
	role?:					string | null,
	policies?:				string | string[] | null,
	alias_roles?:			string | string[] | null,
	hosts?:					string | dkcTypeHostRawValueSet | dkcTypeHostRawValueSet[] | null,
	clear_old_hostnames?:	boolean | null,
	ips?:					string | dkcTypeHostRawValueSet | dkcTypeHostRawValueSet[] | null,
	clear_old_ips?:			boolean | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);		// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	if(!rawCreateRoleEx(dkcobj, user, tenant, null, role, policies, alias_roles, hosts, clear_old_hostnames, ips, clear_old_ips)){
		resobj.result	= false;
		resobj.message	= 'could not create role(' + JSON.stringify(role) + ') for tenant(' + tenant + '), user(' + user + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// create role(with service) raw function
//---------------------------------------------------------
// user					:	user name
// tenant				:	tenant name
// service				:	service name
//
// [NOTE]				:	See rawCreateRoleEx function
//							Must exist service key tree and service+tenant key tree before calling this.
//
const rawCreateServiceTenantRole = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	return rawCreateRoleEx(dkcobj_permanent, null, tenant, service);
};

//---------------------------------------------------------
// Common remove role raw function
//---------------------------------------------------------
// tenant			:	tenant name
// service			:	service name
// role				:	role name or full yrn role
//
// If role has sub role, do not remove role key which has only
// subkeys for sub roles.
//
const rawRemoveRoleEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null,
	role?:				string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant)){														// allow other argument is empty
		r3logger.elog('parameter is wrong : tenant=' + JSON.stringify(tenant));
		return false;
	}

	//
	// keys and role name
	//
	let	is_service	= false;
	let	keys		= getK2hr3Keys(null, tenant, null);
	let	_role: string;
	if(apiutil.isSafeString(service)){
		// service name is specified.
		//
		is_service	= true;
		service		= apiutil.getSafeString(service).toLowerCase();
		keys		= getK2hr3Keys(null, tenant, service);

		if(apiutil.isSafeEntity(role)){
			r3logger.elog('parameter role is specified, but this role is ARC : service =' + JSON.stringify(service) + ', tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role));
			return false;
		}
		_role		= keys.ROLE_TOP_KEY + ':' + keys.ACR_ROLE_KW;							// role yrn path     = 'yrn:yahoo:<service>::<tenant>:role:arc-role'

	}else{
		// service name is not specified.
		//
		if(!apiutil.isSafeString(role)){
			r3logger.elog('parameter role is wrong : role=' + JSON.stringify(role));
			return false;
		}
		_role = role;
	}

	// check role name is only name or full yrn path
	_role				= _role.toLowerCase();
	let		roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= _role.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(_role.match(roleptn)){
			r3logger.elog('role(' + _role + ') is not role yrn path)');
			return false;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check service/tenant name
		if(tenant !== rolematches[2] || (is_service && service !== rolematches[1]) || (!is_service && apiutil.isSafeString(rolematches[1]))){
			r3logger.elog('role(' + _role + ') yrn has service(' + rolematches[1] + ') and tenant(' + rolematches[2] + '), but it is not specified service(' + (is_service ? service : 'null') + ') and tenant(' + tenant + ')');
			return false;
		}
		// role is set only role name
		_role = rolematches[3];
	}

	//
	// keys
	//
	const	role_key		= keys.ROLE_TOP_KEY + ':' + _role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	const	policies_key	= role_key	+ '/' + keys.POLICIES_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	const	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	const	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	const	id_key			= role_key	+ '/' + keys.ID_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	const	alias_key		= role_key	+ '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"
	const	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"

	// remove all both hosts/{name, ip}/... keys under hosts key
	if(!rawRemoveRoleHostAll(dkcobj_permanent, role_key)){									// remove all key/subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<...>
		r3logger.elog('could not remove all hostname/ip under ' + hosts_key + '/{name or ip} key');
		return false;
	}
	if(!dkcobj_permanent.remove(name_key, true)){									// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
		r3logger.dlog('could not remove ' + name_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(ip_key, true)){									// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
		r3logger.dlog('could not remove ' + ip_key + 'key, probably it is not existed');
	}

	// remove role tokens subkeys
	let	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(tokens_key, false));		// not check attributes
	if(!apiutil.isNotEmptyArray(subkeylist) && !r3token.directRemoveRoleTokens(dkcobj_permanent, subkeylist)){	// remove all role token from yrn:yahoo::::token:role
		r3logger.dlog('failed to remove ' + JSON.stringify(subkeylist) + ' role tokens under role token key, but continue...');
	}

	// remove subkeys under role key
	if(!dkcobj_permanent.remove(policies_key, true)){								// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies
		r3logger.dlog('could not remove ' + policies_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(reference_key, true)){								// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference
		r3logger.dlog('could not remove ' + reference_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(hosts_key, true)){									// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts
		r3logger.dlog('could not remove ' + hosts_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(id_key, true)){									// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id
		r3logger.dlog('could not remove ' + id_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(tokens_key, true)){								// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens
		r3logger.dlog('could not remove ' + tokens_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(alias_key, true)){									// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@
		r3logger.dlog('could not remove ' + alias_key + 'key, probably it is not existed');
	}

	// check subkeys
	let	update	= false;
	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(role_key, true));
	if(apiutil.isNotEmptyArray(subkeylist)){
		if(apiutil.removeStringFromArray(subkeylist, policies_key)){
			update	= true;
		}
		if(apiutil.removeStringFromArray(subkeylist, reference_key)){
			update	= true;
		}
		if(apiutil.removeStringFromArray(subkeylist, hosts_key)){
			update	= true;
		}
		if(apiutil.removeStringFromArray(subkeylist, id_key)){
			update	= true;
		}
		if(apiutil.removeStringFromArray(subkeylist, tokens_key)){
			update	= true;
		}
		if(apiutil.removeStringFromArray(subkeylist, alias_key)){
			update	= true;
		}
		for(let cnt = 0; cnt < subkeylist.length; ){
			// get value and subkeys from role's one subkey
			const	tmp_value	= dkcobj_permanent.getValue(subkeylist[cnt], null, true, null);
			const	tmp_sklist	= dkcobj_permanent.getSubkeys(subkeylist[cnt], true);
			if(!apiutil.isSafeEntity(tmp_value) && !apiutil.isNotEmptyArray(tmp_sklist)){
				// this role's one subkey is empty, so remove it from role's subkey list
				subkeylist.splice(cnt, 1);
				update	= true;
			}else{
				++cnt;
			}
		}
	}
	if(!apiutil.isNotEmptyArray(subkeylist)){
		// role does not have any subkey, then remove role key
		if(!dkcobj_permanent.remove(role_key, false)){								// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not remove ' + role_key + ' key, probably it is not existed, but continue...');
		}else{
			// remove role key from parent's subkey role list.
			if(!rawRemoveRoleSubkeyParentKey(dkcobj_permanent, role_key, keys.ROLE_TOP_KEY)){
				r3logger.elog('failed to check and remove parent keys for ' + role_key + ', but continue...');
			}
		}
	}else if(update){
		// there is rest subkeys and need to update it
		if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){					// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + role_key + ' key');
			return false;
		}
	}else{
		// why?(nothing to do)
	}
	return true;
};

//---------------------------------------------------------
// remove role(no service) raw function
//---------------------------------------------------------
// user				:	user name
// tenant			:	tenant name
// role				:	role name or full yrn role
//
const rawRemoveRole = (
	user?:		string | null,
	tenant?:	string | null,
	role?:		string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant)){					// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// check user is tenant member
	//
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to remove role(' + JSON.stringify(role) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// remove roles
	//
	if(!rawRemoveRoleEx(dkcobj, tenant, null, role)){
		resobj.result	= false;
		resobj.message	= 'could not remove role(' + JSON.stringify(role) + ') for user(' + user + '), tenant(' + tenant + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// remove role(with service) raw function
//---------------------------------------------------------
// tenant			:	tenant name
// service			:	service name
//
const rawRemoveServiceTenantRole = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(service)){
		r3logger.elog('parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return false;
	}

	//
	// remove acr roles
	//
	if(!rawRemoveRoleEx(dkcobj_permanent, tenant, service, null)){
		r3logger.elog('could not remove role for service(' + JSON.stringify(service) + '), tenant(' + JSON.stringify(tenant) + ')');
		return false;
	}
	return true;
};

//
// Utility for rawRemoveRole function.
//
const rawRemoveRoleSubkeyParentKey = (
	dkcobj_permanent:	K2hdkc,
	current_key?:		string | null,
	role_top_key?:		string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(current_key) || !apiutil.isSafeString(role_top_key) || 0 !== current_key.indexOf(role_top_key)){
		r3logger.elog('parameters is wrong : current_key=' + JSON.stringify(current_key) + ', role_top_key=' + JSON.stringify(role_top_key));
		return false;
	}

	// [NOTE]
	// here, we do not check current key that is role key full yrn path.
	//
	// eslint-disable-next-line no-useless-assignment
	for(let	parent_key: string | null = null; role_top_key !== current_key; current_key = parent_key){
		parent_key	= apiutil.getParentPath(current_key);									// parent role key
		if(!apiutil.isSafeString(parent_key)){
			// this case is parent is top key, then force to set top key
			parent_key = role_top_key;
		}
		// parent's subkey list
		const	subkeylist = dkcobj_permanent.getSubkeys(parent_key, true);

		// remove current key from parent's subkey
		const	update	= apiutil.removeStringFromArray(subkeylist, current_key);
		if(!apiutil.isNotEmptyArray(subkeylist)){
			// subkeys is empty
			if(role_top_key !== parent_key){
				if(!dkcobj_permanent.remove(parent_key, false)){					// remove parent key
					r3logger.elog('could not remove ' + parent_key + ' key');
					return false;
				}
			}else{
				// clear subkeys
				if(!dkcobj_permanent.setSubkeys(parent_key, subkeylist)){			// update parent's subkeys(empty)
					r3logger.elog('could not clear subkeys under ' + parent_key + ' key');
					return false;
				}
			}
		}else if(update){
			// updated and subkeys is not empty
			if(!dkcobj_permanent.setSubkeys(parent_key, subkeylist)){				// update parent's subkeys
				r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + parent_key + ' key');
				return false;
			}
			// no more removing keys
			break;
		}
	}
	return true;
};

//---------------------------------------------------------
// Get role raw function
//---------------------------------------------------------
//
// Get all role data from resource or only this resource data.
//
//	return object:
//		{
//			"result":	true or false
//			"message":	error message
//			"role":		{
//				policies:	array,
//				aliases:	array								<--- only not expand
//				hosts: {										<--- only not expand
//					'hostnames': [								hostname array or empty array
//						<hostname> <port> <cuk> <extra> <tag> <inboundip> <outboundip>,		(if any port, port is *)
//						...
//					],
//					'ips': [									ip address array or empty array
//						<ip address> <port> <cuk> <extra> <tag> <inboundip> <outboundip>,	(if any port, port is *)
//						...
//					]
//				}
//			}
//		}
//
const rawGetRole = (
	role?:		string | null,
	is_expand?:	boolean | null
): resTypeGetRole => {

	const	resobj: resTypeGetRole = {result: true, message: null};

	if(!apiutil.isSafeString(role)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand	= true;															// default all expand
	}

	const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get role
	const	roledata: dkcTypeRoleValue	= {
		policies:	[] as string[],													// policies = keys.VALUE_POLICIES_TYPE
		aliases:	(!is_expand ? [] as string[] : undefined)						// aliases  = keys.VALUE_ALIAS_TYPE
	};

	// check
	if(!rawGetRoles(dkcobj, role, roledata, is_expand)){
		resobj.result	= false;
		resobj.message	= 'Could not get role data for role: ' + role;
		r3logger.elog(resobj.message);
	}else{
		resobj.role	= roledata;
		r3logger.dlog('Get role(' + role + ') = ' + JSON.stringify(roledata));
	}

	dkcobj.clean();
	return resobj;
};

//
// Utility - Get role data
//
//	roledata:	Must be object
//				dkcTypeRoleValue = {
//					policies:	array,
//					aliases:	array								<--- only not expand
//					hosts: dkcTypeRoleHostNormalList = {			<--- only not expand
//						'hostnames': [								hostname array or empty array
//							<hostname> <port> <cuk> <extra> <tag> <inboundip> <outboundip>,		(if any port, port is *)
//							...
//						],
//						'ips': [									ip address array or empty array
//							<ip address> <port> <cuk> <extra> <tag> <inboundip> <outboundip>,	(if any port, port is *)
//							...
//						]
//					}
//				}
//
// [NOTE]
// This function is reentrant
//
const rawGetRoles = (
	dkcobj_permanent:	K2hdkc,
	role:				string | null,
	roledata:			dkcTypeRoleValue,
	is_expand?:			boolean | null,
	checked_roles?:		string[] | null,
	base_role_top?:		string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role)){
		r3logger.elog('some parameters are wrong : role=' + JSON.stringify(role));
		return false;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand		= true;
	}
	if(!apiutil.isArray(checked_roles)){
		checked_roles	= [];
	}
	if(apiutil.findStringInArray(checked_roles, role)){
		r3logger.wlog('role(' + role + ') already checked, then this role is included from another role. Thus skip this for escaping blocking.');
		return true;
	}else{
		checked_roles.push(role);
	}

	//
	// keys
	//
	let		keys			= getK2hr3Keys();												// temporary for regex key(getting tenant/service)
	const	parent_key		= apiutil.getParentPath(role);									// parent role key
	const	policies_key	= role + '/' + keys.POLICIES_KW;								// policies
	const	alias_key		= role + '/' + keys.ALIAS_KW;									// aliases

	// get tenant/service
	const	roleptn			= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);					// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches		= role.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4){
		r3logger.elog('role parameter is not match role path : role=' + JSON.stringify(role));
		return false;
	}
	// reset keys with tenant and service
	keys				= getK2hr3Keys(null, rolematches[2], rolematches[1]);
	if(!apiutil.isSafeString(base_role_top)){
		base_role_top	= keys.ROLE_TOP_KEY;												// set base role top if it is not specified
	}

	// check roledata
	if(	!apiutil.isSafeEntity(roledata)									||
		undefined === roledata[keys.VALUE_POLICIES_TYPE]				||
		(!is_expand && undefined === roledata[keys.VALUE_ALIAS_TYPE])	)					// only not expand
	{
		r3logger.elog('roledata parameter is wrong : roledata=' + JSON.stringify(roledata));
		return false;
	}

	// check parent
	if(is_expand && 0 === role.indexOf(base_role_top) && apiutil.isSafeString(parent_key) && keys.ROLE_TOP_KEY != parent_key){
		// get parent data
		if(!rawGetRoles(dkcobj_permanent, parent_key, roledata, is_expand, checked_roles, base_role_top)){
			return false;
		}
	}

	// check role under aliases
	const	alias_value = dkcobj_permanent.getValue(alias_key, null, true, null);
	if(is_expand){
		if(apiutil.isSafeEntity(alias_value)){
			let		alias_array: string[]	= [];
			const	tmp_arr					= apiutil.parseJSON(alias_value);
			if(apiutil.isStringArray(tmp_arr)){
				alias_array = tmp_arr;
			}
			if(apiutil.isNotEmptyArray(alias_array)){
				for(let cnt = 0; cnt < alias_array.length; ++cnt){
					// get alias roles
					if(!rawGetRoles(dkcobj_permanent, alias_array[cnt], roledata, is_expand, checked_roles, base_role_top)){
						return false;
					}
				}
			}
		}
	}else{
		let alias_array: string[] = [];
		if(apiutil.checkSimpleJSON(alias_value)){
			const tmp_arr = apiutil.parseJSON(alias_value);
			if(apiutil.isStringArray(tmp_arr)){
				alias_array = tmp_arr;
			}
		}
		roledata[keys.VALUE_ALIAS_TYPE] = alias_array;
	}

	// get role policies
	const	pol_value			= dkcobj_permanent.getValue(policies_key, null, true, null);
	let		pol_array: string[]	= [];
	const	tmp_pol_arr			= apiutil.parseJSON(pol_value);
	if(apiutil.isStringArray(tmp_pol_arr)){
		pol_array = tmp_pol_arr;
	}
	if(apiutil.isNotEmptyArray(pol_array)){
		const	tmp_poltype = apiutil.getSafeStringArray(roledata[keys.VALUE_POLICIES_TYPE]);
		if(!apiutil.isNotEmptyArray(tmp_poltype)){
			roledata[keys.VALUE_POLICIES_TYPE] = [];
		}
		roledata[keys.VALUE_POLICIES_TYPE] = tmp_poltype.concat(pol_array);
	}

	// get role hosts
	if(!is_expand){
		const	hosts: dkcTypeRoleHostList | null = rawGetRoleHostLists(dkcobj_permanent, role, false, base_role_top);			// always not expand
		if(apiutil.isSafeEntity(hosts) && null !== hosts){
			roledata[keys.VALUE_HOSTS_TYPE] = hosts.all;
		}else{
			r3logger.wlog('Could not get hosts in role(' + role + ') with error, but continue...');
			const host_all: dkcTypeRoleHostFullValueList = {
				hostnames:	[],
				ips:		[]
			};
			roledata[keys.VALUE_HOSTS_TYPE] = host_all;
		}
	}
	return true;
};

//---------------------------------------------------------
// add host raw function
//---------------------------------------------------------
// tenant			:	tenant name
// role				:	role name or full yrn role
// service			:	service name if role is not full yrn
// hostname			:	hostname string or array
// ip				:	ip address or array
// port				:	port number(0, undefined, null means any)
// cuk				:	container unique key(undefined, null means any)
// extra			:	extra data
// tag				:	tag data
// inboundip		:	inbound ip address(optional)
// outboundip		:	outbound ip address(optional)
//
// [NOTE]
// Please specify either hostname or ip.
// Either hostname or ip must be specified.
// This function creates all ip and hostname key in role/hosts.
// If the service name is specified when role is not full yrn path,
// the host is added to tenant role under service.
// The service name can be allowed undefined and null.
//
const rawAddHost = (
	tenant?:		string | null,
	role?:			string | null,
	service?:		string | null,
	hostname?:		string | string[] | null,
	ip?:			string | string[] | null,
	port?:			string | number | null,
	cuk?:			string | null,
	extra?:			string | null,
	tag?:			string | null,
	inboundip?:		string | null,
	outboundip?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(role)){						// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(hostname) && !apiutil.isNotEmptyArray(hostname) && !apiutil.isSafeString(ip) && !apiutil.isNotEmptyArray(ip)){
		resobj.result	= false;
		resobj.message	= 'both hostname and ip parameters are empty.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isArray(hostname) && apiutil.isSafeString(hostname)){
		hostname		= [hostname];
	}
	if(!apiutil.isArray(ip) && apiutil.isSafeString(ip)){
		ip				= [ip];
	}

	let	_port: number;
	if(!apiutil.isSafeEntity(port)){
		_port = 0;
	}else if(apiutil.isSafeNumeric(port)){
		const	tmpPort = apiutil.cvtToNumber(port);
		if(!apiutil.isSafeNumber(tmpPort)){
			resobj.result	= false;
			resobj.message	= 'port(' + JSON.stringify(port) + ') parameter is wrong.';
			r3logger.elog(resobj.message);
			return resobj;
		}
		_port = tmpPort;
	}else{
		resobj.result	= false;
		resobj.message	= 'port(' + JSON.stringify(port) + ') parameter is wrong.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	if(!apiutil.isSafeString(cuk)){
		cuk = null;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}
	if(apiutil.isSafeString(inboundip)){
		if(!apiutil.isIpAddressString(inboundip)){
			resobj.result	= false;
			resobj.message	= 'inbound ip address is not ignore ip address string: ' + inboundip;
			r3logger.elog(resobj.message);
			return resobj;
		}
	}else{
		inboundip		= null;
	}
	if(apiutil.isSafeString(outboundip)){
		if(!apiutil.isIpAddressString(outboundip)){
			resobj.result	= false;
			resobj.message	= 'outbound ip address is not ignore ip address string: ' + outboundip;
			r3logger.elog(resobj.message);
			return resobj;
		}
	}else{
		outboundip		= null;
	}

	// check role name is only name or full yrn path
	const	keys		= getK2hr3Keys(null, tenant, service);
	role				= role.toLowerCase();
	let		roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= role.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(role.match(roleptn)){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') is not role yrn path)';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check service/tenant name
		if(tenant !== rolematches[2] || (null !== service && service !== rolematches[1]) || (null === service && apiutil.isSafeString(rolematches[1]))){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') yrn has service(' + rolematches[1] + ') and tenant(' + rolematches[2] + '), but it is not specified service(' + (null !== service ? service : 'null') + ') and tenant(' + tenant + ')';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is set only role name
		role = rolematches[3];
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// keys
	//
	const	role_key	= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	const	hosts_key	= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key	= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key		= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

	// check hosts key for having value
	let	value = dkcobj.getValue(hosts_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj.setValue(hosts_key, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts
			resobj.result	= false;
			resobj.message	= 'could not set ' + keys.VALUE_ENABLE + ' value to ' + hosts_key + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	// check name/ip key for having value
	value = dkcobj.getValue(name_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj.setValue(name_key, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			resobj.result	= false;
			resobj.message	= 'could not set ' + keys.VALUE_ENABLE + ' value to ' + name_key + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	value = dkcobj.getValue(ip_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj.setValue(ip_key, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			resobj.result	= false;
			resobj.message	= 'could not set ' + keys.VALUE_ENABLE + ' value to ' + ip_key + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	// make hostname array
	const	hostarr: dkcTypeHostRawValueSet[] = [];
	if(apiutil.isNotEmptyArray(hostname)){
		for(let cnt = 0; cnt < hostname.length; ++cnt){
			const onehost: dkcTypeHostRawValueSet = {
				hostname:	hostname[cnt],											// hostname
				ip:			null,
				port:		_port,
				cuk:		(apiutil.isSafeString(cuk) ? apiutil.getSafeString(cuk) : null),
				id:			apiutil.getStrUuid4(),
				extra:		apiutil.getSafeString(extra),
				tag:		apiutil.getSafeString(tag),
				inboundip:	(apiutil.isSafeString(inboundip) ? inboundip : null),
				outboundip:	(apiutil.isSafeString(outboundip) ? outboundip : null)
			};
			hostarr.push(onehost);
		}
	}
	if(apiutil.isNotEmptyArray(ip)){
		for(let cnt = 0; cnt < ip.length; ++cnt){
			const onehost: dkcTypeHostRawValueSet = {
				hostname:	null,
				ip:			ip[cnt],												// ip address
				port:		_port,
				cuk:		(apiutil.isSafeString(cuk) ? apiutil.getSafeString(cuk) : null),
				id:			apiutil.getStrUuid4(),
				extra:		apiutil.getSafeString(extra),
				tag:		apiutil.getSafeString(tag),
				inboundip:	(apiutil.isSafeString(inboundip) ? inboundip : null),
				outboundip:	(apiutil.isSafeString(outboundip) ? outboundip : null)
			};
			hostarr.push(onehost);
		}
	}

	// add hosts
	if(!rawCreateRoleHosts(dkcobj, role_key, hostarr, false, false)){						// not clear old host
		resobj.result	= false;
		resobj.message	= 'could not set ' + keys.VALUE_ENABLE + ' value to ' + hosts_key + ' key';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//
// Utility function for create role's hosts
//
// role_key			:	role key
// hosts			:	role hosts(array)
//						if hosts is null, this function is nothing to do.
//						if hosts is '' or array(0), this clears role's hosts.
// is_clear_old_*	:	if true, remove existed all host before setting hosts.
//						the other case, merging hosts to existed list.
//
// [Elements]
// host array		:	array element is following object
//						hostname allows any string(x.yahoo.co.jp, x[0-9].yahoo.co.jp, *, ...)
//						ether hostname or ip address can be specified, and both can not be specified.
//						dkcTypeHostRawValueSet = {
//							hostname:	"x.y.x.yahoo.co.jp"	(or null)
//							ip:			"172.1.1.1"			(or null)
//							port:		8000				(if not specify, the value is 0="any")
//							cuk:		"any string"		(if not specify, the value is null or undefined)
//							extra:		"explain, etc"		(if not specify, the value is null or undefined)
//							tag:		"tag string"		(if not specify, the value is null or undefined)
//							inboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//							outboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//							(key:		undefined)
//							(id:		undefined)
//						}
//
// [NOTE]
// The hosts key under role key(yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}})
// must exist.
//
const rawCreateRoleHosts = (
	dkcobj_permanent?:		K2hdkc,
	role_key?:				string | null,
	hosts?:					string | dkcTypeHostRawValueSet[] | null,
	is_clear_old_hosts?:	boolean | null,
	is_clear_old_ips?:		boolean | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return false;
	}
	if(!apiutil.isBoolean(is_clear_old_hosts)){
		is_clear_old_hosts	= false;
	}
	if(!apiutil.isBoolean(is_clear_old_ips)){
		is_clear_old_ips	= false;
	}

	// check hosts parameter
	if(null == hosts){
		// nothing to do
		return true;
	}else if(apiutil.isSafeString(hosts) && '' === hosts){
		// set empty array to hosts
		hosts = [];
	}
	if(!apiutil.isArray(hosts) || (!apiutil.isNotEmptyArray(hosts) && !is_clear_old_hosts && !is_clear_old_ips )){
		// if not need to update, stop processing here.
		return true;
	}
	// check hosts array elements
	for(let cnt = 0; cnt < hosts.length; ++cnt){
		if(apiutil.isSafeString(hosts[cnt].hostname) === apiutil.isSafeString(hosts[cnt].ip)){
			r3logger.elog('hosts parameter has wrong element: (No. ' + cnt + ') both hostname and ip are empty or not empty.');
			return false;
		}
		if(!apiutil.isSafeEntity(hosts[cnt].port)){
			hosts[cnt].port = 0;
		}else if(apiutil.isSafeNumeric(hosts[cnt].port)){
			const	tmpPort = apiutil.cvtToNumber(hosts[cnt].port);
			if(!apiutil.isSafeNumber(tmpPort)){
				r3logger.elog('hosts parameter has wrong element: (No. ' + cnt + ') port(' + JSON.stringify(hosts[cnt].port) + ') is wrong.');
				return false;
			}
			hosts[cnt].port = tmpPort;
		}else{
			r3logger.elog('hosts parameter has wrong element: (No. ' + cnt + ') port(' + JSON.stringify(hosts[cnt].port) + ') is wrong.');
			return false;
		}
		const tmp_cuk = apiutil.getSafeString(hosts[cnt].cuk).trim();
		if(apiutil.isSafeString(tmp_cuk)){
			hosts[cnt].cuk = tmp_cuk;
		}else{
			hosts[cnt].cuk = null;
		}
	}

	//
	// keys
	//
	const	keys		= getK2hr3Keys();
	const	hosts_key	= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key	= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key		= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

	// clear keys
	if(is_clear_old_hosts){
		// remove all name subkeys
		if(!rawRemoveRoleHostAll(dkcobj_permanent, role_key, true)){
			r3logger.elog('could not clear all subkeys under ' + name_key + ' keys.');
			return false;
		}
	}
	if(is_clear_old_ips){
		// remove all ip subkeys
		if(!rawRemoveRoleHostAll(dkcobj_permanent, role_key, false)){
			r3logger.elog('could not clear all subkeys under ' + ip_key + ' keys.');
			return false;
		}
	}
	if(!is_clear_old_hosts || !is_clear_old_ips){
		//
		// clear target host(ip) for merge
		// because if port is any(0), we need to check all existed host(ip) list.
		//
		for(let cnt = 0; cnt < hosts.length; ++cnt){
			// [NOTE]
			// Delete as many target HOSTs as possible(does not match exactly).
			//
			if(!rawRemoveRoleHost(dkcobj_permanent, role_key, hosts[cnt].hostname, hosts[cnt].ip, hosts[cnt].port, hosts[cnt].cuk, false)){
				r3logger.elog('could not remove (' + JSON.stringify(hosts[cnt]) + ') hosts key and subkeys under ' + hosts_key + '/{name or ip} key.');
				return false;
			}
		}
	}

	// get subkeys
	const	ip_subkeylist					= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(ip_key, true));	// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
	const	name_subkeylist					= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(name_key, true));	// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
	const	cuk_list: dkcTypeAddIpsByCuk[]	= [];																		// array member is object = { cuk: "cuk value", subkey: "path to ip key", extra: "extra"}
	let		update_ip_skey					= false;
	let		update_name_skey				= false;

	// loop for add host(ip) to under hosts/{name or ip} key
	for(let cnt = 0; cnt < hosts.length; ++cnt){
		// make one host information
		const	tg_host_info	= hosts[cnt];
		const	tg_port			= (0 === hosts[cnt].port ? keys.VALUE_ANY_PORT : String(hosts[cnt].port));
		const	tg_cuk			= (null === hosts[cnt].cuk ? '' : apiutil.getSafeString(hosts[cnt].cuk).trim());
		const	is_ip			= apiutil.isSafeString(hosts[cnt].ip);
		const	tg_parent_key	= (is_ip ? ip_key : name_key);								// yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}
		const	tg_key			= tg_parent_key + '/' + (is_ip ? hosts[cnt].ip : hosts[cnt].hostname) + keys.VALUE_HOST_SEP + tg_port + keys.VALUE_HOST_SEP + tg_cuk;	// yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/"{ip or hostname} port cuk"

		let		tg_extra: string;
		if(!apiutil.isSafeEntity(hosts[cnt].extra)){
			tg_extra			= '';
		}else if(apiutil.isSafeString(hosts[cnt].extra)){
			// Currently, extra supports only openstack and kubernets.
			tg_extra			= apiutil.getSafeString(hosts[cnt].extra).trim();

			// a case of kubernetes type
			if(tg_extra == keys.VALUE_K8S_V1){
				// check cuk and set host information
				if(!rawSetHostInfoValueFromKubernetesCuk(tg_host_info, tg_cuk, (is_ip ? hosts[cnt].ip : null))){
					r3logger.elog('could not set host(' + hosts[cnt] + '), because kubernetes cuk is something wrong.');
					return false;
				}
			}
		}else{
			// Currently we do not support this type, but set this.
			tg_extra			= apiutil.getSafeString(hosts[cnt].extra);
		}

		tg_host_info[keys.ID_KW]= apiutil.getStrUuid4();									// host id = UUID4
		const	tg_value		= JSON.stringify(tg_host_info);

		if(!dkcobj_permanent.setValue(tg_key, tg_value)){							// set value to key -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/"{ip or hostname} port cuk"
			r3logger.elog('could not set value(' + tg_value + ') under ' + tg_key + ' key.');
			return false;
		}
		if(is_ip){
			ip_subkeylist.push(tg_key);
			update_ip_skey	= true;

			// check cuk and extra, and push it to cuk list
			//
			// Only IP address, if it has cuk and extra, it is set into cuk_list for
			// removing iaas:*:cuk key(subkey).
			//
			if(apiutil.isSafeString(tg_extra) && apiutil.isSafeString(tg_cuk)){
				cuk_list.push({
					cuk:	tg_cuk,
					subkey:	tg_key,
					extra:	tg_extra
				});
			}
		}else{
			name_subkeylist.push(tg_key);
			update_name_skey= true;
		}
	}
	let	result = true;
	if(update_ip_skey){
		if(!dkcobj_permanent.setSubkeys(ip_key, ip_subkeylist)){					// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + JSON.stringify(ip_subkeylist) + ' subkeys under ' + ip_key + ' key.');
			result = false;
		}
	}
	if(update_name_skey){
		if(!dkcobj_permanent.setSubkeys(name_key, name_subkeylist)){				// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + JSON.stringify(name_subkeylist) + ' subkeys under ' + name_key + ' key.');
			result = false;
		}
	}

	if(!rawAddIpsByCuk(dkcobj_permanent, cuk_list)){
		r3logger.elog('something error occurred in registering iaas:*:cuk key and subkey, but continue...');
		result = false;
	}

	return result;
};

//
// Utilities function for kubernetes cuk
//
// [NOTE]
// kubernetes CUK is processed in the following format and passed to K2HR3 API.
// This function converts a CUK string to the original object.
//
//	CUK string = url encode	( base64 encoding ( JSON string( cuk object ) ) ) )
//
const rawParseKubernetesCuk = (cuk?: string | null): dkcTypeOneRoleHostDetailValue | null => {

	if(!apiutil.isSafeString(cuk)){
		return null;
	}
	// decode url encode
	const	cuk_base64	= cuk.replace(/%3d/g, '=').replace(/_/g, '/').replace(/-/g, '+');	// '%3d' is not necessary but it is executed just in case
	if(!apiutil.isSafeString(cuk_base64)){
		return null;
	}
	try{
		// decode base64
		const	buff64	= Buffer.from(cuk_base64, 'base64');
		if(!apiutil.isSafeEntity(buff64)){
			return null;
		}
		const cuk_json	= buff64.toString('ascii');
		if(!apiutil.isSafeString(cuk_json)){
			return null;
		}
		// parse json
		const	cuk_obj	= apiutil.parseJSON(cuk_json);
		if(!rawIsDkcTypeOneRoleHostDetailValue(cuk_obj)){
			return null;
		}

		// [NOTE]
		// the cuk object must have some keys, you can see in k2hr3-kube-init.sh
		//
		const	keys = getK2hr3Keys();
		if(	!apiutil.isSafeString(cuk_obj[keys.K8S_NAMESPACE_INCUK_KEY])	||
			!apiutil.isSafeString(cuk_obj[keys.K8S_SA_INCUK_KEY])			||
			!apiutil.isSafeString(cuk_obj[keys.K8S_NODENAME_INCUK_KEY])		||
			!apiutil.isSafeString(cuk_obj[keys.K8S_NODEIP_INCUK_KEY])		||
			!apiutil.isSafeString(cuk_obj[keys.K8S_PODNAME_INCUK_KEY])		||
			!apiutil.isSafeString(cuk_obj[keys.K8S_PODID_INCUK_KEY])		||
			!apiutil.isSafeString(cuk_obj[keys.K8S_PODIP_INCUK_KEY])		||
			!apiutil.isSafeString(cuk_obj[keys.K8S_CONTAINERID_INCUK_KEY])	||
			!apiutil.isSafeString(cuk_obj[keys.K8S_RAND_INCUK_KEY])			)
		{
			r3logger.dlog('kubernetes cuk(' + JSON.stringify(cuk) + ') does not have some keys.');
			return null;
		}
		return cuk_obj;

	}catch(exception){
		r3logger.dlog(JSON.stringify(exception));
		return null;
	}
};

//
// Utilities function for kubernetes cuk
//
// [NOTE]
// The kubernetes CUK is created from following object.
//	cuk object = {
//		k8s_namespace:			<namespace of kubernets to which the container belongs>
//		k8s_service_account:	<service account of kubernets to which the container belongs>
//		k8s_node_name:			<node name on which the container is running>
//		k8s_node_ip:			<node ip address on which the container is running>
//		k8s_pod_name:			<pod name on which the container is running>
//		k8s_pod_id:				<pod id on which the container is running>
//		k8s_pod_ip:				<pod ip address on which the container is running>
//		k8s_container_id:		<container id issued by docker>
//		k8s_k2hr3_rand:			<random 32 byte value formatted hex string created by k2hr3-kube-init.sh>
//	}
//
// This function compares CUK's node ip address with the passed host_ip and raises an error
// if it does not match.
// By doing this, when registering the role member host, it is checked whether CUK is correctly
// generated when host registers from K2HR3 API.
//
const rawSetHostInfoValueFromKubernetesCuk = (
	host_info:	dkcTypeHostRawValueSet,
	cuk?:		string | null,
	host_ip?:	string | null
): boolean => {

	if(!apiutil.isSafeEntity(host_info)){
		return false;
	}
	if(!apiutil.isSafeString(host_ip)){
		r3logger.elog('ip address(' + JSON.stringify(host_ip) + ') for checking kubernetes cuk is not string value.');
		return false;
	}

	// parse cuk
	const	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		r3logger.elog('cuk(' + JSON.stringify(cuk) + ') is not base64 url encode value.');
		return false;
	}

	// check host ip address
	const	keys = getK2hr3Keys();
	if(cuk_obj[keys.K8S_NODEIP_INCUK_KEY] != host_ip && cuk_obj[keys.K8S_PODIP_INCUK_KEY] != host_ip){
		r3logger.elog('ip addresses(' + JSON.stringify(cuk_obj[keys.K8S_NODEIP_INCUK_KEY]) + ' or ' + JSON.stringify(cuk_obj[keys.K8S_PODIP_INCUK_KEY]) + ') in kubernetes cuk(' + JSON.stringify(cuk) + ') are not as same as requesting host ip(' + JSON.stringify(host_ip) + ').');
		return false;
	}

	// set to host information with checking
	Object.keys(cuk_obj).forEach((key: string): void => {
		if(apiutil.isSafeString(cuk_obj[key])){
			host_info[key] = cuk_obj[key];
		}else{
			r3logger.wlog('key(' + JSON.stringify(key) + ') in kubernetes cuk(' + JSON.stringify(cuk) + ') is not safe string, then skip this.');
		}
	});

	return true;
};

//
// Utilities function for kubernetes cuk
//
// Compare host information(which is set in role ip address member) and cuk object.
//
const rawCompareHostInfoValueAndKubernetesCuk = (
	host_info:	dkcTypeHostRawValueSet,
	cuk?:		string | null
): boolean => {

	if(!apiutil.isSafeEntity(host_info)){
		return false;
	}

	// parse cuk
	const	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		r3logger.elog('cuk(' + JSON.stringify(cuk) + ') is not base64 url encode value.');
		return false;
	}

	// host_info object must have some keys.
	const	keys = getK2hr3Keys();
	if(	!apiutil.isSafeString(host_info[keys.K8S_NAMESPACE_INCUK_KEY])	||
		!apiutil.isSafeString(host_info[keys.K8S_SA_INCUK_KEY])			||
		!apiutil.isSafeString(host_info[keys.K8S_NODENAME_INCUK_KEY])	||
		!apiutil.isSafeString(host_info[keys.K8S_NODEIP_INCUK_KEY])		||
		!apiutil.isSafeString(host_info[keys.K8S_PODNAME_INCUK_KEY])	||
		!apiutil.isSafeString(host_info[keys.K8S_PODID_INCUK_KEY])		||
		!apiutil.isSafeString(host_info[keys.K8S_PODIP_INCUK_KEY])		||
		!apiutil.isSafeString(host_info[keys.K8S_CONTAINERID_INCUK_KEY])||
		!apiutil.isSafeString(host_info[keys.K8S_RAND_INCUK_KEY])		)
	{
		r3logger.elog('host information value(' + JSON.stringify(host_info) + ') does not have some keys.');
		return false;
	}

	// compare
	if(	host_info[keys.K8S_NAMESPACE_INCUK_KEY]		!= cuk_obj[keys.K8S_NAMESPACE_INCUK_KEY]	||
		host_info[keys.K8S_SA_INCUK_KEY]			!= cuk_obj[keys.K8S_SA_INCUK_KEY]			||
		host_info[keys.K8S_NODENAME_INCUK_KEY]		!= cuk_obj[keys.K8S_NODENAME_INCUK_KEY]		||
		host_info[keys.K8S_NODEIP_INCUK_KEY]		!= cuk_obj[keys.K8S_NODEIP_INCUK_KEY]		||
		host_info[keys.K8S_PODNAME_INCUK_KEY]		!= cuk_obj[keys.K8S_PODNAME_INCUK_KEY]		||
		host_info[keys.K8S_PODID_INCUK_KEY]			!= cuk_obj[keys.K8S_PODID_INCUK_KEY]		||
		host_info[keys.K8S_PODIP_INCUK_KEY]			!= cuk_obj[keys.K8S_PODIP_INCUK_KEY]		||
		host_info[keys.K8S_CONTAINERID_INCUK_KEY]	!= cuk_obj[keys.K8S_CONTAINERID_INCUK_KEY]	||
		host_info[keys.K8S_RAND_INCUK_KEY]			!= cuk_obj[keys.K8S_RAND_INCUK_KEY]			)
	{
		r3logger.dlog('host information value(' + JSON.stringify(host_info) + ') is not as same as cuk( + JSON.stringify(cuk_obj) + ).');
		return false;
	}
	return true;
};

//
// Utilities function for kubernetes cuk
//
// Check cuk for kubernetes
//
const rawIsKubernetesCuk = (cuk?: string | null): boolean => {

	// parse cuk
	const	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		return false;
	}
	return true;
};

//
// Utilities function for kubernetes cuk
//
// Compare ip address and cuk object's node ip address.
//
const rawCompareIpAndKubernetesCuk = (
	ip?:	string | null,
	cuk?:	string | null
): boolean => {

	if(!apiutil.isSafeString(ip)){
		return false;
	}

	// parse cuk
	const	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		r3logger.elog('cuk(' + JSON.stringify(cuk) + ') is not base64 url encode value.');
		return false;
	}

	// compare
	const	keys = getK2hr3Keys();
	if(ip != cuk_obj[keys.K8S_NODEIP_INCUK_KEY]){
		return false;
	}
	return true;
};

// Utility for cuk(custom unique key)
//
// return	:	extra string made from cuk
//
const rawGetExtraFromCuk = (cuk?: string | null): string | null => {

	if(apiutil.isSafeString(cuk)){
		const	keys	= getK2hr3Keys();
		const	cuk_obj	= rawParseKubernetesCuk(cuk);
		if(null == cuk_obj){
			return keys.VALUE_OPENSTACK_V1;
		}else{
			return keys.VALUE_K8S_V1;
		}
	}else{
		// unknown
		return null;
	}
};

//---------------------------------------------------------
// remove host raw function
//---------------------------------------------------------
// tenant			:	tenant name
// service			:	service name if role is not full yrn
// role				:	role name or full yrn role
// target			:	target hostname or ip address string or array
// tg_port			:	target port number(0, undefined, null means any)
// tg_cuk			:	target container unique key(undefined, null means any)
// req_ip			:	requester ip address(when need to check)
// req_port			:	requester port number(when req_ip is specified)
// req_cuk			:	requester container unique key(when req_ip is specified)
//
// The hosts key under role key(yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}})
// must exist.
//
const rawRemoveHost = (
	tenant?:	string | null,
	service?:	string | null,
	role?:		string | null,
	target?:	string | string[] | null,
	tg_port?:	number | null,
	tg_cuk?:	string | null,
	req_ip?:	string | null,
	req_port?:	number | null,
	req_cuk?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(role)){						// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	// target hostname/ip/port/cuk
	if(!apiutil.isSafeString(target) && !apiutil.isNotEmptyArray(target)){
		resobj.result	= false;
		resobj.message	= 'target(hostname or ip address) is empty.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	let	tg_host: string[] | null	= null;
	let	tg_ip: string[] | null		= null;
	if(apiutil.isSafeString(target)){
		target = [target];
	}
	for(let cnt = 0; cnt < target.length; ++cnt){
		if(apiutil.isIpAddressString(target[cnt])){
			if(null === tg_ip){
				tg_ip	= [];
			}
			tg_ip.push(target[cnt]);
		}else{
			if(null === tg_host){
				tg_host	= [];
			}
			tg_host.push(target[cnt]);
		}
	}
	if(!apiutil.isSafeEntity(tg_port)){
		tg_port = 0;
	}else if(!apiutil.isSafeNumber(tg_port)){
		resobj.result	= false;
		resobj.message	= 'target port(' + JSON.stringify(tg_port) + ') parameter is wrong.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	if(!apiutil.isSafeString(tg_cuk)){
		tg_cuk = null;
	}

	// requester ip/port/cuk is optional
	if(!apiutil.isSafeString(req_ip)){
		// not need to check requester ip+port+cuk
		if(apiutil.isSafeEntity(req_port) || apiutil.isSafeString(req_cuk)){
			resobj.result	= false;
			resobj.message	= 'requester port(' + JSON.stringify(req_port) + ') and cuk(' + JSON.stringify(req_cuk) + ') parameters must be empty.';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}else{
		// need to check requester ip+port+cuk
		if(!apiutil.isSafeEntity(req_port)){
			req_port = 0;
		}else if(!apiutil.isSafeNumber(req_port)){
			resobj.result	= false;
			resobj.message	= 'requester port(' + JSON.stringify(req_port) + ') parameter is wrong.';
			r3logger.elog(resobj.message);
			return resobj;
		}
		if(!apiutil.isSafeString(req_cuk)){
			req_cuk = null;
		}
	}
	if(apiutil.isSafeString(service)){
		service	= service.toLowerCase();
	}else{
		service	= null;
	}

	// check role name is only name or full yrn path
	const	keys		= getK2hr3Keys(null, tenant, service);
	role				= role.toLowerCase();
	let		roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= role.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(role.match(roleptn)){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') is not role yrn path)';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check service/tenant name
		if(tenant !== rolematches[2] || (null !== service && service !== rolematches[1]) || (null === service && apiutil.isSafeString(rolematches[1]))){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') yrn has service(' + rolematches[1] + ') and tenant(' + rolematches[2] + '), but it is not specified service(' + (null !== service ? service : 'null') + ') and tenant(' + tenant + ')';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is set only role name
		role = rolematches[3];
	}

	// dkc
	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// keys
	//
	const	role_key	= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"

	// check requester
	if(apiutil.isSafeString(req_ip)){
		const	found_host = rawFindRoleHost(dkcobj, role_key, null, req_ip, req_port, req_cuk, false);		// not strictly checking
		if(!apiutil.isNotEmptyArray(found_host)){
			// requester ip+port+cuk is not role member.
			resobj.result	= false;
			resobj.message	= 'requester ip(' + JSON.stringify(req_ip) + '), port(' + JSON.stringify(req_port) + '), cuk(' + JSON.stringify(req_cuk) + ') is not role(' + JSON.stringify(role) + ') member.';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	// remove host
	if(!rawRemoveRoleHost(dkcobj, role_key, tg_host, tg_ip, tg_port, tg_cuk, false)){		// remove host from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts
		resobj.result	= false;
		resobj.message	= 'could not remove host(hostname=' + JSON.stringify(tg_host) + ', ip=' + JSON.stringify(tg_ip) + ', port=' + String(tg_port) + ', cuk=' + JSON.stringify(tg_cuk) + ') from hosts under role(' + role + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//
// Utility function for removing host from role's hosts
//
// role_key			:	role key
// hostname			:	hostname string or array
// ip				:	ip address or array
// port				:	port number(0, undefined, null means any)
// cuk				:	container unique key(undefined, null means any)
// is_strict		:	check for exact mate of parameters such as port/cuk
//
// The hosts/name or hosts/ip key under role key(yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}})
// must exist.
//
const rawRemoveRoleHost = (
	dkcobj_permanent:	K2hdkc,
	role_key?:			string | null,
	hostname?:			string | string[] | null,
	ip?:				string | string[] | null,
	port?:				number | null,
	cuk?:				string | null,
	is_strict?:			boolean | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return false;
	}
	if(!apiutil.isSafeString(hostname) && !apiutil.isNotEmptyArray(hostname) && !apiutil.isSafeString(ip) && !apiutil.isNotEmptyArray(ip)){
		r3logger.elog('both hostname and ip parameters are empty.');
		return false;
	}
	if(!apiutil.isSafeEntity(port)){
		port = 0;
	}else if(!apiutil.isSafeNumber(port)){
		r3logger.elog('port(' + JSON.stringify(port) + ') parameter is wrong.');
		return false;
	}
	if(!apiutil.isSafeString(cuk)){
		cuk = null;
	}
	if(!apiutil.isBoolean(is_strict)){
		is_strict = true;
	}

	// find target hosts
	const	found_host = rawFindRoleHost(dkcobj_permanent, role_key, hostname, ip, port, cuk, is_strict);
	if(!apiutil.isNotEmptyArray(found_host)){
		// target host is not found, so nothing to do.
		return true;
	}

	//
	// keys
	//
	const	keys			= getK2hr3Keys();
	const	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

	// delete subkeys and make removing key list
	const	name_subkeylist	= dkcobj_permanent.getSubkeys(name_key, true);			// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
	const	ip_subkeylist	= dkcobj_permanent.getSubkeys(ip_key, true);			// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip

	const	tg_ip_subkeylist: string[]	= [];
	const	removed_key: string[]		= [];
	let		update_name_skey			= false;
	let		update_ip_skey				= false;
	for(let cnt = 0; cnt < found_host.length; ++cnt){
		const	tmp_found_host = found_host[cnt];

		if(apiutil.isSafeString(tmp_found_host.key)){
			// add reserved removing list
			removed_key.push(apiutil.getSafeString(tmp_found_host.key));

			// delete key from subkey list under name/ip
			if(apiutil.isSafeString(tmp_found_host.hostname)){
				if(apiutil.removeStringFromArray(name_subkeylist, tmp_found_host.key)){
					update_name_skey = true;
				}
			}else if(apiutil.isSafeString(tmp_found_host.ip)){
				if(apiutil.removeStringFromArray(ip_subkeylist, tmp_found_host.key)){
					// if cuk is specified, need to check key under iaas key
					if(apiutil.isSafeString(cuk)){
						tg_ip_subkeylist.push(tmp_found_host.key);
					}
					update_ip_skey = true;
				}
			}
		}
	}

	// update subkeys
	let	result = true;
	if(update_name_skey){
		if(!dkcobj_permanent.setSubkeys(name_key, name_subkeylist)){				// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + JSON.stringify(name_subkeylist) + ' subkeys under ' + name_key + ' key.');
			result = false;
		}
	}

	// remove ip keys
	if(update_ip_skey){
		// [NOTE]
		// If removing IP address, we need to check cuk/extra data for removing iaas:*:cuk
		//
		for(let cnt = 0; cnt < tg_ip_subkeylist.length; ++cnt){
			// get extra data
			const	value_raw	= dkcobj_permanent.getValue(tg_ip_subkeylist[cnt], null, true, null);	// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/"{ip or hostname} port cuk"
			const	value		= apiutil.parseJSON(value_raw);
			if(apiutil.isPlainObject(value)){
				// remove key under iaas key
				if((null !== value.extra && !apiutil.isString(value.extra)) || !rawRemoveIpsByCukEx(dkcobj_permanent, cuk, value.extra, null, false)){	// do not remove under yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip} key
					// If there is some ip address to one cuk, probably this
					// function return error after first time, thus we continue...
					continue;
				}
			}
		}
		if(!dkcobj_permanent.setSubkeys(ip_key, ip_subkeylist)){					// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + JSON.stringify(ip_subkeylist) + ' subkeys under ' + ip_key + ' key.');
			result = false;
		}
	}

	// remove host(under hostname or ip) keys
	for(let cnt = 0; cnt < removed_key.length; ++cnt){
		if(!dkcobj_permanent.remove(removed_key[cnt], false)){						// remove target keys(under yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip})
			r3logger.elog('could not remove ' + removed_key[cnt] + ' key under ' + hosts_key + '/{name or ip} key.');
			result = false;
		}
	}
	return result;
};

//
// Utility function for removing all host from role's hosts
//
// role_key			:	role key
// is_hostnames		:	undefined or null(both) / true(hostnames) / false(ips)
//
// [NOTE]
// This function is special function, because all hostname(ip) data under
// role/hosts key.
// Must take care for using this function.
//
// If the hosts key under role key(yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}})
// is not existed, this function make this key.
//
const rawRemoveRoleHostAll = (
	dkcobj_permanent:	K2hdkc,
	role_key?:			string | null,
	is_hostnames?:		boolean | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return false;
	}

	//
	// keys
	//
	const	keys		= getK2hr3Keys();
	const	hosts_key	= role_key	+ '/' + keys.HOSTS_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key	= hosts_key	+ '/' + keys.HOSTS_NAME_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key		= hosts_key	+ '/' + keys.HOSTS_IP_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

	// check name/ip key for having value
	let	value = dkcobj_permanent.getValue(name_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(name_key, keys.VALUE_ENABLE)){					// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + name_key + ' key');
			return false;
		}
	}
	value = dkcobj_permanent.getValue(ip_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(ip_key, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + ip_key + ' key');
			return false;
		}
	}

	// remove all name subkeys
	if(!apiutil.isSafeEntity(is_hostnames) || !apiutil.isBoolean(is_hostnames) || (apiutil.isBoolean(is_hostnames) && is_hostnames)){
		let subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(name_key, true));
		if(apiutil.isNotEmptyArray(subkeylist)){
			for(let cnt = 0; cnt < subkeylist.length; ++cnt){
				// remove key
				if(!apiutil.isSafeString(subkeylist[cnt])){
					r3logger.wlog('Found wrong hosts element(' + JSON.stringify(subkeylist[cnt]) + ') in ' + name_key + ', thus do not remove key for this.');
				}else{
					// check and remove this key from subkey list in cuk
					if(!rawRemoveIpsSubkeyByCuk(dkcobj_permanent, subkeylist[cnt])){
						r3logger.wlog('could not remove ' + subkeylist[cnt] + ' key from cuk subkey list, but continue...');
					}
					// remove
					if(!dkcobj_permanent.remove(subkeylist[cnt], false)){				// remove key --> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name/<hostname port cuk>
						r3logger.wlog('could not remove ' + subkeylist[cnt] + ' key under ' + name_key + ' key, but continue...');
					}
				}
			}
			subkeylist	= [];
			if(!dkcobj_permanent.setSubkeys(name_key, subkeylist)){					// clear all subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
				r3logger.elog('could not clear subkeys under ' + name_key + ' key.');
				return false;
			}
		}
	}

	// remove all ip subkeys
	if(!apiutil.isSafeEntity(is_hostnames) || !apiutil.isBoolean(is_hostnames) || (apiutil.isBoolean(is_hostnames) && !is_hostnames)){
		let	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(ip_key, true));
		if(apiutil.isNotEmptyArray(subkeylist)){
			for(let cnt = 0; cnt < subkeylist.length; ++cnt){
				// remove key
				if(!apiutil.isSafeString(subkeylist[cnt])){
					r3logger.wlog('Found wrong hosts element(' + JSON.stringify(subkeylist[cnt]) + ') in ' + ip_key + ', thus do not remove key for this.');
				}else{
					// check and remove this key from subkey list in cuk
					if(!rawRemoveIpsSubkeyByCuk(dkcobj_permanent, subkeylist[cnt])){
						r3logger.wlog('could not remove ' + subkeylist[cnt] + ' key from cuk subkey list, but continue...');
					}
					// remove
					if(!dkcobj_permanent.remove(subkeylist[cnt], false)){				// remove key --> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/<ip port >
						r3logger.wlog('could not remove ' + subkeylist[cnt] + ' key under ' + ip_key + ' key, but continue...');
					}
				}
			}
			subkeylist	= [];
			if(!dkcobj_permanent.setSubkeys(ip_key, subkeylist)){						// clear all subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
				r3logger.elog('could not clear subkeys under ' + ip_key + ' key.');
				return false;
			}
		}
	}
	return true;
};

//
// Utility function for Adding IPs By CUK
//
// cuk_list				:	CUK key name and subkey(ip/hostname), extra data in array
//
// [Array element object]
// {
//		cuk:	"******"	(Openstack instance id or custom value from kubernetes, etc)
//		subkey:	"******"	(IP address's full key path: "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/<ip> <port> <cuk>")
//		extra:	"******"	(extra string: 'openstack-auto-v1', 'k8s-auto-v1' etc)
// }
//
// [NOTE]
// Current supports openStack and kubernetes CUK, then extra is allowed only 'openstack-auto-v1, 'k8s-auto-v1' now.
//
const rawAddIpsByCuk = (
	dkcobj_permanent:	K2hdkc,
	cuk_list:			dkcTypeAddIpsByCuk[]
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isNotEmptyArray(cuk_list)){
		// nothing to add
		return true;
	}

	//
	// keys
	//
	const	keys	= getK2hr3Keys();
	let		result	= true;

	// loop
	for(let cnt = 0; cnt < cuk_list.length; ++cnt){
		if(!apiutil.isSafeString(cuk_list[cnt].cuk) || !apiutil.isSafeString(cuk_list[cnt].subkey) || !apiutil.isSafeString(cuk_list[cnt].extra)){
			r3logger.elog('No. ' + cnt.toString() + ' in cuk_list(' + JSON.stringify(cuk_list[cnt]) + ') is something wrong, but continue...');
			result = false;
			continue;
		}

		// Current checks extra only openstack and kubernetes
		if(cuk_list[cnt].extra != keys.VALUE_OPENSTACK_V1 && cuk_list[cnt].extra != keys.VALUE_K8S_V1){
			r3logger.dlog('extra in list[' + cnt.toString() + '] is not ' + keys.VALUE_OPENSTACK_V1 + ' nor ' + keys.VALUE_K8S_V1);
			continue;
		}

		const	is_openstack= (cuk_list[cnt].extra == keys.VALUE_OPENSTACK_V1);
		const	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;		// "yrn:yahoo::::iaas:{openstack|k8s}"
		const	top_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(top_key, true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}
		const	cuk_key		= top_key + ':' + cuk_list[cnt].cuk;								// "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
		let		cuk_subkeys: string[] = [];

		// try to add cuk subkey to main subkey list
		const	is_new_key	= apiutil.tryAddStringToArray(top_subkeys, cuk_key);				// add subkey cuk_list[cnt].cuk to yrn:yahoo::::iaas:{openstack|k8s}
		if(!is_new_key){
			cuk_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(cuk_key, true));		// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		}

		// add key to cuk_key subkey list
		if(apiutil.tryAddStringToArray(cuk_subkeys, cuk_list[cnt].subkey)){						// add subkey cuk_list[cnt].subkey to yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
			// need to add subkey
			if(is_new_key){
				if(!dkcobj_permanent.setValue(cuk_key, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
					r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + cuk_key + ', but continue...');
					result = false;
					continue;
				}
			}
			if(!dkcobj_permanent.setSubkeys(cuk_key, cuk_subkeys)){					// set subkeys to yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
				r3logger.elog('could not set subkey list to ' + cuk_key + ', but continue...');
				result = false;
				continue;
			}
			if(is_new_key){
				// make subkey
				if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){				// add subkey yrn:yahoo::::iaas:{openstack|k8s}:<cuk> -> yrn:yahoo::::iaas:{openstack|k8s}
					r3logger.elog('could not add subkey ' + cuk_key + ' to ' + top_key + ', but continue...');
					result = false;
					continue;
				}
			}
		}
	}
	return result;
};

//
// Utility function for Removing CUK under IaaS key
//
// cuk					:	CUK key name
// extra				:	extra value
// host					:	remove host(ip) string or string array(undefined or null means all)
// remove_under_role	:	flag for removing host under role(default false)
//
// [NOTE]
// Current supports openStack and kubernetes CUK, then extra is allowed only 'openstack-auto-v1', 'k8s-auto-v1' now.
//
const rawRemoveIpsByCukEx = (
	dkcobj_permanent:	K2hdkc,
	cuk?:				string | null,
	extra?:				string | null,
	host?:				string | string[] | null,
	remove_under_role?:	boolean | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(cuk)){
		r3logger.elog('parameter cuk is something wrong');
		return false;
	}
	if(!apiutil.isBoolean(remove_under_role)){
		remove_under_role = false;
	}

	let	_host: string[] = [];
	if(apiutil.isStringArray(host)){
		_host = host;
	}else{
		if(apiutil.isSafeString(host)){
			_host = [host];
		}
	}

	//
	// keys
	//
	const	keys	= getK2hr3Keys();

	// Current checks extra only openstack and kubernetes
	if(!apiutil.isSafeString(extra) || (extra != keys.VALUE_OPENSTACK_V1 && extra != keys.VALUE_K8S_V1)){
		r3logger.dlog('extra is not ' + keys.VALUE_OPENSTACK_V1 + ' nor ' + keys.VALUE_K8S_V1 + ', current is only support ' + keys.VALUE_OPENSTACK_V1 + ' and ' + keys.VALUE_K8S_V1);
		return true;
	}
	const	is_openstack= (extra == keys.VALUE_OPENSTACK_V1);

	//var iaas_key	= keys.IAAS_TOP_KEY;														// "yrn:yahoo::::iaas"
	const	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;			// "yrn:yahoo::::iaas:{openstack|k8s}"
	const	cuk_key		= top_key + ':' + cuk;													// "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
	let		result		= true;

	// check and remove ip address key from role key
	if(remove_under_role){
		// [NOTE]
		// remove_under_role is true, try to remove keys under role/hosts/ip
		//
		// get subkey list from iaas:{openstack|k8s}:<cuk>
		const	cuk_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(cuk_key, true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		const	ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/

		for(let cnt = 0; cnt < cuk_subkeys.length; ++cnt){
			// check path
			const	matches	= cuk_subkeys[cnt].match(ipptn);									// cuk subkey name is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip> <port> <cuk>"
			if(!apiutil.isNotEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				r3logger.wlog('cuk subkey(' + cuk_subkeys[cnt] + ') is not matched by \'^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)\'.');
				continue;
			}
			// set ip value
			const	ip_value = matches[4];

			// check ip address if specify it
			if(apiutil.isNotEmptyArray(_host) && !apiutil.findStringInArray(_host, ip_value)){
				r3logger.wlog('ip address(' + JSON.stringify(ip_value) + ') is not in remove host array(' + JSON.stringify(_host) + ')');
				continue;
			}

			// check ip key value for only kubernetes CUK
			if(!is_openstack){
				const	ip_key_value_raw = dkcobj_permanent.getValue(cuk_subkeys[cnt], null, true, null);	// get value -> yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<address port cuk>
				if(apiutil.isSafeString(ip_key_value_raw) && apiutil.checkSimpleJSON(ip_key_value_raw)){
					const	ip_key_value = JSON.parse(ip_key_value_raw);

					// check cuk extra(type)
					if(apiutil.isSafeString(ip_key_value.extra) && ip_key_value.extra == keys.VALUE_K8S_V1){
						// a case of kubernetes, compare value
						if(!rawCompareHostInfoValueAndKubernetesCuk(ip_key_value, cuk)){
							r3logger.wlog('cuk subkey(' + cuk_subkeys[cnt] + ') is not as same as cuk value(' + JSON.stringify(cuk) + ').');
							result = false;
							continue;
						}
					}
				}else{
					// value is something wrong, thus we remove this wrong data.
				}
			}

			// get role/hosts/ip subkeys
			const	ip_key		= keys.NO_SERVICE_KEY + matches[1] + '::' + matches[2] + ':role:' + matches[3] + '/hosts/ip';	// "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip"
			const	ip_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(ip_key, true));	// get subkey list from yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip

			// remove ip from role/hosts/ip subkey list
			if(!apiutil.removeStringFromArray(ip_subkeys, cuk_subkeys[cnt])){
				r3logger.wlog(ip_key + ' does not have ' + cuk_subkeys[cnt] + ' subkey, but continue...');
				continue;
			}else{
				// set new role/hosts/ip subkey list
				if(!dkcobj_permanent.setSubkeys(ip_key, ip_subkeys)){					// reset new subkey list -> yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip
					r3logger.dlog('could not remove subkey ' + cuk_subkeys[cnt] + ' from ' + ip_key + ', but continue...');
					result = false;
				}
			}

			// remove ip key
			if(!dkcobj_permanent.remove(cuk_subkeys[cnt], false)){						// remove "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip> <port> <cuk>"
				r3logger.elog('could not remove ' + cuk_subkeys[cnt] + ' key, probably it is not existed.');
				result = false;
			}
		}
	}

	// check and remove ip address path subkey from cuk key
	if(!apiutil.isNotEmptyArray(_host)){
		// remove cuk from subkey list in openstack or k8s
		const top_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(top_key, true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}
		if(!apiutil.isNotEmptyArray(top_subkeys) || !apiutil.removeStringFromArray(top_subkeys, cuk_key)){
			r3logger.dlog(top_key + ' does not have ' + cuk_key + ' subkey');
		}else{
			// set new subkey list
			if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){					// reset new cuk list -> yrn:yahoo::::iaas:{openstack|k8s}
				r3logger.dlog('could not remove subkey ' + cuk + ' from ' + top_key + ', but continue...');
				result = false;
			}
		}

		// remove cuk
		if(!dkcobj_permanent.remove(cuk_key, false)){									// remove "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
			r3logger.elog('could not remove ' + cuk_key + 'key, probably it is not existed.');
			result = false;
		}
	}else{
		// remove target ip address from cuk's subkey list
		const	cuk_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(cuk_key, true));// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		const	ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/
		const	new_subkeys: string[] = [];
		for(let cnt = 0; cnt < cuk_subkeys.length; ++cnt){
			// check path
			const	matches	= cuk_subkeys[cnt].match(ipptn);									// cuk subkey name is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip> <port> <cuk>"
			if(!apiutil.isNotEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				r3logger.wlog('cuk subkey(' + cuk_subkeys[cnt] + ') is not matched by \'^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)\'.');
				continue;
			}
			// set ip value
			const	ip_value = matches[4];

			// check ip address if specify it
			if(apiutil.findStringInArray(_host, ip_value)){
				continue;
			}
			new_subkeys.push(cuk_subkeys[cnt]);
		}

		if(!apiutil.isNotEmptyArray(new_subkeys)){
			// remove cuk from subkey list in openstack or k8s
			const top_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(top_key, true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}
			if(!apiutil.isNotEmptyArray(top_subkeys) || !apiutil.removeStringFromArray(top_subkeys, cuk_key)){
				r3logger.dlog(top_key + ' does not have ' + cuk_key + ' subkey');
			}else{
				// set new subkey list to openstack or k8s
				if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){				// reset new cuk list -> yrn:yahoo::::iaas:{openstack|k8s}
					r3logger.dlog('could not remove subkey ' + cuk + ' from ' + top_key + ', but continue...');
					result = false;
				}
			}
			// remove cuk
			if(!dkcobj_permanent.remove(cuk_key, false)){								// remove "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
				r3logger.elog('could not remove ' + cuk_key + 'key, probably it is not existed.');
				result = false;
			}
		}else{
			// update new subkey list to cuk
			if(!dkcobj_permanent.setSubkeys(cuk_key, new_subkeys)){					// reset new subkey -> yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
				r3logger.dlog('could not remove subkey ' + cuk + ' from ' + top_key + ', but continue...');
				result = false;
			}
		}
	}
	return result;
};

//
// Utility function for Removing subkey in CUK under IaaS key
//
// tgkey				:	yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<address port cuk>
//
// [NOTE]
// Current supports openStack and kubernetes CUK, then extra is allowed only 'openstack-auto-v1', 'k8s-auto-v1' now.
//
const rawRemoveIpsSubkeyByCuk = (
	dkcobj_permanent:	K2hdkc,
	tgkey?:				string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tgkey)){
		r3logger.elog('parameter tgkey is something wrong');
		return false;
	}

	//
	// keys
	//
	const	keys	= getK2hr3Keys();

	// get tgkey data
	const	value_raw	= dkcobj_permanent.getValue(tgkey, null, true, null);		// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<address port cuk>
	const	value		= apiutil.parseJSON(value_raw);
	if(!apiutil.isPlainObject(value)){
		r3logger.dlog('tgkey(' + tgkey + ') does not have correct ip/hostname key value');
		return true;
	}

	if(!apiutil.isSafeString(value.cuk)){
		r3logger.dlog('tgkey(' + tgkey + ') does  not have cuk');
		return true;
	}

	// Current checks extra only openstack and kubernetes
	if(!apiutil.isSafeString(value.extra) || (value.extra != keys.VALUE_OPENSTACK_V1 && value.extra != keys.VALUE_K8S_V1)){
		r3logger.dlog('extra is not ' + keys.VALUE_OPENSTACK_V1 + ' nor ' + keys.VALUE_K8S_V1 + ', current is only support ' + keys.VALUE_OPENSTACK_V1 + ' and ' + keys.VALUE_K8S_V1);
		return true;
	}
	const	is_openstack= (value.extra == keys.VALUE_OPENSTACK_V1);
	const	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;		// "yrn:yahoo::::iaas:{openstack|k8s}"
	const	cuk_key		= top_key + ':' + apiutil.getSafeString(value.cuk);					// "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"

	// remove tgkey from subkey list
	const	cuk_subkeys	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(cuk_key, true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
	if(!apiutil.isNotEmptyArray(cuk_subkeys) || !apiutil.removeStringFromArray(cuk_subkeys, tgkey)){
		r3logger.dlog('cuk key(' + cuk_key + ') already does not have ' + tgkey + ' subkey.');
		return true;
	}

	// reset
	if(!apiutil.isNotEmptyArray(cuk_subkeys)){
		// subkey list is empty, then remove cuk key
		const	top_subkeys = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(top_key, true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}

		// remove cuk key from top's subkey list
		if(!apiutil.isNotEmptyArray(top_subkeys) || !apiutil.removeStringFromArray(top_subkeys, cuk_key)){
			r3logger.dlog('openstack or k8s key(' + top_key + ') already does not have ' + cuk_key + ' subkey.');
		}else{
			// reset top's subkey list
			if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){				// reset new subkey list -> yrn:yahoo::::iaas:{openstack|k8s}
				r3logger.dlog('could not set new subkey list to openstack or k8s key(' + top_key + ')');
			}
		}

		// remove cuk key
		if(!dkcobj_permanent.remove(cuk_key, false)){								// remove yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
			r3logger.elog('could not remove ' + cuk_key + ' key, probably it is not existed. thus continue...');
		}

	}else{
		// reset subkey list
		if(!dkcobj_permanent.setSubkeys(cuk_key, cuk_subkeys)){					// reset new subkey list -> yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
			r3logger.dlog('could not set new subkey list to cuk key(' + cuk_key + ')');
			return false;
		}
	}

	return true;
};

//---------------------------------------------------------
// remove IP address by CUK raw function
//---------------------------------------------------------
// cuk				:	CUK key name
// host				:	remove host(ip) string or string array(undefined or null means all)
// remove_under_role:	flag for removing host under role(default false)
//
// [NOTE]
// Current supports openStack and kubernetes CUK, then extra is allowed only 'openstack-auto-v1', 'k8s-auto-v1' now.
//
const rawRemoveIpsByCuk = (
	cuk?:				string | null,
	host?:				string | string[] | null,
	remove_under_role?:	boolean | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(cuk)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : cuk=' + JSON.stringify(cuk);
		r3logger.elog(resobj.message);
		return resobj;
	}
	const	keys	= getK2hr3Keys();
	const	extra	= rawGetExtraFromCuk(cuk);
	if(extra != keys.VALUE_OPENSTACK_V1 && extra != keys.VALUE_K8S_V1){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : cuk=' + JSON.stringify(cuk);
		r3logger.elog(resobj.message);
		return resobj;
	}

	if(!apiutil.isBoolean(remove_under_role)){
		remove_under_role = false;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// remove ip by cuk
	if(!rawRemoveIpsByCukEx(dkcobj, cuk, extra, host, remove_under_role)){
		resobj.result	= false;
		resobj.message	= 'Some error occurred during removing IP address by cuk=' + JSON.stringify(cuk) + ' and extra=' + JSON.stringify(extra) + ' and host(' + JSON.stringify(host) + ') and remove_under_role=' + JSON.stringify(remove_under_role);
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// Get All IP Addresses related to CUK
//---------------------------------------------------------
// Get all ip address with etc data which are related to CUK
//
// extra			:	extra value('openstack-auto-v1' or 'k8s-auto-v1')
//
// Result:
// {								-> Always return object
//		error:						-> null or Error object(if error)
//		data: [						-> data array includes ip address etc
//			dkcTypeHostRawValueSet = {
//				ip:			ip,		-> ip address string
//				port:		port,	-> port number or *
//				cuk:		cuk,	-> cuk string
//				extra:		string,	-> 'openstack-auto-v1' or 'k8s-auto-v1'
//				tag:		string,	-> tag string
//				inboundip:	ip,		-> inbound ip address
//				outboundip:	ip,		-> outbound ip address
//				key:		string,	-> this ip address yrn full path
//				alive: 		true	-> always true
//			},
//			.
//			.
//			.
//		]
//	}
//
// [NOTE]
// Current, this function supports only openstack and kubernetes.
// This function operates sequentially for k2hdkc handle, and this
// function calling process does not work in the main process.
//
const rawGetAllIpDatasByCuk = (extra?: string | null): resTypeGetAllIpDatas => {

	const	result: resTypeGetAllIpDatas = {error: null, data: null};

	const	keys = getK2hr3Keys();

	// Current checks extra only openstack and kubernetes
	if(!apiutil.isSafeString(extra) || (extra != keys.VALUE_OPENSTACK_V1 && extra != keys.VALUE_K8S_V1)){
		result.error = new Error('extra(' + JSON.stringify(extra) + ') is something wrong.');
		r3logger.elog(result.error.message);
		return result;
	}
	const	is_openstack = (extra == keys.VALUE_OPENSTACK_V1);

	//
	// K2HDKC
	//
	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);						// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		result.error = new Error('Not initialize yet, or configuration is not set');
		r3logger.elog(result.error.message);
		dkcobj.clean();
		return result;
	}

	//
	// keys
	//
	//var iaas_key	= keys.IAAS_TOP_KEY;														// "yrn:yahoo::::iaas"
	const	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;			// "yrn:yahoo::::iaas:{openstack|k8s}"
	const	iaasmatch	= is_openstack ? keys.MATCH_ANY_IAAS_OS : keys.MATCH_ANY_IAAS_K8S;		//
	const	iaasptn		= new RegExp('^' + iaasmatch);											// regex = /^yrn:yahoo::::iaas:{openstack|k8s}:(.*)/
	const	ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);								// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/
	result.data			= [];

	// Get subkey list under iaas:{openstack|k8s}
	const	top_subkeys	= apiutil.getSafeStringArray(dkcobj.getSubkeys(top_key, true));		// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}

	for(let cnt = 0; cnt < top_subkeys.length; ++cnt){
		if(!apiutil.isSafeString(top_subkeys[cnt])){
			r3logger.wlog('subkey path' + JSON.stringify(top_subkeys[cnt]) + ' in ' + top_key + ' is something wrong.');
			continue;
		}
		// check & parse cuk string
		const	cukmatches	= top_subkeys[cnt].match(iaasptn);									// check key is under "yrn:yahoo::::iaas:{openstack|k8s}"
		if(!apiutil.isNotEmptyArray(cukmatches) || cukmatches.length < 2 || !apiutil.isSafeString(cukmatches[1])){
			r3logger.dlog('subkey path' + JSON.stringify(top_subkeys[cnt]) + ' in ' + top_key + ' is not matched ' + keys.MATCH_ANY_IAAS_OS);
			continue;
		}
		const	cuk = cukmatches[1];

		// Get subkey list under iaas:{openstack|k8s}:<cuk>
		const	cuk_subkeys = apiutil.getSafeStringArray(dkcobj.getSubkeys(top_subkeys[cnt], true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		for(let cnt2 = 0; cnt2 < cuk_subkeys.length; ++cnt2){
			if(!apiutil.isSafeString(cuk_subkeys[cnt2])){
				r3logger.wlog('subkey path' + JSON.stringify(cuk_subkeys[cnt2]) + ' in ' + top_subkeys[cnt] + ' is something wrong.');
				continue;
			}
			// check and parse ip string
			const	ipmatches = cuk_subkeys[cnt2].match(ipptn);									// check yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)
			if(!apiutil.isNotEmptyArray(ipmatches) || ipmatches.length < 7 || !apiutil.isSafeString(ipmatches[4]) || !apiutil.isSafeString(ipmatches[5])){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' is not matched ' + keys.MATCH_ANY_IP_PORT);
				continue;
			}
			// check cuk string
			if(!apiutil.isSafeString(ipmatches[6]) || !apiutil.compareCaseString(ipmatches[6],cuk)){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' is not same cuk(' + cuk + ').');
				continue;
			}
			// normalize port
			let	portnum: number = 0;
			if(apiutil.isSafeNumeric(ipmatches[5])){
				const	tmpPort = apiutil.cvtToNumber(ipmatches[5]);
				if(apiutil.isSafeNumber(tmpPort)){
					portnum = tmpPort;
				}else{
					r3logger.wlog('port number(' + JSON.stringify(ipmatches[5]) + ') is not number nor *(any).');
				}
			}else if(apiutil.isSafeString(ipmatches[5]) && '*' === ipmatches[5]){
				// post is any
				portnum = 0;
			}else{
				r3logger.wlog('port number(' + JSON.stringify(ipmatches[5]) + ') is not number nor *(any).');
			}
			// get value
			const	tmp_ipvalue = dkcobj.getValue(cuk_subkeys[cnt2], null, true, null);			// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<address port cuk>
			if(!apiutil.isSafeString(tmp_ipvalue) || !apiutil.checkSimpleJSON(tmp_ipvalue)){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' has wrong value ' + JSON.stringify(tmp_ipvalue) +').');
				continue;
			}
			const	ipvalue = JSON.parse(tmp_ipvalue);

			// check extra in value
			if(!apiutil.isSafeString(ipvalue.extra) || (is_openstack && ipvalue.extra != keys.VALUE_OPENSTACK_V1) || (!is_openstack && ipvalue.extra != keys.VALUE_K8S_V1)){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' does not have ' + (is_openstack ? keys.VALUE_OPENSTACK_V1 : keys.VALUE_K8S_V1) + ' extra data.');
				continue;
			}

			// Add ip address data to result.data
			const	host_info: dkcTypeHostRawValueSet = {
				ip:			ipmatches[4],
				port:		portnum,
				cuk:		cuk,
				extra:		ipvalue.extra,
				tag:		apiutil.getSafeString(ipvalue.tag),
				key:		cuk_subkeys[cnt2],
				alive:		true,
				inboundip:	((!apiutil.isSafeString(ipvalue.inboundip) && apiutil.isIpAddressString(ipvalue.inboundip)) ? apiutil.getSafeString(ipvalue.inboundip) : null),
				outboundip:	((!apiutil.isSafeString(ipvalue.outboundip) && apiutil.isIpAddressString(ipvalue.outboundip)) ? apiutil.getSafeString(ipvalue.outboundip) : null)
			};

			if(!is_openstack){
				host_info[keys.K8S_NAMESPACE_INCUK_KEY]		= apiutil.getSafeString(ipvalue[keys.K8S_NAMESPACE_INCUK_KEY]);
				host_info[keys.K8S_SA_INCUK_KEY]			= apiutil.getSafeString(ipvalue[keys.K8S_SA_INCUK_KEY]);
				host_info[keys.K8S_NODENAME_INCUK_KEY]		= apiutil.getSafeString(ipvalue[keys.K8S_NODENAME_INCUK_KEY]);
				host_info[keys.K8S_NODEIP_INCUK_KEY]		= apiutil.getSafeString(ipvalue[keys.K8S_NODEIP_INCUK_KEY]);
				host_info[keys.K8S_PODNAME_INCUK_KEY]		= apiutil.getSafeString(ipvalue[keys.K8S_PODNAME_INCUK_KEY]);
				host_info[keys.K8S_PODID_INCUK_KEY]			= apiutil.getSafeString(ipvalue[keys.K8S_PODID_INCUK_KEY]);
				host_info[keys.K8S_PODIP_INCUK_KEY]			= apiutil.getSafeString(ipvalue[keys.K8S_PODIP_INCUK_KEY]);
				host_info[keys.K8S_CONTAINERID_INCUK_KEY]	= apiutil.getSafeString(ipvalue[keys.K8S_CONTAINERID_INCUK_KEY]);
				host_info[keys.K8S_RAND_INCUK_KEY]			= apiutil.getSafeString(ipvalue[keys.K8S_RAND_INCUK_KEY]);
			}
			result.data.push(host_info);
		}
	}

	dkcobj.clean();
	return result;
};

//---------------------------------------------------------
// Remove IP Addresses depending CUK
//---------------------------------------------------------
// Remove ip addresses related to CUK with pending second,
// after checking alive.
//
// ipdatas:				Array of ip address and etc
//							dkcTypeHostRawValueSet[] = [
//								dkcTypeHostRawValueSet = {
//									ip:		ip,			-> ip address string
//									cuk:	cuk,		-> cuk string
//									port:	port,		-> port number or *
//									cuk:	cuk,		-> cuk string
//									extra:	string		-> 'openstack-auto-v1', 'k8s-auto-v1' or etc
//									key:	string		-> this ip address yrn full path
//									alive: 	boolean		-> true or false
//								},
//								.
//								.
//								.
//							]
// pendingsec:			Grace time until IP address is deleted
// logger:				Logging function like console.log
//
// Result:				Returns null for no error, returns Error object for
//						something error occurred
//
// [NOTE]
// Current, this function supports only openstack and kubernetes.
// This function operates sequentially for k2hdkc handle, and this
// function calling process does not work in the main process.
//
const rawRemoveIpAddressWithCuk = (
	ipdatas?:		dkcTypeHostRawValueSet[] | null,
	pendingsec?:	string | number | null,
	logger?:		LoggerFunction | null
): Error | null => {

	let	result: Error | null = null;
	if(!apiutil.isNotEmptyArray(ipdatas)){
		r3logger.dlog('ipdatas is empty array or not array.');
		return result;
	}

	if(!apiutil.isSafeNumeric(pendingsec)){
		result = new Error('pendingsec is not number : ' + JSON.stringify(pendingsec));
		r3logger.elog(result.message);
		return result;
	}
	const	tmpSec = apiutil.cvtToNumber(pendingsec);
	if(!apiutil.isSafeNumber(tmpSec)){
		result = new Error('pendingsec is not number : ' + JSON.stringify(pendingsec));
		r3logger.elog(result.message);
		return result;
	}
	const	_pendingsec: number = tmpSec;

	if(!apiutil.isFunction(logger)){
		r3logger.wlog('logger is not function, thus using stdout for logging.');
		logger = (...args: string[]): void => {
			process.stdout.write(args.join(' ') + '\n');
		};
	}

	//
	// K2HDKC
	//
	const	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);								// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		result = new Error('Not initialize yet, or configuration is not set');
		r3logger.elog(result.message);
		dkcobj.clean();
		return result;
	}

	const	keys = getK2hr3Keys();

	//
	// Loop
	//
	const	errorKeys: string[] = [];
	for(let cnt = 0; cnt < ipdatas.length; ++cnt){
		const tmp_ipdata: dkcTypeHostRawValueSet = ipdatas[cnt];

		// check
		if(	!apiutil.isSafeEntity(tmp_ipdata)														||	// must be object
			!apiutil.isSafeString(tmp_ipdata.ip)													||	// must be string
			(!apiutil.isSafeNumeric(tmp_ipdata.port) && (!apiutil.isSafeString(tmp_ipdata.port) || '*' !== tmp_ipdata.port))	|| // must be number or '*'
			!apiutil.isSafeString(tmp_ipdata.cuk)													||	// must be string
			!apiutil.isSafeString(tmp_ipdata.extra)													||	// must be string
			(tmp_ipdata.extra != keys.VALUE_OPENSTACK_V1 && tmp_ipdata.extra != keys.VALUE_K8S_V1)	||	// must be 'openstack-auto-v1' or 'k8s-auto-v1'
			!apiutil.isSafeString(tmp_ipdata.key)													||	// must be string
			!apiutil.isSafeEntity(tmp_ipdata.alive)													||	// must be boolean
			!apiutil.isBoolean(tmp_ipdata.alive)													)	//
		{
			r3logger.wlog('No.' + cnt.toString() + ' element in ip data array is something wrong : ' + JSON.stringify(tmp_ipdata));
			continue;
		}

		// get value
		const	tmp_ipvalue = dkcobj.getValue(tmp_ipdata.key, null, true, null);			// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/"ip port cuk"
		if(!apiutil.isSafeString(tmp_ipvalue) || !apiutil.checkSimpleJSON(tmp_ipvalue)){
			r3logger.elog('No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + ') has something wrong value : ' + JSON.stringify(tmp_ipvalue));
			// logging
			logger('ERROR:READ:VALUE - [' + tmp_ipdata.key + ']');
			continue;
		}
		const	ipvalue = JSON.parse(tmp_ipvalue);

		if(tmp_ipdata.alive){
			// alive now
			if(apiutil.isSafeNumber(ipvalue.deadat)){
				// key has deadat key(which marked dead time), thus remove it
				delete ipvalue.deadat;

				r3logger.dlog('IP Address is alive now, thus set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + ')');

				// reset new value
				if(!dkcobj.setValue(tmp_ipdata.key, JSON.stringify(ipvalue))){		// reset value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/"ip port cuk"
					r3logger.elog('could not set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + '), but continue...');
					errorKeys.push('reset value of alive to (' + tmp_ipdata.key + ')');
					logger('ERROR:REVIVAL - [' + tmp_ipdata.key + ']');
					continue;
				}
				// logging
				logger('REVIVAL - [' + tmp_ipdata.key + ']');
			}
		}else{
			// dead now
			const	now				= Math.floor(new Date().getTime() / 1000);
			let		_deadt: number	= 0;
			let		_isNumber		= false;
			if(apiutil.isSafeNumeric(ipvalue.deadat)){
				const tmpDeadat = apiutil.cvtToNumber(ipvalue.deadat);
				if(apiutil.isSafeNumber(tmpDeadat)){
					_deadt		= tmpDeadat;
					_isNumber	= true;
				}
			}

			if(_isNumber){
				if((_deadt + _pendingsec) < now){
					// over pending time, thus remove this
					r3logger.dlog('IP address is not alive and over pending time, thus remove No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + ')');

					if(!rawRemoveIpsByCukEx(dkcobj, tmp_ipdata.cuk, tmp_ipdata.extra, tmp_ipdata.ip, true)){
						r3logger.elog('could not remove No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + '), but continue...');
						errorKeys.push('remove ip for (' + tmp_ipdata.key + ')');
						logger('ERROR:REMOVE - [' + tmp_ipdata.key + ']');
						continue;
					}
					// logging
					logger('REMOVE - [' + tmp_ipdata.key + ']');

				}else{
					r3logger.dlog('IP address is not alive but not over pending time yet, thus keep No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + ')');

					// logging
					logger('PENDING:CONTINUE - [' + tmp_ipdata.key + ']');
				}
			}else{
				// not have deadat element, set new it
				ipvalue.deadat = now;

				r3logger.dlog('IP Address changed status to not alive, thus set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + ')');

				// reset new value
				if(!dkcobj.setValue(tmp_ipdata.key, JSON.stringify(ipvalue))){			// reset value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/"ip port cuk"
					r3logger.elog('could not set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + tmp_ipdata.key + '), but continue...');
					errorKeys.push('set new lost time to (' + tmp_ipdata.key + ')');
					logger('ERROR:PENDING:START - [' + tmp_ipdata.key + ']');
					continue;
				}
				// logging
				logger('PENDING:START - [' + tmp_ipdata.key + ']');
			}
		}
	}
	if(apiutil.isNotEmptyArray(errorKeys)){
		result = new Error('Failed operation for some ip addresses : ' + JSON.stringify(errorKeys));
		r3logger.elog(result.message);
		dkcobj.clean();
		return result;
	}

	dkcobj.clean();
	return result;
};

//
// Utilities for hosts in role
//
// key_list			:	assume a subkey list of hostnames(ips).
// is_hostname		:	flag whether key_list is a subkey list of hostnames.
//
// return			:	returns the array shown below
//
//	array = [
//		dkcTypeOneRoleHostValue = {
//			host_normal:	'<hostname(ip)>{:<port>}'						if any port, port value is empty
//			host_all:		'<hostname(ip)> <port> <cuk> <extra> <tag> <inboundip> <outboundip>'
//																			if any port, port is *
//			detail_key:		'<hostname(ip)>,<port>,<cuk>'					if any port, port is 0
//			detail: 		dkcTypeOneRoleHostDetailValue = {
//								host:					<string>			hostanme or IP address string
//								port:					<number>			port number(if any, set 0)
//								extra:					<string>			'k8s-auto-v1' or 'openstack-auto-v1' or undefined(if it does not exist)
//								tag:					<string>			tag string            (or undefined if it does not exist)
//								cuk:					<string>			cuk string            (or undefined if it does not exist)
//								inboundip:				<string>			inbound ip address    (or undefined if it does not exist)
//								outboundip:				<string>			outbound ip address   (or undefined if it does not exist)
//								k8s_namespace:			<string>			namespace on k8s      (or undefined unless registering from k8s)
//								k8s_service_account:	<string>			service account on k8s(or undefined unless registering from k8s)
//								k8s_node_name:			<string>			node name on k8s      (or undefined unless registering from k8s)
//								k8s_node_ip:			<string>			node ip address on k8s(or undefined unless registering from k8s)
//								k8s_pod_name:			<string>			pod name on k8s       (or undefined unless registering from k8s)
//								k8s_pod_id:				<string>			pod id on k8s         (or undefined unless registering from k8s)
//								k8s_pod_ip:				<string>			pod ip address on k8s (or undefined unless registering from k8s)
//								k8s_container_id:		<string>			container id on k8s   (or undefined unless registering from k8s)
//								...											(may be expanded in the future)
//							}
//		},
//		...
//	]
//
// [NOTE]
// This utility function is a submodule of rawGetRoleHostLists().
//
const rawGetRoleHostListsEx = (
	dkcobj_permanent:	K2hdkc,
	keylist?:			string[] | null,
	is_hostname?:		boolean | null
): dkcTypeOneRoleHostValue[] => {

	const	resultarr: dkcTypeOneRoleHostValue[] = [];

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return resultarr;
	}
	if(!apiutil.isBoolean(is_hostname)){
		r3logger.elog('parameter is_hostname is not boolean');
		return resultarr;
	}

	if(apiutil.isNotEmptyArray(keylist)){
		//
		// keys
		//
		const keys	= getK2hr3Keys();															// temporary for regex key(getting tenant/service)

		// regex for parsing hostname(ip) from 'hostname(ip) port cuk' in keylist.
		let	keyptn: RegExp | null;
		if(is_hostname){
			keyptn	= new RegExp('^' + keys.MATCH_ANY_HOSTNAME_PORT);					// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name/(.*) (.*) (.*)/
		}else{
			keyptn	= new RegExp('^' + keys.MATCH_ANY_IP_PORT);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/
		}

		for(let cnt = 0; cnt < keylist.length; ++cnt){
			const matches	= keylist[cnt].match(keyptn);
			if(!apiutil.isNotEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				continue;
			}
			//
			// matches[4] ---> hostname or ip address
			// matches[5] ---> port number
			// matches[6] ---> container unique key(cuk)
			//
			const	host			= matches[4];
			const	is_any_port		= rawIsPortAny(matches[5]);
			const	port			= rawGetSafePortNumber(matches[5]);
			const	cuk				= (apiutil.isSafeString(matches[6]) ? matches[6] : null);

			// get values in key
			const	detailval		= dkcobj_permanent.getValue(keylist[cnt], null, true, null);		// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name/"hostname(ip) port cuk"
			if(!apiutil.isSafeString(detailval) || !apiutil.checkSimpleJSON(detailval)){
				r3logger.wlog('could not get key(' + JSON.stringify(keylist[cnt]) + ') value, so skip this.');
				continue;
			}
			const	_detailval		= JSON.parse(detailval);
			if(!apiutil.isPlainObject(_detailval)){
				r3logger.wlog('Got key(' + JSON.stringify(keylist[cnt]) + ') value is wrong, so skip this.');
				continue;
			}

			const	detail_host			= (is_hostname ? (apiutil.isSafeString(_detailval.hostname) ? _detailval.hostname : null) : (apiutil.isSafeString(_detailval.ip) ? _detailval.ip : null));
			const	detail_port			= rawGetSafePortNumber(_detailval.port);
			const	detail_cuk			= (apiutil.isSafeString(_detailval.cuk) ? _detailval.cuk : null);
			const	detail_extra		= (apiutil.isSafeString(_detailval.extra) ? _detailval.extra : null);
			const	detail_tag			= (apiutil.isSafeString(_detailval.tag) ? _detailval.tag : null);
			const	detail_inboundip	= (apiutil.isSafeString(_detailval.inboundip) && apiutil.isIpAddressString(_detailval.inboundip) ? _detailval.inboundip : null);
			const	detail_outboundip	= (apiutil.isSafeString(_detailval.outboundip) && apiutil.isIpAddressString(_detailval.outboundip) ? _detailval.outboundip : null);

			// check the consistency of both values
			if(host !== detail_host || port !== detail_port || cuk !== detail_cuk){
				r3logger.wlog('the value obtained from the key(' + JSON.stringify(keylist[cnt]) + ') is different from the value(' + JSON.stringify(_detailval) + ') set for the key, so skip this.');
				continue;
			}

			// extra
			const	extra = ((detail_extra == keys.VALUE_OPENSTACK_V1 || detail_extra == keys.VALUE_K8S_V1) ? detail_extra : null);

			// detail for k8s
			const	k8s_details: { [key: string]: string }	= {};
			if(null !== cuk && extra == keys.VALUE_K8S_V1){
				const	_k8s_key_namespace	= keys.K8S_NAMESPACE_INCUK_KEY;
				const	_k8s_key_sa			= keys.K8S_SA_INCUK_KEY;
				const	_k8s_key_nodename	= keys.K8S_NODENAME_INCUK_KEY;
				const	_k8s_key_nodeip		= keys.K8S_NODEIP_INCUK_KEY;
				const	_k8s_key_podname	= keys.K8S_PODNAME_INCUK_KEY;
				const	_k8s_key_podid		= keys.K8S_PODID_INCUK_KEY;
				const	_k8s_key_podip		= keys.K8S_PODIP_INCUK_KEY;
				const	_k8s_key_conid		= keys.K8S_CONTAINERID_INCUK_KEY;

				if(apiutil.isSafeString(_k8s_key_namespace)	&& apiutil.isSafeString(_detailval[_k8s_key_namespace])){	k8s_details[_k8s_key_namespace]	= _detailval[_k8s_key_namespace];	}
				if(apiutil.isSafeString(_k8s_key_sa)		&& apiutil.isSafeString(_detailval[_k8s_key_sa])){			k8s_details[_k8s_key_sa]		= _detailval[_k8s_key_sa];			}
				if(apiutil.isSafeString(_k8s_key_nodename)	&& apiutil.isSafeString(_detailval[_k8s_key_nodename])){	k8s_details[_k8s_key_nodename]	= _detailval[_k8s_key_nodename];	}
				if(apiutil.isSafeString(_k8s_key_nodeip)	&& apiutil.isSafeString(_detailval[_k8s_key_nodeip])){		k8s_details[_k8s_key_nodeip]	= _detailval[_k8s_key_nodeip];		}
				if(apiutil.isSafeString(_k8s_key_podname)	&& apiutil.isSafeString(_detailval[_k8s_key_podname])){		k8s_details[_k8s_key_podname]	= _detailval[_k8s_key_podname];		}
				if(apiutil.isSafeString(_k8s_key_podid)		&& apiutil.isSafeString(_detailval[_k8s_key_podid])){		k8s_details[_k8s_key_podid]		= _detailval[_k8s_key_podid];		}
				if(apiutil.isSafeString(_k8s_key_podip)		&& apiutil.isSafeString(_detailval[_k8s_key_podip])){		k8s_details[_k8s_key_podip]		= _detailval[_k8s_key_podip];		}
				if(apiutil.isSafeString(_k8s_key_conid)		&& apiutil.isSafeString(_detailval[_k8s_key_conid])){		k8s_details[_k8s_key_conid]		= _detailval[_k8s_key_conid];		}
			}

			// make parts of host_all
			let	host_all_ext	= (null === detail_outboundip	? '' : detail_outboundip);
			host_all_ext		= (null === detail_inboundip	? '' : detail_inboundip)	+ keys.VALUE_HOST_SEP + host_all_ext;
			host_all_ext		= (null === detail_tag			? '' : detail_tag)			+ keys.VALUE_HOST_SEP + host_all_ext.trimEnd();
			host_all_ext		= (null === extra				? '' : extra)				+ keys.VALUE_HOST_SEP + host_all_ext.trimEnd();
			host_all_ext		= host_all_ext.trim();

			// make detail
			const onehostdetail: dkcTypeOneRoleHostDetailValue = {
				host:					detail_host,
				port:					detail_port,
				extra:					extra,
				cuk:					detail_cuk,
				tag:					detail_tag,
				inboundip:				(apiutil.isSafeString(detail_inboundip) ?	detail_inboundip : null),
				outboundip:				(apiutil.isSafeString(detail_outboundip) ?	detail_outboundip : null),
				// the following definitions will be undefined if (null === cuk || extra !== keys.VALUE_K8S_V1).
				k8s_namespace:			k8s_details[keys.K8S_NAMESPACE_INCUK_KEY],
				k8s_service_account:	k8s_details[keys.K8S_SA_INCUK_KEY],
				k8s_node_name:			k8s_details[keys.K8S_NODENAME_INCUK_KEY],
				k8s_node_ip:			k8s_details[keys.K8S_NODEIP_INCUK_KEY],
				k8s_pod_name:			k8s_details[keys.K8S_PODNAME_INCUK_KEY],
				k8s_pod_id:				k8s_details[keys.K8S_PODID_INCUK_KEY],
				k8s_pod_ip:				k8s_details[keys.K8S_PODIP_INCUK_KEY],
				k8s_container_id:		k8s_details[keys.K8S_CONTAINERID_INCUK_KEY]
			};

			// make one result object
			const onehost: dkcTypeOneRoleHostValue = {
				host_normal:	(host + (is_any_port ? '' : (keys.VALUE_HOST_REGSEP + String(port)))),
				host_all:		(host + keys.VALUE_HOST_SEP + (is_any_port ? keys.VALUE_ANY_PORT : String(port)) + keys.VALUE_HOST_SEP + (null === cuk ? '' : cuk) + (apiutil.isSafeString(host_all_ext) ? (keys.VALUE_HOST_SEP + host_all_ext) : '')),
				detail_key:		(host + keys.VALUE_HOST_DETAILSEP + (is_any_port ? '0' : String(port)) + keys.VALUE_HOST_DETAILSEP + (null === cuk ? '' : cuk)),
				detail:			onehostdetail
			};

			// add result
			resultarr.push(onehost);
		}
	}
	return resultarr;
};

//
// Utilities for hosts in role
//
// role_key			:	role key
// is_expand		:	if you need to get result in role tree and alias, this value is specified true.
// base_role_top	:	The base_role_top is the top path of the roll path that started getting host list.
//						For example, if role_key is an alias for another role, base_role_top will indicate
//						a different top path.
//
// return:
//	always following object(if not found role or hostnames or ips, these data is set empty array):
//	dkcTypeRoleHostList = {
//		normal: dkcTypeRoleHostNormalList = {		normalization hostname(ip)
//			hostnames: [								hostname array or empty array
//				'<hostname>{:<port>}',					(if any port, port value is empty)
//				...
//			],
//			ips: [										ip address array or empty array
//				'<ip address>{:<port>}',				(if any port, port value is empty)
//				...
//			]
//		},
//		all: dkcTypeRoleHostFullValueList = {		all information
//			hostnames: [								hostname array or empty array
//				'<hostname> <port> <cuk> <extra> <tag> <inboundip> <outboundip>',		(if any port, port is *)
//				...
//			],
//			ips: [										ip address array or empty array
//				'<ip address> <port> <cuk> <extra> <tag> <inboundip> <outboundip>',		(if any port, port is *)
//				...
//			]
//		},
//		detail: dkcTypeRoleHostDetailList = {		detail information(used by the template engine)
//			host: dkcTypeRoleHostDetailPair = {			hostname object list
//															one of hostanme object
//				'<hostname>,<port>,<cuk>': dkcTypeOneRoleHostDetailValue = {
//					host:					<string>			hostanme(FQDN) string
//					port:					<number>			port number(if any, set 0)
//					extra:					<string>			'k8s-auto-v1' or 'openstack-auto-v1' or undefined(if it does not exist)
//					tag:					<string>			tag string            (or undefined if it does not exist)
//					cuk:					<string>			cuk string            (or undefined if it does not exist)
//					inboundip:				<string>			inbound ip address    (or undefined if it does not exist)
//					outboundip:				<string>			outbound ip address   (or undefined if it does not exist)
//					k8s_namespace:			<string>			namespace on k8s      (or undefined unless registering from k8s)
//					k8s_service_account:	<string>			service account on k8s(or undefined unless registering from k8s)
//					k8s_node_name:			<string>			node name on k8s      (or undefined unless registering from k8s)
//					k8s_node_ip:			<string>			node ip address on k8s(or undefined unless registering from k8s)
//					k8s_pod_name:			<string>			pod name on k8s       (or undefined unless registering from k8s)
//					k8s_pod_id:				<string>			pod id on k8s         (or undefined unless registering from k8s)
//					k8s_pod_ip:				<string>			pod ip address on k8s (or undefined unless registering from k8s)
//					k8s_container_id:		<string>			container id on k8s   (or undefined unless registering from k8s)
//					...											(may be expanded in the future)
//				},
//				...
//			},
//			ip: dkcTypeRoleHostDetailPair = {			ip address object list
//				'<ip address>,<port>,<cuk>': {				one of ip address object
//					...											(this elements are as same as hostname object list)
//				},
//				...
//			}
//		}
//	}
//
// [NOTE]
// This function is only used from rawGetResource() and rawGetRoles(),
// and do not use this directly.
// This function does not return EXT(extra) data for each host(ip), because this
// extra data is only used in internal k2hr3. (But it can be set from API)
//
const rawGetRoleHostLists = (
	dkcobj_permanent:	K2hdkc,
	role_key?:			string | null,
	is_expand?:			boolean | null,
	base_role_top?:		string | null
): dkcTypeRoleHostList | null => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return null;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand = false;																	// default is false
	}

	//
	// keys
	//
	let		keys			= getK2hr3Keys();												// temporary for regex key(getting tenant/service)
	const	policies_key	= role_key	+ '/' + keys.POLICIES_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	const	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	const	id_key			= role_key	+ '/' + keys.ID_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	const	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	const	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"
	const	alias_key		= role_key	+ '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"

	// result
	const resultobj: dkcTypeRoleHostList = {
		normal: {
			hostnames:	[],
			ips:		[]
		},
		all: {
			hostnames:	[],
			ips:		[]
		},
		detail: {
			host:		{},
			ip:			{}
		}
	};

	// get tenant/service
	const roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const rolematches	= role_key.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4){
		r3logger.elog('role parameter is not match role path : role=' + JSON.stringify(role_key));
		return null;
	}
	// reset keys with tenant and service
	keys				= getK2hr3Keys(null, rolematches[2], rolematches[1]);
	if(!apiutil.isSafeString(base_role_top)){
		base_role_top	= keys.ROLE_TOP_KEY;												// set base role top if it is not specified
	}

	// get hostnames and ips from aliases when role is the direct base of base_role_top.
	if(is_expand && 0 === role_key.indexOf(base_role_top)){
		const	_aliasvalue = dkcobj_permanent.getValue(alias_key, null, true, null);
		if(apiutil.isSafeString(_aliasvalue) && apiutil.checkSimpleJSON(_aliasvalue)){
			const	aliasvalue = JSON.parse(_aliasvalue);
			if(apiutil.isNotEmptyArray(aliasvalue)){
				for(let cnt = 0; cnt < aliasvalue.length; ++cnt){
					// get alias roles and merge result object
					const	tmp_alias = aliasvalue[cnt];
					if(null !== tmp_alias && !apiutil.isSafeString(tmp_alias)){
						continue;
					}
					const	subresobj = rawGetRoleHostLists(dkcobj_permanent, tmp_alias, true, base_role_top);

					if(apiutil.isSafeEntity(subresobj)){
						resultobj.normal.hostnames	= apiutil.mergeArray(resultobj.normal.hostnames, subresobj.normal.hostnames);
						resultobj.normal.ips		= apiutil.mergeArray(resultobj.normal.ips, subresobj.normal.ips);
						resultobj.all.hostnames		= apiutil.mergeArray(resultobj.all.hostnames, subresobj.all.hostnames);
						resultobj.all.ips			= apiutil.mergeArray(resultobj.all.ips, subresobj.all.ips);

						let keyarr					= Object.keys(subresobj.detail.host);
						for(let cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
							resultobj.detail.host[keyarr[cnt2]] = subresobj.detail.host[keyarr[cnt2]];
						}
						keyarr						= Object.keys(subresobj.detail.ip);
						for(let cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
							resultobj.detail.ip[keyarr[cnt2]] = subresobj.detail.ip[keyarr[cnt2]];
						}
					}
				}
			}
		}
	}

	// get own hostnames and merge result object
	let subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(name_key, true));
	if(apiutil.isNotEmptyArray(subkeylist)){
		// get all details
		const detailarray = rawGetRoleHostListsEx(dkcobj_permanent, subkeylist, true);

		for(let cnt = 0; cnt < detailarray.length; ++cnt){
			resultobj.normal.hostnames.push(detailarray[cnt].host_normal);
			resultobj.all.hostnames.push(detailarray[cnt].host_all);
			resultobj.detail.host[detailarray[cnt].detail_key] = detailarray[cnt].detail;
		}
	}

	// get own ip addresses and merge result object
	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(ip_key, true));
	if(apiutil.isNotEmptyArray(subkeylist)){
		// get all details
		const detailarray = rawGetRoleHostListsEx(dkcobj_permanent, subkeylist, false);

		for(let cnt = 0; cnt < detailarray.length; ++cnt){
			resultobj.normal.ips.push(detailarray[cnt].host_normal);
			resultobj.all.ips.push(detailarray[cnt].host_all);
			resultobj.detail.ip[detailarray[cnt].detail_key] = detailarray[cnt].detail;
		}
	}

	// get from under sub roles
	if(is_expand){
		subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(role_key, true));
		for(let cnt = 0; cnt < subkeylist.length; ++cnt){
			// check reserved key name, it should be skipped
			if(	!apiutil.isSafeString(subkeylist[cnt])	||
				policies_key	=== subkeylist[cnt]		||
				reference_key	=== subkeylist[cnt]		||
				hosts_key		=== subkeylist[cnt]		||
				id_key			=== subkeylist[cnt]		||
				tokens_key		=== subkeylist[cnt]		||
				alias_key		=== subkeylist[cnt]		)
			{
				continue;
			}
			// get under roles and merge result object
			const subresobj				= rawGetRoleHostLists(dkcobj_permanent, subkeylist[cnt], true, base_role_top);

			if(apiutil.isSafeEntity(subresobj)){
				resultobj.normal.hostnames	= apiutil.mergeArray(resultobj.normal.hostnames, subresobj.normal.hostnames);
				resultobj.normal.ips		= apiutil.mergeArray(resultobj.normal.ips, subresobj.normal.ips);
				resultobj.all.hostnames		= apiutil.mergeArray(resultobj.all.hostnames, subresobj.all.hostnames);
				resultobj.all.ips			= apiutil.mergeArray(resultobj.all.ips, subresobj.all.ips);

				let keyarr					= Object.keys(subresobj.detail.host);
				for(let cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
					resultobj.detail.host[keyarr[cnt2]] = subresobj.detail.host[keyarr[cnt2]];
				}
				keyarr						= Object.keys(subresobj.detail.ip);
				for(let cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
					resultobj.detail.ip[keyarr[cnt2]] = subresobj.detail.ip[keyarr[cnt2]];
				}
			}
		}
	}
	return resultobj;
};

//---------------------------------------------------------
// find host raw function
//---------------------------------------------------------
// tenant			:	tenant name
// role				:	role name or full yrn role
// service			:	service name if role is not full yrn
// hostname			:	hostname string or array
// ip				:	ip address string or array
// port				:	port number(0 means any)
// cuk				:	container unique key(null(undefined) is any)
// is_strict		:	check for exact mate of parameters such as port/cuk
//
// return			:	null(not found) or found hostname(ip) following element array
//						resTypeFindHost = {
//							result:		true/false
//							message:	null or error message
//							host_info:	dkcTypeHostRawValueSet[] = [
//											dkcTypeHostRawValueSet = {
//												key:		hostname(ip) yrn path
//												hostname:	hostname string
//												ip:			ip address
//												port:		port
//												cuk:		cuk
//												extra:		extra
//												inboundip:	inbound ip address
//												outboundip:	outbound ip address
//												tag:		tag
//											},
//											...
//										]
//
// [NOTE]
// You can specify both hostname or ip.
// If port is any(0), this function check all port data in hostname/ip.
// If there is same hostname or ip with any port, it matches regardless of the value of port.
// If the service name is specified when role is not full yrn path,
// the host is added to tenant role under service.
// The service name can be allowed undefined and null.
//
const rawFindHost = (
	tenant?:	string | null,
	service?:	string | null,
	role?:		string | null,
	hostname?:	string | string[] | null,
	ip?:		string | string[] | null,
	port?:		number | null,
	cuk?:		string | null,
	is_strict?:	boolean | null
): resTypeFindHost => {

	const	resobj: resTypeFindHost	= {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(role)){						// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(hostname) && !apiutil.isNotEmptyArray(hostname) && !apiutil.isSafeString(ip) && !apiutil.isNotEmptyArray(ip)){
		resobj.result	= false;
		resobj.message	= 'both hostname and ip parameters are empty.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeNumber(port)){
		resobj.result	= false;
		resobj.message	= 'port(' + JSON.stringify(port) + ') parameter is wrong.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}
	if(!apiutil.isBoolean(is_strict)){
		is_strict		= false;
	}

	// check role name is only name or full yrn path
	const	keys		= getK2hr3Keys(null, tenant, service);
	role				= role.toLowerCase();
	let		roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= role.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(role.match(roleptn)){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') is not role yrn path)';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check service/tenant name
		if(tenant !== rolematches[2] || (null !== service && service !== rolematches[1]) || (null === service && apiutil.isSafeString(rolematches[1]))){
			resobj.result	= false;
			resobj.message	= 'role(' + role + ') yrn has service(' + rolematches[1] + ') and tenant(' + rolematches[2] + '), but it is not specified service(' + (null !== service ? service : 'null') + ') and tenant(' + tenant + ')';
			r3logger.elog(resobj.message);
			return resobj;
		}
		// role is set only role name
		role = rolematches[3];
	}

	//
	// keys
	//
	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	role_key	= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// find
	const	result		= rawFindRoleHost(dkcobj, role_key, hostname, ip, port, cuk, is_strict);
	if(!apiutil.isNotEmptyArray(result)){
		resobj.result	= false;
		resobj.message	= 'Not found any host by hostname(' + JSON.stringify(hostname) + ') and ip(' + JSON.stringify(ip) + ') and port(' + JSON.stringify(port) + ')';
	}else{
		resobj.host_info= result;
	}
	dkcobj.clean();
	return resobj;
};

//
// Utilities for hosts in role
//
// role_key			:	role key
// hostname			:	hostname string or array
// ip				:	ip address string or array
// port				:	port number(0, undefined, null means any)
// cuk				:	container unique key(undefined, null means any)
// is_strict		:	check for exact mate of parameters such as port/cuk
// base_role_top	:	The base_role_top is the top path of the roll path that started getting host list.
//						For example, if role_key is an alias for another role, base_role_top will indicate
//						a different top path.
//
// return			:	null(not found) or found hostname(ip) following element array
//						[
//							{
//								key:		hostname(ip) yrn path
//								hostname:	hostname string
//								ip:			ip address
//								port:		port
//								cuk:		container unique key
//								extra:		extra
//								tag:		tag
//								inboundip:	inbound ip address
//								outboundip:	outbound ip address
//							},
//							...
//						]
//
// [NOTE]
// You can specify both hostname or ip.
// If port is any(0), this function check all port data in hostname/ip.
// If there is same hostname or ip with any port, it matches regardless of the value of port.
//
const rawFindRoleHost = (
	dkcobj_permanent:	K2hdkc,
	role_key?:			string | null,
	hostname?:			string | string[] | null,
	ip?:				string | string[] | null,
	port?:				number | null,
	cuk?:				string | null,
	is_strict?:			boolean | null,
	base_role_top?:		string | null
): dkcTypeHostRawValueSet[] | null => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return null;
	}
	if(!apiutil.isSafeEntity(port)){
		port = 0;
	}else if(!apiutil.isSafeNumber(port)){
		r3logger.elog('port(' + JSON.stringify(port) + ') parameter is wrong.');
		return null;
	}
	if(!apiutil.isSafeString(cuk)){
		cuk = null;
	}
	if(!apiutil.isBoolean(is_strict)){
		is_strict = false;
	}

	let	_hostnames: string[]= [];
	let	_ips: string[]		= [];
	if(apiutil.isSafeString(hostname)){
		_hostnames = [hostname];
	}else if(apiutil.isStringArray(hostname)){
		_hostnames = hostname;
	}
	if(apiutil.isSafeString(ip)){
		_ips = [ip];
	}else if(apiutil.isStringArray(ip)){
		_ips = ip;
	}
	if(!apiutil.isNotEmptyArray(_hostnames) && !apiutil.isNotEmptyArray(_ips)){
		r3logger.elog('both hostname and ip parameters are empty.');
		return null;
	}

	// get tenant/service
	let		keys		= getK2hr3Keys();													// temporary for regex key(getting tenant/service)
	const	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= role_key.match(roleptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4){
		r3logger.elog('role parameter is not match role path : role=' + JSON.stringify(role_key));
		return null;
	}
	// reset keys with tenant and service
	keys				= getK2hr3Keys(null, rolematches[2], rolematches[1]);
	if(!apiutil.isSafeString(base_role_top)){
		base_role_top	= keys.ROLE_TOP_KEY;												// set base role top if it is not specified
	}

	// check role is under base role top
	//
	// [NOTE]
	// If role is included (alias) in other role under different service
	// and tenant, the host is not detected.
	//
	if(0 !== role_key.indexOf(base_role_top)){
		r3logger.dlog('hostname(' + JSON.stringify(hostname) + ') / ip(' + JSON.stringify(ip) + ') and port(' + String(port) + ') is not found in role(' + role_key + '), because role is not under base role key(' + base_role_top + ')');
		return null;
	}

	//
	// keys
	//
	const	policies_key	= role_key	+ '/' + keys.POLICIES_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	const	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	const	id_key			= role_key	+ '/' + keys.ID_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	const	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	const	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	const	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	const	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;							// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"
	const	alias_key		= role_key	+ '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"

	let		foud_hosts:dkcTypeHostRawValueSet[] = [];

	// check under hostname key
	if(apiutil.isNotEmptyArray(_hostnames)){
		const	subkeylist	= dkcobj_permanent.getSubkeys(name_key, true);
		const	tmp_result	= rawMatchHost(dkcobj_permanent, subkeylist, _hostnames, port, cuk, is_strict);
		if(null !== tmp_result && apiutil.isNotEmptyArray(tmp_result)){
			foud_hosts = foud_hosts.concat(tmp_result);
		}
	}
	// check under ip key
	if(apiutil.isNotEmptyArray(_ips)){
		const	subkeylist	= dkcobj_permanent.getSubkeys(ip_key, true);
		const	tmp_result	= rawMatchHost(dkcobj_permanent, subkeylist, _ips, port, cuk, is_strict);
		if(null !== tmp_result && apiutil.isNotEmptyArray(tmp_result)){
			foud_hosts = foud_hosts.concat(tmp_result);
		}
	}
	// check under sub roles
	const	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(role_key, true));
	for(let cnt = 0; cnt < subkeylist.length; ++cnt){
		// check reserved key name, it should be skipped
		if(	!apiutil.isSafeString(subkeylist[cnt])	||
			policies_key	=== subkeylist[cnt]		||
			reference_key	=== subkeylist[cnt]		||
			hosts_key		=== subkeylist[cnt]		||
			id_key			=== subkeylist[cnt]		||
			tokens_key		=== subkeylist[cnt]		||
			alias_key		=== subkeylist[cnt]		)
		{
			continue;
		}

		// reentrant
		const	tmp_result	= rawFindRoleHost(dkcobj_permanent, subkeylist[cnt], _hostnames, _ips, port, cuk, is_strict, base_role_top);
		if(null !== tmp_result && apiutil.isNotEmptyArray(tmp_result)){
			// found host in sub roles
			foud_hosts = foud_hosts.concat(tmp_result);
		}
	}

	if(!apiutil.isNotEmptyArray(foud_hosts)){
		r3logger.dlog('hostname(' + JSON.stringify(hostname) + ') / ip(' + JSON.stringify(ip) + ') and port(' + String(port) + ') and cuk(' + JSON.stringify(cuk) + ') is not found in role(' + role_key + ')');
		return null;
	}
	return foud_hosts;
};

//
// Utility for matching hostname(s) or ip and port in string array
//
// key_array	:	key string array, these keys are subkey list under hostname/ip key.
// target		:	hostname or ip address string, or array
// port			:	port number(0, undefined, null means any)
// cuk			:	container unique key(undefined, null means any)
// is_strict	:	check for exact mate of parameters such as port/cuk/extra
//
// return		:	null(not found) or found hostname(ip) following element array
//					dkcTypeHostRawValueSet[] = [
//						dkcTypeHostRawValueSet = {
//							key:		hostname(ip) yrn path
//							hostname:	hostname string
//							ip:			ip address
//							port:		port
//							cuk:		container unique key
//							extra:		extra
//							tag:		tag
//							inboundip:	inbound ip address
//							outboundip:	outbound ip address
//						},
//						...
//					]
//
// [NOTE]
// This function returns all matched hosts and it's information.
//
// If the strict flag is true, the port / cuk match is checked.
// The parameter cuk is checked for openstack or kubernetes.(it convert to extra value)
// If cuk is based on kubernetes, the value of the strict flag is ignored and strict
// checking is always performed.
//
const rawMatchHost = (
	dkcobj_permanent:	K2hdkc,
	key_array?:			string[] | null,
	target?:			string | string[] | null,
	port?:				number | null,
	cuk?:				string | null,
	is_strict?:			boolean | null
): dkcTypeHostRawValueSet[] | null => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.dlog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isNotEmptyArray(key_array)){
		r3logger.dlog('host key array is empty');
		return null;
	}
	if(!apiutil.isSafeString(target) && !apiutil.isNotEmptyArray(target)){
		r3logger.elog('target parameter is empty.');
		return null;
	}
	if(!apiutil.isArray(target) && apiutil.isSafeString(target)){
		target = [target];
	}
	if(!apiutil.isSafeEntity(port)){
		port = 0;
	}else if(!apiutil.isSafeNumber(port)){
		r3logger.elog('port(' + JSON.stringify(port) + ') parameter is wrong.');
		return null;
	}
	if(!apiutil.isSafeString(cuk)){
		cuk = null;
	}
	if(!apiutil.isBoolean(is_strict)){
		is_strict = false;
	}
	const	extra = rawGetExtraFromCuk(cuk);			// make extra from cuk automatically

	//
	// Keys
	//
	const	keys		= getK2hr3Keys();
	const	hostptn		= new RegExp('^' + keys.MATCH_ANY_HOSTNAME_PORT);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name/(.*) (.*) (.*)/
	const	ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);								// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/

	const	found_hosts: dkcTypeHostRawValueSet[] = [];
	for(let cnt = 0; cnt < key_array.length; ++cnt){
		if(!apiutil.isSafeString(key_array[cnt])){
			r3logger.wlog('host key array(' + JSON.stringify(key_array[cnt]) + ') in array is not safe string.');
			continue;
		}

		// get host information
		const	host_value_tmp	= dkcobj_permanent.getValue(key_array[cnt], null, true, null);
		const	host_value		= apiutil.parseJSON(host_value_tmp);
		if(!apiutil.isPlainObject(host_value)){
			r3logger.wlog('host key array(' + JSON.stringify(key_array[cnt]) + ') does not have value or it is not JSON value.');
			continue;
		}

		// parse hostname(ip) and port by yrn(check hostname and ip yrn paths)
		let		matches	= key_array[cnt].match(hostptn);
		if(!apiutil.isNotEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
			matches	= key_array[cnt].match(ipptn);
			if(!apiutil.isNotEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				r3logger.wlog('host key array(' + JSON.stringify(key_array[cnt]) + ') is not matched by \'^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/{name or ip}(.*) (.*) (.*)\'.');
				continue;
			}
		}

		// setup port value
		let	_port: number = 0;
		if(apiutil.isSafeNumeric(matches[5])){
			const	tmpPort = apiutil.cvtToNumber(matches[5]);
			if(apiutil.isSafeNumber(tmpPort)){
				_port = tmpPort;
			}
		}

		//
		// matches[4] ---> hostname or ip address
		// matches[5] ---> port number
		// matches[6] ---> container unique key
		//
		const	hostobj: dkcTypeHostRawValueSet = {
			key:		key_array[cnt],
			port:		_port,
			cuk:		(apiutil.isSafeString(matches[6])				? matches[6]			: null),
			extra:		(apiutil.isSafeString(host_value.extra)			? host_value.extra		: null),
			tag:		(apiutil.isSafeString(host_value.tag)			? host_value.tag		: null),
			hostname:	(apiutil.isSafeString(host_value.hostname)		? host_value.hostname	: null),
			ip:			(apiutil.isSafeString(host_value.ip)			? host_value.ip			: null),
			inboundip:	((apiutil.isSafeString(host_value.inboundip) && apiutil.isIpAddressString(host_value.inboundip)) ? host_value.inboundip : null),
			outboundip:	((apiutil.isSafeString(host_value.outboundip) && apiutil.isIpAddressString(host_value.outboundip)) ? host_value.outboundip : null)
		};

		// check in target
		const	host_or_ip	= apiutil.isSafeString(matches[4]) ? matches[4] : null;
		for(let cnt2 = 0; cnt2 < target.length; ++cnt2){
			if(target[cnt2] !== host_or_ip){
				continue;
			}
			if(is_strict || keys.VALUE_K8S_V1 == hostobj.extra || keys.VALUE_K8S_V1 == extra){
				// check strictly(if extra is kubernetes, always check strictly)
				if(port == hostobj.port && cuk == hostobj.cuk && extra == hostobj.extra){
					found_hosts.push(hostobj);					// add result
					break;
				}
			}else{
				// check no strictly
				if(	(port == hostobj.port	|| rawIsPortAny(port)	|| rawIsPortAny(hostobj.port))	&&
					(cuk == hostobj.cuk		|| null == cuk			|| null == hostobj.cuk)			&&
					(extra == hostobj.extra	|| null == extra		|| null == hostobj.extra)		)
				{
					found_hosts.push(hostobj);					// add result
					break;
				}
			}
		}
	}
	return (!apiutil.isNotEmptyArray(found_hosts) ? null : found_hosts);
};

//
// Small utility for checking port any
//
const rawIsPortAny = (port?: unknown): boolean => {

	if(apiutil.isString(port)){
		const	tmpStrPort	= port.trim();
		const 	keys		= getK2hr3Keys();
		if(keys.VALUE_ANY_PORT === tmpStrPort){
			return true;
		}else if(apiutil.isSafeNumeric(tmpStrPort)){
			const	tmpNumPort = apiutil.cvtToNumber(tmpStrPort);
			if(apiutil.isSafeNumber(tmpNumPort) && 0 !== tmpNumPort){
				return false;
			}
		}
	}else if(apiutil.isSafeNumber(port) && 0 !== port){
		return false;
	}
	return true;
};

const rawGetSafePortNumber = (port?: unknown): number => {

	let	resultPort = 0;
	if(apiutil.isString(port)){
		const	tmpStrPort	= port.trim();
		const 	keys		= getK2hr3Keys();
		if(keys.VALUE_ANY_PORT === tmpStrPort){
			resultPort = 0;
		}else if(apiutil.isSafeNumeric(tmpStrPort)){
			const	tmpNumPort = apiutil.cvtToNumber(tmpStrPort);
			if(apiutil.isSafeNumber(tmpNumPort)){
				resultPort = tmpNumPort;
			}
		}
	}else if(apiutil.isSafeNumber(port)){
		resultPort = port;
	}
	return resultPort;
};

//---------------------------------------------------------
// create resource raw function
//---------------------------------------------------------
//
// Common function for creating resource
//
// tenant				:	tenant name for resource
// service				:	service name
// resourcename			:	resource name
// res_type				:	resource data type(string or object)
//							if data is null or '', this value must be string.
// data					:	resource data which must be string or object
//							if data is null, it means not updating data.
//							if data is '', it means clearing resource's data.
// resource_keys		:	resource has keys(associative array)
//							if this is null, it means not updating keys.
//							if this is '' or array(0), it means clearing keys.
// alias_resources		:	resource has alias
//							if this is null, it means not updating alias.
//							if this is '' or array(0), it means clearing alias.
// expire				:	expire time
//							this value is set at service + tenant resource.
//							this value is integer and -1 means not expire.
//
// [NOTE]
// if parent resource key does not have this resource key, set resource key
// into parent's subkey
// if the service name is specified, create the resource keys under service
// and tenant. and do not create aliases(alias_resources must be empty).
//
const rawCreateResourceEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null,
	resourcename?:		string | null,
	res_type?:			string | null,
	data?:				valTypeAll,
	resource_keys?:		string | dkcTypeResourceRawKeysValue | null,
	alias_resources?:	string | string[] | null,
	expire?:			number | string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(resourcename)){		// allow other argument is empty
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', resourcename=' + JSON.stringify(resourcename));
		return false;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;														// clear
	}

	const	keys						= getK2hr3Keys(null, tenant, service);
	let		_data: string				= '';
	let		_expire: string				= '';
	let		_alias_resources: string[]	= [];
	let		is_data: boolean;
	let		is_alias: boolean;
	let		is_reskeys: boolean;
	let		is_expire: boolean;
	let		_res_type: string | null;

	// check type & data
	if(!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, res_type) && !apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, res_type)){
		r3logger.elog('res_type parameters are wrong : res_type=' + JSON.stringify(res_type));
		return false;
	}
	if(apiutil.compareCaseString(keys.VALUE_STRING_TYPE, res_type)){
		// type is string
		_res_type = keys.VALUE_STRING_TYPE;

		if(apiutil.isString(data)){
			if(apiutil.isSafeString(data)){
				is_data		= true;
				_data		= data;
			}else{	// '' === data
				is_data		= true;
			}
		}else if(!apiutil.isSafeEntity(data)){
			is_data		= false;
		}else if(apiutil.isSafeNumber(data)){										// case for JSON.parse returns not string
			is_data		= true;
			_data		= String(data);
		}else{
			r3logger.elog('parameter data is wrong : data=' + JSON.stringify(data));
			return false;
		}
	}else{
		// type is object
		_res_type = keys.VALUE_OBJECT_TYPE;

		if(null === data){
			is_data		= false;
		}else if('' === data){
			// this means the data is needed cleanup, then type must be string
			is_data		= true;
			_res_type	= keys.VALUE_STRING_TYPE;									// force string type
		}else if(apiutil.isSafeEntity(data)){
			// data must be encoded json
			is_data		= true;
			_data		= JSON.stringify(data);
		}else{
			r3logger.elog('parameter data is wrong : data=' + JSON.stringify(data));
			return false;
		}
	}

	let	_resource_keys: dkcTypeResourceRawKeysValue = {};
	if(!apiutil.isSafeEntity(resource_keys)){
		is_reskeys 		= false;
	}else if(apiutil.isPlainObject(resource_keys)){
		// keys is only object(not array)
		is_reskeys 		= true;
		_resource_keys	= resource_keys;
	}else if(apiutil.isString(resource_keys) && '' === resource_keys){
		is_reskeys		= true;
	}else{
		r3logger.elog('parameter resource_keys is wrong : resource_keys=' + JSON.stringify(resource_keys));
		return false;
	}

	if(apiutil.isSafeString(service)){
		// if the service is specified, alias must be empty.
		if(apiutil.isSafeEntity(alias_resources)){
			r3logger.elog('parameter alias_resources is not empty : alias_resources=' + JSON.stringify(alias_resources));
			return false;
		}
		is_alias = false;

		// expire
		if(!apiutil.isSafeEntity(expire)){
			is_expire	= false;

		}else if(apiutil.isSafeNumeric(expire)){
			const	tmpExp = apiutil.cvtToNumber(expire);
			if(!apiutil.isSafeNumber(tmpExp)){
				r3logger.elog('parameter expire is wrong : expire=' + JSON.stringify(expire));
				return false;
			}
			if(tmpExp <= 0){
				is_expire	= false;
			}else{
				is_expire	= true;
				_expire		= (new Date((apiutil.getUnixtime() + tmpExp) * 1000)).toISOString();	// expire date(UTC ISO 8601)
			}
		}else{
			r3logger.elog('parameter expire is wrong : expire=' + JSON.stringify(expire));
			return false;
		}
	}else{
		if(apiutil.isStringArray(alias_resources)){
			is_alias		= true;
			_alias_resources= alias_resources;
		}else if(apiutil.isString(alias_resources) && '' === alias_resources){
			is_alias		= true;
		}else if(null === alias_resources){
			is_alias		= false;
		}else{
			r3logger.elog('parameter alias_resources is wrong : alias_resources=' + JSON.stringify(alias_resources));
			return false;
		}
		// expire is not set
		is_expire	= false;
	}

	//
	// keys
	//
	const	resource_tmp	= ':' + resourcename;											// ":<resource>{/<resource>{...}}"
	const	resource_key	= keys.RESOURCE_TOP_KEY + resource_tmp;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
	const	type_key		= resource_key + '/' + keys.TYPE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type"
	const	reference_key	= resource_key + '/' + keys.REFERENCE_KW;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference"
	const	reskeys_key		= resource_key + '/' + keys.KEYS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys"
	const	alias_key		= resource_key + '/' + keys.ALIAS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@"
	const	expire_key		= resource_key + '/' + keys.EXPIRE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire"
	let		need_update		= false;

	// create resource key(with subkeys tree from resource top key)
	if(!rawCreateKeyTree(dkcobj_permanent, keys.RESOURCE_TOP_KEY, resource_tmp, false)){
		r3logger.elog('could not create resource key tree(' + resourcename + ') from resource top key(' + keys.RESOURCE_TOP_KEY + ')');
		return false;
	}

	// check type/reference/keys/alias key
	let	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(resource_key, true));
	if(apiutil.tryAddStringToArray(subkeylist, type_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, reference_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, reskeys_key)){
		need_update	= true;
	}
	if(is_alias && 0 < _alias_resources.length && apiutil.tryAddStringToArray(subkeylist, alias_key)){	// Make alias key in subkey list only when new alias exists
		need_update	= true;
	}
	if(is_expire && apiutil.tryAddStringToArray(subkeylist, expire_key)){					// Make expire key in subkey list only when new expire exists
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){							// add subkey yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/{type, reference, keys, @} -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
			r3logger.elog('could not add ' + resource_key + '/* subkeys under ' + resource_key + ' key');
			return false;
		}
	}

	// data
	if(is_data){
		if(!dkcobj_permanent.setValue(type_key, _res_type)){								// set value "type" -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type
			r3logger.elog('could not set ' + _res_type + ' value to ' + type_key + ' key');
			return false;
		}
		if(!dkcobj_permanent.setValue(resource_key, _data)){								// set value "data" -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
			r3logger.elog('could not set ' + _data + ' value to ' + resource_key + ' key');
			return false;
		}
	}

	// reference key
	const	value = dkcobj_permanent.casGet(reference_key);
	if(!apiutil.isSafeEntity(value)){
		if(!dkcobj_permanent.casInit(reference_key, 0)){									// initialize cas value -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference
			r3logger.elog('could not initialize reference value to ' + reference_key + ' key');
			return false;
		}
	}

	// resource_keys
	if(is_reskeys){
		if(!dkcobj_permanent.setValue(reskeys_key, JSON.stringify(_resource_keys))){		// update value keys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys
			r3logger.elog('could not set ' + JSON.stringify(_resource_keys) + ' value to ' + reskeys_key + ' key');
			return false;
		}
	}

	// aliases
	const	value_tmp		= dkcobj_permanent.getValue(alias_key, null, true, null);
	const	parsed_value	= apiutil.parseJSON(value_tmp);
	if(is_alias){
		if(0 === _alias_resources.length){
			if(null !== parsed_value){
				// if there is alias array, alias resource reference is needed to decrement
				if(apiutil.isNotEmptyArray(parsed_value)){
					for(let cnt = 0; cnt < parsed_value.length; ++cnt){
						const tmpval = parsed_value[cnt];
						if(null !== tmpval || !apiutil.isString(tmpval)){
							continue;
						}
						const tmpres = rawIncDecReferenceCount(dkcobj_permanent, tmpval, false);
						if(!tmpres.result){
							r3logger.wlog('Failed to decrement reference in policy(' + tmpval + ') included from resource(' + resource_key + '), but continue...');
						}
					}
				}
				// New aliases is empty, so we removed alias key
				if(!dkcobj_permanent.remove(alias_key, false)){								// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + resource_key + ' key');
					return false;
				}
			}
			// remove subkey(alias:@) in resource subkey list
			subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(resource_key, true));
			if(apiutil.removeStringFromArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){					// remove subkey yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@ -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + resource_key + ' key');
					return false;
				}
			}
		}else{
			// get removing element(alias resource) & decrement it's reference
			const	delarr = apiutil.getDeletingDifferenceArray(apiutil.getSafeStringArray(parsed_value), _alias_resources);
			for(let cnt = 0; cnt < delarr.length; ++cnt){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in resource(' + delarr[cnt] + ') included from resource(' + resource_key + '), but continue...');
				}
			}
			// set aliases value
			if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(_alias_resources))){	// update value alias -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
				r3logger.elog('could not set ' + JSON.stringify(_alias_resources) + ' value to ' + alias_key + ' key');
				return false;
			}
			// get adding element(alias resource) & increment it's reference
			const	addarr = apiutil.getAddingDifferenceArray(apiutil.getSafeStringArray(parsed_value), _alias_resources);
			for(let cnt = 0; cnt < addarr.length; ++cnt){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
				if(!tmpres.result){
					r3logger.wlog('Failed to increment reference in resource(' + addarr[cnt] + ') included from resource(' + resource_key + '), but continue...');
				}
			}
			// add subkey(alias:@) in resource subkey list
			subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(resource_key, true));
			if(apiutil.tryAddStringToArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){					// add subkey yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@ -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
					r3logger.elog('could not add ' + alias_key + ' subkey under ' + resource_key + ' key');
					return false;
				}
			}
		}
	}

	// expire
	if(is_expire){
		if(!dkcobj_permanent.setValue(expire_key, _expire)){								// update value keys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire
			r3logger.elog('could not set ' + JSON.stringify(expire_key) + ' value to ' + _expire);
			return false;
		}
	}
	return true;
};

//
// First raw function for creating resource
//
// user					:	user name for accessing resource
// tenant				:	tenant name for resource
// resourcename			:	resource name
//
// [NOTE]
// This function is for creating resource by user, and call common function for it.
//
const rawCreateResourceByUser = (
	user?:				string | null,
	tenant?:			string | null,
	resourcename?:		string | null,
	res_type?:			string | null,
	data?:				valTypeAll,
	resource_keys?:		string | dkcTypeResourceRawKeysValue | null,
	alias_resources?:	string | string[] | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(resourcename)){		// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', resourcename=' + JSON.stringify(resourcename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check user is tenant member
	//----------------------------------------------
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to access resourcename(' + resourcename + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	if(!rawCreateResourceEx(dkcobj, tenant, null, resourcename, res_type, data, resource_keys, alias_resources)){
		resobj.result	= false;
		resobj.message	= 'could not create resourcename(' + JSON.stringify(resourcename) + ') for tenant(' + tenant + '), user(' + user + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//
// First raw function for creating resource by role with k2hdkc
//
// role					:	role name or role yrn path for accessing resource
// tenant				:	tenant name for resource
// resourcename			:	resource name
//
// [NOTE]
// This function is for creating resource by role with k2hdkc, and call common function for it.
//
const rawCreateResourceByRoleWithDkc = (
	dkcobj_permanent:	K2hdkc,
	role?:				string | null,
	tenant?:			string | null,
	resourcename?:		string | null,
	res_type?:			string | null,
	data?:				valTypeAll,
	resource_keys?:		string | dkcTypeResourceRawKeysValue | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(resourcename)){	// other argument is checked in common function
		r3logger.elog('some parameters are wrong : role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant) + ', resourcename=' + JSON.stringify(resourcename));
		return false;
	}

	const	keys			= getK2hr3Keys(null, tenant);
	const	role_key		= keys.ROLE_TOP_KEY + ':' + role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	const	resource_key	= keys.RESOURCE_TOP_KEY + ':' + resourcename;					// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	const	roledata: dkcTypeRoleValue = {
		policies: []																		// policies = keys.VALUE_POLICIES_TYPE
	};

	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true) || !apiutil.isNotEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		r3logger.elog('could not get role(' + role + ') in tenant(' + tenant + ') policy data.');
		return false;
	}

	// check policies
	const	tmp_roledata = apiutil.getSafeStringArray(roledata[keys.VALUE_POLICIES_TYPE]);
	let		access_result: boolean | null = null;
	for(let cnt = 0; cnt < tmp_roledata.length; ++cnt){
		// check each policy has write access
		access_result = rawCheckPolicies(dkcobj_permanent, tmp_roledata[cnt], resource_key, keys.ACTION_WRITE_KEY, access_result);
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		r3logger.elog('role(' + role + ') in tenant(' + tenant + ') does not allow to write access to resourcename(' + resourcename + ').');
		return false;
	}

	// call common function(aliases can not be specified from role)
	return rawCreateResourceEx(dkcobj_permanent, tenant, null, resourcename, res_type, data, resource_keys, null);
};

//
// First raw function for creating resource by role
//
// role					:	role name for accessing resource
// tenant				:	tenant name for resource
// resourcename			:	resource name
//
// [NOTE]
// This function is for creating resource by role, and call common function for it.
//
const rawCreateResourceByRole = (
	role?:				string | null,
	tenant?:			string | null,
	resourcename?:		string | null,
	res_type?:			string | null,
	data?:				valTypeAll,
	resource_keys?:		string | dkcTypeResourceRawKeysValue | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(role)){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(role) + ') is wrong.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// parse role yrn to role name and tenant name
	const	keys		= getK2hr3Keys(null, tenant);
	const	roleyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= role.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(role) + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if('' !== apiutil.getSafeString(rolematches[1]) || tenant !== rolematches[2]){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(role) + ' is not target role which has tenant(' + JSON.stringify(tenant) + ') without service.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	//const	tenantname	= rolematches[2];
	const	rolename	= rolematches[3];

	// call common function
	const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);						// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(!rawCreateResourceByRoleWithDkc(dkcobj, rolename, tenant, resourcename, res_type, data, resource_keys)){
		resobj.result	= false;
		resobj.message	= 'could not create resource(' + JSON.stringify(resourcename) + ') for tenant(' + JSON.stringify(tenant) + '), role(' + JSON.stringify(rolename) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//
// First raw function for creating resource by ip address
//
// ip					:	ip address for accessing resource
// port					:	port for accessing resource
// cuk					:	container unique key(if null(undefined), cuk is any)
// roleyrn				:	role yrn for accessing resource
// tenant				:	tenant name for resource
// resourcename			:	resource name
//
// [NOTE]
// This function is for creating resource by ip address, and call common function for it.
//
const rawCreateResourceByIP = (
	ip?:				string | null,
	port?:				number | null,
	cuk?:				string | null,
	roleyrn?:			string | null,
	resourcename?:		string | null,
	res_type?:			string | null,
	data?:				valTypeAll,
	resource_keys?:		string | dkcTypeResourceRawKeysValue | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(ip) || !apiutil.isSafeString(roleyrn) || !apiutil.isSafeString(resourcename) || !apiutil.isSafeNumber(port)){	// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resourcename=' + JSON.stringify(resourcename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys();
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check ip:port is role member
	//----------------------------------------------
	// parse role yrn to role name and tenant name
	const	roleyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(roleyrn) + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	const	tenantname	= rolematches[2];
	const	rolename	= rolematches[3];

	// check host
	const	host_info = rawFindRoleHost(dkcobj, roleyrn, null, ip, port, cuk, false);		// not strictly check
	if(!apiutil.isNotEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + ip + ':' + String(port) + ') is not role(' + JSON.stringify(roleyrn) + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	if(!rawCreateResourceByRoleWithDkc(dkcobj, rolename, tenantname, resourcename, res_type, data, resource_keys)){
		resobj.result	= false;
		resobj.message	= 'could not create resource(' + JSON.stringify(resourcename) + ') for tenant(' + JSON.stringify(tenantname) + '), role(' + JSON.stringify(rolename) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//
// First raw function for creating resource
//
// tenant				:	tenant name for resource
// service				:	service name
// resource_objs		:	result of verify url(or static data), see following:
//
//	dkcTypeResourceRawValue[] = [	:	resource array, if one element, allows only it as object.
//		dkcTypeResourceRawValue = {
//			name					:	resource name which is key name(path) for resource
//			expire					:	undefined/null or integer
//			type					:	resource data type(string or object), default is string.
//			data					:	resource data which must be string or object or null/undefined(type is string).
//									:	resource has keys(associative array), or null/undefined.
//			keys = dkcTypeResourceRawKeysValue {
//				'foo':	bar,		:		any value is allowed
//				...					:
//			}						:
//		},
//		...
//	]
//
// Result				:	resource key array which are set, or null when error.
//
const rawCreateServiceTenantResource = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null,
	resource_objs?:		dkcTypeResourceRawValue | dkcTypeResourceRawValue[] | null
): string[] | null => {

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(service)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return null;
	}
	if(!apiutil.isSafeEntity(resource_objs)){
		resource_objs = [];
	}else if(!apiutil.isArray(resource_objs)){
		resource_objs = [resource_objs];									// object to one array member
	}
	if(!apiutil.isNotEmptyArray(resource_objs)){
		r3logger.elog('parameter is wrong : resource_objs=' + JSON.stringify(resource_objs));
		return null;
	}

	// keys
	const	keys		= getK2hr3Keys(null, tenant, service);

	// set each resource
	const	reskeys: string[]							= [];
	let		resource_keys: dkcTypeResourceRawKeysValue	= {};
	for(let cnt = 0; cnt < resource_objs.length; ++cnt){
		const	tmp_resource_objs: dkcTypeResourceRawValue = resource_objs[cnt];

		if(!apiutil.isSafeEntity(tmp_resource_objs)){
			r3logger.elog('resource object[' + String(cnt) + '] is not safe object(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
			continue;
		}
		// resource name
		const	resourcename = tmp_resource_objs[keys.ACR_RESOURCE_NAME_KEY];
		if(!apiutil.isSafeString(resourcename)){
			r3logger.elog('resource object[' + String(cnt) + '] does not have resource name(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
			continue;
		}

		// expire
		let		expire: number | null = null;
		if(apiutil.isSafeEntity(tmp_resource_objs[keys.ACR_RESOURCE_EXPIRE_KEY])){
			const   tmpExp = apiutil.cvtToNumber(tmp_resource_objs[keys.ACR_RESOURCE_EXPIRE_KEY]);
			if(!apiutil.isSafeNumber(tmpExp)){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong expire(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
				continue;
			}
			if(0 < tmpExp){
				expire = tmpExp;
			}
		}

		// type
		let		res_type: string;
		const	tmpResType = tmp_resource_objs[keys.ACR_RESOURCE_TYPE_KEY];
		if(!apiutil.isSafeString(tmpResType)){
			res_type	= keys.VALUE_STRING_TYPE;
		}else if(apiutil.compareCaseString(keys.VALUE_STRING_TYPE, tmpResType)){
			res_type	= keys.VALUE_STRING_TYPE;
		}else if(apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, tmpResType)){
			res_type	= keys.VALUE_OBJECT_TYPE;
		}else{
			r3logger.elog('resource object[' + String(cnt) + '] has wrong type(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
			continue;
		}

		// data
		let		data: valTypeAll;
		const	tmpDataType = tmp_resource_objs[keys.ACR_RESOURCE_DATA_KEY];
		if(apiutil.isSafeString(tmpDataType)){
			if(res_type !== keys.VALUE_STRING_TYPE){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong type against data type(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
				continue;
			}
			data = tmpDataType;

		}else if(apiutil.isSafeEntity(tmpDataType)){
			if(res_type === keys.VALUE_STRING_TYPE){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong type against data type(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
				continue;
			}
			// check JSON
			if(apiutil.isString(tmpDataType) && apiutil.checkSimpleJSON(tmpDataType)){
				data	= JSON.parse(tmpDataType);
			}else{
				data	= tmpDataType;
			}
		}else{
			if(res_type === keys.VALUE_STRING_TYPE){
				data	= '';
			}else{
				data	= null;
			}
		}

		// keys
		const	tmpResKeysKey = tmp_resource_objs[keys.ACR_RESOURCE_KEYS_KEY];
		if(!apiutil.isSafeEntity(tmpResKeysKey)){
			resource_keys = {};
		}else{
			if(apiutil.isSafeString(tmpResKeysKey)){
				// if keys is string, it must be JSON
				if(!apiutil.checkSimpleJSON(tmpResKeysKey)){
					r3logger.elog('resource object[' + String(cnt) + '] has wrong resource keys(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
					continue;
				}
				const tmp_res_keys	= JSON.parse(tmpResKeysKey);
				if(!rawIsDkcTypeResourceRawKeysValue(tmp_res_keys)){
					r3logger.elog('resource object[' + String(cnt) + '] has wrong resource keys(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
					continue;
				}
				resource_keys	= tmp_res_keys;
			}else if(rawIsDkcTypeResourceRawKeysValue(tmpResKeysKey)){
				resource_keys	= tmpResKeysKey;
			}
			if(!apiutil.isSafeEntity(resource_keys)){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong resource keys(' + JSON.stringify(tmp_resource_objs) + '), but continue...');
				continue;
			}
		}

		//
		// Set one resource
		//
		if(!rawCreateResourceEx(dkcobj_permanent, tenant, service, resourcename, res_type, data, resource_keys, null, expire)){
			r3logger.elog('could not create resource(' + JSON.stringify(resourcename) + ') for tenant(' + tenant + '), service(' + service + ')');
			return null;
		}

		// add resource key yrn path
		reskeys.push(keys.RESOURCE_TOP_KEY + ':' + resourcename);
	}
	return reskeys;
};

//---------------------------------------------------------
// Common get resource raw function
//---------------------------------------------------------
//
// Utility function:	This function is reentrant
//
//	resdata:			Must be object
//						dkcTypeResourceRawDataValue = {
//							string:		"string",
//							object:		object
//							keys:		object
//							expire:		number			---> null when expire
//							aliases:	array			---> only is_expand is false
//						}
//
const rawGetResourcesEx = (
	dkcobj_permanent:	K2hdkc,
	resource_key?:		string | null,
	resdata?:			dkcTypeResourceRawDataValue | null,
	is_expand?:			boolean | null,
	is_parent?:			boolean | null,
	checked_resources?:	string[] | null,
	base_resource_top?:	string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(resource_key)){
		r3logger.elog('some parameters are wrong : resource_key=' + JSON.stringify(resource_key));
		return false;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand = true;
	}
	if(!apiutil.isBoolean(is_parent)){
		is_parent = true;
	}
	if(!apiutil.isArray(checked_resources)){
		checked_resources = [];
	}
	if(apiutil.findStringInArray(checked_resources, resource_key)){
		r3logger.wlog('resource(' + resource_key + ') already checked, then this resource is included from another resource. Thus skip this for escaping blocking.');
		return true;
	}else{
		checked_resources.push(resource_key);
	}

	//
	// keys
	//
	const	keys			= rawGetKeysFromResourceKey(null, resource_key);	// create keys from resource key
	const	parent_key		= apiutil.getParentPath(resource_key);				// parent resource key
	const	type_key		= resource_key + '/' + keys.TYPE_KW;				// type
	//const	reference_key	= resource_key + '/' + keys.REFERENCE_KW;
	const	reskeys_key		= resource_key + '/' + keys.KEYS_KW;				// keys
	const	alias_key		= resource_key + '/' + keys.ALIAS_KW;				// aliases
	const	expire_key		= resource_key + '/' + keys.EXPIRE_KW;				// expire

	if(!apiutil.isSafeString(base_resource_top)){
		base_resource_top	= keys.RESOURCE_TOP_KEY;							// resource top key
	}

	// check resdata
	if(	!apiutil.isSafeEntity(resdata)					||
		undefined === resdata[keys.VALUE_STRING_TYPE]	||
		undefined === resdata[keys.VALUE_OBJECT_TYPE]	||
		undefined === resdata[keys.VALUE_KEYS_TYPE]		||
		undefined === resdata[keys.VALUE_EXPIRE_TYPE]	||
		(!apiutil.isBoolean(is_expand) || (apiutil.isBoolean(is_expand) && !is_expand && undefined === resdata[keys.VALUE_ALIAS_TYPE])) )	// only not expand
	{
		r3logger.elog('resdata parameter is wrong : resdata=' + JSON.stringify(resdata));
		return false;
	}
	const tmp_resdata = resdata;

	// check expire
	//
	// [NOTE]
	// The resource under service + tenant has expire key/value, then we need to check it.
	//
	// [TODO]
	// Now we only check expire date, not update expire and new resource data from verify
	// url. Thus we need to create a logic for update.
	//
	const	value = dkcobj_permanent.getValue(expire_key, null, true, null);
	if(apiutil.isSafeString(value)){
		if(apiutil.isExpired(value)){
			r3logger.dlog('resource(' + JSON.stringify(resource_key) + ') is expired : expire=' + JSON.stringify(value));
			return false;
		}
		tmp_resdata[keys.VALUE_EXPIRE_TYPE] = value;
	}

	// check parent
	if(is_parent){
		if(apiutil.isSafeString(base_resource_top) && apiutil.isSafeString(parent_key) && 0 === resource_key.indexOf(base_resource_top) && keys.RESOURCE_TOP_KEY != parent_key){
			// get parent data when resource key is under base resource top key.
			if(!rawGetResourcesEx(dkcobj_permanent, parent_key, tmp_resdata, is_expand, is_parent, checked_resources, base_resource_top)){
				return false;
			}
		}
	}

	// check resource under aliases
	const	value_raw_aliases = dkcobj_permanent.getValue(alias_key, null, true, null);
	if(is_expand){
		if(apiutil.isString(value_raw_aliases) && apiutil.checkSimpleJSON(value_raw_aliases)){
			const	value_aleases = JSON.parse(value_raw_aliases);
			if(apiutil.isNotEmptyArray(value_aleases)){
				for(let cnt = 0; cnt < value_aleases.length; ++cnt){
					// get alias resources(aliases always does not check parent)
					const	val_alias = value_aleases[cnt];
					if(null !== val_alias && !apiutil.isString(val_alias)){
						return false;
					}
					if(!rawGetResourcesEx(dkcobj_permanent, val_alias, tmp_resdata, is_expand, false, checked_resources, base_resource_top)){
						return false;
					}
				}
			}
		}
	}else{
		let	value_aleases: string[] = [];
		if(apiutil.isString(value_raw_aliases) && apiutil.checkSimpleJSON(value_raw_aliases)){
			value_aleases = JSON.parse(value_raw_aliases);
		}
		tmp_resdata[keys.VALUE_ALIAS_TYPE] = value_aleases;
	}

	// get resource keys
	const	value_raw_res	= dkcobj_permanent.getValue(reskeys_key, null, true, null);
	const	value_res		= apiutil.parseJSON(value_raw_res);
	if(rawIsDkcTypeResourceRawKeysValue(value_res)){
		// [NOTE]
		// key's value is object(keyname-value), and we set these as following two key name into tmp_resdata[keys.VALUE_KEYS_TYPE].
		// Then these objects is used by template engine.
		//	{
		//		'keyname':								'value'
		//		'resource YRN full path' + 'key name':	'value'
		//	}
		//

		// build full yrn path key and value
		const	fullkeyvalue: dkcTypeResourceRawKeysValue = {};
		for(const keyname in value_res){
			const	fullkeyname			= reskeys_key + '/' + keyname;
			fullkeyvalue[fullkeyname]	= value_res[keyname];				// if value[keyname] is array or object, this value is reference.
		}

		// merge value and full yrn path key object
		const	tmp_value_res = rawMergeDkcTypeResourceRawKeysValue(value_res, fullkeyvalue);

		// this resource has keys value, thus keys is merged to return value
		const	tmpResKeysType	= tmp_resdata[keys.VALUE_KEYS_TYPE];
		if(apiutil.isPlainObject(tmpResKeysType)){
			tmp_resdata[keys.VALUE_KEYS_TYPE] = rawMergeDkcTypeResourceRawKeysValue(tmpResKeysType, tmp_value_res);
		}else{
			tmp_resdata[keys.VALUE_KEYS_TYPE] = tmp_value_res;
		}
	}

	// get value type for this resource
	const	value_type = dkcobj_permanent.getValue(type_key, null, true, null);
	if(!apiutil.isSafeString(value_type) || (!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, value_type) && !apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, value_type))){
		r3logger.elog('resource(' + resource_key + ') has unknown data type: type=' + JSON.stringify(value_type));
		return false;
	}
	let	is_data_string	= false;
	if(apiutil.compareCaseString(keys.VALUE_STRING_TYPE, value_type)){
		is_data_string	= true;
	}

	// get value for this resource
	const	value_raw_keys = dkcobj_permanent.getValue(resource_key, null, true, null);
	if(apiutil.isSafeEntity(value_raw_keys)){
		// has resource data
		if(is_data_string){
			// data type is string, so we add string to the already set character string.
			//
			// [NOTE]
			// Do not care for last character is CR/LF/etc.
			// If you need CR for each resource, you must set CR to each resource's last word.
			//
			tmp_resdata[keys.VALUE_STRING_TYPE]	= apiutil.getSafeString(tmp_resdata[keys.VALUE_STRING_TYPE]);
			tmp_resdata[keys.VALUE_STRING_TYPE]	+= value_raw_keys;
		}else{
			// data type is object, so we merge object as over writing
			//
			const	value_obj		= apiutil.parseJSON(value_raw_keys);
			const	tmp_resObjType	= tmp_resdata[keys.VALUE_OBJECT_TYPE];
			if(apiutil.isValTypeAllObject(value_obj)){
				if(apiutil.isValTypeAllObject(tmp_resObjType)){
					tmp_resdata[keys.VALUE_OBJECT_TYPE] = apiutil.mergeValTypeAllObject(tmp_resObjType, value_obj);
				}else{
					tmp_resdata[keys.VALUE_OBJECT_TYPE] = value_obj;
				}
			}else if(apiutil.isArray(value_obj)){
				if(apiutil.isArray(tmp_resObjType)){
					const	tmp_result	= tmp_resObjType.slice();
					const	tmp_seen	= new Set(tmp_result);
					for(const one_value of value_obj){
						if(!tmp_seen.has(one_value)){
							tmp_seen.add(one_value);
							tmp_result.push(one_value);
						}
					}
					tmp_resdata[keys.VALUE_OBJECT_TYPE] = tmp_result;
				}else{
					tmp_resdata[keys.VALUE_OBJECT_TYPE] = value_obj;
				}
			}else{
				// value is unknown --> skip
			}
		}
	}else{
		// does not have resource data --> nothing to add
	}
	return true;
};

//
// Utility common function
//
// Get all resource data from resource or only this resource data.
//
//	tenant			:	tenant name referring to this resource. this must be specified.
//	service			:	service name
//	resource_key	:	resource key to be referred to
//	is_expand		:	Specify true when expanding resources to be expanded.
//
//	return object	:
//		resTypeGetResource = {
//			"result":	true or false
//			"message":	error message
//			"resource":	dkcTypeResourceRawDataValue = {
//							string:		"string",
//							object:		object
//							keys:		object
//							expire:		"string"			<--- or null
//							aliases:	array				<--- only not expand
//						}
//		}
//
// [NOTE]
// If is_expand is true, this function expands the resource using the template engine.
// If there is a problem with the variable referenced by the template string, this expanding fails.
//
const rawGetResourceEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:				string | null,
	service?:			string | null,
	resource_key?:		string | null,
	is_expand?:			boolean | null
): resTypeGetResource => {

	const	resobj: resTypeGetResource = {result: true, message: null};

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(resource_key)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', resource_key=' + JSON.stringify(resource_key);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand	= true;															// default all expand
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	// get resource
	const	keys		= getK2hr3Keys(null, tenant, service);
	const	resdata: dkcTypeResourceRawDataValue = {
		[keys.VALUE_STRING_TYPE]:	null,
		[keys.VALUE_OBJECT_TYPE]:	null,
		[keys.VALUE_KEYS_TYPE]:		null,
		[keys.VALUE_EXPIRE_TYPE]:	null,
		[keys.VALUE_ALIAS_TYPE]:	(!is_expand ? null : undefined)
	};

	// get resource data
	//
	// [NOTE]
	// If not expand, it means getting only this resource. Then we do not check parent.
	// (So that, is_parent parameter is as same as is_expand value.)
	//
	if(!rawGetResourcesEx(dkcobj_permanent, resource_key, resdata, is_expand, (is_expand ? true : false))){
		resobj.result	= false;
		resobj.message	= 'Could not get resource data for resource yrn: ' + resource_key;
		r3logger.elog(resobj.message);
		return resobj;
	}

	//
	// Expand string resource data
	//
	// [NOTE]
	// If need to expand resource data, here we execute template engine with resource string.
	//
	const	tmpResStrType	= resdata[keys.VALUE_STRING_TYPE];
	if(is_expand && apiutil.isSafeString(tmpResStrType)){
		// load template engine
		const	r3templ = new r3template();

		// load resource string to template engine
		if(!r3templ.load(tmpResStrType)){
			if(!r3templ.parseEngineType(tmpResStrType)){
				resobj.message	= 'The resource requires another template engine, but now we do not support another.';
			}else{
				resobj.message	= 'Could not load resource for template engine: ' + JSON.stringify(tmpResStrType);
			}
			resobj.result		= false;
			r3logger.elog(resobj.message);
			return resobj;
		}

		// get all variable names specified in resource string
		const	templvararr = (r3templ.getVariableNames() ?? [] as string[]);

		// check variable names whichever is yrn path
		//
		// [NOTE]
		// If variable is yrn path(resource or role), we get the value for it here,
		// and set it to resdata.
		// These variables(and values) is used by executing template engine.
		//
		const	ptnResData		= new RegExp('^' + keys.MATCH_ANY_TENANT_RES_DATA);	// regex pattern: yrn:yahoo:(.*)::(.*):resource:(.*)
		const	ptnNotResData	= new RegExp(keys.MATCH_NOT_TENANT_RES_DATA);		//                ( |\t|\r|\n|:) for not match resource data key name
		const	ptnResKey		= new RegExp('^' + keys.MATCH_ANY_TENANT_RES_KEY);	//				  yrn:yahoo:(.*)::(.*):resource:(.*)/keys/(.*)
		const	ptnHostNames	= new RegExp('^' + keys.MATCH_ANY_HOSTNAME_KEYS);	//				  yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name
		const	ptnIps			= new RegExp('^' + keys.MATCH_ANY_IP_KEYS);			//				  yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip
		const	ptnAllhost		= new RegExp('^' + keys.MATCH_ANY_ALLHOST_KEYS);	//				  yrn:yahoo:(.*)::(.*):role:(.*)/hosts/all

		for(let cnt = 0; cnt < templvararr.length; ++cnt){
			if(!apiutil.isSafeString(templvararr[cnt])){
				// something wrong, skip this.
				continue;
			}
			const	tmpCurTemplVal	= templvararr[cnt];
			let		tmpResKeysType	= resdata[keys.VALUE_KEYS_TYPE];
			if(rawIsDkcTypeResourceRawKeysValue(tmpResKeysType) && apiutil.isSafeEntity(tmpResKeysType[tmpCurTemplVal])){
				// already has variable, skip this.
				continue;
			}

			let	matches = tmpCurTemplVal.match(ptnResKey);
			if(null !== matches && apiutil.isNotEmptyArray(matches) && 5 <= matches.length){
				//
				// variable is resource key
				//
				const	variable_keys	= getK2hr3Keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
				const	var_resource_key= variable_keys.RESOURCE_TOP_KEY + ':' + matches[3];						// for target resource yrn path

				// get resource without expanding (because it is dead loop with expanding)
				const	varresdata = rawGetResourceEx(dkcobj_permanent, tenant, service, var_resource_key, false);	// must not expand
				if(!varresdata.result || !rawIsDkcTypeResourceRawKeysValue(varresdata.resource)){
					r3logger.dlog('resource path(' + JSON.stringify(tmpCurTemplVal) + ') is empty.');
				}else{
					const tmp_resource = varresdata.resource[keys.VALUE_KEYS_TYPE];
					if(!rawIsDkcTypeResourceRawKeysValue(tmp_resource)){
						r3logger.dlog('resource path(' + JSON.stringify(tmpCurTemplVal) + ') is empty.');
					}else{
						if(!rawIsDkcTypeResourceRawKeysValue(tmpResKeysType)){
							tmpResKeysType = {} as dkcTypeResourceRawKeysValue;
						}
						// merge keys
						resdata[keys.VALUE_KEYS_TYPE] = rawMergeDkcTypeResourceRawKeysValue(tmpResKeysType, tmp_resource);
					}
				}

			}else if(null != (matches = tmpCurTemplVal.match(ptnResData)) && apiutil.isNotEmptyArray(matches) && 4 <= matches.length && null === matches[3].match(ptnNotResData)){
				//
				// variable is resource data
				//
				const	variable_keys	= getK2hr3Keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
				const	var_resource_key= variable_keys.RESOURCE_TOP_KEY + ':' + matches[3];						// for target resource yrn path

				// get resource without expanding (because it is dead loop with expanding)
				//
				// [NOTE][TODO]
				// Do not expand another resource data here now, because we do not support loops that
				// contain the same resource path.
				//
				const	varresdata = rawGetResourceEx(dkcobj_permanent, tenant, service, var_resource_key, false);	// must not expand now
				if(!varresdata.result){
					r3logger.dlog('resource path(' + JSON.stringify(tmpCurTemplVal) + ') is empty.');
				}else if(!apiutil.isSafeEntity(varresdata.resource)){
					r3logger.dlog('resource path(' + JSON.stringify(tmpCurTemplVal) + ') result resource data is empty.');
				}else{
					// merge keys(not merge expire)
					const	tmp_resObjType	= varresdata.resource[keys.VALUE_OBJECT_TYPE];
					const	tmp_resStrType	= varresdata.resource[keys.VALUE_STRING_TYPE];
					if(apiutil.isSafeEntity(tmp_resObjType)){
						if(!apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE])){
							resdata[keys.VALUE_KEYS_TYPE] = {} as dkcTypeResourceRawKeysValue;
						}
						(resdata[keys.VALUE_KEYS_TYPE] as dkcTypeResourceRawKeysValue)[tmpCurTemplVal] = tmp_resObjType;
					}else if(apiutil.isSafeEntity(tmp_resStrType)){
						if(!apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE])){
							resdata[keys.VALUE_KEYS_TYPE] = {} as dkcTypeResourceRawKeysValue;
						}
						(resdata[keys.VALUE_KEYS_TYPE] as dkcTypeResourceRawKeysValue)[tmpCurTemplVal] = tmp_resStrType;
					}else{
						r3logger.dlog('resource path(' + JSON.stringify(tmpCurTemplVal) + ') does not have string and object.');
					}
				}

			}else if(null != (matches = tmpCurTemplVal.match(ptnHostNames)) && apiutil.isNotEmptyArray(matches) && 4 <= matches.length){
				//
				// variable is hostnames in role
				//
				if(tenant !== matches[2] || (null !== service && service !== matches[1]) || (null === service && apiutil.isSafeString(matches[1]))){
					// service/tenant name is not matched.
					r3logger.dlog('hostname path(' + JSON.stringify(tmpCurTemplVal) + ') is not allowed to access by tenant(' + JSON.stringify(tenant) + '), service(' + (null === service ? 'null' : service) + ').');
				}else{
					// get matched role's hostnames
					const	variable_keys	= getK2hr3Keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
					const	var_role_key	= variable_keys.ROLE_TOP_KEY + ':' + matches[3];
					const	var_host_res	= rawGetRoleHostLists(dkcobj_permanent, var_role_key, true);

					if(apiutil.isSafeEntity(var_host_res) && apiutil.isSafeEntity(var_host_res.detail) && apiutil.isSafeEntity(var_host_res.detail.host)){
						// set normalization hostnames array to resdata[keys.VALUE_KEYS_TYPE]
						if(!apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE])){
							resdata[keys.VALUE_KEYS_TYPE] = {} as dkcTypeResourceRawKeysValue;
						}
						(resdata[keys.VALUE_KEYS_TYPE] as dkcTypeResourceRawKeysValue)[tmpCurTemplVal] = cvtToDkcTypeResourceRawDataValue(var_host_res.detail.host);
					}
				}

			}else if(null != (matches = tmpCurTemplVal.match(ptnIps)) && apiutil.isNotEmptyArray(matches) && 4 <= matches.length){
				//
				// variable is ip address in role
				//
				if(tenant !== matches[2] || (null !== service && service !== matches[1]) || (null === service && apiutil.isSafeString(matches[1]))){
					// service/tenant name is not matched.
					r3logger.dlog('hostname path(' + JSON.stringify(tmpCurTemplVal) + ') is not allowed to access by tenant(' + JSON.stringify(tenant) + '), service(' + (null === service ? 'null' : service) + ').');
				}else{
					// get matched role's ip addresses
					const	variable_keys	= getK2hr3Keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
					const	var_role_key	= variable_keys.ROLE_TOP_KEY + ':' + matches[3];
					const	var_host_res	= rawGetRoleHostLists(dkcobj_permanent, var_role_key, true);

					if(apiutil.isSafeEntity(var_host_res) && apiutil.isSafeEntity(var_host_res.detail) && apiutil.isSafeEntity(var_host_res.detail.ip)){
						// set normalization ip address array to resdata[keys.VALUE_KEYS_TYPE]
						if(!apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE])){
							resdata[keys.VALUE_KEYS_TYPE] = {} as dkcTypeResourceRawKeysValue;
						}
						(resdata[keys.VALUE_KEYS_TYPE] as dkcTypeResourceRawKeysValue)[tmpCurTemplVal] = cvtToDkcTypeResourceRawDataValue(var_host_res.detail.ip);
					}
				}

			}else if(null != (matches = tmpCurTemplVal.match(ptnAllhost)) && apiutil.isNotEmptyArray(matches) && 4 <= matches.length){
				//
				// variable is all host(hostname and ip address) in role
				//
				if(tenant !== matches[2] || (null !== service && service !== matches[1]) || (null === service && apiutil.isSafeString(matches[1]))){
					// service/tenant name is not matched.
					r3logger.dlog('hostname path(' + JSON.stringify(tmpCurTemplVal) + ') is not allowed to access by tenant(' + JSON.stringify(tenant) + '), service(' + (null === service ? 'null' : service) + ').');
				}else{
					// get matched role's hostname and ip addresses
					const	variable_keys	= getK2hr3Keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
					const	var_role_key	= variable_keys.ROLE_TOP_KEY + ':' + matches[3];
					const	var_host_res	= rawGetRoleHostLists(dkcobj_permanent, var_role_key, true);

					if(apiutil.isSafeEntity(var_host_res) && apiutil.isSafeEntity(var_host_res.detail) && apiutil.isSafeEntity(var_host_res.detail.ip)){
						// merge object(merge hostname into ip address object)
						const	keyarr			= Object.keys(var_host_res.detail.host);
						for(let cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
							var_host_res.detail.ip[keyarr[cnt2]] = var_host_res.detail.host[keyarr[cnt2]];
						}
						// set normalization ip address array to resdata[keys.VALUE_KEYS_TYPE]
						if(!apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE])){
							resdata[keys.VALUE_KEYS_TYPE] = {} as dkcTypeResourceRawKeysValue;
						}
						(resdata[keys.VALUE_KEYS_TYPE] as dkcTypeResourceRawKeysValue)[tmpCurTemplVal] = cvtToDkcTypeResourceRawDataValue(var_host_res.detail.ip);
					}
				}
			}else{
				// variable name does not match yrn full path patterns, then this variable is not set to resdata[keys.VALUE_KEYS_TYPE].
			}
		}

		// execute template engine with resource string and variables
		const	tmpResKeys	= resdata[keys.VALUE_KEYS_TYPE];
		if(!isValTypeTemplateVariablesMap(tmpResKeys)){
			resobj.result	= false;
			resobj.message	= 'failed to expand ' + JSON.stringify(resource_key) + ' and to execute template engine. there is something wrong in template string : ' + JSON.stringify(tmpResStrType);
			r3logger.elog(resobj.message);
			return resobj;
		}
		const	templres	= r3templ.execute(tmpResKeys);
		if(!isK2hr3TemplateResult(templres) || templres.isFailure()){
			// something wrong when executing template engine.
			resobj.result	= false;
			resobj.message	= 'failed to expand ' + JSON.stringify(resource_key) + ' and to execute template engine. there is something wrong in template string : ' + JSON.stringify(tmpResStrType);
			r3logger.elog(resobj.message);
			return resobj;
		}
		// set expanded string (which is the result of executing template engine)
		resdata[keys.VALUE_STRING_TYPE] = templres.getString();
	}

	resobj.resource	= resdata;
	r3logger.dlog('Get resource(' + JSON.stringify(resource_key) + ') = ' + JSON.stringify(resdata));

	return resobj;
};

//
// First raw function for getting resource by user
//
// user					:	user name for accessing resource
// tenantname			:	tenant name for resource
// servicename			:	service name
// resyrn				:	resource name or yrn path
//
// [NOTE]
// This function is for getting resource by user, and call common function for it.
//
const rawGetResourceByUser = (
	user?:			string | null,
	tenantname?:	string | null,
	servicename?:	string | null,
	resyrn?:		string | null,
	is_expand?:		boolean | null
): resTypeGetResource => {

	let	resobj: resTypeGetResource = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenantname) || !apiutil.isSafeString(resyrn)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenantname=' + JSON.stringify(tenantname) + ', resyrn=' + JSON.stringify(resyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(servicename)){
		servicename		= servicename.toLowerCase();
	}else{
		servicename		= null;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand	= true;																// default all expand
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check user is tenant member
	//----------------------------------------------
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenantname)){
		resobj.result	= false;
		resobj.message	= 'user(' + JSON.stringify(user) + ') is not tenantname(' + JSON.stringify(tenantname) + ') member, then could not allow to access resource(' + JSON.stringify(resyrn) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Keys
	//
	const	keys			= getK2hr3Keys(user, tenantname, servicename);

	//----------------------------------------------
	// check resource yrn path
	//----------------------------------------------
	const	resourceyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);				// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	const	resourcematches	= resyrn.match(resourceyrnptn);
	if(!apiutil.isNotEmptyArray(resourcematches) || resourcematches.length < 4 || !apiutil.isSafeString(resourcematches[3])){
		// name is not full yrn to resource, then check wrong resource name
		const	topyrnptn	= new RegExp('^' + keys.NO_TENANT_KEY);							// regex = /^yrn:yahoo:/
		if(resyrn.match(topyrnptn)){
			resobj.result	= false;
			resobj.message	= 'Request query has wrong yrn full path to resource';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
		// convert name to full yrn
		resyrn = keys.RESOURCE_TOP_KEY + ':' + resyrn;
	}

	// call common function
	resobj = rawGetResourceEx(dkcobj, tenantname, servicename, resyrn, is_expand);
	dkcobj.clean();

	// [NOTE]
	// resobj.resource[keys.VALUE_KEYS_TYPE] has full YRN path key name in it.
	// Those are for expanding by using template engine, then those are removed here.
	//
	if(resobj.result && apiutil.isSafeEntity(resobj.resource)){
		const tmp_resource = resobj.resource;

		if(apiutil.isSafeEntity(tmp_resource[keys.VALUE_KEYS_TYPE])){
			// build full yrn path key and value
			const	baseKeys = tmp_resource[keys.VALUE_KEYS_TYPE];
			const	filterKeys: dkcTypeResourceRawKeysValue = {};
			if(apiutil.isPlainObject(baseKeys)){
				for(const keyname in baseKeys){
					if(0 === keyname.indexOf(keys.YRN_KEY + ':')){									// keyname starts 'yrn:' words.
						// skip full yrn(simple checking) path key name.
						continue;
					}
					filterKeys[keyname] = baseKeys[keyname];
				}
			}
			// reset with new filtered keys
			resobj.resource[keys.VALUE_KEYS_TYPE] = filterKeys;
		}
	}

	// [NOTE]
	// If expire key is existed, remove it here.
	//
	if(resobj.result && apiutil.isSafeEntity(resobj.resource) && apiutil.isSafeEntity(resobj.resource[keys.VALUE_EXPIRE_TYPE])){
		delete resobj.resource[keys.VALUE_EXPIRE_TYPE];
	}
	return resobj;
};

//
// raw function for getting resource by role with k2hdkc
//
// role					:	role name for accessing resource
// tenant				:	tenant name for resource
// service				:	service name
// resyrn				:	resource yrn path
//
// [NOTE]
// This function is for getting resource by role, and call common function for it.
//
const rawGetResourceByRoleWithDkc = (
	dkcobj_permanent:	K2hdkc,
	role?:				string | null,
	tenant?:			string | null,
	service?:			string | null,
	resyrn?:			string | null,
	res_type?:			string | null,
	keyname?:			string | null
): resTypeGetResourceElementValue => {

	const	resobj: resTypeGetResourceElementValue = {result: true, message: null};

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(role) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(resyrn)){	// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant) + ', resyrn=' + JSON.stringify(resyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	const	keys = getK2hr3Keys(null, tenant, service);											// we need check type here
	if(!apiutil.isSafeString(res_type) || (!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, res_type) && !apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, res_type) && !apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, res_type))){
		resobj.result	= false;
		resobj.message	= 'type(' + JSON.stringify(res_type) + ') parameter is wrong';
		r3logger.elog(resobj.message);
		return resobj;
	}
	const	_keyname = apiutil.getSafeString(keyname);
	if(apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, res_type) && !apiutil.isSafeString(_keyname)){
		resobj.result	= false;
		resobj.message	= 'keyname(' + JSON.stringify(_keyname) + ') parameter with type(' + JSON.stringify(res_type) + ') parameter is wrong';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// Role key
	const	role_key		= keys.ROLE_TOP_KEY + ':' + role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"

	//----------------------------------------------
	// check resource yrn path
	//----------------------------------------------
	const	resourceyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);				// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	const	resourcematches	= resyrn.match(resourceyrnptn);
	if(!apiutil.isNotEmptyArray(resourcematches) || resourcematches.length < 4 || !apiutil.isSafeString(resourcematches[3])){
		resobj.result	= false;
		resobj.message	= 'resyrn(' + JSON.stringify(resyrn) + ') is not full yrn resource path.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	const	roledata: dkcTypeRoleValue = {
		policies:	[]																		// policies = keys.VALUE_POLICIES_TYPE
	};
	roledata[keys.VALUE_POLICIES_TYPE] = [];
	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true)){							// get expand role data
		resobj.result	= false;
		resobj.message  = 'could not get role(' + role + ') in tenant(' + tenant + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	const	tmpRolePolTypes = roledata[keys.VALUE_POLICIES_TYPE];
	if(!apiutil.isArray(tmpRolePolTypes) || !apiutil.isNotEmptyArray(tmpRolePolTypes)){
		resobj.result	= false;
		resobj.message  = 'could not get role(' + role + ') in tenant(' + tenant + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check policies
	let	access_result = null;
	for(let cnt = 0; cnt < tmpRolePolTypes.length; ++cnt){
		// check each policy has read access
		const	tmpValue = tmpRolePolTypes[cnt];
		if(apiutil.isSafeString(tmpValue)){
			access_result = rawCheckPolicies(dkcobj_permanent, tmpValue, resyrn, keys.ACTION_READ_KEY, access_result);
		}
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		resobj.result	= false;
		resobj.message  = 'role(' + role + ') in tenant(' + tenant + ') does not allow to read access to resource(' + resyrn + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// call common function(expand is true)
	const	res_result = rawGetResourceEx(dkcobj_permanent, tenant, service, resyrn, true);
	if(!res_result.result){
		resobj.result	= res_result.result;
		resobj.message	= res_result.message;
		return resobj;
	}

	// make result
	if(keys.VALUE_STRING_TYPE === res_type){
		if(!apiutil.isSafeEntity(res_result.resource) || !apiutil.isSafeEntity(res_result.resource[keys.VALUE_STRING_TYPE])){
			resobj.result	= false;
			resobj.message  = 'resource(' + resyrn + ') by role(' + role + ') in tenant(' + tenant + ') does not have value for type(' + res_type + ') data.';
		}else{
			resobj.resource = res_result.resource[keys.VALUE_STRING_TYPE];
		}
	}else if(keys.VALUE_OBJECT_TYPE === res_type){
		if(!apiutil.isSafeEntity(res_result.resource) || !apiutil.isSafeEntity(res_result.resource[keys.VALUE_OBJECT_TYPE])){
			resobj.result	= false;
			resobj.message  = 'resource(' + resyrn + ') by role(' + role + ') in tenant(' + tenant + ') does not have value for type(' + res_type + ') data.';
		}else{
			resobj.resource = res_result.resource[keys.VALUE_OBJECT_TYPE];
		}
	}else{	// keys.VALUE_KEYS_TYPE === res_type
		// [NOTE]
		// This function does not return expire key (keys.VALUE_EXPIRE_TYPE).
		// The expire key could not be got from another functions.
		//
		if(!apiutil.isPlainObject(res_result.resource)){
			resobj.resource = null;
			resobj.result	= false;
			resobj.message  = 'resource(' + resyrn + ') by role(' + role + ') in tenant(' + tenant + ') does not have value for type(' + res_type + '[' + _keyname + ']) data.';
		}else{
			const tmpResKetType = res_result.resource[keys.VALUE_KEYS_TYPE];
			if(!apiutil.isPlainObject(tmpResKetType) || !apiutil.isSafeEntity(tmpResKetType[_keyname])){
				resobj.resource = null;
				resobj.result	= false;
				resobj.message  = 'resource(' + resyrn + ') by role(' + role + ') in tenant(' + tenant + ') does not have value for type(' + res_type + '[' + _keyname + ']) data.';
			}else{
				resobj.resource = tmpResKetType[_keyname];
			}
		}
	}
	return resobj;
};

//
// First raw function for getting resource by role
//
// roleyrn				:	role by yrn full path for accessing resource(path should not include service)
// resyrn				:	resource yrn path
//
// [NOTE]
// This function is for getting resource by role, and call common function for it.
// roleyrn is full yrn, and it assumes a path that does not include service.
// If it is a path containing service it will be an error.
//
const rawGetResourceByRole = (
	roleyrn?:	string | null,
	resyrn?:	string | null,
	res_type?:	string | null,
	keyname?:	string | null
): resTypeGetResourceElementValue => {

	let	resobj: resTypeGetResourceElementValue = {result: true, message: null};

	if(!apiutil.isSafeString(roleyrn) || !apiutil.isSafeString(resyrn)){					// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : roleyrn=' + JSON.stringify(roleyrn) + ', resyrn=' + JSON.stringify(resyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}

	// parse role yrn to role name and tenant name
	const	keys			= getK2hr3Keys();												// temporary
	let		servicename: string | null	= null;
	const	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);					// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches		= roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		servicename	= rolematches[1];
	}
	const	tenantname	= rolematches[2];													// not use
	const	rolename	= rolematches[3];

	// call common function
	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	resobj		= rawGetResourceByRoleWithDkc(dkcobj, rolename, tenantname, servicename, resyrn, res_type, keyname);
	dkcobj.clean();
	return resobj;
};

//
// First raw function for getting resource by ip address
//
// ip					:	ip address
// port					:	port(if null(undefined), default 0(any) is used)
// cuk					:	container unique key(if null(undefined), cuk is any)
// roleyrn				:	role yrn
// resyrn				:	resource yrn path
//
// [NOTE]
// This function is for getting resource by ip address, and call common function for it.
// roleyrn allows a path containing service. However, the case is rare and should not be used.
//
const rawGetResourceByIP = (
	ip?:		string | null,
	port?:		number | null,
	cuk?:		string | null,
	roleyrn?:	string | null,
	resyrn?:	string | null,
	res_type?:	string | null,
	keyname?:	string | null
): resTypeGetResourceElementValue => {

	let	resobj: resTypeGetResourceElementValue = {result: true, message: null};

	if(!apiutil.isSafeString(ip) || !apiutil.isSafeString(roleyrn) || !apiutil.isSafeString(resyrn) || !apiutil.isSafeNumber(port)){	// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resyrn=' + JSON.stringify(resyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys();
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check ip:port is role member
	//----------------------------------------------
	// parse role yrn to role name and tenant name and service name
	let		servicename: string | null	= null;
	const	roleyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(roleyrn) + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		servicename	= rolematches[1];
	}
	const	tenantname	= rolematches[2];
	const	rolename	= rolematches[3];

	// check host
	const	host_info	= rawFindRoleHost(dkcobj, roleyrn, null, ip, port, cuk, false);		// not strictly check
	if(!apiutil.isNotEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + JSON.stringify(ip) + ':' + String(port) + ') is not role(' + JSON.stringify(roleyrn) + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj = rawGetResourceByRoleWithDkc(dkcobj, rolename, tenantname, servicename, resyrn, res_type, keyname);

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// Common remove resource raw function
//---------------------------------------------------------
// tenant				:	tenant name for resource
// service				:	service name
// resource				:	resource name
// res_type				:	target resource data type
//							all(=null or undefined), "anytype"(=any type data), "string"(=only string data),
//							"object"(=only object data), "keys"(=key), "aliases"(=aliases), "expire"(=expire)
// keynames				:	if res_type is "keys", this value is null(=all), keyname string, keyname array.
// aliases				:	if res_type is "aliases", this value is null(=all), alias string, alias array.
//
const rawRemoveResourceEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null,
	resource?:			string | null,
	res_type?:			string | null,
	keynames?:			string | string[] | null,
	aliases?:			string | string[] | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	// check main parameters
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(resource)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource));
		return false;
	}
	// check other parameters
	if(apiutil.isSafeString(service)){
		service		= service.toLowerCase();
	}else{
		service		= null;
	}
	const	keys	= getK2hr3Keys(null, tenant, service);									// for check parameter

	if(!apiutil.isSafeString(res_type)){
		res_type = null;
	}else if(	!apiutil.compareCaseString(res_type, keys.VALUE_ANYDATA_TYPE)	&&
				!apiutil.compareCaseString(res_type, keys.VALUE_STRING_TYPE)	&&
				!apiutil.compareCaseString(res_type, keys.VALUE_OBJECT_TYPE)	&&
				!apiutil.compareCaseString(res_type, keys.VALUE_KEYS_TYPE)		&&
				!apiutil.compareCaseString(res_type, keys.VALUE_ALIAS_TYPE)		&&
				!apiutil.compareCaseString(res_type, keys.VALUE_EXPIRE_TYPE)	)
	{
		r3logger.elog('type(' + JSON.stringify(res_type) + ') parameter is wrong.');
		return false;
	}
	if(keys.VALUE_KEYS_TYPE === res_type){
		if(apiutil.isSafeEntity(keynames)){
			if(apiutil.isSafeString(keynames)){
				keynames = [keynames];
			}else if(!apiutil.isArray(keynames)){
				r3logger.elog('keynames(' + JSON.stringify(keynames) + ') parameter is wrong.');
				return false;
			}else if(!apiutil.isNotEmptyArray(keynames)){
				keynames = null;
			}
		}else{
			keynames = null;
		}
	}
	if(keys.VALUE_ALIAS_TYPE === res_type){
		if(apiutil.isSafeEntity(aliases)){
			if(apiutil.isSafeString(aliases)){
				aliases = [aliases];
			}else if(!apiutil.isArray(aliases)){
				r3logger.elog('aliases(' + JSON.stringify(aliases) + ') parameter is wrong.');
				return false;
			}else if(!apiutil.isNotEmptyArray(aliases)){
				aliases = null;
			}
		}else{
			aliases = null;
		}
	}

	//
	// keys
	//
	const	resource_key	= keys.RESOURCE_TOP_KEY + ':' + resource;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
	const	type_key		= resource_key + '/' + keys.TYPE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type"
	const	reference_key	= resource_key + '/' + keys.REFERENCE_KW;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference"
	const	reskeys_key		= resource_key + '/' + keys.KEYS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys"
	const	alias_key		= resource_key + '/' + keys.ALIAS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@"
	const	expire_key		= resource_key + '/' + keys.EXPIRE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire"

	// do remove
	if(null === res_type){
		// remove resource key(all)

		// check reference key
		const	ref_val		= dkcobj_permanent.casGet(reference_key);
		const	tmpRefval	= apiutil.cvtToNumber(ref_val);
		if(apiutil.isSafeNumber(tmpRefval) && 0 < tmpRefval){
			r3logger.elog('could not remove ' + JSON.stringify(reference_key) + ' key which is reference number(' + JSON.stringify(ref_val) + ')');
			return false;
		}

		// check alias key and decrement resource reference in alias's list.
		const	alias_val_raw	= dkcobj_permanent.getValue(alias_key, null, true, null);
		const	alias_val		= apiutil.getSafeStringArray(apiutil.parseJSON(alias_val_raw));
		if(apiutil.isNotEmptyArray(alias_val)){
			for(let cnt = 0; cnt < alias_val.length; ++cnt){
				const	tmpres = rawIncDecReferenceCount(dkcobj_permanent, alias_val[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in resource(' + JSON.stringify(alias_val[cnt]) + ') included from resource alias(' + JSON.stringify(alias_key) + '), but continue...');
				}
			}
		}

		// remove subkeys(type/reference/keys/@) from resource key
		let	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(resource_key, true));
		if(apiutil.removeStringFromArray(subkeylist, type_key)){
			if(!dkcobj_permanent.remove(type_key, false)){							// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type
				r3logger.dlog('could not remove ' + JSON.stringify(type_key) + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, reference_key)){
			if(!dkcobj_permanent.remove(reference_key, false)){					// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference
				r3logger.dlog('could not remove ' + JSON.stringify(reference_key) + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, reskeys_key)){
			if(!dkcobj_permanent.remove(reskeys_key, false)){						// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys
				r3logger.dlog('could not remove ' + JSON.stringify(reskeys_key) + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, alias_key)){
			if(!dkcobj_permanent.remove(alias_key, false)){						// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
				r3logger.dlog('could not remove ' + JSON.stringify(alias_key) + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, expire_key)){
			if(!dkcobj_permanent.remove(expire_key, false)){						// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire
				r3logger.dlog('could not remove ' + JSON.stringify(expire_key) + ' key');
			}
		}

		// check rest subkeys
		if(apiutil.isNotEmptyArray(subkeylist)){
			// this resource has sub resources, so do not remove this resource
			//
			// remove resource key at first, because resource key has value.
			// we need to remove value anyway.
			// if need subkey list, we make subkey after that.
			//
			let	_result = true;
			if(!dkcobj_permanent.remove(resource_key, false)){						// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
				_result = false;
				r3logger.elog('could not remove ' + JSON.stringify(resource_key) + 'key, but we need to update subkeys. so returns error after that.');
			}
			// there is rest subkeys and need to update it
			if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){			// update subkeys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
				_result = false;
				r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + JSON.stringify(resource_key) + ' key');
			}
			if(!_result){
				return false;
			}
		}else{
			// this resource does not have sub resources, so can remove this resource
			let	direct_parent = apiutil.getParentPath(resource);
			if(apiutil.isSafeString(direct_parent)){
				direct_parent = ':' + direct_parent;
			}else{
				direct_parent = '';
			}
			// remove resource key from direct resource parent key's subkey
			const	direct_parent_key	= keys.RESOURCE_TOP_KEY + direct_parent;			// parent key -> "yrn:yahoo:<service>::<tenant>:resource{:<parent resource>}"
			subkeylist					= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(direct_parent_key, true));
			if(apiutil.removeStringFromArray(subkeylist, resource_key)){
				if(!dkcobj_permanent.setSubkeys(direct_parent_key, subkeylist)){	// update parent subkey -> yrn:yahoo:<service>::<tenant>:resource{:<parent resource>}
					r3logger.elog('could not update subkey under ' + JSON.stringify(direct_parent_key) + ' key');
					return false;
				}
			}
			// remove resource key
			if(!dkcobj_permanent.remove(resource_key, false)){						// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
				r3logger.elog('could not remove ' + JSON.stringify(resource_key) + ' key');
				return false;
			}
		}

	}else{
		// not remove all resource

		// remove data in resource(without all type)
		if((keys.VALUE_ANYDATA_TYPE === res_type || keys.VALUE_STRING_TYPE === res_type || keys.VALUE_OBJECT_TYPE === res_type)){
			let	is_data_updated	= false;
			if(keys.VALUE_ANYDATA_TYPE === res_type){
				// both data type ---> always remove data
				is_data_updated = true;
			}else{
				const	value = dkcobj_permanent.getValue(type_key, null, true, null);
				if(apiutil.getSafeString(value) === res_type){
					// same type
					is_data_updated = true;
				}else{
					// data type is not same
					r3logger.wlog('data type(' + apiutil.getSafeString(value) + ') is not same request type(' + JSON.stringify(res_type) + '), skip removing.');
				}
			}
			if(is_data_updated){
				// remove --> initialize data if it is any data type
				if(!dkcobj_permanent.setValue(type_key, keys.VALUE_STRING_TYPE)){	// set value "string" -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type
					r3logger.elog('could not set ' + keys.VALUE_STRING_TYPE + ' value to ' + JSON.stringify(type_key) + ' key');
					return false;
				}
				if(!dkcobj_permanent.setValue(resource_key, '')){					// set value '' -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
					r3logger.elog('could not set \'\' value to ' + JSON.stringify(resource_key) + ' key');
					return false;
				}
			}
		}

		// remove keys in resource
		if(keys.VALUE_KEYS_TYPE === res_type){
			// get keys value
			const	reskey_val_raw	= dkcobj_permanent.getValue(reskeys_key, null, true, null);
			let		reskey_val		= apiutil.parseJSON(reskey_val_raw);

			// remove keynames(or all) from value
			let	is_keys_updated	= false;
			if(rawIsDkcTypeResourceRawKeysValue(reskey_val) && 0 < Object.keys(reskey_val).length){
				if(null === keynames){
					// remove all keys
					reskey_val		= {};
					is_keys_updated	= true;
				}else if(apiutil.isNotEmptyArray(keynames)){
					for(let cnt = 0; cnt < keynames.length; ++cnt){
						if(apiutil.isSafeEntity(reskey_val[keynames[cnt]])){
							delete reskey_val[keynames[cnt]];
							is_keys_updated	= true;
						}
					}
				}
			}
			// update value
			if(is_keys_updated){
				if(!dkcobj_permanent.setValue(reskeys_key, JSON.stringify(reskey_val))){	// update value keys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys
					r3logger.elog('could not set ' + JSON.stringify(reskey_val) + ' value to ' + JSON.stringify(reskeys_key) + ' key');
					return false;
				}
			}
		}

		// remove aliases in resource
		if(keys.VALUE_ALIAS_TYPE === res_type){
			// get aliases value
			const	alias_val_raw	= dkcobj_permanent.getValue(alias_key, null, true, null);
			let		alias_val		= apiutil.getSafeStringArray(apiutil.parseJSON(alias_val_raw));

			// remove aliases(or all) from value
			let		is_aliases_updated			= false;
			const	removing_aliases: string[]	= [];
			if(apiutil.isNotEmptyArray(alias_val)){
				if(null === aliases){
					// remove all aliases
					for(let cnt = 0; cnt < alias_val.length; ++cnt){
						removing_aliases.push(alias_val[cnt]);
					}
					alias_val			= [];
					is_aliases_updated	= true;
				}else if(apiutil.isNotEmptyArray(aliases)){
					for(let cnt = 0; cnt < aliases.length; ++cnt){
						if(apiutil.removeStringFromArray(alias_val, aliases[cnt])){
							removing_aliases.push(aliases[cnt]);
							is_aliases_updated	= true;
						}
					}
				}
			}
			// update value
			//
			// [NOTE]
			// If "service" is specified, the value of "alias" should not exist.
			// But here we will not check that.
			//
			if(is_aliases_updated){
				let	_result = true;
				// decrement reference for each removed alias keys
				for(let cnt = 0; cnt < removing_aliases.length; ++cnt){
					const	dec_result = rawIncDecReferenceCount(dkcobj_permanent, removing_aliases[cnt], false);
					if(!dec_result.result){
						_result	= false;
						r3logger.elog('Failed to decrement reference in resource(' + JSON.stringify(removing_aliases[cnt]) + ') included from resource(' + resource_key + ') by ' + dec_result.message + ', but continue...');
					}
				}
				if(!apiutil.isNotEmptyArray(alias_val)){
					// there is no lest alias key, so remove alias key
					if(!dkcobj_permanent.remove(alias_key, false)){				// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
						_result	= false;
						r3logger.elog('could not remove ' + JSON.stringify(alias_key) + ' key');
					}
					// remove aliases key from resource key
					const	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(resource_key, true));
					if(apiutil.removeStringFromArray(subkeylist, alias_key)){
						if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){		// update subkeys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
							_result	= false;
							r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + JSON.stringify(resource_key) + ' key');
						}
					}
				}else{
					// update aliases
					if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(alias_val))){	// update value aliases -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
						_result	= false;
						r3logger.elog('could not set ' + JSON.stringify(alias_val) + ' value to ' + JSON.stringify(alias_key) + ' key');
					}
				}
				if(!_result){
					// error, delayed
					return false;
				}
			}
		}

		// remove expire in resource
		if(keys.VALUE_EXPIRE_TYPE === res_type){
			// remove expire key
			if(!dkcobj_permanent.remove(expire_key, false)){						// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire
				r3logger.elog('could not remove ' + JSON.stringify(expire_key) + ' key');
				return false;
			}
			// remove expire key from resource key
			const	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(resource_key, true));
			if(apiutil.removeStringFromArray(subkeylist, expire_key)){
				if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){		// update subkeys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
					r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + JSON.stringify(resource_key) + ' key');
					return false;
				}
			}
		}
	}
	return true;
};

//
// First raw function for removing resource by user
//
// user					:	user name for accessing resource
// tenant				:	tenant name for resource
// resource				:	resource name
//
// [NOTE]
// This function is for removing resource by user, and call common function for it.
//
const rawRemoveResourceByUser = (
	user?:		string | null,
	tenant?:	string | null,
	resource?:	string | null,
	res_type?:	string | null,
	keynames?:	string | string[] | null,
	aliases?:	string | string[] | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(resource)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);		// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check user is tenant member
	//----------------------------------------------
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + JSON.stringify(user) + ') is not tenant(' + JSON.stringify(tenant) + ') member, then could not allow to access resource(' + JSON.stringify(resource) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	if(!rawRemoveResourceEx(dkcobj, tenant, null, resource, res_type, keynames, aliases)){
		resobj.result	= false;
		resobj.message	= 'could not remove resource(' + JSON.stringify(resource) + ') with type=(' + JSON.stringify(res_type) + '), keynames=(' + JSON.stringify(keynames) + '), aliases=(' + JSON.stringify(aliases) + ') for user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
	}

	dkcobj.clean();
	return resobj;
};

//
// raw function for removing resource by role with k2hdkc
//
// role					:	role name for accessing resource
// tenant				:	tenant name for resource
// resource				:	resource name
//
// [NOTE]
// This function is for removing resource by role, and call common function for it.
//
const rawRemoveResourceByRoleWithDkc = (
	dkcobj_permanent:	K2hdkc,
	role?:				string | null,
	tenant?:			string | null,
	resource?:			string | null,
	res_type?:			string | null,
	keynames?:			string | string[] | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(role) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(resource)){		// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check type parameters
	const	keys = getK2hr3Keys(null, tenant, null);										// for check parameter
	if(!apiutil.isSafeString(res_type) || (!apiutil.compareCaseString(res_type, keys.VALUE_ANYDATA_TYPE) && !apiutil.compareCaseString(res_type, keys.VALUE_STRING_TYPE) && !apiutil.compareCaseString(res_type, keys.VALUE_OBJECT_TYPE) && !apiutil.compareCaseString(res_type, keys.VALUE_KEYS_TYPE))){
		resobj.result	= false;
		resobj.message	= 'type(' + JSON.stringify(res_type) + ') parameter is wrong. when removing resource by role, type must be only anydata/string/object.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	role_key		= keys.ROLE_TOP_KEY + ':' + role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	const	resource_key	= keys.RESOURCE_TOP_KEY + ':' + resource;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	const	roledata: dkcTypeRoleValue = {
		policies:	[]																		// policies = keys.VALUE_POLICIES_TYPE
	};
	roledata[keys.VALUE_POLICIES_TYPE] = [];
	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true)){							// get expand role data
		resobj.result	= false;
		resobj.message	= 'could not get role(' + JSON.stringify(role) + ') in tenant(' + JSON.stringify(tenant) + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	const	tmpRolePolTypes = roledata[keys.VALUE_POLICIES_TYPE];
	if(!apiutil.isArray(tmpRolePolTypes) || !apiutil.isNotEmptyArray(tmpRolePolTypes)){
		resobj.result	= false;
		resobj.message	= 'could not get role(' + JSON.stringify(role) + ') in tenant(' + JSON.stringify(tenant) + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check policies
	let	access_result: boolean | null = null;
	for(let cnt = 0; cnt < tmpRolePolTypes.length; ++cnt){
		// check each policy has write access
		const tmpPol = tmpRolePolTypes[cnt];
		if(apiutil.isString(tmpPol)){
			access_result = rawCheckPolicies(dkcobj_permanent, tmpPol, resource_key, keys.ACTION_WRITE_KEY, access_result);
		}
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		resobj.result	= false;
		resobj.message	= 'role(' + JSON.stringify(role) + ') in tenant(' + JSON.stringify(tenant) + ') does not allow to write access to resource(' + JSON.stringify(resource) + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// call common function(expand is true)
	if(!rawRemoveResourceEx(dkcobj_permanent, tenant, null, resource, res_type, keynames, null)){
		resobj.result	= false;
		resobj.message	= 'could not remove resource(' + JSON.stringify(resource) + ') with type=(' + JSON.stringify(res_type) + '), keynames=(' + JSON.stringify(keynames) + ') for role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
	}
	return resobj;
};

//
// First raw function for removing resource by role
//
// role					:	role name for accessing resource
// tenant				:	tenant name for resource
// resource				:	resource name
//
// [NOTE]
// This function is for removing resource by role, and call common function for it.
//
const rawRemoveResourceByRole = (
	role:		string,
	tenant?:	string | null,
	resource?:	string | null,
	res_type?:	string | null,
	keynames?:	string | string[] | null
): resTypeBaseResult => {

	let	resobj: resTypeBaseResult = {result: true, message: null};

	// parse role yrn to role name and tenant name
	const	keys		= getK2hr3Keys(null, tenant, null);
	const	roleyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= role.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(role) + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(tenant !== rolematches[2] || apiutil.isSafeString(rolematches[1])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(role) + ') is not tenant(' + JSON.stringify(tenant) + ') role.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	//const	tenantname	= rolematches[2];
	const	rolename	= rolematches[3];

	// call common function
	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	resobj = rawRemoveResourceByRoleWithDkc(dkcobj, rolename, tenant, resource, res_type, keynames);

	dkcobj.clean();
	return resobj;
};

//
// First raw function for removing resource by ip address
//
// ip					:	ip address
// port					:	port(if null(undefined), default 0(any) is used)
// cuk					:	container unique key(if null(undefined), cuk is any)
// roleyrn				:	role yrn
// resource				:	resource name
//
// [NOTE]
// This function is for removing resource by ip address, and call common function for it.
//
const rawRemoveResourceByIP = (
	ip?:		string | null,
	port?:		number | null,
	cuk?:		string | null,
	roleyrn?:	string | null,
	resource?:	string | null,
	res_type?:	string | null,
	keynames?:	string | string[] | null
): resTypeBaseResult => {

	let	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(ip) || !apiutil.isSafeString(roleyrn) || !apiutil.isSafeString(resource) || !apiutil.isSafeNumber(port)){	// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys();
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check ip:port is role member
	//----------------------------------------------
	// parse role yrn to role name and tenant name
	const	roleyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(roleyrn) + ') is under service path, it must not be removed directly.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	const	tenantname	= rolematches[2];
	const	rolename	= rolematches[3];

	// check host
	const	host_info = rawFindRoleHost(dkcobj, roleyrn, null, ip, port, cuk, false);		// not strictly check
	if(!apiutil.isNotEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + JSON.stringify(ip) + ':' + String(port) + ') is not role(' + JSON.stringify(roleyrn) + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj = rawRemoveResourceByRoleWithDkc(dkcobj, rolename, tenantname, resource, res_type, keynames);
	dkcobj.clean();
	return resobj;
};

//
// raw function for removing resource under service and tenant
//
// tenant				:	tenant name for resource
// service				:	service name
// resource				:	resource name
//
const rawRemoveServiceTenantResource = (
	dkcobj_permanent:	K2hdkc,
	tenant?:				string | null,
	service?:			string | null,
	resource?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(service) || !apiutil.isSafeString(resource)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service) + ', resource=' + JSON.stringify(resource));
		return false;
	}

	// call common function
	if(!rawRemoveResourceEx(dkcobj_permanent, tenant, service, resource, null)){
		r3logger.elog('could not remove resource(' + JSON.stringify(resource) + ') for service=' + JSON.stringify(service) + ',  tenant=' + JSON.stringify(tenant));
		return false;
	}
	return true;
};

//
// raw function for removing all resources under service and tenant
//
// tenant				:	tenant name for resource
// service				:	service name
// resource				:	resource name
//
const rawRemoveServiceTenantAllResource = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(service)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return false;
	}

	//
	// Get resource key list
	//
	const	keys		= getK2hr3Keys(null, tenant, service);
	const	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.RESOURCE_TOP_KEY, true));	// get subkey list from yrn:yahoo:<service>::<tenant>:resource:*
	if(!apiutil.isNotEmptyArray(subkeylist)){
		// there is no resource.
		return true;
	}

	const	ptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);						// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	for(let cnt = 0; cnt < subkeylist.length; ++cnt){
		// check resource name and path
		const matches	= subkeylist[cnt].match(ptn);
		if(!apiutil.isNotEmptyArray(matches) || matches.length < 4 || !apiutil.isSafeString(matches[1]) || !apiutil.isSafeString(matches[2]) || !apiutil.isSafeString(matches[3])){
			// wrong path for resource, then skip it.
			r3logger.wlog('subkey(' + JSON.stringify(subkeylist[cnt]) + ') is not safe resource path for tenant(' + JSON.stringify(tenant) + ') and service(' + JSON.stringify(service) + ')');
			continue;
		}
		if(!apiutil.compareCaseString(matches[1], service) || !apiutil.compareCaseString(matches[2], tenant)){
			// wrong path for resource, then skip it.
			r3logger.wlog('subkey(' + JSON.stringify(subkeylist[cnt]) + ') is not under tenant(' + JSON.stringify(tenant) + ') and service(' + JSON.stringify(service) + ')');
			continue;
		}

		// remove one resource function
		if(!rawRemoveServiceTenantResource(dkcobj_permanent, tenant, service, matches[3])){
			r3logger.elog('could not remove resource(' + matches[3] + ') under tenant(' + JSON.stringify(tenant) + ') and service(' + JSON.stringify(service) + ')');
			return false;
		}
	}
	return true;
};

//---------------------------------------------------------
// check resource raw function
//---------------------------------------------------------
//
// Utility function:	This function is reentrant
//
// resource		:	target resource yrn
// is_parent	:	if this value is true, check inheritance from parent key.
//					if false, check resource only this resource.
//					if null(or not entity), default value is true(check parents)
// res_type		:	null(all) / "string" / "object" / "keys"
// keyname		:	Key name in "keys" when res_type is "keys"
//
// result		:	null	=> resource does not have target
//					true	=> resource has target and allows target action
//					false	=> resource has target and does not allow target action
//
const rawCheckResources = (
	dkcobj_permanent:	K2hdkc,
	resource?:			string | null,
	is_parent?:			boolean | null,
	res_type?:			string | null,
	keyname?:			string | null,
	summary_result?:	boolean,
	checked_resources?:	string[] | null,
	base_resource_top?:	string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return typeof summary_result === 'boolean' ? summary_result : false;				// return initial result(not modify)
	}
	if(!apiutil.isSafeString(resource)){
		r3logger.elog('some parameters are wrong : resource=' + JSON.stringify(resource));
		return typeof summary_result === 'boolean' ? summary_result : false;				// return initial result(not modify)
	}
	if(!apiutil.isArray(checked_resources)){
		checked_resources = [];
	}
	if(apiutil.findStringInArray(checked_resources, resource)){
		r3logger.wlog('resource(' + JSON.stringify(resource) + ') already checked, then this policy is included from another resource. Thus skip this for escaping blocking.');
		return typeof summary_result === 'boolean' ? summary_result : false;
	}else{
		checked_resources.push(resource);
	}
	if(!apiutil.isBoolean(summary_result)){
		summary_result	= false;															// for default
	}
	if(true === summary_result){
		// If already found target resource, we stop to search resource.
		// This will save waste of time.
		return summary_result;
	}
	if(!apiutil.isBoolean(is_parent)){
		is_parent		= true;
	}

	const	keys = rawGetKeysFromResourceKey(null, resource);								// create keys from resource key
	if(!apiutil.isSafeString(res_type)){
		res_type = null;																		// = all
	}else if(!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, res_type) && !apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, res_type) && !apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, res_type)){
		r3logger.elog('type(' + JSON.stringify(res_type) + ') parameter is wrong, so skip this.');
		return summary_result;
	}
	if(apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, res_type) && !apiutil.isSafeString(keyname)){
		r3logger.elog('keyname(' + JSON.stringify(keyname) + ') parameter with type(' + JSON.stringify(res_type) + ') parameter is wrong');
		return summary_result;
	}
	if(!apiutil.isSafeString(base_resource_top)){
		base_resource_top	= keys.RESOURCE_TOP_KEY;										// resource top key
	}

	//
	// keys
	//
	const	parent_key	= apiutil.getParentPath(resource);									// parent resource key
	const	type_key	= resource + '/' + keys.TYPE_KW;									// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type"
	const	reskeys_key	= resource + '/' + keys.KEYS_KW;									// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys"
	const	alias_key	= resource + '/' + keys.ALIAS_KW;									// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@"

	// check parent
	if(is_parent && apiutil.isSafeString(base_resource_top) && apiutil.isSafeString(parent_key) && 0 === resource.indexOf(base_resource_top) && keys.RESOURCE_TOP_KEY != parent_key){
		const	parent_result	= rawCheckResources(dkcobj_permanent, parent_key, is_parent, res_type, keyname, summary_result, checked_resources, base_resource_top);
		summary_result			= (summary_result || parent_result ? true : false);
	}
	if(summary_result){
		return summary_result;																// found(for saving waste of time)
	}

	// check resource under aliases
	const	alias_val_raw	= dkcobj_permanent.getValue(alias_key, null, true, null);
	const	alias_val		= apiutil.getSafeStringArray(apiutil.parseJSON(alias_val_raw));
	if(apiutil.isNotEmptyArray(alias_val)){
		for(let cnt = 0; cnt < alias_val.length; ++cnt){
			// check alias resource keys(do not check parent for aliases)
			const	alias_result	= rawCheckResources(dkcobj_permanent, alias_val[cnt], false, res_type, keyname, summary_result, checked_resources, base_resource_top);
			summary_result			= (summary_result || alias_result ? true : false);
			if(summary_result){
				return summary_result;														// found(for saving waste of time)
			}
		}
	}

	// get value for this resource(type is not "keys")
	if(keys.VALUE_KEYS_TYPE !== res_type){
		const	res_val = dkcobj_permanent.getValue(resource, null, true, null);
		if(apiutil.isSafeEntity(res_val)){
			// get data type
			const	type_val = dkcobj_permanent.getValue(type_key, null, true, null);
			if(apiutil.isSafeString(type_val) && type_val === res_type){
				// has resource data(with same type)
				summary_result	= true;
			}
		}else{
			// does not have resource data --> nothing to change
		}
	}
	if(summary_result){
		return summary_result;																// found(for saving waste of time)
	}

	// get keys for this resource(type is any or "keys")
	if(null === res_type || keys.VALUE_KEYS_TYPE === res_type){
		const	reskey_val_raw	= dkcobj_permanent.getValue(reskeys_key, null, true, null);
		const	reskey_val		= apiutil.parseJSON(reskey_val_raw);
		if(apiutil.isPlainObject(reskey_val)){
			// has keys data
			if(keys.VALUE_KEYS_TYPE !== res_type){
				summary_result	= true;
			}else if(apiutil.isSafeString(keyname) && apiutil.isSafeEntity(reskey_val[keyname])){
				// same key in keys
				summary_result	= true;
			}else{
				// does not have resource data --> nothing to change
			}
		}else{
			// does not have resource data --> nothing to change
		}
	}
	return summary_result;
};

//
// First raw function for checking resource by user
//
// user				:	user name for accessing resource
// tenant			:	tenant name for resource
// service			:	service name
// resource_name	:	resource name
//
// return			:	{
//							result:		true(found)/false(not found)
//							message:	null or error message string
//						}
//
const rawCheckResourceByUser = (
	user?:			string | null,
	tenant?:		string | null,
	service?:		string | null,
	resource_name?:	string | null,
	res_type?:		string | null,
	keyname?:		string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(resource_name)){	// check other parameter in sub function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource_name);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	// check(with parent key)
	const	keys			= getK2hr3Keys(user, tenant, service);
	const	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	const	resource_key	= keys.RESOURCE_TOP_KEY + ':' + resource_name;					// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check user is tenant member
	//----------------------------------------------
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + JSON.stringify(user) + ') is not tenant(' + JSON.stringify(tenant) + ') member, then could not allow to access resource(' + JSON.stringify(resource_name) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj.result	= rawCheckResources(dkcobj, resource_key, true, res_type, keyname);
	dkcobj.clean();
	return resobj;
};

//
// raw function for checking resource by role with k2hdkc
//
// role					:	role name for accessing resource
// tenant				:	tenant name for resource
// service				:	service name
// resource_name		:	resource name or resource yrn path
//
// [NOTE]
// This function is for checking resource by role, and call common function for it.
//
const rawCheckResourceByRoleWithDkc = (
	dkcobj_permanent:	K2hdkc,
	role?:				string | null,
	tenant?:			string | null,
	service?:			string | null,
	resource?:			string | null,
	res_type?:			string | null,
	keyname?:			string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(role) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(resource)){	// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	const	keys		= getK2hr3Keys(null, tenant, service);
	const	role_key	= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"

	//----------------------------------------------
	// check resource and make resource yrn path
	//----------------------------------------------
	let		resource_key		= resource;													// resource name or yrn path
	const	resourceyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);			// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	const	resourcematches		= resource_key.match(resourceyrnptn);
	if(!apiutil.isNotEmptyArray(resourcematches) || resourcematches.length < 4){
		// resource is not full yrn to resource
		resource_key		= keys.RESOURCE_TOP_KEY + ':' + resource;						// resource name to yrn path "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
	}

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	const	roledata: dkcTypeRoleValue = {
		policies:	[]																		// policies = keys.VALUE_POLICIES_TYPE
	};
	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true) || !apiutil.isNotEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		resobj.result	= false;
		resobj.message	= 'could not get role(' + JSON.stringify(role) + ') in tenant(' + JSON.stringify(tenant) + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check policies
	let	access_result: boolean | null = null;
	const tmproledata = apiutil.getSafeStringArray(roledata[keys.VALUE_POLICIES_TYPE]);
	for(let cnt = 0; cnt < tmproledata.length; ++cnt){
		// check each policy has write access
		access_result = rawCheckPolicies(dkcobj_permanent, tmproledata[cnt], resource_key, keys.ACTION_READ_KEY, access_result);
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		resobj.result	= false;
		resobj.message  = 'role(' + role + ') in tenant(' + tenant + ') does not allow to read access to resource(' + resource + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// call common function
	resobj.result = rawCheckResources(dkcobj_permanent, resource_key, true, res_type, keyname);
	return resobj;
};

//
// First raw function for checking resource by role
//
// roleyrn				:	role by yrn full path for accessing resource(path should not include service)
// tenant				:	tenant name for resource
// resource_name		:	resource name or resource yrn path
//
// [NOTE]
// This function is for checking resource by role, and call common function for it.
// roleyrn is full yrn, and it assumes a path that does not include service.
// If it is a path containing service it will be an error.
//
const rawCheckResourceByRole = (
	roleyrn:	string,
	tenant?:	string | null,
	resource?:	string | null,
	res_type?:	string | null,
	keyname?:	string | null
): resTypeBaseResult => {

	let	resobj: resTypeBaseResult = {result: true, message: null};

	// parse role yrn to role name and tenant name
	const	keys		= getK2hr3Keys(null, tenant, null);
	const	roleyrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches	= roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(roleyrn) + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(tenant !== rolematches[2] || apiutil.isSafeString(rolematches[1])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(roleyrn) + ') is not tenant(' + JSON.stringify(tenant) + ') role.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	//const	tenantname	= rolematches[2];
	const	rolename	= rolematches[3];

	// call common function
	const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);						// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	resobj		= rawCheckResourceByRoleWithDkc(dkcobj, rolename, tenant, null, resource, res_type, keyname);

	dkcobj.clean();
	return resobj;
};

//
// First raw function for checking resource by ip address
//
// ip					:	ip address
// port					:	port(if null(undefined), default 0(any) is used)
// cuk					:	container unique key(if null(undefined), cuk is any)
// roleyrn				:	role yrn
// resource				:	resource name or resource yrn path
//
// [NOTE]
// This function is for checking resource by ip address, and call common function for it.
// roleyrn allows a path containing service. However, the case is rare and should not be used.
//
const rawCheckResourceByIP = (
	ip?:		string | null,
	port?:		string | number | null,
	cuk?:		string | null,
	roleyrn?:	string | null,
	resource?:	string | null,
	res_type?:	string | null,
	keyname?:	string | null
): resTypeBaseResult => {

	let	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(ip) || !apiutil.isSafeString(roleyrn) || !apiutil.isSafeString(resource) || !apiutil.isSafeNumeric(port)){		// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys();
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//----------------------------------------------
	// check ip:port is role member
	//----------------------------------------------
	// parse role yrn to role name and tenant name and service name
	let	servicename: string | null	= null;
	const	roleyrnptn				= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);			// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	rolematches				= roleyrn.match(roleyrnptn);
	if(!apiutil.isNotEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + JSON.stringify(roleyrn) + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		servicename	= rolematches[1];
	}
	const	tenantname	= rolematches[2];
	const	rolename	= rolematches[3];

	// check port
	const	cvt_port	= apiutil.cvtToNumber(port);

	// check host
	const	host_info = rawFindRoleHost(dkcobj, roleyrn, null, ip, cvt_port, cuk, false);		// not strictly check
	if(!apiutil.isNotEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + JSON.stringify(ip) + ':' + String(port) + ') is not role(' + JSON.stringify(roleyrn) + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj = rawCheckResourceByRoleWithDkc(dkcobj, rolename, tenantname, servicename, resource, res_type, keyname);
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// common create policy raw function
//---------------------------------------------------------
//
// Common function for creating resource
//
// user					:	user name
// tenant				:	tenant name
// service				:	service name
// policy				:	policy name
// effect				:	allow(true) or deny(false)
//							if this is null, it means not updating effect.
// action				:	action array
//							if this is null, it means not updating action.
//							if this is '' or array(0), it means clearing action.
// resource				:	resource key array
//							if this is null, it means not updating resource.
//							if this is '' or array(0), it means clearing resource.
// condition			:	reserved
// alias_policy			:	alias policy array
//							if this is null, it means not updating alias.
//							if this is '' or array(0), it means clearing alias.
//
// [NOTE]
// if the service name is specified, create the policy keys under service
// and tenant. and do not create aliases(alias_policy must be empty), and
// effect, action, condition does not have to specified because these value
// is static value for service.
//
const rawCreatePolicyEx = (
	dkcobj_permanent:	K2hdkc,
	user?:				string | null,
	tenant?:			string | null,
	service?:			string | null,
	policy?:			string | null,
	effect?:			boolean | null,
	action?:			string | string[] | null,
	resource?:			string | string[] | null,
	condition?:			string | string[] | null,
	alias_policy?:		string | string[] | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant)){														// allow other argument is empty
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant));
		return false;
	}
	if(!apiutil.isSafeString(user) && !apiutil.isSafeString(service)){						// user or service is not empty
		r3logger.elog('some parameters are wrong : user=' + JSON.stringify(user) + ', service=' + JSON.stringify(service));
		return false;
	}
	if(!apiutil.isSafeString(user)){
		user			= null;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	// check parameters
	const	keys		= getK2hr3Keys(user, tenant, service);
	let		str_effect: string;
	let		is_effect: boolean;
	let		is_action: boolean;
	let		is_resource: boolean;
	let		is_condition: boolean;
	let		is_alias: boolean;

	if(null !== service){
		// service is specified
		//
		// [NOTE]
		// In this case, specifying something other than the resource parameter results in an error.
		//
		if(apiutil.isSafeEntity(effect) && (!apiutil.isBoolean(effect) || (apiutil.isBoolean(effect) && !effect))){
			// effect allows undefined/null/true
			r3logger.elog('parameter effect is wrong(must be undefined, null, true) : effect=' + JSON.stringify(effect));
			return false;
		}
		if(apiutil.isSafeEntity(action)){
			// action allows undefined/null/'read'/['read']
			if(apiutil.isArray(action) && (1 !== action.length || !apiutil.isSafeString(action[1]) || keys.ACTION_READ_KEY !== action[1].toLowerCase())){
				r3logger.elog('parameter action is wrong(must be undefined, null, ' + keys.ACTION_READ_KEY + ') : action=' + JSON.stringify(action));
				return false;
			}
			if(apiutil.isSafeString(action) && keys.ACTION_READ_KEY !== action.toLowerCase()){
				r3logger.elog('parameter action is wrong(must be undefined, null, ' + keys.ACTION_READ_KEY + ') : action=' + JSON.stringify(action));
				return false;
			}
		}
		if(apiutil.isSafeEntity(condition) && (!apiutil.isArray(condition) || apiutil.isNotEmptyArray(condition))){
			// condition allows undefined/null/[]
			r3logger.elog('parameter condition is wrong(must be undefined, null) : condition=' + JSON.stringify(condition));
			return false;
		}
		if(apiutil.isSafeEntity(alias_policy) && (!apiutil.isArray(alias_policy) || apiutil.isNotEmptyArray(alias_policy))){
			// alias allows undefined/null/[]
			r3logger.elog('parameter alias is wrong(must be undefined, null) : alias_policy=' + JSON.stringify(alias_policy));
			return false;
		}
		is_effect	= true;
		is_action	= true;
		is_condition= false;
		is_alias	= false;

		policy			= keys.ACR_POLICY_KW;												// policy name is 'arc-policy'
		str_effect		= keys.VALUE_ALLOW;
		action			= [keys.ACTION_READ_KEY];
		condition		= [] as string[];
		alias_policy	= [] as string[];

	}else{
		// service is NOT specified
		//
		if(!apiutil.isSafeString(policy)){
			r3logger.elog('parameter policy is wrong : policy=' + JSON.stringify(policy));
			return false;
		}
		// policy name is not allowed including '/' word.
		if(-1 !== policy.indexOf('/')){
			r3logger.elog('policy parameters includes / word : policy=' + JSON.stringify(policy));
			return false;
		}

		if(apiutil.isBoolean(effect)){
			is_effect	= true;
			str_effect	= effect ? keys.VALUE_ALLOW : keys.VALUE_DENY;
		}else if(!apiutil.isSafeEntity(effect)){
			is_effect	= false;
			str_effect	= keys.VALUE_DENY;													// default value if need to create key
		}else{
			r3logger.elog('parameter effect is wrong : effect=' + JSON.stringify(effect));
			return false;
		}
		if(apiutil.isStringArray(action)){
			is_action	= true;
		}else if(apiutil.isString(action) && '' === action){
			is_action	= true;
			action		= [] as string[];
		}else if(apiutil.isSafeString(action)){
			is_action	= true;
			action		= [action];
		}else if(!apiutil.isSafeEntity(action)){
			is_action	= false;
			action		= [] as string[];													// default value if need to create key
		}else{
			r3logger.elog('parameter action is wrong : action=' + JSON.stringify(action));
			return false;
		}

		if(apiutil.isStringArray(condition)){
			is_condition= true;
		}else if(apiutil.isString(condition) && '' === condition){
			is_condition= true;
			condition	= [] as string[];
		}else if(apiutil.isSafeString(condition)){
			is_condition= true;
			condition	= [condition];
		}else if(!apiutil.isSafeEntity(condition)){
			is_condition= false;
			condition	= [] as string[];													// default value if need to create key
		}else{
			r3logger.elog('parameter condition is wrong : condition=' + JSON.stringify(condition));
			return false;
		}

		if(apiutil.isStringArray(alias_policy)){
			is_alias	= true;
		}else if(apiutil.isString(alias_policy) && '' === alias_policy){
			is_alias	= true;
			alias_policy = [] as string[];
		}else if(!apiutil.isSafeEntity(alias_policy)){
			is_alias	= false;
		}else{
			r3logger.elog('parameter alias_policy is wrong : alias_policy=' + JSON.stringify(alias_policy));
			return false;
		}
	}

	// check resource parameter(common check for both case)
	if(apiutil.isStringArray(resource)){
		is_resource	= true;
	}else if(apiutil.isString(resource) && '' === resource){
		is_resource	= true;
		resource	= [] as string[];															// clear value if need to create key
	}else if(apiutil.isSafeString(resource)){
		is_resource = true;
		resource	= [resource];
	}else if(!apiutil.isSafeEntity(resource)){
		is_resource = false;
		resource	= [] as string[];															// default value if need to create key
	}else{
		r3logger.elog('parameter resource is wrong : resource=' + JSON.stringify(resource));
		return false;
	}

	//
	// keys
	//
	const	policy_key		= keys.POLICY_TOP_KEY + ':' + policy;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>"
	const	effect_key		= policy_key + '/' + keys.EFFECT_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
	const	action_key		= policy_key + '/' + keys.ACTION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
	const	resource_key	= policy_key + '/' + keys.RESOURCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
	const	condition_key	= policy_key + '/' + keys.CONDITION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/condition"
	const	reference_key	= policy_key + '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/reference"
	const	alias_key		= policy_key + '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"
	let		need_update		= false;

	// add policy key into policy top key's subkey
	let	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.POLICY_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, policy_key)){
		if(!dkcobj_permanent.setSubkeys(keys.POLICY_TOP_KEY, subkeylist)){			// add subkey yrn:yahoo:<service>::<tenant>:policy:<policy> -> yrn:yahoo:<service>::<tenant>:policy
			r3logger.elog('could not add ' + policy_key + ' subkey under ' + keys.POLICY_TOP_KEY + ' key');
			return false;
		}
	}

	// check policy/action/resource/condition/alias key
	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(policy_key, true));
	if(apiutil.tryAddStringToArray(subkeylist, effect_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, action_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, resource_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, condition_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, reference_key)){
		need_update	= true;
	}
	if(is_alias && apiutil.isStringArray(alias_policy) && 0 < alias_policy.length && apiutil.tryAddStringToArray(subkeylist, alias_key)){	// Make alias key in subkey list only when new alias exists
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj_permanent.setSubkeys(policy_key, subkeylist)){					// add subkey yrn:yahoo:<service>::<tenant>:policy:<policy>/{effect, action, resource, condition} -> yrn:yahoo:<service>::<tenant>:policy:<policy>
			r3logger.elog('could not add ' + JSON.stringify(policy_key) + '/* subkeys under ' + JSON.stringify(policy_key) + ' key');
			return false;
		}
	}

	// effect key
	const	effect_val = dkcobj_permanent.getValue(effect_key, null, true, null);
	if((is_effect && str_effect !== effect_val) || (!is_effect && !apiutil.isSafeEntity(effect_val))){
		if(!dkcobj_permanent.setValue(effect_key, str_effect)){					// update value effect -> yrn:yahoo:<service>::<tenant>:policy:<policy>/effect
			r3logger.elog('could not set ' + JSON.stringify(str_effect) + ' value to ' + JSON.stringify(effect_key) + ' key');
			return false;
		}
	}

	// action key
	const	action_val_raw	= dkcobj_permanent.getValue(action_key, null, true, null);
	const	action_val		= apiutil.parseJSON(action_val_raw);
	if((is_action && (!apiutil.isStringArray(action_val) || !apiutil.compareArray(action_val, action))) || (!is_action && !apiutil.isSafeEntity(action_val))){
		if(!dkcobj_permanent.setValue(action_key, JSON.stringify(action))){		// update value action -> yrn:yahoo:<service>::<tenant>:policy:<policy>/action
			r3logger.elog('could not set ' + JSON.stringify(action) + ' value to ' + JSON.stringify(action_key) + ' key');
			return false;
		}
	}

	// resource key
	const	res_val_raw	= dkcobj_permanent.getValue(resource_key, null, true, null);
	const	res_val		= apiutil.parseJSON(res_val_raw);
	if((is_resource && (!apiutil.isStringArray(res_val) || !apiutil.compareArray(res_val, resource))) || (!is_resource && !apiutil.isSafeEntity(res_val))){
		// get removing element(resource) & decrement it's reference
		const delarr = apiutil.getDeletingDifferenceArray(apiutil.getSafeStringArray(res_val), resource);
		for(let cnt = 0; cnt < delarr.length; ++cnt){
			const tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
			if(!tmpres.result){
				r3logger.wlog('Failed to decrement reference in resource(' + JSON.stringify(delarr[cnt]) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
			}
		}
		// set new resource array
		if(!dkcobj_permanent.setValue(resource_key, JSON.stringify(resource))){	// update value resource -> yrn:yahoo:<service>::<tenant>:policy:<policy>/resource
			r3logger.elog('could not set ' + JSON.stringify(resource) + ' value to ' + JSON.stringify(resource_key) + ' key');
			return false;
		}
		// get adding element(resource) & increment it's reference
		const addarr = apiutil.getAddingDifferenceArray(apiutil.getSafeStringArray(res_val), resource);
		for(let cnt = 0; cnt < addarr.length; ++cnt){
			const tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
			if(!tmpres.result){
				r3logger.wlog('Failed to increment reference in resource(' + JSON.stringify(addarr[cnt]) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
			}
		}
	}

	// condition key
	const	cond_val_raw	= dkcobj_permanent.getValue(condition_key, null, true, null);
	const	cond_val		= apiutil.parseJSON(cond_val_raw);
	if((is_condition && (!apiutil.isStringArray(cond_val) || !apiutil.compareArray(cond_val, condition))) || (!is_condition && !apiutil.isSafeEntity(cond_val))){
		if(!dkcobj_permanent.setValue(condition_key, JSON.stringify(condition))){	// update value condition -> yrn:yahoo:<service>::<tenant>:policy:<policy>/condition
			r3logger.elog('could not set ' + JSON.stringify(condition) + ' value to ' + JSON.stringify(condition_key) + ' key');
			return false;
		}
	}
	// reference key
	const	refkey_val	= dkcobj_permanent.casGet(reference_key);
	if(!apiutil.isSafeEntity(refkey_val)){
		if(!dkcobj_permanent.casInit(reference_key, 0)){							// initialize cas value -> yrn:yahoo:<service>::<tenant>:policy:<policy>/reference
			r3logger.elog('could not initialize reference value to ' + JSON.stringify(reference_key) + ' key');
			return false;
		}
	}

	// alias
	const	alias_val_raw	= dkcobj_permanent.getValue(alias_key, null, true, null);
	const	alias_val		= apiutil.parseJSON(alias_val_raw);
	if(is_alias){
		if(!apiutil.isStringArray(alias_policy) || 0 === alias_policy.length){
			if(apiutil.isSafeEntity(alias_val)){
				// if there is alias array, alias policy reference is needed to decrement
				if(apiutil.isArray(alias_val) && apiutil.isNotEmptyArray(alias_val)){
					for(let cnt = 0; cnt < alias_val.length; ++cnt){
						const tmpval = alias_val[cnt];
						if(null === tmpval || apiutil.isString(tmpval)){
							const tmpres = rawIncDecReferenceCount(dkcobj_permanent, tmpval, false);
							if(!tmpres.result){
								r3logger.wlog('Failed to decrement reference in policy(' + JSON.stringify(tmpval) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
							}
						}else{
							r3logger.wlog('Failed to decrement reference in policy(' + JSON.stringify(alias_val[cnt]) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
						}
					}
				}
				// New aliases is empty, so we removed alias key
				if(!dkcobj_permanent.remove(alias_key, false)){					// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/@
					r3logger.elog('could not remove ' + JSON.stringify(alias_key) + ' subkey under ' + JSON.stringify(policy_key) + ' key');
					return false;
				}
			}
			// remove subkey(alias:@) in policy subkey list
			subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(policy_key, true));
			if(apiutil.removeStringFromArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(policy_key, subkeylist)){			// remove subkey yrn:yahoo:<service>::<tenant>:policy:<policy>/@ -> yrn:yahoo:<service>::<tenant>:policy:<policy>
					r3logger.elog('could not remove ' + JSON.stringify(alias_key) + ' subkey under ' + JSON.stringify(policy_key) + ' key');
					return false;
				}
			}
		}else{
			// get removing element(alias policy)
			const delarr = apiutil.getDeletingDifferenceArray(apiutil.getSafeStringArray(alias_val), alias_policy);
			for(let cnt = 0; cnt < delarr.length; ++cnt){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in policy(' + JSON.stringify(delarr[cnt]) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
				}
			}
			// set new aliases
			if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(alias_policy))){	// update value alias -> yrn:yahoo:<service>::<tenant>:policy:<policy>/@
				r3logger.elog('could not set ' + JSON.stringify(alias_policy) + ' value to ' + JSON.stringify(alias_key) + ' key');
				return false;
			}
			// get adding element(alias policy)
			const addarr = apiutil.getAddingDifferenceArray(apiutil.getSafeStringArray(alias_val), alias_policy);
			for(let cnt = 0; cnt < addarr.length; ++cnt){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
				if(!tmpres.result){
					r3logger.wlog('Failed to increment reference in policy(' + JSON.stringify(addarr[cnt]) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
				}
			}
			// add subkey(alias:@) in policy subkey list
			subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(policy_key, true));
			if(apiutil.tryAddStringToArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(policy_key, subkeylist)){			// add subkey yrn:yahoo:<service>::<tenant>:policy:<policy>/@ -> yrn:yahoo:<service>::<tenant>:policy:<policy>
					r3logger.elog('could not add ' + JSON.stringify(alias_key) + ' subkey under ' + JSON.stringify(policy_key) + ' key');
					return false;
				}
			}
		}
	}
	return true;
};

//---------------------------------------------------------
// create policy(no service) raw function
//---------------------------------------------------------
// user					:	user name
// tenant				:	tenant name
// policy				:	policy name
// effect				:	allow(true) or deny(false)
//							if this is null, it means not updating effect.
// action				:	action array
//							if this is null, it means not updating action.
//							if this is '' or array(0), it means clearing action.
// resource				:	resource key array
//							if this is null, it means not updating resource.
//							if this is '' or array(0), it means clearing resource.
// condition			:	reserved
// alias_policy			:	alias policy array
//							if this is null, it means not updating alias.
//							if this is '' or array(0), it means clearing alias.
//
const rawCreatePolicy = (
	user?:			string | null,
	tenant?:		string | null,
	policy?:		string | null,
	effect?:		boolean | null,
	action?:		string | string[] | null,
	resource?:		string | string[] | null,
	condition?:		string | string[] | null,
	alias_policy?:	string | string[] | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);			// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	if(!rawCreatePolicyEx(dkcobj, user, tenant, null, policy, effect, action, resource, condition, alias_policy)){
		resobj.result	= false;
		resobj.message	= 'could not create policy(' + JSON.stringify(policy) + ') for tenant(' + tenant + '), user(' + user + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// create policy(with service) raw function
//---------------------------------------------------------
// tenant				:	tenant name
// service				:	service name
// resource				:	resource key array
//							if this is null, it means not updating resource.
//							if this is '' or array(0), it means clearing resource.
//
const rawCreateServiceTenantPolicy = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null,
	resource?:			string | string[] | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	return rawCreatePolicyEx(dkcobj_permanent, null, tenant, service, null, null, null, resource);
};

//---------------------------------------------------------
// Common remove policy raw function
//---------------------------------------------------------
const rawRemovePolicyEx = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null,
	policy?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(policy)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', policy=' + JSON.stringify(policy));
		return false;
	}
	if(apiutil.isSafeString(service)){
		service	= service.toLowerCase();
	}else{
		service	= null;
	}

	//
	// keys
	//
	const	keys			= getK2hr3Keys(null, tenant, service);
	const	policy_key		= keys.POLICY_TOP_KEY + ':' + policy;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>"
	const	effect_key		= policy_key + '/' + keys.EFFECT_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
	const	action_key		= policy_key + '/' + keys.ACTION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
	const	resource_key	= policy_key + '/' + keys.RESOURCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
	const	condition_key	= policy_key + '/' + keys.CONDITION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/condition"
	const	reference_key	= policy_key + '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/reference"
	const	alias_key		= policy_key + '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"

	// check reference key
	const	refkey_val	= dkcobj_permanent.casGet(reference_key);
	const	tmpRefval	= apiutil.cvtToNumber(refkey_val);
	if(apiutil.isSafeNumber(tmpRefval) && 0 < tmpRefval){
		r3logger.elog('could not remove ' + JSON.stringify(reference_key) + ' key which is reference number(' + JSON.stringify(refkey_val) + ')');
		return false;
	}

	// remove policy key from policy top key's subkey
	const	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.POLICY_TOP_KEY, true));
	if(apiutil.removeStringFromArray(subkeylist, policy_key)){
		if(!dkcobj_permanent.setSubkeys(keys.POLICY_TOP_KEY, subkeylist)){			// update subkey -> yrn:yahoo:<service>::<tenant>:policy
			r3logger.elog('could not update subkey under ' + JSON.stringify(keys.POLICY_TOP_KEY) + ' key');
			return false;
		}
	}

	// decrement alias policy's reference
	const	alias_val_raw	= dkcobj_permanent.getValue(alias_key, null, true, null);
	const	alias_val		= apiutil.parseJSON(alias_val_raw);
	if(apiutil.isNotEmptyArray(alias_val)){
		for(let cnt = 0; cnt < alias_val.length; ++cnt){
			const tmpval = alias_val[cnt];
			if(null === tmpval || apiutil.isString(tmpval)){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, tmpval, false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in policy(' + JSON.stringify(tmpval) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
				}
			}else{
				r3logger.wlog('Failed to decrement reference in policy(' + JSON.stringify(alias_val[cnt]) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
			}
		}
	}

	// decrement resource's reference
	const	res_val_raw	= dkcobj_permanent.getValue(resource_key, null, true, null);
	const	res_val		= apiutil.parseJSON(res_val_raw);
	if(apiutil.isNotEmptyArray(res_val)){
		for(let cnt = 0; cnt < res_val.length; ++cnt){
			const tmpval = res_val[cnt];
			if(null === tmpval || apiutil.isString(tmpval)){
				const tmpres = rawIncDecReferenceCount(dkcobj_permanent, tmpval, false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in resource(' + JSON.stringify(tmpval) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
				}
			}else{
				r3logger.wlog('Failed to decrement reference in resource(' + JSON.stringify(res_val[cnt]) + ') included from policy(' + JSON.stringify(policy_key) + '), but continue...');
			}
		}
	}

	if(!dkcobj_permanent.remove(alias_key, false)){								// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/@
		r3logger.dlog('could not remove ' + JSON.stringify(alias_key) + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(effect_key, false)){								// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/effect
		r3logger.dlog('could not remove ' + JSON.stringify(effect_key) + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(action_key, false)){								// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/action
		r3logger.dlog('could not remove ' + JSON.stringify(action_key) + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(resource_key, false)){								// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/resource
		r3logger.dlog('could not remove ' + JSON.stringify(resource_key) + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(condition_key, false)){							// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/condition
		r3logger.dlog('could not remove ' + JSON.stringify(condition_key) + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(policy_key, false)){								// remove yrn:yahoo:<service>::<tenant>:policy:<policy>
		r3logger.dlog('could not remove ' + JSON.stringify(policy_key) + 'key, probably it is not existed.');
	}
	return true;
};

//---------------------------------------------------------
// remove policy(no service) raw function
//---------------------------------------------------------
const rawRemovePolicy = (
	user?:		string | null,
	tenant?:	string | null,
	service?:	string | null,
	policy?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(policy)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', policy=' + JSON.stringify(policy);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// check user is tenant member
	//
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to remove policy(' + policy + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// remove policy
	//
	if(!rawRemovePolicyEx(dkcobj, tenant, service, policy)){
		resobj.result	= false;
		resobj.message	= 'Could not remove policy(' + policy + ') from tenant(' + tenant + ') and service(' + JSON.stringify(service) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// remove policy(with service) raw function
//---------------------------------------------------------
const rawRemoveServiceTenantPolicy = (
	dkcobj_permanent:	K2hdkc,
	tenant?:			string | null,
	service?:			string | null
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(service)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return false;
	}

	const	keys = getK2hr3Keys(null, tenant, service);

	//
	// remove policy
	//
	if(!rawRemovePolicyEx(dkcobj_permanent, tenant, service, keys.ACR_POLICY_KW)){
		r3logger.elog('Could not remove policy(' + keys.ACR_POLICY_KW + ') from tenant(' + tenant + ') and service(' + JSON.stringify(service) + ')');
		return false;
	}
	return true;
};

//---------------------------------------------------------
// get policy raw function
//---------------------------------------------------------
// return object
//	{
//		"result":	true/false
//		"message":	<error message> / null / undefined
//		"policy":	{
//			"name":			<policy name>					: [NOTE] Currently, the name is not defined.
//			"effect":		"allow" or "deny"
//			"action":		[<action yrn full path>, ...]
//			"resource":		[<resource yrn full path>, ...]
//			"condition":	null or undefined
//			"reference":	reference count
//			"alias":		[<policy yrn full path>, ...]
//		}
//	}
//
const rawGetPolicyAll = (
	user?:		string | null,
	tenant?:	string | null,
	service?:	string | null,
	policy?:	string | null
): resTypeGetPolicyValue => {

	const	resobj: resTypeGetPolicyValue = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(tenant) || !apiutil.isSafeString(policy)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', policy=' + JSON.stringify(policy);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// keys
	//
	const	keys			= getK2hr3Keys(user, tenant, service);
	const	policy_key		= keys.POLICY_TOP_KEY + ':' + policy;						// "yrn:yahoo:<service>::<tenant>:policy:<policy>"
	const	effect_key		= policy_key + '/' + keys.EFFECT_KW;						// "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
	const	action_key		= policy_key + '/' + keys.ACTION_KW;						// "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
	const	resource_key	= policy_key + '/' + keys.RESOURCE_KW;						// "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
	const	condition_key	= policy_key + '/' + keys.CONDITION_KW;						// "yrn:yahoo:<service>::<tenant>:policy:<policy>/condition"
	const	reference_key	= policy_key + '/' + keys.REFERENCE_KW;						// "yrn:yahoo:<service>::<tenant>:policy:<policy>/reference"
	const	alias_key		= policy_key + '/' + keys.ALIAS_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"

	//----------------------------------------------
	// check user is tenant member
	//----------------------------------------------
	const	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + JSON.stringify(user) + ') is not tenant(' + JSON.stringify(tenant) + ') member, then could not allow to remove policy(' + JSON.stringify(policy) + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// policy main key : get subkey list
	let	subkeylist	= dkcobj.getSubkeys(keys.POLICY_TOP_KEY, true);			// get subkey list in "yrn:yahoo:<service>::<tenant>:policy"
	if(!apiutil.findStringInArray(subkeylist, policy_key)){
		resobj.result	= false;
		resobj.message	= policy_key + ' is not found in ' + keys.POLICY_TOP_KEY + ' subkey list.';
		dkcobj.clean();
		return resobj;
	}

	// policy top key : get subkey list
	subkeylist	= dkcobj.getSubkeys(policy_key, true);							// get subkey list in "yrn:yahoo:<service>::<tenant>:policy:<policy>"

	// effect
	let	pol_effect: string;
	if(apiutil.findStringInArray(subkeylist, effect_key)){
		const value = dkcobj.getValue(effect_key, null, true, null);
		if(keys.VALUE_ALLOW === value || keys.VALUE_DENY === value){
			pol_effect = value;
		}else{
			// unknown value
			r3logger.wlog('policy(' + policy_key + ') have unknown effect value(' + JSON.stringify(value) + '), then returns default value(deny).');
			pol_effect = keys.VALUE_DENY;
		}
	}else{
		// there is no effect key, thus default value(deny) is set.
		r3logger.wlog('policy(' + policy_key + ') does not have effect key, then returns default value(deny).');
		pol_effect = keys.VALUE_DENY;
	}

	// action
	const	pol_action: string[] = [];
	if(apiutil.findStringInArray(subkeylist, action_key)){
		const	value_raw	= dkcobj.getValue(action_key, null, true, null);
		const	value		= apiutil.parseJSON(value_raw);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong action value(' + JSON.stringify(value) + '), then returns default value(read).');
			pol_action.push(keys.VALUE_READ);

		}else if(apiutil.isArray(value)){
			for(let cnt = 0; cnt < value.length; ++cnt){
				const tmpval = value[cnt];
				if(apiutil.isSafeString(tmpval) && (keys.ACTION_READ_KEY === tmpval || keys.ACTION_WRITE_KEY === tmpval)){
					pol_action.push(tmpval);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong action value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			if(0 === pol_action.length){
				r3logger.wlog('policy(' + policy_key + ') have action empty array(there is no valid value), then returns default value(read).');
				pol_action.push(keys.VALUE_READ);
			}

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not action array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			if(keys.ACTION_READ_KEY === value || keys.ACTION_WRITE_KEY === value){
				pol_action.push(value);
			}else{
				r3logger.wlog('policy(' + policy_key + ') have wrong action strong value(' + JSON.stringify(value) + '), then returns default value(read).');
				pol_action.push(keys.VALUE_READ);
			}
		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type action value(' + JSON.stringify(value) + '), then returns default value(read).');
			pol_action.push(keys.VALUE_READ);
		}
	}else{
		// there is no action key, thus default value(read) is set.
		r3logger.wlog('policy(' + policy_key + ') does not have action key, then returns default value(read).');
		pol_action.push(keys.VALUE_READ);
	}

	// resource
	const	pol_res: string[] = [];
	if(apiutil.findStringInArray(subkeylist, resource_key)){
		const	value_raw	= dkcobj.getValue(resource_key, null, true, null);
		const	value		= apiutil.parseJSON(value_raw);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong resource value(' + JSON.stringify(value) + '), then returns default empty array.');

		}else if(apiutil.isArray(value)){
			for(let cnt = 0; cnt < value.length; ++cnt){
				const tmpval = value[cnt];
				if(apiutil.isSafeString(tmpval)){
					pol_res.push(tmpval);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong resource value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			// resource value is allowed empty array

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not resource array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			pol_res.push(value);

		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type resource value(' + JSON.stringify(value) + '), then returns default empty array.');
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have resource key, then returns default empty array.');
	}

	// condition
	const	pol_cond: string[] = [];
	if(apiutil.findStringInArray(subkeylist, condition_key)){
		const	value_raw	= dkcobj.getValue(condition_key, null, true, null);
		const	value		= apiutil.parseJSON(value_raw);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong condition value(' + JSON.stringify(value) + '), then returns default empty array.');

		}else if(apiutil.isArray(value)){
			for(let cnt = 0; cnt < value.length; ++cnt){
				const tmpval = value[cnt];
				if(apiutil.isSafeString(tmpval)){
					pol_cond.push(tmpval);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong condition value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			// now, condition is not supported, then it is always empty.

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not condition array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			pol_cond.push(value);

		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type condition value(' + JSON.stringify(value) + '), then returns default empty array.');
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have condition key, then returns default empty array.');
	}

	// reference
	let	pol_ref: number;
	if(apiutil.findStringInArray(subkeylist, reference_key)){
		const	value = dkcobj.casGet(reference_key);
		if(apiutil.isSafeNumeric(value)){
			const	tmpPolref = apiutil.cvtToNumber(value);
			if(apiutil.isSafeNumber(tmpPolref)){
				pol_ref = tmpPolref;
			}else{
				r3logger.wlog('policy(' + policy_key + ') have wrong reference value(' + JSON.stringify(value) + '), then returns default 0.');
				pol_ref = 0;
			}
		}else{
			r3logger.wlog('policy(' + policy_key + ') have wrong reference value(' + JSON.stringify(value) + '), then returns default 0.');
			pol_ref = 0;
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have reference key, then returns default 0.');
		pol_ref = 0;
	}

	// alias
	const	pol_alias: string[] = [];
	if(apiutil.findStringInArray(subkeylist, alias_key)){
		const	value_raw	= dkcobj.getValue(alias_key, null, true, null);
		const	value		= apiutil.parseJSON(value_raw);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong alias value(' + JSON.stringify(value) + '), then returns default empty array.');

		}else if(apiutil.isArray(value)){
			for(let cnt = 0; cnt < value.length; ++cnt){
				const tmpval = value[cnt];
				if(apiutil.isSafeString(tmpval)){
					pol_alias.push(tmpval);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong alias value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			// alias value is allowed empty array

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not alias array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			pol_alias.push(value);

		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type alias value(' + JSON.stringify(value) + '), then returns default empty array.');
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have alias key, then returns default empty array.');
	}

	// set policy key into result object
	const	policy_data: dkcTypePolicyRawValue = {
		name:		policy,
		effect:		pol_effect,
		action:		pol_action,
		resource:	pol_res,
		condition:	pol_cond,
		reference:	pol_ref,
		alias:		pol_alias
	};
	resobj.policy	= policy_data;

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// check policy raw function
//---------------------------------------------------------
//
// Utility function : This function is reentrant
//
// result	: null	=> policy does not have target resource
//			  true	=> policy has target resource and allows target action
//			  false	=> policy has target resource and does not allow target action
//
// [NOTE]
// The policies do not have a hierarchy, it only accumulates resources array.
// Then we do not need to consider about inheritance with hierarchy, aliases order.
//
// Confirm access to the resource only policy.
// Please keep in mind that we do not check service and tenants.
//
const rawCheckPolicies = (
	dkcobj_permanent:	K2hdkc,
	policy?:			string | null,
	resource?:			string | null,
	action?:			string | null,
	summary_result?:	boolean | null,
	checked_policies?:	string[] | null
): boolean | null => {

	if(!apiutil.isBoolean(summary_result)){
		summary_result = null;							// for default
	}
	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return summary_result;							// return initial result(not modify)
	}
	if(!apiutil.isSafeString(policy) || !apiutil.isSafeString(resource) || !apiutil.isSafeString(action)){
		r3logger.elog('some parameters are wrong : policy=' + JSON.stringify(policy) + ', resource=' + JSON.stringify(resource) + ', action=' + JSON.stringify(action));
		return summary_result;							// return initial result(not modify)
	}
	if(!apiutil.isArray(checked_policies)){
		checked_policies = [];
	}
	if(apiutil.findStringInArray(checked_policies, policy)){
		r3logger.wlog('policy(' + policy + ') already checked, then this policy is included from another resource. Thus skip this for escaping blocking.');
		return summary_result;							// return initial result(not modify)
	}else{
		checked_policies.push(policy);
	}

	//
	// keys
	//
	const	keys			= getK2hr3Keys();
	const	effect_key		= policy + '/' + keys.EFFECT_KW;
	const	action_key		= policy + '/' + keys.ACTION_KW;
	const	resource_key	= policy + '/' + keys.RESOURCE_KW;
	//const	condition_key	= policy + '/' + keys.CONDITION_KW;
	//const	reference_key	= policy + '/' + keys.REFERENCE_KW;
	const	alias_key		= policy + '/' + keys.ALIAS_KW;

	// check result of policy under aliases
	const	alias_val_raw	= dkcobj_permanent.getValue(alias_key, null, true, null);
	const	alias_val		= apiutil.parseJSON(alias_val_raw);
	if(apiutil.isStringArray(alias_val)){
		for(let cnt = 0; cnt < alias_val.length; ++cnt){
			// check alias policy keys
			const	under_result = rawCheckPolicies(dkcobj_permanent, alias_val[cnt], resource, action, summary_result, checked_policies);
			if(null !== under_result){
				// over write summary
				summary_result = under_result;
			}else{
				// aliases does not decide result, so do not change summary.
			}
		}
	}

	// check own resource
	let		is_matched: boolean	= false;
	const	res_val_raw	= dkcobj_permanent.getValue(resource_key, null, true, null);
	const	res_val		= apiutil.parseJSON(res_val_raw);
	if(apiutil.isStringArray(res_val) && apiutil.findStringInArray(res_val, resource)){
		// resource is target for this policy
		const	act_val_raw	= dkcobj_permanent.getValue(action_key, null, true, null);
		const	act_val		= apiutil.parseJSON(act_val_raw);
		// check action
		if(apiutil.isNotEmptyArray(act_val)){
			// check this policy's action
			for(let cnt = 0; cnt < act_val.length; ++cnt){
				if(action === act_val[cnt]){
					// matched
					is_matched = true;
					break;
				}
			}
		}else{
			// has same resource without action, so not match!
		}
	}else{
		// not found resource, so not match!
	}

	// get own effect
	let		effect: boolean | null	= null;
	const	effect_val	= dkcobj_permanent.getValue(effect_key, null, true, null);
	if(keys.VALUE_ALLOW === effect_val){
		effect	= true;
	}else if(keys.VALUE_DENY === effect_val){
		effect	= false;
	}

	// merge own result with under aliases
	//
	// [NOTE]
	// If the policy can be detected, the result is determined according to this policy.
	// In case of undetected, use aliases result and summary result.
	//
	let	result: boolean | null;
	if(true === effect){
		if(is_matched){
			// force allow
			result = true;
		}else{
			// Inherit aliases and summary result
			result = summary_result;
		}
	}else if(false === effect){
		if(is_matched){
			// force deny
			result = false;
		}else{
			// Inherit aliases and summary result
			result = summary_result;
		}
	}else{
		// This policy data could not be used because this data is something wrong,
		// so inherit aliases and summary result
		result = summary_result;
	}
	return result;
};

//
// policy	:	policy yrn string or array
// resource	:	target resource yrn
// action	:	action yrn
//
// return	:	{
//					result:		true(allow)/false(deny)
//					message:	null or error message string
//				}
//
const rawCheckPolicy = (
	policy?:	string | string[] | null,
	resource?:	string | null,
	action?:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(resource) || !apiutil.isSafeString(action)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : resource=' + JSON.stringify(resource) + ', action=' + JSON.stringify(action);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeEntity(policy) || (!apiutil.isSafeString(policy) && !apiutil.isArray(policy))){
		resobj.result	= false;
		resobj.message	= 'policy(' + JSON.stringify(policy) + ') parameter is wrong';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(policy)){
		policy = [policy];
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);			// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	let	one_result: boolean | null = null;
	for(let cnt = 0; cnt < policy.length; ++cnt){
		// check each policy
		one_result = rawCheckPolicies(dkcobj, policy[cnt], resource, action, one_result);
	}
	dkcobj.clean();

	if(null === one_result){
		// could not decide result in policy, so it is deny.
		resobj.result = false;
	}else{
		resobj.result = one_result;
	}
	return resobj;
};

//---------------------------------------------------------
// Create(Add) keystone endpoint
//---------------------------------------------------------
//
// region			:	region for keystone endpoint
// endpoint_uri		:	endpoint url(ex. "https://keystone.xxx.com:5000/")
//						if null is specified and url key is existed, not update.
// ep_type			:	specify endpoint type
//						if null is specified and type key is existed and not update url, not update.
//						if '' is specified, default value is set.
// last_status_code	:	last http(s) status code
//						if null is specified and status key is existed and not update url, not update.
//						if '' is specified, default value is set.
//
// return			:	{
//							result:		true(allow)/false(deny)
//							message:	null or error message string
//						}
//
// [NOTE]
// If url/region is not for keystone, you can specify region name which is
// not using for keystone.
//
const rawCreateKeystoneEndpointWithDkc = (
	dkcobj_permanent:	K2hdkc,
	region?:			string | null,
	endpoint_uri?:		string | null,
	ep_type?:			string | null,
	last_status_code?:	string | number | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(region)){														// other is allowed null
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : region=' + JSON.stringify(region);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}

	let		is_url: boolean;
	if(null === endpoint_uri){
		is_url = false;
	}else if(!apiutil.isSafeString(endpoint_uri)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : endpoint_uri=' + JSON.stringify(endpoint_uri);
		r3logger.elog(resobj.message);
		return resobj;
	}else{
		is_url = true;
	}

	const	keys	= getK2hr3Keys();
	let		is_type: boolean;
	if(null === ep_type){
		is_type = false;
		ep_type	= keys.VALUE_KEYSTONE_NORMAL;												// for default
	}else if(!apiutil.isSafeString(ep_type) || ('' !== ep_type && keys.VALUE_KEYSTONE_NORMAL !== ep_type && keys.VALUE_KEYSTONE_NOPASS !== ep_type && keys.VALUE_KEYSTONE_SUB !== ep_type)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : type=' + JSON.stringify(ep_type);
		r3logger.elog(resobj.message);
		return resobj;
	}else{
		if('' === ep_type){
			ep_type= keys.VALUE_KEYSTONE_NORMAL;												// for default
		}
		is_type = true;
	}

	let	is_last_status: boolean;
	let	_last_status_code: number;
	if(null === last_status_code){
		_last_status_code	= 0;															// for default
		is_last_status		= false;
	}else if(!apiutil.isSafeEntity(last_status_code)){
		resobj.result		= false;
		resobj.message		= 'parameter is wrong : last_status_code=' + JSON.stringify(last_status_code);
		r3logger.elog(resobj.message);
		return resobj;
	}else if(apiutil.isSafeNumeric(last_status_code)){
		const	tmpStatus = apiutil.cvtToNumber(last_status_code);
		if(!apiutil.isSafeNumber(tmpStatus)){
			resobj.result		= false;
			resobj.message		= 'parameter is wrong : last_status_code=' + JSON.stringify(last_status_code);
			r3logger.elog(resobj.message);
			return resobj;
		}
		_last_status_code	= tmpStatus;
		is_last_status		= true;
	}else if(apiutil.isSafeString(last_status_code)){
		if('' !== last_status_code){
			resobj.result		= false;
			resobj.message		= 'parameter is wrong : last_status_code=' + JSON.stringify(last_status_code);
			r3logger.elog(resobj.message);
			return resobj;
		}
		_last_status_code= 0;															// for default
		is_last_status		= true;
	}else{
		resobj.result		= false;
		resobj.message		= 'parameter is wrong : last_status_code=' + JSON.stringify(last_status_code);
		r3logger.elog(resobj.message);
		return resobj;
	}

	//
	// keys
	//
	const	region_key		= keys.KEYSTONE_TOP_KEY + ':' + region;							// "yrn:yahoo::::keystone:<region>"
	const	url_key			= region_key + '/' + keys.URL_KW;								// "yrn:yahoo::::keystone:<region>/url"
	const	type_key		= region_key + '/' + keys.TYPE_KW;								// "yrn:yahoo::::keystone:<region>/type"
	const	status_key		= region_key + '/' + keys.STATUS_KW;							// "yrn:yahoo::::keystone:<region>/status"
	const	date_key		= region_key + '/' + keys.DATE_KW;								// "yrn:yahoo::::keystone:<region>/date"

	// keystone top key : get subkey list
	let	subkeylist	= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keys.KEYSTONE_TOP_KEY, true));	// get subkey list in "yrn:yahoo::::keystone"
	if(apiutil.tryAddStringToArray(subkeylist, region_key)){
		if(!dkcobj_permanent.setSubkeys(keys.KEYSTONE_TOP_KEY, subkeylist)){		// add subkey yrn:yahoo::::keystone:<region> -> yrn:yahoo::::keystone
			resobj.result	= false;
			resobj.message	= 'could not add ' + region_key + ' subkey under ' + keys.KEYSTONE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// region key : get subkey list
	subkeylist		= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(region_key, true));			// get subkey list in "yrn:yahoo::::keystone:<region>"
	let	is_update	= false;
	if(apiutil.tryAddStringToArray(subkeylist, url_key)){
		is_update = true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, type_key)){
		is_update = true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, status_key)){
		is_update = true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, date_key)){
		is_update = true;
	}
	if(is_update){
		if(!dkcobj_permanent.setSubkeys(region_key, subkeylist)){					// add subkey yrn:yahoo::::keystone:<region>/{url, type, status, data} -> yrn:yahoo::::keystone:<region>
			resobj.result	= false;
			resobj.message	= 'could not add ' + url_key + ', ' + type_key + ', ' + status_key + ', ' + date_key + ' subkey under ' + region_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// url
	let	value = dkcobj_permanent.getValue(url_key, null, true, null);
	if(!apiutil.isSafeString(value) || (is_url && value !== endpoint_uri)){
		if(!apiutil.isSafeString(endpoint_uri)){
			resobj.result	= false;
			resobj.message	= region_key + ' does not have endpoint url, but endpoint url(' + JSON.stringify(endpoint_uri) + ') is not specified.';
			r3logger.elog(resobj.message);
			return resobj;
		}
		if(!dkcobj_permanent.setValue(url_key, endpoint_uri)){						// update value url -> yrn:yahoo::::keystone:<region>/url
			resobj.result	= false;
			resobj.message	= 'could not set ' + JSON.stringify(endpoint_uri) + ' value to ' + url_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// type
	value = dkcobj_permanent.getValue(status_key, null, true, null);
	if(!apiutil.isSafeString(value) || (keys.VALUE_KEYSTONE_NORMAL !== value && keys.VALUE_KEYSTONE_NOPASS !== value && keys.VALUE_KEYSTONE_SUB !== value) || is_update || (is_type && value !== ep_type)){
		if(!dkcobj_permanent.setValue(type_key, ep_type)){							// update value type -> yrn:yahoo::::keystone:<region>/type
			resobj.result	= false;
			resobj.message	= 'could not set ' + JSON.stringify(ep_type) + ' value to ' + type_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// status
	value				= dkcobj_permanent.getValue(status_key, null, true, null);
	const	_status_val	= apiutil.cvtToNumber(value);
	if(!apiutil.isSafeNumber(_status_val) || is_update || (is_last_status && _status_val !== _last_status_code)){
		if(!dkcobj_permanent.setValue(status_key, String(_last_status_code))){		// update value status -> yrn:yahoo::::keystone:<region>/status
			resobj.result	= false;
			resobj.message	= 'could not set ' + JSON.stringify(_last_status_code) + ' value to ' + status_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// date
	value = dkcobj_permanent.getValue(date_key, null, true, null);
	if(!apiutil.isSafeString(value) || is_update){
		value = String(apiutil.getUnixtime());												// now date
		if(!dkcobj_permanent.setValue(date_key, value)){							// update value date -> yrn:yahoo::::keystone:<region>/date
			resobj.result	= false;
			resobj.message	= 'could not set ' + JSON.stringify(value) + ' value to ' + date_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}
	return resobj;
};

//
// Wrapper for rawCreateKeystoneEndpoint
//
const rawCreateKeystoneEndpoint = (
	region?:			string | null,
	endpoint_uri?:		string | null,
	ep_type?:			string | null,
	last_status_code?:	string | number | null
): resTypeBaseResult => {

	let	resobj: resTypeBaseResult = {result: true, message: null};

	const	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	resobj = rawCreateKeystoneEndpointWithDkc(dkcobj, region, endpoint_uri, ep_type, last_status_code);

	dkcobj.clean();
	return resobj;
};

//
// Update status code for Multiple endpoints
//
// epmap =	{
//				"region":	{
//								status	:	test result status code
//							},
//				...
//			}
//
const rawUpdateMultiKeystoneEndpointStatus = (epmap: dkcTypeKeystoneEndpointStatuses): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeEntity(epmap)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : epmap=' + JSON.stringify(epmap);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	let	is_error= false;
	for(const region in epmap){
		const	_status = apiutil.cvtToNumber(epmap[region].status);
		if(!apiutil.isSafeNumber(epmap[region].status)){
			r3logger.elog('region(' + region + ') status code is not safe value, so skip this.');
			is_error = true;
			continue;
		}

		// update status code for keystone endpoint by region
		const	res_ep = rawCreateKeystoneEndpointWithDkc(dkcobj, region, null, null, _status);
		if(!res_ep.result){
			r3logger.elog('could not update status(' + JSON.stringify(epmap[region].status) + ') to keystone endpoint(' + JSON.stringify(region) + ') in k2hdkc, but continue...');
			is_error = true;
		}
	}
	dkcobj.clean();

	if(is_error){
		resobj.result	= false;
		resobj.message	= 'failed to set last status for some endpoints)';
		r3logger.elog(resobj.message);
	}
	return resobj;
};

//---------------------------------------------------------
// Remove keystone endpoint
//---------------------------------------------------------
//
// region			:	region for keystone endpoint
//
// return			:	{
//							result:		true(allow)/false(deny)
//							message:	null or error message string
//						}
//
const rawRemoveKeystoneEndpoint = (region?: string | null): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(region)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : region=' + JSON.stringify(region);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys();
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// keys
	//
	const	region_key		= keys.KEYSTONE_TOP_KEY + ':' + region;							// "yrn:yahoo::::keystone:<region>"
	const	url_key			= region_key + '/' + keys.URL_KW;								// "yrn:yahoo::::keystone:<region>/url"
	const	type_key		= region_key + '/' + keys.TYPE_KW;								// "yrn:yahoo::::keystone:<region>/type"
	const	status_key		= region_key + '/' + keys.STATUS_KW;							// "yrn:yahoo::::keystone:<region>/status"
	const	date_key		= region_key + '/' + keys.DATE_KW;								// "yrn:yahoo::::keystone:<region>/date"

	// keystone top key : get subkey list
	const	subkeylist	= dkcobj.getSubkeys(keys.KEYSTONE_TOP_KEY, true);			// get subkey list in "yrn:yahoo::::keystone"
	if(apiutil.removeStringFromArray(subkeylist, region_key)){
		if(!dkcobj.setSubkeys(keys.KEYSTONE_TOP_KEY, subkeylist)){					// update subkey -> yrn:yahoo::::keystone
			resobj.result	= false;
			resobj.message	= 'could not update subkey under ' + keys.KEYSTONE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	// subkeys
	if(!dkcobj.remove(url_key, false)){											// remove yrn:yahoo::::keystone:<region>/url
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + url_key + 'key, probably it is not existed. ';
	}
	if(!dkcobj.remove(type_key, false)){											// remove yrn:yahoo::::keystone:<region>/type
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + type_key + 'key, probably it is not existed. ';
	}
	if(!dkcobj.remove(status_key, false)){											// remove yrn:yahoo::::keystone:<region>/status
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + status_key + 'key, probably it is not existed. ';
	}
	if(!dkcobj.remove(date_key, false)){											// remove yrn:yahoo::::keystone:<region>/date
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + date_key + 'key, probably it is not existed. ';
	}

	// main key
	if(!dkcobj.remove(region_key, false)){											// remove yrn:yahoo::::keystone:<region>
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + region_key + 'key, probably it is not existed. ';
	}

	dkcobj.clean();
	return resobj;
};

//---------------------------------------------------------
// Get keystone endpoint information
//---------------------------------------------------------
//
// region			:	region for keystone endpoint
//
// return			:	null or object
//						{
//							url:	url string
//							type:	keystone type
//							status:	last status code
//							date:	last access unixtime
//						}
//
const rawGetKeystoneEndpoint = (
	dkcobj_permanent:	K2hdkc,
	region?:			string | null
): dkcTypeKeystoneEndpoint | null => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(region)){
		r3logger.elog('parameter is wrong : region=' + JSON.stringify(region));
		return null;
	}

	//
	// keys
	//
	const	keys		= getK2hr3Keys();
	const	region_key	= keys.KEYSTONE_TOP_KEY + ':' + region;								// "yrn:yahoo::::keystone:<region>"
	const	url_key		= region_key + '/' + keys.URL_KW;									// "yrn:yahoo::::keystone:<region>/url"
	const	type_key	= region_key + '/' + keys.TYPE_KW;									// "yrn:yahoo::::keystone:<region>/type"
	const	status_key	= region_key + '/' + keys.STATUS_KW;								// "yrn:yahoo::::keystone:<region>/status"
	const	date_key	= region_key + '/' + keys.DATE_KW;									// "yrn:yahoo::::keystone:<region>/date"

	// keystone top key : get subkey list
	const	subkeylist		= apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(region_key, true));		// get subkey list in "yrn:yahoo::::keystone:<region>"
	if(!apiutil.isNotEmptyArray(subkeylist)){
		// there is no subkeys, it means this key is empty.
		return null;
	}

	// url
	let	url_val: string | null;
	if(apiutil.findStringInArray(subkeylist, url_key)){
		const	value = dkcobj_permanent.getValue(url_key, null, true, null);
		if(!apiutil.isSafeString(value)){
			r3logger.wlog('region/url(' + region + '/' + url_key + ') has empty value.');
			url_val	= null;
		}else{
			url_val	= value;
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have url subkey.');
		url_val		= null;
	}

	// type
	let	type_val: string;
	if(apiutil.findStringInArray(subkeylist, type_key)){
		const	value = dkcobj_permanent.getValue(type_key, null, true, null);
		if(!apiutil.isSafeString(value)){
			r3logger.wlog('region/type(' + region + '/' + type_key + ') has empty value.');
			type_val= keys.VALUE_KEYSTONE_NORMAL;								// default
		}else{
			type_val= value;
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have type subkey.');
		type_val	= keys.VALUE_KEYSTONE_NORMAL;								// default
	}

	// status
	let	status_val: number = 0;													// default
	if(apiutil.findStringInArray(subkeylist, status_key)){
		const	value		= dkcobj_permanent.getValue(status_key, null, true, null);
		const	_tmpStatus	= apiutil.cvtToNumber(value);
		if(apiutil.isSafeNumber(_tmpStatus)){
			status_val	= _tmpStatus;
		}else{
			r3logger.wlog('region/status(' + region + '/' + status_key + ') has not number value.');
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have status subkey.');
	}

	// date
	let	date_val: string;
	if(apiutil.findStringInArray(subkeylist, date_key)){
		const	value = dkcobj_permanent.getValue(date_key, null, true, null);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('region/date(' + region + '/' + date_key + ') has not number value.');
			date_val	= String(0);											// default
		}else{
			date_val	= String(value);
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have date subkey.');
		date_val		= String(0);											// default
	}

	const	result: dkcTypeKeystoneEndpoint = {
		[keys.URL_KW]:		url_val,
		[keys.TYPE_KW]:		type_val,
		[keys.STATUS_KW]:	status_val,
		[keys.DATE_KW]:		date_val
	};

	return result;
};

//
// region			:	region for keystone endpoint
//						specify array for regions, or region string, or null(all)
//
// return			:	{
//							result:		true(allow)/false(deny)
//							message:	null or error message string
//							keystones:	{
//											"region":	{
//															url:	url string
//															type:	keystone type
//															status:	last status code
//															date:	last access unixtime
//														},
//											...
//										}
//						}
//
const rawGetKeystoneEndpoints = (region?: string | string[] | null): resTypeKeystoneEndpoints => {

	const	resobj: resTypeKeystoneEndpoints = {result: true, message: null};

	if(apiutil.isSafeString(region)){
		region = [region];
	}else if(apiutil.isArray(region) && !apiutil.isNotEmptyArray(region)){
		// nothing to do
	}else if(null === region){
		region = null;
	}else{
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : region=' + JSON.stringify(region);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	const	keys		= getK2hr3Keys();
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// keystone top key : get subkey list
	if(null === region){
		region = dkcobj.getSubkeys(keys.KEYSTONE_TOP_KEY, true);					// get subkey list in "yrn:yahoo::::keystone"
	}
	// normalization(only region name)
	if(apiutil.isNotEmptyArray(region)){
		const	tmpregion: string[]	= [];
		const	regionptn = new RegExp('^' + keys.MATCH_ANY_KS_REGION);						// regex = /^yrn:yahoo::::keystone:(.*)/
		for(let cnt = 0; cnt < region.length; ++cnt){
			if(!apiutil.isSafeString(region[cnt])){
				r3logger.wlog('Found wrong region string(' + JSON.stringify(region[cnt]) + ') in keystone region list, skip this.');
				continue;
			}
			const	regionmatches = region[cnt].match(regionptn);
			if(apiutil.isNotEmptyArray(regionmatches) && 2 <= regionmatches.length){
				tmpregion.push(regionmatches[1]);
			}else{
				tmpregion.push(region[cnt]);
			}
		}
		// replace
		region = tmpregion;
	}

	const	keystones: dkcTypeKeystoneEndpoints = {};
	for(let cnt = 0; apiutil.isNotEmptyArray(region) && cnt < region.length; ++cnt){
		if(!apiutil.isSafeString(region[cnt])){
			r3logger.wlog('Found wrong region string(' + JSON.stringify(region[cnt]) + ') in keystone region list, skip this.');
			continue;
		}
		const	region_name	= region[cnt];
		const	region_data = rawGetKeystoneEndpoint(dkcobj, region_name);
		if(null === region_data){
			r3logger.wlog('Could not get region(' + JSON.stringify(region_name) + ') data, skip this');
			continue;
		}
		keystones[region_name] = region_data;
	}
	dkcobj.clean();

	if(0 === Object.keys(keystones).length){
		resobj.result	= false;
		resobj.message	= 'There is not any keystone.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	resobj.keystones = keystones;

	return resobj;
};

//---------------------------------------------------------
// Get list for key raw function
//---------------------------------------------------------
//
// Get children list object by tenant and path
//
// tenant		: tenant name(must be specified)
// service		: service name(if service+tenant, specify this)
// child_type	: type for list up
// path			: sub path for types. if child_type is service, this value is ignored
//
//	return object:
//		{
//			"result":	boolean								true or false
//			"message":	string or null						error message
//			"children":	[									sorted by name object list
//							{
//								name:		'name',			child name
//								owner:		true,			this value is existed, if tenant is service owner when type is service.
//								children:	[...]			grandchild....
//							},
//								.
//								.
//								.
//							{
//								name:		'name',
//								children:	[...]
//							}
//						]
//		}
//
// [NOTE]
// if type is 'service'(service parameter is null), returns service list for tenant.
//
const rawGetChildrenList = (
	tenant?:		string | null,
	service?:		string | null,
	child_type?:	string | null,
	path?:			string | null,
	is_expand?:		boolean | null
): resTypeChildrenTree => {

	const	resobj: resTypeChildrenTree = {result: true, message: null};

	if(!apiutil.isSafeString(tenant) || !apiutil.isSafeString(child_type)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', type=' + JSON.stringify(child_type);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(path)){												// allow path is empty
		path			= '';
	}else{
		path			= ':' + path;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand		= false;													// default not expand
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	const	keys		= getK2hr3Keys(null, tenant, service);
	let		keypath: string;
	if(keys.TYPE_ROLE === child_type){
		keypath		= keys.ROLE_TOP_KEY + path;
	}else if(keys.TYPE_RESOURCE === child_type){
		keypath		= keys.RESOURCE_TOP_KEY + path;
	}else if(keys.TYPE_POLICY === child_type){
		keypath		= keys.POLICY_TOP_KEY + path;
	}else if(keys.TYPE_SERVICE === child_type){
		//
		// For service case, we must check static two key path.
		// Set first path is set here.
		//
		keypath		= keys.TENANT_SERVICE_KEY;										// read from "yrn:yahoo:::<tenant>:service"
	}else{
		resobj.result	= false;
		resobj.message	= 'type parameter value is wrong : ' + JSON.stringify(child_type);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);			// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get children
	const	children: dkcTypeChildrenTree[]	= [];
	if(!rawGetChildrenListWithDkc(dkcobj, child_type, keypath, is_expand, children)){
		resobj.result	= false;
		resobj.message	= 'Could not get child list for ' + keypath;
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(keys.TYPE_SERVICE === child_type){
		//
		// check second path for services here.
		//
		keypath	= keys.ANYTENANT_SERVICE_KEY;										// read from "yrn:yahoo::::service::anytenant"
		if(!rawGetChildrenListWithDkc(dkcobj, child_type, keypath, is_expand, children)){
			resobj.result	= false;
			resobj.message	= 'Could not get child list for ' + keypath;
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}

		//
		// Check service owner(If tenant is owner, add special key)
		//
		for(let cnt = 0; cnt < children.length; ++cnt){
			if(rawCheckTenantInServiceOwner(dkcobj, tenant, children[cnt].name)){
				// tenant is service owner
				children[cnt].owner = true;
			}
		}
	}
	resobj.children	= children;

	dkcobj.clean();
	return resobj;
};

//
// Raw Get children role/resource/policy list by tenant and path
//
//	return array:
//		[									sorted by name object list
//			{
//				name:		'name',			child name
//				children:	[...]			grandchild....
//			},
//				.
//				.
//				.
//			{
//				name:		'name',
//				children:	[...]
//			}
//		]
//
const rawGetChildrenListWithDkc = (
	dkcobj_permanent:	K2hdkc,
	child_type?:		string | null,
	keypath?:			string | null,
	is_expand?:			boolean | null,
	children?:			dkcTypeChildrenTree[]
): boolean => {

	if(!apiutil.isPlainObject(dkcobj_permanent) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(keypath) || !apiutil.isSafeString(child_type)){
		r3logger.elog('some parameters are wrong : keypath=' + JSON.stringify(keypath) + ', type=' + JSON.stringify(child_type));
		return false;
	}
	if(!apiutil.isBoolean(is_expand)){
		is_expand	= false;														// default not expand
	}
	if(!apiutil.isArray(children)){
		children	= [];															// escapes error but it do not return values....
	}

	const	keys	= getK2hr3Keys();
	if(keys.TYPE_ROLE !== child_type && keys.TYPE_RESOURCE !== child_type && keys.TYPE_POLICY !== child_type && keys.TYPE_SERVICE !== child_type){
		r3logger.elog('type parameter value is wrong : ' + JSON.stringify(child_type));
		return false;
	}

	// get subkey list
	const	subkeylist = apiutil.getSafeStringArray(dkcobj_permanent.getSubkeys(keypath, true));
	if(!apiutil.isNotEmptyArray(subkeylist)){
		return true;
	}

	// filter
	const	serviceptn	= new RegExp('^' + keys.MATCH_ANY_SERVICE_MASTER);			// regex = /^yrn:yahoo::::service:(.*)/
	for(let cnt = 0; apiutil.isNotEmptyArray(subkeylist) && cnt < subkeylist.length; ++cnt){
		let	childpath: string;

		if(keys.TYPE_SERVICE !== child_type){
			// key must be under parent key.
			if(0 !== subkeylist[cnt].indexOf(apiutil.getSafeString(keypath))){
				r3logger.wlog('unknown key path' + subkeylist[cnt] + ' in ' + keypath + ' child, then skip this.');
				continue;
			}
			childpath = subkeylist[cnt].substr(apiutil.getSafeString(keypath).length);
			if(apiutil.isSafeString(childpath) && (':' === childpath[0] || '/' === childpath[0])){
				childpath = childpath.substr(1);
			}
			if(!apiutil.isSafeString(childpath)){
				r3logger.wlog('path' + subkeylist[cnt] + ' in ' + keypath + ' child is something wrong, then skip this.');
				continue;
			}
			// check reserved word
			if(keys.TYPE_ROLE			=== child_type &&
				(	keys.ALIAS_KW		=== childpath	||
					keys.HOSTS_KW		=== childpath	||
					keys.ID_KW			=== childpath	||
					keys.POLICIES_KW	=== childpath	||
					keys.REFERENCE_KW	=== childpath	)
			){
				continue;
			}else if(keys.TYPE_RESOURCE === child_type &&
				(	keys.ALIAS_KW		=== childpath	||
					keys.KEYS_KW		=== childpath	||
					keys.TYPE_KW		=== childpath	||
					keys.EXPIRE_KW		=== childpath	||
					keys.REFERENCE_KW	=== childpath	)
			){
				continue;
			}else if(keys.TYPE_POLICY	=== child_type &&
				(	keys.ALIAS_KW		=== childpath	||
					keys.EFFECT_KW		=== childpath	||
					keys.ACTION_KW		=== childpath	||
					keys.RESOURCE_KW	=== childpath	||
					keys.CONDITION_KW	=== childpath	||
					keys.REFERENCE_KW	=== childpath	)
			){
				continue;
			}
		}else{
			//
			// when service type, key is "yrn:yahoo:::<tenant>:service" or "yrn:yahoo::::service::anytenant"
			//
			const	servicematches	= subkeylist[cnt].match(serviceptn);			// check key is under "yrn:yahoo::::service"
			if(!apiutil.isNotEmptyArray(servicematches) || servicematches.length < 2 || !apiutil.isSafeString(servicematches[1])){
				r3logger.wlog('key path' + JSON.stringify(subkeylist[cnt]) + ' in ' + JSON.stringify(keypath) + ' child is not under service master key, then skip this.');
				continue;
			}
			childpath = servicematches[1];
		}

		//
		// [NOTE] case of TYPE_SERVICE does not need to skip any key.
		//
		let	grandson: dkcTypeChildrenTree[] = [];
		if(is_expand && keys.TYPE_POLICY !== child_type && keys.TYPE_SERVICE !== child_type){
			// reentrant
			if(!rawGetChildrenListWithDkc(dkcobj_permanent, child_type, subkeylist[cnt], true, grandson)){
				r3logger.elog('Could not get grandson for ' + subkeylist[cnt] + ', but continue...');
				grandson = [];
			}
		}

		//
		// Merge or Add children
		//
		let	find_same_item = false;
		for(let cnt2 = 0; cnt2 < children.length; ++cnt2){
			if(!apiutil.isSafeEntity(children[cnt2]) || !apiutil.isSafeString(children[cnt2].name)){
				// why?
				continue;
			}
			if(children[cnt2].name === childpath){
				if(!apiutil.isArray(children[cnt2].children) || children[cnt2].children.length < grandson.length){
					// replace(this is not best way)
					children[cnt2].children = grandson;
				}else{
					// [TODO]
					// Must merge array here.
				}
				find_same_item = true;
				break;
			}
		}
		if(!find_same_item){
			children.push({
				name:		childpath,
				children:	grandson
			});
		}
	}
	// sort
	children.sort(rawCompareChildrenListName);

	return true;
};

const rawCompareChildrenListName = (
	child1:	dkcTypeChildrenTree,
	child2:	dkcTypeChildrenTree
): number => {

	if(child1.name < child2.name){
		return -1;
	}else if(child2.name < child1.name){
		return 1;
	}else{	// child2.name === child1.name
		return 0;
	}
};

//=========================================================
// Export functions
//=========================================================
export const k2hr3 = {
	//---------------------------------------------------------
	// Initialize tenant/user/service
	//---------------------------------------------------------
	//
	// These functions initializing tenant is without service.
	//
	initTenant:						(tenantname?: string | null, id?: string | number | null, desc?: string | null, display?: string | null, user?: string | null, tenant_users?: string[] | string | null): resTypeBaseResult => rawCreateTenant(user, tenantname, id, desc, display, tenant_users, true),
	initUser:						rawCreateUser,
	initUserTenant:					(user?: string | null, userid?: string | number | null, username?: string | null, tenant?: string | null, tenantid?: string | number | null, tenantdesc?: string | null, tenantdisplay?: string | null): resTypeBaseResult => {
		//
		// Must initialize service key before calling this if specified service parameter
		//
		let	resobj = rawCreateTenant(user, tenant, tenantid, tenantdesc, tenantdisplay, user, false);
		if(resobj.result){
			resobj = rawCreateUser(user, userid, username, tenant);
		}
		return resobj;
	},

	findTenant:							rawFindTenant,
	listLocalTenant:					rawListLocalTenant,
	removeUserFromLocalTenant:			rawRemoveUserFromLocalTenant,
	removeLocalTenant:					rawRemoveLocalTenant,
	getUserId:							rawGetUserId,
	removeComprehensionByNewTenants:	rawRemoveComprehensionByNewTenants,

	// type check
	isDkcTypeTenantInfo:				rawIsDkcTypeTenantInfo,
	isDkcTypeTenantInfoList:			rawIsDkcTypeTenantInfoList,
	isDkcTypeServiceRawValue:			rawIsDkcTypeServiceRawValue,
	isDkcTypeResourceRawKeysValue:		rawIsDkcTypeResourceRawKeysValue,
	isDkcTypeChildrenTree:				rawIsDkcTypeChildrenTree,
	isResTypeChildrenTree:				rawIsResTypeChildrenTree,

	//---------------------------------------------------------
	// Service & ACR
	//---------------------------------------------------------
	//
	// [NOTE]
	// Create owner tenant before creating service
	//
	initService:						rawCreateService,
	updateServiceVerify:				rawCreateService,
	getService:							rawGetServiceAll,
	removeService:						rawRemoveServiceAll,
	allowTenantToService:				rawAllowTenantToService,
	denyTenantFromService:				rawDenyTenantFromService,
	checkTenantInService:				rawCheckTenantInServiceMember,
	checkTenantInServiceOwner:			(service?: string | null, tenant?: string | null): boolean => {
		const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
		const	result	= rawCheckTenantInServiceOwner(dkcobj, tenant, service);
		dkcobj.clean();
		return result;
	},

	//
	// [NOTE]	Must initialize User/Tenant before calling this function.
	//
	createServiceTenantByUser:			rawCreateServiceTenantByUser,
	createServiceTenantByUnscopedToken:	rawCreateServiceTenantByUnscopedToken,
	createServiceTenantByScopedToken:	rawCreateServiceTenantByScopedToken,
	removeServiceTenant:				rawRemoveServiceTenant,
	getServiceTenantResources:			rawGetServiceTenantResources,

	//---------------------------------------------------------
	// Roles
	//---------------------------------------------------------
	//
	// [NOTE]	Must initialize User/Tenant before calling this function.
	//
	setRoleAll:							rawCreateRole,
	removeRole:							rawRemoveRole,
	updateRolePolicies:					(user?: string | null, tenant?: string | null, role?: string | null, policies?: string | string[] | null): resTypeBaseResult => rawCreateRole(user, tenant, role, policies, null, null, false, null, false),
	clearRolePolicies:					(user?: string | null, tenant?: string | null, role?: string | null): resTypeBaseResult => rawCreateRole(user, tenant, role, '', null, null, false, null, false),
	updateRoleHosts:					(user?: string | null, tenant?: string | null, role?: string | null, hostnames?: string | dkcTypeHostRawValueSet | dkcTypeHostRawValueSet[] | null, clear_old_hostnames?: boolean | null, ips?: string | dkcTypeHostRawValueSet | dkcTypeHostRawValueSet[] | null, clear_old_ips?: boolean | null): resTypeBaseResult => rawCreateRole(user, tenant, role, null, null, hostnames, clear_old_hostnames, ips, clear_old_ips),
	clearRoleHosts:						(user?: string | null, tenant?: string | null, role?: string | null): resTypeBaseResult => rawCreateRole(user, tenant, role, null, null, '', true, null, false),
	updateRoleAlias:					(user?: string | null, tenant?: string | null, role?: string | null, alias_roles?: string | string[] | null): resTypeBaseResult => rawCreateRole(user, tenant, role, null, alias_roles, null, false, null, false),
	clearRoleAlias:						(user?: string | null, tenant?: string | null, role?: string | null): resTypeBaseResult => rawCreateRole(user, tenant, role, null, '', null, false, null, false),

	//
	// Get role
	//
	// This returns role data from specified role yrn full path.
	// If is_expand is true, the result is expanded all role(dependency relationship(inheritance
	// including alias expansion of parent key) and data expanded by own alias) data from target
	// role.
	// If it is false, the result has original data which target role has, and with alias
	// array which target role has.
	//
	//	return object:
	//		{
	//			"result":	true or false
	//			"message":	error message
	//			"role":		{
	//				policies:	array,
	//				aliases:	array								<--- only not expand
	//				hosts: {										<--- only not expand
	//					'hostnames': [								hostname array or empty array
	//						<hostname> <port> <cuk> <extra> <tag> <inboundip> <outboundip>,		(if any port, port is *)
	//						...
	//					],
	//					'ips': [									ip address array or empty array
	//						<ip address> <port> <cuk> <extra> <tag> <inboundip> <outboundip>,	(if any port, port is *)
	//						...
	//					]
	//				}
	//			}
	//		}
	//
	// [NOTE] Inheritance roles
	// If the role key is "Role A/Role B/Role C", "Role C" has dependency data by
	// "Role A/Role B" role.("Role A/Role B" includes "Role A" role, too)
	//
	getRole:							rawGetRole,

	// [NOTE]
	// Now do not set hosts to role under service.
	// But if need to set hosts to it, you can set role as full yrn role path.
	//
	addHost:							(tenant?: string | null, role?: string | null, hostname?: string | string[] | null, ip?: string | string[] | null, port?: string | number | null, cuk?: string | null, extra?: string | null, tag?: string | null, inboundip?: string | null, outboundip?: string | null): resTypeBaseResult => rawAddHost(tenant, role, null, hostname, ip, port, cuk, extra, tag, inboundip, outboundip),

	// [NOTE]
	// Now do not set hosts to role under service, then we do not need to remove
	// hosts under service + tenant.
	// But if need to remove hosts to it, you can set role as full yrn role path.
	//
	removeHost:							(tenant?: string | null, role?: string | null, target?: string | string[] | null, tg_port?: number | null, tg_cuk?: string | null, req_ip?: string | null, req_port?: number | null, req_cuk?: string | null): resTypeBaseResult => rawRemoveHost(tenant, null, role, target, tg_port, tg_cuk, req_ip, req_port, req_cuk),
	removeIpsByCuk:						rawRemoveIpsByCuk,
	isKubernetesCuk:					rawIsKubernetesCuk,
	compareIpAndKubernetesCuk:			rawCompareIpAndKubernetesCuk,
	getExtraFromCuk:					rawGetExtraFromCuk,

	//
	// [NOTE]
	// This function does not perform asynchronous processing, because many k2hdkc handles
	// are required for it.
	// It is recommended to start the process of enumerating IP addresses as a separate process.
	//
	getAllIpDatasByCuk:					(is_openstack?: boolean | null): resTypeGetAllIpDatas => {
		let		extra: string;
		const	keys = getK2hr3Keys();
		if(!apiutil.isBoolean(is_openstack) || (apiutil.isBoolean(is_openstack) && is_openstack)){
			extra = keys.VALUE_OPENSTACK_V1;		// default
		}else{
			extra = keys.VALUE_K8S_V1;
		}
		return rawGetAllIpDatasByCuk(extra);
	},

	//
	// [NOTE]
	// This function does not perform asynchronous processing, because many k2hdkc handles
	// are required for it.
	// It is recommended to start the process of enumerating IP addresses as a separate process.
	//
	removeIpAddressWithCuk:				rawRemoveIpAddressWithCuk,

	// [NOTE]
	// Now do not set hosts to role under service, then we do not need to remove
	// hosts under service + tenant.
	// But if need to remove hosts to it, you can set role as full yrn role path.
	//
	findHost:							(tenant?: string | null, role?: string | null, hostname?: string | string[] | null, ip?: string | string[] | null, port?: number | null, cuk?: string | null, is_strict?: boolean | null): resTypeFindHost => rawFindHost(tenant, null, role, hostname, ip, port, cuk, is_strict),
	findRoleHost:						(dkcobj_permanent: K2hdkc | null, role_key?: string | null, hostname?: string | string[] | null, ip?: string | string[] | null, port?: number | null, cuk?: string | null): dkcTypeHostRawValueSet[] | null => {
		let	dkcobj: K2hdkc;
		if(null !== dkcobj_permanent && apiutil.isPlainObject(dkcobj_permanent)){
			dkcobj = dkcobj_permanent;
		}else{
			dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
		}
		const	result = rawFindRoleHost(dkcobj, role_key, hostname, ip, port, cuk, false);	// not strictly check
		if(null === dkcobj_permanent || !apiutil.isPlainObject(dkcobj_permanent)){
			dkcobj.clean();
		}
		return result;
	},

	//---------------------------------------------------------
	// Resources
	//---------------------------------------------------------
	//
	// [NOTE]	Must initialize User/Tenant before calling this function.
	//
	setResourceAll:						rawCreateResourceByUser,
	setResourceAllByRole:				rawCreateResourceByRole,
	setResourceAllByIP:					rawCreateResourceByIP,
	updateResourceValue:				(user?: string | null, tenant?: string | null, resourcename?: string | null, res_type?: string | null, data?: valTypeAll): resTypeBaseResult => rawCreateResourceByUser(user, tenant, resourcename, res_type, data, null, null),
	clearResourceValue:					(user?: string | null, tenant?: string | null, resourcename?: string | null): resTypeBaseResult => {
		const	keys = getK2hr3Keys();
		return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, '', null, null);
	},
	updateResourceKeys:					(user?: string | null, tenant?: string | null, resourcename?: string | null, resource_keys?: string | dkcTypeResourceRawKeysValue | null): resTypeBaseResult => {
		const	keys = getK2hr3Keys();
		return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, resource_keys, null);
	},
	clearResourceKeys:					(user?: string | null, tenant?: string | null, resourcename?: string | null): resTypeBaseResult => {
		const	keys = getK2hr3Keys();
		return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, '', null);
	},
	updateResourceAlias:				(user?: string | null, tenant?: string | null, resourcename?: string | null, alias_resources?: string | string[] | null): resTypeBaseResult => {
		const	keys = getK2hr3Keys();
		return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, null, alias_resources);
	},
	clearResourceAlias:					(user?: string | null, tenant?: string | null, resourcename?: string | null): resTypeBaseResult => {
		const	keys = getK2hr3Keys();
		return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, null, '');
	},

	//
	// Get resource
	//
	// This returns resource data from specified resource yrn full path.
	// If is_expand is true, the result is expanded all resource(dependency relationship(inheritance
	// including alias expansion of parent key) and data expanded by own alias) data from target
	// resource.
	// If it is false, the result has original data which target resource has, and with alias
	// array which target resource has.
	//
	//	return object:
	//		{
	//			"result":	true or false
	//			"message":	error message
	//			"resource":	{
	//							string:		"string",
	//							object:		object
	//							keys:		object
	//							aliases:	array				<--- only not expand
	//						}
	//		}
	//
	// [NOTE] Inheritance resources
	// If the resource key is "Resource A/Resource B/Resource C", "Resource C" has dependency data by
	// "Resource A/Resource B" resource.("Resource A/Resource B" includes "Resource A" resource, too)
	//
	getResource:					rawGetResourceByUser,

	// [NOTE]
	// role is yrn full path which does not include service.
	//
	getResourceByRole:				rawGetResourceByRole,
	getResourceByIP:				rawGetResourceByIP,
	removeResource:					rawRemoveResourceByUser,
	removeResourceByRole:			rawRemoveResourceByRole,
	removeResourceByIP:				rawRemoveResourceByIP,
	checkResource:					rawCheckResourceByUser,

	// [NOTE]
	// role is yrn full path which does not include service.
	//
	checkResourceByRole:			rawCheckResourceByRole,
	checkResourceByIP:				rawCheckResourceByIP,

	//---------------------------------------------------------
	// Policies
	//---------------------------------------------------------
	//
	// [NOTE]	Must initialize User/Tenant before calling this function.
	//
	setPolicyAll:					rawCreatePolicy,
	removePolicy:					(user?: string | null, tenant?: string | null, policy?: string | null): resTypeBaseResult => rawRemovePolicy(user, tenant, null, policy),
	updatePolicyEffect:				(user?: string | null, tenant?: string | null, policy?: string | null, is_allow?: boolean | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, is_allow, null, null, null, null),
	updatePolicyAllow:				(user?: string | null, tenant?: string | null, policy?: string | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, true, null, null, null, null),
	updatePolicyDeny:				(user?: string | null, tenant?: string | null, policy?: string | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, false, null, null, null, null),
	updatePolicyAction:				(user?: string | null, tenant?: string | null, policy?: string | null, action?: string | string[] | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, action, null, null, null),
	clearPolicyAction:				(user?: string | null, tenant?: string | null, policy?: string | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, '', null, null, null),
	updatePolicyResource:			(user?: string | null, tenant?: string | null, policy?: string | null, resource?: string | string[] | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, null, resource, null, null),
	clearPolicyResource:			(user?: string | null, tenant?: string | null, policy?: string | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, null, '', null, null),
	updatePolicyCondition:			(user?: string | null, tenant?: string | null, policy?: string | null, condition?: string | string[] | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, null, null, condition, null),
	clearPolicyCondition:			(user?: string | null, tenant?: string | null, policy?: string | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, null, null, '', null),
	updatePolicyAlias:				(user?: string | null, tenant?: string | null, policy?: string | null, alias_policy?: string | string[] | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, null, null, null, alias_policy),
	clearPolicyAlias:				(user?: string | null, tenant?: string | null, policy?: string | null): resTypeBaseResult => rawCreatePolicy(user, tenant, policy, null, null, null, null, ''),
	getPolicyAll:					rawGetPolicyAll,
	checkPolicy:					rawCheckPolicy,
	incDecPolicyReference:			(policy?: string | null, increment?: boolean | null): resTypeBaseResult => {
		const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);			// use permanent object(need to clean)
		const	result	= rawIncDecReferenceCount(dkcobj, policy, increment);
		dkcobj.clean();
		return result;
	},

	//---------------------------------------------------------
	// Keystone Endpoint
	//---------------------------------------------------------
	setKeystoneEndpointAll:				rawCreateKeystoneEndpoint,
	removeKeystoneEndpoint:				rawRemoveKeystoneEndpoint,
	updateKeystoneEndpointUrl:			(region?: string | null, endpoint_uri?: string | null, ep_type?: string | null): resTypeBaseResult => rawCreateKeystoneEndpoint(region, endpoint_uri, ep_type, ''),
	updateKeystoneEndpointStatus:		(region?: string | null, last_status_code?: string | number | null): resTypeBaseResult => rawCreateKeystoneEndpoint(region, null, null, last_status_code),
	updateMultiKeystoneEndpointStatus:	rawUpdateMultiKeystoneEndpointStatus,
	getKeystoneEndpointAll:				(): resTypeKeystoneEndpoints => rawGetKeystoneEndpoints(null),
	getKeystoneEndpoint:				rawGetKeystoneEndpoints,

	//---------------------------------------------------------
	// Children List
	//---------------------------------------------------------
	getChildrenList:				rawGetChildrenList,

	//---------------------------------------------------------
	// Utility for initializing
	//---------------------------------------------------------
	initKeyHierarchy:				rawInitKeyHierarchy,

	//---------------------------------------------------------
	// Utility for k2hdkc
	//---------------------------------------------------------
	getK2hdkc:						(autorejoin?: boolean, no_giveup_rejoin?: boolean): K2hdkc | null => {
		if(null === dkcconf || null === dkcport){
			r3logger.elog('Configuration is not set.');
			return null;
		}
		const	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, autorejoin, no_giveup_rejoin);
		if(!rawInitKeyHierarchy(dkcobj)){
			r3logger.elog('Not initialize yet.');
			dkcobj.clean();
			return null;
		}
		return dkcobj;
	},

	//---------------------------------------------------------
	// Get All tenant name list
	//---------------------------------------------------------
	getAllTenants:					(): string[] | null => {
		const	keys	= getK2hr3Keys();
		const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);
		if(!rawInitKeyHierarchy(dkcobj)){
			dkcobj.clean();
			return null;
		}
		const	tenantlist	= dkcobj.getSubkeys(keys.NO_SERVICE_REGION_KEY, true);
		dkcobj.clean();
		if(apiutil.isNotEmptyArray(tenantlist)){
			// cut NO_SERVICE_TENANT_KEY
			for(let cnt = 0; cnt < tenantlist.length; ++cnt){
				if(keys.NO_SERVICE_TENANT_KEY == tenantlist[cnt]){
					tenantlist.splice(cnt, 1);
					break;
				}
			}
			if(0 < tenantlist.length){
				return tenantlist;
			}
		}
		return null;
	},

	//---------------------------------------------------------
	// Get All Service name list
	//---------------------------------------------------------
	getAllServices:					(): string[] | null => {
		const	keys	= getK2hr3Keys();
		const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);
		if(!rawInitKeyHierarchy(dkcobj)){
			dkcobj.clean();
			return null;
		}
		const	servicelist	= dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true);
		dkcobj.clean();
		if(apiutil.isNotEmptyArray(servicelist)){
			return servicelist;
		}else{
			return null;
		}
	},

	//---------------------------------------------------------
	// Get All user list
	//---------------------------------------------------------
	getAllUsers:					(): string[] | null => {
		const	keys	= getK2hr3Keys();
		const	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);
		if(!rawInitKeyHierarchy(dkcobj)){
			dkcobj.clean();
			return null;
		}
		const	tenantlist	= dkcobj.getSubkeys(keys.USER_TOP_KEY, true);
		dkcobj.clean();
		if(apiutil.isNotEmptyArray(tenantlist)){
			return tenantlist;
		}else{
			return null;
		}
	}
};

//
// Default
//
export default k2hr3;

//=========================================================
// Export types
//=========================================================
//
// Variables
//
export {
	dkcTypeHostRawValue,
	dkcTypeHostRawValueSet,
	dkcTypeOneRoleHostBaseValue,
	dkcTypeKeystoneEndpointStatus,
	dkcTypeKeystoneEndpointStatuses,
	dkcTypeChildrenTree,
	dkcTypeTenantInfo,
	dkcTypeTenantInfoList,
	dkcTypePolicyRawValue,
	dkcTypeResourceRawKeysValue,
	dkcTypeResourceRawDataValue,
	dkcTypeRoleHostNormalList,
	dkcTypeRoleValue,
	dkcTypeServiceRawValue,
	dkcTypeKeystoneEndpoint,
	dkcTypeKeystoneEndpoints,
	resTypeBasicUserInfo,
	resTypeChildrenTree,
	resTypeFindHost,
	resTypeFindTenant,
	resTypeGetAllIpDatas,
	resTypeGetPolicyValue,
	resTypeGetResource,
	resTypeGetResourceElementValue,
	resTypeGetRole,
	resTypeGetServiceAll,
	resTypeGetServiceTenantResources,
	resTypeKeystoneEndpoints,
	resTypeLocalTenantList
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
