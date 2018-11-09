'use strict';
require('promise.prototype.finally').shim();
// const htmlparser = require('htmlparser');
const cheerio = require('cheerio');
// const cheerioTableparser = require('cheerio-tableparser');
const request = require('request-promise');
const fs = require('fs');
const utilities = require('./utilities.js');
const username = 'yan';
const password = 'huy95';
const hoursWorkedUrl = 'https://portal.snipits.com/runreport.cfm?name=HoursWorked';

const defaults = {
    flags: 'w',
    encoding: 'utf8',
    fd: null,
    mode: 0o666,
    autoClose: true,
};

//get arguments for from and to dates
const fromDate = process.argv[2];
const toDate = process.argv[3];

const filename = 'payrollHoursReport' + fromDate + 'to' + toDate + '.txt';
const form_data = {
	break_out_by_week:'Y',
	round_hours:'N',
	company_id:'100',
	store_id:'0',
	range_type:'Custom',
	from_date: fromDate,
	to_date: toDate,
	output_as:'html',
	run:'Run',
};

utilities.getCookies()
	.then(cookiestring=>{
		return request({	
			method: 'POST',
			uri: hoursWorkedUrl,
			headers: {
				cookie: cookiestring,
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
		// let tableString = tableFilter(body);
		let $ = cheerio.load(body);
		let tables = $('body').find('table'); 
		let tableString = $.html(tables[tables.length-2]); //the second last table is the table containing payroll information
		let hoursWorked = hoursWorkedRaw(tableString);
		let payRollHours = hoursComputed(hoursWorked); 
		let combinedHours = {};
		for (let property in payRollHours) {
			if (hoursWorked.hasOwnProperty(property)) {
				combinedHours[property] = Object.assign(hoursWorked[property], payRollHours[property]);
			}
			else {
				combinedHours[property] = payRollHours[property];
			}
		}
		console.log(combinedHours);
		payRollHoursFileBot(filename, combinedHours);

	});

function hoursWorkedRaw(tableString) {
	let tableArray = utilities.tableStringToArray(tableString);
	//remove cols don't want
	let length = tableArray.length; 
	tableArray.splice(length-4, 3); //-->remove the three cols before the last total col
	tableArray.splice(0, 2); //-->remove the first two cols
	let tableArrayTransposed = utilities.flipArrayAxis(tableArray);
	let hoursObj = twoDArrayToObject(tableArrayTransposed);
	return hoursObj; //return hours worked by employee as an object with key = employee name
}

// function tableFilter(rawbody) {
// 	let element;
// 	const $ = cheerio.load(rawbody);
// 	$('td')
// 		.each((i, elem) => {
// 			let el = $(elem);
// 			if (el.text() === 'Employee') {
// 				element = el;
// 				return false; // end .each loop right now to stop continued iteration
// 			}
// 		});
// 	// element is the td right now, so we go up the tree...
// 	element = element.parent() // tr
// 		.parent() // tbody
// 		.parent(); // table
// 	return $.html(element);
// }

function hoursComputed(empHrsObj) {
	//Output example: 
	//.txt file and an obj {'miriam': {'regular': 50, 'overtime': 3}}
	//file: name '[startdate]_[enddate].txt' | content 'miriam, 50, 3' 
	let regularTotal = 0; 
	let overtimeTotal =0;
	let total = 0;
	let computedHoursObj = {};
	for (let employeeName in empHrsObj) {
		const hoursByDate = empHrsObj[employeeName];
		const regularArry = [];
		const overtimeArry = [];
		for (let date in hoursByDate) {
			if (date !== 'TotalHours') 
			{
				if (Number(hoursByDate[date])<=8) {
					regularArry.push(Number(hoursByDate[date]));
				}
				else {
					regularArry.push(8);
					overtimeArry.push(Number(hoursByDate[date])-8);
				}
			}
		}
		const regular = regularArry.reduce(add, 0).toFixed(2);
		const overtime = overtimeArry.reduce(add, 0).toFixed(2);
		regularTotal += Number(regular); 
		overtimeTotal += Number(overtime);
		total = regularTotal + overtimeTotal;
		computedHoursObj[employeeName] = {};
		computedHoursObj[employeeName].regular = regular;
		computedHoursObj[employeeName].overtime = overtime; 		
	}
	computedHoursObj.regularTotal= {hours: regularTotal.toFixed(2)};
	computedHoursObj.overtimeTotal = {hours: overtimeTotal.toFixed(2)};
	computedHoursObj.Total = {hours: total.toFixed(2)};
	return computedHoursObj;
}

function add(a, b) {
    return a + b;
}

function twoDArrayToObject (tableArry) {
    //convert a 2-D table-like array into an array of objects along the Y axis, the first element of every inner array is the property name of the object.
    const headerRow = tableArry.shift();
    tableArry.shift(); //--> remove the empty row, the horizontal line in the markup
    headerRow.shift(); //->remove the first element 'employee' so the entire array consists of the dates element. i.e. oct has 31 elements with each has the date value
    const employeesObj = {};
    for (var i = 0; i < tableArry.length; i++) {
        for (let j = 0; j<tableArry[i].length - 1; j++) {
            if (j === 0) {
                employeesObj[tableArry[i][0]] = {};
            }
            employeesObj[tableArry[i][0]][headerRow[j]] = tableArry[i][j+1];    
        }
    }

    //clean the object to only keep rows with the key being the employee name
    delete employeesObj[''];
    return employeesObj;
}

function payRollHoursFileBot(filename, payRollHoursObj) {
	let filepath = "data/" + filename;
	const file = fs.createWriteStream(filepath, defaults);
	file.on('error', err => console.error('ERROR (File)', err));
	file.write('employee' + ',' + Object.keys(payRollHoursObj['Yvonne-Manager Perez']) + '\n');
	for (let employee in payRollHoursObj)
	{
		file.write(employee + ',');
		for (let hoursByDate in payRollHoursObj[employee])
		{
			file.write(payRollHoursObj[employee][hoursByDate] + ',');
		}
		file.write('\n');

	}
	file.end();
	
}


