'use strict';

var stringToArry = require('../common/stringToArray');
var getCookie = require('../common/cookie');
var getPage = require('../common/pageBody');
var getHoursContent = require('./filteredContent');

module.exports = function () {
	var username = 'yan';
	var password = 'huy95';
	var ciphers = 'DES-CBC3-SHA';

	var fromDate = process.argv[2];
	var toDate = process.argv[3];
	var formData = {
		break_out_by_week: 'Y',
		round_hours: 'N',
		company_id: '100',
		store_id: '0',
		range_type: 'Custom',
		from_date: fromDate,
		to_date: toDate,
		output_as: 'html',
		run: 'Run'
	};

	return getCookie(username, password, 'https://portal.snipits.com/login.cfm', ciphers).then(function (cookie) {
		return getPage(cookie, 'https://portal.snipits.com/runreport.cfm?name=HoursWorked', formData, ciphers);
	}).then(function (hrsPg) {
		return getHoursContent(hrsPg);
	}).then(function (hrsTbl) {
		var hoursWorked = arryToObj(hrsTbl);
		var payRollHours = hoursComputed(hoursWorked);
		var combinedHours = {};
		for (var property in payRollHours) {
			if (hoursWorked.hasOwnProperty(property)) {
				combinedHours[property] = Object.assign(hoursWorked[property], payRollHours[property]);
			} else {
				combinedHours[property] = payRollHours[property];
			}
		}
		// console.log(combinedHours);
		return combinedHours;
	});
};

function hoursComputed(empHrsObj) {
	//Output example: 
	//.txt file and an obj {'miriam': {'regular': 50, 'overtime': 3}}
	//file: name '[startdate]_[enddate].txt' | content 'miriam, 50, 3' 
	var regularTotal = 0;
	var overtimeTotal = 0;
	var total = 0;
	var computedHoursObj = {};
	for (var employeeName in empHrsObj) {
		var hoursByDate = empHrsObj[employeeName];
		var regularArry = [];
		var overtimeArry = [];
		for (var date in hoursByDate) {
			if (date !== 'TotalHours') {
				if (Number(hoursByDate[date]) <= 8) {
					regularArry.push(Number(hoursByDate[date]));
				} else {
					regularArry.push(8);
					overtimeArry.push(Number(hoursByDate[date]) - 8);
				}
			}
		}
		var regular = regularArry.reduce(add, 0).toFixed(2);
		var overtime = overtimeArry.reduce(add, 0).toFixed(2);
		regularTotal += Number(regular);
		overtimeTotal += Number(overtime);
		total = regularTotal + overtimeTotal;
		computedHoursObj[employeeName] = {};
		computedHoursObj[employeeName].regular = regular;
		computedHoursObj[employeeName].overtime = overtime;
	}
	computedHoursObj.regularTotal = { hours: regularTotal.toFixed(2) };
	computedHoursObj.overtimeTotal = { hours: overtimeTotal.toFixed(2) };
	computedHoursObj.Total = { hours: total.toFixed(2) };
	return computedHoursObj;
}

function add(a, b) {
	return a + b;
}

function arryToObj(tableString) {
	//convert a 2-D table-like array into an array of objects along the Y axis, the first element of every inner array is the property name of the object.const $ = cheerio.load(tableString);
	var hrsInversedTbl = stringToArry.inversedTableArry(tableString);
	hrsInversedTbl = stringToArry.removeCol(hrsInversedTbl, [0, 1, -2, -3, -4]);
	var hrsTble = stringToArry.flipAxis(hrsInversedTbl);

	var headerRow = hrsTble.shift();
	hrsTble.shift(); //--> remove the empty row, the horizontal line in the markup
	headerRow.shift(); //->remove the first element 'employee' so the entire array consists of the dates element. i.e. oct has 31 elements with each has the date value
	var employeesObj = {};
	for (var i = 0; i < hrsTble.length; i++) {
		for (var j = 0; j < hrsTble[i].length - 1; j++) {
			if (j === 0) {
				employeesObj[hrsTble[i][0]] = {};
			}
			employeesObj[hrsTble[i][0]][headerRow[j]] = hrsTble[i][j + 1];
		}
	}

	//clean the object to only keep rows with the key being the employee name
	delete employeesObj[''];
	return employeesObj;
}