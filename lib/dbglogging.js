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

'use strict';

var util	= require('util');
var	apiutil	= require('./k2hr3apiutil');

//---------------------------------------------------------
// NODE_DEBUG Environment Values
//---------------------------------------------------------
const dbgLevelMap = {
	'LOGLEVEL_DEBUG':	4,
	'LOGLEVEL_DBG':		4,
	'LOGLEVEL_INFO':	3,
	'LOGLEVEL_MESSAGE':	3,
	'LOGLEVEL_MSG':		3,
	'LOGLEVEL_WARNING':	2,
	'LOGLEVEL_WARN':	2,
	'LOGLEVEL_WAN':		2,
	'LOGLEVEL_ERROR':	1,
	'LOGLEVEL_ERR':		1,
	'LOGLEVEL_SILENT':	0,
	'LOGLEVEL_SLT':		0
};

const levelDbg		= 4;
const levelInfo		= 3;
const levelWarn		= 2;
const levelErr		= 1;
const levelSilent	= 0;

//---------------------------------------------------------
// Logging Level
//---------------------------------------------------------
var	currentLevel = levelErr;
var	customLevels = [];

(function()
{
	var	dbgEnvs = apiutil.getSafeString(process.env.NODE_DEBUG).split(',');

	dbgEnvs.forEach(function(key)
	{
		var	upperKey = key.toUpperCase();
		if(apiutil.isSafeEntity(dbgLevelMap[upperKey])){
			if(levelSilent == dbgLevelMap[upperKey]){
				// default level is error. if specify silent, we must set silent.
				currentLevel = levelSilent;
			}else if(currentLevel < dbgLevelMap[upperKey]){
				currentLevel = dbgLevelMap[upperKey];
			}
		}else if(!apiutil.findStringInArray(customLevels, upperKey)){
			customLevels.push(upperKey);
		}
	});
}());

function getCurrentInfo()
{
	try{
		throw new Error('INTERNAL_EXCEPTION_FOR_DEBUG');
	}catch(exception){
		var basedir	= __dirname.replace(/lib$/g, '');
		var curstr	= exception.stack.split(/[\r\n]+/).filter(function(val1)
		{
			return /^ *at .*:[0-9]+:[0-9]+/.test(val1);
		})[2];
		return curstr.replace(/^ *at /g, '').replace(new RegExp(basedir, 'g'), '').replace(/.*\(/g, '').replace(/\)$/g, '').replace(/:[0-9]+$/g, '').replace(/:/g, '(') + ')';
	}
}

exports.dlog = function()
{
	if(levelDbg <= currentLevel){
		// [NOTE]
		// We want to use stack trace, thus using console.warn instead of console.debug method.
		//
		console.warn('[DEBUG] ' + getCurrentInfo(), util.format.apply(util, arguments));
	}
};

exports.mlog = function()
{
	if(levelInfo <= currentLevel){
		// [NOTE]
		// We want to use stack trace, thus using console.warn instead of console.info method.
		//
		console.warn('[INFO] ' + getCurrentInfo(), util.format.apply(util, arguments));
	}
};

exports.wlog = function()
{
	if(levelWarn <= currentLevel){
		console.warn('[WARN] ' + getCurrentInfo(), util.format.apply(util, arguments));
	}
};

exports.elog = function()
{
	if(levelErr <= currentLevel){
		console.error('[ERROR] ' + getCurrentInfo(), util.format.apply(util, arguments));
	}
};

exports.clog = function(section)
{
	if(apiutil.isSafeString(section) && apiutil.findStringInArray(customLevels, section.toUpperCase())){
		// [NOTE]
		// We want to use stack trace, thus using console.warn instead of console.info method.
		//
		console.warn('[' + section.toUpperCase() + '] ' + getCurrentInfo(), util.format.apply(util, arguments));
	}
};

exports.dump = function(obj)
{
	if(levelDbg <= currentLevel){
		if(typeof obj === 'object'){
			return util.inspect(obj, {showHidden: true, depth: null, maxArrayLength: 1000});
		}
	}
	return obj;
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
