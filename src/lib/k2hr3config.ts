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
 * CREATE:   Wed Oct 31 2018
 * REVISION:
 *
 */

import	* as path			from 'path';
import	* as rotatefs		from 'rotating-file-stream';
import	config				from 'config';
import	apiutil				from './k2hr3apiutil';

import type	{ Console }		from 'console';
import type	{ Writable }	from 'stream';
import type	{ Options }		from 'rotating-file-stream';
import openstackep, { type valTypeKeystoneEndpointMap }	from './openstackep';

//---------------------------------------------------------
// Utilities
//---------------------------------------------------------
//
// For rotating-file-stream Options:interval
//
type valTypeIntervalNumbers = `${number}d` | `${number}s` | `${number}M` | `${number}h` | `${number}m`;

const toIntervalNumber = (val: string): valTypeIntervalNumbers => {
	if(/^\d+d$/.test(val)){	return val as valTypeIntervalNumbers;	}
	if(/^\d+s$/.test(val)){	return val as valTypeIntervalNumbers;	}
	if(/^\d+M$/.test(val)){	return val as valTypeIntervalNumbers;	}
	if(/^\d+h$/.test(val)){	return val as valTypeIntervalNumbers;	}
	if(/^\d+m$/.test(val)){	return val as valTypeIntervalNumbers;	}
	return '1d' as valTypeIntervalNumbers;
};

//---------------------------------------------------------
// load configuration for API
//---------------------------------------------------------
//
// Interfaces ( for each parts )
//
export interface ExtDataItem
{
	[key: string]:	unknown;
}

export interface ConfigKeystone
{
	type:		string;										// module name in lib for openstack keystone access
	eptype:		string;										// type of openstack keystone endpoint
	epfile:		string | null;
	eplist?:	valTypeKeystoneEndpointMap | null;
}

export interface ConfigK2hdkc
{
	config:				string;								// Configuration file path for k2hdkc(chmpx) slave
	port:				string | number;					// Control port number for k2hdkc(chmpx) slave
	cuk:				string | null;						// CUK for k2hdkc(chmpx) slave
}

export interface ConfigLogRotateOpt
{
	compress:			string;								// gzip		: compression method of rotated files.
	interval:			string;								// 6 hour	: the time interval to rotate the file.
	initialRotation:	boolean;							// true		: initial rotation based on not-rotated file timestamp.
	path:				string | null;						// null		: the base path for files.(* this value is replace by 'logdir')
	[key: string]:		string | boolean | null;			// For dynamic access
}

export interface ConfigUserDataCrypt
{
	algorithm:			string | null;						// Encrypt type
	passphrase:			string | null;						// Default passphrase
}

type ConfigUserData = {
	baseuri:			string | null;						// URI
	cc_templ:			string | null;						// Template for Cloud Config part
	script_templ:		string | null;						// Template for Shell part
	errscript_templ:	string | null;						// Template for common shell if error
} & ConfigUserDataCrypt;

export interface ConfigExtData
{
	[key: string]:		ExtDataItem;						// Additional extra data
}

export interface ConfigK2hr3Admin
{
	tenant:				string | null;						// Admin tenant name
	delhostrole:		string | null;						// Admin Role name
}

export interface ConfigChkIP
{
	type:				string;								// Listener / Function / Basic{Or|And} / NoCheck (string value from chkipconfigType)
	funcmod:			string | null;						// Module name(path) for Function type
	pendingsec:			number;								// Limit for removing IP which is not alive         : 10 * 24 * 60 * 60   = 10 days
	intervalms:			number;								// Interval ms for checking IP address              : 12 * 60 * 60 * 1000 = 12 hour
	parallelcnt:		number;								// Parallel processing count
	command4:			string | null;						// Basic IP address check use this command for IPv4 : ping command
	command6:			string | null;						// Basic IP address check use this command for IPv6
	params:				string | null;						// Common ping command parameters
	timeoutparam:		string | null;						// Timeout parameter name for ping command
	timeoutms:			number;								// Timeout millisecond for each checking            : 5000ms
}

export interface ConfigExpiration
{
	roletoken:			number;								// Expire time(sec) for RoleToken                   : 24 * 60 * 60   = 1 day
	regroletoken:		number;								// Expire time(sec) for register host               : 10 * 356 * 24 * 60 * 60   = 10 years(no expire)
}

//
// Interface
//
export interface LoadedConfig
{
	keystone: 			ConfigKeystone;						// User authentication type
	k2hdkc: 			ConfigK2hdkc;						// Slave configuration to K2HDKC cluster
	corsips:			string[];							// CORS IP Addresses
	scheme:				string;								// Scheme
	port:				string | number;					// Port
	multiproc:			boolean;							// Multi processing
	runuser:			string;								// Username for process owner
	privatekey:			string;								// Privatekey file path
	cert:				string;								// Certification file path
	ca:					string;								// CA
	logdir:				string | null;						// Path for logging directory
	fixedlogdir:		string | null;						// Fixed log directory
	accesslogname:		string | null;						// Access log name
	accesslogform:		string | null;						// Access log format by morgan
	consolelogname:		string | null;						// Console(Error)/Debug log name
	watcherlogname:		string | null;						// Watcher log name
	watchertimeform:	string | null;						// Watcher log time format by dateformat
	wconsolelogname:	string | null;						// Console(Error)/Debug log name by watcher
	logrotateopt: 		ConfigLogRotateOpt;					// rotating-file-stream option object
	userdata:			ConfigUserData;						// Userdata for Openstack
	extdata:			ConfigExtData;						// Additional extra data
	k2hr3admin:			ConfigK2hr3Admin;					// K2HR3 Admin information for example is removing IP Addresses
	localtenants:		boolean;							// Whether to allow K2HR3 cluster local tenants
	confirmtenant:		boolean;							// Whichever confirm tenant when adding service member
	chkipconfig:		ConfigChkIP;						// IP Addresses checker(watcher) type
	allowcredauth:		boolean;							// allow CORS access for authorization by credential
	expiration:			ConfigExpiration;					// Expiration for Tokens

	[key: string]:		unknown;							// Other keys in config file
}

//
// Utility: copy(overwrite) LoadedConfig
//
const setLoadedConfig = (base: LoadedConfig, data: unknown): LoadedConfig | null => {

	if(!apiutil.isPlainObject(data)){
		return null;
	}

	// Keystone type
	if(apiutil.isPlainObject(data.keystone)){
		if(apiutil.isSafeString(data.keystone.type)){
			base.keystone.type			= data.keystone.type;
		}
		if(apiutil.isSafeString(data.keystone.eptype) && apiutil.compareCaseString('list', data.keystone.eptype)){
			if(openstackep.isValTypeKeystoneEndpointMap(data.keystone.eplist)){
				const	eplist: valTypeKeystoneEndpointMap = {};
				for(const region in data.keystone.eplist){
					const	tmpRegion = data.keystone.eplist[region];
					if(apiutil.isString(tmpRegion)){
						if(apiutil.isSafeUrl(tmpRegion)){
							eplist[region] = tmpRegion;
						}
					}
				}
				base.keystone.eptype = data.keystone.eptype;
				base.keystone.epfile = null;
				base.keystone.eplist = eplist;
			}else{
				// Wrong value
			}
		}else if(apiutil.isSafeString(data.keystone.eptype) && apiutil.compareCaseString('file', data.keystone.eptype)){
			if(apiutil.isSafeString(data.keystone.epfile)){
				base.keystone.eptype = data.keystone.eptype;
				base.keystone.epfile = data.keystone.epfile;
				base.keystone.eplist = null;
			}else{
				// Wrong value
			}
		}else{
			// Unknown value
		}
	}

	// K2HDKC configuration
	if(apiutil.isPlainObject(data.k2hdkc)){
		if(apiutil.isSafeString(data.k2hdkc.config)){
			base.k2hdkc.config	= data.k2hdkc.config;
		}
		if(apiutil.isSafeNumeric(data.k2hdkc.port)){
			const	tmpPort		= apiutil.cvtToNumber(data.k2hdkc.port);
			if(apiutil.isSafeNumber(tmpPort)){
				base.k2hdkc.port= tmpPort;
			}
		}
		if(null === data.k2hdkc.cuk || apiutil.isString(data.k2hdkc.cuk)){
			base.k2hdkc.cuk		= data.k2hdkc.cuk;
		}
	}

	// CORS
	if(apiutil.isStringArray(data.corsips)){
		base.corsips	= data.corsips;
	}

	// multi processes
	if(apiutil.isBoolean(data.multiproc)){
		base.multiproc	= data.multiproc;
	}

	// scheme & port
	if(apiutil.isString(data.scheme)){
		base.scheme		= apiutil.getSafeString(data.scheme);
		if(apiutil.compareCaseString('http', data.scheme)){
			base.port	= 80;
		}else if(apiutil.compareCaseString('https', data.scheme)){
			base.port	= 443;
		}
	}
	if(apiutil.isSafeEntity(data.port)){
		const	tmpPort	= apiutil.cvtToNumber(data.port);
		if(apiutil.isSafeNumber(tmpPort)){
			base.port	= tmpPort;
		}
	}else if(apiutil.isSafeNumeric(process.env.PORT)){		// Get port from environment
		const	tmpPort	= apiutil.cvtToNumber(process.env.PORT);
		if(apiutil.isSafeNumber(tmpPort)){
			base.port	= tmpPort;
		}
	}

	// run user
	if(null === data.runuser || apiutil.isString(data.runuser)){
		base.runuser	= apiutil.getSafeString(data.runuser);
	}

	// private key & cert & ca
	if(null === data.privatekey || apiutil.isString(data.privatekey)){
		base.privatekey	= apiutil.getSafeString(data.privatekey);
	}
	if(null === data.cert || apiutil.isString(data.cert)){
		base.cert		= apiutil.getSafeString(data.cert);
	}
	if(null === data.ca || apiutil.isString(data.ca)){
		base.ca			= apiutil.getSafeString(data.ca);
	}

	// log directory
	if(null === data.logdir || apiutil.isString(data.logdir)){
		base.logdir		= apiutil.getSafeString(data.logdir);
	}

	// access log file name
	if(null === data.accesslogname || apiutil.isString(data.accesslogname)){
		base.accesslogname		= apiutil.getSafeString(data.accesslogname);
	}
	if(null === data.accesslogform || apiutil.isString(data.accesslogform)){
		base.accesslogform		= apiutil.getSafeString(data.accesslogform);
	}
	if(null === data.consolelogname || apiutil.isString(data.consolelogname)){
		base.consolelogname		= apiutil.getSafeString(data.consolelogname);
	}
	if(null === data.watcherlogname || apiutil.isString(data.watcherlogname)){
		base.watcherlogname		= apiutil.getSafeString(data.watcherlogname);
	}
	if(null === data.watchertimeform || apiutil.isString(data.watchertimeform)){
		base.watchertimeform	= apiutil.getSafeString(data.watchertimeform);
	}
	if(null === data.wconsolelogname || apiutil.isString(data.wconsolelogname)){
		base.wconsolelogname	= apiutil.getSafeString(data.wconsolelogname);
	}

	// log rotation option
	if(apiutil.isPlainObject(data.logrotateopt)){
		if(apiutil.isSafeString(data.logrotateopt.compress)){
			base.logrotateopt.compress			= data.logrotateopt.compress;
		}
		if(apiutil.isSafeString(data.logrotateopt.interval)){
			base.logrotateopt.interval			= data.logrotateopt.interval;
		}
		if(apiutil.isBoolean(data.logrotateopt.initialRotation)){
			base.logrotateopt.initialRotation	= data.logrotateopt.initialRotation;
		}
		if(apiutil.isSafeString(data.logrotateopt.path)){
			base.logrotateopt.path				= data.logrotateopt.path;
		}

		const	_logrotateopt = data.logrotateopt as Record<string, unknown>;
		Object.keys(_logrotateopt).forEach((key) => {
			const	val = _logrotateopt[key];
			if(null === val || apiutil.isSafeString(val) || apiutil.isBoolean(val)){
				base.logrotateopt[key]			= val;
			}
		});
	}

	// Userdata
	if(apiutil.isPlainObject(data.userdata)){
		if(apiutil.isSafeString(data.userdata.baseuri)){
			base.userdata.baseuri			= data.userdata.baseuri;
		}
		if(apiutil.isSafeString(data.userdata.cc_templ)){
			base.userdata.cc_templ			= data.userdata.cc_templ;
		}
		if(apiutil.isSafeString(data.userdata.script_templ)){
			base.userdata.script_templ		= data.userdata.script_templ;
		}
		if(apiutil.isSafeString(data.userdata.errscript_templ)){
			base.userdata.errscript_templ	= data.userdata.errscript_templ;
		}
		if(apiutil.isSafeString(data.userdata.algorithm)){
			base.userdata.algorithm			= data.userdata.algorithm;
		}
		if(apiutil.isSafeString(data.userdata.passphrase)){
			base.userdata.passphrase		= data.userdata.passphrase;
		}
	}

	// Extdata
	if(apiutil.isPlainObject(data.extdata)){
		const	_extdata = data.extdata as Record<string, unknown>;
		Object.keys(_extdata).forEach((key) => {
			const one_extdata = _extdata[key];
			if(apiutil.isPlainObject(one_extdata) && apiutil.isSafeString(one_extdata.baseuri) && apiutil.isSafeString(one_extdata.template)){
				base.extdata[key]				= {};
				base.extdata[key].baseuri		= one_extdata.baseuri;
				base.extdata[key].template		= one_extdata.template;
				base.extdata[key].useragent		= apiutil.isSafeString(one_extdata.useragent) ? apiutil.getSafeString(one_extdata.useragent) : null;
				base.extdata[key].contenttype	= apiutil.isSafeString(one_extdata.contenttype) ? apiutil.getSafeString(one_extdata.contenttype) : 'text/plain';
			}else{
				// [NOTE] Some required parameters could not be detected, then skip this.
			}
		});
	}

	// Admin
	if(apiutil.isPlainObject(data.k2hr3admin)){
		if(apiutil.isSafeString(data.k2hr3admin.tenant)){
			base.k2hr3admin.tenant		= data.k2hr3admin.tenant;
		}
		if(apiutil.isSafeString(data.k2hr3admin.delhostrole)){
			base.k2hr3admin.delhostrole	= data.k2hr3admin.delhostrole;
		}
	}

	// Local tenants
	if(apiutil.isBoolean(data.localtenants)){
		base.localtenants	= data.localtenants;
	}

	// Confirm tenant mode for adding service member
	if(apiutil.isBoolean(data.confirmtenant)){
		base.confirmtenant	= data.confirmtenant;
	}

	// IP Addresses checker(watcher) config
	if(apiutil.isPlainObject(data.chkipconfig)){
		if(	apiutil.isSafeString(data.chkipconfig.type) &&
			(	chkipconfigType.CHECKER_TYPE_LISTENER	=== data.chkipconfig.type ||
				chkipconfigType.CHECKER_TYPE_FUNCTION	=== data.chkipconfig.type ||
				chkipconfigType.CHECKER_TYPE_BASIC_OR	=== data.chkipconfig.type ||
				chkipconfigType.CHECKER_TYPE_BASIC_AND	=== data.chkipconfig.type ||
				chkipconfigType.CHECKER_TYPE_NOCHECK	=== data.chkipconfig.type )
		){
			base.chkipconfig.type			= data.chkipconfig.type;
		}


		if(apiutil.isSafeString(data.chkipconfig.funcmod)){
			base.chkipconfig.funcmod		= data.chkipconfig.funcmod;
		}
		if(apiutil.isSafeNumeric(data.chkipconfig.pendingsec)){
			const	tmpTime					= apiutil.cvtToNumber(data.chkipconfig.pendingsec);
			if(apiutil.isSafeNumber(tmpTime)){
				base.chkipconfig.pendingsec	= tmpTime;
			}
		}
		if(apiutil.isSafeNumeric(data.chkipconfig.intervalms)){
			const	tmpTime					= apiutil.cvtToNumber(data.chkipconfig.intervalms);
			if(apiutil.isSafeNumber(tmpTime)){
				base.chkipconfig.intervalms	= tmpTime;
			}
		}
		if(apiutil.isSafeNumeric(data.chkipconfig.parallelcnt)){
			const	tmpCnt					= apiutil.cvtToNumber(data.chkipconfig.parallelcnt);
			if(apiutil.isSafeNumber(tmpCnt)){
				base.chkipconfig.parallelcnt= tmpCnt;
			}
		}
		if(apiutil.isSafeString(data.chkipconfig.command4)){
			base.chkipconfig.command4		= data.chkipconfig.command4;
		}
		if(apiutil.isSafeString(data.chkipconfig.command6)){
			base.chkipconfig.command6		= data.chkipconfig.command6;
		}
		if(apiutil.isSafeString(data.chkipconfig.params)){
			base.chkipconfig.params			= data.chkipconfig.params;
		}
		if(apiutil.isSafeString(data.chkipconfig.timeoutparam)){
			base.chkipconfig.timeoutparam	= data.chkipconfig.timeoutparam;
		}
		if(apiutil.isSafeNumeric(data.chkipconfig.timeoutms)){
			const	tmpTime					= apiutil.cvtToNumber(data.chkipconfig.timeoutms);
			if(apiutil.isSafeNumber(tmpTime)){
				base.chkipconfig.timeoutms	= tmpTime;
			}
		}
	}
	if(apiutil.isBoolean(data.allowcredauth)){
		base.allowcredauth	= data.allowcredauth;
	}

	// Expiration for Tokens
	if(apiutil.isPlainObject(data.expiration)){
		if(apiutil.isSafeNumeric(data.expiration.roletoken)){
			const	tmpNum					= apiutil.cvtToNumber(data.expiration.roletoken);
			if(apiutil.isSafeNumber(tmpNum)){
				base.expiration.roletoken	= tmpNum;
			}
		}
		if(apiutil.isSafeNumeric(data.expiration.regroletoken)){
			const	tmpNum					= apiutil.cvtToNumber(data.expiration.regroletoken);
			if(apiutil.isSafeNumber(tmpNum)){
				base.expiration.regroletoken= tmpNum;
			}
		}
	}

	// Other objects
	Object.keys(config).forEach((key: string): void => {
		if(!apiutil.findStringInArray(reserved_key_list, key)){
			// not found key in reserved key name list, then add(replace) this object to data.
			base[key] = data[key];
		}
	});

	return base;
};

//
// [NOTE]
// About type assertion
// 
// The config package loads settings dynamically and does not
// guarantee type safety by default.
// To address this, we define our own LoadedConfig type for
// project-specific configuration, and use a type assertion(as
// LoadedConfig) on the config object.
// This allows us to access configuration values with type safety.
//
// Note: Type assertion does not perform runtime checks. TypeScript
// will assume the config object matches LoadedConfig,
// even if the actual config content differs. Be careful to keep
// the LoadedConfig definition in sync with the configuration file.
//
const k2hr3Config = config as unknown;

//
// For IP Addresses checker(watcher) type
//
export const chkipconfigType = {
	CHECKER_TYPE_LISTENER:	'Listener',
	CHECKER_TYPE_FUNCTION:	'Function',
	CHECKER_TYPE_BASIC_OR:	'BasicOr',
	CHECKER_TYPE_BASIC_AND:	'BasicAnd',
	CHECKER_TYPE_NOCHECK:	'NoCheck'
} as const;

//
// Reserved key name in config
//
const reserved_key_list = [
	'keystone',
	'k2hdkc',
	'corsips',
	'multiproc',
	'scheme',
	'port',
	'runuser',
	'privatekey',
	'cert',
	'ca',
	'logdir',
	'accesslogname',
	'accesslogform',
	'consolelogname',
	'watcherlogname',
	'watchertimeform',
	'wconsolelogname',
	'logrotateopt',
	'userdata',
	'extdata',
	'k2hr3admin',
	'localtenants',
	'confirmtenant',
	'chkipconfig',
	'allowcredauth',
	'expiration'
] as const;

//
// LoadedConfig
//
export const loadedConfig: LoadedConfig = (() => {

	// Default values
	let data: LoadedConfig = {
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
			port:			'8031',										// Control port number for k2hdkc(chmpx) slave
			cuk:			null										// CUK for k2hdkc(chmpx) slave
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

		extdata:			{											// Additional extra data
			/*
			*															// [NOTE]
			*															// This Extra data is the data unique to the user who performs
			*															// the same operation as User data.
			*															// The data is encrypted and compressed.
			*															// The encryption uses the algorithm and passphrase specified
			*															// in userdata.
			*
			dummy:			{											// Extra data API(key=suburi) for trove k2hdkc
				baseuri:		'https://localhost',					// URI
				template:		'config/extdata-dummy.sh.templ',		// Template for Shell part
				useragent:		'dummy-client'							// Allowed user-agent(can be omitted: default is allowed all)
				contenttype:	'text/x-shellscript; charset="us-ascii"'// Response Content-Type(can be omitted: default is 'text/plain')
			}
			*/
		},

		k2hr3admin:			{											// K2HR3 Admin information for example is removing IP Addresses
			tenant:				'admintenant',							// Admin tenant name
			delhostrole:		'delhostrole'							// Admin Role name
		},

		localtenants:		true,										// Whether to allow K2HR3 cluster local tenants
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

	// Set(overwrite) from loaded config
	const mergeConfig = setLoadedConfig(data, k2hr3Config);
	if(null !== mergeConfig){
		data = mergeConfig;
	}else{
		console.warn('Failed loading configuration file. Please check config file.');
	}

	return data;
})();

//---------------------------------------------------------
// Configuration Class
//---------------------------------------------------------
export class r3ApiConfig
{
	loadedConfig:	LoadedConfig;
	consolelog:		Console | null;

	//
	// Constructor
	//
	constructor()
	{
		this.loadedConfig	= loadedConfig;
		this.consolelog		= null;
	}

	//
	// Methods
	//
	getKeystoneConfig = (): ConfigKeystone => {
		return this.loadedConfig.keystone;
	};

	getKeystoneType = (): string => {
		return this.loadedConfig.keystone.type;
	};

	getKeystoneEpType = (): string => {
		return this.loadedConfig.keystone.eptype;
	};

	isKeystoneEpList = (): boolean => {
		return apiutil.compareCaseString('list', this.loadedConfig.keystone.eptype);
	};

	getKeystoneEpList = (): valTypeKeystoneEndpointMap | null => {
		if (!apiutil.compareCaseString('list', this.loadedConfig.keystone.eptype)) {
			return null;
		}
		return this.loadedConfig.keystone.eplist ?? null;
	};

	isKeystoneEpFile = (): boolean => {
		return apiutil.compareCaseString('file', this.loadedConfig.keystone.eptype);
	};

	getKeystoneEpFile = (): string | null => {
		if(!apiutil.compareCaseString('file', this.loadedConfig.keystone.eptype)){
			return null;
		}
		return this.loadedConfig.keystone.epfile;
	};

	getK2hdkcConfig = (): string => {
		return this.loadedConfig.k2hdkc.config;
	};

	getK2hdkcPort = (): string | number => {
		return this.loadedConfig.k2hdkc.port;
	};

	getK2hdkcCuk = (): string | null => {
		return this.loadedConfig.k2hdkc.cuk;
	};

	getCORSIPs = (): string[] => {
		return this.loadedConfig.corsips;
	};

	isMultiProc = (): boolean => {
		return this.loadedConfig.multiproc;
	};

	getScheme = (): string => {
		return this.loadedConfig.scheme;
	};

	getPort = (): string | number => {
		return this.loadedConfig.port;
	};

	getRunUser = (): string => {
		return this.loadedConfig.runuser;
	};

	getPrivateKey = (): string => {
		return this.loadedConfig.privatekey;
	};

	getCert = (): string => {
		return this.loadedConfig.cert;
	};

	getCA = (): string => {
		return this.loadedConfig.ca;
	};

	updateLogDir = (basepath: string | null): string | null => {
		let	dirpath = null;
		if(null !== this.loadedConfig.logdir){
			if(0 === this.loadedConfig.logdir.indexOf('/')){
				dirpath = path.join(this.loadedConfig.logdir);										// logdir is full path
			}else{
				if(null !== basepath && apiutil.isSafeString(basepath)){
					if(null !== basepath && 0 === basepath.indexOf('/')){
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

	getAccessLogName = (): string | null => {
		return this.loadedConfig.accesslogname;
	};

	getAccessLogFormat = (): string | null => {
		return this.loadedConfig.accesslogform;
	};

	getConsoleLogName = (): string | null => {
		return this.loadedConfig.consolelogname;
	};

	getWatcherLogName = (): string | null => {
		return this.loadedConfig.watcherlogname;
	};

	getWatcherTimeFormat = (): string | null => {
		return this.loadedConfig.watchertimeform;
	};

	getWatcherConsoleLogName = (): string | null => {
		return this.loadedConfig.wconsolelogname;
	};

	getLogRotateOption = (): ConfigLogRotateOpt => {
		return this.loadedConfig.logrotateopt;
	};

	getRotateLogStream = (basedir: string | null, filename: string | null): Writable | null => {
		let		logstream	= null;
		const	logdir		= this.updateLogDir(basedir);
		if(null == logdir){
			return logstream;
		}
		if(null === filename || !apiutil.isSafeString(filename)){
			return logstream;
		}
		try{
			const rawopt = { ...this.loadedConfig.logrotateopt };
			const opt: Options = {
				...rawopt,
				path:		rawopt.path ?? undefined,
				// 'true'  -> true(boolean)
				// 'false' -> false(boolean)
				// 'gzip'  -> 'gzip'(string)
				// other   -> false(boolean)
				compress: 	('true'  === rawopt.compress ? true : 'false' === rawopt.compress ? false : 'gzip'  === rawopt.compress ? 'gzip' : false),
				interval:	toIntervalNumber(rawopt.interval ?? '1d')
			};
			logstream = rotatefs.createStream(filename, opt);

		}catch(error){
			let msg: string;
			if(error instanceof Error){
				msg = apiutil.getSafeString(error.message);
			}else{
				msg = String(error);
			}
			console.warn('Could not create log rotate option by : ' + JSON.stringify(msg));
			logstream = null;
		}
		return logstream;
	};

	getMorganLoggerOption = (basedir: string | null): { stream: Writable } | null => {
		let		loggeropt = null;
		const	logstream = this.getRotateLogStream(basedir, this.loadedConfig.accesslogname);
		if(null !== logstream){
			loggeropt = {
				stream: logstream
			};
		}
		return loggeropt;
	};

	getWatcherLoggingStream = (basedir: string | null): Writable => {
		let	logstream = this.getRotateLogStream(basedir, this.loadedConfig.watcherlogname);
		if(null == logstream){
			// [NOTE]
			// Default stream is stdout
			//
			logstream = process.stdout;
		}
		return logstream;
	};

	setConsoleLogging = (basedir: string | null, is_watcher: boolean | unknown): boolean => {
		let	logname = this.loadedConfig.consolelogname;
		if(apiutil.isBoolean(is_watcher) && is_watcher){
			logname = this.loadedConfig.wconsolelogname;
		}
		const	logstream = this.getRotateLogStream(basedir, logname);
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

	getUserdataConfig = (): ConfigUserData => {
		return this.loadedConfig.userdata;
	};

	getUserdataCryptConfig = (): ConfigUserDataCrypt => {
		const udCryptConfig: ConfigUserDataCrypt = {
		    algorithm: this.loadedConfig.userdata.algorithm,
		    passphrase: this.loadedConfig.userdata.passphrase,
		};
		return udCryptConfig;
	};

	getExtdataConfigCount = (): number => {
		return Object.keys(this.loadedConfig.extdata).length;
	};

	getAllExtdataConfig = (): ConfigExtData => {
		return this.loadedConfig.extdata;
	};

	getK2hr3AdminConfig = (): ConfigK2hr3Admin => {
		return this.loadedConfig.k2hr3admin;
	};

	isLocalTenants = (): boolean => {
		return this.loadedConfig.localtenants;
	};

	isConfirmTenantForService = (): boolean => {
		return this.loadedConfig.confirmtenant;
	};

	getCheckIPConfig = (): ConfigChkIP => {
		return this.loadedConfig.chkipconfig;
	};

	isAllowedCredentialAccess = (): boolean => {
		return this.loadedConfig.allowcredauth;
	};

	getExpireTimeRoleToken = (): number => {
		return this.loadedConfig.expiration.roletoken;
	};

	getExpireTimeRegRoleToken = (): number => {
		return this.loadedConfig.expiration.regroletoken;
	};

	getOtherObject = (key: string): unknown | null => {
		if(!apiutil.isSafeString(key)){
			return null;
		}
		if(!apiutil.isSafeEntity(this.loadedConfig[key])){
			return null;
		}
		return this.loadedConfig[key];
	};
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const chkipType = chkipconfigType;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
