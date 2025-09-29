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
 * CREATE:   Wed Jul 12 2017
 * REVISION:
 *
 */

import	* as fs				from 'fs';
import	apiutil				from '../src/lib/k2hr3apiutil';
import	r3template			from '../src/lib/k2hr3template';

import	{ isValTypeTemplateVariablesMap, isK2hr3TemplateResult, type K2hr3TemplateResult, type valTypeTemplateVariablesMap }	from '../src/lib/k2hr3template';

// Debug logging objects
import	r3logger	from '../src/lib/dbglogging';

// [NOTE]
// The processing in this file is the same as k2hr3template_test.js.
// Since I don't want to make the code of k2hr3template_test.js complicated,
// we make it a separate file as an asynchronous test.
// Thus please be careful when making corrections.
//

//
// check environments
//
const templfile	= apiutil.getSafeString(process.env.R3TEMPLFILE);
const varfile	= apiutil.getSafeString(process.env.R3VARFILE);
if(!apiutil.isSafeString(templfile) || !apiutil.isString(varfile)){
	r3logger.elog('Environments are wrong : R3TEMPLFILE=' + JSON.stringify(templfile) + ', R3VARFILE=' + JSON.stringify(varfile));
	process.exit(0);
}

//
// execute main
//
function execTemplateEngine(templString: string, varmap: valTypeTemplateVariablesMap, callback: (error: string | null) => void): void
{
	if(!apiutil.isFunction(callback)){
		r3logger.elog('parameter callback is wrong.');
		return;
	}
	const	_callback					= callback;
	let		_errorstr: string | null	= null;
	const	_r3templ					= new r3template();

	// load template string
	_r3templ.load(templString, function(error: string | null, result: boolean): void {
		if(null !== error || !result){
			_errorstr = 'could not load string to k2hr3 template engine : string=' + JSON.stringify(templString) + ', error = ' + JSON.stringify(error);
			r3logger.elog(_errorstr);
			_callback(_errorstr);
			return;
		}

		// print variable names in template
		_r3templ.getVariableNames(function(error: string | null, vars: string[]): void {
			if(null !== error){
				_errorstr = 'could not get variable names from k2hr3 template engine';
				r3logger.elog(_errorstr);
				_callback(_errorstr);
				return;
			}

			console.log('----------------------------------------------------------------');
			if(!apiutil.isStringArray(vars) || !apiutil.isNotEmptyArray(vars)){
				console.log('var names = n/a');
			}else{
				console.log('var names = ' + r3logger.dump(vars));
			}

			// execute template engine
			_r3templ.execute(varmap, function(resobj: K2hr3TemplateResult): void {

				console.log('----------------------------------------------------------------');
				console.log('RESULT');
				console.log('----------------------------------------------------------------');
				if(isK2hr3TemplateResult(resobj) && true === resobj.result()){
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
fs.readFile(templfile, 'utf8', function(err: NodeJS.ErrnoException | null, templString: string): void
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
	let is_varfile_json: boolean;
	if(apiutil.isString(varfile) && '' === varfile){
		r3logger.dlog('variable file(' + varfile + ') is not specified.');
		is_varfile_json = false;
	}else if(apiutil.compareCaseString('.json5', varfile.substr(-6))){
		r3logger.dlog('variable file(' + varfile + ') is JSON5 type.');
		is_varfile_json = true;
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
	let varmap: valTypeTemplateVariablesMap = {};		// default for varfile is null
	if(is_varfile_json){
		// json file
		fs.readFile(varfile, 'utf8', function(err: NodeJS.ErrnoException | null, jsonVarString: string): void
		{
			if(null !== err){
				r3logger.elog('could not load variable JSON string fromm file : ' + JSON.stringify(varfile));
				r3logger.dump(err);
				process.exit(0);
			}
			if(apiutil.isSafeString(jsonVarString)){
				// parse JSON
				const	tmpVarmap = apiutil.getSafeString(jsonVarString);
				if(apiutil.checkSimpleJSON(tmpVarmap)){
					const	parsedVarmap = JSON.parse(tmpVarmap);
					if(!isValTypeTemplateVariablesMap(parsedVarmap)){
						r3logger.elog('loaded variable file(.json) is something wrong : ' + JSON.stringify(varmap));
						process.exit(0);
					}
					varmap = parsedVarmap;
				}
			}else{
				// allow empty string
				r3logger.dlog('loaded variable JSON string is empty.');
			}
			//r3logger.dump(varmap);

			// execute
			execTemplateEngine(templString, varmap, function(error: string | null): void {
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
		if(apiutil.isSafeString(varfile)){
			import(varfile).then((module) => {
				if(!isValTypeTemplateVariablesMap(module.templateVars)){
					r3logger.elog('loaded variable file(.js) is something wrong : ' + JSON.stringify(module.templateVars));
					process.exit(0);
				}
				varmap = module.templateVars;

				// execute
				execTemplateEngine(templString, varmap, function(error: string | null): void {
					if(null !== error){
						r3logger.elog('failed to execute k2hr3 template engine.');
					}
					process.exit(0);
				});
			}).catch((err) => {
				r3logger.elog('could not load variable file(' + JSON.stringify(varfile) + ') : ' + JSON.stringify(err));
				process.exit(0);
			});

		}else{
			//r3logger.dump(varmap);
			// execute
			execTemplateEngine(templString, varmap, function(error: string | null): void {
				if(null !== error){
					r3logger.elog('failed to execute k2hr3 template engine.');
				}
				process.exit(0);
			});
		}
	}
});

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
