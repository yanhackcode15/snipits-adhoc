'use strict';
const numeral = require('numeral');
const stringToArry = require('../common/stringToArray');
const getCookie = require('../common/cookie');
const getPage = require('../common/pageBody');
const getProductivityContent = require('./filteredContent');
const dateFormated = require('../common/dateFormat');
const dateRange = require('../common/dateRange');
const Collection = require('../../models/collection');

const tip = 0.2066;
const reportKeys = [
		 'haircuts', 
	     'addons', 
	     'haircare',
	     'prepaid',
	     'serviceRev',
	     'haircareRev',
	     'otherRetailRev',
	     'productRev',
	     'totalRev',
	     'retailRatio',
	     'addonRatio',
	     'haircareCommission',
	     'addonCommission',
	     'prepaidCommission',
	     'otherRetailCommission',
	     'totalCommission',
	     'hours',
	     'reportedTips', 
	     'actualTips',
	     'additionalHourly',
	];
module.exports = (startDate, endDate) => {
	let dates = dateRange(startDate, endDate); 
	let results = [];
	let dates = dateRange(startDate, endDate); 
	let results = [];
	for (let i = 0; i < dates.length; i++) {
		let singleDay = dates[i];
		let findPromise = Collection.Productivity.find({date: singleDay})
			.exec(function(err, docs){
				if (err) {
					console.error("error finding data in cache");
					return null;
				}
				else if (docs.length === 0) {
					return fetchPortal(singleDay, singleDay)
						.then(dataArry=>{
							dataArry.forEach(element=>saveToDB(element));
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
				dataArry.forEach(element=>{element.forEach(ele=>perDayPerStylistArry.push(ele))});
				let viewReadyObj = prepareForView(perDayPerStylistArry, dates);
				return viewReadyObj;
			}
		});
}

function fetchPortal(startDate, endDate){
	const username = process.env.PORTAL_ID;
	const password = process.env.PORTAL_PASSWORD;
	const ciphers = 'DES-CBC3-SHA';
	const fromDate = startDate;
	const toDate = endDate; 

	const formData = {
		level:'Category',
		company_id:'100',
		store_id:'0',
		range_type:'Custom',
		from_date:fromDate,
		to_date:toDate,
		output_as:'html',
		run:'Run',
	};

	return getCookie(username, password, 'https://portal.snipits.com/login.cfm', ciphers)
	.then(cookie => getPage(cookie, 'https://portal.snipits.com/runreport.cfm?name=Productivity', formData, ciphers))
	.then(productivityPg => getProductivityContent(productivityPg))
	.then(productivityTbl => {
		let prodArry = productivityArray(productivityTbl);
		let prodObj = productivityObject(prodArry);
		let newProdArry = [];
		for (let name in prodObj) {
			let data = prodObj[name];
			newProdArry.push({
				name,
				date: fromDate,
				hours: Number(data.hours) || 0,
				haircuts: Number(data.haircuts) || 0,
				addons: Number(data.addons) || 0,
				haircare: Number(data.haircare) || 0,
				prepaid: Number(data.prepaid) || 0,
				serviceRev: Number(data.serviceRev) || 0,
				haircareRev: Number(data.haircareRev) || 0,
				otherRetailRev: Number(data.otherRetailRev) || 0,
				productRev: Number(data.productRev) || 0,
				totalRev: Number(data.totalRev) || 0,
			});
		}

		if(newProdArry.length===0) {
			newProdArry.push({
				name: 'Yan-Owner Hu',
				date: fromDate,
				hours: 0,
				haircuts: 0,
				addons: 0,
				haircare: 0,
				prepaid: 0,
				serviceRev: 0,
				haircareRev: 0,
				otherRetailRev: 0,
				productRev: 0,
				totalRev: 0,
			});	
		}
		return newProdArry;
	});
};
function saveToDB (singleDocument) {
	let newProd = new Collection.Productivity();
	newProd.date = singleDocument.date;
	newProd.name = singleDocument.name;
	newProd.hours = singleDocument.hours;
	newProd.haircuts = singleDocument.haircuts;
	newProd.addons = singleDocument.addons; 
	newProd.haircare = singleDocument.haircare;
	newProd.prepaid = singleDocument.prepaid;
	newProd.serviceRev = singleDocument.serviceRev;
	newProd.haircareRev = singleDocument.haircareRev;
	newProd.otherRetailRev = singleDocument.otherRetailRev;
	newProd.productRev = singleDocument.productRev;
	newProd.totalRev = singleDocument.totalRev;

	newProd.save(function(err, data){
		if (err) {
			console.error('error saving document');
		}
	});
}

function prepareForView(dataArry, headerRow) {
	//dataArry is in [{name, date, dayOfWeek, hours}]
	//return {name: {YYYY-MM-DD-MON: 7}, name:{...}}
	let dataObj = {};
	let rowTemplate = headerRow.reduce((template, metrix)=>{
		template[metrix] = 0;
		return template;
	}, {});
	const employeeTemplate = {
		haircuts: 0,
		addons: 0,
		haircare: 0,
		prepaid: 0,
		serviceRev: 0,
		haircareRev: 0,
		otherRetailRev: 0,
		productRev: 0,
		totalRev: 0,
		hours: 0,
	};
	for (let i = 0; i < dataArry.length; i++) { //aggregate table data to show each stylist stats per row
		let nameKey = dataArry[i].name;  
		if (!dataObj[nameKey]) { //first time creating nameKey
			dataObj[nameKey] = Object.assign({}, employeeTemplate);
		}
		dataObj[nameKey].haircuts += +dataArry[i].haircuts || 0;
		dataObj[nameKey].addons += +dataArry[i].addons || 0;
		dataObj[nameKey].haircare += +dataArry[i].haircare || 0;
		dataObj[nameKey].prepaid += +dataArry[i].prepaid || 0;
		dataObj[nameKey].serviceRev += +dataArry[i].serviceRev || 0;
		dataObj[nameKey].haircareRev += +dataArry[i].haircareRev || 0;
		dataObj[nameKey].otherRetailRev += +dataArry[i].otherRetailRev || 0;	
		dataObj[nameKey].productRev += +dataArry[i].productRev || 0;
		dataObj[nameKey].totalRev += +dataArry[i].totalRev || 0;
     	dataObj[nameKey].hours += +dataArry[i].hours || 0; 
	}
	//compute ratios, tips amount, commissions and append to the object
	for (let name in dataObj) {
		dataObj[name]['retail Ratio'] = dataObj[name].haircuts / dataObj[name].haircare
		dataObj[name]['addon Ratio'] = dataObj[name].haircuts / dataObj[name].addons
		dataObj[name]['estimated Tips'] = dataObj[name].serviceRev * tip;
		dataObj[name].otherRetailRev = dataObj[name].productRev - dataObj[name].haircareRev;
		dataObj[name]['haircare Commission'] = dataObj[name]['retail Ratio'] <= 3.9
			? (dataObj[name].haircare * 2) : (
				dataObj[name]['retail Ratio'] <= 5.9 ? dataObj[name].haircare * 1 : (
					dataObj[name]['retail Ratio'] <= 8.9 ? dataObj[name].haircare * 0.5 : 0
					));
		dataObj[name]['addon Commission'] = dataObj[name]['addon Ratio'] <= 5.9
			? dataObj[name].addons
			: (dataObj[name]['addon Ratio'] <= 8.9 ? dataObj[name].addons * 0.5 : 0);
		dataObj[name]['prepaid Commission'] = dataObj[name].prepaid * 5 || 0 ;
		dataObj[name]['total Commission'] = dataObj[name]['haircare Commission'] + dataObj[name]['addon Commission'] + dataObj[name]['prepaid Commission'];
		dataObj[name]['additional Hourly'] = (dataObj[name]['total Commission'] + dataObj[name]['estimated Tips']) / dataObj[name].hours;
	}

	for (let name in dataObj) { //format numbers
		dataObj[name]['retail Ratio'] = dataObj[name]['retail Ratio'].toFixed(1);
		dataObj[name]['addon Ratio'] = dataObj[name]['addon Ratio'].toFixed(1);
		dataObj[name]['estimated Tips'] = '$' + dataObj[name]['estimated Tips'].toFixed(0);
		dataObj[name].serviceRev = '$' + dataObj[name].serviceRev.toFixed(0);
		dataObj[name].haircareRev = '$' + dataObj[name].haircareRev.toFixed(0);
		dataObj[name].productRev = '$' + dataObj[name].productRev.toFixed(0);
		dataObj[name].totalRev = '$' + dataObj[name].totalRev.toFixed(0);
		dataObj[name].otherRetailRev = '$' + dataObj[name].otherRetailRev.toFixed(0);
		dataObj[name]['haircare Commission'] = '$' + dataObj[name]['haircare Commission'].toFixed(0);
		dataObj[name]['addon Commission'] = '$' + dataObj[name]['addon Commission'].toFixed(0);
		dataObj[name]['prepaid Commission'] = '$' + dataObj[name]['prepaid Commission'].toFixed(0);
		dataObj[name]['total Commission'] = '$' + dataObj[name]['total Commission'].toFixed(0);
		dataObj[name]['additional Hourly'] = '$' + dataObj[name]['additional Hourly'].toFixed(1);
	}
	return dataObj;
}

function productivityArray(dataString) {
	const dataArray = stringToArry.inversedTableArry(dataString);
	const length = dataArray.length; 
	const dataArrayTransposed = stringToArry.flipAxis(dataArray);
	//remove rows where each element is an empty string;
	const dataArrayCleaned = dataArrayTransposed.filter(row =>{return !row.equals([ '', '', '', '', '', '', '', '', '', '', '' ])});
	const dataArrayNormalized = downFill2dArray(dataArrayCleaned);
	return dataArrayNormalized;
}

function downFill2dArray(array) {
	for (let i = 0; i<array.length; i++) {
		if (array[i][0]==='Services Subtotal')
		{
			array[i][0] = array[i-1][0];
			array[i][1] = array[i-1][1];
			array[i][2] = array[i-1][2];
			array[i][3] = 'Services Subtotal';
		}
		else if (array[i][0]==='Products Subtotal')
		{
			array[i][0] = array[i-1][0];
			array[i][1] = array[i-1][1];
			array[i][2] = array[i-1][2];
			array[i][3] = 'Products Subtotal';	
		}
		else if (array[i][0].includes('Total for'))
		{
			array[i][0] = array[i-2][0];
			array[i][1] = array[i-2][1];
			array[i][2] = array[i-2][2];
			array[i][3] = 'Total';		
		}
		else
		{
			for (let j = 0; j<array[i].length; j++) 
			{
				if (array[i][j]===''&&i!==0) 
				{
					array[i][j] = array[i-1][j];
				}
			}
		}
	}
	return array;
}

function productivityObject(normalizedArray){
	//{Yvonne: {hours: 240, haircuts: 35, add-on: 35, haircare: 24, prepaid: 3, services total: $2443, retail total: $30, estimated tips: $243}}
	const dataObj = normalizedArray.reduce((obj, row) => {
		if (row[0] === 'Employee') {
			return obj;
		}
		const employee = obj[row[0]] = obj[row[0]] || {};

		switch(row[3]) {
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
				employee.haircareRev = +numeral(row[7]).value();
				break;
			case 'Services Subtotal':
				const serRev = employee.serviceRev = numeral(row[7]).value();
				break;
			case 'Products Subtotal':
				employee.productRev = +numeral(row[7]).value();
				break;
			case 'Total':
				employee.totalRev = +numeral(row[7]).value();
				employee.hours = +numeral(row[1]).value();
		}
		return obj;
	}, {});
	return dataObj;
}

if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});