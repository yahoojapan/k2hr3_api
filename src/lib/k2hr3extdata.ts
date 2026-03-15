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

import	apiutil				from './k2hr3apiutil';
import	cryptutil			from './k2hr3cryptutil';
import	r3logger			from './dbglogging';
import	{ getK2hr3Keys }	from './k2hr3keys';
import	{ r3ApiConfig  }	from './k2hr3config';

import type	{ ExtDataItem, ConfigUserDataCrypt }	from './k2hr3config';
import type	{ valTypeR3Gzip }						from './k2hr3cryptutil';
import type	{ valTypeRoleInfo }						from './types';

const	apiConf	= new r3ApiConfig();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type LoadedExtdataObjsType = {
	configs:		Record<string, ExtDataItem & { contents?: string | null }>;
	cryptconfig:	ConfigUserDataCrypt | null;
	kw_role_name:	RegExp;
	kw_role_tenant:	RegExp;
	kw_role_token:	RegExp;
	kw_api_uri:		RegExp;
	kw_err_msg:		RegExp;
};

//---------------------------------------------------------
// load userdata templates from config directory
//---------------------------------------------------------
const LoadedExtdataObjs: LoadedExtdataObjsType = (() => {
	const extdataobjs: LoadedExtdataObjsType = {
		configs: 		{},
		cryptconfig:	null,
		kw_role_name:	/{{= %K2HR3_ROLE_NAME% }}/g,		// Role YRN full path
		kw_role_tenant:	/{{= %K2HR3_ROLE_TENANT% }}/g,		// Tenant YRN full path
		kw_role_token:	/{{= %K2HR3_ROLE_TOKEN% }}/g,		// Role Token
		kw_api_uri:		/{{= %K2HR3_API_HOST_URI% }}/g,		// K2HR3 API server URI(ex. https://localhost:3000)
		kw_err_msg:		/{{= %K2HR3_ERROR_MSG% }}/g			// Error message string when something error occured
	};

	if(0 < apiConf.getExtdataConfigCount()){
		extdataobjs.configs	= apiConf.getAllExtdataConfig();
		Object.keys(extdataobjs.configs).forEach(key => {
			if(apiutil.isPlainObject(extdataobjs.configs[key]) && apiutil.isSafeString(extdataobjs.configs[key].template)){
				extdataobjs.configs[key].contents = apiutil.readFileContents(extdataobjs.configs[key].template);
			}
		});
	}
	extdataobjs.cryptconfig	= apiConf.getUserdataCryptConfig();

	return extdataobjs;
})();

//---------------------------------------------------------
// Userdata Processing Class
//---------------------------------------------------------
class ExtdataProcess {
	private _extdataObjs: LoadedExtdataObjsType;

	//
	// Constructor
	//
	constructor() {
		this._extdataObjs = LoadedExtdataObjs;
	}

	//
	// Methods
	//
	checkSuburi = (key?: string | null): boolean => {
		if(!apiutil.isSafeString(key)){
			r3logger.elog('key parameter is empty.');
			return false;
		}
		return apiutil.isSafeEntity(this._extdataObjs.configs[key]);
	};

	checkUserAgent = (
		agent:	string,
		key:	string
	): boolean => {
		if(!apiutil.isSafeString(agent)){
			r3logger.elog('agent and key parameters are empty.');
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

	getContentType = (key: string): string | null => {
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
	decryptRoleInfo = (str?: string | null): valTypeRoleInfo | null => {
		if(!apiutil.isSafeString(str)){
			r3logger.elog('string parameter is empty.');
			return null;
		}
		if(!apiutil.isSafeEntity(this._extdataObjs.cryptconfig)){
			r3logger.elog('cryptconfig data is empty.');
			return null;
		}
		const rawData = cryptutil.r3DecryptJSON(str, this._extdataObjs.cryptconfig.passphrase, this._extdataObjs.cryptconfig.algorithm);
		if(!apiutil.isValTypeRoleInfo(rawData)){
			return null;
		}
		return rawData;
	};

	getExtdata = (roleobj: valTypeRoleInfo, key: string): string | null => {
		let	rolename	= '';
		let	roletenant	= '';
		let	roletoken	= '';
		let	contents	= '';
		let	baseuri		= '';
		let	errorMsg	= '';

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
			rolename	= apiutil.getSafeString(roleobj.role);
			roletoken	= apiutil.getSafeString(roleobj.token);

			// Extract tenant yrn full path from role yrn full path
			const	keys	= getK2hr3Keys();
			const	roleptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
			const	matches	= rolename.match(roleptn);
			if(apiutil.isNotEmptyArray(matches) && 4 <= matches.length && apiutil.isSafeString(matches[2])){
				roletenant	= keys.NO_SERVICE_KEY + apiutil.getSafeString(matches[1]) + '::' + apiutil.getSafeString(matches[2]);
			}
		}
		if(apiutil.isSafeEntity(this._extdataObjs.configs[key])){
			const	config = this._extdataObjs.configs[key];
			if(apiutil.isPlainObject(config)){
				if(apiutil.isSafeString(config.contents)){
					contents = config.contents;
				}
				if(apiutil.isSafeString(config.baseuri)){
					baseuri = config.baseuri;
				}
			}
		}

		//-----------------
		// expands templates
		//-----------------
		let	result: string | null	= null;
		if(apiutil.isSafeString(contents)){
			result = contents
				.replace(this._extdataObjs.kw_role_name,	rolename)
				.replace(this._extdataObjs.kw_role_tenant,	roletenant)
				.replace(this._extdataObjs.kw_role_token,	roletoken)
				.replace(this._extdataObjs.kw_api_uri,		baseuri)
				.replace(this._extdataObjs.kw_err_msg,		errorMsg);
		}
		return result;
	};

	getGzipExtdata = (roleobj: valTypeRoleInfo, key: string): valTypeR3Gzip | null => {
		// get expanded data
		const	expanded = this.getExtdata(roleobj, key);
		return (cryptutil.r3Gzip(expanded) ?? null);
	};
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Class
//
const extdataProcess = ExtdataProcess;

export default extdataProcess;

//
// Variables
//
export {
	LoadedExtdataObjsType
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
