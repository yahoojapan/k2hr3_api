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

var	k2hdkc		= require('k2hdkc');
var	apiutil		= require('./k2hr3apiutil');
var	r3keys		= require('./k2hr3keys').getK2hr3Keys;
var	r3token		= require('./k2hr3tokens');
var	acrutil		= require('./k2hr3acrutil');
var	r3templeng	= require('./k2hr3template');
var	r3Conf		= require('./k2hr3config').r3ApiConfig;
var	apiConf		= new r3Conf();

// Debug logging objects
var r3logger	= require('./dbglogging');

//---------------------------------------------------------
// Configuration and port number from Environment
//---------------------------------------------------------
var dkcconf	= null;
var	dkcport	= null;
var	dkccuk	= null;
(function()
{
	if(!apiutil.isSafeEntity(dkcconf)){
		var	tmpdkcconf = apiConf.getK2hdkcConfig();
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
		var	tmpdkcport = apiConf.getK2hdkcPort();
		if(isNaN(tmpdkcport) || null === tmpdkcport){
			r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified in config json is something wrong, then try to check K2HDKC_SLAVE_PORT environemnt.');

			tmpdkcport = apiutil.getSafeString(process.env.K2HDKC_SLAVE_PORT);
			if(!apiutil.isSafeString(tmpdkcport) || isNaN(tmpdkcport)){
				r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified by K2HDKC_SLAVE_PORT environment is something wrong, then use default port number(8031).');
				tmpdkcport = 8031;
			}
		}
		dkcport = parseInt(tmpdkcport);
	}
	if(!apiutil.isSafeEntity(dkccuk)){
		var	tmpdkccuk = apiConf.getK2hdkcCuk();
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
}());

//---------------------------------------------------------
// Configuration for confirmation level of Service Tenant
//---------------------------------------------------------
var	is_allow_dummy_tenant = !(apiConf.isConfirmTenantForService());

//---------------------------------------------------------
// Normalization host information
//---------------------------------------------------------
//
// input_info	:	input is allow following
//					(1) string	= ip address or hostname
//					(2) object	= {
//									ip:			ip address string(or null/undefined)
//									hostname:	hostname string(or null/undefined)
//									port:		port number(or null/undefined)
//									cuk:		container unique key(or null/undefined)
//									extra:		string(or null/undefined)
//									tag:		string(or null/undefined)
//									inboundip:	ip address string(or null/undefined)
//									outboundip:	ip address string(or null/undefined)
//								  }
//					(3) array	= [ object, object, ...]
//
// result		:	result is following, this array can be specified by rawCreateRole()
//					[
//						{
//							hostname:	"x.y.x.yahoo.co.jp"	(or null)
//							ip:			"172.1.1.1"			(or null)
//							port:		8000				(if not specify, the value is 0="any")
//							cuk:		"any string"		(if not specify, the value is null or undefined)
//							extra:		"explain, etc"		(if not specify, the value is null or undefined)
//							tag:		"tag string"		(if not specify, the value is null or undefined)
//							inboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//							outboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//						},
//						....
//					]
//
// [NOTE]
// If both ip address and hostname are specified, the result is array[2].
// It is an array with two elements divided into a hostname and an ip address.
//
function getSafeHosts(input_info)
{
	var	result = new Array(0);

	if(!apiutil.isSafeEntity(input_info)){
		return result;
	}

	var	ipaddr	= null;
	var	hostname= null;
	var	portnum	= 0;
	var	cuk		= null;
	var	extra	= null;
	var	tag		= null;

	if(input_info instanceof Object){
		if(input_info instanceof Array){
			// A case of array
			for(var cnt = 0; cnt < input_info.length; ++cnt){
				// reentrant
				var	tmp	= getSafeHosts(input_info[cnt]);
				result	= result.concat(tmp);
			}
		}else{
			var	host_info;

			// A case of object
			if(apiutil.isSafeString(input_info.ip) && apiutil.isIpAddressString(input_info.ip)){
				ipaddr	= input_info.ip;
			}
			if(apiutil.isSafeString(input_info.hostname)){
				hostname= input_info.hostname;
			}
			if(apiutil.isSafeEntity(input_info.port) && !isNaN(input_info.port)){
				portnum	= input_info.port;
			}
			if(apiutil.isSafeString(input_info.cuk)){
				cuk		= input_info.cuk;
			}
			if(apiutil.isSafeString(input_info.extra)){
				extra	= input_info.extra;
			}
			if(apiutil.isSafeString(input_info.tag)){
				tag		= input_info.tag;
			}

			// add to array(if hostname and ip address is existed, push two array)
			if(apiutil.isSafeString(ipaddr)){
				host_info = {ip: ipaddr, hostname: null, port: portnum, cuk: cuk, extra: extra, tag: tag};
			}
			if(apiutil.isSafeString(hostname)){
				host_info = {ip: null, hostname: hostname, port: portnum, cuk: cuk, extra: extra, tag: tag};
			}

			// optional keys
			if(apiutil.isSafeString(input_info.inboundip) && apiutil.isIpAddressString(input_info.inboundip)){
				host_info.inboundip = input_info.inboundip;
			}
			if(apiutil.isSafeString(input_info.outboundip) && apiutil.isIpAddressString(input_info.outboundip)){
				host_info.outboundip = input_info.outboundip;
			}

			result.push(host_info);
		}
	}else{
		// A case of one host name(or ip address)
		if(apiutil.isIpAddressString(input_info)){
			ipaddr	= input_info;
		}else{
			hostname= input_info;
		}
		result.push({ip: ipaddr, hostname: hostname, port: portnum, cuk: cuk, extra: extra, tag: tag});
	}
	return result;
}

//---------------------------------------------------------
// increment/decrement reference count raw function
//---------------------------------------------------------
// fullyrn				:	full yrn for main key(example: "yrn:yahoo:<service>::<tenant>:policy:<policy>")
// increment			:	increment(true) or decrement(false)
//
function rawIncDecReferenceCount(dkcobj_permanent, fullyrn, increment)
{
	var	resobj = {result: true, message: null};

	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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
	if('boolean' !== typeof increment){
		resobj.result	= false;
		resobj.message	= 'some parameters aree wrong : fullyrn=' + JSON.stringify(fullyrn) + ', increment=' + JSON.stringify(increment);
		r3logger.elog(resobj.message);
		return resobj;
	}

	//
	// keys
	//
	var	keys			= r3keys();
	var	reference_key	= fullyrn + '/' + keys.REFERENCE_KW;

	// check fullyrn key
	var	subkeylist		= dkcobj_permanent.getSubkeys(fullyrn, true);
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
}

//---------------------------------------------------------
// create simple key tree
//---------------------------------------------------------
//	keys		string or array
//				string:		one or more keys with '/' separator(ex. "foo", "foo/bar/...")
//				array:		array has elements which is one or more keys with '/' separator
//							ex.	["foo", "bar"], ["foo", "foo/bar/..."]
//
function rawCreateKeyTree(dkcobj_permanent, parent_key, keys, allow_empty_key)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(parent_key)){
		r3logger.elog('parameters are wrong : parent_key=' + JSON.stringify(parent_key));
		return false;
	}

	// build hierarchy array
	var	hierarchy = apiutil.expandHierarchy(parent_key, keys, '/', allow_empty_key);
	if(null === hierarchy){
		r3logger.elog('could not expand hierarchy array for parent and children.');
		return false;
	}

	// loop for creating subkey in parent
	for(var parent in hierarchy){
		if(apiutil.isEmptyArray(hierarchy[parent])){
			r3logger.wlog('parent key(' + parent + ') does not have new subkeys');
			continue;
		}

		// get parent's subkeys
		var	subkeylist	= dkcobj_permanent.getSubkeys(parent, true);
		if(apiutil.isEmptyArray(subkeylist)){
			subkeylist	= new Array(0);
		}

		// check new subkey
		var	is_cahnged	= false;
		for(var cnt = 0; cnt < hierarchy[parent].length; ++cnt){
			if(!apiutil.findStringInArray(subkeylist, hierarchy[parent][cnt])){
				subkeylist.push(hierarchy[parent][cnt]);
				is_cahnged = true;
			}
		}
		if(is_cahnged){
			// over write(add) subkey to parent
			if(!dkcobj_permanent.setSubkeys(parent, subkeylist)){					// add subkey to parent
				r3logger.elog('could not add ' + JSON.stringify(subkeylist) + ' under ' + parent + ' key');
				return false;
			}
		}
	}
	return true;
}

//---------------------------------------------------------
// Small utility for tenant name
//---------------------------------------------------------
function rawGetKeysFromResourceKey(user, resource_key)
{
	var	keys = r3keys(user);

	// make resource name from resource yrn path
	var	nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);				// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	var	namematches	= resource_key.match(nameptn);
	if(apiutil.isEmptyArray(namematches) || namematches.length < 4 || !apiutil.isSafeString(namematches[2])){
		// res_yrn is not full yrn to resource
		return keys;
	}
	var	service		= namematches[1];
	if(!apiutil.isSafeString(service)){
		service		= null;
	}
	return r3keys(user, namematches[2], service);
}

//---------------------------------------------------------
// initialize k2hdkc data
//---------------------------------------------------------
//
// global flag for all keys up in k2hdkc
//
var	is_init_key_hierarchy = false;

function rawInitKeyHierarchy(dkcobj_permanent)
{
	if(is_init_key_hierarchy){
		return true;
	}
	var	dkcobj		= dkcobj_permanent;
	var	need_clean	= false;
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		if(null === dkcconf || null === dkcport){
			r3logger.elog('Configuration is not set.');
			return false;
		}
		need_clean	= true;
		dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	}
	var	keys		= r3keys();

	//
	// Check top key "yrn" exists.
	//
	var	subkeylist	= dkcobj.getSubkeys(keys.YRN_KEY, true);
	if(subkeylist instanceof Array && 0 < subkeylist.length && keys.DOMAIN_KEY == subkeylist[0]){
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
	if(!dkcobj.setSubkeys(keys.YRN_KEY, subkeylist)){									// set subkey yrn:yahoo -> yrn
		r3logger.elog('could not set ' + keys.DOMAIN_KEY + ' subkey under ' + keys.YRN_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.NO_SERVICE_KEY];
	if(!dkcobj.setSubkeys(keys.DOMAIN_KEY, subkeylist)){								// set subkey yrn:yahoo:<no service> -> yrn:yahoo
		r3logger.elog('could not set ' + keys.NO_SERVICE_KEY + ' subkey under ' + keys.DOMAIN_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.NO_SERVICE_REGION_KEY];
	if(!dkcobj.setSubkeys(keys.NO_SERVICE_KEY, subkeylist)){								// set subkey yrn:yahoo::<no region> -> yrn:yahoo:<no service>
		r3logger.elog('could not set ' + keys.NO_SERVICE_REGION_KEY + ' subkey under ' + keys.NO_SERVICE_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.NO_SERVICE_TENANT_KEY];
	if(!dkcobj.setSubkeys(keys.NO_SERVICE_REGION_KEY, subkeylist)){						// set subkey yrn:yahoo:::<no tenant> -> yrn:yahoo::<no region>
		r3logger.elog('could not set ' + keys.NO_SERVICE_TENANT_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.USER_TOP_KEY, keys.TOKEN_TOP_KEY, keys.ACTION_TOP_KEY, keys.KEYSTONE_TOP_KEY, keys.MASTER_SERVICE_TOP_KEY, keys.IAAS_TOP_KEY];
	if(!dkcobj.setSubkeys(keys.NO_SERVICE_TENANT_KEY, subkeylist)){						// set subkey yrn:yahoo::::{user, token, action, keystone, service, iaas} -> yrn:yahoo:::<no tenant>
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
	if(!dkcobj.setSubkeys(keys.ACTION_TOP_KEY, subkeylist)){							// set subkey yrn:yahoo::::action:{read, write} -> yrn:yahoo::::action
		r3logger.elog('could not set ' + keys.ACTION_READ_KEY + ', ' + keys.ACTION_WRITE_KEY + ' subkeys under ' + keys.ACTION_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.ACTION_READ_KEY, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo::::action:read
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ACTION_READ_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.ACTION_WRITE_KEY, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo::::action:write
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
	if(!dkcobj.setValue(keys.USER_TOP_KEY, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo::::user
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
	if(!dkcobj.setSubkeys(keys.TOKEN_TOP_KEY, subkeylist)){								// set subkey yrn:yahoo::::token:{user, role} -> yrn:yahoo::::token
		r3logger.elog('could not set ' + keys.TOKEN_USER_TOP_KEY + ', ' + keys.TOKEN_ROLE_TOP_KEY + ' subkeys under ' + keys.TOKEN_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.TOKEN_USER_TOP_KEY, keys.VALUE_ENABLE)){					// set value enable(dummy) -> yrn:yahoo::::token:user
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ACTION_READ_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.TOKEN_ROLE_TOP_KEY, keys.VALUE_ENABLE)){					// set value enable(dummy) -> yrn:yahoo::::token:role
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
	if(!dkcobj.setValue(keys.KEYSTONE_TOP_KEY, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo::::keystone
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
	if(!dkcobj.setValue(keys.IAAS_TOP_KEY, keys.VALUE_ENABLE)){								// set value enable(dummy) -> yrn:yahoo::::iaas
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.IAAS_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}

	// create openstack and kubernetes key
	subkeylist	= [keys.IAAS_OS_TOP_KEY, keys.IAAS_K8S_TOP_KEY];
	if(!dkcobj.setSubkeys(keys.IAAS_TOP_KEY, subkeylist)){								// set subkey yrn:yahoo::::iaas:{openstack|k8s} -> yrn:yahoo::::iaas
		r3logger.elog('could not set ' + keys.IAAS_OS_TOP_KEY + ' and ' + keys.IAAS_K8S_TOP_KEY + ' subkey under ' + keys.IAAS_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.IAAS_OS_TOP_KEY, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo::::iaas:openstack
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.IAAS_OS_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.IAAS_K8S_TOP_KEY, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo::::iaas:k8s
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
	if(!dkcobj.setValue(keys.MASTER_SERVICE_TOP_KEY, keys.VALUE_ENABLE)){					// set value enable(dummy) -> yrn:yahoo::::service
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.SERVICE_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	// create any tenant key
	subkeylist	= [keys.ANYTENANT_SERVICE_TOP_KEY];
	if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_TOP_KEY, subkeylist)){						// set subkey yrn:yahoo::::service: -> yrn:yahoo::::service
		r3logger.elog('could not set ' + keys.ANYTENANT_SERVICE_TOP_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	subkeylist	= [keys.ANYTENANT_SERVICE_KEY];
	if(!dkcobj.setSubkeys(keys.ANYTENANT_SERVICE_TOP_KEY, subkeylist)){						// set subkey yrn:yahoo::::service::anytenant -> yrn:yahoo::::service:
		r3logger.elog('could not set ' + keys.ANYTENANT_SERVICE_KEYANYTENANT_SERVICE_TOP_KEY + ' subkey under ' + keys.ANYTENANT_SERVICE_TOP_KEY + ' key');
		if(need_clean){
			dkcobj.clean();
		}
		return false;
	}
	if(!dkcobj.setValue(keys.ANYTENANT_SERVICE_KEY, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo::::service::anytenant
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
}

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
function rawCreateService(tenant, servicename, verify)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, servicename)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(servicename);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeEntity(verify)){
		verify = JSON.stringify(null);														// default null
	}else if(apiutil.isSafeUrl(verify)){
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
	}else if(!apiutil.isSafeString(verify)){
		// allow any object
		verify = JSON.stringify(verify);													// formatted JSON
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	keys			= r3keys(null, tenant, servicename);
	var	subkeylist;
	var	value;
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){						// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service

		subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
		if(apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){					// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>

			value = dkcobj.getValue(keys.SERVICE_OWNER_KEY, null, true, null);				// get value -> yrn:yahoo::::service:<service>:owner
			if(apiutil.isSafeString(value)){
				if(value != keys.MASTER_TENANT_TOP_KEY){
					// existing service owner is not specified owner(tenant)
					resobj.result	= false;
					resobj.message	= 'already existed service owner is tenant(' + value + '), it is not as same as  specified owner tenant(' + tenant + ')';
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_TOP_KEY, subkeylist)){					// add subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_OWNER_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_KEY, subkeylist)){						// add subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_TENANT_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_KEY, subkeylist)){						// add subkey yrn:yahoo::::service:<service>:tenant -> yrn:yahoo::::service:<service>
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.SERVICE_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_VERIFY_TENANT_KEY)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_KEY, subkeylist)){						// add subkey yrn:yahoo::::service:<service>:verify -> yrn:yahoo::::service:<service>
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
	value = dkcobj.getValue(keys.SERVICE_OWNER_KEY, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj.setValue(keys.SERVICE_OWNER_KEY, keys.MASTER_TENANT_TOP_KEY)){			// update(set) value -> yrn:yahoo::::service:<service>:owner
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){
		// add master tenant key to service's tenant list
		if(!dkcobj.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){						// add subkey yrn:yahoo:::<tenant> -> yrn:yahoo::::service:<service>:tenant
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.TENANT_SERVICE_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
		// add tenant's service key to master tenant key
		if(!dkcobj.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){						// add subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
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
	if(value != verify){
		if(!dkcobj.setValue(keys.SERVICE_VERIFY_TENANT_KEY, verify)){						// update value verify -> yrn:yahoo::::service:<service>:verify
			resobj.result	= false;
			resobj.message	= 'could not set ' + JSON.stringify(verify) + ' value to ' + keys.SERVICE_VERIFY_TENANT_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// check tenant is service owner
//---------------------------------------------------------
//
// Check tenant in service's owner
//
//	tenant			: tenant name
//	servicename		: service name
//
function rawCheckTenantInServiceOwner(dkcobj_permanent, tenant, service)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenant, service)){
		r3logger.elog('parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return false;
	}

	// normalize tenant(if tenant is full yrn path, it should be tenant name)
	var	keys	= r3keys(null, tenant, service);
	var	value;
	var	yrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_MAIN);								// regex = /^yrn:yahoo:(.*)::(.*)/
	var	matches	= tenant.match(yrnptn);
	if(!apiutil.isEmptyArray(matches) && 3 <= matches.length){
		if(!apiutil.isSafeString(matches[2]) || !apiutil.isSafeString(matches[2].trim())){
			r3logger.elog('parameters are wrong : tenant=' + JSON.stringify(tenant));
			return false;
		}
		tenant	= matches[2].trim();
		keys	= r3keys(null, tenant, service);											// remake
	}

	//
	// Check tenant is owner
	//
	value = dkcobj_permanent.getValue(keys.SERVICE_OWNER_KEY, null, true, null);			// check value in yrn:yahoo::::service:<service>:owner
	if(!apiutil.isSafeString(value) || !apiutil.compareCaseString(value, keys.MASTER_TENANT_TOP_KEY)){
		r3logger.dlog('tenant(' + keys.MASTER_TENANT_TOP_KEY + ') is not owner for service(' + keys.MASTER_SERVICE_KEY + ')');
		return false;
	}
	return true;
}

//---------------------------------------------------------
// Get service raw function
//---------------------------------------------------------
// return object
//	{
//		"result":	true/false
//		"message":	<error message> / null / undefined
//		"service":	{
//			"name":			<service name>
//			"owner":		<owner tenant name>
//			"verify":		<verify url> or <verify object>
//			"tenant":		[<tenant yrn full path>, ...]
//		}
//	}
//
function rawGetServiceAll(tenant, servicename)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, servicename)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(servicename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	subkeylist;
	var	value;
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
	var	keys			= r3keys(null, tenant, servicename);
	var	service_key		= keys.MASTER_SERVICE_KEY;											// "yrn:yahoo::::service:<service>"
	var	owner_key		= keys.SERVICE_OWNER_KEY;											// "yrn:yahoo::::service:<service>:owner"
	var	tenant_key		= keys.SERVICE_TENANT_KEY;											// "yrn:yahoo::::service:<service>:tenant"
	var	verify_key		= keys.SERVICE_VERIFY_TENANT_KEY;									// "yrn:yahoo::::service:<service>:verify"
	var	service_data	= {};

	//
	// Check service main key & children keys
	//
	subkeylist	= dkcobj.getSubkeys(service_key, true);										// get subkey list in "yrn:yahoo::::service:<service>"
	if(	!apiutil.findStringInArray(subkeylist, owner_key)	||
		!apiutil.findStringInArray(subkeylist, tenant_key)	||
		!apiutil.findStringInArray(subkeylist, verify_key)	)
	{
		resobj.result	= false;
		resobj.message	= owner_key + ' or ' + tenant_key + ' or ' + verify_key + ' are not found in ' + service_key + ' subkey list.';
		dkcobj.clean();
		return resobj;
	}
	service_data.name	= servicename;

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
	service_data.owner	= tenant;

	//
	// Get verify
	//
	value = dkcobj.getValue(verify_key, null, true, null);									// check value in yrn:yahoo::::service:<service>:verify
	if(!apiutil.isSafeString(value)){
		resobj.result	= false;
		resobj.message	= 'key(' + verify_key + ') does not have safe verify url nor JSON string : ' + JSON.stringify(value);
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(apiutil.checkSimpleJSON(value)){
		service_data.verify	= JSON.parse(value);
	}else{
		service_data.verify	= value;
	}

	//
	// Get tenant list
	//
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(tenant_key, true));				// get subkey list in yrn:yahoo::::service:<service>:tenant
	if(!apiutil.isEmptyArray(subkeylist)){
		service_data.tenant	= subkeylist;
	}else{
		service_data.tenant	= null;
	}

	// set policy key into result object
	resobj.service	= service_data;
	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Remove service raw function
//---------------------------------------------------------
function rawRemoveServiceAll(tenant, servicename)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, servicename)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(servicename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	subkeylist;
	var	cnt;
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
	var	keys			= r3keys(null, tenant, servicename);
	var	service_key		= keys.MASTER_SERVICE_KEY;											// "yrn:yahoo::::service:<service>"
	var	owner_key		= keys.SERVICE_OWNER_KEY;											// "yrn:yahoo::::service:<service>:owner"
	var	tenant_key		= keys.SERVICE_TENANT_KEY;											// "yrn:yahoo::::service:<service>:tenant"
	var	verify_key		= keys.SERVICE_VERIFY_TENANT_KEY;									// "yrn:yahoo::::service:<service>:verify"

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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(tenant_key, true));				// get subkey list in yrn:yahoo::::service:<service>:tenant
	if(!apiutil.isEmptyArray(subkeylist)){
		var	tenantlist = subkeylist;
		for(cnt = 0; cnt < tenantlist.length; ++cnt){
			//
			// Create related key
			//
			var	yrnptn				= new RegExp('^' + keys.MATCH_ANY_TENANT_MAIN);			// regex = /^yrn:yahoo:(.*)::(.*)/
			var	matches				= tenantlist[cnt].match(yrnptn);
			if(apiutil.isEmptyArray(matches) || matches.length < 3){
				r3logger.elog('tenant(' + tenantlist[cnt] + ') in service tenant list is something wrong, then skip this.');
				continue;
			}
			var	servicetenant			= matches[2];										// tenant name under service's tenant
			var	tenant_service_key		= tenantlist[cnt] + ':' + keys.SERVICE_KW;			// "yrn:yahoo::::service:<service>"
			var	is_owner_service_tenant = apiutil.compareCaseString(keys.MASTER_TENANT_TOP_KEY, tenantlist[cnt]);

			//
			// Remove service key from all tenant member's service list
			//
			subkeylist = apiutil.getSafeArray(dkcobj.getSubkeys(tenant_service_key, true));	// remove subkey "yrn:yahoo::::service:<service>" -> "yrn:yahoo:::<tenant>:service"
			if(apiutil.removeStringFromArray(subkeylist, service_key)){
				if(!dkcobj.setSubkeys(tenant_service_key, subkeylist)){						// reset new service list -> yrn:yahoo:::<tenant>:service
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
	subkeylist = apiutil.getSafeArray(dkcobj.getSubkeys(keys.ANYTENANT_SERVICE_KEY, true));	// get subkey list in yrn:yahoo::::service::anytenant
	if(apiutil.removeStringFromArray(subkeylist, service_key)){
		if(!dkcobj.setSubkeys(keys.ANYTENANT_SERVICE_KEY, subkeylist)){						// reset new service list -> yrn:yahoo::::service::anytenant
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
	if(!dkcobj.remove(tenant_key, false)){													// remove "yrn:yahoo::::service:<service>:tenant"
		r3logger.elog('could not remove ' + tenant_key + 'key, probably it is not existed.');
	}
	if(!dkcobj.remove(verify_key, false)){													// remove "yrn:yahoo::::service:<service>:verify"
		r3logger.elog('could not remove ' + verify_key + 'key, probably it is not existed.');
	}
	if(!dkcobj.remove(owner_key, false)){													// remove "yrn:yahoo::::service:<service>:owner"
		r3logger.elog('could not remove ' + owner_key + 'key, probably it is not existed.');
	}

	//
	// Remove service key
	//
	subkeylist = apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));// get subkey list in yrn:yahoo::::service
	if(apiutil.removeStringFromArray(subkeylist, service_key)){
		if(!dkcobj.setSubkeys(keys.MASTER_SERVICE_TOP_KEY, subkeylist)){					// reset new service list -> yrn:yahoo::::service
			resobj.result	= false;
			resobj.message	= 'could not set new(removed service) list under ' + keys.MASTER_SERVICE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	if(!dkcobj.remove(service_key, false)){													// remove "yrn:yahoo::::service:<service>"
		r3logger.elog('could not remove ' + service_key + 'key, probably it is not existed.');
	}

	dkcobj.clean();
	return resobj;
}

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
function rawAllowTenantToServiceEx(dkcobj_permanent, ownertenant, servicename, tenantname)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(ownertenant, servicename, tenantname)){
		r3logger.elog('parameters are wrong : ownertenant=' + JSON.stringify(ownertenant) + ', service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname));
		return false;
	}

	var	keys			= r3keys(null, tenantname, servicename);
	var	subkeylist;

	//
	// Check service key/owner key/tenant key exists.
	//
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){					// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
		// not found master service key in master service top key.
		r3logger.elog('Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)');
		return false;
	}
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){						// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
		// not found owner key in master service key.
		r3logger.elog('Not found ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no owner key in master service key)');
		return false;
	}
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_KEY, true));
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
	var	is_any_tenant	= (keys.VALUE_WILDCARD === tenantname ? true : false);
	if(!is_any_tenant){
		// case for not any tenant
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
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
	var	add_tenant_key	= (is_any_tenant ? keys.VALUE_WILDCARD : keys.MASTER_TENANT_TOP_KEY);
	subkeylist			= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TENANT_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, add_tenant_key)){
		// add master tenant key to service's tenant list
		if(!dkcobj_permanent.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){				// add subkey yrn:yahoo:::<tenant> or '*' -> yrn:yahoo::::service:<service>:tenant
			r3logger.elog('could not add ' + add_tenant_key + ' subkey under ' + keys.SERVICE_TENANT_KEY + ' key');
			return false;
		}
	}

	//
	// Add service key to tenant's service list
	//
	if(!is_any_tenant){
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_SERVICE_KEY)){
			// add tenant's service key to master tenant key
			if(!dkcobj_permanent.setSubkeys(keys.MASTER_TENANT_TOP_KEY, subkeylist)){		// add subkey yrn:yahoo:::<tenant>:service -> yrn:yahoo::::service:<service>
				r3logger.elog('could not add ' + keys.TENANT_SERVICE_KEY + ' subkey under ' + keys.MASTER_TENANT_TOP_KEY + ' key');
				return false;
			}
		}
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.TENANT_SERVICE_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			// add tenant's service key to master tenant key
			if(!dkcobj_permanent.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){			// add subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
				r3logger.elog('could not add ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.TENANT_SERVICE_KEY + ' key');
				return false;
			}
		}
	}else{
		//
		// If allow any tenant, we set service path into anytenant.
		//
		subkeylist = apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.ANYTENANT_SERVICE_KEY, true));	// get subkey list in yrn:yahoo::::service::anytenant
		if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			if(!dkcobj_permanent.setSubkeys(keys.ANYTENANT_SERVICE_KEY, subkeylist)){		// set service path -> yrn:yahoo::::service::anytenant
				r3logger.elog('could not add subkey(' + keys.MASTER_SERVICE_KEY + ') to ' + keys.ANYTENANT_SERVICE_KEY + ' key');
				return false;
			}
		}
	}
	return true;
}

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
function rawAllowTenantToService(ownertenant, servicename, tenantname)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(ownertenant, servicename, tenantname)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : ownertenant=' + JSON.stringify(ownertenant) + ', service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
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
}

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
function rawDenyTenantFromService(ownertenant, servicename, tenantname)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(ownertenant, servicename, tenantname)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : ownertenant=' + JSON.stringify(ownertenant) + ', service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	keys			= r3keys(null, tenantname, servicename);
	var	ownerkeys		= r3keys(null, ownertenant, null);
	var	subkeylist;
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
	var	is_owner_service_tenant = false;
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){					// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
		// not found master service key in master service top key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){						// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
		// not found owner key in master service key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no owner key in master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
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
	var	is_any_tenant		= (keys.VALUE_WILDCARD === tenantname ? true : false);
	var	delete_tenant_key	= (is_any_tenant ? keys.VALUE_WILDCARD : keys.MASTER_TENANT_TOP_KEY);
	subkeylist				= apiutil.getSafeArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));
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
		if(!dkcobj.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){						// set new tenant list -> yrn:yahoo::::service:<service>:tenant
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
			subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
			if(!apiutil.findStringInArray(subkeylist, keys.TENANT_SERVICE_KEY)){			// check subkey yrn:yahoo:::<tenant>:service -> yrn:yahoo:::<tenant>
				// not found service list key in tenant master key.
				r3logger.wlog('Not found ' + keys.TENANT_SERVICE_KEY + ' subkey under ' + keys.MASTER_TENANT_TOP_KEY + ' key');
			}else{
				// check service name in tenant's service list
				subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.TENANT_SERVICE_KEY, true));
				if(!apiutil.removeStringFromArray(subkeylist, keys.MASTER_SERVICE_KEY)){	// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
					// not found service name in tenant's service list.
					r3logger.dlog('Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.TENANT_SERVICE_KEY + ' key');
				}else{
					// remove master service key to service's tenant list
					if(!dkcobj.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){			// set new service list -> yrn:yahoo:::<tenant>:service
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
		subkeylist = apiutil.getSafeArray(dkcobj.getSubkeys(keys.ANYTENANT_SERVICE_KEY, true));	// get subkey list in yrn:yahoo::::service::anytenant
		if(apiutil.removeStringFromArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			if(!dkcobj.setSubkeys(keys.ANYTENANT_SERVICE_KEY, subkeylist)){					// remove service path -> yrn:yahoo::::service::anytenant
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
}

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
function rawCheckTenantInServiceMember(servicename, tenantname)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(servicename, tenantname)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : service=' + JSON.stringify(servicename) + ' tenant=' + JSON.stringify(tenantname);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	keys			= r3keys(null, tenantname, servicename);
	var	subkeylist;
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){					// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo::::service
		// not found master service key in master service top key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_OWNER_KEY)){						// check subkey yrn:yahoo::::service:<service>:owner -> yrn:yahoo::::service:<service>
		// not found owner key in master service key.
		resobj.result	= false;
		resobj.message	= 'Not found ' + keys.SERVICE_OWNER_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no owner key in master service key)';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.MASTER_SERVICE_KEY, true));
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));	// check tenant is in service's tenant list -> yrn:yahoo::::service:<service>:tenant
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
}

//---------------------------------------------------------
// Common raw create tenant key
//---------------------------------------------------------
//	user			: user name
//	tenant			: tenant name
//	service			: service name
//	id				: tenant id, if user is specified(service is specified, do not need this)
//	desc			: tenant description, if user is specified(service is specified, do not need this)
//	display			: display name, if user is specified(service is specified, do not need this)
//
// [NOTE]
// Both user and service can not be specified at same time.
// This function create keys without resource/policy/role, you must be careful for service
// case.
//
function rawCreateTenantEx(dkcobj_permanent, user, tenant, service, id, desc, display)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(tenant)){														// allow service, user, desc and display are null
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant));
		return false;
	}
	if(apiutil.isSafeString(user) && !apiutil.isSafeString(service)){
		//
		// case: specified user parameter
		//
		if(!apiutil.isSafeString(id) && isNaN(id)){
			// id allows hex character string, decimal character string, decimal number value.
			//
			r3logger.elog('parameter is wrong : id=' + JSON.stringify(id));
			return false;
		}
		if(!apiutil.isSafeString(id)){
			// to string
			id = String(id);
		}
		service	= null;
	}else if(apiutil.isSafeString(service) && !apiutil.isSafeString(user)){
		//
		// case: specified service parameter
		//
		service	= service.toLowerCase();
		user	= null;
	}else{
		r3logger.elog('some parameters are wrong(both are empty or not empty) : service=' + JSON.stringify(service) + ', user=' + JSON.stringify(user));
		return false;
	}

	//
	// Keys
	//
	var	keys			= r3keys(user, tenant, service);
	var	subkeylist;
	var	value;
	var	tenantval;
	var	need_update;

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
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_TENANT_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_TOP_KEY)){			// check subkey yrn:yahoo::::service -> yrn:yahoo:::
			// not found service top key.
			r3logger.elog('Not found ' + keys.MASTER_SERVICE_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_TENANT_KEY + ' key(there is no service top key)');
			return false;
		}
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_SERVICE_KEY)){				// check subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::service
			// not found master service key.
			r3logger.elog('Not found ' + keys.MASTER_SERVICE_KEY + ' subkey under ' + keys.MASTER_SERVICE_TOP_KEY + ' key(there is no master service key)');
			return false;
		}
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_SERVICE_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.SERVICE_TENANT_KEY)){				// check subkey yrn:yahoo::::service:<service>:tenant -> yrn:yahoo:::service:<service>
			// not found tenant key in master service key.
			r3logger.elog('Not found ' + keys.SERVICE_TENANT_KEY + ' subkey under ' + keys.MASTER_SERVICE_KEY + ' key(there is no service key)');
			return false;
		}

		//
		// check tenant is allowed to add service
		//
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TENANT_KEY, true));
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
			var	ownertenant = dkcobj_permanent.getValue(keys.SERVICE_OWNER_KEY, null, true, null);	// get value in yrn:yahoo::::service:<service>:owner
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
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
		if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){				// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
			// not found master tenant key under no service key.
			r3logger.elog('Not found ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key(there is no tenant master key)');
			return false;
		}
		tenantval = dkcobj_permanent.getValue(keys.MASTER_TENANT_TOP_KEY, null, true, null);// get value in yrn:yahoo:::<tenant>
		if(!apiutil.isSafeString(tenantval) || tenantval != keys.VALUE_ENABLE){
			// tenant value is not enable, it is temporary tenant which has not been confirmed yet.
			r3logger.elog('tenant(' + keys.MASTER_TENANT_TOP_KEY + ') key does not have ' + keys.VALUE_ENABLE + ' value, it is registered as temporary.');
			return false;
		}

		//
		// check & create tenant key under service path
		//
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.DOMAIN_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_TOP_KEY)){
			// create service top key
			if(!dkcobj_permanent.setSubkeys(keys.DOMAIN_KEY, subkeylist)){					// add subkey yrn:yahoo:<service> -> yrn:yahoo
				r3logger.elog('could not add ' + keys.SERVICE_TOP_KEY + ' subkey under ' + keys.DOMAIN_KEY + ' key');
				return false;
			}
		}
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TOP_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.SERVICE_NO_REGION_KEY)){
			// create service key path without region
			if(!dkcobj_permanent.setSubkeys(keys.SERVICE_TOP_KEY, subkeylist)){				// add subkey yrn:yahoo:<service>: -> yrn:yahoo:<service>
				r3logger.elog('could not add ' + keys.SERVICE_NO_REGION_KEY + ' subkey under ' + keys.SERVICE_TOP_KEY + ' key');
				return false;
			}
		}
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.SERVICE_NO_REGION_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_TOP_KEY)){
			// create tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.SERVICE_NO_REGION_KEY, subkeylist)){		// add subkey yrn:yahoo:<service>::<tenant> -> yrn:yahoo:<service>:
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
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){			// on this case, MASTER_TENANT_TOP_KEY == TENANT_TOP_KEY
			// create master tenant top key
			if(!dkcobj_permanent.setSubkeys(keys.NO_SERVICE_REGION_KEY, subkeylist)){		// add subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
				r3logger.elog('could not add ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
				return false;
			}
		}

		//
		// Check id/desc/disp/user/service top key under master tenant key
		//
		need_update	= false;
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
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
			if(!dkcobj_permanent.setSubkeys(keys.MASTER_TENANT_TOP_KEY, subkeylist)){		// add subkey yrn:yahoo:<service>::<tenant>:{id/desc/disp/user/service} -> yrn:yahoo:<service>::<tenant>
				r3logger.elog('could not add id/desc/disp/user key to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
				return false;
			}
		}

		//
		// Update id/desc/user/service key's value
		//
		value = dkcobj_permanent.getValue(keys.TENANT_ID_KEY, null, true, null);
		if(value != id){
			if(!dkcobj_permanent.setValue(keys.TENANT_ID_KEY, id)){							// update value id -> yrn:yahoo:::<tenant>:id
				r3logger.elog('could not set ' + id + ' value to ' + keys.TENANT_ID_KEY + ' key');
				return false;
			}
		}
		value = dkcobj_permanent.getValue(keys.TENANT_DESC_KEY, null, true, null);
		if(!apiutil.isSafeEntity(desc)){
			desc = '';
		}
		if(value != desc){
			if(!dkcobj_permanent.setValue(keys.TENANT_DESC_KEY, desc)){						// update value desc -> yrn:yahoo:::<tenant>:desc
				r3logger.elog('could not set ' + desc + ' value to ' + keys.TENANT_DESC_KEY + ' key');
				return false;
			}
		}
		value = dkcobj_permanent.getValue(keys.TENANT_DISP_KEY, null, true, null);
		if(!apiutil.isSafeEntity(display)){
			display = '';
		}
		if(value != display){
			if(!dkcobj_permanent.setValue(keys.TENANT_DISP_KEY, display)){					// update value desc -> yrn:yahoo:::<tenant>:display
				r3logger.elog('could not set ' + display + ' value to ' + keys.TENANT_DISP_KEY + ' key');
				return false;
			}
		}
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.TENANT_USER_KEY, true));
		if(apiutil.tryAddStringToArray(subkeylist, keys.USER_KEY)){
			if(!dkcobj_permanent.setSubkeys(keys.TENANT_USER_KEY, subkeylist)){				// add subkey yrn:yahoo::::user:<user> -> yrn:yahoo:::<tenant>:user
				r3logger.elog('could not add ' + keys.USER_KEY + ' subkey under ' + keys.TENANT_USER_KEY + ' key');
				return false;
			}
		}
		value = dkcobj_permanent.getValue(keys.TENANT_SERVICE_KEY, null, true, null);
		if(value != keys.VALUE_ENABLE){
			if(!dkcobj_permanent.setValue(keys.TENANT_SERVICE_KEY, keys.VALUE_ENABLE)){		// set value enable(dummy) -> yrn:yahoo:::<tenant>:service
				r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.TENANT_SERVICE_KEY + ' key');
				return false;
			}
		}

		//
		// Update tenant's value
		//
		tenantval = dkcobj_permanent.getValue(keys.MASTER_TENANT_TOP_KEY, null, true, null);// get value in yrn:yahoo:::<tenant>
		if(!apiutil.isSafeString(tenantval) || tenantval != keys.VALUE_ENABLE){
			if(!dkcobj_permanent.setValue(keys.MASTER_TENANT_TOP_KEY, keys.VALUE_ENABLE)){	// update value -> yrn:yahoo:::<tenant>
				r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
				return false;
			}
		}
	}

	//
	// Check role/policy/resource key in tenant(with service, without service) key
	//
	need_update		= false;
	subkeylist		= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.TENANT_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.ROLE_TOP_KEY)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, keys.POLICY_TOP_KEY)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, keys.RESOURCE_TOP_KEY)){
		need_update	= true;
	}
	if(need_update){
		// add role/policy/resource keys to tenant top key's subkey list
		if(!dkcobj_permanent.setSubkeys(keys.TENANT_TOP_KEY, subkeylist)){					// add subkey yrn:yahoo:<service or null>::<tenant>:{role/policy/resource} -> yrn:yahoo:<service or null>::<tenant>
			r3logger.elog('could not add role/policy/resource key to ' + keys.TENANT_TOP_KEY + ' key');
			return false;
		}
	}
	value = dkcobj_permanent.getValue(keys.ROLE_TOP_KEY, null, true, null);
	if(value != keys.VALUE_ENABLE){
		if(!dkcobj_permanent.setValue(keys.ROLE_TOP_KEY, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo:<service or null>::<tenant>:role
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.ROLE_TOP_KEY + ' key');
			return false;
		}
	}
	value = dkcobj_permanent.getValue(keys.POLICY_TOP_KEY, null, true, null);
	if(value != keys.VALUE_ENABLE){
		if(!dkcobj_permanent.setValue(keys.POLICY_TOP_KEY, keys.VALUE_ENABLE)){				// set value enable(dummy) -> yrn:yahoo:<service or null>::<tenant>:policy
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.POLICY_TOP_KEY + ' key');
			return false;
		}
	}
	value = dkcobj_permanent.getValue(keys.RESOURCE_TOP_KEY, null, true, null);
	if(value != keys.VALUE_ENABLE){
		if(!dkcobj_permanent.setValue(keys.RESOURCE_TOP_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo:<service or null>::<tenant>:resource
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.RESOURCE_TOP_KEY + ' key');
			return false;
		}
	}
	return true;
}

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
function rawCreateTenantTemporary(dkcobj_permanent, tenant)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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
	var	keys			= r3keys(null, tenant);

	//
	// Check (master) tenant key exists and create these.
	//
	var	subkeylist = apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
	if(!apiutil.tryAddStringToArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){			// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		r3logger.dlog('already exists ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
		return true;
	}

	// create master tenant top key
	if(!dkcobj_permanent.setSubkeys(keys.NO_SERVICE_REGION_KEY, subkeylist)){			// add subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		r3logger.elog('could not add ' + keys.MASTER_TENANT_TOP_KEY + ' subkey under ' + keys.NO_SERVICE_REGION_KEY + ' key');
		return false;
	}

	//
	// Set tenant key's value as temporary
	//
	if(!dkcobj_permanent.setValue(keys.MASTER_TENANT_TOP_KEY, keys.VALUE_DISABLE)){		// set "disable" value -> yrn:yahoo:::<tenant>
		r3logger.elog('could not set ' + keys.VALUE_DISABLE + ' value to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
		return false;
	}

	//
	// Set tenant's service key ant its value
	//
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.MASTER_TENANT_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.TENANT_SERVICE_KEY)){
		// add only service key to master tenant top key's subkey list
		if(!dkcobj_permanent.setSubkeys(keys.MASTER_TENANT_TOP_KEY, subkeylist)){		// add subkey yrn:yahoo:<service>::<tenant>:service -> yrn:yahoo:<service>::<tenant>
			r3logger.elog('could not add service key to ' + keys.MASTER_TENANT_TOP_KEY + ' key');
			return false;
		}
	}
	if(!dkcobj_permanent.setValue(keys.TENANT_SERVICE_KEY, keys.VALUE_ENABLE)){			// set value enable(dummy) -> yrn:yahoo:::<tenant>:service
		r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + keys.TENANT_SERVICE_KEY + ' key');
		return false;
	}
	return true;
}

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
function rawCheckTenantEnable(dkcobj_permanent, tenant, servicename)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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
	var	keys			= r3keys(null, tenant, servicename);

	var	tenantval = dkcobj_permanent.getValue(keys.MASTER_TENANT_TOP_KEY, null, true, null);	// get value in yrn:yahoo:::<tenant>
	if(!apiutil.isSafeString(tenantval) || tenantval != keys.VALUE_ENABLE){
		r3logger.dlog('not found tenant(' + tenant + ') or its value is not ' + keys.VALUE_ENABLE + '.');
		return false;
	}

	var	subkeylist = apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.NO_SERVICE_REGION_KEY, true));
	if(!apiutil.findStringInArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){						// check subkey yrn:yahoo:::<tenant> -> yrn:yahoo::
		r3logger.dlog('not found tenant(' + tenant + ') under ' + keys.NO_SERVICE_REGION_KEY + ' key.');
		return false;
	}

	return true;
}

//---------------------------------------------------------
// create tenant key(no service)
//---------------------------------------------------------
//	tenant			: tenant name
//	id				: tenant id
//	desc			: tenant description
//	display			: display name
//	user			: user name
//
// [NOTE]
// This function does not check the user is a member in tenant, then 
// you must check it before calling this function.
//
function rawCreateTenant(user, tenant, id, desc, display)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, user)){												// allow desc and display are null
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', desc=' + JSON.stringify(desc) + ', user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(id) && isNaN(id)){
		// id allows hex character string, decimal character string, decimal number value.
		//
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(id)){
		// to string
		id = String(id);
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Create tenant top
	//
	if(!rawCreateTenantEx(dkcobj, user, tenant, null, id, desc, display)){
		resobj.result	= false;
		resobj.message	= 'could not create tenant(' + tenant + ') with id(' + id + '), desc(' + JSON.stringify(desc) + '), display(' + JSON.stringify(display) + '), user(' + user + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();
	return resobj;
}

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
function rawCreateServiceTenantEx(tenant, service, token, user, passwd, callback)
{
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		r3logger.elog('callback parameter is wrong : callback=' + JSON.stringify(callback));
		return;
	}
	var	_error		= null;
	var	_tenant		= tenant;
	var	_service	= service;
	var	_token		= token;
	var	_user		= user;
	var	_passwd		= passwd;
	var	_callback	= callback;

	if(!apiutil.isSafeStrings(tenant, service)){											// not check other parameters here.
		_error = new Error('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		r3logger.elog(_error.message);
		_callback(_error);
		return;
	}
	if(apiutil.isSafeString(_service)){
		_service	= _service.toLowerCase();
	}else{
		_service	= null;
	}
	if(!apiutil.isSafeString(_token)){
		_token		= null;
	}
	if(!apiutil.isSafeString(_user)){
		_user		= null;
	}
	if(!apiutil.isSafeEntity(_passwd)){
		_passwd		= null;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		_error = new Error('Not initialize yet, or configuration is not set');
		r3logger.elog(_error.message);
		dkcobj.clean();
		_callback(_error);
		return;
	}

	//
	// Keys for getting verify url
	//
	var	keys			= r3keys(_user, _tenant, _service);
	var	verifyurl		= dkcobj.getValue(keys.SERVICE_VERIFY_TENANT_KEY, null, true, null);
	if(!apiutil.isSafeString(verifyurl)){
		_error = new Error('key(' + keys.SERVICE_VERIFY_TENANT_KEY + ') does not have safe verify url nor JSON string : ' + JSON.stringify(verifyurl));
		r3logger.elog(_error.message);
		dkcobj.clean();
		_callback(_error);
		return;
	}

	//
	// Create tenant top under service
	//
	if(!rawCreateTenantEx(dkcobj, null, _tenant, _service)){
		_error = new Error('could not create tenant(' + _tenant + ') under service(' + _service + ')');
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
	acrutil.getACRSendVerify(_token, _user, _passwd, _tenant, verifyurl, function(error, resources)
	{
		if(null !== error){
			r3logger.elog(error.message);
			_callback(error);
			return;
		}

		var	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)

		//
		// Create resource
		//
		var	reskeys = rawCreateServiceTenantResource(dkcobj, _tenant, _service, resources);
		if(null === reskeys || apiutil.isEmptyArray(reskeys)){
			_error = new Error('could not create any resource key(' + JSON.stringify(resources) + ') for tenant(' + _tenant + ') and service(' + _service + ')');
			r3logger.elog(_error.message);
			dkcobj.clean();
			_callback(_error);
			return;
		}

		//
		// Create policy
		//
		if(!rawCreateServiceTenantPolicy(dkcobj, _tenant, _service, reskeys)){
			_error = new Error('could not create policy key for tenant(' + _tenant + ') and service(' + _service + ')');
			r3logger.elog(_error.message);
			dkcobj.clean();
			_callback(_error);
			return;
		}

		//
		// Create role
		//
		if(!rawCreateServiceTenantRole(dkcobj, _tenant, _service)){
			_error = new Error('could not create role key for tenant(' + _tenant + ') and service(' + _service + ')');
			r3logger.elog(_error.message);
			dkcobj.clean();
			_callback(_error);
			return;
		}

		dkcobj.clean();
		_callback(null);
	});
}

//---------------------------------------------------------
// create tenant key(with service, user)
//---------------------------------------------------------
//	tenant			: tenant name
//	service			: service name
//	user			: user name(this value is used for calling verify URL)
//	passwd			: user pass phrase(this value is used for calling verify URL)
//	callback		: callback function
//
function rawCreateServiceTenantByUser(tenant, service, user, passwd, callback)
{
	return rawCreateServiceTenantEx(tenant, service, null, user, passwd, callback);
}

//---------------------------------------------------------
// create tenant key(with service, unscoped user token)
//---------------------------------------------------------
//	tenant			: tenant name
//	service			: service name
//	unscopedtoken	: unscoped user token(this value is used for calling verify URL)
//	user			: user name(this value is used for calling verify URL)
//	callback		: callback function
//
function rawCreateServiceTenantByUnscopedToken(tenant, service, unscopedtoken, user, callback)
{
	return rawCreateServiceTenantEx(tenant, service, unscopedtoken, user, null, callback);
}

//---------------------------------------------------------
// create tenant key(with service, scoped user token)
//---------------------------------------------------------
//	tenant			: tenant name
//	service			: service name
//	scopedtoken		: scoped user token(this value is used for calling verify URL)
//	callback		: callback function
//
function rawCreateServiceTenantByScopedToken(tenant, service, scopedtoken, callback)
{
	return rawCreateServiceTenantEx(tenant, service, scopedtoken, null, null, callback);
}

//---------------------------------------------------------
// Common remove tenant under service
//---------------------------------------------------------
//	tenantname						: tenant name
//	servicename						: service name
//	is_remove_tenant_from_service	: remove tenant name from tenant list under service key(default: true)
//
function rawRemoveServiceTenantEx(dkcobj_permanent, tenantname, servicename, is_remove_tenant_from_service)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenantname, servicename)){
		r3logger.elog('parameters are wrong : tenantname=' + JSON.stringify(tenantname) + ', service=' + JSON.stringify(servicename));
		return false;
	}
	if(!apiutil.isSafeEntity(is_remove_tenant_from_service) && 'boolean' !== typeof is_remove_tenant_from_service){
		is_remove_tenant_from_service = true;
	}

	//
	// Keys
	//
	var	keys		= r3keys(null, tenantname, servicename);
	var	subkeylist;

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
	if(!dkcobj_permanent.remove(keys.TENANT_TOP_KEY, false)){								// remove key yrn:yahoo:<service>::<tenant>
		r3logger.elog('could not remove key(' + keys.TENANT_TOP_KEY + ') under service(' + JSON.stringify(servicename) + ') and tenant(' + JSON.stringify(tenantname) + ')');
		return false;
	}

	//
	// Remove tenant top from region subkey list
	//
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.SERVICE_NO_REGION_KEY, true));
	if(apiutil.removeStringFromArray(subkeylist, keys.TENANT_TOP_KEY)){
		// remove tenant top key under service(no region)
		if(!dkcobj_permanent.setSubkeys(keys.SERVICE_NO_REGION_KEY, subkeylist)){			// remove subkey yrn:yahoo:<service>::<tenant> -> yrn:yahoo:<service>:
			r3logger.elog('could not remove key(' + keys.TENANT_TOP_KEY + ') from ' + keys.SERVICE_NO_REGION_KEY);
			return false;
		}
	}
	if(apiutil.isEmptyArray(subkeylist)){
		// Service no region key does not have any children,
		// on this case it can remove service(+tenant) top key
		//
		if(!dkcobj_permanent.remove(keys.SERVICE_NO_REGION_KEY, false)){					// remove key yrn:yahoo:<service>:
			r3logger.elog('could not remove key(' + keys.SERVICE_NO_REGION_KEY + '), but continue...');
		}
		if(!dkcobj_permanent.remove(keys.SERVICE_TOP_KEY, false)){							// remove key yrn:yahoo:<service>
			r3logger.elog('could not remove key(' + keys.SERVICE_TOP_KEY + '), but continue...');
		}

		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.DOMAIN_KEY, true));
		if(apiutil.removeStringFromArray(subkeylist, keys.SERVICE_TOP_KEY)){
			// remove tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.DOMAIN_KEY, subkeylist)){					// remove subkey yrn:yahoo:<service> -> yrn:yahoo
				r3logger.elog('could not remove key(' + keys.SERVICE_TOP_KEY + ') from ' + keys.DOMAIN_KEY + '), but continue...');
			}
		}
	}

	//
	// Remove service name from tenant's service list
	//
	if(is_remove_tenant_from_service){
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.TENANT_SERVICE_KEY, true));
		if(apiutil.removeStringFromArray(subkeylist, keys.MASTER_SERVICE_KEY)){
			// remove tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.TENANT_SERVICE_KEY, subkeylist)){				// remove subkey yrn:yahoo::::service:<service> -> yrn:yahoo:::<tenant>:service
				r3logger.elog('could not remove key(' + keys.MASTER_SERVICE_KEY + ') from ' + keys.TENANT_SERVICE_KEY);
				return false;
			}
		}
	}

	//
	// Remove tenant name from service's tenant list
	//
	if(is_remove_tenant_from_service){
		subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.SERVICE_TENANT_KEY, true));
		if(apiutil.removeStringFromArray(subkeylist, keys.MASTER_TENANT_TOP_KEY)){
			// remove tenant top key under service(no region)
			if(!dkcobj_permanent.setSubkeys(keys.SERVICE_TENANT_KEY, subkeylist)){				// remove subkey yrn:yahoo:::<tenant> -> yrn:yahoo::::service:<service>:tenant
				r3logger.elog('could not remove key(' + keys.MASTER_TENANT_TOP_KEY + ') from ' + keys.SERVICE_TENANT_KEY);
				return false;
			}
		}
	}
	return true;
}

//---------------------------------------------------------
// Remove tenant under service
//---------------------------------------------------------
//	user			: user name(user must be tenant member)
//	tenant			: tenant name
//	service			: service name
//
function rawRemoveServiceTenant(user, tenant, service)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant, service)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
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
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
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
}

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
//	return object
//	{
//		"result":		true or false		: result
//		"message":		error message		: error message when error
//		"resources":	null or array		: all resources when no error
//		[
//			{
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
function rawGetServiceTenantResources(service, service_ip, service_port, service_cuk, service_roleyrn, client_ip, client_port, client_cuk, client_roleyrn)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(service, service_ip, service_roleyrn, client_ip, client_roleyrn)){	// service_port, client_port are allowed null
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : service=' + JSON.stringify(service) + ', service_ip=' + JSON.stringify(service_ip) + ', service_roleyrn=' + JSON.stringify(service_roleyrn) + ', client_ip=' + JSON.stringify(client_ip) + ', client_roleyrn=' + JSON.stringify(client_roleyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeEntity(service_port)){
		service_port = 0;																	// clear
	}
	if(!apiutil.isSafeEntity(client_port)){
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
	var	keys			= r3keys(null, null, service);										// temporary
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= service_roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + service_roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	var	service_tenant	= rolematches[2].toLowerCase();

	rolematches			= client_roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + client_roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	var	client_tenant	= rolematches[2].toLowerCase();

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	subkeylist;
	var	resources		= null;
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
	keys		= r3keys(null, client_tenant, service);										// Keys for client
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.SERVICE_TENANT_KEY, true));	// check client tenant is in service's tenant list -> yrn:yahoo::::service:<service>:tenant
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
	var	roledata						= {};
	roledata[keys.VALUE_POLICIES_TYPE]	= [];
	if(!rawGetRoles(dkcobj, client_roleyrn, roledata, true) || apiutil.isEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		resobj.result	= false;
		resobj.message	= 'could not get any policy data for client role(' + client_roleyrn + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// make resource top path to access
	keys				= r3keys(null, client_tenant, service);								// Keys for service + tenant(client)
	var	target_policy	= keys.POLICY_TOP_KEY + ':' + keys.ACR_POLICY_KW;					// 'yrn:yahoo:<service>::<tenant>:policy:arc-policy'

	// check policies
	if(!apiutil.findStringInArray(roledata[keys.VALUE_POLICIES_TYPE], target_policy)){
		resobj.result	= false;
		resobj.message	= 'role(' + client_roleyrn + ') does not allow to read access to resource(' + keys.RESOURCE_TOP_KEY + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Get all service/client_tenant resource keys
	//
	subkeylist	= dkcobj.getSubkeys(keys.RESOURCE_TOP_KEY, true);							// get subkey list from yrn:yahoo:<service>::<tenant>:resource:*
	if(!apiutil.isEmptyArray(subkeylist)){
		//
		// Get each resource's hole data
		//
		var	ptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);						// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
		var	matches;
		for(var cnt = 0; cnt < subkeylist.length; ++cnt){
			// check resource name and path
			matches	= subkeylist[cnt].match(ptn);
			if(apiutil.isEmptyArray(matches) || matches.length < 4 || !apiutil.isSafeString(matches[1]) || !apiutil.isSafeString(matches[2]) || !apiutil.isSafeString(matches[3])){
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
			var	resource_result = rawGetResourceEx(dkcobj, matches[2].toLowerCase(), matches[1].toLowerCase(), subkeylist[cnt], true);
			if(!resource_result.result){
				r3logger.wlog('could not get resource (' + JSON.stringify(subkeylist[cnt]) + ') with expanding, but continue...');
				continue;
			}
			// set one resource object
			var	one_resource = {};
			one_resource[keys.ACR_RESOURCE_NAME_KEY]	= matches[3].toLowerCase();
			if(apiutil.isSafeEntity(resource_result.resource)){
				// expire
				if(apiutil.isSafeEntity(resource_result.resource[keys.VALUE_EXPIRE_TYPE]) && null !== resource_result.resource[keys.VALUE_EXPIRE_TYPE]){
					one_resource[keys.ACR_RESOURCE_EXPIRE_KEY]	= resource_result.resource[keys.VALUE_EXPIRE_TYPE];
				}
				// type & data
				if(apiutil.isSafeString(resource_result.resource[keys.VALUE_STRING_TYPE])){
					// string type
					one_resource[keys.ACR_RESOURCE_TYPE_KEY]	= keys.VALUE_STRING_TYPE;
					one_resource[keys.ACR_RESOURCE_DATA_KEY]	= resource_result.resource[keys.VALUE_STRING_TYPE];
				}else if(apiutil.isSafeString(resource_result.resource[keys.VALUE_OBJECT_TYPE])){
					// object type
					one_resource[keys.ACR_RESOURCE_TYPE_KEY]	= keys.VALUE_OBJECT_TYPE;
					one_resource[keys.ACR_RESOURCE_DATA_KEY]	= resource_result.resource[keys.VALUE_OBJECT_TYPE];
				}else{
					// default is string type
					one_resource[keys.ACR_RESOURCE_TYPE_KEY]	= keys.VALUE_STRING_TYPE;
					one_resource[keys.ACR_RESOURCE_DATA_KEY]	= apiutil.isSafeEntity(resource_result.resource[keys.VALUE_STRING_TYPE]) ? resource_result.resource[keys.VALUE_STRING_TYPE] : null;
				}
				// keys
				if(apiutil.isSafeEntity(resource_result.resource[keys.VALUE_KEYS_TYPE])){
					one_resource[keys.ACR_RESOURCE_KEYS_KEY]	= resource_result.resource[keys.VALUE_KEYS_TYPE];
				}
			}
			if(null === resources){
				resources = [];
			}
			resources.push(one_resource);
		}
	}
	// set resources
	resobj.resources = resources;

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// create user key
//---------------------------------------------------------
function rawCreateUser(user, id, username, tenant)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(user)){														// allow username/tenant is null
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(id) && isNaN(id)){
		// id allows hex character string, decimal character string, decimal number value.
		//
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : id=' + JSON.stringify(id);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(id)){
		// to string
		id = String(id);
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	keys			= r3keys(user, tenant);
	var	subkeylist;
	var	value;
	var	need_update		= false;
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
	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.USER_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_KEY)){
		if(!dkcobj.setSubkeys(keys.USER_TOP_KEY, subkeylist)){								// add subkey yrn:yahoo::::user:<user> -> yrn:yahoo::::user
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.USER_KEY + ' subkey under ' + keys.USER_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.USER_KEY, true));
	need_update	= false;
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_ID_KEY)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_TOP_KEY)){
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj.setSubkeys(keys.USER_KEY, subkeylist)){									// add subkey yrn:yahoo::::user:<user>:{id, tenant} -> yrn:yahoo::::user:<user>
			resobj.result	= false;
			resobj.message	= 'could not add ' + keys.USER_ID_KEY + ', ' + keys.USER_TENANT_TOP_KEY + ' subkey under ' + keys.USER_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	value = dkcobj.getValue(keys.USER_ID_KEY, null, true, null);
	if(value != id){
		if(!dkcobj.setValue(keys.USER_ID_KEY, id)){											// update value user id -> yrn:yahoo::::user:<user>:id
			resobj.result	= false;
			resobj.message	= 'could not set ' + id + ' to ' + keys.USER_ID_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	subkeylist	= apiutil.getSafeArray(dkcobj.getSubkeys(keys.USER_TENANT_TOP_KEY, true));
	need_update	= false;
	if(apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_COMMON_KEY)){
		need_update	= true;
	}
	if(apiutil.isSafeString(keys.USER_TENANT_KEY) && apiutil.tryAddStringToArray(subkeylist, keys.USER_TENANT_KEY)){
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj.setSubkeys(keys.USER_TENANT_TOP_KEY, subkeylist)){						// add subkey yrn:yahoo::::user:<user>:tenant{/, /<tenant>} -> yrn:yahoo::::user:<user>:tenant
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
}

//---------------------------------------------------------
// get user information
//---------------------------------------------------------
// return:	null or object
//				{
//					'name':	user name,
//					'id':	user id
//				}
//
function rawGetUserId(username)
{

	if(!apiutil.isSafeString(username)){
		r3logger.elog('parameter is wrong : username=' + JSON.stringify(username));
		return null;
	}

	var	keys	= r3keys(username.toLowerCase(), null);
	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		dkcobj.clean();
		return null;
	}

	var	value 	= dkcobj.getValue(keys.USER_ID_KEY, null, true, null);						// get user id from yrn:yahoo::::user:<user>:id
	dkcobj.clean();
	if(!apiutil.isSafeString(value)){
		r3logger.dlog('could not find user(' + username + ')');
		return null;
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	resobj = {
					'name':	username.toLowerCase(),
					'id':	value.toLowerCase()
				 };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	return resobj;
}

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
function rawRemoveComprehensionByNewTenants(user, tenant_list)
{
	if(!apiutil.isSafeString(user)){
		r3logger.elog('user parameter is wrong');
		return false;
	}
	var	result				= true;
	var	cnt;

	// make new tenant keys
	var	notenant_keys		= r3keys(user);													// no tenant keys
	var	keys;
	var	new_user_tenants	= [notenant_keys.USER_TENANT_COMMON_KEY];						// "yrn:yahoo::::user:<user>:tenant/"			---> must have unscoped token in tenant list
	if(!apiutil.isEmptyArray(tenant_list)){
		for(cnt = 0; cnt < tenant_list.length; ++cnt){
			var	tenant_name	= apiutil.getSafeString(tenant_list[cnt]);
			if('' !== tenant_name){
				keys = r3keys(user, tenant_name);											// user + tenant keys
				new_user_tenants.push(keys.USER_TENANT_KEY);								// "yrn:yahoo::::user:<user>:tenant/<tenant>"	---> add new tenant to list
			}
		}
	}

	// get current tenant list
	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	cur_user_tenants	= dkcobj.getSubkeys(notenant_keys.USER_TENANT_TOP_KEY, true);		// get current tenant list
	var	rm_user_tenants		= new Array(0);														// tenant key name in user key which must be removed
	var	tg_tenant_keys		= new Array(0);														// tenant key name which has user name who must be removed
	var	pattern				= new RegExp('^' + notenant_keys.USER_TENANT_COMMON_KEY + '(.*)');	// regex = /^yrn:yahoo::::user:<user>\:tenant\/(.*)/
	var	is_changed			= false;
	if(!apiutil.isEmptyArray(cur_user_tenants)){
		for(cnt = 0; cnt < cur_user_tenants.length; ){
			var	cur_tenant	= cur_user_tenants[cnt].toLowerCase();
			if(!apiutil.findStringInArray(new_user_tenants, cur_tenant)){
				// not found current tenant key in new tenants list, so add removed key list
				cur_user_tenants.splice(cnt, 1);
				rm_user_tenants.push(cur_tenant);

				// add tenant's user key
				var	match_tenant_names	= cur_tenant.match(pattern);						// reverse to only tenant name
				if(!apiutil.isEmptyArray(match_tenant_names) && 2 <= match_tenant_names.length && '' !== match_tenant_names[1]){
					keys = r3keys(user, match_tenant_names[1]);								// user + matched tenant name keys
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
		if(!dkcobj.setSubkeys(notenant_keys.USER_TENANT_TOP_KEY, cur_user_tenants)){		// update subkey "yrn:yahoo::::user:<user>:tenant/{<tenant>...}"	---> "yrn:yahoo::::user:<user>:tenant"
			r3logger.elog('could not update tenant subkey list under ' + notenant_keys.USER_TENANT_TOP_KEY + ' key');
			dkcobj.clean();
			return false;
		}

		// remove keys under user's tenant key
		for(cnt = 0; cnt < rm_user_tenants.length; ++cnt){
			if(!dkcobj.remove(rm_user_tenants[cnt], true)){									// remove old tenant key and it's children		---> "yrn:yahoo::::user:<user>:tenant/<tenant>{/*}"
				r3logger.elog('could not remove user tenant key ' + rm_user_tenants[cnt] + ', but continue...');
				result	= false;
			}
		}

		// remove user name in tenant's subkey
		for(cnt = 0; cnt < tg_tenant_keys.length; ++cnt){
			var	tg_tenant_userlist	= dkcobj.getSubkeys(tg_tenant_keys[cnt], true);			// get user list in target tenant key
			if(apiutil.findStringInArray(tg_tenant_userlist, notenant_keys.USER_KEY)){
				// remove user name from subkey list
				if(!apiutil.removeStringFromArray(tg_tenant_userlist, notenant_keys.USER_KEY)){
					r3logger.elog('could not remove user subkey list in tenant user key ' + tg_tenant_keys[cnt] + ', but continue...');
					result	= false;
				}else{
					// update user list
					if(!dkcobj.setSubkeys(tg_tenant_keys[cnt], tg_tenant_userlist)){		// update subkey "yrn:yahoo:::<tenant>:user"
						r3logger.elog('could not remove user subkey list in tenant user key ' + tg_tenant_keys[cnt] + ', but continue...');
						result	= false;
					}
				}
			}
		}
	}

	dkcobj.clean();
	return result;
}

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
//							{
//								hostname:	"x.y.x.yahoo.co.jp"	(or null)
//								ip:			"172.1.1.1"			(or null)
//								port:		8000				(if not specify, the value is 0="any")
//								cuk:		"any string"		(if not specify, the value is null or undefined)
//								extra:		"explain, etc"		(if not specify, the value is null or undefined)
//								tag:		"tag string"		(if not specify, the value is null or undefined)
//								inboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//								outboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//							}
//
// [NOTE]				:	if parent role key does not have this role key, set role key
//							into parent's subkey
//							The role, policies, hosts, ips, clear_old_* arguments must not be specified when
//							service name is specified.
//							Must exist yrn:yahoo:<service>::<tenant> key before calling this function.
//
function rawCreateRoleEx(dkcobj_permanent, user, tenant, service, role, policies, alias_roles, hosts, clear_old_hostnames, ips, clear_old_ips)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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

	var	keys;
	var	is_service	= false;
	var	is_policies	= false;
	var	is_alias	= false;
	var	fileter_cnt;

	if(apiutil.isSafeString(service)){
		// service name is specified.
		// the role is ACR(accessing crossed roles), then checking parameters for it.
		// (policies, hosts, ips, aliases must be empty.)
		//
		is_service	= true;
		service		= apiutil.getSafeString(service).toLowerCase();
		keys		= r3keys(user, tenant, service);

		if(apiutil.isSafeEntity(role)){
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
		role				= keys.ROLE_TOP_KEY + ':' + keys.ACR_ROLE_KW;					// role yrn path     = 'yrn:yahoo:<service>::<tenant>:role:arc-role'
		policies			= [keys.POLICY_TOP_KEY + ':' + keys.ACR_POLICY_KW];				// set static policy = 'yrn:yahoo:<service>::<tenant>:policy:arc-policy'
		is_policies			= true;
		hosts				= new Array(0);
		ips					= new Array(0);
		clear_old_hostnames	= true;
		clear_old_ips		= true;

	}else{
		// service name is not specified.
		// the role is NOT ACR(accessing crossed roles).
		//
		service		= null;
		keys		= r3keys(user, tenant, null);

		if(!apiutil.isSafeString(role)){
			r3logger.elog('parameter role is wrong : role=' + JSON.stringify(role));
			return false;
		}
		if(policies instanceof Array){
			is_policies	= true;
		}else if(!apiutil.isSafeEntity(policies)){
			is_policies	= false;
			policies	= new Array(0);														// for initializing
		}else if('' === policies){
			is_policies	= true;
			policies	= new Array(0);
		}else{
			r3logger.elog('parameter policies is wrong : policies=' + JSON.stringify(policies));
			return false;
		}
		if(!apiutil.isSafeEntity(hosts)){
			hosts		= new Array(0);
		}else{
			hosts		= getSafeHosts(hosts);
			for(fileter_cnt = 0; fileter_cnt < hosts.length; ){
				if(!apiutil.isSafeString(hosts[fileter_cnt].hostname)){
					delete hosts.splice(fileter_cnt, 1);
				}else{
					++fileter_cnt;
				}
			}
		}
		if(!apiutil.isSafeEntity(clear_old_hostnames) || 'boolean' !== typeof clear_old_hostnames){
			clear_old_hostnames = false;
		}
		if(!apiutil.isSafeEntity(ips)){
			ips			= new Array(0);
		}else{
			ips			= getSafeHosts(ips);
			for(fileter_cnt = 0; fileter_cnt < ips.length; ){
				if(!apiutil.isSafeString(ips[fileter_cnt].ip)){
					delete ips.splice(fileter_cnt, 1);
				}else{
					++fileter_cnt;
				}
			}
		}
		if(!apiutil.isSafeEntity(clear_old_ips) || 'boolean' !== typeof clear_old_ips){
			clear_old_ips = false;
		}
		if(alias_roles instanceof Array){
			is_alias	= true;
		}else if(!apiutil.isSafeEntity(alias_roles)){
			is_alias	= false;
		}else if('' === alias_roles){
			is_alias	= true;
			alias_roles	= new Array(0);
		}else{
			r3logger.elog('parameter alias_roles is wrong : alias_roles=' + JSON.stringify(alias_roles));
			return false;
		}
	}

	role			= role.toLowerCase();
	var	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches	= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(role.match(roleptn)){
			r3logger.elog('role(' + role + ') is not role yrn path)');
			return false;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check service/tenant name
		if(tenant !== rolematches[2] || (is_service && service !== rolematches[1]) || (!is_service && apiutil.isSafeString(rolematches[1]))){
			r3logger.elog('role(' + role + ') yrn has service(' + rolematches[1] + ') and tenant(' + rolematches[2] + '), but it is not specified service(' + (is_service ? service : 'null') + ') and tenant(' + tenant + ')');
			return false;
		}
		// role is set only role name
		role = rolematches[3];
	}

	//
	// keys
	//
	var	role_tmp		= ':' + role;														// ":<role>{/<role>{...}}"
	var	role_key		= keys.ROLE_TOP_KEY + role_tmp;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	policies_key	= role_key	+ '/' + keys.POLICIES_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	var	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	var	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	var	id_key			= role_key	+ '/' + keys.ID_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	var	alias_key		= role_key	+ '/' + keys.ALIAS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"
	var	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"

	var	value;
	var	subkeylist;
	var	need_update		= false;

	// create role key(with subkeys tree from role top key)
	if(!rawCreateKeyTree(dkcobj_permanent, keys.ROLE_TOP_KEY, role_tmp, false)){
		r3logger.elog('could not create role key tree(' + role + ') from role top key(' + keys.ROLE_TOP_KEY + ')');
		return false;
	}
	value = dkcobj_permanent.getValue(role_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(role_key, keys.VALUE_ENABLE)){						// set value "enable" for make top key -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + role_key + ' key');
			return false;
		}
	}

	// check policies/reference/alias/hosts key
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(role_key, true));
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
	if(is_alias && 0 < alias_roles.length && apiutil.tryAddStringToArray(subkeylist, alias_key)){	// Make alias key in subkey list only when new alias exists
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){								// add subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/{type, reference, keys, @} -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not add ' + role_key + '/* subkeys under ' + role_key + ' key');
			return false;
		}
	}

	// check name/ip key under hosts key
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(hosts_key, true));
	if(apiutil.tryAddStringToArray(subkeylist, name_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, ip_key)){
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj_permanent.setSubkeys(hosts_key, subkeylist)){							// add subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name, ip} -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts
			r3logger.elog('could not add ' + name_key + ' and ' + ip_key + ' subkeys under ' + hosts_key + ' key');
			return false;
		}
	}

	// reference key
	value = dkcobj_permanent.casGet(reference_key);
	if(null === value || undefined === value){
		if(!dkcobj_permanent.casInit(reference_key, 0)){									// initialize cas value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference
			r3logger.elog('could not initialize reference value to ' + reference_key + ' key');
			return false;
		}
	}

	// policies key
	value = dkcobj_permanent.getValue(policies_key, null, true, null);
	value = apiutil.parseJSON(value);
	if((is_policies && !apiutil.compareArray(value, policies)) || (!is_policies && (null === value || undefined === value))){
		if(!dkcobj_permanent.setValue(policies_key, JSON.stringify(policies))){				// set value "policies" -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies
			r3logger.elog('could not set ' + JSON.stringify(policies) + ' value to ' + policies_key + ' key');
			return false;
		}
	}

	// check hosts/{name, ip} key's value(these key must have dummy value)
	value = dkcobj_permanent.getValue(name_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(name_key, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + name_key + ' key');
			return false;
		}
	}
	value = dkcobj_permanent.getValue(ip_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(ip_key, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + ip_key + ' key');
			return false;
		}
	}

	// hosts/name key
	if(0 < hosts.length || clear_old_hostnames){
		if(!rawCreateRoleHosts(dkcobj_permanent, role_key, hosts, clear_old_hostnames, false)){		// overwrite/replace hosts(not clear old) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/{hosts, hosts/name/<...>}
			r3logger.elog('could not add / replace ' + JSON.stringify(hosts) + ' key/subkeys under ' + hosts_key + ' key');
			return false;
		}
	}
	// hosts/ip key
	if(0 < ips.length || clear_old_ips){
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
		value = apiutil.getStrUuid4();
		if(!dkcobj_permanent.setValue(id_key, value)){										// set value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id
			r3logger.elog('could not set ' + JSON.stringify(value) + ' value to ' + id_key + ' key');
			return false;
		}
	}

	// aliases
	value = dkcobj_permanent.getValue(alias_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(is_alias){
		var	cnt;
		var	tmpres;
		if(0 === alias_roles.length){
			if(null !== value){
				// if there is alias array, alias role reference is needed to decrement
				if(!apiutil.isEmptyArray(value)){
					for(cnt = 0; cnt < value.length; ++cnt){
						tmpres = rawIncDecReferenceCount(dkcobj_permanent, value[cnt], false);
						if(!tmpres.result){
							r3logger.wlog('Failed to decrement reference in policy(' + value[cnt] + ') included from role(' + role_key + '), but continue...');
						}
					}
				}
				// New aliases is empty, so we removed alias key
				if(!dkcobj_permanent.remove(alias_key, false)){								// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + role_key + ' key');
					return false;
				}
			}
			// remove subkey(alias:@) in role subkey list
			subkeylist	= dkcobj_permanent.getSubkeys(role_key, true);
			if(apiutil.removeStringFromArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){						// remove subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@ -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + role_key + ' key');
					return false;
				}
			}
		}else{
			// get removing element(alias role) & decrement it's reference
			var	delarr = apiutil.getDeletingDifferenceArray(value, alias_roles);
			for(cnt = 0; cnt < delarr.length; ++cnt){
				tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in role(' + delarr[cnt] + ') included from role(' + role_key + '), but continue...');
				}
			}
			// set aliases value 
			if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(alias_roles))){			// update value alias -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@
				r3logger.elog('could not set ' + JSON.stringify(alias_roles) + ' value to ' + alias_key + ' key');
				return false;
			}
			// get adding element(alias role) & increment it's reference
			var	addarr = apiutil.getAddingDifferenceArray(value, alias_roles);
			for(cnt = 0; cnt < addarr.length; ++cnt){
				tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
				if(!tmpres.result){
					r3logger.wlog('Failed to increment reference in role(' + addarr[cnt] + ') included from role(' + role_key + '), but continue...');
				}
			}
			// add subkey(alias:@) in role subkey list
			subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(role_key, true));
			if(apiutil.tryAddStringToArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){						// add subkey yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@ -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
					r3logger.elog('could not add ' + alias_key + ' subkey under ' + role_key + ' key');
					return false;
				}
			}
		}
	}

	// check tokens key
	value = dkcobj_permanent.getValue(tokens_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(tokens_key, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + tokens_key + ' key');
			return false;
		}
	}

	return true;
}

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
function rawCreateRole(user, tenant, role, policies, alias_roles, hosts, clear_old_hostnames, ips, clear_old_ips)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);		// use permanent object(need to clean)
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
}

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
function rawCreateServiceTenantRole(dkcobj_permanent, tenant, service)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	return rawCreateRoleEx(dkcobj_permanent, null, tenant, service);
}

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
function rawRemoveRoleEx(dkcobj_permanent, tenant, service, role)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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
	var	keys;
	var	is_service	= false;
	if(apiutil.isSafeString(service)){
		// service name is specified.
		//
		is_service	= true;
		service		= apiutil.getSafeString(service).toLowerCase();
		keys		= r3keys(null, tenant, service);

		if(apiutil.isSafeEntity(role)){
			r3logger.elog('parameter role is specified, but this role is ARC : service =' + JSON.stringify(service) + ', tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role));
			return false;
		}
		role		= keys.ROLE_TOP_KEY + ':' + keys.ACR_ROLE_KW;							// role yrn path     = 'yrn:yahoo:<service>::<tenant>:role:arc-role'

	}else{
		// service name is not specified.
		//
		if(!apiutil.isSafeString(role)){
			r3logger.elog('parameter role is wrong : role=' + JSON.stringify(role));
			return false;
		}
		keys		= r3keys(null, tenant, null);
	}

	// check role name is only name or full yrn path
	role			= role.toLowerCase();
	var	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches	= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		// role is not matched role(maybe not full yrn), then we need check it is another yrn path
		roleptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(role.match(roleptn)){
			r3logger.elog('role(' + role + ') is not role yrn path)');
			return false;
		}
		// role is only role name, then we do not modify it.
	}else{
		// check service/tenant name
		if(tenant !== rolematches[2] || (is_service && service !== rolematches[1]) || (!is_service && apiutil.isSafeString(rolematches[1]))){
			r3logger.elog('role(' + role + ') yrn has service(' + rolematches[1] + ') and tenant(' + rolematches[2] + '), but it is not specified service(' + (is_service ? service : 'null') + ') and tenant(' + tenant + ')');
			return false;
		}
		// role is set only role name
		role = rolematches[3];
	}

	//
	// keys
	//
	var	role_key		= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	policies_key	= role_key	+ '/' + keys.POLICIES_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	var	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	var	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	var	id_key			= role_key	+ '/' + keys.ID_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	var	alias_key		= role_key	+ '/' + keys.ALIAS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"
	var	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"
	var	subkeylist;

	// remove all both hosts/{name, ip}/... keys under hosts key
	if(!rawRemoveRoleHostAll(dkcobj_permanent, role_key)){									// remove all key/subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<...>
		r3logger.elog('could not remove all hostname/ip under ' + hosts_key + '/{name or ip} key');
		return false;
	}
	if(!dkcobj_permanent.remove(name_key, true)){											// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
		r3logger.dlog('could not remove ' + name_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(ip_key, true)){												// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
		r3logger.dlog('could not remove ' + ip_key + 'key, probably it is not existed');
	}

	// remove role tokens subkeys
	subkeylist = apiutil.getSafeArray(dkcobj_permanent.getSubkeys(tokens_key, false));		// not check attributes
	if(apiutil.isEmptyArray(subkeylist) && !r3token.directRemoveRoleTokens(dkcobj_permanent, subkeylist)){	// remove all role token from yrn:yahoo::::token:role
		r3logger.dlog('failed to remove ' + JSON.stringify(subkeylist) + ' role tokens under role token key, but continue...');
	}

	// remove subkeys under role key
	if(!dkcobj_permanent.remove(policies_key, true)){										// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies
		r3logger.dlog('could not remove ' + policies_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(reference_key, true)){										// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference
		r3logger.dlog('could not remove ' + reference_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(hosts_key, true)){											// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts
		r3logger.dlog('could not remove ' + hosts_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(id_key, true)){												// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id
		r3logger.dlog('could not remove ' + id_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(tokens_key, true)){											// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens
		r3logger.dlog('could not remove ' + tokens_key + 'key, probably it is not existed');
	}
	if(!dkcobj_permanent.remove(alias_key, true)){											// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@
		r3logger.dlog('could not remove ' + alias_key + 'key, probably it is not existed');
	}

	// check subkeys
	var	update	= false;
	subkeylist	= dkcobj_permanent.getSubkeys(role_key, true);
	if(!apiutil.isEmptyArray(subkeylist)){
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
		for(var cnt = 0; cnt < subkeylist.length; ){
			// get value and subkeys from role's one subkey
			var	tmp_value	= dkcobj_permanent.getValue(subkeylist[cnt], null, true, null);
			var	tmp_sklist	= dkcobj_permanent.getSubkeys(subkeylist[cnt], true);
			if(!apiutil.isSafeEntity(tmp_value) && apiutil.isEmptyArray(tmp_sklist)){
				// this role's one subkey is empty, so remove it from role's subkey list
				subkeylist.splice(cnt, 1);
				update	= true;
			}else{
				++cnt;
			}
		}
	}
	if(apiutil.isEmptyArray(subkeylist)){
		// role does not have any subkey, then remove role key
		if(!dkcobj_permanent.remove(role_key, false)){												// remove yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not remove ' + role_key + ' key, probably it is not existed, but continue...');
		}else{
			// remove role key from parent's subkey role list.
			if(!rawRemoveRoleSubkeyParentKey(dkcobj_permanent, role_key, keys.ROLE_TOP_KEY)){
				r3logger.elog('failed to check and remove parent keys for ' + role_key + ', but continue...');
			}
		}
	}else if(update){
		// there is rest subkeys and need to update it
		if(!dkcobj_permanent.setSubkeys(role_key, subkeylist)){										// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}
			r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + role_key + ' key');
			return false;
		}
	}else{
		// why?(nothing to do)
	}
	return true;
}

//---------------------------------------------------------
// remove role(no service) raw function
//---------------------------------------------------------
// user				:	user name
// tenant			:	tenant name
// role				:	role name or full yrn role
//
function rawRemoveRole(user, tenant, role)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant)){											// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
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
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
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
}

//---------------------------------------------------------
// remove role(with service) raw function
//---------------------------------------------------------
// tenant			:	tenant name
// service			:	service name
//
function rawRemoveServiceTenantRole(dkcobj_permanent, tenant, service)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenant, service)){
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
}

//
// Utility for rawRemoveRole function.
//
function rawRemoveRoleSubkeyParentKey(dkcobj_permanent, current_key, role_top_key)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(current_key, role_top_key) || 0 !== current_key.indexOf(role_top_key)){
		r3logger.elog('parameters is wrong : current_key=' + JSON.stringify(current_key) + ', role_top_key=' + JSON.stringify(role_top_key));
		return false;
	}

	// [NOTE]
	// here, we do not check current key that is role key full yrn path.
	//
	for(var	parent_key = null; role_top_key !== current_key; current_key = parent_key){
		parent_key	= apiutil.getParentPath(current_key);									// parent role key
		if(!apiutil.isSafeString(parent_key)){
			// this case is parent is top key, then force to set top key
			parent_key = role_top_key;
		}
		// parent's subkey list
		var	subkeylist = dkcobj_permanent.getSubkeys(parent_key, true);

		// remove current key from parent's subkey
		var	update	= apiutil.removeStringFromArray(subkeylist, current_key);
		if(apiutil.isEmptyArray(subkeylist)){
			// subkeys is empty
			if(role_top_key !== parent_key){
				if(!dkcobj_permanent.remove(parent_key, false)){							// remove parent key
					r3logger.elog('could not remove ' + parent_key + ' key');
					return false;
				}
			}else{
				// clear subkeys
				if(!dkcobj_permanent.setSubkeys(parent_key, subkeylist)){					// update parent's subkeys(empty)
					r3logger.elog('could not clear subkeys under ' + parent_key + ' key');
					return false;
				}
			}
		}else if(update){
			// updated and subkeys is not empty
			if(!dkcobj_permanent.setSubkeys(parent_key, subkeylist)){						// update parent's subkeys
				r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + parent_key + ' key');
				return false;
			}
			// no more removing keys
			break;
		}
	}
	return true;
}

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
function rawGetRole(role, is_expand)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(role)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if('boolean' !== typeof is_expand){
		is_expand	= true;															// default all expand
	}

	var	keys		= r3keys();
	var	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get role
	var	roledata						= {};
	roledata[keys.VALUE_POLICIES_TYPE]	= [];
	if(!is_expand){
		roledata[keys.VALUE_ALIAS_TYPE]	= null;
	}

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
}

//
// Utility - Get role data
//
//	roledata:	Must be object
//				{
//					policies:	array,
//					aliases:	array								<--- only not expand
//					hosts: {										<--- only not expand
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
function rawGetRoles(dkcobj_permanent, role, roledata, is_expand, checked_roles, base_role_top)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role)){
		r3logger.elog('some parameters are wrong : role=' + JSON.stringify(role));
		return false;
	}
	if('boolean' !== typeof is_expand){
		is_expand		= true;
	}
	if(!apiutil.isArray(checked_roles)){
		checked_roles	= new Array(0);
	}
	if(apiutil.findStringInArray(checked_roles, role)){
		r3logger.wlog('role(' + role + ') already checked, then this role is included from another role. Thus skip this for escaping blocking.');
		return true;
	}else{
		checked_roles.push(role);
	}
	var	value;
	var	cnt;

	//
	// keys
	//
	var	keys				= r3keys();														// temporary for regex key(getting tenant/service)
	var	parent_key			= apiutil.getParentPath(role);									// parent role key
	var	policies_key		= role + '/' + keys.POLICIES_KW;								// policies
	var	alias_key			= role + '/' + keys.ALIAS_KW;									// aliases

	// get tenant/service
	var	roleptn			= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4){
		r3logger.elog('role parameter is not match role path : role=' + JSON.stringify(role));
		return false;
	}
	// reset keys with tenant and service
	keys				= r3keys(null, rolematches[2], rolematches[1]);
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
	value = dkcobj_permanent.getValue(alias_key, null, true, null);
	if(is_expand){
		if(apiutil.isSafeEntity(value)){
			value = apiutil.parseJSON(value);
			if(!apiutil.isEmptyArray(value)){
				for(cnt = 0; cnt < value.length; ++cnt){
					// get alias roles
					if(!rawGetRoles(dkcobj_permanent, value[cnt], roledata, is_expand, checked_roles, base_role_top)){
						return false;
					}
				}
			}
		}
	}else{
		if(apiutil.checkSimpleJSON(value)){
			value = JSON.parse(value);
		}else{
			value = [];
		}
		roledata[keys.VALUE_ALIAS_TYPE] = value;
	}

	// get role policies
	value = dkcobj_permanent.getValue(policies_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(!apiutil.isEmptyArray(value)){
		if(apiutil.isEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){
			roledata[keys.VALUE_POLICIES_TYPE]	= new Array(0);
		}
		roledata[keys.VALUE_POLICIES_TYPE]		= roledata[keys.VALUE_POLICIES_TYPE].concat(value);
	}

	// get role hosts
	if(!is_expand){
		var	hosts = rawGetRoleHostLists(dkcobj_permanent, role, false, base_role_top);			// always not expand
		if(apiutil.isSafeEntity(hosts)){
			roledata[keys.VALUE_HOSTS_TYPE] = hosts.all;
		}else{
			r3logger.wlog('Could not get hosts in role(' + role + ') with error, but continue...');
			hosts = {
				'hostnames':	[],
				'ips':			[]
			};
			roledata[keys.VALUE_HOSTS_TYPE] = hosts;
		}
	}
	return true;
}

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
function rawAddHost(tenant, role, service, hostname, ip, port, cuk, extra, tag, inboundip, outboundip)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, role)){												// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(hostname) && apiutil.isEmptyArray(hostname) && !apiutil.isSafeString(ip) && apiutil.isEmptyArray(ip)){
		resobj.result	= false;
		resobj.message	= 'both hostname and ip parameters are empty.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isArray(hostname) && apiutil.isSafeString(hostname)){
		hostname = [hostname];
	}
	if(!apiutil.isArray(ip) && apiutil.isSafeString(ip)){
		ip = [ip];
	}
	if(!apiutil.isSafeEntity(port)){
		port = 0;
	}else if(isNaN(port)){
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
	var	keys		= r3keys(null, tenant, service);
	role			= role.toLowerCase();
	var	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches	= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
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

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
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
	var	role_key		= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

	// check hosts key for having value
	var	value = dkcobj.getValue(hosts_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj.setValue(hosts_key, keys.VALUE_ENABLE)){									// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts
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
		if(!dkcobj.setValue(name_key, keys.VALUE_ENABLE)){									// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			resobj.result	= false;
			resobj.message	= 'could not set ' + keys.VALUE_ENABLE + ' value to ' + name_key + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}
	value = dkcobj.getValue(ip_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj.setValue(ip_key, keys.VALUE_ENABLE)){									// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			resobj.result	= false;
			resobj.message	= 'could not set ' + keys.VALUE_ENABLE + ' value to ' + ip_key + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	// make hostname array
	var	hostarr	= new Array(0);
	var	onehost;
	var	cnt;
	if(!apiutil.isEmptyArray(hostname)){
		for(cnt = 0; cnt < hostname.length; ++cnt){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			onehost	= {	hostname:	hostname[cnt],											// hostname
						ip:			null,
						port:		port,
						cuk:		cuk,
						id:			apiutil.getStrUuid4(),
						extra:		apiutil.getSafeString(extra),
						tag:		apiutil.getSafeString(tag)
					  };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			// add optional keys
			if(apiutil.isSafeString(inboundip)){
				onehost.inboundip = inboundip;
			}
			if(apiutil.isSafeString(outboundip)){
				onehost.outboundip = outboundip;
			}
			hostarr.push(onehost);
		}
	}
	if(!apiutil.isEmptyArray(ip)){
		for(cnt = 0; cnt < ip.length; ++cnt){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			onehost	= {	hostname:	null,
						ip:			ip[cnt],												// ip address
						port:		port,
						cuk:		cuk,
						id:			apiutil.getStrUuid4(),
						extra:		apiutil.getSafeString(extra),
						tag:		apiutil.getSafeString(tag)
					  };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			// add optional keys
			if(apiutil.isSafeString(inboundip)){
				onehost.inboundip = inboundip;
			}
			if(apiutil.isSafeString(outboundip)){
				onehost.outboundip = outboundip;
			}
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
}

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
//						{
//							hostname:	"x.y.x.yahoo.co.jp"	(or null)
//							ip:			"172.1.1.1"			(or null)
//							port:		8000				(if not specify, the value is 0="any")
//							cuk:		"any string"		(if not specify, the value is null or undefined)
//							extra:		"explain, etc"		(if not specify, the value is null or undefined)
//							tag:		"tag string"		(if not specify, the value is null or undefined)
//							inboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//							outboundip:	"192.168.1.1"		(if not specify, the value is null or undefined)
//						}
//
// [NOTE]
// The hosts key under role key(yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}})
// must exist.
//
function rawCreateRoleHosts(dkcobj_permanent, role_key, hosts, is_clear_old_hosts, is_clear_old_ips)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return false;
	}
	if('boolean' !== typeof is_clear_old_hosts){
		is_clear_old_hosts	= false;
	}
	if('boolean' !== typeof is_clear_old_ips){
		is_clear_old_ips	= false;
	}

	// check hosts parameter
	if(null === hosts){
		// nothing to do
		return true;
	}else if('' === hosts){
		// set empty array to hosts
		hosts = new Array(0);
	}
	if(!apiutil.isArray(hosts) || (apiutil.isEmptyArray(hosts) && !is_clear_old_hosts && !is_clear_old_ips )){
		// if not need to update, stop processing here.
		return true;
	}
	// check hosts array elements
	for(cnt = 0; cnt < hosts.length; ++cnt){
		if(apiutil.isSafeString(hosts[cnt].hostname) === apiutil.isSafeString(hosts[cnt].ip)){
			r3logger.elog('hosts parameter has wrong element: (No. ' + cnt + ') both hostname and ip are empty or not empty.');
			return false;
		}
		if(!apiutil.isSafeEntity(hosts[cnt].port)){
			hosts[cnt].port = 0;
		}else if(isNaN(hosts[cnt].port)){
			r3logger.elog('hosts parameter has wrong element: (No. ' + cnt + ') port(' + JSON.stringify(hosts[cnt].port) + ') is wrong.');
			return false;
		}
		if(apiutil.isSafeString(hosts[cnt].cuk) && apiutil.isSafeString(hosts[cnt].cuk.trim())){
			hosts[cnt].cuk = hosts[cnt].cuk.trim();
		}else{
			hosts[cnt].cuk = null;
		}
	}

	//
	// keys
	//
	var	keys		= r3keys();
	var	hosts_key	= role_key	+ '/' + keys.HOSTS_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key	= hosts_key	+ '/' + keys.HOSTS_NAME_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key		= hosts_key	+ '/' + keys.HOSTS_IP_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

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
		for(cnt = 0; cnt < hosts.length; ++cnt){
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
	var	ip_subkeylist	= dkcobj_permanent.getSubkeys(ip_key, true);						// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
	var	name_subkeylist	= dkcobj_permanent.getSubkeys(name_key, true);						// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
	var	cuk_list		= new Array();														// array member is object = { cuk: "cuk value", subkey: "path to ip key", extra: "extra"}
	var	update_ip_skey	= false;
	var	update_name_skey= false;

	// loop for add host(ip) to under hosts/{name or ip} key
	for(var cnt = 0; cnt < hosts.length; ++cnt){
		// make one host information
		var	tg_host_info		= hosts[cnt];
		var	tg_port				= (0 === hosts[cnt].port ? keys.VALUE_ANY_PORT : String(hosts[cnt].port));
		var	tg_cuk				= (null === hosts[cnt].cuk ? '' : apiutil.getSafeString(hosts[cnt].cuk).trim());
		var	is_ip				= apiutil.isSafeString(hosts[cnt].ip);
		var	tg_parent_key		= (is_ip ? ip_key : name_key);								// yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}
		var	tg_key				= tg_parent_key + '/' + (is_ip ? hosts[cnt].ip : hosts[cnt].hostname) + keys.VALUE_HOST_SEP + tg_port + keys.VALUE_HOST_SEP + tg_cuk;	// yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/"{ip or hostname} port cuk"

		var	tg_extra;
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
			tg_extra			= hosts[cnt].extra;
		}

		tg_host_info[keys.ID_KW]= apiutil.getStrUuid4();									// host id = UUID4
		var	tg_value			= JSON.stringify(tg_host_info);

		if(!dkcobj_permanent.setValue(tg_key, tg_value)){									// set value to key -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/"{ip or hostname} port cuk"
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
	var	result = true;
	if(update_ip_skey){
		if(!dkcobj_permanent.setSubkeys(ip_key, ip_subkeylist)){							// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + JSON.stringify(ip_subkeylist) + ' subkeys under ' + ip_key + ' key.');
			result = false;
		}
	}
	if(update_name_skey){
		if(!dkcobj_permanent.setSubkeys(name_key, name_subkeylist)){						// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + JSON.stringify(name_subkeylist) + ' subkeys under ' + name_key + ' key.');
			result = false;
		}
	}
	if(!rawAddIpsByCuk(dkcobj_permanent, cuk_list)){
		r3logger.elog('something error occurred in registering iaas:*:cuk key and subkey, but continue...');
		result = false;
	}

	return result;
}

//
// Utilities function for kubernetes cuk
//
// [NOTE]
// kubernetes CUK is processed in the following format and passed to K2HR3 API.
// This function converts a CUK string to the original object.
//
//	CUK string = url encode	( base64 encoding ( JSON string( cuk object ) ) ) )
//
function rawParseKubernetesCuk(cuk)
{
	if(!apiutil.isSafeString(cuk)){
		return null;
	}
	// decode url encode
	var	cuk_base64	= cuk.replace(/%3d/g, '=').replace(/_/g, '/').replace(/-/g, '+');	// '%3d' is not necessary but it is executed just in case
	if(!apiutil.isSafeString(cuk_base64)){
		return null;
	}
	try{
		// decode base64
		var	buff64		= Buffer.from(cuk_base64, 'base64');
		if(!apiutil.isSafeEntity(buff64)){
			return null;
		}
		var cuk_json	= buff64.toString('ascii');
		if(!apiutil.isSafeString(cuk_json)){
			return null;
		}
		// parse json
		var cuk_obj		= apiutil.parseJSON(cuk_json);
		if(!apiutil.isSafeEntity(cuk_obj)){
			return null;
		}
	}catch(exception){
		return null;
	}

	// [NOTE]
	// the cuk object must have some keys, you can see in k2hr3-kube-init.sh
	//
	var	keys = r3keys();
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
}

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
function rawSetHostInfoValueFromKubernetesCuk(host_info, cuk, host_ip)
{
	if(!apiutil.isSafeEntity(host_info)){
		return false;
	}
	if(!apiutil.isSafeString(host_ip)){
		r3logger.elog('ip address(' + JSON.stringify(host_ip) + ') for checking kubernetes cuk is not string value.');
		return false;
	}

	// parse cuk
	var	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		r3logger.elog('cuk(' + JSON.stringify(cuk) + ') is not base64 url encode value.');
		return false;
	}

	// check host ip address
	var	keys = r3keys();
	if(cuk_obj[keys.K8S_NODEIP_INCUK_KEY] != host_ip && cuk_obj[keys.K8S_PODIP_INCUK_KEY] != host_ip){
		r3logger.elog('ip addresses(' + JSON.stringify(cuk_obj[keys.K8S_NODEIP_INCUK_KEY]) + ' or ' + JSON.stringify(cuk_obj[keys.K8S_PODIP_INCUK_KEY]) + ') in kubernetes cuk(' + JSON.stringify(cuk) + ') are not as same as requesting host ip(' + JSON.stringify(host_ip) + ').');
		return false;
	}

	// set to host information with checking
	Object.keys(cuk_obj).forEach(function(key){
		if(apiutil.isSafeString(cuk_obj[key])){
			host_info[key] = cuk_obj[key];
		}else{
			r3logger.wlog('key(' + JSON.stringify(key) + ') in kubernetes cuk(' + JSON.stringify(cuk) + ') is not safe string, then skip this.');
		}
	});

	return true;
}

//
// Utilities function for kubernetes cuk
//
// Compare host information(which is set in role ip address member) and cuk object.
//
function rawCompareHostInfoValueAndKubernetesCuk(host_info, cuk)
{
	if(!apiutil.isSafeEntity(host_info)){
		return false;
	}

	// parse cuk
	var	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		r3logger.elog('cuk(' + JSON.stringify(cuk) + ') is not base64 url encode value.');
		return false;
	}

	// host_info object must have some keys.
	var	keys = r3keys();
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
}

//
// Utilities function for kubernetes cuk
//
// Check cuk for kubernetes
//
function rawIsKubernetesCuk(cuk)
{
	// parse cuk
	var	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		return false;
	}
	return true;
}

//
// Utilities function for kubernetes cuk
//
// Compare ip address and cuk object's node ip address.
//
function rawCompareIpAndKubernetesCuk(ip, cuk)
{
	if(!apiutil.isSafeString(ip)){
		return false;
	}

	// parse cuk
	var	cuk_obj = rawParseKubernetesCuk(cuk);
	if(!apiutil.isSafeEntity(cuk_obj)){
		r3logger.elog('cuk(' + JSON.stringify(cuk) + ') is not base64 url encode value.');
		return false;
	}

	// compare
	var	keys = r3keys();
	if(ip != cuk_obj[keys.K8S_NODEIP_INCUK_KEY]){
		return false;
	}
	return true;
}

// Utility for cuk(custom unique key)
//
// return	:	extra string made from cuk
//
function rawGetExtraFromCuk(cuk)
{
	if(apiutil.isSafeString(cuk)){
		var	keys	= r3keys();
		var	cuk_obj	= rawParseKubernetesCuk(cuk);
		if(null == cuk_obj){
			return keys.VALUE_OPENSTACK_V1;
		}else{
			return keys.VALUE_K8S_V1;
		}
	}else{
		// unknown
		return null;
	}
}

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
function rawRemoveHost(tenant, service, role, target, tg_port, tg_cuk, req_ip, req_port, req_cuk)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, role)){												// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	// target hostname/ip/port/cuk
	if(!apiutil.isSafeString(target) && apiutil.isEmptyArray(target)){
		resobj.result	= false;
		resobj.message	= 'target(hostname or ip address) is empty.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	var	tg_host	= null;
	var	tg_ip	= null;
	if(apiutil.isSafeString(target)){
		target = [target];
	}
	for(var cnt = 0; cnt < target.length; ++cnt){
		if(apiutil.isIpAddressString(target[cnt])){
			if(null == tg_ip){
				tg_ip = [];
			}
			tg_ip.push(target[cnt]);
		}else{
			if(null == tg_host){
				tg_host = [];
			}
			tg_host.push(target[cnt]);
		}
	}
	if(!apiutil.isSafeEntity(tg_port)){
		tg_port = 0;
	}else if(isNaN(tg_port)){
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
		}else if(isNaN(req_port)){
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
	var	keys		= r3keys(null, tenant, service);
	role			= role.toLowerCase();
	var	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches	= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
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
	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
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
	var	role_key		= keys.ROLE_TOP_KEY + ':' + role;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"

	// check requester
	if(apiutil.isSafeString(req_ip)){
		var	found_host = rawFindRoleHost(dkcobj, role_key, null, req_ip, req_port, req_cuk, false);		// not strictly checking
		if(apiutil.isEmptyArray(found_host)){
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
}

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
function rawRemoveRoleHost(dkcobj_permanent, role_key, hostname, ip, port, cuk, is_strict)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return false;
	}
	if(!apiutil.isSafeString(hostname) && apiutil.isEmptyArray(hostname) && !apiutil.isSafeString(ip) && apiutil.isEmptyArray(ip)){
		r3logger.elog('both hostname and ip parameters are empty.');
		return false;
	}
	if(!apiutil.isSafeEntity(port)){
		port = 0;
	}else if(isNaN(port)){
		r3logger.elog('port(' + JSON.stringify(port) + ') parameter is wrong.');
		return false;
	}
	if(!apiutil.isSafeString(cuk)){
		cuk = null;
	}
	if('boolean' != typeof is_strict){
		is_strict = true;
	}

	// find target hosts
	var	found_host = rawFindRoleHost(dkcobj_permanent, role_key, hostname, ip, port, cuk, is_strict);
	if(apiutil.isEmptyArray(found_host)){
		// target host is not found, so nothing to do.
		return true;
	}

	//
	// keys
	//
	var	keys			= r3keys();
	var	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

	// delete subkeys and make removing key list
	var	name_subkeylist	= dkcobj_permanent.getSubkeys(name_key, true);						// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
	var	ip_subkeylist	= dkcobj_permanent.getSubkeys(ip_key, true);						// subkey list from -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
	var	tg_ip_subkeylist= new Array();
	var	update_name_skey= false;
	var	update_ip_skey	= false;
	var	removed_key		= new Array(0);
	for(var cnt = 0; cnt < found_host.length; ++cnt){
		// add reserved removing list
		removed_key.push(found_host[cnt].key);
		// delete key from subkey list under name/ip
		if(apiutil.isSafeString(found_host[cnt].hostname)){
			if(apiutil.removeStringFromArray(name_subkeylist, found_host[cnt].key)){
				update_name_skey = true;
			}
		}else if(apiutil.isSafeString(found_host[cnt].ip)){
			if(apiutil.removeStringFromArray(ip_subkeylist, found_host[cnt].key)){
				// if cuk is specified, need to check key under iaas key
				if(apiutil.isSafeString(cuk)){
					tg_ip_subkeylist.push(found_host[cnt].key);
				}
				update_ip_skey = true;
			}
		}
	}

	// update subkeys
	var	result = true;
	if(update_name_skey){
		if(!dkcobj_permanent.setSubkeys(name_key, name_subkeylist)){						// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + JSON.stringify(name_subkeylist) + ' subkeys under ' + name_key + ' key.');
			result = false;
		}
	}

	// remove ip keys
	if(update_ip_skey){
		// [NOTE]
		// If removing IP address, we need to check cuk/extra data for removing iaas:*:cuk
		//
		for(cnt = 0; cnt < tg_ip_subkeylist.length; ++cnt){
			// get extra data
			var	value	= dkcobj_permanent.getValue(tg_ip_subkeylist[cnt], null, true, null);	// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/"{ip or hostname} port cuk"
			value		= apiutil.parseJSON(value);
			if(apiutil.isSafeEntity(value)){
				// remove key under iaas key
				if(!rawRemoveIpsByCukEx(dkcobj_permanent, cuk, value.extra, null, false)){		// do not remove under yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip} key
					// If there is some ip address to one cuk, probably this
					// function return error after first time, thus we continue...
					continue;
				}
			}
		}
		if(!dkcobj_permanent.setSubkeys(ip_key, ip_subkeylist)){							// update subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + JSON.stringify(ip_subkeylist) + ' subkeys under ' + ip_key + ' key.');
			result = false;
		}
	}

	// remove host(under hostname or ip) keys
	for(cnt = 0; cnt < removed_key.length; ++cnt){
		if(!dkcobj_permanent.remove(removed_key[cnt], false)){								// remove target keys(under yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip})
			r3logger.elog('could not remove ' + removed_key[cnt] + ' key under ' + hosts_key + '/{name or ip} key.');
			result = false;
		}
	}
	return result;
}

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
function rawRemoveRoleHostAll(dkcobj_permanent, role_key, is_hostnames)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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
	var	cnt;
	var subkeylist;
	var	keys		= r3keys();
	var	hosts_key	= role_key	+ '/' + keys.HOSTS_KW;											// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key	= hosts_key	+ '/' + keys.HOSTS_NAME_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key		= hosts_key	+ '/' + keys.HOSTS_IP_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"

	// check name/ip key for having value
	var	value = dkcobj_permanent.getValue(name_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(name_key, keys.VALUE_ENABLE)){							// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + name_key + ' key');
			return false;
		}
	}
	value = dkcobj_permanent.getValue(ip_key, null, true, null);
	if(!apiutil.isSafeString(value)){
		if(!dkcobj_permanent.setValue(ip_key, keys.VALUE_ENABLE)){								// set value enable(dummy) -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
			r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + ip_key + ' key');
			return false;
		}
	}

	// remove all name subkeys
	if(!apiutil.isSafeEntity(is_hostnames) || 'boolean' !== typeof is_hostnames || is_hostnames){
		subkeylist = dkcobj_permanent.getSubkeys(name_key, true);
		if(!apiutil.isEmptyArray(subkeylist)){
			for(cnt = 0; cnt < subkeylist.length; ++cnt){
				// remove key
				if(!apiutil.isSafeString(subkeylist[cnt])){
					r3logger.wlog('Found wrong hosts element(' + JSON.stringify(subkeylist[cnt]) + ') in ' + name_key + ', thus do not remove key for this.');
				}else{
					// check and remove this key from subkey list in cuk
					if(!rawRemoveIpsSubkeyByCuk(dkcobj_permanent, subkeylist[cnt])){
						r3logger.log('could not remove ' + subkeylist[cnt] + ' key from cuk subkey list, but continue...');
					}
					// remove
					if(!dkcobj_permanent.remove(subkeylist[cnt], false)){						// remove key --> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name/<hostname port cuk>
						r3logger.log('could not remove ' + subkeylist[cnt] + ' key under ' + name_key + ' key, but continue...');
					}
				}
			}
			subkeylist	= new Array(0);
			if(!dkcobj_permanent.setSubkeys(name_key, subkeylist)){								// clear all subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name
				r3logger.elog('could not clear subkeys under ' + name_key + ' key.');
				return false;
			}
		}
	}

	// remove all ip subkeys
	if(!apiutil.isSafeEntity(is_hostnames) || 'boolean' !== typeof is_hostnames || !is_hostnames){
		subkeylist = dkcobj_permanent.getSubkeys(ip_key, true);
		if(!apiutil.isEmptyArray(subkeylist)){
			for(cnt = 0; cnt < subkeylist.length; ++cnt){
				// remove key
				if(!apiutil.isSafeString(subkeylist[cnt])){
					r3logger.wlog('Found wrong hosts element(' + JSON.stringify(subkeylist[cnt]) + ') in ' + ip_key + ', thus do not remove key for this.');
				}else{
					// check and remove this key from subkey list in cuk
					if(!rawRemoveIpsSubkeyByCuk(dkcobj_permanent, subkeylist[cnt])){
						r3logger.log('could not remove ' + subkeylist[cnt] + ' key from cuk subkey list, but continue...');
					}
					// remove
					if(!dkcobj_permanent.remove(subkeylist[cnt], false)){						// remove key --> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/<ip port >
						r3logger.log('could not remove ' + subkeylist[cnt] + ' key under ' + ip_key + ' key, but continue...');
					}
				}
			}
			subkeylist	= new Array(0);
			if(!dkcobj_permanent.setSubkeys(ip_key, subkeylist)){								// clear all subkeys -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip
				r3logger.elog('could not clear subkeys under ' + ip_key + ' key.');
				return false;
			}
		}
	}
	return true;
}

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
function rawAddIpsByCuk(dkcobj_permanent, cuk_list)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(apiutil.isEmptyArray(cuk_list)){
		// nothing to add
		return true;
	}

	//
	// keys
	//
	var	keys	= r3keys();
	var	result	= true;

	// loop
	for(var cnt = 0; cnt < cuk_list.length; ++cnt){
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

		var	is_openstack= (cuk_list[cnt].extra == keys.VALUE_OPENSTACK_V1);
		var	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;			// "yrn:yahoo::::iaas:{openstack|k8s}"
		var	top_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(top_key, true));		// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}
		var	cuk_key		= top_key + ':' + cuk_list[cnt].cuk;									// "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
		var	cuk_subkeys	= new Array();

		// try to add cuk subkey to main subkey list
		var	is_new_key	= apiutil.tryAddStringToArray(top_subkeys, cuk_key);					// add subkey cuk_list[cnt].cuk to yrn:yahoo::::iaas:{openstack|k8s}
		if(!is_new_key){
			cuk_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(cuk_key, true));		// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		}

		// add key to cuk_key subkey list
		if(apiutil.tryAddStringToArray(cuk_subkeys, cuk_list[cnt].subkey)){						// add subkey cuk_list[cnt].subkey to yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
			// need to add subkey
			if(is_new_key){
				if(!dkcobj_permanent.setValue(cuk_key, keys.VALUE_ENABLE)){						// set value enable(dummy) -> yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
					r3logger.elog('could not set ' + keys.VALUE_ENABLE + ' value to ' + cuk_key + ', but continue...');
					result = false;
					continue;
				}
			}
			if(!dkcobj_permanent.setSubkeys(cuk_key, cuk_subkeys)){								// set subkeys to yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
				r3logger.elog('could not set subkey list to ' + cuk_key + ', but continue...');
				result = false;
				continue;
			}
			if(is_new_key){
				// make subkey
				if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){							// add subkey yrn:yahoo::::iaas:{openstack|k8s}:<cuk> -> yrn:yahoo::::iaas:{openstack|k8s}
					r3logger.elog('could not add subkey ' + cuk_key + ' to ' + top_key + ', but continue...');
					result = false;
					continue;
				}
			}
		}
	}
	return result;
}

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
function rawRemoveIpsByCukEx(dkcobj_permanent, cuk, extra, host, remove_under_role)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(cuk)){
		r3logger.elog('parameter cuk is something wrong');
		return false;
	}
	if('boolean' !== typeof remove_under_role){
		remove_under_role = false;
	}
	if(apiutil.isSafeEntity(host)){
		if(apiutil.isSafeString(host)){
			var	tmphost = host;
			host		= new Array();
			host.push(tmphost);
		}else if(apiutil.isEmptyArray(host)){
			host = null;
		}
	}else{
		host = null;
	}

	//
	// keys
	//
	var	keys		= r3keys();

	// Current checks extra only openstack and kubernetes
	if(!apiutil.isSafeString(extra) || (extra != keys.VALUE_OPENSTACK_V1 && extra != keys.VALUE_K8S_V1)){
		r3logger.dlog('extra is not ' + keys.VALUE_OPENSTACK_V1 + ' nor ' + keys.VALUE_K8S_V1 + ', current is only support ' + keys.VALUE_OPENSTACK_V1 + ' and ' + keys.VALUE_K8S_V1);
		return true;
	}
	var	is_openstack= (extra == keys.VALUE_OPENSTACK_V1);

	//var iaas_key	= keys.IAAS_TOP_KEY;														// "yrn:yahoo::::iaas"
	var	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;				// "yrn:yahoo::::iaas:{openstack|k8s}"
	var	cuk_key		= top_key + ':' + cuk;														// "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
	var	result		= true;
	var	top_subkeys;
	var	cuk_subkeys;
	var	new_subkeys;
	var	ipptn;
	var	matches;
	var	ip_value;
	var	ip_key;
	var	ip_key_value;
	var	ip_subkeys;
	var	cnt;

	// check and remove ip address key from role key
	if(remove_under_role){
		// [NOTE]
		// remove_under_role is true, try to remove keys under role/hosts/ip
		//
		// get subkey list from iaas:{openstack|k8s}:<cuk>
		cuk_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(cuk_key, true));			// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);									// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/

		for(cnt = 0; cnt < cuk_subkeys.length; ++cnt){
			// check path
			matches	= cuk_subkeys[cnt].match(ipptn);											// cuk subkey name is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip> <port> <cuk>"
			if(apiutil.isEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				r3logger.wlog('cuk subkey(' + cuk_subkeys[cnt] + ') is not matched by \'^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)\'.');
				continue;
			}
			// set ip value
			ip_value = matches[4];

			// check ip address if specify it
			if(!apiutil.isEmptyArray(host) && !apiutil.findStringInArray(host, ip_value)){
				r3logger.wlog('ip address(' + JSON.stringify(ip_value) + ') is not in remove host array(' + JSON.stringify(host) + ')');
				continue;
			}

			// check ip key value for only kubernetes CUK
			if(!is_openstack){
				ip_key_value = dkcobj_permanent.getValue(cuk_subkeys[cnt], null, true, null);		// get value -> yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<address port cuk>
				if(apiutil.isSafeString(ip_key_value) && apiutil.checkSimpleJSON(ip_key_value)){
					ip_key_value = JSON.parse(ip_key_value);

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
			ip_key		= keys.NO_SERVICE_KEY + matches[1] + '::' + matches[2] + ':role:' + matches[3] + '/hosts/ip';	// "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip"
			ip_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(ip_key, true));		// get subkey list from yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip

			// remove ip from role/hosts/ip subkey list
			if(!apiutil.removeStringFromArray(ip_subkeys, cuk_subkeys[cnt])){
				r3logger.wlog(ip_key + ' does not have ' + cuk_subkeys[cnt] + ' subkey, but continue...');
				continue;
			}else{
				// set new role/hosts/ip subkey list
				if(!dkcobj_permanent.setSubkeys(ip_key, ip_subkeys)){							// reset new subkey list -> yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip
					r3logger.dlog('could not remove subkey ' + cuk_subkeys[cnt] + ' from ' + ip_key + ', but continue...');
					result = false;
				}
			}

			// remove ip key
			if(!dkcobj_permanent.remove(cuk_subkeys[cnt], false)){								// remove "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip> <port> <cuk>"
				r3logger.elog('could not remove ' + cuk_subkeys[cnt] + ' key, probably it is not existed.');
				result = false;
			}
		}
	}

	// check and remove ip address path subkey from cuk key
	if(apiutil.isEmptyArray(host)){
		// remove cuk from subkey list in openstack or k8s
		top_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(top_key, true));			// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}
		if(apiutil.isEmptyArray(top_subkeys) || !apiutil.removeStringFromArray(top_subkeys, cuk_key)){
			r3logger.dlog(top_key + ' does not have ' + cuk_key + ' subkey');
		}else{
			// set new subkey list
			if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){								// reset new cuk list -> yrn:yahoo::::iaas:{openstack|k8s}
				r3logger.dlog('could not remove subkey ' + cuk + ' from ' + top_key + ', but continue...');
				result = false;
			}
		}

		// remove cuk
		if(!dkcobj_permanent.remove(cuk_key, false)){											// remove "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
			r3logger.elog('could not remove ' + cuk_key + 'key, probably it is not existed.');
			result = false;
		}
	}else{
		// remove target ip address from cuk's subkey list
		cuk_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(cuk_key, true));			// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);									// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/
		new_subkeys	= new Array();
		for(cnt = 0; cnt < cuk_subkeys.length; ++cnt){
			// check path
			matches	= cuk_subkeys[cnt].match(ipptn);											// cuk subkey name is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip> <port> <cuk>"
			if(apiutil.isEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				r3logger.wlog('cuk subkey(' + cuk_subkeys[cnt] + ') is not matched by \'^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)\'.');
				continue;
			}
			// set ip value
			ip_value = matches[4];

			// check ip address if specify it
			if(apiutil.findStringInArray(host, ip_value)){
				continue;
			}
			new_subkeys.push(cuk_subkeys[cnt]);
		}

		if(apiutil.isEmptyArray(new_subkeys)){
			// remove cuk from subkey list in openstack or k8s
			top_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(top_key, true));		// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}
			if(apiutil.isEmptyArray(top_subkeys) || !apiutil.removeStringFromArray(top_subkeys, cuk_key)){
				r3logger.dlog(top_key + ' does not have ' + cuk_key + ' subkey');
			}else{
				// set new subkey list to openstack or k8s
				if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){							// reset new cuk list -> yrn:yahoo::::iaas:{openstack|k8s}
					r3logger.dlog('could not remove subkey ' + cuk + ' from ' + top_key + ', but continue...');
					result = false;
				}
			}
			// remove cuk
			if(!dkcobj_permanent.remove(cuk_key, false)){										// remove "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"
				r3logger.elog('could not remove ' + cuk_key + 'key, probably it is not existed.');
				result = false;
			}
		}else{
			// update new subkey list to cuk
			if(!dkcobj_permanent.setSubkeys(cuk_key, new_subkeys)){								// reset new subkey -> yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
				r3logger.dlog('could not remove subkey ' + cuk + ' from ' + top_key + ', but continue...');
				result = false;
			}
		}
	}
	return result;
}

//
// Utility function for Removing subkey in CUK under IaaS key
//
// tgkey				:	yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<address port cuk>
//
// [NOTE]
// Current supports openStack and kubernetes CUK, then extra is allowed only 'openstack-auto-v1', 'k8s-auto-v1' now.
//
function rawRemoveIpsSubkeyByCuk(dkcobj_permanent, tgkey)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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
	var	keys		= r3keys();

	// get tgkey data
	var	value		= dkcobj_permanent.getValue(tgkey, null, true, null);					// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<address port cuk>
	value			= apiutil.parseJSON(value);
	if(!apiutil.isSafeEntity(value)){
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
	var	is_openstack= (value.extra == keys.VALUE_OPENSTACK_V1);
	var	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;			// "yrn:yahoo::::iaas:{openstack|k8s}"
	var	cuk_key		= top_key + ':' + value.cuk;											// "yrn:yahoo::::iaas:{openstack|k8s}:<cuk>"

	// remove tgkey from subkey list
	var	cuk_subkeys	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(cuk_key, true));		// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
	if(apiutil.isEmptyArray(cuk_subkeys) || !apiutil.removeStringFromArray(cuk_subkeys, tgkey)){
		r3logger.dlog('cuk key(' + cuk_key + ') already does not have ' + tgkey + ' subkey.');
		return true;
	}

	// reset
	if(apiutil.isEmptyArray(cuk_subkeys)){
		// subkey list is empty, then remove cuk key
		var	top_subkeys = apiutil.getSafeArray(dkcobj_permanent.getSubkeys(top_key, true));	// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}

		// remove cuk key from top's subkey list
		if(apiutil.isEmptyArray(top_subkeys) || !apiutil.removeStringFromArray(top_subkeys, cuk_key)){
			r3logger.dlog('openstack or k8s key(' + top_key + ') already does not have ' + cuk_key + ' subkey.');
		}else{
			// reset top's subkey list
			if(!dkcobj_permanent.setSubkeys(top_key, top_subkeys)){							// reset new subkey list -> yrn:yahoo::::iaas:{openstack|k8s}
				r3logger.dlog('could not set new subkey list to openstack or k8s key(' + top_key + ')');
			}
		}

		// remove cuk key
		if(!dkcobj_permanent.remove(cuk_key, false)){										// remove yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
			r3logger.elog('could not remove ' + cuk_key + ' key, probably it is not existed. thus continue...');
		}

	}else{
		// reset subkey list
		if(!dkcobj_permanent.setSubkeys(cuk_key, cuk_subkeys)){								// reset new subkey list -> yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
			r3logger.dlog('could not set new subkey list to cuk key(' + cuk_key + ')');
			return false;
		}
	}

	return true;
}

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
function rawRemoveIpsByCuk(cuk, host, remove_under_role)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(cuk)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : cuk=' + JSON.stringify(cuk);
		r3logger.elog(resobj.message);
		return resobj;
	}
	var	keys	= r3keys();
	var	extra	= rawGetExtraFromCuk(cuk);
	if(extra != keys.VALUE_OPENSTACK_V1 && extra != keys.VALUE_K8S_V1){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : cuk=' + JSON.stringify(cuk);
		r3logger.elog(resobj.message);
		return resobj;
	}

	if('boolean' !== typeof remove_under_role){
		remove_under_role = false;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
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
}

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
//			{
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
function rawGetAllIpDatasByCuk(extra)
{
	var	result = {error: null, data: null};

	var	keys = r3keys();

	// Current checks extra only openstack and kubernetes
	if(!apiutil.isSafeString(extra) || (extra != keys.VALUE_OPENSTACK_V1 && extra != keys.VALUE_K8S_V1)){
		result.error = new Error('extra(' + JSON.stringify(extra) + ') is something wrong.');
		r3logger.elog(result.error.message);
		return result;
	}
	var	is_openstack = (extra == keys.VALUE_OPENSTACK_V1);

	//
	// K2HDKC
	//
	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);						// use permanent object(need to clean)
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
	var	top_key		= is_openstack ? keys.IAAS_OS_TOP_KEY : keys.IAAS_K8S_TOP_KEY;				// "yrn:yahoo::::iaas:{openstack|k8s}"
	var	iaasmatch	= is_openstack ? keys.MATCH_ANY_IAAS_OS : keys.MATCH_ANY_IAAS_K8S;			// 
	var	iaasptn		= new RegExp('^' + iaasmatch);												// regex = /^yrn:yahoo::::iaas:{openstack|k8s}:(.*)/
	var	ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);									// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/
	result.data		= new Array();

	// Get subkey list under iaas:{openstack|k8s}
	var	top_subkeys	= apiutil.getSafeArray(dkcobj.getSubkeys(top_key, true));					// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}

	for(var cnt = 0; cnt < top_subkeys.length; ++cnt){
		if(!apiutil.isSafeString(top_subkeys[cnt])){
			r3logger.wlog('subkey path' + JSON.stringify(top_subkeys[cnt]) + ' in ' + top_key + ' is something wrong.');
			continue;
		}
		// check & parse cuk string
		var	cukmatches	= top_subkeys[cnt].match(iaasptn);										// check key is under "yrn:yahoo::::iaas:{openstack|k8s}"
		if(apiutil.isEmptyArray(cukmatches) || cukmatches.length < 2 || !apiutil.isSafeString(cukmatches[1])){
			r3logger.dlog('subkey path' + JSON.stringify(top_subkeys[cnt]) + ' in ' + top_key + ' is not matched ' + keys.MATCH_ANY_IAAS_OS);
			continue;
		}
		var	cuk = cukmatches[1];

		// Get subkey list under iaas:{openstack|k8s}:<cuk>
		var	cuk_subkeys = apiutil.getSafeArray(dkcobj.getSubkeys(top_subkeys[cnt], true));		// get subkey list from yrn:yahoo::::iaas:{openstack|k8s}:<cuk>
		for(var cnt2 = 0; cnt2 < cuk_subkeys.length; ++cnt2){
			if(!apiutil.isSafeString(cuk_subkeys[cnt2])){
				r3logger.wlog('subkey path' + JSON.stringify(cuk_subkeys[cnt2]) + ' in ' + top_subkeys[cnt] + ' is something wrong.');
				continue;
			}
			// check and parse ip string
			var	ipmatches = cuk_subkeys[cnt2].match(ipptn);										// check yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)
			if(apiutil.isEmptyArray(ipmatches) || ipmatches.length < 7 || !apiutil.isSafeString(ipmatches[4]) || !apiutil.isSafeString(ipmatches[5])){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' is not matched ' + keys.MATCH_ANY_IP_PORT);
				continue;
			}
			// check cuk string
			if(!apiutil.isSafeString(ipmatches[6]) || !apiutil.compareCaseString(ipmatches[6],cuk)){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' is not same cuk(' + cuk + ').');
				continue;
			}
			// get value
			var	ipvalue = dkcobj.getValue(cuk_subkeys[cnt2], null, true, null);					// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/{name or ip}/<address port cuk>
			if(!apiutil.isSafeString(ipvalue) || !apiutil.checkSimpleJSON(ipvalue)){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' has wrong value ' + JSON.stringify(ipvalue) +').');
				continue;
			}
			ipvalue = JSON.parse(ipvalue);

			// check extra in value
			if(!apiutil.isSafeString(ipvalue.extra) || (is_openstack && ipvalue.extra != keys.VALUE_OPENSTACK_V1) || (!is_openstack && ipvalue.extra != keys.VALUE_K8S_V1)){
				r3logger.dlog('ip subkey (' + JSON.stringify(cuk_subkeys[cnt2]) + ') in ' +  top_subkeys[cnt] +' does not have ' + (is_openstack ? keys.VALUE_OPENSTACK_V1 : keys.VALUE_K8S_V1) + ' extra data.');
				continue;
			}

			// Add ip address data to result.data
			var	host_info	= {};
			host_info.ip	= ipmatches[4];
			host_info.port	= ipmatches[5];
			host_info.cuk	= cuk;
			host_info.extra	= ipvalue.extra;
			host_info.tag	= apiutil.getSafeString(ipvalue.tag);
			host_info.key	= cuk_subkeys[cnt2];
			host_info.alive	= true;

			// Add optional keys
			if(!apiutil.isSafeString(ipvalue.inboundip) && apiutil.isIpAddressString(ipvalue.inboundip)){
				host_info.inboundip = apiutil.getSafeString(ipvalue.inboundip);
			}
			if(!apiutil.isSafeString(ipvalue.outboundip) && apiutil.isIpAddressString(ipvalue.outboundip)){
				host_info.outboundip = apiutil.getSafeString(ipvalue.outboundip);
			}

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
}

//---------------------------------------------------------
// Remove IP Addresses depending CUK
//---------------------------------------------------------
// Remove ip addresses related to CUK with pending second,
// after checking alive.
//
// ipdatas:				Array of ip address and etc
//							[
//								{
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
function rawRemoveIpAddressWithCuk(ipdatas, pendingsec, logger)
{
	var	result = null;
	if(apiutil.isEmptyArray(ipdatas)){
		r3logger.dlog('ipdatas is empty array or not array.');
		return result;
	}
	if(!apiutil.isSafeEntity(pendingsec) || isNaN(pendingsec)){
		result = new Error('pendingsec is not number : ' + JSON.stringify(pendingsec));
		r3logger.elog(result.message);
		return result;
	}
	pendingsec = parseInt(pendingsec);

	if(!apiutil.isSafeEntity(logger) || 'function' !== typeof logger){
		r3logger.wlog('logger is not function, thus using stdout for logging.');
		logger = process.stdout;
	}

	//
	// K2HDKC
	//
	var	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);									// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		result = new Error('Not initialize yet, or configuration is not set');
		r3logger.elog(result.message);
		dkcobj.clean();
		return result;
	}

	var	keys = r3keys();

	//
	// Loop
	//
	var	errorKeys = new Array();
	for(var cnt = 0; cnt < ipdatas.length; ++cnt){
		// check
		if(	!apiutil.isSafeEntity(ipdatas[cnt])						||							// must be object
			!apiutil.isSafeString(ipdatas[cnt].ip)					||							// must be string
			(isNaN(ipdatas[cnt].port) && ipdatas[cnt].port != '*')	||							// must be number or '*'
			!apiutil.isSafeString(ipdatas[cnt].cuk)					||							// must be string
			!apiutil.isSafeString(ipdatas[cnt].extra)				||							// must be string
			(	ipdatas[cnt].extra != keys.VALUE_OPENSTACK_V1	&&								// must be 'openstack-auto-v1' or 'k8s-auto-v1'
				ipdatas[cnt].extra != keys.VALUE_K8S_V1			)	||
			!apiutil.isSafeString(ipdatas[cnt].key)					||							// must be string
			!apiutil.isSafeEntity(ipdatas[cnt].alive)				||							// must be boolean
			'boolean' != typeof ipdatas[cnt].alive					)							// 
		{
			r3logger.wlog('No.' + cnt.toString() + ' element in ip data array is something wrong : ' + JSON.stringify(ipdatas[cnt]));
			continue;
		}

		// get value
		var	ipvalue = dkcobj.getValue(ipdatas[cnt].key, null, true, null);						// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/"ip port cuk"
		if(!apiutil.isSafeString(ipvalue) || !apiutil.checkSimpleJSON(ipvalue)){
			r3logger.elog('No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + ') has something wrong value : ' + JSON.stringify(ipvalue));
			// logging
			logger('ERROR:READ:VALUE - [' + ipdatas[cnt].key + ']');
			continue;
		}
		ipvalue = JSON.parse(ipvalue);

		if(ipdatas[cnt].alive){
			// alive now
			if(apiutil.isSafeEntity(ipvalue.deadat) && !isNaN(ipvalue.deadat)){
				// key has deadat key(which marked dead time), thus remove it
				delete ipvalue.deadat;

				r3logger.dlog('IP Address is alive now, thus set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + ')');

				// reset new value
				if(!dkcobj.setValue(ipdatas[cnt].key, JSON.stringify(ipvalue))){					// reset value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/"ip port cuk"
					r3logger.elog('could not set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + '), but continue...');
					errorKeys.push('reset value of alive to (' + ipdatas[cnt].key + ')');
					logger('ERROR:REVIVAL - [' + ipdatas[cnt].key + ']');
					continue;
				}
				// logging
				logger('REVIVAL - [' + ipdatas[cnt].key + ']');
			}
		}else{
			// dead now
			var	now = Math.floor(new Date().getTime() / 1000);
			if(apiutil.isSafeEntity(ipvalue.deadat) && !isNaN(ipvalue.deadat)){
				// already not alive status for this key, need to check pending time
				if((parseInt(ipvalue.deadat) + pendingsec) < now){
					// over pending time, thus remove this
					r3logger.dlog('IP address is not alive and over pending time, thus remove No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + ')');

					if(!rawRemoveIpsByCukEx(dkcobj, ipdatas[cnt].cuk, ipdatas[cnt].extra, ipdatas[cnt].ip, true)){
						r3logger.elog('could not remove No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + '), but continue...');
						errorKeys.push('remove ip for (' + ipdatas[cnt].key + ')');
						logger('ERROR:REMOVE - [' + ipdatas[cnt].key + ']');
						continue;
					}
					// logging
					logger('REMOVE - [' + ipdatas[cnt].key + ']');

				}else{
					r3logger.dlog('IP address is not alive but not over pending time yet, thus keep No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + ')');

					// logging
					logger('PENDING:CONTINUE - [' + ipdatas[cnt].key + ']');
				}
			}else{
				// not have deadat element, set new it
				ipvalue.deadat = now;

				r3logger.dlog('IP Address changed status to not alive, thus set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + ')');

				// reset new value
				if(!dkcobj.setValue(ipdatas[cnt].key, JSON.stringify(ipvalue))){					// reset value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip/"ip port cuk"
					r3logger.elog('could not set value(' + JSON.stringify(ipvalue) + ') for No.' + cnt.toString() + ' element ip key(' + ipdatas[cnt].key + '), but continue...');
					errorKeys.push('set new lost time to (' + ipdatas[cnt].key + ')');
					logger('ERROR:PENDING:START - [' + ipdatas[cnt].key + ']');
					continue;
				}
				// logging
				logger('PENDING:START - [' + ipdatas[cnt].key + ']');
			}
		}
	}
	if(!apiutil.isEmptyArray(errorKeys)){
		result = new Error('Failed operation for some ip addresses : ' + JSON.stringify(errorKeys));
		r3logger.elog(result.message);
		dkcobj.clean();
		return result;
	}

	dkcobj.clean();
	return result;
}

//
// Utilities for hosts in role
//
// key_list			:	assume a subkey list of hostnames(ips).
// is_hostname		:	flag whether key_list is a subkey list of hostnames.
//
// return			:	returns the array shown below
//
//	[
//		{
//			'host_normal':	'<hostname(ip)>{:<port>}'						if any port, port value is empty
//			'host_all':		'<hostname(ip)> <port> <cuk> <extra> <tag> <inboundip> <outboundip>'
//																			if any port, port is *
//			'detail_key':	'<hostname(ip)>,<port>,<cuk>'					if any port, port is 0
//			'detail':		{
//								'host':					<string>			hostanme or IP address string
//								'port':					<number>			port number(if any, set 0)
//								'extra':				<string>			'k8s-auto-v1' or 'openstack-auto-v1' or undefined(if it does not exist)
//								'tag':					<string>			tag string            (or undefined if it does not exist)
//								'inboundip':			<string>			inbound ip address    (or undefined if it does not exist)
//								'outboundip':			<string>			outbound ip address   (or undefined if it does not exist)
//								'cuk':					<string>			cuk string            (or undefined if it does not exist)
//								'k8s_namespace':        <string>			namespace on k8s      (or undefined unless registering from k8s)
//								'k8s_service_account':  <string>			service account on k8s(or undefined unless registering from k8s)
//								'k8s_node_name':        <string>			node name on k8s      (or undefined unless registering from k8s)
//								'k8s_node_ip':          <string>			node ip address on k8s(or undefined unless registering from k8s)
//								'k8s_pod_name':         <string>			pod name on k8s       (or undefined unless registering from k8s)
//								'k8s_pod_id':           <string>			pod id on k8s         (or undefined unless registering from k8s)
//								'k8s_pod_ip':           <string>			pod ip address on k8s (or undefined unless registering from k8s)
//								'k8s_container_id':     <string>			container id on k8s   (or undefined unless registering from k8s)
//								...											(may be expanded in the future)
//			}
//		},
//		...
//	]
//
// [NOTE]
// This utility function is a submodule of rawGetRoleHostLists().
//
function rawGetRoleHostListsEx(dkcobj_permanent, keylist, is_hostname)
{
	var	resultarr = [];

	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return resultarr;
	}
	if('boolean' !== typeof is_hostname){
		r3logger.elog('parameter is_hostname is not boolean');
		return resultarr;
	}

	if(!apiutil.isEmptyArray(keylist)){
		//
		// keys
		//
		var	keys	= r3keys();															// temporary for regex key(getting tenant/service)

		// regex for parsing hostname(ip) from 'hostname(ip) port cuk' in keylist.
		var	keyptn;
		if(is_hostname){
			keyptn	= new RegExp('^' + keys.MATCH_ANY_HOSTNAME_PORT);					// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name/(.*) (.*) (.*)/
		}else{
			keyptn	= new RegExp('^' + keys.MATCH_ANY_IP_PORT);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/
		}

		for(var cnt = 0; cnt < keylist.length; ++cnt){
			var matches	= keylist[cnt].match(keyptn);
			if(apiutil.isEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				continue;
			}
			//
			// matches[4] ---> hostname or ip address
			// matches[5] ---> port number
			// matches[6] ---> container unique key(cuk)
			//
			var	host			= matches[4];
			var	is_any_port		= rawIsPortAny(matches[5]);
			var	port			= (is_any_port ? 0 : parseInt(matches[5]));
			var	cuk				= (apiutil.isSafeString(matches[6]) ? matches[6] : null);

			// get values in key
			var	detailval		= dkcobj_permanent.getValue(keylist[cnt], null, true, null);		// get value -> yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name/"hostname(ip) port cuk"
			if(!apiutil.checkSimpleJSON(detailval)){
				r3logger.wlog('could not get key(' + JSON.stringify(keylist[cnt]) + ') value, so skip this.');
				continue;
			}
			detailval				= JSON.parse(detailval);
			var	detail_host			= (is_hostname ? (apiutil.isSafeString(detailval.hostname) ? detailval.hostname : null) : (apiutil.isSafeString(detailval.ip) ? detailval.ip : null));
			var	detail_port			= (rawIsPortAny(detailval.port) ? 0 : parseInt(detailval.port));
			var	detail_cuk			= (apiutil.isSafeString(detailval.cuk) ? detailval.cuk : null);
			var	detail_extra		= (apiutil.isSafeString(detailval.extra) ? detailval.extra : null);
			var	detail_tag			= (apiutil.isSafeString(detailval.tag) ? detailval.tag : null);
			var	detail_inboundip	= (apiutil.isSafeString(detailval.inboundip) && apiutil.isIpAddressString(detailval.inboundip) ? detailval.inboundip : null);
			var	detail_outboundip	= (apiutil.isSafeString(detailval.outboundip) && apiutil.isIpAddressString(detailval.outboundip) ? detailval.outboundip : null);

			// check the consistency of both values
			if(host !== detail_host || port !== detail_port || cuk !== detail_cuk){
				r3logger.wlog('the value obtained from the key(' + JSON.stringify(keylist[cnt]) + ') is different from the value(' + JSON.stringify(detailval) + ') set for the key, so skip this.');
				continue;
			}

			// extra
			var	extra			= ((detail_extra == keys.VALUE_OPENSTACK_V1 || detail_extra == keys.VALUE_K8S_V1) ? detail_extra : null);
			var	is_k8s			= (null !== cuk && extra == keys.VALUE_K8S_V1);

			// detail for k8s
			var	k8s_details		= {};
			if(is_k8s){
				if(apiutil.isSafeString(detailval[keys.K8S_NAMESPACE_INCUK_KEY])){	k8s_details[keys.K8S_NAMESPACE_INCUK_KEY]	= detailval[keys.K8S_NAMESPACE_INCUK_KEY];	}
				if(apiutil.isSafeString(detailval[keys.K8S_SA_INCUK_KEY])){			k8s_details[keys.K8S_SA_INCUK_KEY]			= detailval[keys.K8S_SA_INCUK_KEY];			}
				if(apiutil.isSafeString(detailval[keys.K8S_NODENAME_INCUK_KEY])){	k8s_details[keys.K8S_NODENAME_INCUK_KEY]	= detailval[keys.K8S_NODENAME_INCUK_KEY];	}
				if(apiutil.isSafeString(detailval[keys.K8S_NODEIP_INCUK_KEY])){		k8s_details[keys.K8S_NODEIP_INCUK_KEY]		= detailval[keys.K8S_NODEIP_INCUK_KEY];		}
				if(apiutil.isSafeString(detailval[keys.K8S_PODNAME_INCUK_KEY])){	k8s_details[keys.K8S_PODNAME_INCUK_KEY]		= detailval[keys.K8S_PODNAME_INCUK_KEY];	}
				if(apiutil.isSafeString(detailval[keys.K8S_PODID_INCUK_KEY])){		k8s_details[keys.K8S_PODID_INCUK_KEY]		= detailval[keys.K8S_PODID_INCUK_KEY];		}
				if(apiutil.isSafeString(detailval[keys.K8S_PODIP_INCUK_KEY])){		k8s_details[keys.K8S_PODIP_INCUK_KEY]		= detailval[keys.K8S_PODIP_INCUK_KEY];		}
				if(apiutil.isSafeString(detailval[keys.K8S_CONTAINERID_INCUK_KEY])){k8s_details[keys.K8S_CONTAINERID_INCUK_KEY]	= detailval[keys.K8S_CONTAINERID_INCUK_KEY];}
			}

			// make parts of host_all
			var	host_all_ext	= (null === detail_outboundip	? '' : detail_outboundip);
			host_all_ext		= (null === detail_inboundip	? '' : detail_inboundip)	+ keys.VALUE_HOST_SEP + host_all_ext;
			host_all_ext		= (null === detail_tag			? '' : detail_tag)			+ keys.VALUE_HOST_SEP + host_all_ext.trimEnd();
			host_all_ext		= (null === extra				? '' : extra)				+ keys.VALUE_HOST_SEP + host_all_ext.trimEnd();
			host_all_ext		= host_all_ext.trim();

			// make one result object
			var	onehost			= {};
			onehost.host_normal	= host + (is_any_port ? '' : (keys.VALUE_HOST_REGSEP + String(port)));
			onehost.host_all	= host + keys.VALUE_HOST_SEP + (is_any_port ? keys.VALUE_ANY_PORT : String(port)) + keys.VALUE_HOST_SEP + (null === cuk ? '' : cuk) + (apiutil.isSafeString(host_all_ext) ? (keys.VALUE_HOST_SEP + host_all_ext) : '');
			onehost.detail_key	= host + keys.VALUE_HOST_DETAILSEP + (is_any_port ? '0' : String(port)) + keys.VALUE_HOST_DETAILSEP + (null === cuk ? '' : cuk);
			onehost.detail		= k8s_details;
			onehost.detail.host	= host;
			onehost.detail.port	= port;
			onehost.detail.extra= extra;
			onehost.detail.tag	= detail_tag;
			onehost.detail.cuk	= cuk;

			if(apiutil.isSafeString(detail_inboundip)){
				onehost.detail.inboundip = detail_inboundip;
			}
			if(apiutil.isSafeString(detail_outboundip)){
				onehost.detail.outboundip = detail_outboundip;
			}

			// add result
			resultarr.push(onehost);
		}
	}
	return resultarr;
}

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
//	always following object.
//	if not found role or hostnames or ips, these data is set empty array.
//	{
//		'normal': {									normalization hostname(ip)
//			'hostnames': [								hostname array or empty array
//				'<hostname>{:<port>}',					(if any port, port value is empty)
//				...
//			],
//			'ips': [									ip address array or empty array
//				'<ip address>{:<port>}',				(if any port, port value is empty)
//				...
//			]
//		},
//		'all': {									all information
//			'hostnames': [								hostname array or empty array
//				'<hostname> <port> <cuk> <extra> <tag> <inboundip> <outboundip>',		(if any port, port is *)
//				...
//			],
//			'ips': [									ip address array or empty array
//				'<ip address> <port> <cuk> <extra> <tag> <inboundip> <outboundip>',		(if any port, port is *)
//				...
//			]
//		},
//		'detail': {									detail information(used by the template engine)
//			'host': {									hostname object list
//				'<hostname>,<port>,<cuk>': {				one of hostanme object
//					'host':					<string>			hostanme(FQDN) string
//					'port':					<number>			port number(if any, set 0)
//					'extra':				<string>			'k8s-auto-v1' or 'openstack-auto-v1' or undefined(if it does not exist)
//					'tag':					<string>			tag string            (or undefined if it does not exist)
//					'cuk':					<string>			cuk string            (or undefined if it does not exist)
//					'inboundip':			<string>			inbound ip address    (or undefined if it does not exist)
//					'outboundip':			<string>			outbound ip address   (or undefined if it does not exist)
//					'k8s_namespace':        <string>			namespace on k8s      (or undefined unless registering from k8s)
//					'k8s_service_account':  <string>			service account on k8s(or undefined unless registering from k8s)
//					'k8s_node_name':        <string>			node name on k8s      (or undefined unless registering from k8s)
//					'k8s_node_ip':          <string>			node ip address on k8s(or undefined unless registering from k8s)
//					'k8s_pod_name':         <string>			pod name on k8s       (or undefined unless registering from k8s)
//					'k8s_pod_id':           <string>			pod id on k8s         (or undefined unless registering from k8s)
//					'k8s_pod_ip':           <string>			pod ip address on k8s (or undefined unless registering from k8s)
//					'k8s_container_id':     <string>			container id on k8s   (or undefined unless registering from k8s)
//					...											(may be expanded in the future)
//				},
//				...
//			},
//			'ip': {										ip address object list
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
function rawGetRoleHostLists(dkcobj_permanent, role_key, is_expand, base_role_top)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return null;
	}
	if('boolean' !== typeof is_expand){
		is_expand = false;																	// default is false
	}

	//
	// keys
	//
	var	keys			= r3keys();															// temporary for regex key(getting tenant/service)
	var	policies_key	= role_key	+ '/' + keys.POLICIES_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	var	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	var	id_key			= role_key	+ '/' + keys.ID_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	var	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	var	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"
	var	alias_key		= role_key	+ '/' + keys.ALIAS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"

	// result
	var	resultobj		= {
		'normal': {
			'hostnames':[],
			'ips':		[]
		},
		'all': {
			'hostnames':[],
			'ips':		[]
		},
		'detail': {
			'host':		{},
			'ip':		{}
		}
	};
	var	subkeylist;
	var	detailarray;
	var	subresobj;
	var	keyarr;
	var	cnt;
	var	cnt2;

	// get tenant/service
	var	roleptn			= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= role_key.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4){
		r3logger.elog('role parameter is not match role path : role=' + JSON.stringify(role_key));
		return null;
	}
	// reset keys with tenant and service
	keys				= r3keys(null, rolematches[2], rolematches[1]);
	if(!apiutil.isSafeString(base_role_top)){
		base_role_top	= keys.ROLE_TOP_KEY;												// set base role top if it is not specified
	}

	// get hostnames and ips from aliases when role is the direct base of base_role_top.
	if(is_expand && 0 === role_key.indexOf(base_role_top)){
		var	aliasvalue = dkcobj_permanent.getValue(alias_key, null, true, null);
		if(apiutil.checkSimpleJSON(aliasvalue)){
			aliasvalue = JSON.parse(aliasvalue);
			if(!apiutil.isEmptyArray(aliasvalue)){
				for(cnt = 0; cnt < aliasvalue.length; ++cnt){
					// get alias roles and merge result object
					subresobj					= rawGetRoleHostLists(dkcobj_permanent, aliasvalue[cnt], true, base_role_top);
					resultobj.normal.hostnames	= apiutil.mergeArray(resultobj.normal.hostnames, subresobj.normal.hostnames);
					resultobj.normal.ips		= apiutil.mergeArray(resultobj.normal.ips, subresobj.normal.ips);
					resultobj.all.hostnames		= apiutil.mergeArray(resultobj.all.hostnames, subresobj.all.hostnames);
					resultobj.all.ips			= apiutil.mergeArray(resultobj.all.ips, subresobj.all.ips);

					keyarr						= Object.keys(subresobj.detail.host);
					for(cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
						resultobj.detail.host[keyarr[cnt2]] = subresobj.detail.host[keyarr[cnt2]];
					}
					keyarr						= Object.keys(subresobj.detail.ip);
					for(cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
						resultobj.detail.ip[keyarr[cnt2]] = subresobj.detail.ip[keyarr[cnt2]];
					}
				}
			}
		}
	}

	// get own hostnames and merge result object
	subkeylist	= dkcobj_permanent.getSubkeys(name_key, true);
	if(!apiutil.isEmptyArray(subkeylist)){
		// get all details
		detailarray = rawGetRoleHostListsEx(dkcobj_permanent, subkeylist, true);

		for(cnt = 0; cnt < detailarray.length; ++cnt){
			resultobj.normal.hostnames.push(detailarray[cnt].host_normal);
			resultobj.all.hostnames.push(detailarray[cnt].host_all);
			resultobj.detail.host[detailarray[cnt].detail_key] = detailarray[cnt].detail;
		}
	}

	// get own ip addresses and merge result object
	subkeylist	= dkcobj_permanent.getSubkeys(ip_key, true);
	if(!apiutil.isEmptyArray(subkeylist)){
		// get all details
		detailarray = rawGetRoleHostListsEx(dkcobj_permanent, subkeylist, false);

		for(cnt = 0; cnt < detailarray.length; ++cnt){
			resultobj.normal.ips.push(detailarray[cnt].host_normal);
			resultobj.all.ips.push(detailarray[cnt].host_all);
			resultobj.detail.ip[detailarray[cnt].detail_key] = detailarray[cnt].detail;
		}
	}

	// get from under sub roles
	if(is_expand){
		subkeylist = apiutil.getSafeArray(dkcobj_permanent.getSubkeys(role_key, true));
		for(cnt = 0; cnt < subkeylist.length; ++cnt){
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
			subresobj					= rawGetRoleHostLists(dkcobj_permanent, subkeylist[cnt], true, base_role_top);
			resultobj.normal.hostnames	= apiutil.mergeArray(resultobj.normal.hostnames, subresobj.normal.hostnames);
			resultobj.normal.ips		= apiutil.mergeArray(resultobj.normal.ips, subresobj.normal.ips);
			resultobj.all.hostnames		= apiutil.mergeArray(resultobj.all.hostnames, subresobj.all.hostnames);
			resultobj.all.ips			= apiutil.mergeArray(resultobj.all.ips, subresobj.all.ips);

			keyarr						= Object.keys(subresobj.detail.host);
			for(cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
				resultobj.detail.host[keyarr[cnt2]] = subresobj.detail.host[keyarr[cnt2]];
			}
			keyarr						= Object.keys(subresobj.detail.ip);
			for(cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
				resultobj.detail.ip[keyarr[cnt2]] = subresobj.detail.ip[keyarr[cnt2]];
			}
		}
	}
	return resultobj;
}

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
//						{
//							result:		true/false
//							message:	null or error message
//							host_info:	[
//											{
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
function rawFindHost(tenant, service, role, hostname, ip, port, cuk, is_strict)
{
	var	resobj	= {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, role)){												// allow other argument is empty
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', role=' + JSON.stringify(role);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(hostname) && apiutil.isEmptyArray(hostname) && !apiutil.isSafeString(ip) && apiutil.isEmptyArray(ip)){
		resobj.result	= false;
		resobj.message	= 'both hostname and ip parameters are empty.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeEntity(port) || isNaN(port)){
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
	if('boolean' != typeof is_strict){
		is_strict		= false;
	}

	// check role name is only name or full yrn path
	var	keys		= r3keys(null, tenant, service);
	role			= role.toLowerCase();
	var	roleptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches	= role.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
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
	var	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);						// use permanent object(need to clean)
	var	role_key	= keys.ROLE_TOP_KEY + ':' + role;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// find
	var	result		= rawFindRoleHost(dkcobj, role_key, hostname, ip, port, cuk, is_strict);
	if(apiutil.isEmptyArray(result)){
		resobj.result	= false;
		resobj.message	= 'Not found any host by hostname(' + JSON.stringify(hostname) + ') and ip(' + JSON.stringify(ip) + ') and port(' + JSON.stringify(port) + ')';
	}else{
		resobj.host_info= result;
	}
	dkcobj.clean();
	return resobj;
}

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
function rawFindRoleHost(dkcobj_permanent, role_key, hostname, ip, port, cuk, is_strict, base_role_top)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(role_key)){
		r3logger.elog('some parameters are wrong : role_key=' + JSON.stringify(role_key));
		return null;
	}
	if(!apiutil.isSafeString(hostname) && apiutil.isEmptyArray(hostname) && !apiutil.isSafeString(ip) && apiutil.isEmptyArray(ip)){
		r3logger.elog('both hostname and ip parameters are empty.');
		return null;
	}
	if(!apiutil.isSafeEntity(port)){
		port = 0;
	}else if(isNaN(port)){
		r3logger.elog('port(' + JSON.stringify(port) + ') parameter is wrong.');
		return null;
	}
	if(!apiutil.isSafeString(cuk)){
		cuk = null;
	}
	if('boolean' != typeof is_strict){
		is_strict = false;
	}

	// get tenant/service
	var	keys			= r3keys();															// temporary for regex key(getting tenant/service)
	var	roleptn			= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= role_key.match(roleptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4){
		r3logger.elog('role parameter is not match role path : role=' + JSON.stringify(role_key));
		return null;
	}
	// reset keys with tenant and service
	keys				= r3keys(null, rolematches[2], rolematches[1]);
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
	var	policies_key	= role_key	+ '/' + keys.POLICIES_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/policies"
	var	reference_key	= role_key	+ '/' + keys.REFERENCE_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/reference"
	var	id_key			= role_key	+ '/' + keys.ID_KW;										// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/id"
	var	hosts_key		= role_key	+ '/' + keys.HOSTS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts"
	var	name_key		= hosts_key	+ '/' + keys.HOSTS_NAME_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/name"
	var	ip_key			= hosts_key	+ '/' + keys.HOSTS_IP_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/hosts/ip"
	var	tokens_key		= role_key	+ '/' + keys.ROLE_TOKEN_KW;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/tokens"
	var	alias_key		= role_key	+ '/' + keys.ALIAS_KW;									// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}/@"

	var	subkeylist;
	var	tmp_result;
	var	foud_hosts		= new Array(0);

	// check under hostname key
	if(apiutil.isSafeString(hostname) || !apiutil.isEmptyArray(hostname)){
		subkeylist	= dkcobj_permanent.getSubkeys(name_key, true);
		tmp_result	= rawMatchHost(dkcobj_permanent, subkeylist, hostname, port, cuk, is_strict);
		if(!apiutil.isEmptyArray(tmp_result)){
			foud_hosts = foud_hosts.concat(tmp_result);
		}
	}
	// check under ip key
	if(apiutil.isSafeString(ip) || !apiutil.isEmptyArray(ip)){
		subkeylist	= dkcobj_permanent.getSubkeys(ip_key, true);
		tmp_result	= rawMatchHost(dkcobj_permanent, subkeylist, ip, port, cuk, is_strict);
		if(!apiutil.isEmptyArray(tmp_result)){
			foud_hosts = foud_hosts.concat(tmp_result);
		}
	}
	// check under sub roles
	subkeylist		= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(role_key, true));
	for(var cnt = 0; cnt < subkeylist.length; ++cnt){
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
		tmp_result	= rawFindRoleHost(dkcobj_permanent, subkeylist[cnt], hostname, ip, port, cuk, is_strict, base_role_top);
		if(!apiutil.isEmptyArray(tmp_result)){
			// found host in sub roles
			foud_hosts = foud_hosts.concat(tmp_result);
		}
	}

	if(apiutil.isEmptyArray(foud_hosts)){
		r3logger.dlog('hostname(' + JSON.stringify(hostname) + ') / ip(' + JSON.stringify(ip) + ') and port(' + String(port) + ') and cuk(' + JSON.stringify(cuk) + ') is not found in role(' + role_key + ')');
		return null;
	}
	return foud_hosts;
}

// Utility for matching hostname(s) or ip and port in string array
//
// key_array	:	key string array, these keys are subkey list under hostname/ip key.
// target		:	hostname or ip address string, or array
// port			:	port number(0, undefined, null means any)
// cuk			:	container unique key(undefined, null means any)
// is_strict	:	check for exact mate of parameters such as port/cuk/extra
//
// return		:	null(not found) or found hostname(ip) following element array
//					[
//						{
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
function rawMatchHost(dkcobj_permanent, key_array, target, port, cuk, is_strict)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.dlog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(apiutil.isEmptyArray(key_array)){
		r3logger.dlog('host key array is empty');
		return null;
	}
	if(!apiutil.isSafeString(target) && apiutil.isEmptyArray(target)){
		r3logger.elog('target parameter is empty.');
		return null;
	}
	if(!apiutil.isArray(target) && apiutil.isSafeString(target)){
		target = [target];
	}
	if(!apiutil.isSafeEntity(port)){
		port = 0;
	}else if(isNaN(port)){
		r3logger.elog('port(' + JSON.stringify(port) + ') parameter is wrong.');
		return false;
	}
	port = parseInt(port);
	if(!apiutil.isSafeString(cuk)){
		cuk = null;
	}
	if('boolean' != typeof is_strict){
		is_strict = false;
	}
	var	extra = rawGetExtraFromCuk(cuk);			// make extra from cuk automatically

	//
	// Keys
	//
	var	keys		= r3keys();
	var	hostptn		= new RegExp('^' + keys.MATCH_ANY_HOSTNAME_PORT);							// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name/(.*) (.*) (.*)/
	var	ipptn		= new RegExp('^' + keys.MATCH_ANY_IP_PORT);									// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip/(.*) (.*) (.*)/
	var	found_hosts	= new Array(0);

	for(var cnt = 0; cnt < key_array.length; ++cnt){
		if(!apiutil.isSafeString(key_array[cnt])){
			r3logger.wlog('host key array(' + JSON.stringify(key_array[cnt]) + ') in array is not safe string.');
			continue;
		}
		// get host information
		var	host_value	= dkcobj_permanent.getValue(key_array[cnt], null, true, null);
		host_value		= apiutil.parseJSON(host_value);
		if(null == host_value){
			r3logger.wlog('host key array(' + JSON.stringify(key_array[cnt]) + ') does not have value or it is not JSON value.');
			continue;
		}

		// parse hostname(ip) and port by yrn(check hostname and ip yrn paths)
		var	matches	= key_array[cnt].match(hostptn);
		if(apiutil.isEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
			matches	= key_array[cnt].match(ipptn);
			if(apiutil.isEmptyArray(matches) || matches.length < 7 || !apiutil.isSafeString(matches[4]) || !apiutil.isSafeString(matches[5])){
				r3logger.wlog('host key array(' + JSON.stringify(key_array[cnt]) + ') is not matched by \'^yrn:yahoo:(.*)::(.*):role:(.*)/hosts/{name or ip}(.*) (.*) (.*)\'.');
				continue;
			}
		}
		//
		// matches[4] ---> hostname or ip address
		// matches[5] ---> port number
		// matches[6] ---> container unique key
		//
		var	hostobj			= {};
		hostobj.key			= key_array[cnt];
		hostobj.port		= (apiutil.isSafeString(matches[5]) && !isNaN(matches[5]))	? parseInt(matches[5])	: 0;
		hostobj.cuk			= apiutil.isSafeString(matches[6])							? matches[6]			: null;
		hostobj.extra		= apiutil.isSafeString(host_value.extra)					? host_value.extra		: null;
		hostobj.tag			= apiutil.isSafeString(host_value.tag)						? host_value.tag		: null;
		hostobj.hostname	= apiutil.isSafeString(host_value.hostname)					? host_value.hostname	: null;
		hostobj.ip			= apiutil.isSafeString(host_value.ip)						? host_value.ip			: null;

		if(apiutil.isSafeString(host_value.inboundip) && apiutil.isIpAddressString(host_value.inboundip)){
			hostobj.inboundip = host_value.inboundip;
		}
		if(apiutil.isSafeString(host_value.outboundip) && apiutil.isIpAddressString(host_value.outboundip)){
			hostobj.outboundip = host_value.outboundip;
		}

		var	host_or_ip		= apiutil.isSafeString(matches[4])							? matches[4]			: null;

		// check in target
		for(var cnt2 = 0; cnt2 < target.length; ++cnt2){
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
	return (apiutil.isEmptyArray(found_hosts) ? null : found_hosts);
}

//
// Small utility for checking port any
//
function rawIsPortAny(port)
{
	if(!apiutil.isSafeEntity(port)){
		return false;
	}
	var	keys = r3keys();
	if(apiutil.isSafeString(port) && keys.VALUE_ANY_PORT == port){
		return true;
	}
	if(!isNaN(port)){
		port = parseInt(port);
		if(0 === port){
			return true;
		}
	}
	return false;
}

//---------------------------------------------------------
// create resource raw function
//---------------------------------------------------------
//
// Common function for creating resource
//
// tenant				:	tenant name for resource
// service				:	service name
// resourcename			:	resource name
// type					:	resource data type(string or object)
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
function rawCreateResourceEx(dkcobj_permanent, tenant, service, resourcename, type, data, resource_keys, alias_resources, expire)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenant, resourcename)){								// allow other argument is empty
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', resourcename=' + JSON.stringify(resourcename));
		return false;
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;														// clear
	}

	var	keys			= r3keys(null, tenant, service);
	var	is_data			= false;
	var	is_alias		= false;
	var	is_reskeys		= false;
	var	is_expire		= false;

	// check type & data
	if(!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, type) && !apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, type)){
		r3logger.elog('type parameters are wrong : type=' + JSON.stringify(type));
		return false;
	}
	if(apiutil.compareCaseString(keys.VALUE_STRING_TYPE, type)){
		// type is string
		if(apiutil.isSafeString(data)){
			is_data			= true;
		}else if(!apiutil.isSafeEntity(data)){
			is_data			= false;
		}else if('' === data){
			is_data			= true;
		}else if(!isNaN(data)){														// case for JSON.parse returns not string
			is_data			= true;
			data			= String(data);
		}else{
			r3logger.elog('parameter data is wrong : data=' + JSON.stringify(data));
			return false;
		}
	}else{
		// type is object
		if(null === data){
			is_data			= false;
		}else if('' === data){
			// this means the data is needed cleanup, then type must be string
			is_data			= true;
			type			= keys.VALUE_STRING_TYPE;								// force string type
		}else if(apiutil.isSafeEntity(data)){
			// data must be encoded json
			is_data			= true;
			data			= JSON.stringify(data);
		}else{
			r3logger.elog('parameter data is wrong : data=' + JSON.stringify(data));
			return false;
		}
	}
	if(!apiutil.isSafeEntity(resource_keys)){
		is_reskeys 		= false;
	}else if('' === resource_keys){
		resource_keys	= {};
		is_reskeys		= true;
	}else if(resource_keys instanceof Object){
		// keys is only object(not array)
		is_reskeys 		= true;
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
		}else if(isNaN(expire)){
			r3logger.elog('parameter expire is wrong : expire=' + JSON.stringify(expire));
			return false;
		}else if(expire <= 0){
			is_expire	= false;
		}else{
			is_expire	= true;
			expire		= (new Date((apiutil.getUnixtime() + expire) * 1000)).toISOString();	// expire date(UTC ISO 8601)
		}

	}else{
		if(alias_resources instanceof Array){
			is_alias		= true;
		}else if(!apiutil.isSafeEntity(alias_resources)){
			is_alias		= false;
		}else if('' === alias_resources){
			alias_resources	= new Array(0);
			is_alias		= true;
		}else{
			r3logger.elog('parameter alias_resources is wrong : alias_resources=' + JSON.stringify(alias_resources));
			return false;
		}

		// expire is not set
		is_expire	= false;
	}

	var	subkeylist;
	var	need_update			= false;

	//
	// keys
	//
	var	resource_tmp		= ':' + resourcename;											// ":<resource>{/<resource>{...}}"
	var	resource_key		= keys.RESOURCE_TOP_KEY + resource_tmp;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
	var	type_key			= resource_key + '/' + keys.TYPE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type"
	var	reference_key		= resource_key + '/' + keys.REFERENCE_KW;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference"
	var	reskeys_key			= resource_key + '/' + keys.KEYS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys"
	var	alias_key			= resource_key + '/' + keys.ALIAS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@"
	var	expire_key			= resource_key + '/' + keys.EXPIRE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire"

	// create resource key(with subkeys tree from resource top key)
	if(!rawCreateKeyTree(dkcobj_permanent, keys.RESOURCE_TOP_KEY, resource_tmp, false)){
		r3logger.elog('could not create resource key tree(' + resourcename + ') from resource top key(' + keys.RESOURCE_TOP_KEY + ')');
		return false;
	}

	// check type/reference/keys/alias key
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(resource_key, true));
	if(apiutil.tryAddStringToArray(subkeylist, type_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, reference_key)){
		need_update	= true;
	}
	if(apiutil.tryAddStringToArray(subkeylist, reskeys_key)){
		need_update	= true;
	}
	if(is_alias && 0 < alias_resources.length && apiutil.tryAddStringToArray(subkeylist, alias_key)){	// Make alias key in subkey list only when new alias exists
		need_update	= true;
	}
	if(is_expire && apiutil.tryAddStringToArray(subkeylist, expire_key)){								// Make expire key in subkey list only when new expire exists
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
		if(!dkcobj_permanent.setValue(type_key, type)){										// set value "type" -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type
			r3logger.elog('could not set ' + type + ' value to ' + type_key + ' key');
			return false;
		}
		if(!dkcobj_permanent.setValue(resource_key, data)){									// set value "data" -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
			r3logger.elog('could not set ' + data + ' value to ' + resource_key + ' key');
			return false;
		}
	}

	// reference key
	var	value = dkcobj_permanent.casGet(reference_key);
	if(null === value || undefined === value){
		if(!dkcobj_permanent.casInit(reference_key, 0)){									// initialize cas value -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference
			r3logger.elog('could not initialize reference value to ' + reference_key + ' key');
			return false;
		}
	}

	// resource_keys
	if(is_reskeys){
		if(!dkcobj_permanent.setValue(reskeys_key, JSON.stringify(resource_keys))){			// update value keys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys
			r3logger.elog('could not set ' + JSON.stringify(resource_keys) + ' value to ' + reskeys_key + ' key');
			return false;
		}
	}

	// aliases
	value = dkcobj_permanent.getValue(alias_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(is_alias){
		var	cnt;
		var	tmpres;
		if(0 === alias_resources.length){
			if(null !== value){
				// if there is alias array, alias resource reference is needed to decrement
				if(!apiutil.isEmptyArray(value)){
					for(cnt = 0; cnt < value.length; ++cnt){
						tmpres = rawIncDecReferenceCount(dkcobj_permanent, value[cnt], false);
						if(!tmpres.result){
							r3logger.wlog('Failed to decrement reference in policy(' + value[cnt] + ') included from resource(' + resource_key + '), but continue...');
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
			subkeylist	= dkcobj_permanent.getSubkeys(resource_key, true);
			if(apiutil.removeStringFromArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){					// remove subkey yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@ -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + resource_key + ' key');
					return false;
				}
			}
		}else{
			// get removing element(alias resource) & decrement it's reference
			var	delarr = apiutil.getDeletingDifferenceArray(value, alias_resources);
			for(cnt = 0; cnt < delarr.length; ++cnt){
				tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in resource(' + delarr[cnt] + ') included from resource(' + resource_key + '), but continue...');
				}
			}
			// set aliases value 
			if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(alias_resources))){		// update value alias -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
				r3logger.elog('could not set ' + JSON.stringify(alias_resources) + ' value to ' + alias_key + ' key');
				return false;
			}
			// get adding element(alias resource) & increment it's reference
			var	addarr = apiutil.getAddingDifferenceArray(value, alias_resources);
			for(cnt = 0; cnt < addarr.length; ++cnt){
				tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
				if(!tmpres.result){
					r3logger.wlog('Failed to increment reference in resource(' + addarr[cnt] + ') included from resource(' + resource_key + '), but continue...');
				}
			}
			// add subkey(alias:@) in resource subkey list
			subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(resource_key, true));
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
		if(!dkcobj_permanent.setValue(expire_key, expire)){									// update value keys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire
			r3logger.elog('could not set ' + JSON.stringify(expire_key) + ' value to ' + expire);
			return false;
		}
	}
	return true;
}

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
function rawCreateResourceByUser(user, tenant, resourcename, type, data, resource_keys, alias_resources)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant, resourcename)){									// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', resourcename=' + JSON.stringify(resourcename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
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
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to access resourcename(' + resourcename + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	if(!rawCreateResourceEx(dkcobj, tenant, null, resourcename, type, data, resource_keys, alias_resources)){
		resobj.result	= false;
		resobj.message	= 'could not create resourcename(' + JSON.stringify(resourcename) + ') for tenant(' + tenant + '), user(' + user + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
}

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
function rawCreateResourceByRoleWithDkc(dkcobj_permanent, role, tenant, resourcename, type, data, resource_keys)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(role, tenant, resourcename)){									// other argument is checked in common function
		r3logger.elog('some parameters are wrong : role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant) + ', resourcename=' + JSON.stringify(resourcename));
		return false;
	}

	var	keys				= r3keys(null, tenant);
	var	role_key			= keys.ROLE_TOP_KEY + ':' + role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	resource_key		= keys.RESOURCE_TOP_KEY + ':' + resourcename;					// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	var	roledata						= {};
	roledata[keys.VALUE_POLICIES_TYPE]	= [];
	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true) || apiutil.isEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		r3logger.elog('could not get role(' + role + ') in tenant(' + tenant + ') policy data.');
		return false;
	}

	// check policies
	var	access_result = null;
	for(var cnt = 0; cnt < roledata[keys.VALUE_POLICIES_TYPE].length; ++cnt){
		// check each policy has write access
		access_result = rawCheckPolicies(dkcobj_permanent, roledata[keys.VALUE_POLICIES_TYPE][cnt], resource_key, keys.ACTION_WRITE_KEY, access_result);
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		r3logger.elog('role(' + role + ') in tenant(' + tenant + ') does not allow to write access to resourcename(' + resourcename + ').');
		return false;
	}

	// call common function(aliases can not be specified from role)
	return rawCreateResourceEx(dkcobj_permanent, tenant, null, resourcename, type, data, resource_keys, null);
}

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
function rawCreateResourceByRole(role, tenant, resourcename, type, data, resource_keys)
{
	var	resobj = {result: true, message: null};

	// parse role yrn to role name and tenant name
	var	keys			= r3keys(null, tenant);
	var	tenantname		= null;																// eslint-disable-line no-unused-vars
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= role.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + role + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if('' !== apiutil.getSafeString(rolematches[1]) || tenant !== rolematches[2]){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + role + ') is not target role which has tenant(' + tenant + ') without service.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	tenantname	= rolematches[2];															// eslint-disable-line no-unused-vars
	rolename	= rolematches[3];

	// call common function
	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	if(!rawCreateResourceByRoleWithDkc(dkcobj, rolename, tenant, resourcename, type, data, resource_keys)){
		resobj.result	= false;
		resobj.message	= 'could not create resource(' + JSON.stringify(resourcename) + ') for tenant(' + tenant + '), role(' + rolename + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
}

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
function rawCreateResourceByIP(ip, port, cuk, roleyrn, resourcename, type, data, resource_keys)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(ip, roleyrn, resourcename) || isNaN(port)){					// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resourcename=' + JSON.stringify(resourcename);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	keys				= r3keys();
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
	var	tenantname		= null;
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	tenantname	= rolematches[2];
	rolename	= rolematches[3];

	// check host
	var	host_info = rawFindRoleHost(dkcobj, roleyrn, null, ip, port, cuk, false);			// not strictly check
	if(apiutil.isEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + ip + ':' + String(port) + ') is not role(' + roleyrn + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	if(!rawCreateResourceByRoleWithDkc(dkcobj, rolename, tenantname, resourcename, type, data, resource_keys)){
		resobj.result	= false;
		resobj.message	= 'could not create resource(' + JSON.stringify(resourcename) + ') for tenant(' + tenantname + '), role(' + rolename + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	dkcobj.clean();
	return resobj;
}

//
// First raw function for creating resource
//
// tenant				:	tenant name for resource
// service				:	service name
// resource_objs		:	result of verify url(or static data), see following:
//
//	resource_objs = [				:	resource array, if one element, allows only it as object.
//		{
//			name					:	resource name which is key name(path) for resource
//			expire					:	undefined/null or integer
//			type					:	resource data type(string or object), default is string.
//			data					:	resource data which must be string or object or null/undefined(type is string).
//			keys = {				:	resource has keys(associative array), or null/undefined.
//				'foo':	bar,		:		any value is allowed
//				...					:
//			}						:
//		},
//		...
//	]
//
// Result				:	resource key array which are set, or null when error.
//
function rawCreateServiceTenantResource(dkcobj_permanent, tenant, service, resource_objs)
{
	if(!apiutil.isSafeStrings(tenant, service)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return null;
	}
	if(!apiutil.isSafeEntity(resource_objs)){
		r3logger.elog('parameter is wrong : resource_objs=' + JSON.stringify(resource_objs));
		return null;
	}
	if(!apiutil.isArray(resource_objs)){
		resource_objs = [resource_objs];												// object to one array member
	}
	if(apiutil.isEmptyArray(resource_objs)){
		r3logger.elog('parameter is wrong : resource_objs=' + JSON.stringify(resource_objs));
		return null;
	}

	// keys
	var	keys			= r3keys(null, tenant, service);

	// set each resource
	var	reskeys			= [];
	var	resourcename;
	var	expire;
	var	type;
	var	data;
	var	resource_keys;
	for(var cnt = 0; cnt < resource_objs.length; ++cnt){
		if(!apiutil.isSafeEntity(resource_objs[cnt])){
			r3logger.elog('resource object[' + String(cnt) + '] is not safe object(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
			continue;
		}
		// resource name
		if(!apiutil.isSafeString(resource_objs[cnt][keys.ACR_RESOURCE_NAME_KEY])){
			r3logger.elog('resource object[' + String(cnt) + '] does not have resource name(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
			continue;
		}
		resourcename	= resource_objs[cnt][keys.ACR_RESOURCE_NAME_KEY];

		// expire
		if(apiutil.isSafeEntity(resource_objs[cnt][keys.ACR_RESOURCE_EXPIRE_KEY])){
			if(isNaN(resource_objs[cnt][keys.ACR_RESOURCE_EXPIRE_KEY])){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong expire(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
				continue;
			}
			expire = parseInt(resource_objs[cnt][keys.ACR_RESOURCE_EXPIRE_KEY]);
			if(expire <= 0){
				expire = null;
			}
		}

		// type
		if(!apiutil.isSafeString(resource_objs[cnt][keys.ACR_RESOURCE_TYPE_KEY])){
			type	= keys.VALUE_STRING_TYPE;
		}else if(apiutil.compareCaseString(keys.VALUE_STRING_TYPE, resource_objs[cnt][keys.ACR_RESOURCE_TYPE_KEY])){
			type	= keys.VALUE_STRING_TYPE;
		}else if(apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, resource_objs[cnt][keys.ACR_RESOURCE_TYPE_KEY])){
			type	= keys.VALUE_OBJECT_TYPE;
		}else{
			r3logger.elog('resource object[' + String(cnt) + '] has wrong type(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
			continue;
		}

		// data
		if(apiutil.isSafeString(resource_objs[cnt][keys.ACR_RESOURCE_DATA_KEY])){
			if(type !== keys.VALUE_STRING_TYPE){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong type against data type(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
				continue;
			}
			data		= resource_objs[cnt][keys.ACR_RESOURCE_DATA_KEY];

		}else if(apiutil.isSafeEntity(resource_objs[cnt][keys.ACR_RESOURCE_DATA_KEY])){
			if(type === keys.VALUE_STRING_TYPE){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong type against data type(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
				continue;
			}
			// check JSON
			if(apiutil.checkSimpleJSON(resource_objs[cnt][keys.ACR_RESOURCE_DATA_KEY])){
				data	= JSON.parse(resource_objs[cnt][keys.ACR_RESOURCE_DATA_KEY]);
			}else{
				data	= resource_objs[cnt][keys.ACR_RESOURCE_DATA_KEY];
			}
		}else{
			if(type === keys.VALUE_STRING_TYPE){
				data	= '';
			}else{
				data	= null;
			}
		}

		// keys
		if(!apiutil.isSafeEntity(resource_objs[cnt][keys.ACR_RESOURCE_KEYS_KEY])){
			resource_keys = null;
		}else{
			if(apiutil.isSafeString(resource_objs[cnt][keys.ACR_RESOURCE_KEYS_KEY])){
				// if keys is string, it must be JSON
				if(!apiutil.checkSimpleJSON(resource_objs[cnt][keys.ACR_RESOURCE_KEYS_KEY])){
					r3logger.elog('resource object[' + String(cnt) + '] has wrong resource keys(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
					continue;
				}
				resource_keys	= JSON.parse(resource_objs[cnt][keys.ACR_RESOURCE_KEYS_KEY]);
			}else{
				resource_keys	= resource_objs[cnt][keys.ACR_RESOURCE_KEYS_KEY];
			}

			if(!apiutil.isSafeEntity(resource_keys)){
				r3logger.elog('resource object[' + String(cnt) + '] has wrong resource keys(' + JSON.stringify(resource_objs[cnt]) + '), but continue...');
				continue;
			}
		}

		//
		// Set one resource
		//
		if(!rawCreateResourceEx(dkcobj_permanent, tenant, service, resourcename, type, data, resource_keys, null, expire)){
			r3logger.elog('could not create resource(' + JSON.stringify(resourcename) + ') for tenant(' + tenant + '), service(' + service + ')');
			return null;
		}

		// add resource key yrn path
		reskeys.push(keys.RESOURCE_TOP_KEY + ':' + resourcename);
	}
	return reskeys;
}

//---------------------------------------------------------
// Common get resource raw function
//---------------------------------------------------------
//
// Utility function:	This function is reentrant
//
//	resdata:			Must be object
//						{
//							string:		"string",
//							object:		object
//							keys:		object
//							expire:		number			---> null when expire
//							aliases:	array			---> only is_expand is false
//						}
//
function rawGetResourcesEx(dkcobj_permanent, resource_key, resdata, is_expand, is_parent, checked_resources, base_resource_top)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeString(resource_key)){
		r3logger.elog('some parameters are wrong : resource_key=' + JSON.stringify(resource_key));
		return false;
	}
	if('boolean' !== typeof is_expand){
		is_expand			= true;
	}
	if('boolean' !== typeof is_parent){
		is_parent			= true;
	}
	if(!apiutil.isArray(checked_resources)){
		checked_resources	= new Array(0);
	}
	if(apiutil.findStringInArray(checked_resources, resource_key)){
		r3logger.wlog('resource(' + resource_key + ') already checked, then this resource is included from another resource. Thus skip this for escaping blocking.');
		return true;
	}else{
		checked_resources.push(resource_key);
	}
	var	value;
	var	cnt;

	//
	// keys
	//
	var	keys				= rawGetKeysFromResourceKey(null, resource_key);			// create keys from resource key
	var	parent_key			= apiutil.getParentPath(resource_key);						// parent resource key
	var	type_key			= resource_key + '/' + keys.TYPE_KW;						// type
	var	reference_key		= resource_key + '/' + keys.REFERENCE_KW;					// eslint-disable-line no-unused-vars
	var	reskeys_key			= resource_key + '/' + keys.KEYS_KW;						// keys
	var	alias_key			= resource_key + '/' + keys.ALIAS_KW;						// aliases
	var	expire_key			= resource_key + '/' + keys.EXPIRE_KW;						// expire

	if(!apiutil.isSafeString(base_resource_top)){
		base_resource_top	= keys.RESOURCE_TOP_KEY;									// resource top key
	}

	// check resdata
	if(	!apiutil.isSafeEntity(resdata)								||
		undefined === resdata[keys.VALUE_STRING_TYPE]				||
		undefined === resdata[keys.VALUE_OBJECT_TYPE]				||
		undefined === resdata[keys.VALUE_KEYS_TYPE]					||
		undefined === resdata[keys.VALUE_EXPIRE_TYPE]				||
		(!is_expand && undefined === resdata[keys.VALUE_ALIAS_TYPE]) )					// only not expand
	{
		r3logger.elog('resdata parameter is wrong : resdata=' + JSON.stringify(resdata));
		return false;
	}

	// check expire
	//
	// [NOTE]
	// The resource under service + tenant has expire key/value, then we need to check it.
	//
	// [TODO]
	// Now we only check expire date, not update expire and new resource data from verify
	// url. Thus we need to create a logic for update.
	//
	value = dkcobj_permanent.getValue(expire_key, null, true, null);
	if(apiutil.isSafeString(value)){
		if(apiutil.isExpired(value)){
			r3logger.dlog('resource(' + resource_key + ') is expired : expire=' + JSON.stringify(value));
			return false;
		}
		resdata[keys.VALUE_EXPIRE_TYPE] = value;
	}

	// check parent
	if(is_parent){
		if(apiutil.isSafeString(base_resource_top) && apiutil.isSafeString(parent_key) && 0 === resource_key.indexOf(base_resource_top) && keys.RESOURCE_TOP_KEY != parent_key){
			// get parent data when resource key is under base resource top key.
			if(!rawGetResourcesEx(dkcobj_permanent, parent_key, resdata, is_expand, is_parent, checked_resources, base_resource_top)){
				return false;
			}
		}
	}

	// check resource under aliases
	value = dkcobj_permanent.getValue(alias_key, null, true, null);
	if(is_expand){
		if(apiutil.checkSimpleJSON(value)){
			value = JSON.parse(value);
			if(!apiutil.isEmptyArray(value)){
				for(cnt = 0; cnt < value.length; ++cnt){
					// get alias resources(aliases always does not check parent)
					if(!rawGetResourcesEx(dkcobj_permanent, value[cnt], resdata, is_expand, false, checked_resources, base_resource_top)){
						return false;
					}
				}
			}
		}
	}else{
		if(apiutil.checkSimpleJSON(value)){
			value = JSON.parse(value);
		}else{
			value = [];
		}
		resdata[keys.VALUE_ALIAS_TYPE] = value;
	}

	// get resource keys
	value = dkcobj_permanent.getValue(reskeys_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(apiutil.isSafeEntity(value)){
		// [NOTE]
		// key's value is object(keyname-value), and we set these as following two key name into resdata[keys.VALUE_KEYS_TYPE].
		// Then these objects is used by template engine.
		//	{
		//		'keyname':								'value'
		//		'resource YRN full path' + 'key name':	'value'
		//	}
		//

		// build full yrn path key and value
		var	fullkeyvalue = {};
		for(var keyname in value){
			var	fullkeyname				= reskeys_key + '/' + keyname;
			fullkeyvalue[fullkeyname]	= value[keyname];						// if value[keyname] is array or object, this value is reference.
		}
		// merge value and full yrn path key object
		value = apiutil.mergeObjects(value, fullkeyvalue);

		// this resource has keys value, thus keys is merged to return value
		if(apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE])){
			resdata[keys.VALUE_KEYS_TYPE] = apiutil.mergeObjects(resdata[keys.VALUE_KEYS_TYPE], value);
		}else{
			resdata[keys.VALUE_KEYS_TYPE] = value;
		}
	}

	// get value type for this resource
	value = dkcobj_permanent.getValue(type_key, null, true, null);
	if(	!apiutil.isSafeString(value) &&
		!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, value) &&
		!apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, value) )
	{
		r3logger.elog('resource(' + resource_key + ') has unknown data type: type=' + JSON.stringify(value));
		return false;
	}
	var	is_data_string	= false;
	if(apiutil.compareCaseString(keys.VALUE_STRING_TYPE, value)){
		is_data_string	= true;
	}

	// get value for this resource
	value = dkcobj_permanent.getValue(resource_key, null, true, null);
	if(apiutil.isSafeEntity(value)){
		// has resource data
		if(is_data_string){
			// data type is string, so we add string to the already set character string.
			//
			// [NOTE]
			// Do not care for last character is CR/LF/etc.
			// If you need CR for each resource, you must set CR to each resource's last word.
			//
			resdata[keys.VALUE_STRING_TYPE]	= apiutil.getSafeString(resdata[keys.VALUE_STRING_TYPE]);
			resdata[keys.VALUE_STRING_TYPE]	+= value;
		}else{
			// data type is object, so we merge object as over writing
			//
			value = apiutil.parseJSON(value);
			if(apiutil.isSafeEntity(resdata[keys.VALUE_OBJECT_TYPE])){
				resdata[keys.VALUE_OBJECT_TYPE] = apiutil.mergeObjects(resdata[keys.VALUE_OBJECT_TYPE], value);
			}else{
				resdata[keys.VALUE_OBJECT_TYPE] = value;
			}
		}
	}else{
		// does not have resource data --> nothing to add
	}
	return true;
}

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
//		{
//			"result":	true or false
//			"message":	error message
//			"resource":	{
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
function rawGetResourceEx(dkcobj_permanent, tenant, service, resource_key, is_expand)
{
	var	resobj = {result: true, message: null};

	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeStrings(tenant, resource_key)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', resource_key=' + JSON.stringify(resource_key);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if('boolean' !== typeof is_expand){
		is_expand	= true;															// default all expand
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	// get resource
	var	keys							= r3keys(null, tenant, service);
	var	variable_keys;
	var	varresdata;
	var	var_resource_key;
	var	var_role_key;
	var	var_host_res;
	var	resdata							= {};
	resdata[keys.VALUE_STRING_TYPE]		= null;
	resdata[keys.VALUE_OBJECT_TYPE]		= null;
	resdata[keys.VALUE_KEYS_TYPE]		= null;
	resdata[keys.VALUE_EXPIRE_TYPE]		= null;
	if(!is_expand){
		resdata[keys.VALUE_ALIAS_TYPE]	= null;
	}

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
	if(is_expand && apiutil.isSafeString(resdata[keys.VALUE_STRING_TYPE])){
		// load template engine
		var	r3templ = new r3templeng.r3template;

		// load resource string to template engine
		if(!r3templ.load(resdata[keys.VALUE_STRING_TYPE])){
			if(!r3templ.parseEngineType(resdata[keys.VALUE_STRING_TYPE])){
				resobj.message	= 'The resource requires another template engine, but now we do not support another.';
			}else{
				resobj.message	= 'Could not load resource for template engine: ' + resdata[keys.VALUE_STRING_TYPE];
			}
			resobj.result	= false;
			r3logger.elog(resobj.message);
			return resobj;
		}

		// get all variable names specified in resource string
		var	templvararr = r3templ.getVariableNames();

		// check variable names whichever is yrn path
		//
		// [NOTE]
		// If variable is yrn path(resource or role), we get the value for it here,
		// and set it to resdata.
		// These variables(and values) is used by executing template engine.
		//
		var	ptnResData		= new RegExp('^' + keys.MATCH_ANY_TENANT_RES_DATA);		// regex pattern: yrn:yahoo:(.*)::(.*):resource:(.*)
		var	ptnNotResData	= new RegExp(keys.MATCH_NOT_TENANT_RES_DATA);			//                ( |\t|\r|\n|:) for not match resource data key name
		var	ptnResKey		= new RegExp('^' + keys.MATCH_ANY_TENANT_RES_KEY);		//				  yrn:yahoo:(.*)::(.*):resource:(.*)/keys/(.*)
		var	ptnHostNames	= new RegExp('^' + keys.MATCH_ANY_HOSTNAME_KEYS);		//				  yrn:yahoo:(.*)::(.*):role:(.*)/hosts/name
		var	ptnIps			= new RegExp('^' + keys.MATCH_ANY_IP_KEYS);				//				  yrn:yahoo:(.*)::(.*):role:(.*)/hosts/ip
		var	ptnAllhost		= new RegExp('^' + keys.MATCH_ANY_ALLHOST_KEYS);		//				  yrn:yahoo:(.*)::(.*):role:(.*)/hosts/all
		var	matches;
		for(var cnt = 0; cnt < templvararr.length; ++cnt){
			if(!apiutil.isSafeString(templvararr[cnt])){
				// something wrong, skip this.
				continue;
			}
			if(apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE]) && apiutil.isSafeEntity(resdata[keys.VALUE_KEYS_TYPE][templvararr[cnt]])){
				// already has variable, skip this.
				continue;
			}

			if(null != (matches = templvararr[cnt].match(ptnResKey)) && !apiutil.isEmptyArray(matches) && 5 <= matches.length){
				//
				// variable is resource key
				//
				variable_keys	= r3keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
				var_resource_key= variable_keys.RESOURCE_TOP_KEY + ':' + matches[3];						// for target resource yrn path

				// get resource without expanding (because it is dead loop with expanding)
				varresdata = rawGetResourceEx(dkcobj_permanent, tenant, service, var_resource_key, false);	// must not expand
				if(!varresdata.result || !apiutil.isSafeEntity(varresdata.resource) || !apiutil.isSafeEntity(varresdata.resource[keys.VALUE_KEYS_TYPE]) || 0 >= Object.keys(varresdata.resource[keys.VALUE_KEYS_TYPE]).length){
					r3logger.dlog('resource path(' + templvararr[cnt] + ') is empty.');
				}else{
					// merge keys
					resdata[keys.VALUE_KEYS_TYPE] = apiutil.mergeObjects(resdata[keys.VALUE_KEYS_TYPE], varresdata.resource[keys.VALUE_KEYS_TYPE]);
				}

			}else if(null != (matches = templvararr[cnt].match(ptnResData)) && !apiutil.isEmptyArray(matches) && 4 <= matches.length && null === matches[3].match(ptnNotResData)){
				//
				// variable is resource data
				//
				variable_keys	= r3keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
				var_resource_key= variable_keys.RESOURCE_TOP_KEY + ':' + matches[3];						// for target resource yrn path

				// get resource without expanding (because it is dead loop with expanding)
				//
				// [NOTE][TODO]
				// Do not expand another resource data here now, because we do not support loops that
				// contain the same resource path.
				//
				varresdata = rawGetResourceEx(dkcobj_permanent, tenant, service, var_resource_key, false);	// must not expand now
				if(!varresdata.result){
					r3logger.dlog('resource path(' + templvararr[cnt] + ') is empty.');
				}else if(!apiutil.isSafeEntity(varresdata.resource)){
					r3logger.dlog('resource path(' + templvararr[cnt] + ') result resource data is empty.');
				}else{
					// merge keys(not merge expire)
					if(apiutil.isSafeEntity(varresdata.resource[keys.VALUE_OBJECT_TYPE])){
						resdata[keys.VALUE_KEYS_TYPE][templvararr[cnt]] = varresdata.resource[keys.VALUE_OBJECT_TYPE];
					}else if(apiutil.isSafeString(varresdata.resource[keys.VALUE_STRING_TYPE])){
						resdata[keys.VALUE_KEYS_TYPE][templvararr[cnt]] = varresdata.resource[keys.VALUE_STRING_TYPE];
					}else{
						r3logger.dlog('resource path(' + templvararr[cnt] + ') does not have string and object.');
					}
				}

			}else if(null != (matches = templvararr[cnt].match(ptnHostNames)) && !apiutil.isEmptyArray(matches) && 4 <= matches.length){
				//
				// variable is hostnames in role
				//
				if(tenant !== matches[2] || (null !== service && service !== matches[1]) || (null === service && apiutil.isSafeString(matches[1]))){
					// service/tenant name is not matched.
					r3logger.dlog('hostname path(' + templvararr[cnt] + ') is not allowed to access by tenant(' + tenant + '), service(' + (null === service ? 'null' : service) + ').');
				}else{
					// get matched role's hostnames
					variable_keys	= r3keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
					var_role_key	= variable_keys.ROLE_TOP_KEY + ':' + matches[3];
					var_host_res	= rawGetRoleHostLists(dkcobj_permanent, var_role_key, true);

					// set normalization hostnames array to resdata[keys.VALUE_KEYS_TYPE]
					resdata[keys.VALUE_KEYS_TYPE][templvararr[cnt]] = var_host_res.detail.host;
				}

			}else if(null != (matches = templvararr[cnt].match(ptnIps)) && !apiutil.isEmptyArray(matches) && 4 <= matches.length){
				//
				// variable is ip address in role
				//
				if(tenant !== matches[2] || (null !== service && service !== matches[1]) || (null === service && apiutil.isSafeString(matches[1]))){
					// service/tenant name is not matched.
					r3logger.dlog('hostname path(' + templvararr[cnt] + ') is not allowed to access by tenant(' + tenant + '), service(' + (null === service ? 'null' : service) + ').');
				}else{
					// get matched role's ip addresses
					variable_keys	= r3keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
					var_role_key	= variable_keys.ROLE_TOP_KEY + ':' + matches[3];
					var_host_res	= rawGetRoleHostLists(dkcobj_permanent, var_role_key, true);

					// set normalization ip address array to resdata[keys.VALUE_KEYS_TYPE]
					resdata[keys.VALUE_KEYS_TYPE][templvararr[cnt]] = var_host_res.detail.ip;
				}

			}else if(null != (matches = templvararr[cnt].match(ptnAllhost)) && !apiutil.isEmptyArray(matches) && 4 <= matches.length){
				//
				// variable is all host(hostname and ip address) in role
				//
				if(tenant !== matches[2] || (null !== service && service !== matches[1]) || (null === service && apiutil.isSafeString(matches[1]))){
					// service/tenant name is not matched.
					r3logger.dlog('hostname path(' + templvararr[cnt] + ') is not allowed to access by tenant(' + tenant + '), service(' + (null === service ? 'null' : service) + ').');
				}else{
					// get matched role's hostname and ip addresses
					variable_keys	= r3keys(null, matches[2], (apiutil.isSafeString(matches[1]) ? matches[1] : null));
					var_role_key	= variable_keys.ROLE_TOP_KEY + ':' + matches[3];
					var_host_res	= rawGetRoleHostLists(dkcobj_permanent, var_role_key, true);

					// merge object(merge hostname into ip address object)
					var	keyarr		= Object.keys(var_host_res.detail.host);
					for(var cnt2 = 0; cnt2 < keyarr.length; ++cnt2){
						var_host_res.detail.ip[keyarr[cnt2]] = var_host_res.detail.host[keyarr[cnt2]];
					}

					// set normalization ip address array to resdata[keys.VALUE_KEYS_TYPE]
					resdata[keys.VALUE_KEYS_TYPE][templvararr[cnt]] = var_host_res.detail.ip;
				}
			}else{
				// variable name does not match yrn full path patterns, then this variable is not set to resdata[keys.VALUE_KEYS_TYPE].
			}
		}

		// execute template engine with resource string and variables
		var	templres = r3templ.execute(resdata[keys.VALUE_KEYS_TYPE]);
		if(templres.isFailure()){
			// something wrong when executing template engine.
			resobj.result	= false;
			resobj.message	= 'failed to expand ' + resource_key + ' and to execute template engine. there is something wrong in template string : ' + resdata[keys.VALUE_STRING_TYPE];
			r3logger.elog(resobj.message);
			return resobj;
		}
		// set expanded string (which is the result of executing template engine)
		resdata[keys.VALUE_STRING_TYPE] = templres.getString();
	}

	resobj.resource	= resdata;
	r3logger.dlog('Get resource(' + resource_key + ') = ' + JSON.stringify(resdata));

	return resobj;
}

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
function rawGetResourceByUser(user, tenantname, servicename, resyrn, is_expand)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenantname, resyrn)){
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
	if('boolean' !== typeof is_expand){
		is_expand	= true;																	// default all expand
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
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
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenantname)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenantname(' + tenantname + ') member, then could not allow to access resource(' + resyrn + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	//
	// Keys
	//
	var	keys				= r3keys(user, tenantname, servicename);

	//----------------------------------------------
	// check resource yrn path
	//----------------------------------------------
	var	resourceyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);				// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	var	resourcematches		= resyrn.match(resourceyrnptn);
	if(apiutil.isEmptyArray(resourcematches) || resourcematches.length < 4 || !apiutil.isSafeString(resourcematches[3])){
		// name is not full yrn to resource, then check wrong resource name
		var	topyrnptn	= new RegExp('^' + keys.NO_TENANT_KEY);								// regex = /^yrn:yahoo:/
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
	if(resobj.result && apiutil.isSafeEntity(resobj.resource) && apiutil.isSafeEntity(resobj.resource[keys.VALUE_KEYS_TYPE])){
		// build full yrn path key and value
		var	baseKeys	= resobj.resource[keys.VALUE_KEYS_TYPE];
		var	filterKeys	= {};
		for(var keyname in baseKeys){
			if(0 === keyname.indexOf(keys.YRN_KEY + ':')){									// keyname starts 'yrn:' words.
				// skip full yrn(simple checking) path key name.
				continue;
			}
			filterKeys[keyname] = baseKeys[keyname];
		}
		// reset with new filtered keys
		resobj.resource[keys.VALUE_KEYS_TYPE] = filterKeys;
	}

	// [NOTE]
	// If expire key is existed, remove it here.
	//
	if(resobj.result && apiutil.isSafeEntity(resobj.resource[keys.VALUE_EXPIRE_TYPE])){
		delete resobj.resource[keys.VALUE_EXPIRE_TYPE];
	}
	return resobj;
}

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
function rawGetResourceByRoleWithDkc(dkcobj_permanent, role, tenant, service, resyrn, type, keyname)
{
	var	resobj = {result: true, message: null};

	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeStrings(role, tenant, resyrn)){										// other argument is checked in common function
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

	var	keys = r3keys(null, tenant, service);												// we need check type here
	if(!apiutil.isSafeString(type) || (!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, type) && !apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, type) && !apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, type))){
		resobj.result	= false;
		resobj.message	= 'type(' + JSON.stringify(type) + ') parameter is wrong';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, type) && !apiutil.isSafeString(keyname)){
		resobj.result	= false;
		resobj.message	= 'keyname(' + JSON.stringify(keyname) + ') parameter with type(' + JSON.stringify(type) + ') parameter is wrong';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// Role key
	var	role_key			= keys.ROLE_TOP_KEY + ':' + role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"

	//----------------------------------------------
	// check resource yrn path
	//----------------------------------------------
	var	resourceyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);				// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	var	resourcematches		= resyrn.match(resourceyrnptn);
	if(apiutil.isEmptyArray(resourcematches) || resourcematches.length < 4 || !apiutil.isSafeString(resourcematches[3])){
		resobj.result	= false;
		resobj.message	= 'resyrn(' + JSON.stringify(resyrn) + ') is not full yrn resource path.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	var	roledata						= {};
	roledata[keys.VALUE_POLICIES_TYPE]	= [];
	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true) || apiutil.isEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		resobj.result	= false;
		resobj.message	= 'could not get role(' + role + ') in tenant(' + tenant + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check policies
	var	access_result = null;
	for(var cnt = 0; cnt < roledata[keys.VALUE_POLICIES_TYPE].length; ++cnt){
		// check each policy has read access
		access_result = rawCheckPolicies(dkcobj_permanent, roledata[keys.VALUE_POLICIES_TYPE][cnt], resyrn, keys.ACTION_READ_KEY, access_result);
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		resobj.result	= false;
		resobj.message	= 'role(' + role + ') in tenant(' + tenant + ') does not allow to read access to resource(' + resyrn + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// call common function(expand is true)
	var	res_result = rawGetResourceEx(dkcobj_permanent, tenant, service, resyrn, true);
	if(!res_result.result){
		return res_result;
	}

	// make result
	if(keys.VALUE_STRING_TYPE === type){
		if(!apiutil.isSafeEntity(res_result.resource) || !apiutil.isSafeEntity(res_result.resource[keys.VALUE_STRING_TYPE])){
			resobj.result	= false;
			resobj.message	= 'resource(' + resyrn + ') by role(' + role + ') in tenant(' + tenant + ') does not have value for type(' + type + ') data.';
		}else{
			resobj.resource = res_result.resource[keys.VALUE_STRING_TYPE];
		}
	}else if(keys.VALUE_OBJECT_TYPE === type){
		if(!apiutil.isSafeEntity(res_result.resource) || !apiutil.isSafeEntity(res_result.resource[keys.VALUE_OBJECT_TYPE])){
			resobj.result	= false;
			resobj.message	= 'resource(' + resyrn + ') by role(' + role + ') in tenant(' + tenant + ') does not have value for type(' + type + ') data.';
		}else{
			resobj.resource = res_result.resource[keys.VALUE_OBJECT_TYPE];
		}
	}else{	// keys.VALUE_KEYS_TYPE === type
		// [NOTE]
		// This function does not return expire key (keys.VALUE_EXPIRE_TYPE).
		// The expire key could not be got from another functions.
		//
		if(!apiutil.isSafeEntity(res_result.resource) || !apiutil.isSafeEntity(res_result.resource[keys.VALUE_KEYS_TYPE]) || !apiutil.isSafeEntity(res_result.resource[keys.VALUE_KEYS_TYPE][keyname])){
			resobj.resource = null;
			resobj.result	= false;
			resobj.message	= 'resource(' + resyrn + ') by role(' + role + ') in tenant(' + tenant + ') does not have value for type(' + type + '[' + keyname + ']) data.';
		}else{
			resobj.resource = res_result.resource[keys.VALUE_KEYS_TYPE][keyname];
		}
	}
	return resobj;
}

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
function rawGetResourceByRole(roleyrn, resyrn, type, keyname)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(roleyrn, resyrn)){											// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : roleyrn=' + JSON.stringify(roleyrn) + ', resyrn=' + JSON.stringify(resyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}

	// parse role yrn to role name and tenant name
	var	keys			= r3keys();															// temporary
	var	servicename		= null;
	var	tenantname		= null;
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		servicename	= rolematches[1];
	}
	tenantname	= rolematches[2];															// not use
	rolename	= rolematches[3];

	// call common function
	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	resobj		= rawGetResourceByRoleWithDkc(dkcobj, rolename, tenantname, servicename, resyrn, type, keyname);
	dkcobj.clean();
	return resobj;
}

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
function rawGetResourceByIP(ip, port, cuk, roleyrn, resyrn, type, keyname)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(ip, roleyrn, resyrn) || isNaN(port)){							// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resyrn=' + JSON.stringify(resyrn);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	keys				= r3keys();
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
	var	tenantname		= null;
	var	servicename		= null;
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		servicename	= rolematches[1];
	}
	tenantname		= rolematches[2];
	rolename		= rolematches[3];

	// check host
	var	host_info = rawFindRoleHost(dkcobj, roleyrn, null, ip, port, cuk, false);			// not strictly check
	if(apiutil.isEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + ip + ':' + String(port) + ') is not role(' + roleyrn + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj = rawGetResourceByRoleWithDkc(dkcobj, rolename, tenantname, servicename, resyrn, type, keyname);

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Common remove resource raw function
//---------------------------------------------------------
// tenant				:	tenant name for resource
// service				:	service name
// resource				:	resource name
// type					:	target resource data type
//							all(=null or undefined), "anytype"(=any type data), "string"(=only string data),
//							"object"(=only object data), "keys"(=key), "aliases"(=aliases), "expire"(=expire)
// keynames				:	if type is "keys", this value is null(=all), keyname string, keyname array.
// aliases				:	if type is "aliases", this value is null(=all), alias string, alias array.
//
function rawRemoveResourceEx(dkcobj_permanent, tenant, service, resource, type, keynames, aliases)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	// check main parameters
	if(!apiutil.isSafeStrings(tenant, resource)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource));
		return false;
	}
	// check other parameters
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}
	var	keys	= r3keys(null, tenant, service);											// for check parameter

	if(!apiutil.isSafeString(type)){
		type = null;
	}else if(	!apiutil.compareCaseString(type, keys.VALUE_ANYDATA_TYPE)	&&
				!apiutil.compareCaseString(type, keys.VALUE_STRING_TYPE)	&&
				!apiutil.compareCaseString(type, keys.VALUE_OBJECT_TYPE)	&&
				!apiutil.compareCaseString(type, keys.VALUE_KEYS_TYPE)		&&
				!apiutil.compareCaseString(type, keys.VALUE_ALIAS_TYPE)		&&
				!apiutil.compareCaseString(type, keys.VALUE_EXPIRE_TYPE)	)
	{
		r3logger.elog('type(' + JSON.stringify(type) + ') parameter is wrong.');
		return false;
	}
	if(keys.VALUE_KEYS_TYPE === type){
		if(apiutil.isSafeEntity(keynames)){
			if(apiutil.isSafeString(keynames)){
				keynames = [keynames];
			}else if(!apiutil.isArray(keynames)){
				r3logger.elog('keynames(' + JSON.stringify(keynames) + ') parameter is wrong.');
				return false;
			}else if(apiutil.isEmptyArray(keynames)){
				keynames = null;
			}
		}else{
			keynames = null;
		}
	}
	if(keys.VALUE_ALIAS_TYPE === type){
		if(apiutil.isSafeEntity(aliases)){
			if(apiutil.isSafeString(aliases)){
				aliases = [aliases];
			}else if(!apiutil.isArray(aliases)){
				r3logger.elog('aliases(' + JSON.stringify(aliases) + ') parameter is wrong.');
				return false;
			}else if(apiutil.isEmptyArray(aliases)){
				aliases = null;
			}
		}else{
			aliases = null;
		}
	}

	var	value;
	var	subkeylist;
	var	cnt;
	var	_result;

	//
	// keys
	//
	var	resource_key		= keys.RESOURCE_TOP_KEY + ':' + resource;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
	var	type_key			= resource_key + '/' + keys.TYPE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type"
	var	reference_key		= resource_key + '/' + keys.REFERENCE_KW;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference"
	var	reskeys_key			= resource_key + '/' + keys.KEYS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys"
	var	alias_key			= resource_key + '/' + keys.ALIAS_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@"
	var	expire_key			= resource_key + '/' + keys.EXPIRE_KW;							// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire"

	// do remove
	if(null === type){
		// remove resource key(all)

		// check reference key
		value = dkcobj_permanent.casGet(reference_key);
		if(!isNaN(value) && 0 < value){
			r3logger.elog('could not remove ' + reference_key + 'key which is reference number(' + value + ')');
			return false;
		}

		// check alias key and decrement resource reference in alias's list.
		value = dkcobj_permanent.getValue(alias_key, null, true, null);
		value = apiutil.parseJSON(value);
		if(!apiutil.isEmptyArray(value)){
			for(cnt = 0; cnt < value.length; ++cnt){
				var	tmpres = rawIncDecReferenceCount(dkcobj_permanent, value[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in resource(' + value[cnt] + ') included from resource alias(' + alias_key + '), but continue...');
				}
			}
		}

		// remove subkeys(type/reference/keys/@) from resource key
		subkeylist	= dkcobj_permanent.getSubkeys(resource_key, true);
		if(apiutil.removeStringFromArray(subkeylist, type_key)){
			if(!dkcobj_permanent.remove(type_key, false)){									// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type
				r3logger.dlog('could not remove ' + type_key + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, reference_key)){
			if(!dkcobj_permanent.remove(reference_key, false)){								// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/reference
				r3logger.dlog('could not remove ' + reference_key + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, reskeys_key)){
			if(!dkcobj_permanent.remove(reskeys_key, false)){								// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys
				r3logger.dlog('could not remove ' + reskeys_key + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, alias_key)){
			if(!dkcobj_permanent.remove(alias_key, false)){									// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
				r3logger.dlog('could not remove ' + alias_key + ' key');
			}
		}
		if(apiutil.removeStringFromArray(subkeylist, expire_key)){
			if(!dkcobj_permanent.remove(expire_key, false)){								// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire
				r3logger.dlog('could not remove ' + expire_key + ' key');
			}
		}

		// check rest subkeys
		if(!apiutil.isEmptyArray(subkeylist)){
			// this resource has sub resources, so do not remove this resource
			//
			// remove resource key at first, because resource key has value.
			// we need to remove value anyway.
			// if need subkey list, we make subkey after that.
			//
			_result = true;
			if(!dkcobj_permanent.remove(resource_key, false)){								// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
				_result = false;
				r3logger.elog('could not remove ' + resource_key + 'key, but we need to update subkeys. so returns error after that.');
			}
			// there is rest subkeys and need to update it
			if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){						// update subkeys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
				_result = false;
				r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + resource_key + ' key');
			}
			if(!_result){
				return false;
			}
		}else{
			// this resource does not have sub resources, so can remove this resource
			var	direct_parent = apiutil.getParentPath(resource);
			if(apiutil.isSafeString(direct_parent)){
				direct_parent = ':' + direct_parent;
			}else{
				direct_parent = '';
			}
			// remove resource key from direct resource parent key's subkey
			var	direct_parent_key	= keys.RESOURCE_TOP_KEY + direct_parent;				// parent key -> "yrn:yahoo:<service>::<tenant>:resource{:<parent resource>}"
			subkeylist				= dkcobj_permanent.getSubkeys(direct_parent_key, true);
			if(apiutil.removeStringFromArray(subkeylist, resource_key)){
				if(!dkcobj_permanent.setSubkeys(direct_parent_key, subkeylist)){			// update parent subkey -> yrn:yahoo:<service>::<tenant>:resource{:<parent resource>}
					r3logger.elog('could not update subkey under ' + direct_parent_key + ' key');
					return false;
				}
			}
			// remove resource key
			if(!dkcobj_permanent.remove(resource_key, false)){								// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
				r3logger.elog('could not remove ' + resource_key + ' key');
				return false;
			}
		}

	}else{
		// not remove all resource

		// remove data in resource(without all type)
		if((keys.VALUE_ANYDATA_TYPE === type || keys.VALUE_STRING_TYPE === type || keys.VALUE_OBJECT_TYPE === type)){
			var	is_data_updated	= false;
			if(keys.VALUE_ANYDATA_TYPE === type){
				// both data type ---> always remove data
				is_data_updated = true;
			}else{
				value = dkcobj_permanent.getValue(type_key, null, true, null);
				if(apiutil.getSafeString(value) === type){
					// same type
					is_data_updated = true;
				}else{
					// data type is not same
					r3logger.wlog('data type(' + apiutil.getSafeString(value) + ') is not same request type(' + type + '), skip removing.');
				}
			}
			if(is_data_updated){
				// remove --> initialize data if it is any data type
				if(!dkcobj_permanent.setValue(type_key, keys.VALUE_STRING_TYPE)){			// set value "string" -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type
					r3logger.elog('could not set ' + keys.VALUE_STRING_TYPE + ' value to ' + type_key + ' key');
					return false;
				}
				if(!dkcobj_permanent.setValue(resource_key, '')){							// set value '' -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
					r3logger.elog('could not set \'\' value to ' + resource_key + ' key');
					return false;
				}
			}
		}

		// remove keys in resource
		if(keys.VALUE_KEYS_TYPE === type){
			// get keys value
			value = dkcobj_permanent.getValue(reskeys_key, null, true, null);
			value = apiutil.parseJSON(value);

			// remove keynames(or all) from value
			var	is_keys_updated	= false;
			if(apiutil.isSafeEntity(value) && 0 < Object.keys(value).length){
				if(null === keynames){
					// remove all keys
					value			= {};
					is_keys_updated	= true;
				}else if(!apiutil.isEmptyArray(keynames)){
					for(cnt = 0; cnt < keynames.length; ++cnt){
						if(apiutil.isSafeEntity(value[keynames[cnt]])){
							delete value[keynames[cnt]];
							is_keys_updated	= true;
						}
					}
				}
			}
			// update value
			if(is_keys_updated){
				if(!dkcobj_permanent.setValue(reskeys_key, JSON.stringify(value))){			// update value keys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys
					r3logger.elog('could not set ' + JSON.stringify(value) + ' value to ' + reskeys_key + ' key');
					return false;
				}
			}
		}

		// remove aliases in resource
		if(keys.VALUE_ALIAS_TYPE === type){
			// get aliases value
			value = dkcobj_permanent.getValue(alias_key, null, true, null);
			value = apiutil.parseJSON(value);

			// remove aliases(or all) from value
			var	is_aliases_updated	= false;
			var	removing_aliases	= new Array(0);
			if(!apiutil.isEmptyArray(value)){
				if(null === aliases){
					// remove all aliases
					for(cnt = 0; cnt < value.length; ++cnt){
						removing_aliases.push(value[cnt]);
					}
					value				= new Array(0);
					is_aliases_updated	= true;
				}else if(!apiutil.isEmptyArray(aliases)){
					for(cnt = 0; cnt < aliases.length; ++cnt){
						if(apiutil.removeStringFromArray(value, aliases[cnt])){
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
				_result = true;
				// decrement reference for each removed alias keys 
				for(cnt = 0; cnt < removing_aliases.length; ++cnt){
					var	dec_result = rawIncDecReferenceCount(dkcobj_permanent, removing_aliases[cnt], false);
					if(!dec_result.result){
						_result	= false;
						r3logger.elog('Failed to decrement reference in resource(' + value[cnt] + ') included from resource(' + resource_key + ') by ' + dec_result.message + ', but continue...');
					}
				}
				if(apiutil.isEmptyArray(value)){
					// there is no lest alias key, so remove alias key
					if(!dkcobj_permanent.remove(alias_key, false)){							// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
						_result	= false;
						r3logger.elog('could not remove ' + alias_key + ' key');
					}
					// remove aliases key from resource key
					subkeylist	= dkcobj_permanent.getSubkeys(resource_key, true);
					if(apiutil.removeStringFromArray(subkeylist, alias_key)){
						if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){			// update subkeys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
							_result	= false;
							r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + resource_key + ' key');
						}
					}
				}else{
					// update aliases
					if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(value))){		// update value aliases -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@
						_result	= false;
						r3logger.elog('could not set ' + JSON.stringify(value) + ' value to ' + alias_key + ' key');
					}
				}
				if(!_result){
					// error, delayed
					return false;
				}
			}
		}

		// remove expire in resource
		if(keys.VALUE_EXPIRE_TYPE === type){
			// remove expire key
			if(!dkcobj_permanent.remove(expire_key, false)){								// remove yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/expire
				r3logger.elog('could not remove ' + expire_key + ' key');
				return false;
			}
			// remove expire key from resource key
			subkeylist	= dkcobj_permanent.getSubkeys(resource_key, true);
			if(apiutil.removeStringFromArray(subkeylist, expire_key)){
				if(!dkcobj_permanent.setSubkeys(resource_key, subkeylist)){					// update subkeys -> yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}
					r3logger.elog('could not set ' + JSON.stringify(subkeylist) + ' subkeys under ' + resource_key + ' key');
					return false;
				}
			}
		}
	}
	return true;
}

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
function rawRemoveResourceByUser(user, tenant, resource, type, keynames, aliases)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant, resource)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);		// use permanent object(need to clean)
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
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to access resource(' + resource + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	if(!rawRemoveResourceEx(dkcobj, tenant, null, resource, type, keynames, aliases)){
		resobj.result	= false;
		resobj.message	= 'could not remove resource(' + resource + ') with type=(' + JSON.stringify(type) + '), keynames=(' + JSON.stringify(keynames) + '), aliases=(' + JSON.stringify(aliases) + ') for user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
	}

	dkcobj.clean();
	return resobj;
}

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
function rawRemoveResourceByRoleWithDkc(dkcobj_permanent, role, tenant, resource, type, keynames)
{
	var	resobj = {result: true, message: null};

	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeStrings(role, tenant, resource)){										// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check type parameters
	var	keys = r3keys(null, tenant, null);													// for check parameter
	if(!apiutil.isSafeString(type) || (!apiutil.compareCaseString(type, keys.VALUE_ANYDATA_TYPE) && !apiutil.compareCaseString(type, keys.VALUE_STRING_TYPE) && !apiutil.compareCaseString(type, keys.VALUE_OBJECT_TYPE) && !apiutil.compareCaseString(type, keys.VALUE_KEYS_TYPE))){
		resobj.result	= false;
		resobj.message	= 'type(' + JSON.stringify(type) + ') parameter is wrong. when removing resource by role, type must be only anydata/string/object.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	role_key			= keys.ROLE_TOP_KEY + ':' + role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"
	var	resource_key		= keys.RESOURCE_TOP_KEY + ':' + resource;						// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	var	roledata						= {};
	roledata[keys.VALUE_POLICIES_TYPE]	= [];
	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true) || apiutil.isEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		resobj.result	= false;
		resobj.message	= 'could not get role(' + role + ') in tenant(' + tenant + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check policies
	var	access_result = null;
	for(var cnt = 0; cnt < roledata[keys.VALUE_POLICIES_TYPE].length; ++cnt){
		// check each policy has write access
		access_result = rawCheckPolicies(dkcobj_permanent, roledata[keys.VALUE_POLICIES_TYPE][cnt], resource_key, keys.ACTION_WRITE_KEY, access_result);
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		resobj.result	= false;
		resobj.message	= 'role(' + role + ') in tenant(' + tenant + ') does not allow to write access to resource(' + resource + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// call common function(expand is true)
	if(!rawRemoveResourceEx(dkcobj_permanent, tenant, null, resource, type, keynames, null)){
		resobj.result	= false;
		resobj.message	= 'could not remove resource(' + resource + ') with type=(' + JSON.stringify(type) + '), keynames=(' + JSON.stringify(keynames) + ') for role=' + JSON.stringify(role) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
	}
	return resobj;
}

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
function rawRemoveResourceByRole(role, tenant, resource, type, keynames)
{
	var	resobj = {result: true, message: null};

	// parse role yrn to role name and tenant name
	var	keys			= r3keys(null, tenant, null);
	var	tenantname		= null;																// eslint-disable-line no-unused-vars
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= role.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + role + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(tenant !== rolematches[2] || apiutil.isSafeString(rolematches[1])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + role + ') is not tenant(' + tenant + ') role.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	tenantname	= rolematches[2];															// eslint-disable-line no-unused-vars
	rolename	= rolematches[3];

	// call common function
	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	resobj		= rawRemoveResourceByRoleWithDkc(dkcobj, rolename, tenant, resource, type, keynames);

	dkcobj.clean();
	return resobj;
}

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
function rawRemoveResourceByIP(ip, port, cuk, roleyrn, resource, type, keynames)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(ip, roleyrn, resource) || isNaN(port)){						// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	keys				= r3keys();
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
	var	tenantname		= null;
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is under service path, it must not be removed directly.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	tenantname	= rolematches[2];
	rolename	= rolematches[3];

	// check host
	var	host_info = rawFindRoleHost(dkcobj, roleyrn, null, ip, port, cuk, false);			// not strictly check
	if(apiutil.isEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + ip + ':' + String(port) + ') is not role(' + roleyrn + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj = rawRemoveResourceByRoleWithDkc(dkcobj, rolename, tenantname, resource, type, keynames);
	dkcobj.clean();
	return resobj;
}

//
// raw function for removing resource under service and tenant
//
// tenant				:	tenant name for resource
// service				:	service name
// resource				:	resource name
//
function rawRemoveServiceTenantResource(dkcobj_permanent, tenant, service, resource)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenant, service, resource)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service) + ', resource=' + JSON.stringify(resource));
		return false;
	}

	// call common function
	if(!rawRemoveResourceEx(dkcobj_permanent, tenant, service, resource, null)){
		r3logger.elog('could not remove resource(' + resource + ') for service=' + service + ',  tenant=' + tenant);
		return false;
	}
	return true;
}

//
// raw function for removing all resources under service and tenant
//
// tenant				:	tenant name for resource
// service				:	service name
// resource				:	resource name
//
function rawRemoveServiceTenantAllResource(dkcobj_permanent, tenant, service)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenant, service)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return false;
	}

	var	keys			= r3keys(null, tenant, service);
	var	subkeylist;

	//
	// Get resource key list
	//
	subkeylist	= dkcobj_permanent.getSubkeys(keys.RESOURCE_TOP_KEY, true);				// get subkey list from yrn:yahoo:<service>::<tenant>:resource:*
	if(apiutil.isEmptyArray(subkeylist)){
		// there is no resource.
		return true;
	}

	var	ptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);						// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	var	matches;
	for(var cnt = 0; cnt < subkeylist.length; ++cnt){
		// check resource name and path
		matches	= subkeylist[cnt].match(ptn);
		if(apiutil.isEmptyArray(matches) || matches.length < 4 || !apiutil.isSafeString(matches[1]) || !apiutil.isSafeString(matches[2]) || !apiutil.isSafeString(matches[3])){
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
}

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
// type			:	null(all) / "string" / "object" / "keys"
// keyname		:	Key name in "keys" when type is "keys"
//
// result		:	null	=> resource does not have target
//					true	=> resource has target and allows target action
//					false	=> resource has target and does not allow target action
//
function rawCheckResources(dkcobj_permanent, resource, is_parent, type, keyname, summary_result, checked_resources, base_resource_top)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return summary_result;																// return initial result(not modify)
	}
	if(!apiutil.isSafeString(resource)){
		r3logger.elog('some parameters are wrong : resource=' + JSON.stringify(resource));
		return summary_result;																// return initial result(not modify)
	}
	if(!apiutil.isArray(checked_resources)){
		checked_resources = new Array(0);
	}
	if(apiutil.findStringInArray(checked_resources, resource)){
		r3logger.wlog('resource(' + resource + ') already checked, then this policy is included from another resource. Thus skip this for escaping blocking.');
		return summary_result;
	}else{
		checked_resources.push(resource);
	}
	if('boolean' !== typeof summary_result){
		summary_result	= false;															// for default
	}
	if(true === summary_result){
		// If already found target resource, we stop to search resource.
		// This will save waste of time.
		return summary_result;
	}
	if('boolean' !== typeof is_parent){
		is_parent		= true;
	}

	var	keys = rawGetKeysFromResourceKey(null, resource);									// create keys from resource key
	if(!apiutil.isSafeString(type)){
		type = null;																		// = all
	}else if(!apiutil.compareCaseString(keys.VALUE_STRING_TYPE, type) && !apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, type) && !apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, type)){
		r3logger.elog('type(' + JSON.stringify(type) + ') parameter is wrong, so skip this.');
		return summary_result;
	}
	if(apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, type) && !apiutil.isSafeString(keyname)){
		r3logger.elog('keyname(' + JSON.stringify(keyname) + ') parameter with type(' + JSON.stringify(type) + ') parameter is wrong');
		return summary_result;
	}
	if(!apiutil.isSafeString(base_resource_top)){
		base_resource_top	= keys.RESOURCE_TOP_KEY;										// resource top key
	}

	var	value;
	var	cnt;

	//
	// keys
	//
	var	parent_key			= apiutil.getParentPath(resource);								// parent resource key
	var	type_key			= resource + '/' + keys.TYPE_KW;								// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/type"
	var	reskeys_key			= resource + '/' + keys.KEYS_KW;								// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/keys"
	var	alias_key			= resource + '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}/@"

	// check parent
	if(is_parent && apiutil.isSafeString(base_resource_top) && apiutil.isSafeString(parent_key) && 0 === resource.indexOf(base_resource_top) && keys.RESOURCE_TOP_KEY != parent_key){
		var	parent_result	= rawCheckResources(dkcobj_permanent, parent_key, is_parent, type, keyname, summary_result, checked_resources, base_resource_top);
		summary_result		= (summary_result || parent_result ? true : false);
	}
	if(summary_result){
		return summary_result;																// found(for saving waste of time)
	}

	// check resource under aliases
	value = dkcobj_permanent.getValue(alias_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(!apiutil.isEmptyArray(value)){
		for(cnt = 0; cnt < value.length; ++cnt){
			// check alias resource keys(do not check parent for aliases)
			var	alias_result	= rawCheckResources(dkcobj_permanent, value[cnt], false, type, keyname, summary_result, checked_resources, base_resource_top);
			summary_result		= (summary_result || alias_result ? true : false);
			if(summary_result){
				return summary_result;														// found(for saving waste of time)
			}
		}
	}

	// get value for this resource(type is not "keys")
	if(keys.VALUE_KEYS_TYPE !== type){
		value = dkcobj_permanent.getValue(resource, null, true, null);
		if(apiutil.isSafeEntity(value)){
			// get data type
			value = dkcobj_permanent.getValue(type_key, null, true, null);
			if(apiutil.isSafeString(value) && value === type){
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
	if(null === type || keys.VALUE_KEYS_TYPE === type){
		value = dkcobj_permanent.getValue(reskeys_key, null, true, null);
		value = apiutil.parseJSON(value);
		if(apiutil.isSafeEntity(value)){
			// has keys data
			if(keys.VALUE_KEYS_TYPE !== type){
				summary_result	= true;
			}else if(apiutil.isSafeEntity(value[keyname])){
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
}

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
function rawCheckResourceByUser(user, tenant, service, resource_name, type, keyname)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant, resource_name)){								// check other parameter in sub function
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
	var	keys			= r3keys(user, tenant, service);
	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	resource_key	= keys.RESOURCE_TOP_KEY + ':' + resource_name;					// "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
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
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to access resource(' + resource_name + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj.result	= rawCheckResources(dkcobj, resource_key, true, type, keyname);
	dkcobj.clean();
	return resobj;
}

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
function rawCheckResourceByRoleWithDkc(dkcobj_permanent, role, tenant, service, resource, type, keyname)
{
	var	resobj = {result: true, message: null};

	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeStrings(role, tenant, resource)){										// other argument is checked in common function
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

	var	keys				= r3keys(null, tenant, service);
	var	role_key			= keys.ROLE_TOP_KEY + ':' + role;								// "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>{...}}"

	//----------------------------------------------
	// check resource and make resource yrn path
	//----------------------------------------------
	var	resource_key		= resource;														// resource name or yrn path
	var	resourceyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);				// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	var	resourcematches		= resource_key.match(resourceyrnptn);
	if(apiutil.isEmptyArray(resourcematches) || resourcematches.length < 4){
		// resource is not full yrn to resource
		resource_key		= keys.RESOURCE_TOP_KEY + ':' + resource;						// resource name to yrn path "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
	}

	//----------------------------------------------
	// check role is allowed to accessing resource.
	//----------------------------------------------
	// get role data
	var	roledata						= {};
	roledata[keys.VALUE_POLICIES_TYPE]	= [];
	if(!rawGetRoles(dkcobj_permanent, role_key, roledata, true) || apiutil.isEmptyArray(roledata[keys.VALUE_POLICIES_TYPE])){	// get expand role data
		resobj.result	= false;
		resobj.message	= 'could not get role(' + role + ') in tenant(' + tenant + ') policy data.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check policies
	var	access_result = null;
	for(var cnt = 0; cnt < roledata[keys.VALUE_POLICIES_TYPE].length; ++cnt){
		// check each policy has write access
		access_result = rawCheckPolicies(dkcobj_permanent, roledata[keys.VALUE_POLICIES_TYPE][cnt], resource_key, keys.ACTION_READ_KEY, access_result);
	}
	if(null === access_result || false === access_result){									// could not decide result in policy, so it is deny.
		resobj.result	= false;
		resobj.message	= 'role(' + role + ') in tenant(' + tenant + ') does not allow to read access to resource(' + resource + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// call common function
	resobj.result = rawCheckResources(dkcobj_permanent, resource_key, true, type, keyname);
	return resobj;
}

//
// First raw function for checking resource by role
//
// roleyrn					:	role by yrn full path for accessing resource(path should not include service)
// tenant				:	tenant name for resource
// resource_name		:	resource name or resource yrn path
//
// [NOTE]
// This function is for checking resource by role, and call common function for it.
// roleyrn is full yrn, and it assumes a path that does not include service.
// If it is a path containing service it will be an error.
//
function rawCheckResourceByRole(roleyrn, tenant, resource, type, keyname)
{
	var	resobj = {result: true, message: null};

	// parse role yrn to role name and tenant name
	var	keys			= r3keys(null, tenant, null);
	var	tenantname		= null;																// eslint-disable-line no-unused-vars
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(tenant !== rolematches[2] || apiutil.isSafeString(rolematches[1])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not tenant(' + tenant + ') role.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	tenantname	= rolematches[2];															// eslint-disable-line no-unused-vars
	rolename	= rolematches[3];

	// call common function
	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);							// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	resobj		= rawCheckResourceByRoleWithDkc(dkcobj, rolename, tenant, null, resource, type, keyname);

	dkcobj.clean();
	return resobj;
}

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
function rawCheckResourceByIP(ip, port, cuk, roleyrn, resource, type, keyname)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(ip, roleyrn, resource) || isNaN(port)){						// other argument is checked in common function
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : ip=' + JSON.stringify(ip) + ', port=' + JSON.stringify(port) + ', roleyrn=' + JSON.stringify(roleyrn) + ', resource=' + JSON.stringify(resource);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	keys				= r3keys();
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
	var	tenantname		= null;
	var	servicename		= null;
	var	rolename		= null;
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);						// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	rolematches		= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(rolematches) || rolematches.length < 4 || !apiutil.isSafeString(rolematches[2]) || !apiutil.isSafeString(rolematches[3])){
		resobj.result	= false;
		resobj.message	= 'role yrn(' + roleyrn + ') is not full yrn, or wrong role yrn.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(apiutil.isSafeString(rolematches[1])){
		servicename	= rolematches[1];
	}
	tenantname	= rolematches[2];
	rolename	= rolematches[3];

	// check host
	var	host_info = rawFindRoleHost(dkcobj, roleyrn, null, ip, port, cuk, false);			// not strictly check
	if(apiutil.isEmptyArray(host_info)){
		resobj.result	= false;
		resobj.message	= 'ip:port(' + ip + ':' + String(port) + ') is not role(' + roleyrn + ') member.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// call common function
	resobj = rawCheckResourceByRoleWithDkc(dkcobj, rolename, tenantname, servicename, resource, type, keyname);
	dkcobj.clean();
	return resobj;
}

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
function rawCreatePolicyEx(dkcobj_permanent, user, tenant, service, policy, effect, action, resource, condition, alias_policy)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
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
	var	keys		= r3keys(user, tenant, service);
	var	is_effect	= false;
	var	is_action	= false;
	var	is_resource	= false;
	var	is_condition= false;
	var	is_alias	= false;
	var	cnt;

	if(null !== service){
		// service is specified
		//
		// [NOTE]
		// In this case, specifying something other than the resource parameter results in an error.
		//
		if(apiutil.isSafeEntity(effect) && ('boolean' !== typeof effect || false === effect)){
			// effect allows undefined/null/true
			r3logger.elog('parameter effect is wrong(must be undefined, null, true) : effect=' + JSON.stringify(effect));
			return false;
		}
		if(apiutil.isSafeEntity(action)){
			// action allows undefined/null/'read'/['read']
			if(	(apiutil.isArray(action) && (1 !== action.length || !apiutil.isSafeString(action[1]) || keys.ACTION_READ_KEY !== action[1].toLowerCase())) ||
				(apiutil.isSafeString(action) && keys.ACTION_READ_KEY !== action.toLowerCase()) )
			{
				r3logger.elog('parameter action is wrong(must be undefined, null, ' + keys.ACTION_READ_KEY + ') : action=' + JSON.stringify(action));
				return false;
			}
		}
		if(apiutil.isSafeEntity(condition) && (!apiutil.isArray(condition) || !apiutil.isEmptyArray(condition))){
			// condition allows undefined/null/[]
			r3logger.elog('parameter condition is wrong(must be undefined, null) : condition=' + JSON.stringify(condition));
			return false;
		}
		if(apiutil.isSafeEntity(alias_policy) && (!apiutil.isArray(alias_policy) || !apiutil.isEmptyArray(alias_policy))){
			// alias allows undefined/null/[]
			r3logger.elog('parameter alias is wrong(must be undefined, null) : alias_policy=' + JSON.stringify(alias_policy));
			return false;
		}
		is_effect	= true;
		is_action	= true;
		is_condition= false;
		is_alias	= false;

		policy		= keys.ACR_POLICY_KW;													// policy name is 'arc-policy'
		effect		= keys.VALUE_ALLOW;
		action		= [keys.ACTION_READ_KEY];
		condition	= new Array(0);															// default value if need to create key
		alias_policy= new Array(0);

	}else{
		// service is NOT specified
		//
		if(!apiutil.isSafeString(policy)){
			r3logger.elog('parameter policy is wrong : policy=' + JSON.stringify(policy));
			return false;
		}
		// policy name is not allowed including '/' word.
		if(-1 !== policy.indexOf('/')){
			r3logger.elog('policy parameters includes / word : policy=' + policy);
			return false;
		}

		if('boolean' === typeof effect){
			is_effect	= true;
			effect		= effect ? keys.VALUE_ALLOW : keys.VALUE_DENY;
		}else if(!apiutil.isSafeEntity(effect)){
			is_effect	= false;
			effect		= keys.VALUE_DENY;													// default value if need to create key
		}else{
			r3logger.elog('parameter effect is wrong : effect=' + JSON.stringify(effect));
			return false;
		}
		if(action instanceof Array){
			is_action	= true;
		}else if(apiutil.isSafeString(action)){
			action		= [action];
			is_action	= true;
		}else if(!apiutil.isSafeEntity(action)){
			action		= new Array(0);														// default value if need to create key
			is_action	= false;
		}else if('' === action){
			action		= new Array(0);
			is_action	= true;
		}else{
			r3logger.elog('parameter action is wrong : action=' + JSON.stringify(action));
			return false;
		}
		if(condition instanceof Array){
			is_condition= true;
		}else if(apiutil.isSafeString(condition)){
			condition	= [condition];
			is_condition= true;
		}else if(!apiutil.isSafeEntity(condition)){
			condition	= new Array(0);														// default value if need to create key
			is_condition= false;
		}else if('' === condition){
			condition	= new Array(0);
			is_condition= true;
		}else{
			r3logger.elog('parameter condition is wrong : condition=' + JSON.stringify(condition));
			return false;
		}
		if(alias_policy instanceof Array){
			is_alias	= true;
		}else if(!apiutil.isSafeEntity(alias_policy)){
			is_alias	= false;
		}else if('' === alias_policy){
			alias_policy= new Array(0);
			is_alias	= true;
		}else{
			r3logger.elog('parameter alias_policy is wrong : alias_policy=' + JSON.stringify(alias_policy));
			return false;
		}
	}

	// check resource parameter(common check for both case)
	if(resource instanceof Array){
		is_resource	= true;
	}else if(apiutil.isSafeString(resource)){
		resource	= [resource];
		is_resource = true;
	}else if(!apiutil.isSafeEntity(resource)){
		resource	= new Array(0);															// default value if need to create key
		is_resource = false;
	}else if('' === resource){
		is_resource	= true;
	}else{
		r3logger.elog('parameter resource is wrong : resource=' + JSON.stringify(resource));
		return false;
	}

	var	subkeylist;
	var	value;
	var	tmpres;
	var	delarr;
	var	addarr;
	var	need_update			= false;

	//
	// keys
	//
	var	policy_key			= keys.POLICY_TOP_KEY + ':' + policy;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>"
	var	effect_key			= policy_key + '/' + keys.EFFECT_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
	var	action_key			= policy_key + '/' + keys.ACTION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
	var	resource_key		= policy_key + '/' + keys.RESOURCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
	var	condition_key		= policy_key + '/' + keys.CONDITION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/condition"
	var	reference_key		= policy_key + '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/reference"
	var	alias_key			= policy_key + '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"

	// add policy key into policy top key's subkey
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(keys.POLICY_TOP_KEY, true));
	if(apiutil.tryAddStringToArray(subkeylist, policy_key)){
		if(!dkcobj_permanent.setSubkeys(keys.POLICY_TOP_KEY, subkeylist)){					// add subkey yrn:yahoo:<service>::<tenant>:policy:<policy> -> yrn:yahoo:<service>::<tenant>:policy
			r3logger.elog('could not add ' + policy_key + ' subkey under ' + keys.POLICY_TOP_KEY + ' key');
			return false;
		}
	}

	// check policy/action/resource/condition/alias key
	subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(policy_key, true));
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
	if(is_alias && 0 < alias_policy.length && apiutil.tryAddStringToArray(subkeylist, alias_key)){	// Make alias key in subkey list only when new alias exists
		need_update	= true;
	}
	if(need_update){
		if(!dkcobj_permanent.setSubkeys(policy_key, subkeylist)){							// add subkey yrn:yahoo:<service>::<tenant>:policy:<policy>/{effect, action, resource, condition} -> yrn:yahoo:<service>::<tenant>:policy:<policy>
			r3logger.elog('could not add ' + policy_key + '/* subkeys under ' + policy_key + ' key');
			return false;
		}
	}

	// effect key
	value = dkcobj_permanent.getValue(effect_key, null, true, null);
	if((is_effect && effect !== value) || (!is_effect && (null === value || undefined === value))){
		if(!dkcobj_permanent.setValue(effect_key, effect)){									// update value effect -> yrn:yahoo:<service>::<tenant>:policy:<policy>/effect
			r3logger.elog('could not set ' + effect + ' value to ' + effect_key + ' key');
			return false;
		}
	}

	// action key
	value = dkcobj_permanent.getValue(action_key, null, true, null);
	value = apiutil.parseJSON(value);
	if((is_action && !apiutil.compareArray(value, action)) || (!is_action && (null === value || undefined === value))){
		if(!dkcobj_permanent.setValue(action_key, JSON.stringify(action))){					// update value action -> yrn:yahoo:<service>::<tenant>:policy:<policy>/action
			r3logger.elog('could not set ' + JSON.stringify(action) + ' value to ' + action_key + ' key');
			return false;
		}
	}

	// resource key
	value = dkcobj_permanent.getValue(resource_key, null, true, null);
	value = apiutil.parseJSON(value);
	if((is_resource && !apiutil.compareArray(value, resource)) || (!is_resource && (null === value || undefined === value))){
		// get removing element(resource) & decrement it's reference
		delarr = apiutil.getDeletingDifferenceArray(value, resource);
		for(cnt = 0; cnt < delarr.length; ++cnt){
			tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
			if(!tmpres.result){
				r3logger.wlog('Failed to decrement reference in resource(' + delarr[cnt] + ') included from policy(' + policy_key + '), but continue...');
			}
		}
		// set new resource array
		if(!dkcobj_permanent.setValue(resource_key, JSON.stringify(resource))){				// update value resource -> yrn:yahoo:<service>::<tenant>:policy:<policy>/resource
			r3logger.elog('could not set ' + JSON.stringify(resource) + ' value to ' + resource_key + ' key');
			return false;
		}
		// get adding element(resource) & increment it's reference
		addarr = apiutil.getAddingDifferenceArray(value, resource);
		for(cnt = 0; cnt < addarr.length; ++cnt){
			tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
			if(!tmpres.result){
				r3logger.wlog('Failed to increment reference in resource(' + addarr[cnt] + ') included from policy(' + policy_key + '), but continue...');
			}
		}
	}

	// condition key
	value = dkcobj_permanent.getValue(condition_key, null, true, null);
	value = apiutil.parseJSON(value);
	if((is_condition && !apiutil.compareArray(value, condition)) || (!is_condition && (null === value || undefined === value))){
		if(!dkcobj_permanent.setValue(condition_key, JSON.stringify(condition))){			// update value condition -> yrn:yahoo:<service>::<tenant>:policy:<policy>/condition
			r3logger.elog('could not set ' + JSON.stringify(condition) + ' value to ' + condition_key + ' key');
			return false;
		}
	}
	// reference key
	value = dkcobj_permanent.casGet(reference_key);
	if(null === value || undefined === value){
		if(!dkcobj_permanent.casInit(reference_key, 0)){									// initialize cas value -> yrn:yahoo:<service>::<tenant>:policy:<policy>/reference
			r3logger.elog('could not initialize reference value to ' + reference_key + ' key');
			return false;
		}
	}

	// alias
	value = dkcobj_permanent.getValue(alias_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(is_alias){
		if(0 === alias_policy.length){
			if(null !== value && undefined !== value){
				// if there is alias array, alias policy reference is needed to decrement
				if(!apiutil.isEmptyArray(value)){
					for(cnt = 0; cnt < value.length; ++cnt){
						tmpres = rawIncDecReferenceCount(dkcobj_permanent, value[cnt], false);
						if(!tmpres.result){
							r3logger.wlog('Failed to decrement reference in policy(' + value[cnt] + ') included from policy(' + policy_key + '), but continue...');
						}
					}
				}
				// New aliases is empty, so we removed alias key
				if(!dkcobj_permanent.remove(alias_key, false)){								// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/@
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + policy_key + ' key');
					return false;
				}
			}
			// remove subkey(alias:@) in policy subkey list
			subkeylist	= dkcobj_permanent.getSubkeys(policy_key, true);
			if(apiutil.removeStringFromArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(policy_key, subkeylist)){					// remove subkey yrn:yahoo:<service>::<tenant>:policy:<policy>/@ -> yrn:yahoo:<service>::<tenant>:policy:<policy>
					r3logger.elog('could not remove ' + alias_key + ' subkey under ' + policy_key + ' key');
					return false;
				}
			}
		}else{
			// get removing element(alias policy)
			delarr = apiutil.getDeletingDifferenceArray(value, alias_policy);
			for(cnt = 0; cnt < delarr.length; ++cnt){
				tmpres = rawIncDecReferenceCount(dkcobj_permanent, delarr[cnt], false);
				if(!tmpres.result){
					r3logger.wlog('Failed to decrement reference in policy(' + delarr[cnt] + ') included from policy(' + policy_key + '), but continue...');
				}
			}
			// set new aliases
			if(!dkcobj_permanent.setValue(alias_key, JSON.stringify(alias_policy))){		// update value alias -> yrn:yahoo:<service>::<tenant>:policy:<policy>/@
				r3logger.elog('could not set ' + JSON.stringify(alias_policy) + ' value to ' + alias_key + ' key');
				return false;
			}
			// get adding element(alias policy)
			addarr = apiutil.getAddingDifferenceArray(value, alias_policy);
			for(cnt = 0; cnt < addarr.length; ++cnt){
				tmpres = rawIncDecReferenceCount(dkcobj_permanent, addarr[cnt], true);
				if(!tmpres.result){
					r3logger.wlog('Failed to increment reference in policy(' + addarr[cnt] + ') included from policy(' + policy_key + '), but continue...');
				}
			}
			// add subkey(alias:@) in policy subkey list
			subkeylist	= apiutil.getSafeArray(dkcobj_permanent.getSubkeys(policy_key, true));
			if(apiutil.tryAddStringToArray(subkeylist, alias_key)){
				if(!dkcobj_permanent.setSubkeys(policy_key, subkeylist)){					// add subkey yrn:yahoo:<service>::<tenant>:policy:<policy>/@ -> yrn:yahoo:<service>::<tenant>:policy:<policy>
					r3logger.elog('could not add ' + alias_key + ' subkey under ' + policy_key + ' key');
					return false;
				}
			}
		}
	}
	return true;
}

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
function rawCreatePolicy(user, tenant, policy, effect, action, resource, condition, alias_policy)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant)){
		resobj.result	= false;
		resobj.message	= 'parameters are wrong : user=' + JSON.stringify(user) + ', tenant=' + JSON.stringify(tenant);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
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
}

//---------------------------------------------------------
// create policy(with service) raw function
//---------------------------------------------------------
// tenant				:	tenant name
// service				:	service name
// resource				:	resource key array
//							if this is null, it means not updating resource.
//							if this is '' or array(0), it means clearing resource.
//
function rawCreateServiceTenantPolicy(dkcobj_permanent, tenant, service, resource)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	return rawCreatePolicyEx(dkcobj_permanent, null, tenant, service, null, null, null, resource);
}

//---------------------------------------------------------
// Common remove policy raw function
//---------------------------------------------------------
function rawRemovePolicyEx(dkcobj_permanent, tenant, service, policy)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenant, policy)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', policy=' + JSON.stringify(policy));
		return false;
	}
	if(apiutil.isSafeString(service)){
		service	= service.toLowerCase();
	}else{
		service	= null;
	}
	var	subkeylist;
	var	value;
	var	cnt;
	var	tmpres;

	//
	// keys
	//
	var	keys				= r3keys(null, tenant, service);
	var	policy_key			= keys.POLICY_TOP_KEY + ':' + policy;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>"
	var	effect_key			= policy_key + '/' + keys.EFFECT_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
	var	action_key			= policy_key + '/' + keys.ACTION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
	var	resource_key		= policy_key + '/' + keys.RESOURCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
	var	condition_key		= policy_key + '/' + keys.CONDITION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/condition"
	var	reference_key		= policy_key + '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/reference"
	var	alias_key			= policy_key + '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"

	// check reference key
	value = dkcobj_permanent.casGet(reference_key);
	if(!isNaN(value) && 0 < value){
		r3logger.elog('could not remove ' + reference_key + 'key which is reference number(' + value + ')');
		return false;
	}

	// remove policy key from policy top key's subkey
	subkeylist	= dkcobj_permanent.getSubkeys(keys.POLICY_TOP_KEY, true);
	if(apiutil.removeStringFromArray(subkeylist, policy_key)){
		if(!dkcobj_permanent.setSubkeys(keys.POLICY_TOP_KEY, subkeylist)){					// update subkey -> yrn:yahoo:<service>::<tenant>:policy
			r3logger.elog('could not update subkey under ' + keys.POLICY_TOP_KEY + ' key');
			return false;
		}
	}

	// decrement alias policy's reference
	value = dkcobj_permanent.getValue(alias_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(!apiutil.isEmptyArray(value)){
		for(cnt = 0; cnt < value.length; ++cnt){
			tmpres = rawIncDecReferenceCount(dkcobj_permanent, value[cnt], false);
			if(!tmpres.result){
				r3logger.wlog('Failed to decrement reference in policy(' + value[cnt] + ') included from policy(' + policy_key + '), but continue...');
			}
		}
	}

	// decrement resource's reference
	value = dkcobj_permanent.getValue(resource_key, null, true, null);
	value = apiutil.parseJSON(value);
	if(!apiutil.isEmptyArray(value)){
		for(cnt = 0; cnt < value.length; ++cnt){
			tmpres = rawIncDecReferenceCount(dkcobj_permanent, value[cnt], false);
			if(!tmpres.result){
				r3logger.wlog('Failed to decrement reference in resource(' + value[cnt] + ') included from policy(' + policy_key + '), but continue...');
			}
		}
	}

	if(!dkcobj_permanent.remove(alias_key, false)){											// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/@
		r3logger.dlog('could not remove ' + alias_key + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(effect_key, false)){										// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/effect
		r3logger.dlog('could not remove ' + effect_key + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(action_key, false)){										// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/action
		r3logger.dlog('could not remove ' + action_key + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(resource_key, false)){										// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/resource
		r3logger.dlog('could not remove ' + resource_key + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(condition_key, false)){										// remove yrn:yahoo:<service>::<tenant>:policy:<policy>/condition
		r3logger.dlog('could not remove ' + condition_key + 'key, probably it is not existed.');
	}
	if(!dkcobj_permanent.remove(policy_key, false)){										// remove yrn:yahoo:<service>::<tenant>:policy:<policy>
		r3logger.dlog('could not remove ' + policy_key + 'key, probably it is not existed.');
	}
	return true;
}

//---------------------------------------------------------
// remove policy(no service) raw function
//---------------------------------------------------------
function rawRemovePolicy(user, tenant, service, policy)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant, policy)){
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

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
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
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
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
}

//---------------------------------------------------------
// remove policy(with service) raw function
//---------------------------------------------------------
function rawRemoveServiceTenantPolicy(dkcobj_permanent, tenant, service)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(tenant, service)){
		r3logger.elog('some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', service=' + JSON.stringify(service));
		return false;
	}

	var	keys		= r3keys(null, tenant, service);

	//
	// remove policy
	//
	if(!rawRemovePolicyEx(dkcobj_permanent, tenant, service, keys.ACR_POLICY_KW)){
		r3logger.elog('Could not remove policy(' + keys.ACR_POLICY_KW + ') from tenant(' + tenant + ') and service(' + JSON.stringify(service) + ')');
		return false;
	}
	return true;
}

//---------------------------------------------------------
// get policy raw function
//---------------------------------------------------------
// return object
//	{
//		"result":	true/false
//		"message":	<error message> / null / undefined
//		"policy":	{
//			"name":			<policy name>
//			"effect":		"allow" or "deny"
//			"action":		[<action yrn full path>, ...]
//			"resource":		[<resource yrn full path>, ...]
//			"condition":	null or undefined
//			"reference":	reference count
//			"alias":		[<policy yrn full path>, ...]
//		}
//	}
//
function rawGetPolicyAll(user, tenant, service, policy)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, tenant, policy)){
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

	var	dkcobj				= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	subkeylist;
	var	value;
	var	cnt;
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
	var	keys				= r3keys(user, tenant, service);
	var	policy_key			= keys.POLICY_TOP_KEY + ':' + policy;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>"
	var	effect_key			= policy_key + '/' + keys.EFFECT_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
	var	action_key			= policy_key + '/' + keys.ACTION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
	var	resource_key		= policy_key + '/' + keys.RESOURCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
	var	condition_key		= policy_key + '/' + keys.CONDITION_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/condition"
	var	reference_key		= policy_key + '/' + keys.REFERENCE_KW;							// "yrn:yahoo:<service>::<tenant>:policy:<policy>/reference"
	var	alias_key			= policy_key + '/' + keys.ALIAS_KW;								// "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"
	var	policy_data			= {};

	//----------------------------------------------
	// check user is tenant member
	//----------------------------------------------
	var	tenant_list = r3token.getTenantListWithDkc(dkcobj, user);
	if(!r3token.checkTenantInTenantList(tenant_list, tenant)){
		resobj.result	= false;
		resobj.message	= 'user(' + user + ') is not tenant(' + tenant + ') member, then could not allow to remove policy(' + policy + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// policy main key : get subkey list
	subkeylist	= dkcobj.getSubkeys(keys.POLICY_TOP_KEY, true);								// get subkey list in "yrn:yahoo:<service>::<tenant>:policy"
	if(!apiutil.findStringInArray(subkeylist, policy_key)){
		resobj.result	= false;
		resobj.message	= policy_key + ' is not found in ' + keys.POLICY_TOP_KEY + ' subkey list.';
		dkcobj.clean();
		return resobj;
	}

	// policy top key : get subkey list
	subkeylist	= dkcobj.getSubkeys(policy_key, true);										// get subkey list in "yrn:yahoo:<service>::<tenant>:policy:<policy>"

	// effect
	if(apiutil.findStringInArray(subkeylist, effect_key)){
		value = dkcobj.getValue(effect_key, null, true, null);
		if(keys.VALUE_ALLOW === value || keys.VALUE_DENY === value){
			policy_data.effect = value;
		}else{
			// unknown value
			r3logger.wlog('policy(' + policy_key + ') have unknown effect value(' + JSON.stringify(value) + '), then returns default value(deny).');
			policy_data.effect = keys.VALUE_DENY;
		}
	}else{
		// there is no effect key, thus default value(deny) is set.
		r3logger.wlog('policy(' + policy_key + ') does not have effect key, then returns default value(deny).');
		policy_data.effect = keys.VALUE_DENY;
	}

	// action
	policy_data.action = new Array(0);
	if(apiutil.findStringInArray(subkeylist, action_key)){
		value = dkcobj.getValue(action_key, null, true, null);
		value = apiutil.parseJSON(value);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong action value(' + JSON.stringify(value) + '), then returns default value(read).');
			policy_data.action.push(keys.VALUE_READ);

		}else if(apiutil.isArray(value)){
			for(cnt = 0; cnt < value.length; ++cnt){
				if(apiutil.isSafeString(value[cnt]) && (keys.ACTION_READ_KEY === value[cnt] || keys.ACTION_WRITE_KEY === value[cnt])){
					policy_data.action.push(value[cnt]);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong action value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			if(0 === policy_data.action.length){
				r3logger.wlog('policy(' + policy_key + ') have action empty array(there is no valid value), then returns default value(read).');
				policy_data.action.push(keys.VALUE_READ);
			}

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not action array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			if(keys.ACTION_READ_KEY === value || keys.ACTION_WRITE_KEY === value){
				policy_data.action.push(value);
			}else{
				r3logger.wlog('policy(' + policy_key + ') have wrong action strong value(' + JSON.stringify(value) + '), then returns default value(read).');
				policy_data.action.push(keys.VALUE_READ);
			}
		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type action value(' + JSON.stringify(value) + '), then returns default value(read).');
			policy_data.action.push(keys.VALUE_READ);
		}
	}else{
		// there is no action key, thus default value(read) is set.
		r3logger.wlog('policy(' + policy_key + ') does not have action key, then returns default value(read).');
		policy_data.action.push(keys.VALUE_READ);
	}

	// resource
	policy_data.resource = new Array(0);
	if(apiutil.findStringInArray(subkeylist, resource_key)){
		value = dkcobj.getValue(resource_key, null, true, null);
		value = apiutil.parseJSON(value);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong resource value(' + JSON.stringify(value) + '), then returns default empty array.');

		}else if(apiutil.isArray(value)){
			for(cnt = 0; cnt < value.length; ++cnt){
				if(apiutil.isSafeString(value[cnt])){
					policy_data.resource.push(value[cnt]);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong resource value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			// resource value is allowed empty array

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not resource array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			policy_data.resource.push(value);

		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type resource value(' + JSON.stringify(value) + '), then returns default empty array.');
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have resource key, then returns default empty array.');
	}

	// condition
	policy_data.condition = new Array(0);
	if(apiutil.findStringInArray(subkeylist, condition_key)){
		value = dkcobj.getValue(condition_key, null, true, null);
		value = apiutil.parseJSON(value);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong condition value(' + JSON.stringify(value) + '), then returns default empty array.');

		}else if(apiutil.isArray(value)){
			for(cnt = 0; cnt < value.length; ++cnt){
				if(apiutil.isSafeString(value[cnt])){
					policy_data.condition.push(value[cnt]);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong condition value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			// now, condition is not supported, then it is always empty.

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not condition array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			policy_data.condition.push(value);

		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type condition value(' + JSON.stringify(value) + '), then returns default empty array.');
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have condition key, then returns default empty array.');
	}

	// reference
	policy_data.reference = 0;
	if(apiutil.findStringInArray(subkeylist, reference_key)){
		value = dkcobj.casGet(reference_key);
		if(!isNaN(value)){
			policy_data.reference = value;
		}else{
			r3logger.wlog('policy(' + policy_key + ') have wrong reference value(' + JSON.stringify(value) + '), then returns default 0.');
			policy_data.reference = 0;
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have reference key, then returns default 0.');
		policy_data.reference = 0;
	}

	// alias
	policy_data.alias = new Array(0);
	if(apiutil.findStringInArray(subkeylist, alias_key)){
		value = dkcobj.getValue(alias_key, null, true, null);
		value = apiutil.parseJSON(value);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('policy(' + policy_key + ') have wrong alias value(' + JSON.stringify(value) + '), then returns default empty array.');

		}else if(apiutil.isArray(value)){
			for(cnt = 0; cnt < value.length; ++cnt){
				if(apiutil.isSafeString(value[cnt])){
					policy_data.alias.push(value[cnt]);
				}else{
					r3logger.wlog('policy(' + policy_key + ') have wrong alias value(' + JSON.stringify(value[cnt]) + '), so skip this value.');
				}
			}
			// alias value is allowed empty array

		}else if(apiutil.isSafeString(value)){
			r3logger.wlog('policy(' + policy_key + ') have not alias array but has strong value(' + JSON.stringify(value) + '), so returns it in array.');
			policy_data.alias.push(value);

		}else{
			r3logger.wlog('policy(' + policy_key + ') have unknown type alias value(' + JSON.stringify(value) + '), then returns default empty array.');
		}
	}else{
		r3logger.wlog('policy(' + policy_key + ') does not have alias key, then returns default empty array.');
	}

	// set policy key into result object
	resobj.policy	= policy_data;
	dkcobj.clean();
	return resobj;
}

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
function rawCheckPolicies(dkcobj_permanent, policy, resource, action, summary_result, checked_policies)
{
	if('boolean' !== typeof summary_result){
		summary_result = null;							// for default
	}
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return summary_result;							// return initial result(not modify)
	}
	if(!apiutil.isSafeStrings(policy, resource, action)){
		r3logger.elog('some parameters are wrong : policy=' + JSON.stringify(policy) + ', resource=' + JSON.stringify(resource) + ', action=' + JSON.stringify(action));
		return summary_result;							// return initial result(not modify)
	}
	if(!apiutil.isArray(checked_policies)){
		checked_policies = new Array(0);
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
	var	cnt;
	var	keys				= r3keys();
	var	effect_key			= policy + '/' + keys.EFFECT_KW;
	var	action_key			= policy + '/' + keys.ACTION_KW;
	var	resource_key		= policy + '/' + keys.RESOURCE_KW;
	var	condition_key		= policy + '/' + keys.CONDITION_KW;		// eslint-disable-line no-unused-vars
	var	reference_key		= policy + '/' + keys.REFERENCE_KW;		// eslint-disable-line no-unused-vars
	var	alias_key			= policy + '/' + keys.ALIAS_KW;

	// check result of policy under aliases
	var	value	= dkcobj_permanent.getValue(alias_key, null, true, null);
	value		= apiutil.parseJSON(value);
	if(!apiutil.isEmptyArray(value)){
		for(cnt = 0; cnt < value.length; ++cnt){
			// check alias policy keys
			var	under_result = rawCheckPolicies(dkcobj_permanent, value[cnt], resource, action, summary_result, checked_policies);
			if(null !== under_result){
				// over write summary
				summary_result = under_result;
			}else{
				// aliases does not decide result, so do not change summary.
			}
		}
	}

	// check own resource
	var	is_matched	= false;
	value			= dkcobj_permanent.getValue(resource_key, null, true, null);
	value			= apiutil.parseJSON(value);
	if(apiutil.findStringInArray(value, resource)){
		// resource is target for this policy
		value = dkcobj_permanent.getValue(action_key, null, true, null);
		value = apiutil.parseJSON(value);
		// check action
		if(!apiutil.isEmptyArray(value)){
			// check this policy's action
			for(cnt = 0; cnt < value.length; ++cnt){
				if(action === value[cnt]){
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
	var	effect	= null;
	value		= dkcobj_permanent.getValue(effect_key, null, true, null);
	if(keys.VALUE_ALLOW === value){
		effect	= true;
	}else if(keys.VALUE_DENY === value){
		effect	= false;
	}

	// merge own result with under aliases
	//
	// [NOTE]
	// If the policy can be detected, the result is determined according to this policy.
	// In case of undetected, use aliases result and summary result.
	//
	var	result	= null;
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
}

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
function rawCheckPolicy(policy, resource, action)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(resource, action)){
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

	var	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	var	one_result	= null;
	for(var cnt = 0; cnt < policy.length; ++cnt){
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
}

//---------------------------------------------------------
// Create(Add) keystone endpoint
//---------------------------------------------------------
//
// region			:	region for keystone endpoint
// endpoint_uri		:	endpoint url(ex. "https://keystone.xxx.com:5000/")
//						if null is specified and url key is existed, not update.
// type				:	specify endpoint type
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
function rawCreateKeystoneEndpointWithDkc(dkcobj_permanent, region, endpoint_uri, type, last_status_code)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(region)){														// other is allowed null
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : region=' + JSON.stringify(region);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		resobj.result	= false;
		resobj.message	= 'parameter dkcobj_permanent is not object or not permanent';
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	is_url	= false;
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
	var	keys	= r3keys();
	var	is_type	= false;
	if(null === type){
		is_type = false;
		type	= keys.VALUE_KEYSTONE_NORMAL;												// for default
	}else if(!apiutil.isSafeString(type) || ('' !== type && keys.VALUE_KEYSTONE_NORMAL !== type && keys.VALUE_KEYSTONE_NOPASS !== type && keys.VALUE_KEYSTONE_SUB !== type)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : type=' + JSON.stringify(type);
		r3logger.elog(resobj.message);
		return resobj;
	}else{
		if('' === type){
			type= keys.VALUE_KEYSTONE_NORMAL;												// for default
		}
		is_type = true;
	}
	var	is_last_status		= false;
	if(null === last_status_code){
		is_last_status		= false;
		last_status_code	= 0;															// for default
		last_status_code	= String(last_status_code);
	}else if(!apiutil.isSafeEntity(last_status_code) || ('' !== last_status_code && isNaN(last_status_code))){
		resobj.result		= false;
		resobj.message		= 'parameter is wrong : last_status_code=' + JSON.stringify(last_status_code);
		r3logger.elog(resobj.message);
		return resobj;
	}else{
		if('' === last_status_code){
			last_status_code= 0;															// for default
			last_status_code= String(last_status_code);
		}
		if(!apiutil.isSafeString(last_status_code)){
			last_status_code= String(last_status_code);
		}
		is_last_status		= true;
	}

	var	subkeylist;
	var	value;
	var	is_update;

	//
	// keys
	//
	var	region_key		= keys.KEYSTONE_TOP_KEY + ':' + region;								// "yrn:yahoo::::keystone:<region>"
	var	url_key			= region_key + '/' + keys.URL_KW;									// "yrn:yahoo::::keystone:<region>/url"
	var	type_key		= region_key + '/' + keys.TYPE_KW;									// "yrn:yahoo::::keystone:<region>/type"
	var	status_key		= region_key + '/' + keys.STATUS_KW;								// "yrn:yahoo::::keystone:<region>/status"
	var	date_key		= region_key + '/' + keys.DATE_KW;									// "yrn:yahoo::::keystone:<region>/date"

	// keystone top key : get subkey list
	subkeylist	= dkcobj_permanent.getSubkeys(keys.KEYSTONE_TOP_KEY, true);					// get subkey list in "yrn:yahoo::::keystone"
	if(apiutil.tryAddStringToArray(subkeylist, region_key)){
		if(!dkcobj_permanent.setSubkeys(keys.KEYSTONE_TOP_KEY, subkeylist)){				// add subkey yrn:yahoo::::keystone:<region> -> yrn:yahoo::::keystone
			resobj.result	= false;
			resobj.message	= 'could not add ' + region_key + ' subkey under ' + keys.KEYSTONE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// region key : get subkey list
	subkeylist	= dkcobj_permanent.getSubkeys(region_key, true);							// get subkey list in "yrn:yahoo::::keystone:<region>"
	is_update	= false;
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
		if(!dkcobj_permanent.setSubkeys(region_key, subkeylist)){							// add subkey yrn:yahoo::::keystone:<region>/{url, type, status, data} -> yrn:yahoo::::keystone:<region>
			resobj.result	= false;
			resobj.message	= 'could not add ' + url_key + ', ' + type_key + ', ' + status_key + ', ' + date_key + ' subkey under ' + region_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// url
	value = dkcobj_permanent.getValue(url_key, null, true, null);
	if(!apiutil.isSafeString(value) || (is_url && value !== endpoint_uri)){
		if(!apiutil.isSafeString(endpoint_uri)){
			resobj.result	= false;
			resobj.message	= region_key + ' does not have endpoint url, but endpoint url(' + endpoint_uri + ') is not specified.';
			r3logger.elog(resobj.message);
			return resobj;
		}
		if(!dkcobj_permanent.setValue(url_key, endpoint_uri)){								// update value url -> yrn:yahoo::::keystone:<region>/url
			resobj.result	= false;
			resobj.message	= 'could not set ' + endpoint_uri + ' value to ' + url_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// type
	value = dkcobj_permanent.getValue(status_key, null, true, null);
	if(!apiutil.isSafeString(value) || (keys.VALUE_KEYSTONE_NORMAL !== value && keys.VALUE_KEYSTONE_NOPASS !== value && keys.VALUE_KEYSTONE_SUB !== value) || is_update || (is_type && value !== type)){
		if(!dkcobj_permanent.setValue(type_key, type)){										// update value type -> yrn:yahoo::::keystone:<region>/type
			resobj.result	= false;
			resobj.message	= 'could not set ' + type + ' value to ' + type_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// status
	value = dkcobj_permanent.getValue(status_key, null, true, null);
	if(!(apiutil.isSafeString(value) && isNaN(value)) || is_update || (is_last_status && value !== last_status_code)){
		if(!dkcobj_permanent.setValue(status_key, last_status_code)){						// update value status -> yrn:yahoo::::keystone:<region>/status
			resobj.result	= false;
			resobj.message	= 'could not set ' + last_status_code + ' value to ' + status_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// date
	value = dkcobj_permanent.getValue(date_key, null, true, null);
	if(!apiutil.isSafeString(value) || is_update){
		value = String(apiutil.getUnixtime());												// now date
		if(!dkcobj_permanent.setValue(date_key, value)){									// update value date -> yrn:yahoo::::keystone:<region>/date
			resobj.result	= false;
			resobj.message	= 'could not set ' + value + ' value to ' + date_key + ' key';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}
	return resobj;
}

//
// Wrapper for rawCreateKeystoneEndpoint
//
function rawCreateKeystoneEndpoint(region, endpoint_uri, type, last_status_code)
{
	var	resobj = {result: true, message: null};

	var	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, true, false);								// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	resobj = rawCreateKeystoneEndpointWithDkc(dkcobj, region, endpoint_uri, type, last_status_code);
	dkcobj.clean();
	return resobj;
}

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
function rawUpdateMultiKeystoneEndpointStatus(epmap)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeEntity(epmap)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : epmap=' + JSON.stringify(epmap);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);								// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	var	is_error= false;

	for(var region in epmap){
		if(!apiutil.isSafeEntity(epmap[region].status) || isNaN(epmap[region].status)){
			r3logger.elog('region(' + region + ') status code is not safe value, so skip this.');
			is_error = true;
			continue;
		}
		// update status code for keystone endpoint by region
		var	res_ep = rawCreateKeystoneEndpointWithDkc(dkcobj, region, null, null, epmap[region].status);
		if(!res_ep.result){
			r3logger.elog('could not update status(' + epmap[region].status + ') to keystone endpoint(' + region + ') in k2hdkc, but continue...');
			is_error = true;
		}
	}
	dkcobj.clean();

	if(is_error){
		resobj.result	= false;
		resobj.message	= 'failed to set last status for some endpoints in region(' + region + ')';
		r3logger.elog(resobj.message);
	}
	return resobj;
}

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
function rawRemoveKeystoneEndpoint(region)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(region)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : region=' + JSON.stringify(region);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	keys			= r3keys();
	var	subkeylist;
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
	var	region_key		= keys.KEYSTONE_TOP_KEY + ':' + region;								// "yrn:yahoo::::keystone:<region>"
	var	url_key			= region_key + '/' + keys.URL_KW;									// "yrn:yahoo::::keystone:<region>/url"
	var	type_key		= region_key + '/' + keys.TYPE_KW;									// "yrn:yahoo::::keystone:<region>/type"
	var	status_key		= region_key + '/' + keys.STATUS_KW;								// "yrn:yahoo::::keystone:<region>/status"
	var	date_key		= region_key + '/' + keys.DATE_KW;									// "yrn:yahoo::::keystone:<region>/date"

	// keystone top key : get subkey list
	subkeylist	= dkcobj.getSubkeys(keys.KEYSTONE_TOP_KEY, true);							// get subkey list in "yrn:yahoo::::keystone"
	if(apiutil.removeStringFromArray(subkeylist, region_key)){
		if(!dkcobj.setSubkeys(keys.KEYSTONE_TOP_KEY, subkeylist)){							// update subkey -> yrn:yahoo::::keystone
			resobj.result	= false;
			resobj.message	= 'could not update subkey under ' + keys.KEYSTONE_TOP_KEY + ' key';
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
	}

	// subkeys
	if(!dkcobj.remove(url_key, false)){														// remove yrn:yahoo::::keystone:<region>/url
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + url_key + 'key, probably it is not existed. ';
	}
	if(!dkcobj.remove(type_key, false)){													// remove yrn:yahoo::::keystone:<region>/type
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + type_key + 'key, probably it is not existed. ';
	}
	if(!dkcobj.remove(status_key, false)){													// remove yrn:yahoo::::keystone:<region>/status
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + status_key + 'key, probably it is not existed. ';
	}
	if(!dkcobj.remove(date_key, false)){													// remove yrn:yahoo::::keystone:<region>/date
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + date_key + 'key, probably it is not existed. ';
	}

	// main key
	if(!dkcobj.remove(region_key, false)){													// remove yrn:yahoo::::keystone:<region>
		resobj.result	= true;
		resobj.message	+= 'could not remove ' + region_key + 'key, probably it is not existed. ';
	}

	dkcobj.clean();
	return resobj;
}

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
function rawGetKeystoneEndpoint(dkcobj_permanent, region)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return null;
	}
	if(!apiutil.isSafeString(region)){
		r3logger.elog('parameter is wrong : region=' + JSON.stringify(region));
		return null;
	}

	var	keys			= r3keys();
	var	value;
	var	result			= {};

	//
	// keys
	//
	var	region_key		= keys.KEYSTONE_TOP_KEY + ':' + region;								// "yrn:yahoo::::keystone:<region>"
	var	url_key			= region_key + '/' + keys.URL_KW;									// "yrn:yahoo::::keystone:<region>/url"
	var	type_key		= region_key + '/' + keys.TYPE_KW;									// "yrn:yahoo::::keystone:<region>/type"
	var	status_key		= region_key + '/' + keys.STATUS_KW;								// "yrn:yahoo::::keystone:<region>/status"
	var	date_key		= region_key + '/' + keys.DATE_KW;									// "yrn:yahoo::::keystone:<region>/date"

	// keystone top key : get subkey list
	var	subkeylist		= dkcobj_permanent.getSubkeys(region_key, true);					// get subkey list in "yrn:yahoo::::keystone:<region>"
	if(apiutil.isEmptyArray(subkeylist)){
		// there is no subkeys, it means this key is empty.
		return null;
	}

	// url
	if(apiutil.findStringInArray(subkeylist, url_key)){
		value = dkcobj_permanent.getValue(url_key, null, true, null);
		if(!apiutil.isSafeString(value)){
			r3logger.wlog('region/url(' + region + '/' + url_key + ') has empty value.');
			result[keys.URL_KW]	= null;
		}else{
			result[keys.URL_KW]	= value;
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have url subkey.');
		result[keys.URL_KW]		= null;
	}

	// type
	if(apiutil.findStringInArray(subkeylist, type_key)){
		value = dkcobj_permanent.getValue(type_key, null, true, null);
		if(!apiutil.isSafeString(value)){
			r3logger.wlog('region/type(' + region + '/' + type_key + ') has empty value.');
			result[keys.TYPE_KW]= keys.VALUE_KEYSTONE_NORMAL;								// default
		}else{
			result[keys.TYPE_KW]= value;
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have type subkey.');
		result[keys.TYPE_KW]	= keys.VALUE_KEYSTONE_NORMAL;								// default
	}

	// status
	if(apiutil.findStringInArray(subkeylist, status_key)){
		value = dkcobj_permanent.getValue(status_key, null, true, null);
		if(!apiutil.isSafeEntity(value) || isNaN(value)){
			r3logger.wlog('region/status(' + region + '/' + status_key + ') has not number value.');
			result[keys.STATUS_KW]	= String(0);											// default
		}else{
			result[keys.STATUS_KW]	= String(value);
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have status subkey.');
		result[keys.STATUS_KW]		= String(0);											// default
	}

	// date
	if(apiutil.findStringInArray(subkeylist, date_key)){
		value = dkcobj_permanent.getValue(date_key, null, true, null);
		if(!apiutil.isSafeEntity(value)){
			r3logger.wlog('region/date(' + region + '/' + date_key + ') has not number value.');
			result[keys.DATE_KW]	= String(0);											// default
		}else{
			result[keys.DATE_KW]	= String(value);
		}
	}else{
		r3logger.wlog('region(' + region + ') does not have date subkey.');
		result[keys.DATE_KW]		= String(0);											// default
	}

	return result;
}

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
function rawGetKeystoneEndpoints(region)
{
	var	resobj = {result: true, message: null};

	if(apiutil.isSafeString(region)){
		region = [region];
	}else if(apiutil.isArray(region) && apiutil.isEmptyArray(region)){
		// nothing to do
	}else if(null === region){
		region = null;
	}else{
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : region=' + JSON.stringify(region);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);					// use permanent object(need to clean)
	var	keys			= r3keys();
	var	keystones		= {};
	var	cnt;
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// keystone top key : get subkey list
	if(null === region){
		region = dkcobj.getSubkeys(keys.KEYSTONE_TOP_KEY, true);							// get subkey list in "yrn:yahoo::::keystone"
	}
	// normalization(only region name)
	if(!apiutil.isEmptyArray(region)){
		var	tmpregion	= [];
		var	regionptn	= new RegExp('^' + keys.MATCH_ANY_KS_REGION);						// regex = /^yrn:yahoo::::keystone:(.*)/
		for(cnt = 0; cnt < region.length; ++cnt){
			if(!apiutil.isSafeString(region[cnt])){
				r3logger.wlog('Found wrong region string(' + JSON.stringify(region[cnt]) + ') in keystone region list, skip this.');
				continue;
			}
			var	regionmatches = region[cnt].match(regionptn);
			if(!apiutil.isEmptyArray(regionmatches) && 2 <= regionmatches.length){
				tmpregion.push(regionmatches[1]);
			}else{
				tmpregion.push(region[cnt]);
			}
		}
		// replace
		region = tmpregion;
	}

	for(cnt = 0; !apiutil.isEmptyArray(region) && cnt < region.length; ++cnt){
		if(!apiutil.isSafeString(region[cnt])){
			r3logger.wlog('Found wrong region string(' + JSON.stringify(region[cnt]) + ') in keystone region list, skip this.');
			continue;
		}
		var	region_name	= region[cnt];
		var	region_data = rawGetKeystoneEndpoint(dkcobj, region_name);
		if(null === region_data){
			r3logger.wlog('Could not get region(' + region_name + ') data, skip this');
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
}

//---------------------------------------------------------
// Get list for key raw function
//---------------------------------------------------------
//
// Get children list object by tenant and path
//
// tenant		: tenant name(must be specified)
// service		: service name(if service+tenant, specify this)
// type			: type for list up
// path			: sub path for types. if type is service, this value is ignored
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
function rawGetChildrenList(tenant, service, type, path, is_expand)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(tenant, type)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : tenant=' + JSON.stringify(tenant) + ', type=' + JSON.stringify(type);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(path)){												// allow path is empty
		path			= '';
	}else{
		path			= ':' + path;
	}
	if('boolean' !== typeof is_expand){
		is_expand		= false;													// default not expand
	}
	if(apiutil.isSafeString(service)){
		service			= service.toLowerCase();
	}else{
		service			= null;
	}

	var	keys		= r3keys(null, tenant, service);
	var	keypath;
	if(keys.TYPE_ROLE === type){
		keypath		= keys.ROLE_TOP_KEY + path;
	}else if(keys.TYPE_RESOURCE === type){
		keypath		= keys.RESOURCE_TOP_KEY + path;
	}else if(keys.TYPE_POLICY === type){
		keypath		= keys.POLICY_TOP_KEY + path;
	}else if(keys.TYPE_SERVICE === type){
		//
		// For service case, we must check static two key path.
		// Set first path is set here.
		//
		keypath		= keys.TENANT_SERVICE_KEY;										// read from "yrn:yahoo:::<tenant>:service"
	}else{
		resobj.result	= false;
		resobj.message	= 'type parameter value is wrong : ' + JSON.stringify(type);
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	if(!rawInitKeyHierarchy(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet, or configuration is not set';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get children
	var	children	= [];
	if(!rawGetChildrenListWithDkc(dkcobj, type, keypath, is_expand, children)){
		resobj.result	= false;
		resobj.message	= 'Could not get child list for ' + keypath;
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	if(keys.TYPE_SERVICE === type){
		//
		// check second path for services here.
		//
		keypath	= keys.ANYTENANT_SERVICE_KEY;										// read from "yrn:yahoo::::service::anytenant"
		if(!rawGetChildrenListWithDkc(dkcobj, type, keypath, is_expand, children)){
			resobj.result	= false;
			resobj.message	= 'Could not get child list for ' + keypath;
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}

		//
		// Check service owner(If tenant is owner, add special key)
		//
		for(var cnt = 0; cnt < children.length; ++cnt){
			if(rawCheckTenantInServiceOwner(dkcobj, tenant, children[cnt].name)){
				// tenant is service owner
				children[cnt].owner = true;
			}
		}
	}
	resobj.children	= children;

	dkcobj.clean();
	return resobj;
}

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
function rawGetChildrenListWithDkc(dkcobj_permanent, type, keypath, is_expand, children)
{
	if(!(dkcobj_permanent instanceof Object) || !dkcobj_permanent.isPermanent()){
		r3logger.elog('parameter dkcobj_permanent is not object or not permanent');
		return false;
	}
	if(!apiutil.isSafeStrings(keypath, type)){
		r3logger.elog('some parameters are wrong : keypath=' + JSON.stringify(keypath) + ', type=' + JSON.stringify(type));
		return false;
	}
	if('boolean' !== typeof is_expand){
		is_expand	= false;														// default not expand
	}
	if(!apiutil.isArray(children)){
		children	= [];															// escapes error but it do not return values....
	}

	var	keys		= r3keys();
	if(keys.TYPE_ROLE !== type && keys.TYPE_RESOURCE !== type && keys.TYPE_POLICY !== type && keys.TYPE_SERVICE !== type){
		r3logger.elog('type parameter value is wrong : ' + JSON.stringify(type));
		return false;
	}

	// get subkey list
	var	subkeylist = dkcobj_permanent.getSubkeys(keypath, true);
	if(apiutil.isEmptyArray(subkeylist)){
		return true;
	}

	// filter
	var	childpath;
	var	serviceptn	= new RegExp('^' + keys.MATCH_ANY_SERVICE_MASTER);				// regex = /^yrn:yahoo::::service:(.*)/
	for(var cnt = 0; !apiutil.isEmptyArray(subkeylist) && cnt < subkeylist.length; ++cnt){
		if(keys.TYPE_SERVICE !== type){
			// key must be under parent key.
			if(0 !== subkeylist[cnt].indexOf(keypath)){
				r3logger.wlog('unknown key path' + subkeylist[cnt] + ' in ' + keypath + ' child, then skip this.');
				continue;
			}
			childpath = subkeylist[cnt].substr(keypath.length);
			if(apiutil.isSafeString(childpath) && (':' === childpath[0] || '/' === childpath[0])){
				childpath = childpath.substr(1);
			}
			if(!apiutil.isSafeString(childpath)){
				r3logger.wlog('path' + subkeylist[cnt] + ' in ' + keypath + ' child is something wrong, then skip this.');
				continue;
			}
			// check reserved word
			if(keys.TYPE_ROLE			=== type &&
				(	keys.ALIAS_KW		=== childpath	||
					keys.HOSTS_KW		=== childpath	||
					keys.ID_KW			=== childpath	||
					keys.POLICIES_KW	=== childpath	||
					keys.REFERENCE_KW	=== childpath	)
			){
				continue;
			}else if(keys.TYPE_RESOURCE === type &&
				(	keys.ALIAS_KW		=== childpath	||
					keys.KEYS_KW		=== childpath	||
					keys.TYPE_KW		=== childpath	||
					keys.EXPIRE_KW		=== childpath	||
					keys.REFERENCE_KW	=== childpath	)
			){
				continue;
			}else if(keys.TYPE_POLICY	=== type &&
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
			var	servicematches	= subkeylist[cnt].match(serviceptn);				// check key is under "yrn:yahoo::::service"
			if(apiutil.isEmptyArray(servicematches) || servicematches.length < 2 || !apiutil.isSafeString(servicematches[1])){
				r3logger.wlog('key path' + subkeylist[cnt] + ' in ' + keypath + ' child is not under service master key, then skip this.');
				continue;
			}
			childpath = servicematches[1];
		}

		//
		// [NOTE] case of TYPE_SERVICE does not need to skip any key.
		//
		var	grandson = [];
		if(is_expand && keys.TYPE_POLICY !== type && keys.TYPE_SERVICE !== type){
			// reentrant
			if(!rawGetChildrenListWithDkc(dkcobj_permanent, type, subkeylist[cnt], true, grandson)){
				r3logger.elog('Could not get grandson for ' + subkeylist[cnt] + ', but continue...');
				grandson = [];
			}
		}

		//
		// Merge or Add children
		//
		var	find_same_item = false;
		for(var cnt2 = 0; cnt2 < children.length; ++cnt2){
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
}

function rawCompareChildrenListName(child1, child2)
{
	if(child1.name < child2.name){
		return -1;
	}else if(child2.name < child1.name){
		return 1;
	}else{	// child2.name === child1.name
		return 0;
	}
}

//---------------------------------------------------------
// Initialize tenant/user/service
//---------------------------------------------------------
//
// These functions initializing tenant is without service.
//
exports.initTenant = function(tenantname, id, desc, display, user)
{
	//
	// Must initialize service key before calling this if specified service parameter
	//
	return rawCreateTenant(user, tenantname, id, desc, display);
};

exports.initUser = function(user, id, username, tenant)
{
	return rawCreateUser(user, id, username, tenant);
};

exports.initUserTenant = function(user, userid, username, tenant, tenantid, tenantdesc, tenantdisplay)
{
	//
	// Must initialize service key before calling this if specified service parameter
	//
	var	resobj = rawCreateTenant(user, tenant, tenantid, tenantdesc, tenantdisplay);
	if(resobj.result){
		resobj = rawCreateUser(user, userid, username, tenant);
	}
	return resobj;
};

exports.getUserId = function(username)
{
	return rawGetUserId(username);
};

exports.removeComprehensionByNewTenants = function(user, tenant_list)
{
	return rawRemoveComprehensionByNewTenants(user, tenant_list);
};

//---------------------------------------------------------
// Service & ACR
//---------------------------------------------------------
//
// [NOTE]
// Create owner tenant before creating service
//
exports.initService = function(owner, servicename, verify)
{
	return rawCreateService(owner, servicename, verify);
};

exports.updateServiceVerify = function(owner, servicename, verify)
{
	return rawCreateService(owner, servicename, verify);
};

exports.getService = function(owner, servicename)
{
	return rawGetServiceAll(owner, servicename);
};

exports.removeService = function(owner, servicename)
{
	return rawRemoveServiceAll(owner, servicename);
};

exports.allowTenantToService = function(owner, service, tenant)
{
	return rawAllowTenantToService(owner, service, tenant);
};

exports.denyTenantFromService = function(owner, service, tenant)
{
	return rawDenyTenantFromService(owner, service, tenant);
};

exports.checkTenantInService = function(service, tenant)
{
	return rawCheckTenantInServiceMember(service, tenant);
};

exports.checkTenantInServiceOwner = function(service, tenant)
{
	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	result	= rawCheckTenantInServiceOwner(dkcobj, tenant, service);
	dkcobj.clean();
	return result;
};

//
// [NOTE]	Must initialize User/Tenant before calling this function.
//
exports.createServiceTenantByUser = function(tenant, service, user, passwd, callback)
{
	return rawCreateServiceTenantByUser(tenant, service, user, passwd, callback);
};

exports.createServiceTenantByUnscopedToken = function(tenant, service, unscopedtoken, user, callback)
{
	return rawCreateServiceTenantByUnscopedToken(tenant, service, unscopedtoken, user, callback);
};

exports.createServiceTenantByScopedToken = function(tenant, service, scopedtoken, callback)
{
	return rawCreateServiceTenantByScopedToken(tenant, service, scopedtoken, callback);
};

exports.removeServiceTenant = function(user, tenant, service)
{
	return rawRemoveServiceTenant(user, tenant, service);
};

exports.getServiceTenantResources = function(servicename, service_ip, service_port, service_cuk, service_roleyrn, client_ip, client_port, client_cuk, client_roleyrn)
{
	return rawGetServiceTenantResources(servicename, service_ip, service_port, service_cuk, service_roleyrn, client_ip, client_port, client_cuk, client_roleyrn);
};

//---------------------------------------------------------
// Roles
//---------------------------------------------------------
//
// [NOTE]	Must initialize User/Tenant before calling this function.
//
exports.setRoleAll = function(user, tenant, role, policies, alias_roles, hostnames, clear_old_hostnames, ips, clear_old_ips)
{
	return rawCreateRole(user, tenant, role, policies, alias_roles, hostnames, clear_old_hostnames, ips, clear_old_ips);
};

exports.removeRole = function(user, tenant, role)
{
	return rawRemoveRole(user, tenant, role);
};

exports.updateRolePolicies = function(user, tenant, role, policies)
{
	return rawCreateRole(user, tenant, role, policies, null, null, false, null, false);
};

exports.clearRolePolicies = function(user, tenant, role)
{
	return rawCreateRole(user, tenant, role, '', null, null, false, null, false);
};

exports.updateRoleHosts = function(user, tenant, role, hostnames, clear_old_hostnames, ips, clear_old_ips)
{
	return rawCreateRole(user, tenant, role, null, null, hostnames, clear_old_hostnames, ips, clear_old_ips);
};

exports.clearRoleHosts = function(user, tenant, role)
{
	return rawCreateRole(user, tenant, role, null, null, '', true, null, false);
};

exports.updateRoleAlias = function(user, tenant, role, alias_role)
{
	return rawCreateRole(user, tenant, role, null, alias_role, null, false, null, false);
};

exports.clearRoleAlias = function(user, tenant, role)
{
	return rawCreateRole(user, tenant, role, null, '', null, false, null, false);
};

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
exports.getRole = function(role, is_expand)
{
	return rawGetRole(role, is_expand);
};

exports.addHost = function(tenant, role, hostname, ip, port, cuk, extra, tag, inboundip, outboundip)
{
	// [NOTE]
	// Now do not set hosts to role under service.
	// But if need to set hosts to it, you can set role as full yrn role path.
	//
	return rawAddHost(tenant, role, null, hostname, ip, port, cuk, extra, tag, inboundip, outboundip);
};

exports.removeHost = function(tenant, role, target, tg_port, tg_cuk, req_ip, req_port, req_cuk)
{
	// [NOTE]
	// Now do not set hosts to role under service, then we do not need to remove
	// hosts under service + tenant.
	// But if need to remove hosts to it, you can set role as full yrn role path.
	//
	return rawRemoveHost(tenant, null, role, target, tg_port, tg_cuk, req_ip, req_port, req_cuk);
};

exports.removeIpsByCuk = function(cuk, host, remove_under_role)
{
	return rawRemoveIpsByCuk(cuk, host, remove_under_role);
};

exports.isKubernetesCuk = function(cuk)
{
	return rawIsKubernetesCuk(cuk);
};

exports.compareIpAndKubernetesCuk = function(ip, cuk)
{
	return rawCompareIpAndKubernetesCuk(ip, cuk);
};

exports.getExtraFromCuk = function(cuk)
{
	return rawGetExtraFromCuk(cuk);
};

//
// [NOTE]
// This function does not perform asynchronous processing, because many k2hdkc handles
// are required for it.
// It is recommended to start the process of enumerating IP addresses as a separate process.
//
exports.getAllIpDatasByCuk = function(is_openstack)
{
	var	extra;
	var	keys	= r3keys();
	if('boolean' !== typeof is_openstack || is_openstack){
		extra = keys.VALUE_OPENSTACK_V1;		// default
	}else{
		extra = keys.VALUE_K8S_V1;
	}
	return rawGetAllIpDatasByCuk(extra);
};

//
// [NOTE]
// This function does not perform asynchronous processing, because many k2hdkc handles
// are required for it.
// It is recommended to start the process of enumerating IP addresses as a separate process.
//
exports.removeIpAddressWithCuk = function(ipdatas, pendingsec, logger)
{
	return rawRemoveIpAddressWithCuk(ipdatas, pendingsec, logger);
};

exports.findHost = function(tenant, role, hostname, ip, port, cuk, is_strict)
{
	// [NOTE]
	// Now do not set hosts to role under service, then we do not need to remove
	// hosts under service + tenant.
	// But if need to remove hosts to it, you can set role as full yrn role path.
	//
	return rawFindHost(tenant, null, role, hostname, ip, port, cuk, is_strict);
};

exports.findRoleHost = function(dkcobj_permanent, role_key, hostname, ip, port, cuk)
{
	var	dkcobj = null;
	if(!(dkcobj_permanent instanceof Object)){
		dkcobj			= k2hdkc(dkcconf, dkcport, dkccuk, true, false);						// use permanent object(need to clean)
		dkcobj_permanent= dkcobj;
	}
	var	result = rawFindRoleHost(dkcobj_permanent, role_key, hostname, ip, port, cuk, false);	// not strictly check
	if(null != dkcobj){
		dkcobj.clean();
	}
	return result;
};

//---------------------------------------------------------
// Resources
//---------------------------------------------------------
//
// [NOTE]	Must initialize User/Tenant before calling this function.
//
exports.setResourceAll = function(user, tenant, resourcename, type, data, resource_keys, alias_resources)
{
	return rawCreateResourceByUser(user, tenant, resourcename, type, data, resource_keys, alias_resources);
};

exports.setResourceAllByRole = function(role, tenant, resourcename, type, data, resource_keys)
{
	return rawCreateResourceByRole(role, tenant, resourcename, type, data, resource_keys);
};

exports.setResourceAllByIP = function(ip, port, cuk, roleyrn, resourcename, type, data, resource_keys)
{
	return rawCreateResourceByIP(ip, port, cuk, roleyrn, resourcename, type, data, resource_keys);
};

exports.updateResourceValue = function(user, tenant, resourcename, type, data)
{
	return rawCreateResourceByUser(user, tenant, resourcename, type, data, null, null);
};

exports.clearResourceValue = function(user, tenant, resourcename)
{
	var	keys = r3keys();
	return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, '', null, null);
};

exports.updateResourceKeys = function(user, tenant, resourcename, resource_keys)
{
	var	keys = r3keys();
	return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, resource_keys, null);
};

exports.clearResourceKeys = function(user, tenant, resourcename)
{
	var	keys = r3keys();
	return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, '', null);
};

exports.updateResourceAlias = function(user, tenant, resourcename, alias_resource)
{
	var	keys = r3keys();
	return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, null, alias_resource);
};

exports.clearResourceAlias = function(user, tenant, resourcename)
{
	var	keys = r3keys();
	return rawCreateResourceByUser(user, tenant, resourcename, keys.VALUE_STRING_TYPE, null, null, '');
};

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
exports.getResource = function(user, tenantname, servicename, resyrn, is_expand)
{
	return rawGetResourceByUser(user, tenantname, servicename, resyrn, is_expand);
};

// [NOTE]
// role is yrn full path which does not include service.
//
exports.getResourceByRole = function(roleyrn, resyrn, type, keyname)
{
	return rawGetResourceByRole(roleyrn, resyrn, type, keyname);
};

exports.getResourceByIP = function(ip, port, cuk, roleyrn, resyrn, type, keyname)
{
	return rawGetResourceByIP(ip, port, cuk, roleyrn, resyrn, type, keyname);
};

exports.removeResource = function(user, tenant, resource, type, keynames, aliases)
{
	return rawRemoveResourceByUser(user, tenant, resource, type, keynames, aliases);
};

exports.removeResourceByRole = function(role, tenant, resource, type, keynames)
{
	return rawRemoveResourceByRole(role, tenant, resource, type, keynames);
};

exports.removeResourceByIP = function(ip, port, cuk, roleyrn, resource, type, keynames)
{
	return rawRemoveResourceByIP(ip, port, cuk, roleyrn, resource, type, keynames);
};

exports.checkResource = function(user, tenant, service, resource, type, keyname)
{
	return rawCheckResourceByUser(user, tenant, service, resource, type, keyname);
};

// [NOTE]
// role is yrn full path which does not include service.
//
exports.checkResourceByRole = function(roleyrn, tenant, resource, type, keyname)
{
	return rawCheckResourceByRole(roleyrn, tenant, resource, type, keyname);
};

exports.checkResourceByIP = function(ip, port, cuk, roleyrn, resource, type, keyname)
{
	return rawCheckResourceByIP(ip, port, cuk, roleyrn, resource, type, keyname);
};

//---------------------------------------------------------
// Policies
//---------------------------------------------------------
//
// [NOTE]	Must initialize User/Tenant before calling this function.
//
exports.setPolicyAll = function(user, tenant, policy, effect, action, resource, condition, alias_policy)
{
	return rawCreatePolicy(user, tenant, policy, effect, action, resource, condition, alias_policy);
};

exports.removePolicy = function(user, tenant, policy)
{
	return rawRemovePolicy(user, tenant, null, policy);
};

exports.updatePolicyEffect = function(user, tenant, policy, is_allow)
{
	return rawCreatePolicy(user, tenant, policy, is_allow, null, null, null, null);
};

exports.updatePolicyAllow = function(user, tenant, policy)
{
	return rawCreatePolicy(user, tenant, policy, true, null, null, null, null);
};

exports.updatePolicyDeny = function(user, tenant, policy)
{
	return rawCreatePolicy(user, tenant, policy, false, null, null, null, null);
};

exports.updatePolicyAction = function(user, tenant, policy, action)
{
	return rawCreatePolicy(user, tenant, policy, null, action, null, null, null);
};

exports.clearPolicyAction = function(user, tenant, policy)
{
	return rawCreatePolicy(user, tenant, policy, null, '', null, null, null);
};

exports.updatePolicyResource = function(user, tenant, policy, resource)
{
	return rawCreatePolicy(user, tenant, policy, null, null, resource, null, null);
};

exports.clearPolicyResource = function(user, tenant, policy)
{
	return rawCreatePolicy(user, tenant, policy, null, null, '', null, null);
};

exports.updatePolicyCondition = function(user, tenant, policy, condition)
{
	return rawCreatePolicy(user, tenant, policy, null, null, null, condition, null);
};

exports.clearPolicyCondition = function(user, tenant, policy)
{
	return rawCreatePolicy(user, tenant, policy, null, null, null, '', null);
};

exports.updatePolicyAlias = function(user, tenant, policy, alias_policy)
{
	return rawCreatePolicy(user, tenant, policy, null, null, null, null, alias_policy);
};

exports.clearPolicyAlias = function(user, tenant, policy)
{
	return rawCreatePolicy(user, tenant, policy, null, null, null, null, '');
};

exports.getPolicyAll = function(user, tenant, service, policy)
{
	return rawGetPolicyAll(user, tenant, service, policy);
};

exports.checkPolicy = function(policy, resource, action)
{
	return rawCheckPolicy(policy, resource, action);
};

exports.incDecPolicyReference = function(policy, increment)
{
	var	dkcobj	= k2hdkc(dkcconf, dkcport, dkccuk, true, false);				// use permanent object(need to clean)
	var	result	= rawIncDecReferenceCount(dkcobj, policy, increment);
	dkcobj.clean();
	return result;
};

//---------------------------------------------------------
// Keystone Endpoint
//---------------------------------------------------------
exports.setKeystoneEndpointAll = function(region, endpoint_uri, type, last_status_code)
{
	return rawCreateKeystoneEndpoint(region, endpoint_uri, type, last_status_code);
};

exports.removeKeystoneEndpoint = function(region)
{
	return rawRemoveKeystoneEndpoint(region);
};

exports.updateKeystoneEndpointUrl = function(region, endpoint_uri, type)
{
	return rawCreateKeystoneEndpoint(region, endpoint_uri, type, '');
};

exports.updateKeystoneEndpointStatus = function(region, last_status_code)
{
	return rawCreateKeystoneEndpoint(region, null, null, last_status_code);
};

exports.updateMultiKeystoneEndpointStatus = function(epmap)
{
	return rawUpdateMultiKeystoneEndpointStatus(epmap);
};

exports.getKeystoneEndpointAll = function()
{
	return rawGetKeystoneEndpoints(null);
};

exports.getKeystoneEndpoint = function(region)
{
	return rawGetKeystoneEndpoints(region);
};

//---------------------------------------------------------
// Children List
//---------------------------------------------------------
exports.getChildrenList = function(tenant, service, type, path, is_expand)
{
	return rawGetChildrenList(tenant, service, type, path, is_expand);
};

//---------------------------------------------------------
// Utility for initializing
//---------------------------------------------------------
exports.initKeyHierarchy = function(dkcobj_permanent)
{
	return rawInitKeyHierarchy(dkcobj_permanent);
};

//---------------------------------------------------------
// Utility for k2hdkc
//---------------------------------------------------------
exports.getK2hdkc = function(autorejoin, no_giveup_rejoin)
{
	if(null === dkcconf || null === dkcport){
		r3logger.elog('Configuration is not set.');
		return null;
	}

	var	dkcobj = k2hdkc(dkcconf, dkcport, dkccuk, autorejoin, no_giveup_rejoin);
	if(!rawInitKeyHierarchy(dkcobj)){
		r3logger.elog('Not initialize yet.');
		dkcobj.clean();
		return null;
	}
	return dkcobj;
};

//---------------------------------------------------------
// Get All tenant name list
//---------------------------------------------------------
exports.getAllTenants = function()
{
	var	keys		= r3keys();
	var	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);
	if(!rawInitKeyHierarchy(dkcobj)){
		dkcobj.clean();
		return null;
	}
	var	tenantlist	= dkcobj.getSubkeys(keys.NO_SERVICE_REGION_KEY, true);
	dkcobj.clean();

	if(tenantlist instanceof Array && 0 < tenantlist.length){
		// cut NO_SERVICE_TENANT_KEY
		for(var cnt = 0; cnt < tenantlist.length; ++cnt){
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
};

//---------------------------------------------------------
// Get All Service name list
//---------------------------------------------------------
exports.getAllServices = function()
{
	var	keys		= r3keys();
	var	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);
	if(!rawInitKeyHierarchy(dkcobj)){
		dkcobj.clean();
		return null;
	}
	var	servicelist	= dkcobj.getSubkeys(keys.MASTER_SERVICE_TOP_KEY, true);
	dkcobj.clean();

	if(servicelist instanceof Array && 0 < servicelist.length){
		return servicelist;
	}else{
		return null;
	}
};

//---------------------------------------------------------
// Get All user list
//---------------------------------------------------------
exports.getAllUsers = function()
{
	var	keys		= r3keys();
	var	dkcobj		= k2hdkc(dkcconf, dkcport, dkccuk, true, false);
	if(!rawInitKeyHierarchy(dkcobj)){
		dkcobj.clean();
		return null;
	}
	var	tenantlist	= dkcobj.getSubkeys(keys.USER_TOP_KEY, true);
	dkcobj.clean();

	if(tenantlist instanceof Array && 0 < tenantlist.length){
		return tenantlist;
	}else{
		return null;
	}
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
