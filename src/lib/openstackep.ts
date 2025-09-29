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

import	* as https								from 'https';
import	* as http								from 'http';
import	apiutil									from './k2hr3apiutil';
import	r3logger								from './dbglogging';
import	{ getK2hr3Keys }						from './k2hr3keys';
import	{ ca }									from './cacerts';

import type	{ dkcTypeKeystoneEndpoints }		from './k2hr3dkc';
import type	{ UrlWithStringQuery }				from 'url';
import type	{ ClientRequest, IncomingMessage  }	from 'http';
import type	{ Socket }							from 'net';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeKeystoneEndpoint = {
	url:			string;
	checked:		boolean,
	status:			number
};

type valTypeKeystoneEndpointMap = {
	[key: string]:	valTypeKeystoneEndpoint | string;
};

type valTypeGetKeystoneEndpointArgs = {
	is_v3:			boolean,
	is_test:		boolean,
	timeout:		number,
	callback:		cbTypeGetKeystoneEndpoint
};

type valTypeUrlKeystoneEndpoint = UrlWithStringQuery & {
	region?:		string;
};

//
// Callback
//
type cbTypeTestKeystoneEndpoint = (err: Error | null, callback: cbTypeTestKeystoneEndpoint, epallmap: valTypeKeystoneEndpointMap, region: string, status_code: number) => void;
type cbTypeResultTestKeystoneEndpoint = (error: Error | null) => void;
type cbTypeGetKeystoneEndpoint = (error: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null) => void;
type cbTypeGetKeystoneEndpoints = (cbargs: valTypeGetKeystoneEndpointArgs, err: Error | null, epmap: valTypeKeystoneEndpointMap | null) => void;

//
// Interface for dynamic load openstack's endpoint module
//
interface DynamicOpenstackEpModule {
	getDynamicKeystoneEndpoints: (
		cbargs:		valTypeGetKeystoneEndpointArgs,
		callback:	cbTypeGetKeystoneEndpoints
	) => void;
};

//
// Type checking
//
const rawIsValTypeKeystoneEndpoint = (val: unknown): val is valTypeKeystoneEndpoint => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	const _obj			= val as Record<string, unknown>;
	const _isUrl		= (key: string) => apiutil.isString(_obj[key]);
	const _isChecked	= (key: string) => apiutil.isBoolean(_obj[key]);
	const _isStatus		= (key: string) => apiutil.isSafeNumber(_obj[key]);

	return (
		_isUrl('url')			&&
		_isChecked('checked')	&&
		_isStatus('status')
	);
};

const rawIsValTypeKeystoneEndpointMap = (val: unknown): val is valTypeKeystoneEndpointMap => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	for(const [, value] of Object.entries(val)){
		if(!apiutil.isSafeString(value) && !rawIsValTypeKeystoneEndpoint(value)){
			return false;
		}
	}
	return true;
};

const rawIsValTypeGetKeystoneEndpointArgs = (val: unknown): val is valTypeGetKeystoneEndpointArgs => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	const _obj			= val as Record<string, unknown>;
	const _isIsV3		= (key: string) => apiutil.isBoolean(_obj[key]);
	const _isIsTest		= (key: string) => apiutil.isBoolean(_obj[key]);
	const _isTimeout	= (key: string) => apiutil.isSafeNumber(_obj[key]);
	const _isCallback	= (key: string) => {
		const func = _obj[key];
		if(!apiutil.isPlainObject(func) || !apiutil.isFunction(func)){
			return false;
		}
		if(!apiutil.isSafeEntity(func.length) || 3 !== func.length){
			return false;
		}
		return true;
	};

	return (
		_isIsV3('is_v3')		&&
		_isIsTest('is_test')	&&
		_isTimeout('timeout')	&&
		_isCallback('callback')
	);
};

const rawIsValTypeUrlKeystoneEndpoint = (val: unknown): val is valTypeUrlKeystoneEndpoint => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}

	// check UrlWithStringQuery
	if(	(apiutil.isSafeEntity(val.query)	&& !apiutil.isString(val.query)		) ||
		(apiutil.isSafeEntity(val.href)		&& !apiutil.isString(val.href)		) ||
		(apiutil.isSafeEntity(val.protocol)	&& !apiutil.isString(val.protocol)	) ||
		(apiutil.isSafeEntity(val.auth)		&& !apiutil.isString(val.auth)		) ||
		(apiutil.isSafeEntity(val.host)		&& !apiutil.isString(val.host)		) ||
		(apiutil.isSafeEntity(val.hostname)	&& !apiutil.isString(val.hostname)	) ||
		(apiutil.isSafeEntity(val.port)		&& !apiutil.isString(val.port)		) ||
		(apiutil.isSafeEntity(val.pathname)	&& !apiutil.isString(val.pathname)	) ||
		(apiutil.isSafeEntity(val.search)	&& !apiutil.isString(val.search)	) ||
		(apiutil.isSafeEntity(val.path)		&& !apiutil.isString(val.path)		) ||
		(apiutil.isSafeEntity(val.hash)		&& !apiutil.isString(val.hash)		) ||
		(apiutil.isSafeEntity(val.query)	&& !apiutil.isSafeEntity(val.query)	) ||
		(apiutil.isSafeEntity(val.slashes)	&& !apiutil.isBoolean(val.slashes)	) )
	{
		return false;
	}

	// valTypeUrlKeystoneEndpoint
	if(apiutil.isSafeEntity(val.region) && !apiutil.isString(val.region)){
		return false;
	}
	return true;
};

const rawIsDynamicOpenstackEpModule = (mod: unknown): mod is DynamicOpenstackEpModule => {

	if(!apiutil.isPlainObject(mod)){
		return false;
	}
	if(!('getDynamicKeystoneEndpoints' in mod)){
		return false;
	}
	if(!apiutil.isPlainObject(mod.getDynamicKeystoneEndpoints) || !apiutil.isFunction(mod.getDynamicKeystoneEndpoints)){
		return false;
	}
	if(!apiutil.isSafeEntity(mod.getDynamicKeystoneEndpoints.length) || 2 !== mod.getDynamicKeystoneEndpoints.length){	// getDynamicKeystoneEndpoints must have 2 arguments.
		return false;
	}
	return true;
};

//---------------------------------------------------------
// Callback function for testing one keystone endpoint
//---------------------------------------------------------
// Input parameter:
//		err				: if error is occurred, error object is set(if no error, this is null).
//		callback		: specify the callback to be called when all epallmap is checked.
//		epallmap		: all of keystone endpoint
//		region			: checked region
//		status_code		: check result
//
// Result:	callback(error, epallmap)
//		error			: if error is occurred, error object is set(if no error, this is null).
//		epallmap		: all endpoint mapping
//
// [NOTE]
// The callback function is only called when all checks of
// epallmap are complete.
// This assumes that the caller will call this function on all
// epallmaps.
//
const rawTestKeystoneEpCallback = (
	err:			Error | null,
	callback:		cbTypeResultTestKeystoneEndpoint,
	epallmap:		valTypeKeystoneEndpointMap,
	region:			string,
	status_code:	number
): void => {

	if(!apiutil.isSafeEntity(callback) || !apiutil.isSafeString(region) || !apiutil.isPlainObject(epallmap)){
		const error = new Error('some parameters are wrong : epallmap=' + JSON.stringify(epallmap) + ', region=' + JSON.stringify(region));
		r3logger.elog(error.message);
		if(apiutil.isSafeEntity(callback)){
			callback(error);
		}
		return;
	}
	const tmpEpRegin = epallmap[region];
	if(!rawIsValTypeKeystoneEndpoint(tmpEpRegin)){
		const error = new Error('some parameters are wrong : epallmap=' + JSON.stringify(epallmap) + ', region=' + JSON.stringify(region));
		r3logger.elog(error.message);
		if(apiutil.isSafeEntity(callback)){
			callback(error);
		}
		return;
	}
	if(!apiutil.isSafeNumber(status_code)){
		r3logger.elog('parameter is wrong : status_code=' + JSON.stringify(status_code) + ', but continue with status_code(500).');
		status_code = 500;												// status code = internal error
	}
	if(null !== err){
		r3logger.elog('failed test about keystone endpoint(' + tmpEpRegin.url + ') for region(' + region + ') by ' + err.message + ', but continue with status_code(500).');
		status_code = 500;												// status code = internal error
	}

	// set checked flag and status result
	//
	// [NOTE][TODO]
	// Under control by this flag, exclusion control is not perfect.
	// In other words, the callback function may be called multiple times.
	// (However, the callback function will be called at least once.)
	// Currently, exclusion control here is not performed, and the caller
	// recognizes multiple calls. Here is the code to fix.
	//
	(epallmap[region] as valTypeKeystoneEndpoint).checked	= true;
	(epallmap[region] as valTypeKeystoneEndpoint).status	= status_code;

	// check for finish
	let	is_finish = true;
	for(const test_region in epallmap){
		const tmpOneRegion = epallmap[test_region];
		if(!rawIsValTypeKeystoneEndpoint(tmpOneRegion)){
			continue;
		}
		if(!tmpOneRegion.checked){
			is_finish = false;
			break;
		}
	}
	if(is_finish){
		// checked all of endpoints, then call original callback.
		//
		// [NOTE]
		// Perhaps this function passes here multiple times.
		//
		callback(null);
	}
};

//---------------------------------------------------------
// Test one keystone endpoint
//---------------------------------------------------------
// Input parameter
//		epallmap			: all of keystone endpoint
//		region				: target one region for checking
//		endpoint			: target one endpoint for checking
//		is_v3				: keystone v3 or v2
//		timeout				: timeout for checking one endpoint
//		lastest_callback	: callback function which is called end of last checking endpoint.
//
// Result:	lastest_callback(error, orgcb, epallmap, region, status_code, orgcb)
//		error				: error object
//		orgcb				: original callback
//		epallmap			: all endpoint mapping
//		region				: region
//		status_code			: status code for request(timeout = 504)
//
// [NOTE]
// The lastest_callback callback function is only called when
// all checks of epallmap are complete.
// This assumes that the caller will call this function on all
// epallmaps.
//
const rawTestKeystoneEndpoint = (
	epallmap:			valTypeKeystoneEndpointMap,
	region:				string,
	endpoint:			string,
	is_v3:				boolean,
	timeout:			number,
	lastest_callback:	cbTypeResultTestKeystoneEndpoint
): void => {

	if(!apiutil.isSafeEntity(epallmap) || !apiutil.isSafeEntity(lastest_callback) || !apiutil.isSafeString(region) || !apiutil.isSafeString(endpoint)){
		const error = new Error('some parameters are wrong : epallmap=' + JSON.stringify(epallmap) + ', region=' + JSON.stringify(region) + ', endpoint=' + JSON.stringify(endpoint));
		r3logger.elog(error.message);
		rawTestKeystoneEpCallback(error, lastest_callback, epallmap, region, 500);	// return result code = 500
		return;
	}
	if(!apiutil.isSafeNumber(timeout)){
		const error = new Error('parameter is wrong : timeout=' + JSON.stringify(timeout));
		r3logger.elog(error.message);
		rawTestKeystoneEpCallback(error, lastest_callback, epallmap, region, 500);	// return result code = 500
		return;
	}
	if(!apiutil.isBoolean(is_v3)){
		is_v3 = true;
	}
	const	_epallmap	= epallmap;
	const	_region		= region;
	const	_endpoint	= endpoint;
	const	_is_v3		= is_v3;
	const	_timeout	= timeout;
	const	_lastest_cb	= lastest_callback;

	// Make request body data
	// This body failed authorization.(wrong user/passwd)
	//
	let	strbody: string;
	if(!_is_v3){
		const body = {
			'auth': {
				'tenantName': '',								// unscoped token for test
				'passwordCredentials': {
					'username':	'',								// user name is empty for testing
					'password':	''								// unauthorized passwd
				}
			}
		};
		strbody	= JSON.stringify(body);
	}else{
		const body = {
			'auth': {
				'identity': {
					'password': {
						'user': {
							'domain': {
								'id': 'default'
							},
							'name':		'',					// user name is empty for testing
							'password':	''					// unauthorized passwd
						}
					},
					'methods': ['password']
				}
			}
		};
		strbody	= JSON.stringify(body);
	}

	const	ep		= apiutil.urlParse(_endpoint);
	const	is_sec	= apiutil.compareCaseString('https:', ep.protocol);
	const	agent	= is_sec ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	strbody.length
	};
	const	options = {
		'host':			apiutil.getSafeString(ep.hostname),
		'port':			apiutil.isSafeNumber(ep.port) ? ep.port : 0,
		'path': 		_is_v3 ? '/v3/auth/tokens' : '/v2.0/tokens',
		'method':		'POST',
		'headers':		headers,
		'ca':			(is_sec && null !== ca) ? (ca() ?? undefined) : undefined
	};

	// send request
	const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void => {
		let		_body	= '';
		const	_status	= res.statusCode;

		r3logger.dlog('response status: ' + res.statusCode);
		r3logger.dlog('response header: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		res.on('data', (chunk: string) => {
			//r3logger.dlog('response chunk: ' + chunk);
			_body += chunk;
		});

		res.on('end', (): void => {
			r3logger.dlog('response body: ' + _body.slice(0, 36) + '...');				// for eslint to use _body.
			rawTestKeystoneEpCallback(null, _lastest_cb, _epallmap, _region, _status ?? 500);	// return result code
		});
	});

	req.on('error', (err: Error) => {
		rawTestKeystoneEpCallback(err, _lastest_cb, _epallmap, _region, 504);			// return result code = 500
	});

	req.on('socket', (socket: Socket) => {
		socket.setTimeout(_timeout, () => {
			req.abort();
			rawTestKeystoneEpCallback(null, _lastest_cb, _epallmap, _region, 504);		// return result code = 504
		});
	});

	// write data to request body
	req.write(strbody);
	req.end();
};

//---------------------------------------------------------
// Callback function for dynamic/static endpoint list
//---------------------------------------------------------
// Input parameter:
//		cbargs		: parent function parameter in this object
//						timeout		: rawGetKeystoneEndpoint function argument
//						is_test		: rawGetKeystoneEndpoint function argument
//						is_v3		: rawGetKeystoneEndpoint function argument
//						callback	: rawGetKeystoneEndpoint function argument
//		err			: if error is occurred, error object is set(if no error, this is null).
//		epmap		: keystone endpoint map which is result of dynamic/static list.
//
// Result: callback(error, keystone_ep)
//		error		: error object
//		keystone_ep	: url object with region string element
//
const rawGetKeystoneEndpointsCallback = (
	cbargs:		valTypeGetKeystoneEndpointArgs,
	err:		Error | null,
	epmap:		valTypeKeystoneEndpointMap | null
): void => {

	const	_cbargs = cbargs;
	if(null !== err){
		const error = new Error('failed to get dynamic keystone endpoints : ' + err.message);
		r3logger.elog(error.message);
		_cbargs.callback(error, null);
		return;
	}
	if(!rawIsValTypeKeystoneEndpointMap(epmap)){
		const error = new Error('getting dynamic keystone endpoints is something wrong.');
		r3logger.elog(error.message);
		_cbargs.callback(error, null);
		return;
	}

	//
	// check and register endpoints to k2hdkc
	//
	const	keys	= getK2hr3Keys();
	const	epallmap: valTypeKeystoneEndpointMap = {};
	for(const region in epmap){
		const tmpRegionEp = epmap[region];
		if(!apiutil.isSafeString(tmpRegionEp)){
			// wrong data
			r3logger.wlog('dynamic keystone endpoint for ' + region + ' is something wrong(' + JSON.stringify(tmpRegionEp) + '), thus skip it.');
			continue;
		}
		const	region_url = tmpRegionEp;

		// register only https!
		const	ep = apiutil.urlParse(region_url);
		if(!apiutil.compareCaseString('https:', ep.protocol)){
			// not https
			r3logger.wlog('dynamic keystone endpoint for ' + region + ' is not https(' + ep.protocol + '), it is not good endpoint.');
		}

		// add to temporary
		const	tmpmap: valTypeKeystoneEndpoint = {
			'url':		region_url,
			'checked':	false,
			'status':	0
		};
		epallmap[region] = tmpmap;
	}

	if(!_cbargs.is_test){
		// not need to test(only updates), finish here
		//
		// [NOTE]
		// keystone endpoint is null
		//
		_cbargs.callback(null, null);
		return;
	}

	// test all endpoints(asynchronous)
	for(const region in epallmap){
		// check each endpoint
		//
		// [NOTE]
		// The callback function is called only when all the elements of
		// epallmap are checked.
		//
		const	tmpRegionEp = epallmap[region];
		if(!rawIsValTypeKeystoneEndpoint(tmpRegionEp)){
			continue;
		}
		rawTestKeystoneEndpoint(epallmap, region, tmpRegionEp.url, _cbargs.is_v3, _cbargs.timeout, (err: Error | null): void => {
			const	_callback = _cbargs.callback;
			const	_epallmap = epallmap;

			if(null !== err){
				const error = new Error('failed to check keystone endpoints : ' + err.message);
				r3logger.elog(error.message);
				_callback(error, null);
				return;
			}

			// set all endpoint map
			for(const region2 in _epallmap){
				// register endpoint(type should be VALUE_KEYSTONE_NORMAL)
				//
				// [NOTE][TODO]
				// Now, we do not distinguish v2 and v3 keystone, we are registering it into k2hdkc.
				// This may possibly cause problems.
				//
				const	tmpRegionEp2 = _epallmap[region2];
				if(!rawIsValTypeKeystoneEndpoint(tmpRegionEp2)){
					continue;
				}

				// [NOTE]
				// k2hr3dkc is loaded here using require to lazily load it.
				// This prevents errors caused by circular loading.
				//
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const	k2hr3	= require('./k2hr3dkc').default;
				const	res_ep	= k2hr3.setKeystoneEndpointAll(region2, tmpRegionEp2.url, keys.VALUE_KEYSTONE_NORMAL, 0);
				if(!res_ep.result){
					r3logger.elog('could not set keystone endpoint(' + tmpRegionEp2.url + ') for region2(' + region2 + ') into k2hdkc, but continue...');
				}else{
					r3logger.mlog('add new keystone endpoint(' + tmpRegionEp2.url + ') for region2(' + region2 + ') into k2hdkc.');
				}
			}

			// call ownself with not reentrant flag
			rawGetKeystoneEndpoint((err: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null): void =>{
				if(null !== err){
					const error = new Error('failed to get keystone endpoint : ' + err.message);
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				//
				// returns keystone endpoint after remaking all endpoint
				//
				_callback(null, keystone_ep);

			}, _cbargs.is_v3, _cbargs.is_test, _cbargs.timeout, false);
		});
	}
};

//---------------------------------------------------------
// Get one of endpoint for keystone from static urls
//---------------------------------------------------------
// Input parameter
//		callback				: specify callback function
//		is_v3					: keystone api v3 or v2(default v3)
//		is_test					: specify whether to test each keystone
//								  endpoint after unable to find a valid
//								  keystone endpoint and re-creating it.
//								  (default true)
//		timeout					: specify the timeout required to check
//								  each keystone endpoint.
//								  (default 30s)
//		is_remake_keystone_ep	: if keystone endpoint is not registered,
//								  it specifies whether to recreate it.
//								  (default false)
//
// Result: callback(error, keystone_ep)
//		error					: error object
//		keystone_ep				: url object with region string element
//
let	last_region: string | null					= null;
let	last_endpoint: string | null				= null;

let	ksepinit: boolean							= false;
let	kseplist: valTypeKeystoneEndpointMap | null	= null;
let ksepobj: DynamicOpenstackEpModule | null	= null;

const rawInitializeKeystoneEpList = async (): Promise<void> => {

	if(ksepinit){
		// already initialized
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { r3ApiConfig }	= require('./k2hr3config');
	const apiConf			= new r3ApiConfig();

	if(apiConf.isKeystoneEpList()){
		kseplist = apiConf.getKeystoneEpList();
	}else if(apiConf.isKeystoneEpFile()){
		const	ksepobjPath	= './' + apiConf.getKeystoneEpFile();
		const	mod			= await apiutil.tryLoadModule(ksepobjPath);
		if(rawIsDynamicOpenstackEpModule(mod)){
			ksepobj = mod;
		}
	}
	ksepinit = true;
};

const rawGetKeystoneEndpoint = (
	callback:				cbTypeGetKeystoneEndpoint,
	is_v3?:					boolean | null,
	is_test?:				boolean | null,
	timeout?:				number  | null,
	is_remake_keystone_ep?:	boolean | null
): void => {

	if(!apiutil.isSafeNumber(timeout)){
		timeout = 30000;													// default 30s
	}
	if(!apiutil.isBoolean(is_test)){
		is_test = true;														// default true
	}
	if(!apiutil.isBoolean(is_v3)){
		is_v3 = true;														// default v3
	}
	if(!apiutil.isBoolean(is_remake_keystone_ep)){
		is_remake_keystone_ep = false;
	}

	// [NOTE]
	// This object is inherited from getDynamicKeystoneEndpoints
	// to rawGetKeystoneEndpointsCallback.
	// Ultimately, this function is called recursively and receives
	// the data of this object as an argument.
	//
	const	cbargs: valTypeGetKeystoneEndpointArgs = {
		timeout:	timeout,
		is_test:	is_test,
		is_v3:		is_v3,
		callback:	callback
	};

	if(apiutil.isSafeString(last_endpoint)){
		// there is a cache for endpoint/region
		const	keystone_ep		= apiutil.urlParse(last_endpoint);
		if(rawIsValTypeUrlKeystoneEndpoint(keystone_ep)){
			keystone_ep.region = apiutil.isSafeString(last_region) ? last_region : undefined;
			cbargs.callback(null, keystone_ep);
			return;
		}
	}
	// there is no cache for endpoint/region

	// [NOTE]
	// k2hr3dkc is loaded here using require to lazily load it.
	// This prevents errors caused by circular loading.
	//
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const	k2hr3	= require('./k2hr3dkc').default;
	const	allres	= k2hr3.getKeystoneEndpointAll();
	if(!allres.result){
		r3logger.elog('failed to get all keystone endpoint : ' + apiutil.getSafeString(allres.message) + 'but continue for recovering.');
	}
	let	keystones:dkcTypeKeystoneEndpoints = {};
	if(apiutil.isSafeEntity(allres.keystones)){
		keystones = allres.keystones;
	}

	// search OK status from all
	const	keys = getK2hr3Keys();
	for(const region in keystones){
		const tmpKSRegion				= keystones[region];
		const tmpStatus: number | null	= apiutil.isSafeNumeric(tmpKSRegion.status) ? apiutil.cvtToNumber(tmpKSRegion.status) : null;
		if(	apiutil.isPlainObject(tmpKSRegion)					&&
			apiutil.isSafeString(tmpKSRegion.url)				&&
			apiutil.isSafeString(tmpKSRegion.type)				&&
			(keys.VALUE_KEYSTONE_NORMAL === tmpKSRegion.type)	&&
			apiutil.isSafeNumeric(tmpKSRegion.status)			&&
			apiutil.isSafeNumber(tmpStatus) && (tmpStatus < 500))		// allow 0, 2xx, 3xx, 4xx
		{
			// found reachable endpoint, then set cache and result
			last_region			= region;
			last_endpoint		= tmpKSRegion.url;

			const	keystone_ep	= apiutil.urlParse(last_endpoint);
			if(rawIsValTypeUrlKeystoneEndpoint(keystone_ep)){
				keystone_ep.region	= last_region;
				cbargs.callback(null, keystone_ep);
				return;
			}
		}
	}

	//
	// There are no available endpoints
	//
	if(!is_remake_keystone_ep){
		const error = new Error('there is no safe keystone endpoints.');
		r3logger.elog(error.message);
		cbargs.callback(error, null);
		return;
	}

	//
	// Initialize endpoint list(object)
	//
	rawInitializeKeystoneEpList();

	//
	// try to remake keystone endpoint
	//
	if(rawIsValTypeKeystoneEndpointMap(kseplist)){
		//
		// Get a static keystone endpoint.
		//
		rawGetKeystoneEndpointsCallback(cbargs, null, kseplist);

	}else if(apiutil.isSafeEntity(ksepobj)){
		//
		// Get keystone endpoint list dynamically.
		//
		ksepobj.getDynamicKeystoneEndpoints(cbargs, rawGetKeystoneEndpointsCallback);

	}else{
		//
		// Wrong configuration
		//
		const error = new Error('keystone endpoint configuration is something wrong.');
		r3logger.elog(error.message);
		cbargs.callback(error, null);
		return;
	}
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Functions
//
export const openstackep = {
	isValTypeKeystoneEndpoint:			rawIsValTypeKeystoneEndpoint,
	isValTypeKeystoneEndpointMap:		rawIsValTypeKeystoneEndpointMap,
	isValTypeGetKeystoneEndpointArgs:	rawIsValTypeGetKeystoneEndpointArgs,
	getKeystoneEndpoint:				rawGetKeystoneEndpoint
};

//
// Default
//
export default openstackep;

//
// Variables
//
export {
	valTypeKeystoneEndpoint,
	valTypeKeystoneEndpointMap,
	valTypeGetKeystoneEndpointArgs,
	valTypeUrlKeystoneEndpoint
};

//
// Callback
//
export {
	cbTypeTestKeystoneEndpoint,
	cbTypeResultTestKeystoneEndpoint,
	cbTypeGetKeystoneEndpoint,
	cbTypeGetKeystoneEndpoints
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
