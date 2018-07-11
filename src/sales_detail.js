'use strict';
require('promise.prototype.finally').shim();
const firebase = require("firebase");
// const admin = require('firebase-admin');
// const serviceAccount = require("./serviceAccountKey.json");
const htmlparser = require('htmlparser');
const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const request = require('request-promise');
const fs = require('fs');
const utilities = require('./utilities.js');
const username = 'yan';
const password = 'huy95';
const salesDetailsUrl = 'https://portal.snipits.com/runreport.cfm?name=SalesDetails';
const defaults = {
    flags: 'w',
    mode: 0o666,
    encoding: 'utf8',
    fd: null,
    autoClose: true,
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
const fromDate = process.argv[2];
const toDate = process.argv[3];

//---------main script start----------

//build a array
const dateArry = [];
const month = fromDate.split('/')[0];
const year = fromDate.split('/')[2];
const i = fromDate.split('/')[1];
const j = toDate.split('/')[1];
for (var k = i; k <= j; k++) {
	var dateString = month + '/' + k + '/' + year;
	dateArry.push(dateString);
}

Promise.all(dateArry.map(singleDayReport)).then(
	()=>{
		console.log('all done');
	});


//---------main script ends-----------

function singleDayReport(oneDate) {
	const form_data = {
		store_id:'184',
		from_date: oneDate,
		output_as:'html',
		run:'Run',
	};
	return utilities.getCookies()
	.then(cookiestring=>{
		return request({	
			method: 'POST',
			uri: salesDetailsUrl,
			headers: {
				'cookie': cookiestring,
			},
			form: form_data,
			simple: false,
			transform: function (body) {
		        return body;
		    },
            ciphers: 'DES-CBC3-SHA', // Required for the IIS server to not simply end the connection
		});
	})
	.then(body=>{
		let tableString = tableFilter(body);
		let transactions = tranxArry(tableString, oneDate);
		Promise.all(transactions.map(sendToFire)) //return promises
			.then(()=>{
					firebase.app().delete().then(()=>{console.log('done')})
			}); 
	});
}


//---------start of functions---------
function tableFilter(rawbody) {
	const $ = cheerio.load(rawbody);
	let maintable;
	$('td').each((i, elem)=>{
		if ($(elem).text()==='Sale') {
			maintable = $(elem).parent().parent();
		};
	});
	return $.html(maintable);
}

function tranxArry(tableString, dateString) {
	const $ = cheerio.load(tableString);
	let element;
	let tranxArry = []; 
	let tranxObj = () => {
		return {
			payment: '',
			lineItem: [],
		};
	};

	let lineItemObj = () => {
		return {
			product: '',
			customer: '',
			employee: '',
		};
	};

	$('table')
		.each((i, elem) => {
			let element = $(elem);
			let tbody = element.children()[0];
			let tr = $(tbody).children()[0];
			let td = $(tr).children()[0];
			let text = $(td).text().trim();
			
			if (text === 'Time:') {
				// console.log('time');
				// let newObj = Object.assign({}, tranxObj(), {payment: $.html(element)});
				let newObj = Object.assign({}, tranxObj(), {payment: paymentObj(elem, dateString)});
				tranxArry.push(newObj);
			}
			else if (text === 'Product:') { //if it's the product table
				// console.log('product');
				// let newObj = Object.assign({}, lineItemObj(), {product: $.html(element)});
				let newObj = Object.assign({}, lineItemObj(), {product: productObj(elem)});
				tranxArry[tranxArry.length-1].lineItem.push(newObj);
			}
			else if (text === 'Name:') { //if it's the child table
				// console.log('name');
				let lineItemArray = tranxArry[tranxArry.length-1].lineItem;
				// lineItemArray[lineItemArray.length-1].customer = $.html(element);
				lineItemArray[lineItemArray.length-1].customer = customerObj(elem);

			}
			else if (text === 'Receptionist:') { //if it's the receiptionist/stylist able
				// console.log('employee');
				let lineItemArray = tranxArry[tranxArry.length-1].lineItem;
				// lineItemArray[lineItemArray.length-1].employee = $.html(element);
				lineItemArray[lineItemArray.length-1].employee = employeeObj(elem);
			}

		});
	// console.log(tranxArry[0].lineItem);
	return tranxArry;

}

function paymentObj(paymentStr, dateStr) {
	let $ = cheerio.load(paymentStr);
	let data = {
		Time: '',
		PaymentType: '',
		SaleTotal: '',
		AmountTendered: '',
		ChangeGiven: '', 
	};
	let count = 0; 

	$('td').each((i, elem)=> {
		if (count === 1) { 
			data.Time = $(elem).text().trim();
		}
		else if (count === 3){
			data.PaymentType = $(elem).text().trim();
		}
		else if (count === 5) {
			data.SaleTotal = $(elem).text().trim();
		}
		else if (count === 7){
			data.AmountTendered = $(elem).text().trim();
		}
		else if (count === 9) {
			data.ChangeGiven = $(elem).text().trim();
		}
		data.DateValue = dateStr;
		count ++;
	});
	return data;
}

function productObj(productStr) {
	let $ = cheerio.load(productStr);
	let data = {
		ProductName: '',
		Category: '',
		Quantity: '',
		UnitPrice: '',
		PromotionName: '', 
		DiscountAmount: '',
		TaxAmount: '',
		LineTotal: '',
	};
	let count = 0; 
	let dataArry = [];

	$('td').each((i, elem)=> {
		if (count % 2 === 1) { 
			dataArry.push($(elem).text().trim());
		}
		count ++;
	});

	for (var key in data) {
		data[key] = dataArry.shift();
	}

	return data;
}

function customerObj(customerObj) {
	let $ = cheerio.load(customerObj);
	let data = {
		ChildName: '',
		FamilyCode: '',
	};
	let count = 0; 
	let dataArry = [];

	$('td').each((i, elem)=> {
		if (count % 2 === 1 && count < 4) { 
			dataArry.push($(elem).text().trim());
		}
		count ++;
	});

	for (var key in data) {
		data[key] = dataArry.shift();
	}

	return data;
}

function employeeObj(employeeObj) {
	let $ = cheerio.load(employeeObj);
	let data = {
		Receptionist: '',
		Stylist: '',
	};
	let count = 0; 
	let dataArry = [];

	$('td').each((i, elem)=> {
		if (count % 2 === 1) { 
			dataArry.push($(elem).text().trim());
		}
		count ++;
	});

	for (var key in data) {
		data[key] = dataArry.shift();
	}

	return data;
}

function sendToFire(tranxObj) {
	return firebase.database().ref('/transactions').push(tranxObj);
}

