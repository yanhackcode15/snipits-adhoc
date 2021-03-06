'use strict';
require('promise.prototype.finally').shim();
const request = require('request-promise');
// const contentFilters = require('../common/filters');

module.exports = (cookie, uri, formData)=> {
	console.log('get page', uri);
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
             // Required for the IIS server to not simply end the connection
		})
		.then(body=>{
			return body;
		})
		.catch(err=>{
			console.error(err.message);
			return Promise.reject(err);
		});
};