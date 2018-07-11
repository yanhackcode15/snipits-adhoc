'use strict';

require('promise.prototype.finally').shim();
var firebase = require("firebase");
// const admin = require('firebase-admin');
// const serviceAccount = require("./serviceAccountKey.json");
var htmlparser = require('htmlparser');
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
var request = require('request-promise');
var fs = require('fs');
var utilities = require('./utilities.js');
var username = 'yan';
var password = 'huy95';
var salesDetailsUrl = 'https://portal.snipits.com/runreport.cfm?name=SalesDetails';
var defaults = {
	flags: 'w',
	mode: 438,
	encoding: 'utf8',
	fd: null,
	autoClose: true
};

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://snipits-sign-in.firebaseio.com"
// });

var config = {
	apiKey: "AIzaSyDhCdLyt5M_AIx4s-z8SyEPrxyHSqtCm38",
	authDomain: "snipits-sign-in.firebaseapp.com",
	databaseURL: "https://snipits-sign-in.firebaseio.com",
	projectId: "snipits-sign-in",
	storageBucket: "snipits-sign-in.appspot.com",
	messagingSenderId: "129088095571"
};
firebase.initializeApp(config);

//get arguments for from and to dates
var fromDate = process.argv[2];
var toDate = process.argv[3];

//---------main script start----------

//build a array
var dateArry = [];
var month = fromDate.split('/')[0];
var year = fromDate.split('/')[2];
var i = fromDate.split('/')[1];
var j = toDate.split('/')[1];
for (var k = i; k <= j; k++) {
	var dateString = month + '/' + k + '/' + year;
	dateArry.push(dateString);
}

Promise.all(dateArry.map(singleDayReport)).then(function () {
	console.log('all done');
});

//---------main script ends-----------

function singleDayReport(oneDate) {
	var form_data = {
		store_id: '184',
		from_date: oneDate,
		output_as: 'html',
		run: 'Run'
	};
	return utilities.getCookies().then(function (cookiestring) {
		return request({
			method: 'POST',
			uri: salesDetailsUrl,
			headers: {
				'cookie': cookiestring
			},
			form: form_data,
			simple: false,
			transform: function transform(body) {
				return body;
			},
			ciphers: 'DES-CBC3-SHA' // Required for the IIS server to not simply end the connection
		});
	}).then(function (body) {
		var tableString = tableFilter(body);
		var transactions = tranxArry(tableString, oneDate);
		Promise.all(transactions.map(sendToFire)) //return promises
		.then(function () {
			firebase.app().delete().then(function () {
				console.log('done');
			});
		});
	});
}

//---------start of functions---------
function tableFilter(rawbody) {
	var $ = cheerio.load(rawbody);
	var maintable = void 0;
	$('td').each(function (i, elem) {
		if ($(elem).text() === 'Sale') {
			maintable = $(elem).parent().parent();
		};
	});
	return $.html(maintable);
}

function tranxArry(tableString, dateString) {
	var $ = cheerio.load(tableString);
	var element = void 0;
	var tranxArry = [];
	var tranxObj = function tranxObj() {
		return {
			payment: '',
			lineItem: []
		};
	};

	var lineItemObj = function lineItemObj() {
		return {
			product: '',
			customer: '',
			employee: ''
		};
	};

	$('table').each(function (i, elem) {
		var element = $(elem);
		var tbody = element.children()[0];
		var tr = $(tbody).children()[0];
		var td = $(tr).children()[0];
		var text = $(td).text().trim();

		if (text === 'Time:') {
			// console.log('time');
			// let newObj = Object.assign({}, tranxObj(), {payment: $.html(element)});
			var newObj = Object.assign({}, tranxObj(), { payment: paymentObj(elem, dateString) });
			tranxArry.push(newObj);
		} else if (text === 'Product:') {
			//if it's the product table
			// console.log('product');
			// let newObj = Object.assign({}, lineItemObj(), {product: $.html(element)});
			var _newObj = Object.assign({}, lineItemObj(), { product: productObj(elem) });
			tranxArry[tranxArry.length - 1].lineItem.push(_newObj);
		} else if (text === 'Name:') {
			//if it's the child table
			// console.log('name');
			var lineItemArray = tranxArry[tranxArry.length - 1].lineItem;
			// lineItemArray[lineItemArray.length-1].customer = $.html(element);
			lineItemArray[lineItemArray.length - 1].customer = customerObj(elem);
		} else if (text === 'Receptionist:') {
			//if it's the receiptionist/stylist able
			// console.log('employee');
			var _lineItemArray = tranxArry[tranxArry.length - 1].lineItem;
			// lineItemArray[lineItemArray.length-1].employee = $.html(element);
			_lineItemArray[_lineItemArray.length - 1].employee = employeeObj(elem);
		}
	});
	// console.log(tranxArry[0].lineItem);
	return tranxArry;
}

function paymentObj(paymentStr, dateStr) {
	var $ = cheerio.load(paymentStr);
	var data = {
		Time: '',
		PaymentType: '',
		SaleTotal: '',
		AmountTendered: '',
		ChangeGiven: ''
	};
	var count = 0;

	$('td').each(function (i, elem) {
		if (count === 1) {
			data.Time = $(elem).text().trim();
		} else if (count === 3) {
			data.PaymentType = $(elem).text().trim();
		} else if (count === 5) {
			data.SaleTotal = $(elem).text().trim();
		} else if (count === 7) {
			data.AmountTendered = $(elem).text().trim();
		} else if (count === 9) {
			data.ChangeGiven = $(elem).text().trim();
		}
		data.DateValue = dateStr;
		count++;
	});
	return data;
}

function productObj(productStr) {
	var $ = cheerio.load(productStr);
	var data = {
		ProductName: '',
		Category: '',
		Quantity: '',
		UnitPrice: '',
		PromotionName: '',
		DiscountAmount: '',
		TaxAmount: '',
		LineTotal: ''
	};
	var count = 0;
	var dataArry = [];

	$('td').each(function (i, elem) {
		if (count % 2 === 1) {
			dataArry.push($(elem).text().trim());
		}
		count++;
	});

	for (var key in data) {
		data[key] = dataArry.shift();
	}

	return data;
}

function customerObj(customerObj) {
	var $ = cheerio.load(customerObj);
	var data = {
		ChildName: '',
		FamilyCode: ''
	};
	var count = 0;
	var dataArry = [];

	$('td').each(function (i, elem) {
		if (count % 2 === 1 && count < 4) {
			dataArry.push($(elem).text().trim());
		}
		count++;
	});

	for (var key in data) {
		data[key] = dataArry.shift();
	}

	return data;
}

function employeeObj(employeeObj) {
	var $ = cheerio.load(employeeObj);
	var data = {
		Receptionist: '',
		Stylist: ''
	};
	var count = 0;
	var dataArry = [];

	$('td').each(function (i, elem) {
		if (count % 2 === 1) {
			dataArry.push($(elem).text().trim());
		}
		count++;
	});

	for (var key in data) {
		data[key] = dataArry.shift();
	}

	return data;
}

function sendToFire(tranxObj) {
	return firebase.database().ref('/transactions').push(tranxObj);
}