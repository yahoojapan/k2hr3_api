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
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

'use strict';

var express	= require('express');
var router	= express.Router();

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// GET '/'	: get all API version
// output	: {'version': 'v1'}
//
router.get('/', function(req, res, next)						// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	var result = {'version': [ 'v1' ]};

	res.type('application/json; charset=utf-8');
	res.send(result);
});

//
// GET '/v1': get all API for version 1
// output	: {'type': {'uri': ['method', ...], ...}, ...}
//
router.get('/v1', function(req, res, next)						// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var result = {
		'version':		{	'/':										['GET'],
							'/v1':										['GET']},
		'user token':	{	'/v1/user/tokens':							['HEAD', 'GET', 'POST']},
		'host':			{	'/v1/host':									['GET', 'PUT', 'POST', 'DELETE'],
							'/v1/host/{port}':							['PUT', 'POST', 'DELETE'],
							'/v1/host/FQDN':							['DELETE'],
							'/v1/host/FQDN:{port}':						['DELETE'],
							'/v1/host/IP':								['DELETE'],
							'/v1/host/IP:{port}':						['DELETE']},
		'service':		{	'/v1/service':								['PUT', 'POST'],
							'/v1/service/{service}':					['GET', 'HEAD', 'PUT', 'POST', 'DELETE']},
		'role':			{	'/v1/role':									['PUT', 'POST'],
							'/v1/role/{role}':							['HEAD', 'GET', 'PUT', 'POST', 'DELETE'],
							'/v1/role/token/{role}':					['GET']},
		'resource':		{	'/v1/resource':								['PUT', 'POST'],
							'/v1/resource/{resource}':					['HEAD', 'GET', 'DELETE']},
		'policy':		{	'/v1/policy':								['PUT', 'POST'],
							'/v1/policy/{policy}':						['HEAD', 'GET', 'DELETE']},
		'list':			{	'/v1/list':									['HEAD', 'GET'],
							'/v1/list/{role, resource, policy}/{path}':	['HEAD', 'GET']},
		'acr':			{	'/v1/acr/{service}':						['GET', 'PUT', 'POST', 'DELETE']}
	};
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	res.status(200);										// 200: OK
	res.send(JSON.stringify(result));
});

module.exports = router;

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
