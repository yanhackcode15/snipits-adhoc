'use strict';

var numeral = require('numeral');
var stringToArry = require('../common/stringToArray');
var getCookie = require('../common/cookie');
var getPage = require('../common/pageBody');
var getProductivityContent = require('./filteredContent');
var tip = 0.2066;
var reportKeys = ['haircuts', 'addons', 'haircare', 'prepaid', 'serviceRev', 'haircareRev', 'otherRetailRev', 'productRev', 'totalRev', 'retailRatio', 'addonRatio', 'haircareCommission', 'addonCommission', 'prepaidCommission', 'otherRetailCommission', 'totalCommission', 'hours', 'reportedTips', 'actualTips', 'additionalHourly'];

module.exports = function () {
	var username = 'yan';
	var password = 'huy95';
	var ciphers = 'DES-CBC3-SHA';
	var fromDate = process.argv[2];
	var toDate = process.argv[3];
	var formData = {
		level: 'Category',
		company_id: '100',
		store_id: '0',
		range_type: 'Custom',
		from_date: fromDate,
		to_date: toDate,
		output_as: 'html',
		run: 'Run'
	};

	return getCookie(username, password, 'https://portal.snipits.com/login.cfm', ciphers).then(function (cookie) {
		return getPage(cookie, 'https://portal.snipits.com/runreport.cfm?name=Productivity', formData, ciphers);
	}).then(function (productivityPg) {
		return getProductivityContent(productivityPg);
	}).then(function (productivityTbl) {
		var prodArry = productivityArray(productivityTbl);
		var prodObj = productivityObject(prodArry);
		return prodObj;
		// console.log(prodObj);
	});
};

function productivityArray(dataString) {
	var dataArray = stringToArry.inversedTableArry(dataString);
	var length = dataArray.length;
	var dataArrayTransposed = stringToArry.flipAxis(dataArray);
	//remove rows where each element is an empty string;
	var dataArrayCleaned = dataArrayTransposed.filter(function (row) {
		return !row.equals(['', '', '', '', '', '', '', '', '', '', '']);
	});
	var dataArrayNormalized = downFill2dArray(dataArrayCleaned);
	return dataArrayNormalized;
}

function downFill2dArray(array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i][0] === 'Services Subtotal') {
			array[i][0] = array[i - 1][0];
			array[i][1] = array[i - 1][1];
			array[i][2] = array[i - 1][2];
			array[i][3] = 'Services Subtotal';
		} else if (array[i][0] === 'Products Subtotal') {
			array[i][0] = array[i - 1][0];
			array[i][1] = array[i - 1][1];
			array[i][2] = array[i - 1][2];
			array[i][3] = 'Products Subtotal';
		} else if (array[i][0].includes('Total for')) {
			array[i][0] = array[i - 2][0];
			array[i][1] = array[i - 2][1];
			array[i][2] = array[i - 2][2];
			array[i][3] = 'Total';
		} else {
			for (var j = 0; j < array[i].length; j++) {
				if (array[i][j] === '' && i !== 0) {
					array[i][j] = array[i - 1][j];
				}
			}
		}
	}
	return array;
}

function productivityObject(normalizedArray) {
	//{Yvonne: {hours: 240, haircuts: 35, add-on: 35, haircare: 24, prepaid: 3, services total: $2443, retail total: $30, estimated tips: $243}}
	var dataObj = normalizedArray.reduce(function (obj, row) {
		if (row[0] === 'Employee') {
			return obj;
		}
		var employee = obj[row[0]] = obj[row[0]] || {};

		switch (row[3]) {
			case 'Haircuts':
				employee.haircuts = numeral(row[5]).value();
				break;
			case 'Add On':
				employee.addons = numeral(row[5]).value();
				break;
			case 'Prepaid Items':
				employee.prepaid = numeral(row[5]).value();
				break;
			case 'Hair Care':
				employee.haircare = numeral(row[5]).value();
				employee.haircareRev = numeral(row[7]).value();
				break;
			case 'Services Subtotal':
				var serRev = employee.serviceRev = numeral(row[7]).value();
				var reportedTips = numeral(serRev).value() * 0.1;
				var actualTips = numeral(serRev).value() * tip;
				employee.reportedTips = reportedTips;
				employee.actualTips = actualTips;
				break;
			case 'Products Subtotal':
				employee.productRev = numeral(row[7]).value();
				break;
			case 'Total':
				employee.totalRev = numeral(row[7]).value();
				employee.hours = numeral(row[1]).value();
		}
		return obj;
	}, {});

	for (var key in dataObj) {
		var employee = dataObj[key];
		var otherRetailRev = employee.productRev - employee.haircareRev;
		employee.otherRetailCommission = otherRetailRev >= 50 ? otherRetailRev * 0.2 : 0;
		employee.otherRetailRev = otherRetailRev;

		var retailCount = employee.haircare || 0;
		var addonCount = employee.addons || 0;
		var retailRat = employee.haircuts / retailCount;
		var addonRat = employee.haircuts / addonCount;
		var haircareComm = retailRat <= 3.9 ? retailCount * 2 : retailRat <= 5.9 ? retailCount * 1 : retailRat <= 8.9 ? retailCount * 0.5 : 0;
		var addonComm = addonRat <= 5.9 ? addonCount : addonRat <= 8.9 ? addonCount * 0.5 : 0;
		var prepaidComm = employee.prepaid * 5 || 0;

		employee.retailRatio = retailRat;
		employee.addonRatio = addonRat;
		employee.haircareCommission = haircareComm;
		employee.addonCommission = addonComm;
		employee.prepaidCommission = prepaidComm;
		employee.totalCommission = haircareComm + addonComm + prepaidComm;
		employee.additionalHourly = (employee.totalCommission + employee.actualTips) / employee.hours;
	}

	for (var _employee in dataObj) {
		var employeeAttributes = Object.keys(dataObj[_employee]);
		for (var i = 0; i < reportKeys.length; i++) {
			if (!employeeAttributes.includes(reportKeys[i])) {
				dataObj[_employee][reportKeys[i]] = 0;
			} else if (isNaN(dataObj[_employee][reportKeys[i]])) {
				dataObj[_employee][reportKeys[i]] = 0;
			}
		}
	}
	return dataObj;
}

if (Array.prototype.equals) console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
	// if the other array is a falsy value, return
	if (!array) return false;

	// compare lengths - can save a lot of time 
	if (this.length != array.length) return false;

	for (var i = 0, l = this.length; i < l; i++) {
		// Check if we have nested arrays
		if (this[i] instanceof Array && array[i] instanceof Array) {
			// recurse into the nested arrays
			if (!this[i].equals(array[i])) return false;
		} else if (this[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });