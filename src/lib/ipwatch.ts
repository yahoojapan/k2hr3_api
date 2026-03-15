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
 * CREATE:   Tue Oct 23 2018
 * REVISION:
 *
 */

import	* as util		from 'util';
import	dateformat		from 'dateformat';

import	apiutil			from './k2hr3apiutil';
import	k2hr3			from './k2hr3dkc';
import	r3logger		from './dbglogging';
import	basicipcheck	from './basicipcheck';

import	{ r3ApiConfig, chkipType, type	LoadedConfig }						from './k2hr3config';
import type	{ ipchkTypeAddressesAlivePromise, cbTypeCheckAddressesAlive }	from './basicipcheck';
import type	{ Writable }													from 'stream';
const	apiConf			= new r3ApiConfig();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Callbacks
//
type cbTypeWatchAddressesAliveEx	= (is_fatal: boolean, error?: Error | null) => void;
type cbTypeWatchAddressesAlive		= (result: boolean) => void;

//---------------------------------------------------------
// Checking IP Addresses configuration
//---------------------------------------------------------
const localchkipconfig: LoadedConfig['chkipconfig'] = {
	type:			chkipType.CHECKER_TYPE_LISTENER,	// Listener / Function / Basic{Or|And} / NoCheck
	funcmod:		null,								// Module name(path) for Function type
	pendingsec:		864000,								// Limit for removing IP which is not alive         : 10 * 24 * 60 * 60   = 10 days
	intervalms:		4320000,							// Interval ms for checking IP address              : 12 * 60 * 60 * 1000 = 12 hour
	parallelcnt:	32,									// Parallel processing count
	command4:		'ping',								// Basic IP address check use this command for IPv4 : ping command
	command6:		'ping6',							// Basic IP address check use this command for IPv6
	params:			'-c 1',								// Common ping command parameters
	timeoutparam:	'-W',								// Timeout parameter name for ping command
	timeoutms:		5000								// Timeout millisecond for each checking            : 5000ms
};

(() => {
	const	chkipconfig = apiConf.getCheckIPConfig();

	if(apiutil.isSafeEntity(chkipconfig)){
		if(apiutil.compareCaseString(chkipconfig.type, chkipType.CHECKER_TYPE_LISTENER)){
			localchkipconfig.type			= chkipType.CHECKER_TYPE_LISTENER;
			localchkipconfig.funcmod		= null;
		}else if(apiutil.compareCaseString(chkipconfig.type, chkipType.CHECKER_TYPE_FUNCTION)){
			if(apiutil.isSafeString(chkipconfig.funcmod)){
				localchkipconfig.type		= chkipType.CHECKER_TYPE_FUNCTION;
				localchkipconfig.funcmod	= chkipconfig.funcmod;
			}else{
				r3logger.elog('config : chkipconfig.funcmod value is something wrong : ' + JSON.stringify(chkipconfig.funcmod));
				localchkipconfig.type		= chkipType.CHECKER_TYPE_NOCHECK;
				localchkipconfig.funcmod	= null;
			}
		}else if(apiutil.compareCaseString(chkipconfig.type, chkipType.CHECKER_TYPE_BASIC_OR) || apiutil.compareCaseString(chkipconfig.type, chkipType.CHECKER_TYPE_BASIC_AND)){
			localchkipconfig.type			= apiutil.compareCaseString(chkipconfig.type, chkipType.CHECKER_TYPE_BASIC_OR) ? chkipType.CHECKER_TYPE_BASIC_OR : chkipType.CHECKER_TYPE_BASIC_AND;
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
			if(apiutil.isSafeNumber(chkipconfig.timeoutms)){
				localchkipconfig.timeoutms	= chkipconfig.timeoutms;
			}

		}else if(apiutil.compareCaseString(chkipconfig.type, chkipType.CHECKER_TYPE_NOCHECK)){
			localchkipconfig.type			= chkipType.CHECKER_TYPE_NOCHECK;
			localchkipconfig.funcmod		= null;
		}else if(apiutil.isSafeEntity(chkipconfig.type)){
			r3logger.elog('config : chkipconfig.type value is something wrong : ' + JSON.stringify(chkipconfig.type));
			localchkipconfig.type			= chkipType.CHECKER_TYPE_NOCHECK;
			localchkipconfig.funcmod		= null;
		}

		if(apiutil.isSafeNumber(chkipconfig.pendingsec)){
			localchkipconfig.pendingsec		= chkipconfig.pendingsec;
		}
		if(apiutil.isSafeNumber(chkipconfig.intervalms)){
			localchkipconfig.intervalms		= chkipconfig.intervalms;
		}
		if(apiutil.isSafeNumber(chkipconfig.parallelcnt)){
			localchkipconfig.parallelcnt	= chkipconfig.parallelcnt;
		}
	}
})();

//---------------------------------------------------------
// Utilities: Check configuration
//---------------------------------------------------------
const rawGetType = (): string => {
	return localchkipconfig.type;
};

const rawIsListenerType = (): boolean => {
	return apiutil.compareCaseString(localchkipconfig.type, chkipType.CHECKER_TYPE_LISTENER);
};

const rawIsBasicType = (): boolean => {
	return (apiutil.compareCaseString(localchkipconfig.type, chkipType.CHECKER_TYPE_BASIC_OR) || apiutil.compareCaseString(localchkipconfig.type, chkipType.CHECKER_TYPE_BASIC_AND));
};

const rawIsBasicOrType = (): boolean => {
	return apiutil.compareCaseString(localchkipconfig.type, chkipType.CHECKER_TYPE_BASIC_OR);
};

const rawIsBasicAndType = (): boolean => {
	return apiutil.compareCaseString(localchkipconfig.type, chkipType.CHECKER_TYPE_BASIC_AND);
};

const rawIsFunctionType = (): boolean => {
	return apiutil.compareCaseString(localchkipconfig.type, chkipType.CHECKER_TYPE_FUNCTION);
};

const rawIsNocheckType = (): boolean => {
	return apiutil.compareCaseString(localchkipconfig.type, chkipType.CHECKER_TYPE_NOCHECK);
};

//---------------------------------------------------------
// Watcher Logging
//---------------------------------------------------------
let	loggingStream: Writable | null	= null;
let	loggingTimeForm: string | null	= null;

(() => {
	loggingStream	= apiConf.getWatcherLoggingStream(__dirname + '/..');
	loggingTimeForm	= apiConf.getWatcherTimeFormat();
})();

const rawWatcherLogging = (...args: string[]): void => {
	const prefix = '[' + dateformat(new Date(), apiutil.isString(loggingTimeForm) ? loggingTimeForm : undefined) + '] ';
	if(apiutil.isPlainObject(loggingStream)){
		loggingStream.write(prefix + util.format(...args) + '\n');
	}
};

//---------------------------------------------------------
// Check Addresses Alive raw function
//---------------------------------------------------------
const rawWatchAddressesAliveEx = (
	ipchecker:	cbTypeCheckAddressesAlive | null,
	callback:	cbTypeWatchAddressesAliveEx | null
): void => {

	if(!apiutil.isSafeEntity(callback)){
		r3logger.elog('callback is not function.');
		return;
	}
	if(!apiutil.isSafeEntity(ipchecker)){
		callback(true, new Error('ipchecker is not function'));										// fatal
		return;
	}

	//
	// make ip addresses list depending cuk
	//
	const	targetres = k2hr3.getAllIpDatasByCuk(true);												// Currently supports only openstack
	if(apiutil.isSafeEntity(targetres.error)){
		callback(false, new Error('failed getting IP addresses list depending cuk by ' + JSON.stringify(targetres.error)));
		return;
	}
	if(!apiutil.isNotEmptyArray(targetres.data)){
		callback(false, new Error('There is no IP address depending cuk'));
		return;
	}

	//
	// Check Addresses
	//
	ipchecker(targetres.data, localchkipconfig).then((res: ipchkTypeAddressesAlivePromise): void => {
		r3logger.dlog('after checking IP addresses : ' + JSON.stringify(res));

		if(apiutil.isSafeEntity(res) && !apiutil.isSafeEntity(res.error)){
			if(!apiutil.isNotEmptyArray(res.data)){
				callback(false, new Error('There is no IP address depending cuk after checking, why...'));
				return;
			}

			// remove/clear by result of checking
			const	result = k2hr3.removeIpAddressWithCuk(res.data, localchkipconfig.pendingsec, rawWatcherLogging);
			if(null !== result){
				callback(false, result);
			}else{
				// Succeed without error
				callback(false, null);
			}
		}else{
			let	errmsg = 'unknown';
			if(apiutil.isPlainObject(res) && apiutil.isPlainObject(res.error)){
				errmsg = apiutil.isString(res.error.message) ? res.error.message : 'unknown';
			}
			callback(false, new Error('checking IP addresses returns error : ' + errmsg));
		}
	}).catch((error: Error): void => {
		callback(true, new Error('checking IP addresses returns fatal error : ' + apiutil.getSafeString(error.message)));		// fatal
	});
};

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
//
//
type typeLocalBasicIpCheckModule = {
	checkAddressesAlive:	cbTypeCheckAddressesAlive
};

let local_mod: typeLocalBasicIpCheckModule | null = null;

(async () => {
	if(rawIsFunctionType() && null !== localchkipconfig.funcmod){
		const mod = await apiutil.tryLoadModule<typeLocalBasicIpCheckModule>(localchkipconfig.funcmod);
		if(apiutil.isSafeEntity(mod)){
			local_mod = mod;
		}
	}
})();

const rawWatchAddressesAlive = (oneshotCB: cbTypeWatchAddressesAlive | null): ReturnType<typeof setInterval> | null => {

	const	_callback	= oneshotCB;

	//
	// Load checkAddressesAlive function
	//
	let	ipchecker: cbTypeCheckAddressesAlive | null = null;
	try{
		if(rawIsFunctionType() && null !== local_mod){
			ipchecker = (local_mod as typeLocalBasicIpCheckModule).checkAddressesAlive;
		}else if(rawIsBasicType()){
			ipchecker = basicipcheck.checkAddressesAlive;
		}else{
			// Nothing to do with interval
			return null;
		}
		if(!apiutil.isFunction(ipchecker)){
			r3logger.elog('could not load checkAddressesAlive function in : ' + (rawIsBasicType() ? './basicipcheck' : localchkipconfig.funcmod));
			return null;
		}
	}catch(error){
		r3logger.elog('could not load module : ' + (rawIsBasicType() ? './basicipcheck' : localchkipconfig.funcmod), JSON.stringify(error));
		return null;
	}

	if(apiutil.isFunction(_callback)){
		//
		// one shot
		//
		rawWatchAddressesAliveEx(ipchecker, (is_fatal: boolean, error?: Error | null): void => {
			let	result = true;
			if(is_fatal){
				if(apiutil.isPlainObject(error)){
					r3logger.elog('Fatal error is occurred : ' + apiutil.getSafeString(error.message));
				}else{
					r3logger.elog('Fatal error is occurred');
				}
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
	let		isFatalError	= false;
	let		isWorking		= false;
	const	checkInterval	= setInterval((): void => {
		if(!isFatalError && !isWorking){
			isWorking = true;
			//
			// Checking
			//
			rawWatchAddressesAliveEx(ipchecker, (is_fatal: boolean, error?: Error | null): void => {
				isWorking = false;

				if(is_fatal){
					if(apiutil.isPlainObject(error)){
						r3logger.elog('Fatal error is occurred : ' + apiutil.getSafeString(error.message));
					}else{
						r3logger.elog('Fatal error is occurred');
					}
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
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Variables
//
export const chkipconfig = localchkipconfig;

//
// Functions
//
export const ipwatch = {
	getType:				rawGetType,
	isListenerType:			rawIsListenerType,
	isBasicType:			rawIsBasicType,
	isBasicOrType:			rawIsBasicOrType,
	isBasicAndType:			rawIsBasicAndType,
	isFunctionType:			rawIsFunctionType,
	isNocheckType:			rawIsNocheckType,
	watchAddressesAlive:	rawWatchAddressesAlive
};

export default ipwatch;

//
// Callbacks
//
export { cbTypeWatchAddressesAlive };

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
