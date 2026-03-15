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

import	apiutil		from './k2hr3apiutil';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Callback
//
type cbTypeConsoleInput = (isbreak: boolean, value?: string | null) => void;

//
// helper function for input
//
const rawGetConsoleInput = (
	prompt:			string | null,
	isecho:			boolean,
	ismultiline:	boolean,
	callback:		cbTypeConsoleInput
): void => {

	if(!apiutil.isSafeEntity(prompt)){
		prompt = 'Input: ';
	}
	if(apiutil.isSafeString(prompt)){
		process.stdout.write(prompt);
	}
	const	_callback = callback;
	const	stdin = process.stdin;
	stdin.resume();
	stdin.setRawMode(true);
	stdin.resume();
	stdin.setEncoding('utf8');

	let	indata = '';
	stdin.on('data', (ch: string): void => {
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
						_callback(false, indata);
					}
				}else{
					// They've finished typing their indata
					process.stdout.write('\n');
					stdin.setRawMode(false);
					stdin.pause();
					stdin.removeAllListeners('data');
					_callback(false, indata);
				}
				break;

			case '\u0003':
				// Ctrl-C
				stdin.removeAllListeners('data');
				_callback(true);
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
};

//
// Utility for inputting object data
//
const rawInputObjectData = (
	is_string:	boolean,
	callback:	cbTypeConsoleInput
): void => {

	const	_callback = callback;

	if(is_string){
		rawGetConsoleInput('         data(string type is multiline: Ctrl-D for break) : \n', true, true, (isbreak: boolean, data?: string | null): void => {
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
		rawGetConsoleInput('         input object type(json or multiline)             : ', true, false, (isbreak: boolean, type?: string | null): void => {
			if(isbreak){
				_callback(true);
				return;
			}

			if(apiutil.compareCaseString('json', type) || apiutil.compareCaseString('object', type)){
				rawGetConsoleInput('         object json string                               : ', true, false, (isbreak: boolean, data?: string | null): void => {
					if(isbreak){
						_callback(true);
						return;
					}
					_callback(false, data);
				});

			}else if(apiutil.compareCaseString('multiline', type)){
				rawGetConsoleInput('         object multi line like codes                     : \n', true, true, (isbreak: boolean, data?: string | null): void => {
					if(isbreak){
						_callback(true);
						return;
					}
					// [NOTE]
					// data has CR codes, so we need to convert object and to normal JSON.
					//
					const	_data = JSON.parse(data ?? '');
					if(!apiutil.isSafeEntity(_data)){
						console.log('input object multi line data is wrong : ' + JSON.stringify(data));
						_callback(true);
						return;
					}
					const	_strdata = JSON.stringify(_data);
					if(!apiutil.isSafeEntity(_strdata)){
						console.log('input object multi line data is wrong : ' + JSON.stringify(data));
						_callback(true);
						return;
					}

					_callback(false, _strdata);
				});

			}else{
				console.log('input object type must be JSON or MULTILINE : ' + type);
				_callback(true);
			}
		});
	}
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Functions
//
export const k2hr3cliutil = {
	getConsoleInput:	rawGetConsoleInput,
	inputObjectData:	rawInputObjectData
};

//
// Default
//
export default k2hr3cliutil;

//
// Callback
//
export {
	cbTypeConsoleInput
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
