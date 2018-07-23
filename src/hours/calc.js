'use strict';
const stringToArry = require('../common/stringToArray');
const getCookie = require('../common/cookie');
const getPage = require('../common/pageBody');
const dateFormated = require('../common/dateFormat');
const getHoursContent = require('./filteredContent');
const Collection = require('../../models/collection');
const dateRange1 = require('../common/dateRange');


module.exports = (startDate, endDate) => {
	let dates = dateRange1(startDate, endDate); 
	let results = [];
	for (let i = 0; i < dates.length; i++) {
		let singleDay = dates[i];
		let findPromise = Collection.Hour.find({date: singleDay})
			.exec(function(err, docs){
				if (err) {
					console.error("error finding data in cache");
					return null;
				}
				else if (docs.length === 0) {
					return fetchPortal(singleDay, singleDay)
						.then(dataArry=>{
							dataArry.map(element=>saveToDB(element));
							return dataArry;
						});
				}
				else {
					return docs; 
				}
			});
		results.push(findPromise);
	}

	return Promise.all(results)
		.then(dataArry=>{
			if (dataArry.find(element=>element===null) === null) {
				console.error('something went wrong');
			}
			else {
				let perDayPerStylistArry = [];
				dataArry.map(element=>{element.map(ele=>perDayPerStylistArry.push(ele))});
				let viewReadyObj = prepareForView(perDayPerStylistArry, dates);
				return hoursComputed(viewReadyObj);
			}
		});
}

function prepareForView(dataArry, headerRow) {
	//dataArry is in [{name, date, dayOfWeek, hours}]
	//return {name: {YYYY-MM-DD-MON: 7}, name:{...}}
	let dataObj = {};
	let rowTemplate = headerRow.reduce((template, day)=>{
		template[day] = 0;
		return template;
	}, {});
	for (let i = 0; i < dataArry.length; i++) {
		let employee = {};
		let nameKey = dataArry[i].name;  
		let dateKey = dataArry[i].date;
		employee[dateKey] = dataArry[i].hours; 
		if (!dataObj[nameKey]) { //first time creating nameKey
			dataObj[nameKey] = employee;
		}
		else {//existing nameKey
			dataObj[nameKey][dateKey] = dataArry[i].hours; 
		}
	}
	let filledDataObj = {};
	for (let employee in dataObj) {
		filledDataObj[employee] = fillDates(dataObj[employee], rowTemplate);
	}
	return filledDataObj;
}

function fillDates(rowObj, rowTemplate) {
	return Object.assign({}, rowTemplate, rowObj);
}	

function saveToDB (singleDocument) {
	let newHour = new Collection.Hour();
	newHour.date = singleDocument.date;
	newHour.dayOfWeek = singleDocument.dayOfWeek;
	newHour.name = singleDocument.name;
	newHour.hours = singleDocument.hours;
	newHour.save(function(err, data){
		if (err) {
			console.error('error saving document');
		}
	});
}
function fetchPortal(startDate, endDate) { 
	// return an array [] of {name:, date:, hours:,}
	const username = 'yan';
	const password = 'huy95';
	const ciphers = 'DES-CBC3-SHA';

	const fromDate = startDate;
	const toDate = endDate; 

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
		let hoursArry = [];
		for (let name in hoursWorked) {
			let myHours = hoursWorked[name];
			for (let rawDate in myHours) {
				let hours = Number(myHours[rawDate]);
				let date = rawDate.substring(0, 10); //'YYYYMM-DD'
				hoursArry.push({name, date, hours});
			}
		}
		if(hoursArry.length===0) {
			hoursArry.push({name: 'Yan-Owner Hu', date: fromDate, hours: 0});
		}
		return hoursArry;
	});
}

function hoursComputed(empHrsObj) {
	let regularTotal = 0; 
	let overtimeTotal =0;
	let totalTotal = 0;
	let computedHoursObj = empHrsObj;
	for (let employeeName in empHrsObj) {
		const hoursByDate = empHrsObj[employeeName];
		const regularArry = [];
		const overtimeArry = [];
		for (let date in hoursByDate) {
			if (Number(hoursByDate[date])<=8) {
				regularArry.push(Number(hoursByDate[date]));
			}
			else {
				regularArry.push(8);
				overtimeArry.push(Number(hoursByDate[date])-8);
			}
		}
		const regular = regularArry.reduce(add, 0);
		const overtime = overtimeArry.reduce(add, 0);
		const total = regular + overtime;
		regularTotal += Number(regular); 
		overtimeTotal += Number(overtime);
		totalTotal = regularTotal + overtimeTotal;
		computedHoursObj[employeeName].regular = regular.toFixed(2);
		computedHoursObj[employeeName].overtime = overtime.toFixed(2);
		computedHoursObj[employeeName].total = total.toFixed(2);
	}
	computedHoursObj.regularTotal= {hours: regularTotal.toFixed(2)};
	computedHoursObj.overtimeTotal = {hours: overtimeTotal.toFixed(2)};
	computedHoursObj.Total = {hours: totalTotal.toFixed(2)};
	return computedHoursObj;
}

function add(a, b) {
    return a + b;
}

function arryToObj(tableString) {
    //convert a 2-D table-like array into an array of objects along the Y axis, the first element of every inner array is the property name of the object.const $ = cheerio.load(tableString);
	let hrsInversedTbl = stringToArry.inversedTableArry(tableString);
	hrsInversedTbl = stringToArry.removeCol(hrsInversedTbl, [0, 1, -1, -2, -3, -4]);
	let hrsTble = stringToArry.flipAxis(hrsInversedTbl);

    let headerRow = hrsTble.shift();
    //clean headerRow values with reformat date values
    headerRow = headerRow.map(dateFormated);
    hrsTble.shift(); //--> remove the empty row, the horizontal line in the markup
    headerRow.shift(); //->remove the first element 'employee' so the entire array consists of the dates element. i.e. oct has 31 elements with each has the date value
    const employeesObj = {};
    for (let i = 0; i < hrsTble.length; i++) {
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