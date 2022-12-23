/*
 * K2HR3 REST API
 *
 * Copyright 2018 Yahoo Japan Corporation.
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
 * CREATE:   Tue May 13 2020
 * REVISION:
 *
 */

'use strict';

var	apiutil		= require('./k2hr3apiutil');
var	cryptutil	= require('./k2hr3cryptutil');
var	r3Conf		= require('./k2hr3config').r3ApiConfig;
var	r3keys		= require('./k2hr3keys').getK2hr3Keys;
var	apiConf		= new r3Conf();

// Debug logging objects
var r3logger	= require('./dbglogging');

//---------------------------------------------------------
// load userdata templates from config directory
//---------------------------------------------------------
var	LoadedExtdataObjs = (function()
{
	var	extdataobjs = {
		configs:		{},
		cryptconfig:	null,
		kw_role_name:	/{{= %K2HR3_ROLE_NAME% }}/g,		// Role YRN full path
		kw_role_tenant:	/{{= %K2HR3_ROLE_TENANT% }}/g,		// Tenant YRN full path
		kw_role_token:	/{{= %K2HR3_ROLE_TOKEN% }}/g,		// Role Token
		kw_api_uri:		/{{= %K2HR3_API_HOST_URI% }}/g,		// K2HR3 API server URI(ex. https://localhost:3000)
		kw_err_msg:		/{{= %K2HR3_ERROR_MSG% }}/g			// Error message string when something error occured
	};

	if(0 < apiConf.getExtdataConfigCount()){
		extdataobjs.configs	= apiConf.getAllExtdataConfig();
		Object.keys(extdataobjs.configs).forEach(function(key){
			extdataobjs.configs[key].contents = apiutil.readFileContents(extdataobjs.configs[key].template);
		});
	}
	extdataobjs.cryptconfig	= apiConf.getUserdataCryptConfig();

	return extdataobjs;
}());

//---------------------------------------------------------
// Userdata Processing Class
//---------------------------------------------------------
var ExtdataProcess = (function()
{
	//
	// Constructor
	//
	var ExtdataProcess = function()
	{
		this._extdataObjs = LoadedExtdataObjs;
	};

	var proto = ExtdataProcess.prototype;

	//
	// Methods
	//
	proto.checkSuburi = function(key)
	{
		if(!apiutil.isSafeString(key)){
			r3logger.elog('key parameter is empty.');
			return false;
		}
		return apiutil.isSafeEntity(this._extdataObjs.configs[key]);
	};

	proto.checkUserAgent = function(agent, key)
	{
		if(!apiutil.isSafeString(agent)){
			r3logger.elog('agent parameter is empty.');
			return false;
		}
		if(!apiutil.isSafeEntity(this._extdataObjs.configs[key])){
			r3logger.elog('unkown key(suburi): ' + JSON.stringify(key));
			return false;
		}
		if(!apiutil.isSafeString(this._extdataObjs.configs[key].useragent)){
			// allow any useragent
			return true;
		}
		return apiutil.compareCaseString(agent, this._extdataObjs.configs[key].useragent);
	};

	proto.getContentType = function(key)
	{
		if(!apiutil.isSafeEntity(this._extdataObjs.configs[key])){
			r3logger.elog('unkown key(suburi): ' + JSON.stringify(key));
			return null;
		}
		if(!apiutil.isSafeString(this._extdataObjs.configs[key].contenttype)){
			return 'text/plain';
		}
		return apiutil.getSafeString(this._extdataObjs.configs[key].contenttype);
	};

	// [NOTE]
	// For the encryption of Role information, the passphrase and the
	// algorithm set in userdata are used in common.
	// Therefore, Extdata-only encryption is not required, and the
	// composite uses the configuratino information of userdata.
	//
	proto.decryptRoleInfo = function(str)
	{
		if(!apiutil.isSafeString(str)){
			r3logger.elog('string parameter is empty.');
			return null;
		}
		return cryptutil.r3DecryptJSON(str, this._extdataObjs.cryptconfig.passphrase, this._extdataObjs.cryptconfig.algorithm);
	};

	proto.getExtdata = function(roleobj, key)
	{
		var	rolename	= '';
		var	roletenant	= '';
		var	roletoken	= '';
		var	config		= null;
		var	errorMsg	= null;
		if(!apiutil.isSafeEntity(roleobj)){
			r3logger.elog('role object(role name, role token) parameter is empty.');
			errorMsg	= 'k2hr3 role information is wrong';
		}else if(!apiutil.isSafeString(roleobj.role)){
			r3logger.elog('role name parameter is empty.');
			errorMsg	= 'k2hr3 role name is empty';
		}else if(!apiutil.isSafeString(roleobj.token)){
			r3logger.elog('role token parameter is empty.');
			errorMsg	= 'k2hr3 role token is empty';
		}else{
			rolename	= roleobj.role;
			roletoken	= roleobj.token;

			// Extract tenant yrn full path from role yrn full path
			var	keys	= r3keys();
			var	roleptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
			var	matches	= rolename.match(roleptn);
			if(!apiutil.isEmptyArray(matches) && 4 <= matches.length && apiutil.isSafeString(matches[2])){
				roletenant = keys.NO_SERVICE_KEY + apiutil.getSafeString(matches[1]) + '::' + apiutil.getSafeString(matches[2]);
			}
		}
		if(apiutil.isSafeEntity(this._extdataObjs.configs[key])){
			config		= this._extdataObjs.configs[key];
		}

		//-----------------
		// expands templates
		//-----------------
		var	result = null;
		if(apiutil.isSafeString(config.contents)){
			result = config.contents.replace(this._extdataObjs.kw_role_name, rolename);
			result = result.replace(this._extdataObjs.kw_role_tenant, roletenant);
			result = result.replace(this._extdataObjs.kw_role_token, roletoken);
			result = result.replace(this._extdataObjs.kw_api_uri, config.baseuri);
			result = result.replace(this._extdataObjs.kw_err_msg, errorMsg);
		}
		return result;
	};

	proto.getGzipExtdata = function(roleobj, key)
	{
		// get expanded data
		var	expanded = this.getExtdata(roleobj, key);

		return cryptutil.r3Gzip(expanded);
	};

	return ExtdataProcess;
})();

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.extdataProcess = ExtdataProcess;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
