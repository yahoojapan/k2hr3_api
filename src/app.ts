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

//---------------------------------------------------------
// Imports
//---------------------------------------------------------
import	path						from 'path';
import	logger						from 'morgan';
import	cookieParser				from 'cookie-parser';
import	bodyParser					from 'body-parser';
import	apiutil						from './lib/k2hr3apiutil';
import	resutil						from './lib/k2hr3resutil';
import type	{ Writable }			from 'stream';
import type	{ resTypeBaseResult }	from './lib/types';
import	express, { type Express, type Request, type Response, type NextFunction }	from 'express';

//
// Load Configuration
//
import { r3ApiConfig }	from './lib/k2hr3config';
const apiConf	= new r3ApiConfig();

//
// Load variables
//
// - Local Tenants
// - Load CORS(Cross-Origin Resource Sharing) Setting
//
// [NOTE][TODO]
// It specifies a web development machine for temporary debugging.
// In future we plan to specify with K2HR3 role.
//
let		is_localtenants		= true;
const	cors_ips: string[]	= [];

(() => {
	is_localtenants = apiConf.isLocalTenants();
	if(apiutil.isSafeEntity(apiConf) && apiutil.isNotEmptyArray(apiConf.getCORSIPs())){
		apiutil.mergeArray(cors_ips, apiConf.getCORSIPs());
	}
})();

//---------------------------------------------------------
// Environments
//---------------------------------------------------------
// NODE_ENV(development or production)
// NODE_LOGGER(if 'no', not logging by morgan)
//
const is_product = apiutil.compareCaseString(apiutil.getSafeString(process.env.NODE_ENV), 'production');
const is_logging = !apiutil.compareCaseString(apiutil.getSafeString(process.env.NODE_LOGGER), 'no');

//---------------------------------------------------------
// Routes
//---------------------------------------------------------
import version		from './routes/version';
import userTokens	from './routes/userTokens';
import policy		from './routes/policy';
import resource		from './routes/resource';
import role			from './routes/role';
import service		from './routes/service';
import acr			from './routes/acr';
import list			from './routes/list';
import userdata		from './routes/userdata';
import extdata		from './routes/extdata';
import tenantModule	from './routes/tenant';
import verifyModule	from './routes/debugVerify';

let tenant: typeof tenantModule | null = null;
if(is_localtenants){
	tenant = tenantModule;
}

let verify: typeof verifyModule | null = null;
if(!is_product){
	verify = verifyModule;
}

//
// Express objects
//
const app			= express();
const userExp		= express();
const policyExp		= express();
const resourceExp	= express();
const roleExp		= express();
const serviceExp	= express();
const acrExp		= express();
const listExp		= express();
const userdataExp	= express();
const extdataExp	= express();

let tenantExp: Express | null = null;
if(is_localtenants){
	tenantExp	= express();
}

let verifyExp: Express | null = null;
if(!is_product){
	verifyExp	= express();
}

//---------------------------------------------------------
// Trusted proxy
//---------------------------------------------------------
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
extdataExp.set('trust proxy',	'loopback');
if(tenantExp){
	tenantExp.set('trust proxy','loopback');
}
if(verifyExp){
	verifyExp.set('trust proxy','loopback');
}

//
// CORS(Cross-Origin Resource Sharing) Controller
//
app.use((req: Request, res: Response, next: NextFunction) => {
	//
	// Do not allow CORS for userToken without tenant name(=put/post unscoped token)
	//
	const userTokenUrlExp = new RegExp('^/v1/user/tokens(.*)');
	if(req.socket.localAddress !== req.socket.remoteAddress && apiutil.isNotEmptyArray(apiutil.getSafeString(req.url).match(userTokenUrlExp))){
		//
		// case of POST/PUT userToken
		//
		if(!apiutil.findStringInArray(apiConf.getCORSIPs(), req.socket.remoteAddress) && !apiutil.findStringInArray(apiConf.getCORSIPs(), '*')){
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
				const result: resTypeBaseResult = {
					result:		false,
					message:	'not allow CORS(cross-origin resource sharing) to /v1/user/tokens'
				 };
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
		res.header('Access-Control-Allow-Credentials',	'true');
		res.header('Access-Control-Max-Age',			'86400');
	}
	next();
});

//---------------------------------------------------------
// Express
//---------------------------------------------------------
//
// Setting for express
//
if(is_logging){
	//
	// Setup Log
	//
	const format: string							= apiConf.getAccessLogFormat() ?? 'combined';
	const options: { stream: Writable } | undefined	= apiConf.getMorganLoggerOption(__dirname) ?? undefined;
	app.use(logger(format, options));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/status.html',	express.static(__dirname + '/public/status.html'));

//
// Route mapping
//
app.use('/',									version);		// '/'
app.use('/v1',									version);		// '/v1'
userExp.use('/',								userTokens);	// '/v1/user/tokens'
policyExp.use('/',								policy);		// '/v1/policy'
resourceExp.use('/',							resource);		// '/v1/resource'
roleExp.use('/',								role);			// '/v1/role'
serviceExp.use('/',								service);		// '/v1/service'
acrExp.use('/',									acr);			// '/v1/acr'
listExp.use('/',								list);			// '/v1/list'
userdataExp.use('/',							userdata);		// '/v1/userdata'
extdataExp.use('/',								extdata);		// '/v1/extdata'
if(tenantExp && tenant){
	tenantExp.use('/',							tenant);		// '/v1/tenant'
}
if(verifyExp && verify){
	verifyExp.use('/',							verify);		// '/v1/debug/verify*'
}

app.use(/^\/v1\/user\/tokens(?:\/.*)?$/,		userExp);		// mountpath:	'/v1/user/tokens*'
app.use(/^\/v1\/policy(?:\/.*)?$/,				policyExp);		// mountpath:	'/v1/policy*'
app.use(/^\/v1\/resource(?:\/.*)?$/,			resourceExp);	// mountpath:	'/v1/resource*'
app.use(/^\/v1\/role(?:\/.*)?$/,				roleExp);		// mountpath:	'/v1/role*'
app.use(/^\/v1\/service(?:\/.*)?$/,				serviceExp);	// mountpath:	'/v1/service*'
app.use(/^\/v1\/acr(?:\/.*)?$/,					acrExp);		// mountpath:	'/v1/acr*'
app.use(/^\/v1\/list(?:\/.*)?$/,				listExp);		// mountpath:	'/v1/list*'
app.use(/^\/v1\/userdata(?:\/.*)?$/,			userdataExp);	// mountpath:	'/v1/userdata*'
app.use(/^\/v1\/extdata(?:\/.*)?$/,				extdataExp);	// mountpath:	'/v1/extdata*'
if(tenantExp){
	app.use(/^\/v1\/tenant(?:\/.*)?$/,			tenantExp);		// mountpath:	'/v1/tenant*'
}
if(verifyExp){
	app.use(/^\/v1\/debug\/verify(?:\/.*)?$/,	verifyExp);		// mountpath:	'/v1/debug/verify*'
}

//---------------------------------------------------------
// Error handler
//---------------------------------------------------------
//
// Added status member to Error type, we need to use this status member
//
interface StatusError extends Error{
	status?: number;
}

app.use((req: Request, res: Response, next: NextFunction) => {

	const err: StatusError = new Error('Not Found');
	err.status = 404;
	next(err);
});

//
// error handler
//
app.use((err: StatusError, req: Request, res: Response, _next: NextFunction) => {

	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	const result: resTypeBaseResult = {
		result:		false,
		message:	'Internal server error'
	};
	resutil.errResponse(req, res, (err.status || 500), result, 'application/json; charset=utf-8');
});

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export default app;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
