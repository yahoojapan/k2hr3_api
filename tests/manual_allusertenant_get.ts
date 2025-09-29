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

import	k2hr3			from '../src/lib/k2hr3dkc';
import	apiutil			from '../src/lib/k2hr3apiutil';
import	r3logger		from '../src/lib/dbglogging';

import	{ r3ApiConfig }	from '../src/lib/k2hr3config';
const	apiConf	= new r3ApiConfig();

//---------------------------------------------------------
// Configuration and port number from Environment
//---------------------------------------------------------
let dkcconf: string | null	= null;
let dkcport: number | null	= null;
let dkccuk: string | null	= null;

(function(): void
{
	if(!apiutil.isSafeEntity(dkcconf)){
		let	tmpdkcconf = apiConf.getK2hdkcConfig();
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
		let	tmpdkcport = apiConf.getK2hdkcPort();
		if(!apiutil.isSafeNumeric(tmpdkcport)){
			r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified in config json is something wrong, then try to check K2HDKC_SLAVE_PORT environemnt.');
			tmpdkcport = apiutil.getSafeString(process.env.K2HDKC_SLAVE_PORT);
		}
		if(apiutil.isSafeNumeric(tmpdkcport)){
			const tmpPort = apiutil.cvtToNumber(tmpdkcport);
			if(apiutil.isSafeNumber(tmpPort)){
				dkcport = tmpPort;
			}else{
				r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified by K2HDKC_SLAVE_PORT environment is something wrong, then use default port number(8031).');
				dkcport = 8031;
			}
		}else{
			r3logger.elog('k2hdkc slave port number(' + JSON.stringify(tmpdkcport) + ') specified by K2HDKC_SLAVE_PORT environment is something wrong, then use default port number(8031).');
			dkcport = 8031;
		}
	}

	if(!apiutil.isSafeEntity(dkccuk)){
		let	tmpdkccuk = apiConf.getK2hdkcCuk();
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
function printAllUserTenantService(): void
{
	console.log('\n[NOTE] You need to run this as root user for attaching CHMPX memory.\n');

	//
	// This is not API, so access to k2hdkc directly.
	//
	const allservices = k2hr3.getAllServices();
	console.log('all service list   : ' + JSON.stringify(allservices));

	const alltenants = k2hr3.getAllTenants();
	console.log('all tenant list : ' + JSON.stringify(alltenants));

	const allusers = k2hr3.getAllUsers();
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
