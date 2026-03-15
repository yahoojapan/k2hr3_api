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
 * CREATE:   Tue Oct 2 2018
 * REVISION:
 *
 */

import	apiutil				from './k2hr3apiutil';
import	cryptutil			from './k2hr3cryptutil';
import	r3logger			from './dbglogging';
import	{ getK2hr3Keys }	from './k2hr3keys';

import type	{ valTypeR3Gzip, cbTypeR3Gzip }	from './k2hr3cryptutil';
import type	{ valTypeRoleInfo, valTypeMultipartBoundaries, valTypeMultipartResult }	from './types';

import	{ r3ApiConfig }		from './k2hr3config';
const	apiConf	= new r3ApiConfig();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type LoadedUserdataTemplatesType = {
	cloud_config:		string | null;
	init_script:		string | null;
	init_err_script:	string | null;
	kw_role_name:		RegExp;
	kw_role_tenant:		RegExp;
	kw_role_token:		RegExp;
	kw_api_uri:			RegExp;
	kw_err_msg:			RegExp;
	baseuri?:			string;
	algorithm?:			string;
	passphrase?:		string;
	default_script:		string;
};

//---------------------------------------------------------
// Empty script for error
//---------------------------------------------------------
const EmptyScriptContents: string = [
	'#!/bin/sh',
	'#',
	'# K2HR3 Frontend Web Application',
	'#',
	'# Copyright(C) 2018 Yahoo Japan Corporation.',
	'#',
	'# K2HR3 is K2hdkc based Resource and Roles and policy Rules, gathers',
	'# common management information for the cloud.',
	'# K2HR3 can dynamically manage information as "who", "what", "operate".',
	'# These are stored as roles, resources, policies in K2hdkc, and the',
	'# client system can dynamically read and modify these information.',
	'#',
	'# For the full copyright and license information, please view',
	'# the license file that was distributed with this source code.',
	'#',
	'# AUTHOR:   Takeshi Nakatani',
	'# CREATE:   Tue Oct 2 2018',
	'# REVISION:',
	'#',
	'',
	'SCRIPTNAME="k2hr3-init"',
	'LOGFILE="/var/log/${SCRIPTNAME}.log"',
	'',
	'echo "`date "+%Y-%m-%d %H:%M:%S,%3N"` - ${SCRIPTNAME}[ERROR]: Invalid userdata for creating k2hr3-init script was specified(detail error = {{= %K2HR3_ERROR_MSG% }})" | tee -a ${LOGFILE}',
	'exit 1',
	'',
	'#',
	'# VIM modelines',
	'#',
	'# vim:set ts=4 fenc=utf-8:',
	'#'
].join('\n');

//---------------------------------------------------------
// load userdata templates from config directory
//---------------------------------------------------------
const LoadedUserdataTemplates: LoadedUserdataTemplatesType = (() => {
	const templates: LoadedUserdataTemplatesType = {
		cloud_config:		null,
		init_script:		null,
		init_err_script:	null,
		kw_role_name:		/{{= %K2HR3_ROLE_NAME% }}/g,		// Role YRN full path
		kw_role_tenant:		/{{= %K2HR3_ROLE_TENANT% }}/g,		// Tenant YRN full path
		kw_role_token:		/{{= %K2HR3_ROLE_TOKEN% }}/g,		// Role Token
		kw_api_uri:			/{{= %K2HR3_API_HOST_URI% }}/g,		// K2HR3 API server URI(ex. https://localhost:3000)
		kw_err_msg:			/{{= %K2HR3_ERROR_MSG% }}/g,		// Error message string when something error occured
		default_script:		EmptyScriptContents,
	};

	const userdatacfgobj = apiConf.getUserdataConfig();

	if(apiutil.isSafeEntity(userdatacfgobj)){
		templates.baseuri			= apiutil.getSafeString(userdatacfgobj.baseuri);
		templates.algorithm			= apiutil.getSafeString(userdatacfgobj.algorithm);
		templates.passphrase		= apiutil.getSafeString(userdatacfgobj.passphrase);
		templates.cloud_config		= apiutil.readFileContents(userdatacfgobj.cc_templ);
		templates.init_script		= apiutil.readFileContents(userdatacfgobj.script_templ);
		templates.init_err_script	= apiutil.readFileContents(userdatacfgobj.errscript_templ);
	}else{
		templates.baseuri			= '';
		templates.algorithm			= '';
		templates.passphrase		= '';
		templates.cloud_config		= null;
		templates.init_script		= null;
		templates.init_err_script	= null;
	}
	return templates;
})();

//---------------------------------------------------------
// Userdata Processing Class
//---------------------------------------------------------
class UserdataProcess {
	private _userdataTemplates: LoadedUserdataTemplatesType;

	//
	// Constructor
	//
	constructor() {
		this._userdataTemplates = LoadedUserdataTemplates;
	};

	//
	// Methods
	//
	encryptRoleInfo = (obj: unknown): string | null => {
		if(!apiutil.isSafeEntity(obj)){
			r3logger.elog('role information object parameter is empty.');
			return null;
		}
		return cryptutil.r3EncryptJSON(obj, (apiutil.isSafeString(this._userdataTemplates.passphrase) ? this._userdataTemplates.passphrase : null), (apiutil.isSafeString(this._userdataTemplates.algorithm) ? this._userdataTemplates.algorithm : null));
	};

	decryptRoleInfo = (str: string | null): valTypeRoleInfo | null => {
		if(!apiutil.isSafeString(str)){
			r3logger.elog('string parameter is empty.');
			return null;
		}
		const rawData = cryptutil.r3DecryptJSON(str, this._userdataTemplates.passphrase, this._userdataTemplates.algorithm);
		if(!apiutil.isValTypeRoleInfo(rawData)){
			return null;
		}
		return rawData;
	};

	getMultipartUserdata = (
		roleobj:	valTypeRoleInfo,
		errorMsg:	string | null
	): valTypeMultipartResult => {

		let	rolename	= '';
		let	roletenant	= '';
		let	roletoken	= '';
		if(!apiutil.isSafeString(errorMsg)){
			errorMsg	= null;
		}
		if(!apiutil.isPlainObject(roleobj)){
			r3logger.elog('role object(role name, role token) parameter is empty.');
			if(!errorMsg){
				errorMsg = 'k2hr3 role information is wrong';
			}
		}else if(!apiutil.isSafeString(roleobj.role)){
			r3logger.elog('role name parameter is empty.');
			if(!errorMsg){
				errorMsg = 'k2hr3 role name is empty';
			}
		}else if(!apiutil.isSafeString(roleobj.token)){
			r3logger.elog('role token parameter is empty.');
			if(!errorMsg){
				errorMsg = 'k2hr3 role token is empty';
			}
		}else{
			rolename	= apiutil.getSafeString(roleobj.role);
			roletoken	= apiutil.getSafeString(roleobj.token);

			// Extract tenant yrn full path from role yrn full path
			const	keys	= getK2hr3Keys();
			const	roleptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
			const	matches	= rolename.match(roleptn);
			if(apiutil.isNotEmptyArray(matches) && 4 <= matches.length && apiutil.isSafeString(matches[2])){
				roletenant = keys.NO_SERVICE_KEY + apiutil.getSafeString(matches[1]) + '::' + apiutil.getSafeString(matches[2]);
			}
		}

		//-----------------
		// expands templates
		//-----------------
		const	config						= this._userdataTemplates.cloud_config;		// cloud-config does not have keywords, then no-replacing.
		let		script: string | null		= null;
		let		errscript: string | null	= null;
		let		defscript					= this._userdataTemplates.default_script;
		if(this._userdataTemplates.init_script){
			script = this._userdataTemplates.init_script.replace(this._userdataTemplates.kw_role_name, rolename);
			script = script.replace(this._userdataTemplates.kw_role_tenant, roletenant);
			script = script.replace(this._userdataTemplates.kw_role_token, roletoken);
			script = script.replace(this._userdataTemplates.kw_api_uri, apiutil.getSafeString(this._userdataTemplates.baseuri));
			if(errorMsg){
				// [NOTE]
				// Normally, you'll use a script for error, so this process will be wasted.
				// However, there are cases where this keyword is specified in the template,
				// so we will replace it.
				//
				script = script.replace(this._userdataTemplates.kw_err_msg, errorMsg);
			}else{
				script = script.replace(this._userdataTemplates.kw_err_msg, '');
			}
		}
		if(this._userdataTemplates.init_err_script){
			errscript = this._userdataTemplates.init_err_script.replace(this._userdataTemplates.kw_role_name, rolename);
			errscript = errscript.replace(this._userdataTemplates.kw_role_token, roletoken);
			errscript = errscript.replace(this._userdataTemplates.kw_role_tenant, roletenant);
			errscript = errscript.replace(this._userdataTemplates.kw_api_uri, apiutil.getSafeString(this._userdataTemplates.baseuri));
			if(errorMsg){
				errscript = errscript.replace(this._userdataTemplates.kw_err_msg, errorMsg);
			}else{
				errscript = errscript.replace(this._userdataTemplates.kw_err_msg, '');
			}
		}
		if(!config && !script){
			r3logger.wlog('k2hr3-init and error script template is not specified.');
			if(!errorMsg){
				errorMsg = 'no script is set';
			}
		}
		if(errorMsg){
			defscript = defscript.replace(this._userdataTemplates.kw_err_msg, errorMsg);
		}

		//-----------------
		// make part type array
		//-----------------
		const	parts: valTypeMultipartBoundaries = [];					// member object is {type: 'contents-type string', filename: 'filename', contents: '...'}
		if(errorMsg){
			if(!errscript){
				parts.push({type: 'text/x-shellscript', filename: 'k2hr3-init-empty.sh', contents: defscript});
			}else{
				parts.push({type: 'text/x-shellscript', filename: 'k2hr3-init-error.sh', contents: errscript});
			}
		}else if(config && script){
			parts.push({type: 'text/cloud-config', filename: 'k2hr3-cloud-config.txt', contents: config});
			parts.push({type: 'text/x-shellscript', filename: 'k2hr3-init.sh', contents: script});
		}else if(config && !script){
			parts.push({type: 'text/cloud-config', filename: 'k2hr3-cloud-config.txt', contents: config});
		}else if(!config && script){
			parts.push({type: 'text/x-shellscript', filename: 'k2hr3-init.sh', contents: script});
		}else{	// !config && !script
			parts.push({type: 'text/x-shellscript', filename: 'k2hr3-init-empty.sh', contents: defscript});
		}

		//-----------------
		// make multipart
		//-----------------
		const	boundary	= '================K2HR3INIT' + Date.now().toString() + '==';
		const	result: valTypeMultipartResult = {
			body:		'',
			type:		'multipart/mixed; boundary="' + boundary + '"',
			mimeverkey:	'MIME-Version',
			mimeverval:	'1.0',
			partcntkey:	'Number-Attachments',
			partcntval:	parts.length
		};

		// fill parts
		for(let cnt = 0; cnt < parts.length; ++cnt){
			// part header
			result.body += '--' + boundary + '\r\n';
			result.body += 'MIME-Version: 1.0\r\n';
			result.body += 'Content-Type: ' + parts[cnt].type + '; charset="us-ascii"\r\n';
			result.body += 'Content-Transfer-Encoding: 7bit\r\n';
			result.body += 'Content-Disposition: attachment; filename="' + parts[cnt].filename + '"\r\n\r\n';

			// part contents
			result.body += parts[cnt].contents;
			result.body += '\r\n';
		}

		// make footer
		result.body += '--' + boundary + '--\r\n';

		return result;
	};

	getGzipMultipartUserdata = (
		roleobj:	valTypeRoleInfo,
		errorMsg:	string | null,
		callback?:	cbTypeR3Gzip
	): valTypeR3Gzip | null | void => {

		// get multipart headers and body
		const	multipartobj= this.getMultipartUserdata(roleobj, errorMsg);

		// make one string
		let	multipart	=  '';
		multipart		+= 'Content-Type: ' + multipartobj.type + '\r\n';
		multipart		+= multipartobj.mimeverkey + ': ' + multipartobj.mimeverval + '\r\n';
		multipart		+= multipartobj.partcntkey + ': ' + multipartobj.partcntval + '\r\n\r\n';
		multipart		+= multipartobj.body;

		return cryptutil.r3Gzip(multipart, callback);
	};
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Class
//
export const userdataProcess = UserdataProcess;

export default userdataProcess;

//
// Variables
//
export {
	LoadedUserdataTemplatesType
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
