/*
 * K2HR3 REST API
 *
 * Copyright 2018 Yahoo! Japan Corporation.
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

'use strict';

var	apiutil		= require('./k2hr3apiutil');
var	cryptutil	= require('./k2hr3cryptutil');
var	r3Conf		= require('./k2hr3config').r3ApiConfig;
var	apiConf		= new r3Conf();

// Debug logging objects
var r3logger	= require('./dbglogging');

//---------------------------------------------------------
// Empty script for error
//---------------------------------------------------------
var	EmptyScriptContents = [
	'#!/bin/sh',
	'#',
	'# K2HR3 Frontend Web Application',
	'#',
	'# Copyright(C) 2018 Yahoo! Japan Corporation.',
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
var	LoadedUserdataTemplates = (function()
{
	var	templates = {
		cloud_config:		null,
		init_script:		null,
		init_err_script:	null,
		kw_role_name:		'{{= %K2HR3_ROLE_NAME% }}',
		kw_role_token:		'{{= %K2HR3_ROLE_TOKEN% }}',
		kw_api_uri:			'{{= %K2HR3_API_HOST_URI% }}',
		kw_err_msg:			'{{= %K2HR3_ERROR_MSG% }}'
	};

	var	userdatacfgobj = apiConf.getUserdataConfig();

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
	templates.default_script		= EmptyScriptContents;

	return templates;
}());

//---------------------------------------------------------
// Userdata Processing Class
//---------------------------------------------------------
var UserdataProcess = (function()
{
	//
	// Constructor
	//
	var UserdataProcess = function()
	{
		this._userdataTemplates = LoadedUserdataTemplates;
	};

	var proto = UserdataProcess.prototype;

	//
	// Methods
	//
	proto.encryptRoleInfo = function(obj)
	{
		if(!apiutil.isSafeEntity(obj)){
			r3logger.elog('role information object parameter is empty.');
			return null;
		}
		return cryptutil.r3EncryptJSON(obj, this._userdataTemplates.passphrase, this._userdataTemplates.algorithm);
	};

	proto.decryptRoleInfo = function(str)
	{
		if(!apiutil.isSafeString(str)){
			r3logger.elog('string parameter is empty.');
			return null;
		}
		return cryptutil.r3DecryptJSON(str, this._userdataTemplates.passphrase, this._userdataTemplates.algorithm);
	};

	proto.getMultipartUserdata = function(roleobj, errorMsg)
	{
		var	rolename	= '';
		var	roletoken	= '';
		if(!apiutil.isSafeString(errorMsg)){
			errorMsg	= null;
		}
		if(!apiutil.isSafeEntity(roleobj)){
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
			rolename	= roleobj.role;
			roletoken	= roleobj.token;
		}

		//-----------------
		// expands templates
		//-----------------
		var	config		= this._userdataTemplates.cloud_config;		// cloud-config does not have keywords, then no-replacing.
		var	script		= null;
		var	errscript	= null;
		var	defscript	= this._userdataTemplates.default_script;
		if(this._userdataTemplates.init_script){
			script = this._userdataTemplates.init_script.replace(this._userdataTemplates.kw_role_name, rolename);
			script = script.replace(this._userdataTemplates.kw_role_token, roletoken);
			script = script.replace(this._userdataTemplates.kw_api_uri, this._userdataTemplates.baseuri);
		}
		if(this._userdataTemplates.init_err_script){
			errscript = this._userdataTemplates.init_err_script.replace(this._userdataTemplates.kw_role_name, rolename);
			errscript = errscript.replace(this._userdataTemplates.kw_role_token, roletoken);
			errscript = errscript.replace(this._userdataTemplates.kw_api_uri, this._userdataTemplates.baseuri);
			if(errorMsg){
				errscript = errscript.replace(this._userdataTemplates.kw_err_msg, errorMsg);
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
		var	parts = new Array();									// member object is {type: 'contents-type string', filename: 'filename', contents: '...'}
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
		var	boundary	= '================K2HR3INIT' + Date.now().toString() + '==';
		var	result		= {
			body:		'',
			type:		null,
			mimeverkey:	'MIME-Version',
			mimeverval:	'1.0',
			partcntkey:	'Number-Attachments',
			partcntval:	parts.length
		};
		result.body		= '';
		result.type		= 'multipart/mixed; boundary="' + boundary + '"';

		// fill parts
		for(var cnt = 0; cnt < parts.length; ++cnt){
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

	proto.getGzipMultipartUserdata = function(roleobj, errorMsg, callback)
	{
		var	_callback = null;
		if(apiutil.isSafeEntity(callback)){
			_callback = callback;
		}
		// get multipart headers and body
		var	multipartobj= this.getMultipartUserdata(roleobj, errorMsg);

		// make one string
		var	multipart	=  '';
		multipart		+= 'Content-Type: ' + multipartobj.type + '\r\n';
		multipart		+= multipartobj.mimeverkey + ': ' + multipartobj.mimeverval + '\r\n';
		multipart		+= multipartobj.partcntkey + ': ' + multipartobj.partcntval + '\r\n\r\n';
		multipart		+= multipartobj.body;

		return cryptutil.r3Gzip(multipart, _callback);
	};

	return UserdataProcess;
})();

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.userdataProcess = UserdataProcess;

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
