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

var	apiutil		= require('../lib/k2hr3apiutil');

//
// helper function for input
//
function rawGetConsoleInput(prompt, isecho, ismultiline, callback)
{
	if(undefined === prompt || null === prompt){
		prompt = 'Input: ';
	}
	if(prompt){
		process.stdout.write(prompt);
	}

	var stdin = process.stdin;
	stdin.resume();
	stdin.setRawMode(true);
	stdin.resume();
	stdin.setEncoding('utf8');

	var indata = '';
	stdin.on('data', function(ch)
	{
		ch = ch + '';
		switch(ch){
			case '\n':
			case '\r':
			case '\u0004':
				if(ismultiline){
					if('\u0004' !== ch){
						// not break, now is multi line mode
						process.stdout.write('\n');
						indata += '\n';
					}else{
						// stop input normally on multi line mode
						stdin.setRawMode(false);
						stdin.pause();
						stdin.removeAllListeners('data');
						callback(false, indata);
					}
				}else{
					// They've finished typing their indata
					process.stdout.write('\n');
					stdin.setRawMode(false);
					stdin.pause();
					stdin.removeAllListeners('data');
					callback(false, indata);
				}
				break;

			case '\u0003':
				// Ctrl-C
				stdin.removeAllListeners('data');
				callback(true);
				break;

			case '\b':
				// Backspace
				if(0 < indata.length){
					process.stdout.write(ch);
					process.stdout.write(' ');		// clear
					process.stdout.write(ch);
					indata = indata.substr(0, indata.length - 1);
				}
				break;

			default:
				// More characters
				if(isecho){
					process.stdout.write(ch);
				}else{
					process.stdout.write('*');
				}
				indata += ch;
				break;
		}
	});
}

//
// Utility for inputting object data
//
function rawInputObjectData(is_string, callback)
{
	var	_callback = callback;

	if(is_string){
		rawGetConsoleInput('         data(string type is multiline: Ctrl-D for break) : \n', true, true, function(isbreak, data)
		{
			if(isbreak){
				_callback(true);
				return;
			}
			// [NOTE]
			// if data is string, but the data has CR code = '\n'
			//
			_callback(false, data);
		});

	}else{
		rawGetConsoleInput('         input object type(json or multiline)             : ', true, false, function(isbreak, type)
		{
			if(isbreak){
				_callback(true);
				return;
			}

			if(apiutil.compareCaseString('json', type) || apiutil.compareCaseString('object', type)){
				rawGetConsoleInput('         object json string                               : ', true, false, function(isbreak, data)
				{
					if(isbreak){
						_callback(true);
						return;
					}
					_callback(false, data);
				});

			}else if(apiutil.compareCaseString('multiline', type)){
				rawGetConsoleInput('         object multi line like codes                     : \n', true, true, function(isbreak, data)
				{
					if(isbreak){
						_callback(true);
						return;
					}
					// [NOTE]
					// data has CR codes, so we need to convert object and to normal JSON.
					//
					var	_data = JSON.parse(data);
					if(!apiutil.isSafeEntity(_data)){
						console.log('input object multi line data is wrong : ' + JSON.stringify(data));
						_callback(true);
						return;
					}
					_data = JSON.stringify(_data);
					if(!apiutil.isSafeEntity(_data)){
						console.log('input object multi line data is wrong : ' + JSON.stringify(data));
						_callback(true);
						return;
					}

					_callback(false, _data);
				});

			}else{
				console.log('input object type must be JSON or MULTILINE : ' + type);
				_callback(true);
			}
		});
	}
}

exports.getConsoleInput = function(prompt, isecho, ismultiline, callback)
{
	return rawGetConsoleInput(prompt, isecho, ismultiline, callback);
};

exports.inputObjectData = function(is_string, callback)
{
	return rawInputObjectData(is_string, callback);
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
