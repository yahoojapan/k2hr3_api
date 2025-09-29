/*
 * K2HR3 REST API
 *
 * Copyright 2018 Yahoo Japan Corporation.
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
 * CREATE:   Tue Oct 2 2018
 * REVISION:
 *
 */

import	* as crypto							from 'crypto';
import	* as zlib							from 'zlib';
import	apiutil								from './k2hr3apiutil';
import	r3logger							from './dbglogging';
import	{ scryptSync, createDecipheriv }	from 'crypto';

import type	{ valTypeAll }					from './types';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeR3Gzip = {
	data:		Buffer;
	length:		number;
};

//
// Callback
//
type cbTypeR3Gzip = (error: Error | null, result?: valTypeR3Gzip) => void;
type cbTypeR3Gunzip = (error: Error | null, result?: string) => void;

//---------------------------------------------------------
// Crypt for using in registering role member
//---------------------------------------------------------
// These utility functions are used by URL parameter for
// registering role member. The registering role member
// parameter is string which is encoded URI/JSON and encrypted.
// We use following functions for this logic.
//
const rawR3Encrypt = (
	str?:			string | null,
	passphrase?:	string | null,
	algorithm?:		string | null
): string | null => {

	if(!apiutil.isSafeString(str)){
		r3logger.elog('The target string for encrypting is empty or not string.');
		return null;
	}
	if(!apiutil.isSafeString(passphrase)){
		r3logger.elog('The pass phrase string is empty or not string.');
		return null;
	}
	if(!apiutil.isSafeString(algorithm)){
		r3logger.elog('The algorithm cipher string is empty or not string.');
		return null;
	}
	try{
		// [NOTE] crypto.createCipher is deprecated
		//
		// Previously, the encoding was as follows, but this method is not used now.
		//		var	cipherObj	= crypto.createCipher(algorithm, passphrase);
		//		var	cryptedStr	= cipherObj.update(str, 'utf8', 'base64');
		//		cryptedStr		+= cipherObj.final('base64');
		//
		const	initVector	= crypto.randomBytes(16);
		const	pass2pbkdf	= crypto.pbkdf2Sync(passphrase, initVector.toString(), 10000, 32, 'sha512');
		const	cipherObj	= crypto.createCipheriv(algorithm, pass2pbkdf, initVector);
		const	cryptedMix	= Buffer.concat([initVector, Buffer.from(':'), cipherObj.update(Buffer.from(str)), cipherObj.final()]);
		const	cryptedStr	= cryptedMix.toString('base64');

		// [NOTE]
		// Use encodeURIComponent() instead of encodeURI() because we need to
		// convert '/', '?', ':' characters.
		return encodeURIComponent(cryptedStr);
	}catch(exception: unknown){
		r3logger.dlog(JSON.stringify(exception));
		return null;
	}
};

const rawR3EncryptJSON = (
	obj:		unknown,
	passphrase:	string | null,
	algorithm:	string | null
): string | null => {

	if(!apiutil.isSafeEntity(obj)){
		r3logger.elog('The object is something wrong.');
		return null;
	}
	return rawR3Encrypt(JSON.stringify(obj), passphrase, algorithm);
};

const rawR3Decrypt = (
	str?:			string | null,
	passphrase?:	string | null,
	algorithm?:		string | null
): string | null => {

	if(!apiutil.isSafeString(str)){
		r3logger.elog('The target string for encrypting is empty or not string.');
		return null;
	}
	if(!apiutil.isSafeString(passphrase)){
		r3logger.elog('The pass phrase string is empty or not string.');
		return null;
	}
	if(!apiutil.isSafeString(algorithm)){
		r3logger.elog('The algorithm cipher string is empty or not string.');
		return null;
	}

	try{
		// [NOTE]
		// Use encodeURIComponent() instead of encodeURI() because we need to
		// convert '/', '?', ':' characters.
		const	decodeStr	= decodeURIComponent(str);
		const	decodeMix	= Buffer.from(decodeStr, 'base64');
		let		decryptedStr: string;

		if(decodeMix.slice(16, 17).toString() === ':'){
			const	initVector	= decodeMix.slice(0, 16);
			const	pass2pbkdf	= crypto.pbkdf2Sync(passphrase, initVector.toString(), 10000, 32, 'sha512');
			const	decipherObj	= crypto.createDecipheriv(algorithm, pass2pbkdf, initVector);
			const	decryptedBuf= Buffer.concat([decipherObj.update(decodeMix.slice(17)), decipherObj.final()]);
			decryptedStr		= decryptedBuf.toString();

		}else{
			// [NOTE][TODO]
			// Changed from createDecipher to createDecipheriv.
			// To maintain compatibility, the iv value is filled with 0.
			// We plan to change this so that it can be set to a value other than 0 in the future.
			//
			const	key			= scryptSync(passphrase, 'salt', 32);			// 32 byte
			const	iv			= Buffer.alloc(16, 0);							// [NOTE] full all with 0, so we should change this code.
			const	cipherObj	= createDecipheriv(algorithm, key, iv);

			decryptedStr		= cipherObj.update(decodeStr, 'base64', 'utf8');
			decryptedStr		+= cipherObj.final('utf8');
		}
		return decryptedStr;

	}catch(exception: unknown){
		r3logger.dlog(JSON.stringify(exception));
		return null;
	}
};

const rawR3DecryptJSON = (
	str?:			string | null,
	passphrase?:	string | null,
	algorithm?:		string | null
): valTypeAll | null => {

	const	decStr = rawR3Decrypt(str, passphrase, algorithm);
	if(!apiutil.isSafeString(decStr)){
		return null;
	}
	if(!apiutil.checkSimpleJSON(decStr)){
		r3logger.elog('The decripted string(' + apiutil.getSafeString(decStr) + ') is not JSON string.');
		return null;
	}
	return apiutil.parseJSON(decStr);
};

const rawR3Gzip = (
	str?:		string | null,
	callback?:	cbTypeR3Gzip
): valTypeR3Gzip | null | undefined => {

	if(!apiutil.isSafeString(str)){
		// not allow empty string('') too.
		r3logger.elog('string parameter is empty.');
		return null;
	}

	if(!apiutil.isSafeEntity(callback)){
		// sync type
		const	_data	= zlib.gzipSync(str);
		const	_length	= _data.length;

		const	result: valTypeR3Gzip = {
			data:		_data,
			length:		_length
		};
		return result;

	}else if(!apiutil.isFunction(callback)){
		// error
		r3logger.elog('callback parameter is not function.');
		return null;

	}else{
		// callback type
		const	_callback = callback as cbTypeR3Gzip;

		zlib.gzip(str, (error: Error | null, binary?: Buffer): void => {
			if(error || !binary){
				r3logger.elog('failed to compress(zip) string by ' + (error?.message ? error.message : ''));
				return _callback(error);
			}
			const	result: valTypeR3Gzip = {
				data:	binary,
				length:	binary.length
			};
			_callback(null, result);
		});
	}
};

const rawR3Gunzip = (
	bin?:		Buffer | null,
	callback?:	cbTypeR3Gunzip
): string | null | undefined => {

	if(!apiutil.isSafeEntity(bin) || !(bin instanceof Buffer)){
		// not allow empty string('') too.
		r3logger.elog('binary parameter is not instance of Buffer.');
		return null;
	}

	if(!apiutil.isSafeEntity(callback)){
		// sync type
		return zlib.gunzipSync(bin).toString();

	}else if(!apiutil.isFunction(callback)){
		// error
		r3logger.elog('callback parameter is not function.');
		return null;

	}else{
		// callback type
		const	_callback = callback as cbTypeR3Gunzip;

		zlib.gunzip(bin, (error: Error | null, binary?: Buffer): void => {
			if(error || !binary){
				r3logger.elog('failed to decompress(unzip) binary by ' + (error?.message ? error.message : ''));
				return _callback(error);
			}
			_callback(null, binary.toString());
		});
	}
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Functions
//
export const k2hr3cryptutil = {
	r3Encrypt:		rawR3Encrypt,
	r3EncryptJSON:	rawR3EncryptJSON,
	r3Decrypt:		rawR3Decrypt,
	r3DecryptJSON:	rawR3DecryptJSON,
	r3Gzip:			rawR3Gzip,
	r3Gunzip:		rawR3Gunzip
};

export default k2hr3cryptutil;

//
// Variables
//
export {
	valTypeR3Gzip
};

//
// Callback
//
export {
	cbTypeR3Gzip,
	cbTypeR3Gunzip
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
