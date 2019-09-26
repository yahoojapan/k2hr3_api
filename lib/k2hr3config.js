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
 * CREATE:   Wed Oct 31 2018
 * REVISION:
 *
 */

'use strict';

var	path		= require('path');
var	rotatefs	= require('rotating-file-stream');						// [NOTICE] rotating-file-stream is using fsevents optionally.
var	apiutil		= require('./k2hr3apiutil');

//---------------------------------------------------------
// load configuration for API
//---------------------------------------------------------
//
// For IP Addresses checker(watcher) type
//
const chkipconfigType = {
	CHECKER_TYPE_LISTENER:	'Listener',
	CHECKER_TYPE_FUNCTION:	'Function',
	CHECKER_TYPE_BASIC_OR:	'BasicOr',
	CHECKER_TYPE_BASIC_AND:	'BasicAnd',
	CHECKER_TYPE_NOCHECK:	'NoCheck'
};

var	loadedConfig = (function()
{
	var	config	= require('config');
	var	data	= {
		// [NOTE]
		// Set keystone type and others for openstack keystone.
		//
		// Specify the keystone.type module to handle keystone authentication.
		// We prepare two of keystone V2/V3 for this value by k2hr3. They are
		// lib/openstackapiv2.js and lib/openstackapiv3.js.
		// Please specify module name specified for keystone.type without
		// extension. The matching file name is automatically searched from
		// the lib directory.
		// If you want to use your own module, prepare the file in the lib
		// directory and specify the file name. To create your own, please
		// prepare the module exporting the getKeystoneEndpoint(callback, is_v3, is_test, timeout)
		// function. For details of the getKeystoneEndpoint function, please
		// refer to openstackep.js.
		// 
		// Please specify 'list' or 'file' as keystone.eptype.
		// If 'list' is specified, please specify one or more {'region name': 'keystone endpoint URI'}
		// in keystone.eplist.
		// If you specify 'file', specify keystone.epfile with your own module
		// name in the lib directory. This module specifies the file exporting
		// the getDynamicKeystoneEndpoints(cbargs, callback) function.
		// The getDynamicKeystoneEndpoints function takes callback(cbargs, error, endpoint_mapping)
		// as a callback function as an argument. 'endpoint_mapping' argument
		// of this callback function should return data of the same type as
		// keystone.eplist.
		// cbargs specifies the cbargs passed to the getDynamicKeystoneEndpoints
		// function as is.
		//
		keystone: {														// User authentication type
			type:			'openstackapiv3',							// module name in lib for openstack keystone access
			eptype:			'list',										// type of openstack keystone endpoint
			epfile:			null,
			eplist: {
				myregion:	'https://dummy.keystone.openstack/'
			}
		},

		k2hdkc: {														// Slave configuration to K2HDKC cluster
			config:			'/etc/k2hdkc/slave.ini',					// Configuration file path for k2hdkc(chmpx) slave
			port:			'8031'										// Control port number for k2hdkc(chmpx) slave
		},

		corsips:			[											// CORS IP Addresses
			'::ffff:127.0.0.1',
			'127.0.0.1'
		],

		scheme:				'http',										// Scheme
		port:				80,											// Port
		multiproc:			true,										// Multi processing
		runuser:			'',											// Username for process owner
		privatekey:			'',											// Privatekey file path
		cert:				'',											// Certification file path
		ca:					'',											// CA

		logdir:				null,										// Path for logging directory
		fixedlogdir:		null,										// Fixed log directory
		accesslogname:		'access.log',								// Access log name
		accesslogform:		'combined',									// Access log format by morgan
		consolelogname:		null,										// Console(Error)/Debug log name
		watcherlogname:		'watcher.log',								// Watcher log name
		watchertimeform:	'yyyy/mm/dd HH:MM:ss',						// Watcher log time format by dateformat
		wconsolelogname:	null,										// Console(Error)/Debug log name by watcher
		logrotateopt: 		{											// rotating-file-stream option object
			compress:			'gzip',									// gzip		: compression method of rotated files.
			interval:			'6h',									// 6 hour	: the time interval to rotate the file.
			initialRotation:	true,									// true		: initial rotation based on not-rotated file timestamp.
			path:				null									// null		: the base path for files.(* this value is replace by 'logdir')
			/*
			*  [NOTE] following option is not specified now.
			*
			rotationTime:		true,									// true		: makes rotated file name with time of rotation.
			highWaterMark:		null,									// null		: proxy to new stream.
			history:			null,									// null		: the history filename.
			immutable:			null,									// null		: never mutates file names.
			maxFiles:			null,									// null		: the maximum number of rotated files to keep.
			maxSize:			null,									// null		: the maximum size of rotated files to keep.
			mode:				null,									// null		: proxy to fs.createWriteStream
			rotate:				null,									// null		: enables the classical UNIX logrotate behaviour.
			size:				null									// null		: the file size to rotate the file.
			*/
		},

		userdata:			{											// Userdata for Openstack
			baseuri:			'https://localhost',					// URI
			cc_templ:			'config/k2hr3-cloud-config.txt.templ',	// Template for Cloud Config part
			script_templ:		'config/k2hr3-init.sh.templ',			// Template for Shell part
			errscript_templ:	'config/k2hr3-init-error.sh.templ',		// Template for common shell if error
			algorithm:			'aes-256-cbc',							// Encrypt type
			passphrase:			'k2hr3_regpass'							// Default passphrase
		},

		k2hr3admin:			{											// K2HR3 Admin information for example is removing IP Addresses
			tenant:				'admintenant',							// Admin tenant name
			delhostrole:		'delhostrole'							// Admin Role name
		},

		confirmtenant:		false,										// Whichever confirm tenant when adding service member

		chkipconfig:		{											// IP Addresses checker(watcher) type
			type:				chkipconfigType.CHECKER_TYPE_LISTENER,	// Listener / Function / Basic{Or|And} / NoCheck
			funcmod:			null,									// Module name(path) for Function type
			pendingsec:			864000,									// Limit for removing IP which is not alive         : 10 * 24 * 60 * 60   = 10 days
			intervalms:			4320000,								// Interval ms for checking IP address              : 12 * 60 * 60 * 1000 = 12 hour
			parallelcnt:		32,										// Parallel processing count
			command4:			'ping',									// Basic IP address check use this command for IPv4 : ping command
			command6:			'ping6',								// Basic IP address check use this command for IPv6
			params:				'-c 1',									// Common ping command parameters
			timeoutparam:		'-W',									// Timeout parameter name for ping command
			timeoutms:			5000									// Timeout millisecond for each checking            : 5000ms
		},
		allowcredauth:		true,										// allow CORS access for authorization by credential

		expiration:				{										// Expiration for Tokens
			roletoken:			86400,									// Expire time(sec) for RoleToken                   : 24 * 60 * 60   = 1 day
			regroletoken:		315360000								// Expire time(sec) for register host               : 10 * 356 * 24 * 60 * 60   = 10 years(no expire)
		}
	};

	if(apiutil.isSafeEntity(config)){
		var	tmp;

		// Keystone type
		if(apiutil.isSafeEntity(config.keystone)){
			if(apiutil.isSafeString(config.keystone.type)){
				data.keystone.type	= config.keystone.type;
			}
			if(apiutil.compareCaseString('list', config.keystone.eptype)){
				if(apiutil.isSafeEntity(config.keystone.eplist)){
					var	eplist = {};
					for(var region in config.keystone.eplist){
						if(apiutil.isSafeUrl(config.keystone.eplist[region])){
							eplist[region] = config.keystone.eplist[region];
						}
					}
					data.keystone.eptype = config.keystone.eptype;
					data.keystone.epfile = null;
					data.keystone.eplist = eplist;
				}else{
					// Wrong value
				}
			}else if(apiutil.compareCaseString('file', config.keystone.eptype)){
				if(apiutil.isSafeString(config.keystone.epfile)){
					data.keystone.eptype = config.keystone.eptype;
					data.keystone.epfile = config.keystone.epfile;
					data.keystone.eplist = null;
				}else{
					// Wrong value
				}
			}else{
				// Unknown value
			}
		}

		// K2HDKC configuration
		if(apiutil.isSafeEntity(config.k2hdkc)){
			if(apiutil.isSafeString(config.k2hdkc.config)){
				data.k2hdkc.config	= config.k2hdkc.config;
			}
			if(apiutil.isSafeEntity(config.k2hdkc.port) && !isNaN(config.k2hdkc.port)){
				data.k2hdkc.port	= config.k2hdkc.port;
			}
		}

		// CORS
		if(!apiutil.isEmptyArray(config.corsips)){
			apiutil.mergeArray(data.corsips, config.corsips);
		}

		// multi processes
		if(apiutil.isSafeEntity(config.multiproc) && 'boolean' == typeof config.multiproc){
			data.multiproc		= config.multiproc;
		}

		// scheme & port
		if(apiutil.isSafeString(config.scheme)){
			data.scheme			= apiutil.getSafeString(config.scheme);
			if(apiutil.compareCaseString('http', data.scheme)){
				data.port		= 80;
			}else if(apiutil.compareCaseString('https', data.scheme)){
				data.port		= 443;
			}
		}
		if(apiutil.isSafeEntity(config.port)){
			tmp = normalizePort(config.port);
			if(false !== tmp){
				data.port		= tmp;
			}
		}else if(apiutil.isSafeEntity(process.env.PORT)){	// Get port from environment
			tmp = normalizePort(process.env.PORT);
			if(false !== tmp){
				data.port		= tmp;
			}
		}
		// run user
		if(apiutil.isSafeString(config.runuser) || null === config.runuser){
			data.runuser		= apiutil.getSafeString(config.runuser);
		}
		// private key & cert & ca
		if(apiutil.isSafeString(config.privatekey) || null === config.privatekey){
			data.privatekey		= apiutil.getSafeString(config.privatekey);
		}
		if(apiutil.isSafeString(config.cert) || null === config.cert){
			data.cert			= apiutil.getSafeString(config.cert);
		}
		if(apiutil.isSafeString(config.ca) || null === config.ca){
			data.ca				= apiutil.getSafeString(config.ca);
		}

		// log directory
		if(apiutil.isSafeString(config.logdir) || null === config.logdir){
			data.logdir			= apiutil.getSafeString(config.logdir);
		}
		// access log file name
		if(apiutil.isSafeString(config.accesslogname) || null === config.accesslogname){
			data.accesslogname	= apiutil.getSafeString(config.accesslogname);
		}
		// access log format
		if(apiutil.isSafeString(config.accesslogform)){
			data.accesslogform	= apiutil.getSafeString(config.accesslogform);
		}
		// console(error) log file name
		if(apiutil.isSafeString(config.consolelogname) || null === config.consolelogname){
			data.consolelogname	= apiutil.getSafeString(config.consolelogname);
		}
		// watcher log file name
		if(apiutil.isSafeString(config.watcherlogname) || null === config.watcherlogname){
			data.watcherlogname	= apiutil.getSafeString(config.watcherlogname);
		}
		// watcher log time format
		if(apiutil.isSafeString(config.watchertimeform)){
			data.watchertimeform= apiutil.getSafeString(config.watchertimeform);
		}
		// watcher console(error) log file name
		if(apiutil.isSafeString(config.wconsolelogname) || null === config.wconsolelogname){
			data.wconsolelogname= apiutil.getSafeString(config.wconsolelogname);
		}
		// log rotation option
		if(apiutil.isSafeEntity(config.logrotateopt) && 'object' == typeof config.logrotateopt && !apiutil.isArray(config.logrotateopt)){
			Object.keys(config.logrotateopt).forEach(function(key){
				if(apiutil.isSafeEntity(data.logrotateopt[key])){
					data.logrotateopt[key] = config.logrotateopt[key];
				}else{
					// [NOTE] Not allow keyname
				}
			});
		}

		// Userdata
		if(apiutil.isSafeEntity(config.userdata)){
			if(apiutil.isSafeString(config.userdata.baseuri)){
				data.userdata.baseuri			= config.userdata.baseuri;
			}
			if(apiutil.isSafeString(config.userdata.cc_templ)){
				data.userdata.cc_templ			= config.userdata.cc_templ;
			}
			if(apiutil.isSafeString(config.userdata.script_templ)){
				data.userdata.script_templ		= config.userdata.script_templ;
			}
			if(apiutil.isSafeString(config.userdata.errscript_templ)){
				data.userdata.errscript_templ	= config.userdata.errscript_templ;
			}
			if(apiutil.isSafeString(config.userdata.algorithm)){
				data.userdata.algorithm			= config.userdata.algorithm;
			}
			if(apiutil.isSafeString(config.userdata.passphrase)){
				data.userdata.passphrase		= config.userdata.passphrase;
			}
		}

		// Admin
		if(apiutil.isSafeEntity(config.k2hr3admin)){
			if(apiutil.isSafeString(config.k2hr3admin.tenant)){
				data.k2hr3admin.tenant			= config.k2hr3admin.tenant;
			}
			if(apiutil.isSafeString(config.k2hr3admin.delhostrole)){
				data.k2hr3admin.delhostrole		= config.k2hr3admin.delhostrole;
			}
		}

		// Confirm tenant mode for adding service member
		if(apiutil.isSafeEntity(config.confirmtenant) && 'boolean' == typeof config.confirmtenant){
			data.confirmtenant					= config.confirmtenant;
		}

		// IP Addresses checker(watcher) config
		if(apiutil.isSafeEntity(config.chkipconfig)){
			if(	apiutil.isSafeString(config.chkipconfig.type) &&
				(	chkipconfigType.CHECKER_TYPE_LISTENER	=== config.chkipconfig.type ||
					chkipconfigType.CHECKER_TYPE_FUNCTION	=== config.chkipconfig.type ||
					chkipconfigType.CHECKER_TYPE_BASIC_OR	=== config.chkipconfig.type ||
					chkipconfigType.CHECKER_TYPE_BASIC_AND	=== config.chkipconfig.type ||
					chkipconfigType.CHECKER_TYPE_NOCHECK	=== config.chkipconfig.type )
			){
				data.chkipconfig.type			= config.chkipconfig.type;
			}
			if(apiutil.isSafeString(config.chkipconfig.funcmod)){
				data.chkipconfig.funcmod		= config.chkipconfig.funcmod;
			}
			if(apiutil.isSafeEntity(config.chkipconfig.pendingsec) && !isNaN(config.chkipconfig.pendingsec)){
				data.chkipconfig.pendingsec		= config.chkipconfig.pendingsec;
			}
			if(apiutil.isSafeEntity(config.chkipconfig.intervalms) && !isNaN(config.chkipconfig.intervalms)){
				data.chkipconfig.intervalms		= config.chkipconfig.intervalms;
			}
			if(apiutil.isSafeEntity(config.chkipconfig.parallelcnt) && !isNaN(config.chkipconfig.parallelcnt)){
				data.chkipconfig.parallelcnt	= config.chkipconfig.parallelcnt;
			}
			if(apiutil.isSafeString(config.chkipconfig.command4)){
				data.chkipconfig.command4		= config.chkipconfig.command4;
			}
			if(apiutil.isSafeString(config.chkipconfig.command6)){
				data.chkipconfig.command6		= config.chkipconfig.command6;
			}
			if(apiutil.isSafeString(config.chkipconfig.params)){
				data.chkipconfig.params			= config.chkipconfig.params;
			}
			if(apiutil.isSafeString(config.chkipconfig.timeoutparam)){
				data.chkipconfig.timeoutparam	= config.chkipconfig.timeoutparam;
			}
			if(apiutil.isSafeEntity(config.chkipconfig.timeoutms) && !isNaN(config.chkipconfig.timeoutms)){
				data.chkipconfig.timeoutms		= config.chkipconfig.timeoutms;
			}
		}
		if(apiutil.isSafeEntity(config.allowcredauth) && 'boolean' == typeof config.allowcredauth && config.allowcredauth){
			data.allowcredauth					= config.allowcredauth;
		}

		// Expiration for Tokens
		if(apiutil.isSafeEntity(config.expiration)){
			if(apiutil.isSafeEntity(config.expiration.roletoken) && !isNaN(config.expiration.roletoken)){
				data.expiration.roletoken		= parseInt(config.expiration.roletoken);
			}
			if(apiutil.isSafeEntity(config.expiration.regroletoken) && !isNaN(config.expiration.regroletoken)){
				data.expiration.regroletoken	= parseInt(config.expiration.regroletoken);
			}
		}
	}
	return data;
}());

//
// Normalize a port into a number, string, or false.
//
function normalizePort(val)
{
	if(isNaN(val)){
		// named pipe
		if(!apiutil.isSafeString(val)){
			return false;
		}
		return val;
	}
	var	port = parseInt(val, 10);
	if(0 <= port){
		// port number
		return port;
	}
	return false;
}

//---------------------------------------------------------
// Configuration Class
//---------------------------------------------------------
var R3ApiConfig = (function()
{
	//
	// Constructor
	//
	var R3ApiConfig = function()
	{
		this.loadedConfig	= loadedConfig;
		this.consolelog		= null;
	};

	var proto = R3ApiConfig.prototype;

	//
	// Methods
	//
	proto.getKeystoneConfig = function()
	{
		return this.loadedConfig.keystone;
	};

	proto.getKeystoneType = function()
	{
		return this.loadedConfig.keystone.type;
	};

	proto.getKeystoneEpType = function()
	{
		return this.loadedConfig.keystone.eptype;
	};

	proto.isKeystoneEpList = function()
	{
		return apiutil.compareCaseString('list', this.loadedConfig.keystone.eptype);
	};

	proto.getKeystoneEpList = function()
	{
		if(!apiutil.compareCaseString('list', this.loadedConfig.keystone.eptype)){
			return null;
		}
		return this.loadedConfig.keystone.eplist;		// [NOTE] return reference
	};

	proto.isKeystoneEpFile = function()
	{
		return apiutil.compareCaseString('file', this.loadedConfig.keystone.eptype);
	};

	proto.getKeystoneEpFile = function()
	{
		if(!apiutil.compareCaseString('file', this.loadedConfig.keystone.eptype)){
			return null;
		}
		return this.loadedConfig.keystone.epfile;
	};

	proto.getK2hdkcConfig = function()
	{
		return this.loadedConfig.k2hdkc.config;
	};

	proto.getK2hdkcPort = function()
	{
		return this.loadedConfig.k2hdkc.port;
	};

	proto.getCORSIPs = function()
	{
		return this.loadedConfig.corsips;
	};

	proto.isMultiProc = function()
	{
		return this.loadedConfig.multiproc;
	};

	proto.getScheme = function()
	{
		return this.loadedConfig.scheme;
	};

	proto.getPort = function()
	{
		return this.loadedConfig.port;
	};

	proto.getRunUser = function()
	{
		return this.loadedConfig.runuser;
	};

	proto.getPrivateKey = function()
	{
		return this.loadedConfig.privatekey;
	};

	proto.getCert = function()
	{
		return this.loadedConfig.cert;
	};

	proto.getCA = function()
	{
		return this.loadedConfig.ca;
	};

	proto.updateLogDir = function(basepath)
	{
		var	dirpath = null;
		if(null !== this.loadedConfig.logdir){
			if(0 === this.loadedConfig.logdir.indexOf('/')){
				dirpath = path.join(this.loadedConfig.logdir);										// logdir is full path
			}else{
				if(apiutil.isSafeString(basepath)){
					if(0 === basepath.indexOf('/')){
						dirpath = path.join(basepath, this.loadedConfig.logdir);
					}else{
						dirpath = path.join(__dirname, '../..', basepath, this.loadedConfig.logdir);// from top directory
					}
				}else{
					dirpath = path.join(__dirname, '../..', this.loadedConfig.logdir);				// from top directory
				}
			}
		}else{
			// logdir is null, it means not putting log to file.
		}

		// update log directory
		this.loadedConfig.fixedlogdir = dirpath;
		if(apiutil.isSafeString(dirpath)){
			// check log directory and make it if not exists
			if(null !== dirpath && !apiutil.checkMakeDir(dirpath)){
				console.warn('Log directory(' + dirpath + ') is not existed, and could not create it.');
				dirpath = null;		// continue with no log directory
			}else{
				// set dir path to log rotation option
				this.loadedConfig.logrotateopt['path'] = dirpath;
			}
		}

		return dirpath;
	};

	proto.getAccessLogName = function()
	{
		return this.loadedConfig.accesslogname;
	};

	proto.getAccessLogFormat = function()
	{
		return this.loadedConfig.accesslogform;
	};

	proto.getConsoleLogName = function()
	{
		return this.loadedConfig.consolelogname;
	};

	proto.getWatcherLogName = function()
	{
		return this.loadedConfig.watcherlogname;
	};

	proto.getWatcherTimeFormat = function()
	{
		return this.loadedConfig.watchertimeform;
	};

	proto.getWatcherConsoleLogName = function()
	{
		return this.loadedConfig.wconsolelogname;
	};

	proto.getLogRotateOption = function()
	{
		return this.loadedConfig.logrotateopt;
	};

	proto.getRotateLogStream = function(basedir, filename)
	{
		var	logstream	= null;
		var	logdir		= this.updateLogDir(basedir);
		if(null == logdir){
			return logstream;
		}
		if(!apiutil.isSafeString(filename)){
			return logstream;
		}
		try{
			logstream = rotatefs(filename, this.loadedConfig.logrotateopt);
		}catch(error){
			console.warn('Could not create log rotate option by : ' + JSON.stringify(error.message));
			logstream = null;
		}
		return logstream;
	};

	proto.getMorganLoggerOption = function(basedir)
	{
		var	loggeropt = null;
		var	logstream = this.getRotateLogStream(basedir, this.loadedConfig.accesslogname);
		if(null !== logstream){
			loggeropt = {
				stream: logstream
			};
		}
		return loggeropt;
	};

	proto.getWatcherLoggingStream = function(basedir)
	{
		var	logstream = this.getRotateLogStream(basedir, this.loadedConfig.watcherlogname);
		if(null == logstream){
			// [NOTE]
			// Default stream is stdout
			//
			logstream = process.stdout;
		}
		return logstream;
	};

	proto.setConsoleLogging = function(basedir, is_watcher)
	{
		var	logname = this.loadedConfig.consolelogname;
		if(apiutil.isSafeEntity(is_watcher) && 'boolean' == typeof is_watcher && is_watcher){
			logname = this.loadedConfig.wconsolelogname;
		}
		var	logstream = this.getRotateLogStream(basedir, logname);
		if(null !== logstream){
			this.consolelog		= new console.Console(logstream, logstream);
			global.console.error= this.consolelog.error;
			global.console.warn	= this.consolelog.warn;
			global.console.log	= this.consolelog.log;
			global.console.debug= this.consolelog.debug;
			global.console.info	= this.consolelog.info;
		}
		return true;
	};

	proto.getUserdataConfig = function()
	{
		return this.loadedConfig.userdata;
	};

	proto.getK2hr3AdminConfig = function()
	{
		return this.loadedConfig.k2hr3admin;
	};

	proto.isConfirmTenantForService = function()
	{
		return this.loadedConfig.confirmtenant;
	};

	proto.getCheckIPConfig = function()
	{
		return this.loadedConfig.chkipconfig;
	};

	proto.isAllowedCredentialAccess = function()
	{
		return this.loadedConfig.allowcredauth;
	};

	proto.getExpireTimeRoleToken = function()
	{
		return this.loadedConfig.expiration.roletoken;
	};

	proto.getExpireTimeRegRoleToken = function()
	{
		return this.loadedConfig.expiration.regroletoken;
	};

	return R3ApiConfig;
})();

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.chkipType	= chkipconfigType;

exports.r3ApiConfig	= R3ApiConfig;

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
