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

var	http		= require('http');
var	https		= require('https');

var	cacerts		= require('../lib/cacerts');
var	apiutil		= require('./k2hr3apiutil');
var	k2hr3		= require('./k2hr3dkc');
var	r3keys		= require('./k2hr3keys').getK2hr3Keys;

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//---------------------------------------------------------
// Keystone api wrapper
//---------------------------------------------------------
var	kseplist	= null;
var	ksepobj		= null;

(function()
{
	var	r3Conf	= require('./k2hr3config').r3ApiConfig;
	var	apiConf	= new r3Conf();

	if(apiConf.isKeystoneEpList()){
		kseplist		= apiConf.getKeystoneEpList();
	}else if(apiConf.isKeystoneEpFile()){
		var	ksepobj_path= './' + apiConf.getKeystoneEpFile();
		ksepobj			= require(ksepobj_path);
	}
}());

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
var rawTestKeystoneEpCallback = function(err, callback, epallmap, region, status_code)
{
	var	error;
	if(!apiutil.isSafeEntity(epallmap) || !apiutil.isSafeEntity(callback) || !apiutil.isSafeString(region) || !apiutil.isSafeEntity(epallmap[region])){
		error = new Error('some parameters are wrong : epallmap=' + JSON.stringify(epallmap) + ', region=' + JSON.stgingify(region) + ' epallmap[region]=' + JSON.stringify(epallmap[region]));
		r3logger.elog(error.message);
		if(apiutil.isSafeEntity(callback)){
			callback(error);
		}
		return;
	}
	if(!apiutil.isSafeEntity(status_code) || isNaN(status_code)){
		r3logger.elog('parameter is wrong : status_code=' + JSON.stringify(status_code) + ', but continue with status_code(500).');
		status_code = 500;												// status code = internal error
	}
	if(null !== err){
		r3logger.elog('failed test about keystone endpoint(' + epallmap[region].url + ') for region(' + region + ') by ' + err.message + ', but continue with status_code(500).');
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
	epallmap[region].checked	= true;
	epallmap[region].status		= status_code;

	// check for finish
	var	is_finish = true;
	for(var test_region in epallmap){
		if(!epallmap[test_region].checked){
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
function rawTestKeystoneEndpoint(epallmap, region, endpoint, is_v3, timeout, lastest_callback)
{
	var	error;
	if(!apiutil.isSafeEntity(epallmap) || !apiutil.isSafeEntity(lastest_callback) || !apiutil.isSafeStrings(region, endpoint)){
		error = new Error('some parameters are wrong : epallmap=' + JSON.stringify(epallmap) + ', region=' + JSON.stgingify(region) + ', endpoint=' + JSON.stringify(endpoint));
		r3logger.elog(error.message);
		rawTestKeystoneEpCallback(error, lastest_callback, epallmap, region, 500);	// return result code = 500
		return;
	}
	if(!apiutil.isSafeEntity(timeout) || isNaN(timeout)){
		error = new Error('parameter is wrong : timeout=' + JSON.stringify(timeout));
		r3logger.elog(error.message);
		rawTestKeystoneEpCallback(error, lastest_callback, epallmap, region, 500);	// return result code = 500
		return;
	}
	if('boolean' !== typeof is_v3){
		is_v3 = true;
	}
	var	_epallmap	= epallmap;
	var	_region		= region;
	var	_endpoint	= endpoint;
	var	_is_v3		= is_v3;
	var	_timeout	= timeout;
	var	_lastest_cb	= lastest_callback;

	// Make request body data
	// This body failed authorization.(wrong user/passwd)
	//
	var	ep			= apiutil.urlParse(_endpoint);
	var	body;
	var	strbody;
	var	headers;
	var	options;
	if(!_is_v3){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		body	= {	'auth': {
						'tenantName':	'',								// unscoped token for test
						'passwordCredentials':	{
							'username':	'',								// user name is empty for testing
							'password':	''								// unauthorized passwd
						}
					}
				  };
		strbody	= JSON.stringify(body);
		headers	= {
					'Content-Type':		'application/json',
					'Content-Length':	strbody.length
				  };
		options	= {	'host':				ep.hostname,
					'port':				ep.port,
					'path': 			'/v2.0/tokens',
					'method':			'POST',
					'headers':			headers
				  };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */
	}else{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		body	= {	'auth': {
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
		headers	= {
					'Content-Type':		'application/json',
					'Content-Length':	strbody.length
				  };
		options	= {	'host':				ep.hostname,
					'port':				ep.port,
					'path': 			'/v3/auth/tokens',
					'method':			'POST',
					'headers':			headers
				  };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */
	}

	var	httpobj;
	if(apiutil.compareCaseString('https:', ep.protocol)){
		if(null !== cacerts.ca){
			options.ca = cacerts.ca;
		}
		options.agent	= new https.Agent(options);
		httpobj			= https;
	}else{
		options.agent	= new http.Agent(options);
		httpobj			= http;
	}

	var	req = httpobj.request(options, function(res)					// eslint-disable-line no-unused-vars
	{
		var	body	= '';												// eslint-disable-line no-unused-vars
		var	status	= res.statusCode;

		r3logger.dlog('response status: ' + res.statusCode);
		r3logger.dlog('response header: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		res.on('data', function(chunk)
		{
			//r3logger.dlog('response chunk: ' + chunk);
			body += chunk;												// eslint-disable-line no-unused-vars
		});

		res.on('end', function(res)										// eslint-disable-line no-unused-vars
		{
			rawTestKeystoneEpCallback(null, _lastest_cb, _epallmap, _region, status);	// return result code
		});
	});

	req.on('error', function(err)
	{
		rawTestKeystoneEpCallback(err, _lastest_cb, _epallmap, _region, 504);			// return result code = 500
	});

	req.on('socket', function(socket)
	{
		socket.setTimeout(_timeout, function()
		{
			req.abort();
			rawTestKeystoneEpCallback(null, _lastest_cb, _epallmap, _region, 504);		// return result code = 504
		});
	});

	// write data to request body
	req.write(strbody);
	req.end();
}

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
function rawGetKeystoneEndpointsCallback(cbargs, err, epmap)
{
	var	_cbargs = cbargs;
	var	error;

	if(null !== err){
		error = new Error('failed to get dynamic keystone endpoints : ' + err.message);
		r3logger.elog(error.message);
		_cbargs.callback(error, null);
		return;
	}
	if(!apiutil.isSafeEntity(epmap)){
		error = new Error('getting dynamic keystone endpoints is something wrong.');
		r3logger.elog(error.message);
		_cbargs.callback(error, null);
		return;
	}

	//
	// check and register endpoints to k2hdkc
	//
	var	keys	= r3keys();
	var	epallmap= {};
	for(var region in epmap){
		if(!apiutil.isSafeString(epmap[region])){
			// wrong data
			r3logger.wlog('dynamic keystone endpoint for ' + region + ' is something wrong(' + JSON.stringify(epmap[region]) + '), thus skip it.');
			continue;
		}
		// register only https!
		var	ep = apiutil.urlParse(epmap[region]);
		if(!apiutil.compareCaseString('https:', ep.protocol)){
			// not https
			r3logger.wlog('dynamic keystone endpoint for ' + region + ' is not https(' + ep.protocol + '), it is not good endpoint.');
		}

		// add to temporary
		var	tmpmap ={
			'url':		epmap[region],
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
	for(region in epallmap){
		// check each endpoint
		//
		// [NOTE]
		// The callback function is called only when all the elements of
		// epallmap are checked.
		//
		rawTestKeystoneEndpoint(epallmap, region, epallmap[region].url, _cbargs.is_v3, _cbargs.timeout, function(err)
		{
			var	_callback = _cbargs.callback;
			var	_epallmap = epallmap;

			if(null !== err){
				var error = new Error('failed to check keystone endpoints : ' + err.message);
				r3logger.elog(error.message);
				_callback(error, null);
				return;
			}

			// set all endpoint map
			for(var region2 in _epallmap){
				// register endpoint(type should be VALUE_KEYSTONE_NORMAL)
				//
				// [NOTE][TODO]
				// Now, we do not distinguish v2 and v3 keystone, we are registering it into k2hdkc.
				// This may possibly cause problems.
				//
				var	res_ep = k2hr3.setKeystoneEndpointAll(region2, _epallmap[region2].url, keys.VALUE_KEYSTONE_NORMAL, 0);
				if(!res_ep.result){
					r3logger.elog('could not set keystone endpoint(' + _epallmap[region2].url + ') for region2(' + region2 + ') into k2hdkc, but continue...');
				}else{
					r3logger.mlog('add new keystone endpoint(' + _epallmap[region2].url + ') for region2(' + region2 + ') into k2hdkc.');
				}
			}

			// call ownself with not reentrant flag
			rawGetKeystoneEndpoint(function(err, keystone_ep)
			{
				if(null !== err){
					var error = new Error('failed to get keystone endpoint : ' + err.message);
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
}

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
var	last_region		= null;
var	last_endpoint	= null;

function rawGetKeystoneEndpoint(callback, is_v3, is_test, timeout, is_remake_keystone_ep)
{
	var	error;
	if(!apiutil.isSafeEntity(timeout) || isNaN(timeout)){
		timeout = 30000;													// default 30s
	}
	if('boolean' !== typeof is_test){
		is_test = true;														// default true
	}
	if('boolean' !== typeof is_v3){
		is_v3 = true;														// default v3
	}
	if('boolean' !== typeof is_remake_keystone_ep){
		is_remake_keystone_ep = false;
	}

	// [NOTE]
	// This object is inherited from getDynamicKeystoneEndpoints
	// to rawGetKeystoneEndpointsCallback.
	// Ultimately, this function is called recursively and receives
	// the data of this object as an argument.
	//
	var	cbargs = {
		timeout:	timeout,
		is_test:	is_test,
		is_v3:		is_v3,
		callback:	callback
	};

	var	keystone_ep;
	if(apiutil.isSafeString(last_region) && apiutil.isSafeString(last_endpoint)){
		// there is a cache for endpoint/region
		keystone_ep			= apiutil.urlParse(last_endpoint);
		keystone_ep.region	= last_region;
		cbargs.callback(null, keystone_ep);
		return;
	}
	// there is no cache for endpoint/region

	var	allres = k2hr3.getKeystoneEndpointAll();
	if(!allres.result){
		r3logger.elog('failed to get all keystone endpoint : ' + allres.message + 'but continue for recovering.');
	}
	var	keystones = apiutil.isSafeEntity(allres.keystones) ? allres.keystones : {};

	// search OK status from all
	var	keys = r3keys();
	for(var region in keystones){
		if(	apiutil.isSafeEntity(keystones[region])					&&
			apiutil.isSafeString(keystones[region].url)				&&
			apiutil.isSafeString(keystones[region].type)			&&
			keys.VALUE_KEYSTONE_NORMAL === keystones[region].type	&&
			apiutil.isSafeEntity(keystones[region].status)			&&
			keystones[region].status < 500							)		// allow 0, 2xx, 3xx, 4xx
		{
			// found reachable endpoint, then set cache and result
			last_region			= region;
			last_endpoint		= keystones[region].url;
			keystone_ep			= apiutil.urlParse(last_endpoint);
			keystone_ep.region	= last_region;

			cbargs.callback(null, keystone_ep);
			return;
		}
	}

	//
	// There are no available endpoints
	//
	if(!is_remake_keystone_ep){
		error = new Error('there is no safe keystone endpoints.');
		r3logger.elog(error.message);
		cbargs.callback(error, null);
		return;
	}

	//
	// try to remake keystone endpoint
	//
	if(apiutil.isSafeEntity(kseplist)){
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
		error = new Error('keystone endpoint configuration is something wrong.');
		r3logger.elog(error.message);
		cbargs.callback(error, null);
		return;
	}
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.getKeystoneEndpoint = function(callback, is_v3, is_test, timeout)
{
	return rawGetKeystoneEndpoint(callback, is_v3, is_test, timeout, true);
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
