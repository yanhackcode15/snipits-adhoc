require('promise.prototype.finally').shim();
// const htmlparser = require('htmlparser');
const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const request = require('request-promise');
const fs = require('fs');
const username = 'yan';
const password = 'huy95';

exports.getCookies = function getCookies() {
	return request.post(
        {
            url : 'https://portal.snipits.com/login.cfm',
            form: {
                username: username,
                password: password,
            },
            resolveWithFullResponse: true,
            simple: false,
            ciphers: 'DES-CBC3-SHA', // Required for the IIS server to not simply end the connection
        }
    )
        .then(response => {
            const cookies = response.headers['set-cookie'];
            // cookies look like: 'CFID=19931459;expires=Mon, 02-Mar-2048 20:49:10 GMT;path=/'
            const CFID = cookies.find((cookie) => ~cookie.indexOf('CFID')).split(';')[0].split('=')[1];
            const CFTOKEN = cookies.find((cookie) => ~cookie.indexOf('CFTOKEN')).split(';')[0].split('=')[1];
            const cookieString = `CFID=${CFID}; CFTOKEN=${CFTOKEN}`;

            return cookieString;
        })
        .catch(err => {
        	console.log('error getting cookie', err);
        });
}


exports.tableStringToArray = function tableStringToArray(tableString) {
    let nestedArry = [];
    const $ = cheerio.load(tableString);
    cheerioTableparser($);
    return nestedArry = $('table').parsetable(false, false, true); //array of arrays of one element

}

exports.flipArrayAxis = function flipArrayAxis(tableArry) {
    //convert a 2-D table-like array into an array of objects along the Y axis, the first element of every inner array is the property name of the object.
    var arry = [];
    for (var i = 0; i < tableArry.length; i++) {
        for (var j = 0; j < tableArry[i].length; j++) {
            arry[j] = arry[j] || [];
            arry[j].push(tableArry[i][j]);
        }
    }
    return arry;
}

exports.inventoryReportTableExtracter = function inventoryReportTableExtracter(rawbody) {
    let index = rawbody.indexOf('</form>');
    let table = ~index ? rawbody.substring(index + 7) : rawbody;

    index = table.indexOf('<table>');
    table = ~index ? table.substring(index) : table;

    index = table.indexOf('</table>');
    table = ~index ? table.substring(0, index + 8) : table;
    
    index = table.lastIndexOf('<tr>');
    table = ~index ? table.substring(0, index) : table; //remove one row from the top

    index = table.lastIndexOf('<tr>');
    table = ~index ? table.substring(0, index) : table; //remove one row from the top

    index = table.lastIndexOf('<tr>');
    table = ~index ? table.substring(0, index) : table; //remove one row from the top

    index = table.lastIndexOf('<tr>');
    table = ~index ? table.substring(0, index) : table; //remove one row from the top

    table = table + '</table>';
    return table;
}

exports.manageInventoryTableExtracter = function manageInventoryTableExtracter(rawbody) {
    let index = rawbody.indexOf('</form>');
    let table = ~index ? rawbody.substring(index + 7) : rawbody;

    index = table.indexOf('</table>');
    table = ~index ? table.substring(index + 8) : table;

    index = table.indexOf('<table>');
    table = ~index ? table.substring(index) : table;

    index = table.indexOf('</tr>');
    table = ~index ? table.substring(index + 5) : table; //remove one row from the top

    index = table.indexOf('</tr>'); 
    table = ~index ? table.substring(index + 5) : table; //remove another row from the top

    index = table.indexOf('</table>');
    table = ~index ? table.substring(0, index + 8) : table;

    table = '<table>' + table;
    return table;
}
