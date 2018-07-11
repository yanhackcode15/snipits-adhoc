'use strict';
const stringToArry = require('../common/stringToArray');
const getCookie = require('../common/cookie');
const getPage = require('../common/pageBody');
const getHoursContent = require('./filteredContent');

module.exports = ()=> {
	const username = 'yan';
	const password = 'huy95';
	const ciphers = 'DES-CBC3-SHA';

	const fromDate = process.argv[2];
	const toDate = process.argv[3];
	const formData = {
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

	return getCookie(username, password, 'https://portal.snipits.com/login.cfm', ciphers)
	.then(cookie => getPage(cookie, 'https://portal.snipits.com/runreport.cfm?name=HoursWorked', formData, ciphers))
	.then(hrsPg => getHoursContent(hrsPg))
	.then(hrsTbl => {
		let hoursWorked = arryToObj(hrsTbl);
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
		// console.log(combinedHours);
		return combinedHours;
	});
}

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

function arryToObj(tableString) {
    //convert a 2-D table-like array into an array of objects along the Y axis, the first element of every inner array is the property name of the object.const $ = cheerio.load(tableString);
	let hrsInversedTbl = stringToArry.inversedTableArry(tableString);
	hrsInversedTbl = stringToArry.removeCol(hrsInversedTbl, [0, 1, -2, -3, -4]);
	let hrsTble = stringToArry.flipAxis(hrsInversedTbl);

    const headerRow = hrsTble.shift();
    hrsTble.shift(); //--> remove the empty row, the horizontal line in the markup
    headerRow.shift(); //->remove the first element 'employee' so the entire array consists of the dates element. i.e. oct has 31 elements with each has the date value
    const employeesObj = {};
    for (var i = 0; i < hrsTble.length; i++) {
        for (let j = 0; j<hrsTble[i].length - 1; j++) {
            if (j === 0) {
                employeesObj[hrsTble[i][0]] = {};
            }
            employeesObj[hrsTble[i][0]][headerRow[j]] = hrsTble[i][j+1];    
        }
    }

    //clean the object to only keep rows with the key being the employee name
    delete employeesObj[''];
    return employeesObj;
}

