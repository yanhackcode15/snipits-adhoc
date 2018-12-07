require('promise.prototype.finally').shim();
const request = require('request-promise');

module.exports = (username, password, url, )=>{
	return request.post({
            url,
            form: {
                username,
                password,
            },
            resolveWithFullResponse: true,
            simple: false,
             // Required for the IIS server to not simply end the connection
        })
        .then(response => {
            const cookies = response.headers['set-cookie'];
            // cookies look like: 'CFID=19931459;expires=Mon, 02-Mar-2048 20:49:10 GMT;path=/'
            const CFID = cookies.find((cookie) => ~cookie.indexOf('CFID')).split(';')[0].split('=')[1];
            const CFTOKEN = cookies.find((cookie) => ~cookie.indexOf('CFTOKEN')).split(';')[0].split('=')[1];
            const cookieString = `CFID=${CFID}; CFTOKEN=${CFTOKEN}`;
            return cookieString;
        })
        .catch(err => {
        	console.log('error getting cookie', err.message);
            return Promise.reject(err);
        });
};
