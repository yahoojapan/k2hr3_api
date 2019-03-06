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

var dns			= require('dns');
var childProcess= require('child_process');

var	chkiptype	= require('./ipwatch').chkipType;
var	apiutil		= require('./k2hr3apiutil');

// Debug logging objects
var r3logger	= require('./dbglogging');

//---------------------------------------------------------
// Ping & Set result checking IP Address
//---------------------------------------------------------
// ipdata:		IP address information
//				{
//					ipaddr:	ip,			-> ip address string
//					cuk:	cuk,		-> cuk string					(not use)
//					port:	port,		-> port number or *				(not use)
//					extra:	string		-> 'openstack-auto-v1' or etc	(not use)
//					key:	string		-> this ip address yrn full path(not use)
//					alive: 	boolean		-> true or false
//				}
//
function checkAddressAliveByPing(ipdata, chkipconfig, callback)
{
	var	_callback	= callback;
	var	_ipdata		= ipdata;								// reference
	var	_chkipconfig= chkipconfig;
	var	_timeoutms	= _chkipconfig.timeoutms;
	var	_command	= null;

	if(!apiutil.isSafeEntity(_callback) || 'function' !== typeof _callback){
		r3logger.elog('callback parameter is wrong');
		return;
	}
	if(!apiutil.isSafeEntity(_ipdata)){
		_callback(new Error('IP data is wrong : ' + JSON.stringify(_ipdata)), _ipdata);
		return;
	}
	if(!apiutil.isSafeString(_ipdata.ipaddr)){
		_callback(new Error('IP Address is wrong : ' + JSON.stringify(_ipdata.ipaddr)), _ipdata);
		return;
	}
	if(!apiutil.isSafeEntity(_chkipconfig)){				// already check this...
		_callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(_chkipconfig)), _ipdata);
		return;
	}
	if(!apiutil.isSafeEntity(_chkipconfig.timeoutms) || isNaN(_chkipconfig.timeoutms)){
		r3logger.wlog('timeoutms value is wrong : ' + JSON.stringify(_timeoutms));
		_timeoutms = 5000;									// default
	}

	//
	// Ping - Executing ping command with timeout
	//
	var	_timeoutsec	 = (_timeoutms / 1000) + 1;

	if(-1 == _ipdata.ipaddr.indexOf(':')){
		_command = _chkipconfig.command4;
	}else{
		_command = _chkipconfig.command6;
	}
	_command += ' ' + apiutil.getSafeString(_chkipconfig.params);
	_command += ' ' + apiutil.getSafeString(_chkipconfig.timeoutparam);
	_command += ' ' + _timeoutsec.toString();
	_command += ' ' + _ipdata.ipaddr;

	childProcess.exec(_command, function(error, stdout, stderr)			// eslint-disable-line no-unused-vars
	{
		if(error){
			r3logger.dlog('Something error occurred pinging to ' + _ipdata.ipaddr + ' by : ' + JSON.stringify(error));
			_callback(error, _ipdata);
		}else{
			_callback(null, _ipdata);
		}
	});
}

//---------------------------------------------------------
// Check DNS & Set result checking IP Address
//---------------------------------------------------------
// ipdata:		IP address information
//				{
//					ipaddr:	ip,			-> ip address string
//					cuk:	cuk,		-> cuk string					(not use)
//					port:	port,		-> port number or *				(not use)
//					extra:	string		-> 'openstack-auto-v1' or etc	(not use)
//					key:	string		-> this ip address yrn full path(not use)
//					alive: 	boolean		-> true or false
//				}
//
function checkAddressAlive(ipdata, chkipconfig, callback)
{
	var	_callback	= callback;
	var	_ipdata		= ipdata;								// reference
	var	_chkipconfig= chkipconfig;
	var	_is_and		= false;
	var	_timeoutms	= _chkipconfig.timeoutms;

	if(!apiutil.isSafeEntity(_callback) || 'function' !== typeof _callback){
		r3logger.elog('callback parameter is wrong');
		return;
	}
	if(!apiutil.isSafeEntity(_ipdata)){
		_callback(new Error('IP data is wrong : ' + JSON.stringify(_ipdata)), _ipdata);
		return;
	}
	if(!apiutil.isSafeString(_ipdata.ipaddr)){
		_callback(new Error('IP Address is wrong : ' + JSON.stringify(_ipdata.ipaddr)), _ipdata);
		return;
	}
	if(!apiutil.isSafeEntity(_chkipconfig)){				// already check this...
		_callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(_chkipconfig)), _ipdata);
		return;
	}
	if(!apiutil.isSafeEntity(_chkipconfig.type) || ('BasicOr' !== _chkipconfig.type && 'BasicAnd' !== _chkipconfig.type)){
		_callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(_chkipconfig)), _ipdata);
		return;
	}
	if(chkiptype.CHECKER_TYPE_BASIC_OR == _chkipconfig.type){
		_is_and		= false;
	}else{
		_is_and		= true;
	}
	if(!apiutil.isSafeEntity(_chkipconfig.timeoutms) || isNaN(_chkipconfig.timeoutms)){
		r3logger.wlog('timeoutms value is wrong : ' + JSON.stringify(_timeoutms));
		_timeoutms = 5000;									// default
	}

	//
	// checking DNS with timeout by set timer
	//
	try{
		dns.reverse(_ipdata.ipaddr, function(error, hostnames)
		{
			if(error){
				r3logger.dlog('Something error occurred in dns lookup by error: ' + JSON.stringify(error));
				if(_is_and){
					// [Type = AND] DNS is error, then need to check Ping
					checkAddressAliveByPing(_ipdata, _chkipconfig, _callback);
				}else{
					// [Type = OR] DNS is error, then this IP is not alive
					_callback(error, _ipdata);
				}
				return;
			}
			r3logger.dlog('Success dns lookup for ip address(' + _ipdata.ipaddr + ') to hostnames(' + JSON.stringify(hostnames) + ').');

			if(_is_and){
				// [Type = AND] DNS is success, then this IP is alive
				_callback(null, _ipdata);
			}else{
				// [Type = OR] DNS is error, then need to check Ping
				checkAddressAliveByPing(_ipdata, _chkipconfig, _callback);
			}
		});

	}catch(errobj){
		r3logger.dlog('Something error occurred in dns lookup by error: ' + JSON.stringify(errobj));
		if(_is_and){
			// [Type = AND] DNS is error, then need to check Ping
			checkAddressAliveByPing(_ipdata, _chkipconfig, _callback);
		}else{
			// [Type = OR] DNS is error, then this IP is not alive
			_callback(errobj, _ipdata);
		}
	}
}

//---------------------------------------------------------
// Check & Set result checking IP Addresses by parallel
//---------------------------------------------------------
// ipdatas:		IP address information array
//				[{
//					ipaddr:			<string>,			-> ip address string
//					cuk:			<string>,			-> cuk string								(not use)
//					port:			<number or *>,		-> port number or *							(not use)
//					extra:			<string>,			-> 'openstack-auto-v1' or etc				(not use)
//					key:			<string>,			-> this ip address yrn full path			(not use)
//					alive: 			<boolean>			-> true or false
//				}, ...]
// start:		start position of ipdatas array
// chkipconfig:	Configuration for IP addresses checking
//				{
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
function checkAddressesAliveParallel(ipdatas, start, chkipconfig, callback)
{
	var	_ipdatas	= ipdatas;								// reference
	var	_start		= start;
	var	_chkipconfig= chkipconfig;
	var	_callback	= callback;

	if(!apiutil.isSafeEntity(_callback) || 'function' !== typeof _callback){
		r3logger.elog('callback parameter is wrong');
		return;
	}
	if(!apiutil.isSafeEntity(_start) || isNaN(_start)){
		_callback(new Error('start value is wrong : ' + JSON.stringify(_start)));
		return;
	}
	if(!apiutil.isSafeEntity(_chkipconfig)){				// already check this...
		_callback(new Error('chkipconfig value is wrong : ' + JSON.stringify(_chkipconfig)));
		return;
	}
	if(!apiutil.isArray(_ipdatas)){
		_callback(new Error('IP Addresses array is wrong : ' + JSON.stringify(_ipdatas)));
		return;
	}
	var	_totalcount = _chkipconfig.parallelcnt;
	if((_ipdatas.length - _start) < _totalcount){
		_totalcount = _ipdatas.length - _start;
		if(_totalcount <= 0){
			_callback(new Error('No rest array for checking'));
			return;
		}
	}

	for(var cnt = 0, setcnt = 0; cnt < _totalcount; ++cnt){
		checkAddressAlive(_ipdatas[_start + cnt], _chkipconfig, function(error, ipdata)
		{
			if(error){
				r3logger.dlog('IP Address(' + ipdata.ipaddr + ') : CUK(' + ipdata.cuk + ') is not alive by ' + JSON.stringify(error));
				ipdata.alive = false;
			}else{
				r3logger.dlog('IP Address(' + ipdata.ipaddr + ') : CUK(' + ipdata.cuk + ') is alive');
				ipdata.alive = true;
			}
			++setcnt;
			if(_totalcount <= setcnt){
				if(_ipdatas.length <= (_start + _totalcount)){
					_callback(null);
				}else{
					checkAddressesAliveParallel(ipdatas, (_start + _totalcount), _chkipconfig, _callback);
				}
			}
		});
	}
}

//---------------------------------------------------------
// Check & Set result checking IP Addresses
//---------------------------------------------------------
// ipdatas:		IP address information array
//				[{
//					ipaddr:			<string>,			-> ip address string
//					cuk:			<string>,			-> cuk string								(not use)
//					port:			<number or *>,		-> port number or *							(not use)
//					extra:			<string>,			-> 'openstack-auto-v1' or etc				(not use)
//					key:			<string>,			-> this ip address yrn full path			(not use)
//					alive: 			<boolean>			-> true or false
//				}, ...]
// chkipconfig:	Configuration for IP addresses checking
//				{
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
function checkAddressesAlivePromise(ipdatas, chkipconfig)
{
	var	_chkipconfig= chkipconfig;
	var	_ipdatas	= ipdatas;								// reference

	return new Promise(function(resolve, reject)
	{
		var	_resolve= resolve;
		var	_reject	= reject;

		if(	!apiutil.isSafeEntity(_chkipconfig)					||
			!apiutil.isSafeEntity(_chkipconfig.parallelcnt)		||
			isNaN(_chkipconfig.parallelcnt)						||
			!apiutil.isSafeString(_chkipconfig.command4)		||
			!apiutil.isSafeString(_chkipconfig.command6)		||
			//!apiutil.isSafeString(_chkipconfig.params)		||	// allow null
			//!apiutil.isSafeString(_chkipconfig.timeoutparam)	||	// allow null
			!apiutil.isSafeEntity(_chkipconfig.timeoutms)		||
			isNaN(_chkipconfig.timeoutms)						)
		{
			_reject(new Error('chkipconfig object is wrong : ' + JSON.stringify(_chkipconfig)));
			return;
		}

		if(!apiutil.isArray(_ipdatas)){
			_reject(new Error('IP Addresses array is wrong : ' + JSON.stringify(_ipdatas)));
			return;
		}

		checkAddressesAliveParallel(_ipdatas, 0, _chkipconfig, function(error)
		{
			if(error){
				r3logger.elog('Something error is occurred : ' + JSON.stringify(error));
				_resolve({error: error, data: _ipdatas});
			}else{
				r3logger.dlog('Succeed to checking all ip address');
				_resolve({error: null, data: _ipdatas});
			}
		});
	});
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.checkAddressesAlive = function(ipdatas, chkipconfig)
{
	return checkAddressesAlivePromise(ipdatas, chkipconfig);
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
