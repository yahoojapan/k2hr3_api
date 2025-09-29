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

import	* as dns			from 'dns';
import	* as childProcess	from 'child_process';
import	apiutil				from './k2hr3apiutil';
import	r3logger			from './dbglogging';

import	{ chkipType }					from './k2hr3config';
import type	{ dkcTypeHostRawValueSet }	from './k2hr3dkc';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type ipchkTypeConfig = {
	type:			string | null,
	funcmod:		string | null,
	pendingsec:		number | null,
	intervalms:		number | null,
	parallelcnt:	number | null,
	command4:		string | null,
	command6:		string | null,
	params:			string | null,
	timeoutparam:	string | null,
	timeoutms:		number | null
};

type ipchkTypeAddressesAlivePromise = {
	error:	Error | null,
	data?:	dkcTypeHostRawValueSet[] | null
};

//
// Callbacks
//
type cbTypeAddressesAlive = (error: Error | null, ipdata?: dkcTypeHostRawValueSet | null) => void;
type cbTypeAddressesAliveResult = (error: Error | null) => void;
type cbTypeCheckAddressesAlive = (ipdatas: dkcTypeHostRawValueSet[] | null, chkipconfig: ipchkTypeConfig | null) => Promise<ipchkTypeAddressesAlivePromise>;

//---------------------------------------------------------
// Ping & Set result checking IP Address
//---------------------------------------------------------
// ipdata:		IP address information
//				dkcTypeHostRawValueSet = {
//					ip:			ip,		-> ip address string
//					cuk:		cuk,	-> cuk string					(not use)
//					port:		port,	-> port number(0 as any)		(not use)
//					extra:		string	-> 'openstack-auto-v1' or etc	(not use)
//					tag:		string	-> null or string				(not use)
//					inboundip:	ip,		-> inbound ip address			(not use)
//					outboundip:	ip,		-> outbound ip address			(not use)
//					key:		string	-> this ip address yrn full path(not use)
//					alive: 		boolean	-> true or false
//				}
//
const checkAddressAliveByPing = (
	ipdata:			dkcTypeHostRawValueSet | null,
	chkipconfig:	ipchkTypeConfig | null,
	callback:		cbTypeAddressesAlive
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong');
		return;
	}
	if(!apiutil.isPlainObject(ipdata)){
		callback(new Error('IP data is wrong : ' + JSON.stringify(ipdata)), ipdata);
		return;
	}
	if(!apiutil.isSafeString(ipdata.ip)){
		callback(new Error('IP Address is wrong : ' + JSON.stringify(ipdata.ip)), ipdata);
		return;
	}
	if(!apiutil.isPlainObject(chkipconfig)){				// already check this...
		callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(chkipconfig)), ipdata);
		return;
	}

	let		_timeoutms: number;
	if(!apiutil.isSafeNumber(chkipconfig.timeoutms)){
		r3logger.wlog('timeoutms value is wrong : ' + JSON.stringify(chkipconfig.timeoutms));
		_timeoutms = 5000;									// default
	}else{
		_timeoutms = chkipconfig.timeoutms;
	}

	//
	// Ping - Executing ping command with timeout
	//
	const	_timeoutsec	= (_timeoutms / 1000) + 1;
	let		_command: string;
	if(ipdata.ip && -1 == ipdata.ip.indexOf(':')){
		_command = apiutil.getSafeString(chkipconfig.command4);
	}else{
		_command = apiutil.getSafeString(chkipconfig.command6);
	}
	_command += ' ' + apiutil.getSafeString(chkipconfig.params);
	_command += ' ' + apiutil.getSafeString(chkipconfig.timeoutparam);
	_command += ' ' + _timeoutsec.toString();
	_command += ' ' + ipdata.ip;

	childProcess.exec(_command, (error: Error | null, _stdout: string, _stderr: string): void => {
		if(apiutil.isPlainObject(error)){
			r3logger.dlog('Something error occurred pinging to ' + ipdata.ip + ' by : ' + JSON.stringify(error));
			callback(error, ipdata);
		}else{
			callback(null, ipdata);
		}
	});
};

//---------------------------------------------------------
// Check DNS & Set result checking IP Address
//---------------------------------------------------------
// ipdata:		IP address information
//				dkcTypeHostRawValueSet = {
//					ip:			ip,		-> ip address string
//					cuk:		cuk,	-> cuk string					(not use)
//					port:		port,	-> port number(0 as any)		(not use)
//					extra:		string	-> 'openstack-auto-v1' or etc	(not use)
//					tag:		string	-> null or string				(not use)
//					inboundip:	ip,		-> inbound ip address			(not use)
//					outboundip:	ip,		-> outbound ip address			(not use)
//					key:		string	-> this ip address yrn full path(not use)
//					alive: 		boolean	-> true or false
//				}
//
const checkAddressAlive = (
	ipdata:			dkcTypeHostRawValueSet | null,
	chkipconfig:	ipchkTypeConfig | null,
	callback:		cbTypeAddressesAlive
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong');
		return;
	}
	if(!apiutil.isPlainObject(ipdata)){
		callback(new Error('IP data is wrong : ' + JSON.stringify(ipdata)), ipdata);
		return;
	}
	if(!apiutil.isSafeString(ipdata.ip)){
		callback(new Error('IP Address is wrong : ' + JSON.stringify(ipdata.ip)), ipdata);
		return;
	}
	if(!apiutil.isPlainObject(chkipconfig)){					// already check this...
		callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(chkipconfig)), ipdata);
		return;
	}
	if(!apiutil.isSafeString(chkipconfig.type) || ('BasicOr' !== chkipconfig.type && 'BasicAnd' !== chkipconfig.type)){
		callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(chkipconfig)), ipdata);
		return;
	}

	let		_is_and	= false;
	if(chkipType.CHECKER_TYPE_BASIC_OR == chkipconfig.type){
		_is_and		= false;
	}else{
		_is_and		= true;
	}

	//
	// checking DNS with timeout by set timer
	//
	try{
		dns.reverse(ipdata.ip, (error: Error | null, hostnames: string[]): void => {
			if(apiutil.isPlainObject(error)){
				r3logger.dlog('Something error occurred in dns lookup by error: ' + JSON.stringify(error));
				if(_is_and){
					// [Type = AND] DNS is error, then need to check Ping
					checkAddressAliveByPing(ipdata, chkipconfig, callback);
				}else{
					// [Type = OR] DNS is error, then this IP is not alive
					callback(error, ipdata);
				}
				return;
			}
			r3logger.dlog('Success dns lookup for ip address(' + ipdata.ip + ') to hostnames(' + JSON.stringify(hostnames) + ').');

			if(_is_and){
				// [Type = AND] DNS is success, then this IP is alive
				callback(null, ipdata);
			}else{
				// [Type = OR] DNS is error, then need to check Ping
				checkAddressAliveByPing(ipdata, chkipconfig, callback);
			}
		});

	}catch(errobj){
		r3logger.dlog('Something error occurred in dns lookup by error: ' + JSON.stringify(errobj));
		if(_is_and){
			// [Type = AND] DNS is error, then need to check Ping
			checkAddressAliveByPing(ipdata, chkipconfig, callback);
		}else{
			// [Type = OR] DNS is error, then this IP is not alive
			if(errobj instanceof Error){
				callback(errobj, ipdata);
			}else{
				callback(new Error(String(errobj)), ipdata);
			}
		}
	}
};

//---------------------------------------------------------
// Check & Set result checking IP Addresses by parallel
//---------------------------------------------------------
// ipdatas:		IP address information array
//				dkcTypeHostRawValueSet[] = [{
//					ip:				<string>,			-> ip address string
//					cuk:			<string>,			-> cuk string								(not use)
//					port:			<number>,			-> port number(0 as any)					(not use)
//					extra:			<string>,			-> 'openstack-auto-v1' or etc				(not use)
//					inboundip:		<string>,			-> inbound ip address						(not use)
//					outboundip:		<string>,			-> outbound ip address						(not use)
//					tag:			<string>,			-> null or string							(not use)
//					key:			<string>,			-> this ip address yrn full path			(not use)
//					alive: 			<boolean>			-> true or false
//				}, ...]
// start:		start position of ipdatas array
// chkipconfig:	Configuration for IP addresses checking
//				ipchkTypeConfig = {
//					type:			<string>,			-> IP check type							(not use)
//					funcmod:		<null or string>,	-> IP check special module					(not use)
//					pendingsec:		<number>,			-> Limit for removing IP which is not alive	(not use)
//					intervalms:		<number>,			-> Interval ms for checking IP address		(not use)
//					parallelcnt:	<number>,			-> Parallel processing count
//					command4:		<string>,			-> ping command for IPv4
//					command6:		<string>,			-> ping command for IPv6
//					params:			<string>,			-> Common ping command parameters
//					timeoutparam:	<string>,			-> Timeout parameter name for ping command
//					timeoutms:		<number>			-> Timeout millisecond for each checking
//				}
//
// [NOTE]
// This function is reentrant after finishing parallel count IP address checking.
// If all of ip datas array are finished checking, call callback function. 
//
const checkAddressesAliveParallel = (
	ipdatas:		dkcTypeHostRawValueSet[] | null,
	start:			number | null,
	chkipconfig:	ipchkTypeConfig | null,
	callback:		cbTypeAddressesAliveResult | null
): void => {

	if(!apiutil.isFunction(callback)){
		r3logger.elog('callback parameter is wrong');
		return;
	}
	if(!apiutil.isSafeNumber(start)){
		callback(new Error('start value is wrong : ' + JSON.stringify(start)));
		return;
	}
	if(!apiutil.isPlainObject(chkipconfig)){					// already check this...
		callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(chkipconfig)));
		return;
	}
	if(!apiutil.isArray(ipdatas) || !apiutil.isSafeEntity(ipdatas)){
		callback(new Error('IP Addresses array is wrong : ' + JSON.stringify(ipdatas)));
		return;
	}

	let		_totalcount = chkipconfig.parallelcnt;
	if(null == _totalcount){
		callback(new Error('No rest array for checking'));
		return;
	}else if((ipdatas.length - start) < _totalcount){
		_totalcount = ipdatas.length - start;
		if(_totalcount <= 0){
			callback(new Error('No rest array for checking'));
			return;
		}
	}

	let	setcnt = 0;
	for(let cnt = 0; cnt < _totalcount; ++cnt){
		checkAddressAlive(ipdatas[start + cnt], chkipconfig, (error: Error | null, ipdata?: dkcTypeHostRawValueSet | null): void => {
			if(error){
				r3logger.dlog('IP Address and CUK (' + JSON.stringify(ipdata) + ') are not alive by ' + JSON.stringify(error));
				if(apiutil.isSafeEntity(ipdata)){
					ipdata.alive = false;
				}
			}else{
				r3logger.dlog('IP Address and CUK (' + JSON.stringify(ipdata) + ') is alive');
				if(apiutil.isSafeEntity(ipdata)){
					ipdata.alive = true;
				}
			}
			++setcnt;
			if(_totalcount <= setcnt){
				if(ipdatas.length <= (start + _totalcount)){
					callback(null);
				}else{
					checkAddressesAliveParallel(ipdatas, (start + _totalcount), chkipconfig, callback);
				}
			}
		});
	}
};

//---------------------------------------------------------
// Check & Set result checking IP Addresses
//---------------------------------------------------------
// ipdatas:		IP address information array
//				dkcTypeHostRawValueSet[] = [{
//					ip:				<string>,			-> ip address string
//					cuk:			<string>,			-> cuk string								(not use)
//					port:			<number>,			-> port number(0 as any)					(not use)
//					extra:			<string>,			-> 'openstack-auto-v1' or etc				(not use)
//					tag:			<string>,			-> null or string							(not use)
//					inboundip:		<string>,			-> inbound ip address						(not use)
//					outboundip:		<string>,			-> outbound ip address						(not use)
//					key:			<string>,			-> this ip address yrn full path			(not use)
//					alive: 			<boolean>			-> true or false
//				}, ...]
// chkipconfig:	Configuration for IP addresses checking
//				ipchkTypeConfig = {
//					type:			<string>,			-> IP check type							(not use)
//					funcmod:		<null or string>,	-> IP check special module					(not use)
//					pendingsec:		<number>,			-> Limit for removing IP which is not alive	(not use)
//					intervalms:		<number>,			-> Interval ms for checking IP address		(not use)
//					parallelcnt:	<number>,			-> Parallel processing count
//					command4:		<string>,			-> ping command for IPv4
//					command6:		<string>,			-> ping command for IPv6
//					params:			<string>,			-> Common ping command parameters
//					timeoutparam:	<string>,			-> Timeout parameter name for ping command
//					timeoutms:		<number>			-> Timeout millisecond for each checking
//				}
//
// [NOTE]
// This function returns Promise object.
// resolve:		{error: <Error object if error>, data: <reference to input ipdatas>}
// reject:		<Error object>
//
const checkAddressesAlivePromise = (
	ipdatas:		dkcTypeHostRawValueSet[] | null,
	chkipconfig:	ipchkTypeConfig | null
): Promise<ipchkTypeAddressesAlivePromise> => {

	const	_chkipconfig= chkipconfig;
	const	_ipdatas	= ipdatas;								// reference

	return new Promise<ipchkTypeAddressesAlivePromise>((resolve: (value: ipchkTypeAddressesAlivePromise) => void, reject: (reason?: Error) => void) => {
		const	_resolve= resolve;
		const	_reject	= reject;

		if(	null == _chkipconfig								||
			!apiutil.isPlainObject(_chkipconfig)				||
			!apiutil.isSafeNumber(_chkipconfig.parallelcnt)		||
			!apiutil.isSafeString(_chkipconfig.command4)		||
			!apiutil.isSafeString(_chkipconfig.command6)		||
			//!apiutil.isSafeString(_chkipconfig.params)		||	// allow null
			//!apiutil.isSafeString(_chkipconfig.timeoutparam)	||	// allow null
			!apiutil.isSafeNumber(_chkipconfig.timeoutms)		)
		{
			_reject(new Error('chkipconfig object is wrong : ' + JSON.stringify(_chkipconfig)));
			return;
		}

		if(!apiutil.isArray(_ipdatas)){
			_reject(new Error('IP Addresses array is wrong : ' + JSON.stringify(_ipdatas)));
			return;
		}

		checkAddressesAliveParallel(_ipdatas, 0, _chkipconfig, (error: Error | null): void => {
			if(apiutil.isPlainObject(error)){
				r3logger.elog('Something error is occurred : ' + JSON.stringify(error));
				_resolve({error: error, data: _ipdatas});
			}else{
				r3logger.dlog('Succeed to checking all ip address');
				_resolve({error: null, data: _ipdatas});
			}
		});
	});
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const basicipcheck = {
	checkAddressesAlive: (
		ipdatas:		dkcTypeHostRawValueSet[] | null,
		chkipconfig:	ipchkTypeConfig | null
	): Promise<ipchkTypeAddressesAlivePromise> => {
		return checkAddressesAlivePromise(ipdatas, chkipconfig);
	}
};

export default basicipcheck;

export { ipchkTypeConfig, ipchkTypeAddressesAlivePromise };

//
// Callbacks
//
export { cbTypeCheckAddressesAlive };

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
