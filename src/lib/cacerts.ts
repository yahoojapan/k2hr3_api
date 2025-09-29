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

import	* as fs		from 'fs';
import	apiutil		from './k2hr3apiutil';
import	r3logger	from './dbglogging';

const loadCACert = (): Buffer | null => {
	const caPath = process.env.CAPATH;

	// load CA Path environment
	if(apiutil.isSafeString(caPath)){
		try{
			fs.statSync(caPath);
			return fs.readFileSync(caPath);
		}catch(err: unknown){
			r3logger.elog('CAPATH environment' + caPath + ' file does not exist, then use default ca certs.', JSON.stringify(err));
		}
	}

	// load one of CA certs
	const def_certs = [
		'/etc/ssl/certs/ca-certificates.crt',
		'/etc/pki/tls/certs/ca-bundle.crt',
		'/etc/ssl/certs/ca-bundle.crt',
		'/etc/ssl/certs/ca-bundle.trust.crt'
	];

	for(let cnt = 0; cnt < def_certs.length; ++cnt){
		try{
			fs.statSync(def_certs[cnt]);
			return fs.readFileSync(def_certs[cnt]);
		}catch(err: unknown){
			r3logger.dlog(JSON.stringify(err));
			continue;
		}
	}
	return null;
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const ca = (): Buffer | null => loadCACert();

export default ca;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
