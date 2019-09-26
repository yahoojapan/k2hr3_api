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
 * CREATE:   Tue Oct 23 2018
 * REVISION:
 *
 */

'use strict';

var	util			= require('util');
var	dateformat		= require('dateformat');

var	apiutil			= require('./k2hr3apiutil');
var	k2hr3			= require('./k2hr3dkc');
var	r3Conf			= require('./k2hr3config').r3ApiConfig;
var	apiConf			= new r3Conf();
var chkipconfigType	= require('./k2hr3config').chkipType;

// Debug logging objects
var r3logger	= require('./dbglogging');

//---------------------------------------------------------
// Checking IP Addresses configuration
//---------------------------------------------------------
var	localchkipconfig = {
	type:			chkipconfigType.CHECKER_TYPE_LISTENER,	// Listener / Function / Basic{Or|And} / NoCheck
	funcmod:		null,									// Module name(path) for Function type
	pendingsec:		864000,									// Limit for removing IP which is not alive         : 10 * 24 * 60 * 60   = 10 days
	intervalms:		4320000,								// Interval ms for checking IP address              : 12 * 60 * 60 * 1000 = 12 hour
	parallelcnt:	32,										// Parallel processing count
	command4:		'ping',									// Basic IP address check use this command for IPv4 : ping command
	command6:		'ping6',								// Basic IP address check use this command for IPv6
	params:			'-c 1',									// Common ping command parameters
	timeoutparam:	'-W',									// Timeout parameter name for ping command
	timeoutms:		5000									// Timeout millisecond for each checking            : 5000ms
};

(function()
{
	var	chkipconfig = apiConf.getCheckIPConfig();

	if(apiutil.isSafeEntity(chkipconfig)){
		if(apiutil.compareCaseString(chkipconfig.type, chkipconfigType.CHECKER_TYPE_LISTENER)){
			localchkipconfig.type			= chkipconfigType.CHECKER_TYPE_LISTENER;
			localchkipconfig.funcmod		= null;
		}else if(apiutil.compareCaseString(chkipconfig.type, chkipconfigType.CHECKER_TYPE_FUNCTION)){
			if(apiutil.isSafeString(chkipconfig.funcmod)){
				localchkipconfig.type		= chkipconfigType.CHECKER_TYPE_FUNCTION;
				localchkipconfig.funcmod	= chkipconfig.funcmod;
			}else{
				r3logger.elog('config : chkipconfig.funcmod value is something wrong : ' + JSON.stringify(chkipconfig.funcmod));
				localchkipconfig.type		= chkipconfigType.CHECKER_TYPE_NOCHECK;
				localchkipconfig.funcmod	= null;
			}
		}else if(apiutil.compareCaseString(chkipconfig.type, chkipconfigType.CHECKER_TYPE_BASIC_OR) || apiutil.compareCaseString(chkipconfig.type, chkipconfigType.CHECKER_TYPE_BASIC_AND)){
			localchkipconfig.type			= apiutil.compareCaseString(chkipconfig.type, chkipconfigType.CHECKER_TYPE_BASIC_OR) ? chkipconfigType.CHECKER_TYPE_BASIC_OR : chkipconfigType.CHECKER_TYPE_BASIC_AND;
			localchkipconfig.funcmod		= null;

			if(apiutil.isSafeString(chkipconfig.command4)){
				localchkipconfig.command4	= chkipconfig.command4;
			}
			if(apiutil.isSafeString(chkipconfig.command6)){
				localchkipconfig.command6	= chkipconfig.command6;
			}
			if(apiutil.isSafeString(chkipconfig.params)){
				localchkipconfig.params		= chkipconfig.params;
			}
			if(apiutil.isSafeString(chkipconfig.timeoutparam)){
				localchkipconfig.timeoutparam= chkipconfig.timeoutparam;
			}
			if(apiutil.isSafeEntity(chkipconfig.timeoutms) && !isNaN(chkipconfig.timeoutms)){
				localchkipconfig.timeoutms	= parseInt(chkipconfig.timeoutms);
			}

		}else if(apiutil.compareCaseString(chkipconfig.type, chkipconfigType.CHECKER_TYPE_NOCHECK)){
			localchkipconfig.type			= chkipconfigType.CHECKER_TYPE_NOCHECK;
			localchkipconfig.funcmod		= null;
		}else if(apiutil.isSafeEntity(chkipconfig.type)){
			r3logger.elog('config : chkipconfig.type value is something wrong : ' + JSON.stringify(chkipconfig.type));
			localchkipconfig.type			= chkipconfigType.CHECKER_TYPE_NOCHECK;
			localchkipconfig.funcmod		= null;
		}

		if(apiutil.isSafeEntity(chkipconfig.pendingsec) && !isNaN(chkipconfig.pendingsec)){
			localchkipconfig.pendingsec		= chkipconfig.pendingsec;
		}
		if(apiutil.isSafeEntity(chkipconfig.intervalms) && !isNaN(chkipconfig.intervalms)){
			localchkipconfig.intervalms		= chkipconfig.intervalms;
		}
		if(apiutil.isSafeEntity(chkipconfig.parallelcnt) && !isNaN(chkipconfig.parallelcnt)){
			localchkipconfig.parallelcnt	= chkipconfig.parallelcnt;
		}
	}
}());

//---------------------------------------------------------
// Utilities: Check configuration
//---------------------------------------------------------
function rawGetType()
{
	return localchkipconfig.type;
}

function rawIsListenerType()
{
	return apiutil.compareCaseString(localchkipconfig.type, chkipconfigType.CHECKER_TYPE_LISTENER);
}

function rawIsBasicType()
{
	return (apiutil.compareCaseString(localchkipconfig.type, chkipconfigType.CHECKER_TYPE_BASIC_OR) || apiutil.compareCaseString(localchkipconfig.type, chkipconfigType.CHECKER_TYPE_BASIC_AND));
}

function rawIsBasicOrType()
{
	return apiutil.compareCaseString(localchkipconfig.type, chkipconfigType.CHECKER_TYPE_BASIC_OR);
}

function rawIsBasicAndType()
{
	return apiutil.compareCaseString(localchkipconfig.type, chkipconfigType.CHECKER_TYPE_BASIC_AND);
}

function rawIsFunctionType()
{
	return apiutil.compareCaseString(localchkipconfig.type, chkipconfigType.CHECKER_TYPE_FUNCTION);
}

function rawIsNocheckType()
{
	return apiutil.compareCaseString(localchkipconfig.type, chkipconfigType.CHECKER_TYPE_NOCHECK);
}

//---------------------------------------------------------
// Watcher Logging
//---------------------------------------------------------
var	loggingStream	= null;
var	loggingTimeForm	= null;

(function()
{
	var	r3Conf		= require('./k2hr3config').r3ApiConfig;
	var	apiConf		= new r3Conf();
	loggingStream	= apiConf.getWatcherLoggingStream(__dirname + '/..');
	loggingTimeForm	= apiConf.getWatcherTimeFormat();
}());

function rawWatcherLogging()
{
	loggingStream.write('[' + dateformat(new Date(), loggingTimeForm) + '] ' + util.format.apply(util, arguments) + '\n');
}

//---------------------------------------------------------
// Check Addresses Alive raw function
//---------------------------------------------------------
function rawWatchAddressesAliveEx(ipchecker, callback)
{
	var	_ipchecker	= ipchecker;
	var	_callback	= callback;

	if(!apiutil.isSafeEntity(_callback) || 'function' !== typeof _callback){
		r3logger.elog('callback is not function.');
		return;
	}
	if(!apiutil.isSafeEntity(_ipchecker) || 'function' !== typeof _ipchecker){
		_callback(true, new Error('ipchecker is not function'));											// fatal
		return;
	}

	//
	// make ip addresses list depending cuk
	//
	var	targetres = k2hr3.getAllIpDatasByCuk(true);															// Currently supports only openstack
	if(!apiutil.isSafeEntity(targetres) && apiutil.isSafeEntity(targetres.error)){
		_callback(false, new Error('failed getting IP addresses list depending cuk by ' + JSON.stringify(targetres.error)));
		return;
	}
	if(apiutil.isEmptyArray(targetres.data)){
		_callback(false, new Error('There is no IP address depending cuk'));
		return;
	}

	//
	// Check Addresses
	//
	ipchecker(targetres.data, localchkipconfig).then(function(res)
	{
		r3logger.dlog('after checking IP addresses : ' + JSON.stringify(res));

		if(apiutil.isSafeEntity(res) && !apiutil.isSafeEntity(res.error)){
			if(apiutil.isEmptyArray(res.data)){
				_callback(false, new Error('There is no IP address depending cuk after checking, why...'));
				return;
			}

			// remove/clear by result of checking
			var	result = k2hr3.removeIpAddressWithCuk(res.data, localchkipconfig.pendingsec, rawWatcherLogging);
			if(result){
				_callback(false, result);
			}else{
				// Succeed without error
				_callback(false, null);
			}
		}else{
			_callback(false, new Error('checking IP addresses returns error : ' + (apiutil.isSafeEntity(res) && apiutil.isSafeEntity(res.error) ? res.error.message : 'unknown')));
		}
	}).catch(function(error){
		_callback(true, new Error('checking IP addresses returns fatal error : ' + error.message));		// fatal
	});
}

//---------------------------------------------------------
// Addresses Alive Watcher
//---------------------------------------------------------
// This is watcher checking alive of IP addresses which are
// registered with CUK.
//
// This function uses Interval Loop, so that this is run as
// daemon process. The interval time is set in checkipconfig
// in config.
//
// The interval loop is getting all ip addresses with it's
// information from k2hdkc at first. Next this calls a function
// which is specified by configuration as checkipconfig in
// config files. Last this sets alive status and dead at time
// into k2hdkc for each IP addresses. Then if IP address is
// not alive and over pending time, it is removed from k2hdkc.
//
// The raw checker function can be specified by checkipconfig
// value, and default function is implemented by k2hr3. The
// default function checks IP address by checking DNS resolve
// and ping to it.
// The raw function name must be 'checkAddressesAlive'.
//
function rawWatchAddressesAlive(oneshotCB)
{
	var	_callback	= oneshotCB;

	//
	// Load checkAddressesAlive function
	//
	var	ipchecker = null;
	try{
		if(rawIsFunctionType()){
			ipchecker = require(localchkipconfig.funcmod).checkAddressesAlive;
		}else if(rawIsBasicType()){
			ipchecker = require('./basicipcheck').checkAddressesAlive;
		}else{
			// Nothing to do with interval
			return null;
		}
		if(!apiutil.isSafeEntity(ipchecker) || 'function' !== typeof ipchecker){
			r3logger.elog('could not load checkAddressesAlive function in : ' + (rawIsBasicType() ? './basicipcheck' : localchkipconfig.funcmod));
			return null;
		}
	}catch(error){
		r3logger.elog('could not load module : ' + (rawIsBasicType() ? './basicipcheck' : localchkipconfig.funcmod));
		return null;
	}

	if(apiutil.isSafeEntity(_callback) && 'function' == typeof _callback){
		//
		// one shot
		//
		rawWatchAddressesAliveEx(ipchecker, function(is_fatal, error)
		{
			var	result = true;
			if(is_fatal){
				r3logger.elog('Fatal error is occurred : ' + error.message);
				result = false;
			}else if(error){
				r3logger.wlog('Finished with messsage : ' + error.message);
			}else{
				r3logger.dlog('Finished without any error messsage');
			}
			_callback(result);
		});
		return null;
	}

	//
	// Set Interval
	//
	var	isFatalError	= false;
	var	isWorking		= false;
	var	checkInterval	= setInterval(function()
	{
		if(!isFatalError && !isWorking){
			isWorking = true;
			//
			// Checking
			//
			rawWatchAddressesAliveEx(ipchecker, function(is_fatal, error)
			{
				isWorking = false;

				if(is_fatal){
					r3logger.elog('Fatal error is occurred : ' + error.message);
					isFatalError = true;
				}else if(error){
					r3logger.dlog('Finished with messsage : ' + error.message);
				}else{
					r3logger.dlog('Finished without messsage');
				}
			});
		}
	}, localchkipconfig.intervalms);

	return checkInterval;
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.chkipType = chkipconfigType;

exports.chkipconfig = localchkipconfig;

exports.getType = function()
{
	return rawGetType();
};

exports.isListenerType = function()
{
	return rawIsListenerType();
};

exports.isBasicType = function()
{
	return rawIsBasicType();
};

exports.isBasicOrType = function()
{
	return rawIsBasicOrType();
};

exports.isBasicAndType = function()
{
	return rawIsBasicAndType();
};

exports.isFunctionType = function()
{
	return rawIsFunctionType();
};

exports.isNocheckType = function()
{
	return rawIsNocheckType();
};

exports.watchAddressesAlive = function(oneshotCB)
{
	return rawWatchAddressesAlive(oneshotCB);
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
