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

'use strict';

var	crypto		= require('crypto');
var	zlib		= require('zlib');
var	apiutil		= require('./k2hr3apiutil');

// Debug logging objects
var r3logger	= require('./dbglogging');

//---------------------------------------------------------
// Crypt for using in registering role member
//---------------------------------------------------------
// These utility functions are used by URL parameter for
// registering role member. The registering role member
// parameter is string which is encoded URI/JSON and encrypted.
// We use following functions for this logic.
//
function rawR3Encrypt(str, passphrase, algorithm)
{
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
		var	initVector	= crypto.randomBytes(16);
		var	pass2pbkdf	= crypto.pbkdf2Sync(passphrase, initVector.toString(), 10000, 32, 'sha512');
		var	cipherObj	= crypto.createCipheriv(algorithm, pass2pbkdf, initVector);
		var	cryptedMix	= Buffer.concat([initVector, Buffer.from(':'), cipherObj.update(Buffer.from(str)), cipherObj.final()]);
		var	cryptedStr	= cryptedMix.toString('base64');

		// [NOTE]
		// Use encodeURIComponent() instead of encodeURI() because we need to
		// convert '/', '?', ':' characters.
		return encodeURIComponent(cryptedStr);
	}catch(exception){
		return null;
	}
}

function rawR3EncryptJSON(obj, passphrase, algorithm)
{
	if(!apiutil.isSafeEntity(obj)){
		r3logger.elog('The object is something wrong.');
		return null;
	}
	return rawR3Encrypt(JSON.stringify(obj), passphrase, algorithm);
}

function rawR3Decrypt(str, passphrase, algorithm)
{
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
		var	decodeStr	= decodeURIComponent(str);
		var	decodeMix	= Buffer.from(decodeStr, 'base64');
		var	decryptedStr;

		if(decodeMix.slice(16, 17).toString() === ':'){
			var	initVector	= decodeMix.slice(0, 16);
			var	pass2pbkdf	= crypto.pbkdf2Sync(passphrase, initVector.toString(), 10000, 32, 'sha512');
			var	decipherObj	= crypto.createDecipheriv(algorithm, pass2pbkdf, initVector);
			var	decryptedBuf= Buffer.concat([decipherObj.update(decodeMix.slice(17)), decipherObj.final()]);
			decryptedStr	= decryptedBuf.toString();

		}else{
			// [NOTE] Deprecated
			// This is the case of the encoding used previously.
			// For compatibility, only decoding is supported. Deprecated.
			//
			var	cipherObj	= crypto.createDecipher(algorithm, passphrase);
			decryptedStr	= cipherObj.update(decodeStr, 'base64', 'utf8');
			decryptedStr	+= cipherObj.final('utf8');
		}
		return decryptedStr;
	}catch(exception){
		return null;
	}
}

function rawR3DecryptJSON(str, passphrase, algorithm)
{
	var	decStr = rawR3Decrypt(str, passphrase, algorithm);
	if(!apiutil.isSafeString(decStr)){
		return null;
	}
	if(!apiutil.checkSimpleJSON(decStr)){
		r3logger.elog('The decripted string(' + decStr + ') is not JSON string.');
		return null;
	}
	return JSON.parse(decStr);
}

function rawR3Gzip(str, callback)
{
	if(!apiutil.isSafeString(str)){
		// not allow empty string('') too.
		r3logger.elog('string parameter is empty.');
		return null;
	}

	if(!apiutil.isSafeEntity(callback)){
		// sync type
		var	result = {
			data:	null,
			length:	0
		};
		result.data		= zlib.gzipSync(str);
		result.length	= result.data.length;

		return result;

	}else if('function' !== typeof callback){
		// error
		r3logger.elog('callback parameter is not function.');
		return null;
	}else{
		// callback type
		var	_callback = callback;

		zlib.gzip(str, function(error, binary){
			if(error){
				r3logger.elog('failed to compress(zip) string by ' + error.message);
				return _callback(error);
			}
			var	result = {
				data:	binary,
				length:	binary.length
			};
			return _callback(null, result);
		});
	}
}

function rawR3Gunzip(bin, callback)
{
	if(!apiutil.isSafeEntity(bin) || !(bin instanceof Buffer)){
		// not allow empty string('') too.
		r3logger.elog('binary parameter is not instance of Buffer.');
		return null;
	}
	if(!apiutil.isSafeEntity(callback)){
		// sync type
		return zlib.gunzipSync(bin).toString();

	}else if('function' !== typeof callback){
		// error
		r3logger.elog('callback parameter is not function.');
		return null;
	}else{
		// callback type
		var	_callback = callback;

		zlib.gunzip(bin, function(error, binary){
			if(error){
				r3logger.elog('failed to decompress(unzip) binary by ' + error.message);
				return _callback(error);
			}
			return binary.toString();
		});
	}
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.r3Encrypt = function(str, passphrase, algorithm)
{
	return rawR3Encrypt(str, passphrase, algorithm);
};

exports.r3EncryptJSON = function(obj, passphrase, algorithm)
{
	return rawR3EncryptJSON(obj, passphrase, algorithm);
};

exports.r3Decrypt = function(str, passphrase, algorithm)
{
	return rawR3Decrypt(str, passphrase, algorithm);
};

exports.r3DecryptJSON = function(str, passphrase, algorithm)
{
	return rawR3DecryptJSON(str, passphrase, algorithm);
};

exports.r3Gzip = function(str, callback)
{
	return rawR3Gzip(str, callback);
};

exports.r3Gunzip = function(bin, callback)
{
	return rawR3Gunzip(bin, callback);
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
