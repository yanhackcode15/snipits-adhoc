'use strict';
require('promise.prototype.finally').shim();
const request = require('request-promise');
const contentFilters = require('../common/filters');

module.exports = (cookie, uri, formData, ciphers)=> {
	return request({	
			method: 'POST',
			uri,
			headers: {
				cookie,
			},
			form: formData,
			simple: false,
			transform: function (body) {
		        return body;
		    },
            ciphers, // Required for the IIS server to not simply end the connection
		});
};