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

var	k2hr3		= require('../lib/k2hr3dkc');

var	apiutil		= require('../lib/k2hr3apiutil');
var	r3Conf		= require('../lib/k2hr3config').r3ApiConfig;
var	apiConf		= new r3Conf();

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//---------------------------------------------------------
// Configuration and port number from Environment
//---------------------------------------------------------
var dkcconf	= null;
var	dkcport	= null;
var	dkccuk	= null;
(function()
{
	if(!apiutil.isSafeEntity(dkcconf)){
		var	tmpdkcconf = apiConf.getK2hdkcConfig();
		if(!apiutil.checkFileExist(tmpdkcconf)){
			r3logger.elog('k2hdkc slave configuration file(' + tmpdkcconf + ') specified in config json does not exist, then try to check K2HDKC_SLAVE_CONF environemnt.');

			tmpdkcconf = apiutil.getSafeString(process.env.K2HDKC_SLAVE_CONF);
			if(!apiutil.checkFileExist(tmpdkcconf)){
				r3logger.elog('k2hdkc slave configuration file(' + tmpdkcconf + ') specified by K2HDKC_SLAVE_CONF environemnt does not exist, then use default path(/etc/k2hdkc/slave.ini).');
				tmpdkcconf = '/etc/k2hdkc/slave.ini';
			}
		}
		dkcconf = tmpdkcconf;
	}
	if(!apiutil.isSafeEntity(dkcport)){
		var	tmpdkcport = apiConf.getK2hdkcPort();
		if(isNaN(tmpdkcport) || null === tmpdkcport){
			r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified in config json is something wrong, then try to check K2HDKC_SLAVE_PORT environemnt.');

			tmpdkcport = apiutil.getSafeString(process.env.K2HDKC_SLAVE_PORT);
			if(!apiutil.isSafeString(tmpdkcport) || isNaN(tmpdkcport)){
				r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified by K2HDKC_SLAVE_PORT environment is something wrong, then use default port number(8031).');
				tmpdkcport = 8031;
			}
		}
		dkcport = parseInt(tmpdkcport);
	}
	if(!apiutil.isSafeEntity(dkccuk)){
		var	tmpdkccuk = apiConf.getK2hdkcCuk();
		if(null === tmpdkccuk){
			r3logger.mlog('k2hdkc slave cuk is not specified. then try to check K2HDKC_SLAVE_CUK environemnt.');

			tmpdkccuk = apiutil.getSafeString(process.env.K2HDKC_SLAVE_CUK);
			if(!apiutil.isSafeString(tmpdkccuk)){
				r3logger.mlog('k2hdkc slave cuk is not specified by K2HDKC_SLAVE_CUK environment is something wrong, then not use cuk(null).');
				tmpdkccuk = null;
			}
		}
		dkccuk = tmpdkccuk;
	}
}());

//---------------------------------------------------------
// call library function directly
//---------------------------------------------------------
function printAllUserTenantService()
{
	console.log('\n[NOTE] You need to run this as root user for attaching CHMPX memory.\n');

	//
	// This is not API, so access to k2hdkc directly.
	//
	var	allservices	= k2hr3.getAllServices();
	console.log('all service list   : ' + JSON.stringify(allservices));

	var	alltenants	= k2hr3.getAllTenants();
	console.log('all tenant list : ' + JSON.stringify(alltenants));

	var	allusers	= k2hr3.getAllUsers();
	console.log('all user list   : ' + JSON.stringify(allusers));
}

//
// run
//
printAllUserTenantService();

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
