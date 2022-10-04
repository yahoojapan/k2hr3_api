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
 * CREATE:   Wed Jul 12 2017
 * REVISION:
 *
 */

'use strict';

var	fs			= require('fs');

var	r3templeng	= require('../lib/k2hr3template');
var	apiutil		= require('../lib/k2hr3apiutil');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

// [NOTE]
// The processing in this file is the same as k2hr3template_test.js.
// Since I don't want to make the code of k2hr3template_test.js complicated,
// we make it a separate file as an asynchronous test.
// Thus please be careful when making corrections.
//

//
// check environments
//
var templfile	= apiutil.getSafeString(process.env.R3TEMPLFILE);
var	varfile		= apiutil.getSafeString(process.env.R3VARFILE);
if(!apiutil.isSafeString(templfile) || ('' !== varfile && !apiutil.isSafeString(varfile))){
	r3logger.elog('Environments are wrong : R3TEMPLFILE=' + JSON.stringify(templfile) + ', R3VARFILE=' + JSON.stringify(varfile));
	process.exit(0);
}

//
// execute main
//
function execTemplateEngine(templString, varmap, callback)
{
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		r3logger.elog('parameter callback is wrong.');
		return;
	}
	var	_callback	= callback;
	var	_errorstr	= null;
	var	r3templ		= new r3templeng.r3template;

	// load template string
	r3templ.load(templString, function(error, result){
		if(null !== error || !result){
			_errorstr = 'could not load string to k2hr3 template engine : string=' + JSON.stringify(templString) + ', error = ' + JSON.stringify(error);
			r3logger.elog(_errorstr);
			_callback(_errorstr);
			return;
		}

		// print variable names in template
		r3templ.getVariableNames(function(error, vars){
			if(null !== error){
				r3logger.wlog(error);
			}

			console.log('----------------------------------------------------------------');
			if(apiutil.isEmptyArray(vars)){
				console.log('var names = n/a');
			}else{
				console.log('var names = ' + r3logger.dump(vars));
			}

			// execute template engine
			r3templ.execute(varmap, function(resobj){

				console.log('----------------------------------------------------------------');
				console.log('RESULT');
				console.log('----------------------------------------------------------------');
				if(resobj.result){
					console.log('result        = succeed');
					console.log('input string  = ' + templString);
					console.log('output string = ' + resobj.getString());
				}else{
					console.log('result        = failed');
					console.log('input string  = ' + templString);
				}
				console.log('----------------------------------------------------------------');
				_callback(null);
				return;
			});
		});
	});
}

//
// load template file
//
fs.readFile(templfile, 'utf8', function(err, templString)
{
	if(null !== err){
		r3logger.elog('could not load template string from file : ' + JSON.stringify(templfile));
		r3logger.dump(err);
		process.exit(0);
	}
	if(!apiutil.isSafeString(templString)){
		r3logger.elog('loaded template string is empty : ' + JSON.stringify(templString));
		process.exit(0);
	}
	//r3logger.dlog('Template string  : ' + JSON.stringify(templString));

	//
	// check variable file type(allow varfile is null)
	//
	var	is_varfile_json = false;
	if('' === varfile){
		r3logger.dlog('variable file(' + varfile + ') is not specified.');
		is_varfile_json = false;
	}else if(apiutil.compareCaseString('.json', varfile.substr(-5))){
		r3logger.dlog('variable file(' + varfile + ') is JSON type.');
		is_varfile_json = true;
	}else if(apiutil.compareCaseString('.js', varfile.substr(-3))){
		r3logger.dlog('variable file(' + varfile + ') is JS type.');
		is_varfile_json = false;
	}else{
		r3logger.dlog('variable file(' + varfile + ') is unknown type, then we will load it as JSON type.');
		is_varfile_json = true;
	}

	//
	// load variable file type
	//
	var	varmap = {};						// default for varfile is null
	if(is_varfile_json){
		// json file
		fs.readFile(varfile, 'utf8', function(err, jsonVarString)
		{
			if(null !== err){
				r3logger.elog('could not load variable JSON string fromm file : ' + JSON.stringify(varfile));
				r3logger.dump(err);
				process.exit(0);
			}
			if(apiutil.isSafeString(jsonVarString)){
				// parse JSON
				varmap = jsonVarString;
				if(apiutil.checkSimpleJSON(jsonVarString)){
					varmap = JSON.parse(jsonVarString);
				}
				if(!apiutil.isSafeEntity(varmap)){
					r3logger.elog('loaded variable file(.json) is something wrong : ' + JSON.stringify(varmap));
					process.exit(0);
				}
			}else{
				// allow empty string
				r3logger.dlog('loaded variable JSON string is empty.');
			}
			//r3logger.dump(varmap);

			// execute
			execTemplateEngine(templString, varmap, function(error){
				if(null !== error){
					r3logger.elog('failed to execute k2hr3 template engine.');
				}
				process.exit(0);
			});
		});

	}else{
		// js file
		// (js file must be like following contents)
		//
		// module.exports = {
		// 	'key1': 'value1',
		// 	'key2': 'value2',
		// 	...
		// };
		//
		if('' !== varfile){
			varmap = require(varfile);
			if(!apiutil.isSafeEntity(varmap)){
				r3logger.elog('loaded variable file(.js) is something wrong : ' + JSON.stringify(varmap));
				process.exit(0);
			}
		}
		//r3logger.dump(varmap);

		// execute
		execTemplateEngine(templString, varmap, function(error){
			if(null !== error){
				r3logger.elog('failed to execute k2hr3 template engine.');
			}
			process.exit(0);
		});
	}
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
