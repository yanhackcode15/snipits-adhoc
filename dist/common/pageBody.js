'use strict';

require('promise.prototype.finally').shim();
var request = require('request-promise');
var contentFilters = require('../common/filters');

module.exports = function (cookie, uri, formData, ciphers) {
	return request({
		method: 'POST',
		uri: uri,
		headers: {
			cookie: cookie
		},
		form: formData,
		simple: false,
		transform: function transform(body) {
			return body;
		},
		ciphers: ciphers // Required for the IIS server to not simply end the connection
	});
};