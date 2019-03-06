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

var	apiutil	= require('./k2hr3apiutil');

//---------------------------------------------------------
// key path/value/keywords in k2hdkc
//---------------------------------------------------------
//
// YRN Format
//
// yrn:<partition or domain>:<service>:<region>:<tenant or account id>:<type>{:<paths>}>
//
//	arn						: Tag for Yahoo Resource Name
//	partition or domain		: Partition or Domain name(ex. "yahoo")
//	service					: Service name(ex. "myservice")
//	region					: Region name(ex. "west-east-region")
//	tenant or account id	: Tenant name or Account id(ex, "1234" or "myname")
//	type					: YRN type, "user", "token", "action", "keystone", "service", "role", "policy", "resource".
//	paths					: Path(separator is "/") under YRN type
//
exports.getK2hr3Keys = function(user, tenant, service)
{
	var	keywords = {
		// common types
		'TYPE_ROLE':					'role',
		'TYPE_RESOURCE':				'resource',
		'TYPE_POLICY':					'policy',
		'TYPE_SERVICE':					'service',															// Using in list API

		// common values
		'VALUE_WILDCARD':				'*',
		'VALUE_TRUE':					'true',
		'VALUE_FALSE':					'false',
		'VALUE_ENABLE':					'enable',
		'VALUE_DISABLE':				'disable',
		'VALUE_ALLOW':					'allow',
		'VALUE_DENY':					'deny',
		'VALUE_READ':					'read',
		'VALUE_WRITE':					'write',
		'VALUE_ANY_PORT':				'*',
		'VALUE_HOST_SEP':				' ',
		'VALUE_HOST_REGSEP':			':',
		'VALUE_ANYDATA_TYPE':			'anytype',
		'VALUE_STRING_TYPE':			'string',
		'VALUE_OBJECT_TYPE':			'object',
		'VALUE_KEYS_TYPE':				'keys',
		'VALUE_ALIAS_TYPE':				'aliases',
		'VALUE_EXPIRE_TYPE':			'expire',
		'VALUE_POLICIES_TYPE':			'policies',
		'VALUE_HOSTS_TYPE':				'hosts',
		'VALUE_HOSTNAMES_TYPE':			'hostnames',
		'VALUE_IPS_TYPE':				'ips',
		'VALUE_KEYSTONE_NORMAL':		'kstype_normal',
		'VALUE_KEYSTONE_NOPASS':		'kstype_nopasswd',
		'VALUE_KEYSTONE_SUB':			'kstype_substitute',
		'VALUE_OPENSTACK_V1':			'openstack-auto-v1',												// used/set from k2hr3-init.sh

		// common keywords( part of keyname )
		'POLICIES_KW':					'policies',
		'SERVICE_KW':					'service',
		'HOSTS_KW':						'hosts',
		'HOSTS_NAME_KW':				'name',
		'HOSTS_IP_KW':					'ip',
		'KEYS_KW':						'keys',
		'TYPE_KW':						'type',
		'EXPIRE_KW':					'expire',
		'EFFECT_KW':					'effect',
		'ACTION_KW':					'action',
		'RESOURCE_KW':					'resource',
		'CONDITION_KW':					'condition',
		'REFERENCE_KW':					'reference',
		'ID_KW':						'id',
		'ALIAS_KW':						'@',
		'URL_KW':						'url',
		'STATUS_KW':					'status',
		'DATE_KW':						'date',
		'SEED_KW':						'seed',

		// ACR keywords
		'ACR_POLICY_KW':				'acr-policy',
		'ACR_ROLE_KW':					'acr-role',
		'ACR_RESOURCE_NAME_KEY':		'name',
		'ACR_RESOURCE_EXPIRE_KEY':		'expire',
		'ACR_RESOURCE_TYPE_KEY':		'type',
		'ACR_RESOURCE_DATA_KEY':		'data',
		'ACR_RESOURCE_KEYS_KEY':		'keys',

		// common key names
		'YRN_KEY':						'yrn',
		'DOMAIN_KEY':					'yrn:yahoo',
		'NO_SERVICE_KEY':				'yrn:yahoo:',
		'NO_SERVICE_REGION_KEY':		'yrn:yahoo::',
		'NO_SERVICE_TENANT_KEY':		'yrn:yahoo:::',
		'USER_TOP_KEY':					'yrn:yahoo::::user',
		'TOKEN_TOP_KEY':				'yrn:yahoo::::token',
		'TOKEN_USER_TOP_KEY':			'yrn:yahoo::::token:user',
		'TOKEN_ROLE_TOP_KEY':			'yrn:yahoo::::token:role',
		'ACTION_TOP_KEY':				'yrn:yahoo::::action',
		'ACTION_READ_KEY':				'yrn:yahoo::::action:read',
		'ACTION_WRITE_KEY':				'yrn:yahoo::::action:write',
		'KEYSTONE_TOP_KEY':				'yrn:yahoo::::keystone',
		'IAAS_TOP_KEY':					'yrn:yahoo::::iaas',
		'IAAS_OS_TOP_KEY':				'yrn:yahoo::::iaas:openstack',
		'MASTER_SERVICE_TOP_KEY':		'yrn:yahoo::::service',
		'ANYTENANT_SERVICE_TOP_KEY':	'yrn:yahoo::::service:',
		'ANYTENANT_SERVICE_KEY':		'yrn:yahoo::::service::anytenant',

		// match regex
		'MATCH_ANY_SERVICE_MASTER':		'yrn:yahoo::::service:(.*)',
		'MATCH_ANY_IAAS':				'yrn:yahoo::::iaas:(.*)',
		'MATCH_ANY_IAAS_OS':			'yrn:yahoo::::iaas:openstack:(.*)',
		'MATCH_ANY_SERVICE_TENANT':		'yrn:yahoo:(.*)::(.*):(.*)',
		'MATCH_ANY_TENANT_MAIN':		'yrn:yahoo:(.*)::(.*)',
		'MATCH_ANY_TENANT_ROLE':		'yrn:yahoo:(.*)::(.*):role:(.*)',
		'MATCH_ANY_TENANT_POLICY':		'yrn:yahoo:(.*)::(.*):policy:(.*)',
		'MATCH_ANY_TENANT_RESOURCE':	'yrn:yahoo:(.*)::(.*):resource:(.*)',
		'MATCH_ANY_TENANT_RES_DATA':	'yrn:yahoo:(.*)::(.*):resource:(.*)',								// end of resource name
		'MATCH_NOT_TENANT_RES_DATA':	'( |\t|\r|\n|:)',													// not match resource data key name
		'MATCH_ANY_TENANT_RES_KEY':		'yrn:yahoo:(.*)::(.*):resource:(.*)/keys/(.*)',						// end of resource name/keys/<keyname>
		'MATCH_ANY_HOSTNAME_PORT':		'yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name/(.*) (.*) (.*)',
		'MATCH_ANY_HOSTNAME_KEYS':		'yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name',
		'MATCH_ANY_IP_PORT':			'yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)',
		'MATCH_ANY_IP_KEYS':			'yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip',
		'MATCH_ANY_KS_REGION':			'yrn:yahoo::::keystone:(.*)',
		'MATCH_ANY_USER_TOKEN':			'yrn:yahoo::::user:(.*):tenant/(.*)/token/(.*)'
	};

	var	_user	= apiutil.getSafeString(user).toLowerCase();
	var	_tenant	= apiutil.getSafeString(tenant).toLowerCase();
	var	_service= apiutil.getSafeString(service).toLowerCase();

	keywords.SERVICE_TOP_KEY						= keywords.NO_SERVICE_KEY			+ _service;			// "yrn:yahoo:<service>"
	keywords.SERVICE_NO_REGION_KEY					= keywords.SERVICE_TOP_KEY			+ ':';				// "yrn:yahoo:<service>:"
	if(apiutil.isSafeStrings(_service)){
		keywords.MASTER_SERVICE_KEY					= keywords.MASTER_SERVICE_TOP_KEY	+ ':' + _service;	// "yrn:yahoo::::service:<service>"
		keywords.SERVICE_OWNER_KEY					= keywords.MASTER_SERVICE_KEY		+ ':owner';			// "yrn:yahoo::::service:<service>:owner"
		keywords.SERVICE_TENANT_KEY					= keywords.MASTER_SERVICE_KEY		+ ':tenant';		// "yrn:yahoo::::service:<service>:tenant"
		keywords.SERVICE_VERIFY_TENANT_KEY			= keywords.MASTER_SERVICE_KEY		+ ':verify';		// "yrn:yahoo::::service:<service>:verify"
	}

	if(apiutil.isSafeStrings(_tenant)){
		// tenant key with service(allowed null)
		keywords.TENANT_TOP_KEY						= keywords.SERVICE_NO_REGION_KEY	+ ':' + _tenant;	// "yrn:yahoo:<service>::<tenant>"

		// tenant master key(service is null)
		keywords.MASTER_TENANT_TOP_KEY				= keywords.NO_SERVICE_REGION_KEY	+ ':' + _tenant;	// "yrn:yahoo:::<tenant>"

		// tenant description keys(service is null)
		keywords.TENANT_ID_KEY						= keywords.MASTER_TENANT_TOP_KEY	+ ':id';			// "yrn:yahoo:::<tenant>:id"
		keywords.TENANT_DESC_KEY					= keywords.MASTER_TENANT_TOP_KEY	+ ':desc';			// "yrn:yahoo:::<tenant>:desc"
		keywords.TENANT_DISP_KEY					= keywords.MASTER_TENANT_TOP_KEY	+ ':display';		// "yrn:yahoo:::<tenant>:display"
		keywords.TENANT_USER_KEY					= keywords.MASTER_TENANT_TOP_KEY	+ ':user';			// "yrn:yahoo:::<tenant>:user"
		keywords.TENANT_SERVICE_KEY					= keywords.MASTER_TENANT_TOP_KEY	+ ':service';		// "yrn:yahoo:::<tenant>:service"

		// role, resource, policy under tenant with service
		keywords.ROLE_TOP_KEY						= keywords.TENANT_TOP_KEY			+ ':' + 'role';		// "yrn:yahoo:<service>::<tenant>:role"
		keywords.POLICY_TOP_KEY						= keywords.TENANT_TOP_KEY			+ ':' + 'policy';	// "yrn:yahoo:<service>::<tenant>:policy"
		keywords.RESOURCE_TOP_KEY					= keywords.TENANT_TOP_KEY			+ ':' + 'resource';	// "yrn:yahoo:<service>::<tenant>:resource"
	}

	if(apiutil.isSafeStrings(_user)){
		keywords.USER_KEY							= keywords.USER_TOP_KEY				+ ':' + _user;		// "yrn:yahoo::::user:<user>"
		keywords.USER_ID_KEY						= keywords.USER_KEY					+ ':id';			// "yrn:yahoo::::user:<user>:id"
		keywords.USER_TENANT_TOP_KEY				= keywords.USER_KEY					+ ':tenant';		// "yrn:yahoo::::user:<user>:tenant"
		keywords.USER_TENANT_COMMON_KEY				= keywords.USER_TENANT_TOP_KEY		+ '/';				// "yrn:yahoo::::user:<user>:tenant/"
		keywords.USER_TENANT_UNSCOPE_TOKEN_KEY		= keywords.USER_TENANT_COMMON_KEY	+ '/token';			// "yrn:yahoo::::user:<user>:tenant//token"

		if(apiutil.isSafeStrings(tenant)){
			keywords.USER_TENANT_KEY				= keywords.USER_TENANT_COMMON_KEY	+ _tenant;			// "yrn:yahoo::::user:<user>:tenant/<tenant>"
			keywords.USER_TENANT_SCOPE_TOKEN_KEY	= keywords.USER_TENANT_KEY			+ '/token';			// "yrn:yahoo::::user:<user>:tenant/<tenant>/token"
			// ambiguous key whether tenant exists or not
			keywords.USER_TENANT_AMBIGUOUS_KEY		= keywords.USER_TENANT_KEY;								// "yrn:yahoo::::user:<user>:tenant/<tenant>"
			keywords.USER_TENANT_AMBIGUOUS_TOKEN_KEY= keywords.USER_TENANT_SCOPE_TOKEN_KEY;					// "yrn:yahoo::::user:<user>:tenant/<tenant>/token"
		}else{
			keywords.USER_TENANT_KEY				= '';													// ""
			keywords.USER_TENANT_SCOPE_TOKEN_KEY	= '';													// ""
			// ambiguous key whether tenant exists or not
			keywords.USER_TENANT_AMBIGUOUS_KEY		= keywords.USER_TENANT_COMMON_KEY;						// "yrn:yahoo::::user:<user>:tenant/"
			keywords.USER_TENANT_AMBIGUOUS_TOKEN_KEY= keywords.USER_TENANT_UNSCOPE_TOKEN_KEY;				// "yrn:yahoo::::user:<user>:tenant//token"
		}
	}
	return keywords;
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
