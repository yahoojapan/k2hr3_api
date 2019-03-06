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
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

'use strict';

var express		= require('express');
var path		= require('path');
var logger		= require('morgan');
var cookieParser= require('cookie-parser');
var bodyParser	= require('body-parser');

//
// Load Configuration
//
var	r3Conf		= require('./lib/k2hr3config').r3ApiConfig;
var	apiConf		= new r3Conf();

//
// Debug logging objects
//
var r3logger	= require('./lib/dbglogging');			// eslint-disable-line no-unused-vars

//
// utility
//
var	apiutil		= require('./lib/k2hr3apiutil');
var	resutil		= require('./lib/k2hr3resutil');

//
// NODE_ENV(development or production)
// NODE_LOGGER(if 'no', not logging by morgan)
//
var	is_product	= apiutil.compareCaseString(apiutil.getSafeString(process.env.NODE_ENV), 'production');
var	is_logging	= !apiutil.compareCaseString(apiutil.getSafeString(process.env.NODE_LOGGER), 'no');

//
// Routes
//
var version		= require('./routes/version');
var userTokens	= require('./routes/userTokens');
var policy		= require('./routes/policy');
var resource	= require('./routes/resource');
var role		= require('./routes/role');
var service		= require('./routes/service');
var acr			= require('./routes/acr');
var list		= require('./routes/list');
var userdata	= require('./routes/userdata');
var verify		= null;
if(!is_product){
	verify		= require('./routes/debugVerify');
}

//
// Express objects
//
var app			= express();
var userExp		= express();
var policyExp	= express();
var resourceExp	= express();
var roleExp		= express();
var serviceExp	= express();
var acrExp		= express();
var listExp		= express();
var userdataExp	= express();
var verifyExp	= null;
if(!is_product){
	verifyExp	= express();
}

//
// Trusted proxy
//
// [NOTE][TODO]
// We set trusted proxy as only loopback now.
// Here, we need to add CDN/Proxy for our NW, but pending now.
//
app.set('trust proxy',			'loopback');
userExp.set('trust proxy',		'loopback');
policyExp.set('trust proxy',	'loopback');
resourceExp.set('trust proxy',	'loopback');
roleExp.set('trust proxy',		'loopback');
serviceExp.set('trust proxy',	'loopback');
acrExp.set('trust proxy',		'loopback');
listExp.set('trust proxy',		'loopback');
userdataExp.set('trust proxy',	'loopback');
if(!is_product){
	verifyExp.set('trust proxy','loopback');
}

//
// CORS(Cross-Origin Resource Sharing)
//
// [NOTE][TODO]
// It specifies a web development machine for temporary debugging.
// In future we plan to specify with K2HR3 role.
//
var	cors_ips			= [];
(function()
{
	var	k2hr3config		= require('config');
	if(apiutil.isSafeEntity(k2hr3config) && !apiutil.isEmptyArray(k2hr3config.corsips)){
		apiutil.mergeArray(cors_ips, k2hr3config.corsips);
	}
}());

//
// CORS(Cross-Origin Resource Sharing) Controller
//
app.use(function(req, res, next)
{
	//
	// Do not allow CORS for userToken without tenant name(=put/post unscoped token)
	//
	var userTokenUrlExp = new RegExp('^/v1/user/tokens(.*)');
	if(req.client.localAddress !== req.client.remoteAddress && !apiutil.isEmptyArray(apiutil.getSafeString(req.url).match(userTokenUrlExp))){
		//
		// case of POST/PUT userToken
		//
		if(!apiutil.findStringInArray(apiConf.getCORSIPs(), req.client.remoteAddress)){
			// [NOTE]
			// If allowcredauth is true in configuration and password is specified on PUT method,
			// it allows authorization by credential(username/password).
			// This case is used for accessing keystone directly.
			// (The password is empty is allowed.)
			//
			if(	(apiutil.compareCaseString(req.method, 'PUT') && apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.username) && !(apiConf.isAllowedCredentialAccess() && apiutil.isSafeEntity(req.query.password)))	||
				(apiutil.compareCaseString(req.method, 'POST') && apiutil.isSafeEntity(req.body) && apiutil.isSafeEntity(req.body.auth) && apiutil.isSafeEntity(req.body.auth.passwordCredentials))									)
			{
				//
				// case of specified user credentials(except specified unscoped token)
				//
				/* eslint-disable indent, no-mixed-spaces-and-tabs */
				var result = {
								result:		false,
								message:	'not allow CORS(cross-origin resource sharing) to /v1/user/tokens'
							 };
				/* eslint-enable indent, no-mixed-spaces-and-tabs */

				resutil.errResponse(req, res, 405, result, 'application/json; charset=utf-8');
				return;
			}
		}
	}
	//
	// Origin is specified, allow it.
	//
	if(apiutil.isSafeString(req.headers.origin)){
		res.header('Access-Control-Allow-Origin',		req.headers.origin);
		res.header('Access-Control-Allow-Headers',		'Origin,X-Requested-With,X-HTTP-Method-Override,Content-Type,Accept,X-Auth-Token,x-k2hr3-debug');
		res.header('Access-Control-Allow-Methods',		'HEAD,POST,GET,PUT,DELETE,OPTIONS');
		res.header('Access-Control-Expose-Headers',		'X-Auth-Token,x-k2hr3-error');
		res.header('Access-Control-Allow-Credentials',	true);
		res.header('Access-Control-Max-Age',			'86400');
	}
	next();
});

//
// Setting for express
//
if(is_logging){
	//
	// Setup Log
	//
	app.use(logger(apiConf.getAccessLogFormat(), apiConf.getMorganLoggerOption(__dirname)));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/status.html',	express.static(__dirname + '/public/status.html'));

//
// route mapping
//
app.use('/',					version);		// '/'
app.use('/v1',					version);		// '/v1'
userExp.use('/', 				userTokens);	// '/v1/user/tokens'
policyExp.use('/*', 			policy);		// '/v1/policy'
resourceExp.use('/*', 			resource);		// '/v1/resource'
roleExp.use('/*', 				role);			// '/v1/role'
serviceExp.use('/*', 			service);		// '/v1/service'
acrExp.use('/*', 				acr);			// '/v1/acr'
listExp.use('/*', 				list);			// '/v1/list'
userdataExp.use('/*', 			userdata);		// '/v1/userdata'
if(!is_product){
	verifyExp.use('/*',			verify);		// '/v1/debug/verify*'
}

app.use('/v1/user/tokens',		userExp);		// mountpath:	'/v1/user/tokens*'
app.use('/v1/policy',			policyExp);		// mountpath:	'/v1/policy*'
app.use('/v1/resource',			resourceExp);	// mountpath:	'/v1/resource*'
app.use('/v1/role',				roleExp);		// mountpath:	'/v1/role*'
app.use('/v1/service',			serviceExp);	// mountpath:	'/v1/service*'
app.use('/v1/acr',				acrExp);		// mountpath:	'/v1/acr*'
app.use('/v1/list',				listExp);		// mountpath:	'/v1/list*'
app.use('/v1/userdata',			userdataExp);	// mountpath:	'/v1/userdata*'
if(!is_product){
	app.use('/v1/debug/verify',	verifyExp);		// mountpath:	'/v1/debug/verify*'
}

//
// catch 404 and forward to error handler
//
app.use(function(req, res, next)
{
	var err = new Error('Not Found');

	err.status = 404;
	next(err);
});

//
// error handler
//
app.use(function(err, req, res, next)		// eslint-disable-line no-unused-vars
{
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var result = {
					result:		false,
					message:	'Internal server error'
				 };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	resutil.errResponse(req, res, (err.status || 500), result, 'application/json; charset=utf-8');
});

module.exports = app;

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
