'use strict';

require('promise.prototype.finally').shim();
var request = require('request-promise');

module.exports = function (username, password, url, ciphers) {
    return request.post({
        url: url,
        form: {
            username: username,
            password: password
        },
        resolveWithFullResponse: true,
        simple: false,
        ciphers: ciphers // Required for the IIS server to not simply end the connection
    }).then(function (response) {
        var cookies = response.headers['set-cookie'];
        // cookies look like: 'CFID=19931459;expires=Mon, 02-Mar-2048 20:49:10 GMT;path=/'
        var CFID = cookies.find(function (cookie) {
            return ~cookie.indexOf('CFID');
        }).split(';')[0].split('=')[1];
        var CFTOKEN = cookies.find(function (cookie) {
            return ~cookie.indexOf('CFTOKEN');
        }).split(';')[0].split('=')[1];
        var cookieString = 'CFID=' + CFID + '; CFTOKEN=' + CFTOKEN;

        return cookieString;
    }).catch(function (err) {
        console.log('error getting cookie', err);
    });
};