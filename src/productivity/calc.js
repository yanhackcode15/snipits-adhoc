'use strict';
const numeral = require('numeral');
const stringToArry = require('../common/stringToArray');
const getCookie = require('../common/cookie');
const getPage = require('../common/pageBody');
const getProductivityContent = require('./filteredContent');
const dateFormated = require('../common/dateFormat');
const dateRange = require('../common/dateRange');
const Collection = require('../../models/collection');
const endDateOrYesterday = require('../common/endDateOrYesterday');

const tip = 0.178;
const reportKeys = [
	'haircuts', 
	'addons', 
	'haircare',
	'prepaid',
	'serviceRev',
	'haircutsRev',
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
const fieldMap = {
	// name: (val) => val,
	// date: (val) => val,
	haircuts: (data = {}) => Number(data.haircuts) || 0,
	addons: (data = {}) => Number(data.addons) || 0,
	haircare: (data = {}) => Number(data.haircare) || 0,
	prepaid: (data = {}) => Number(data.prepaid) || 0,
	partiesAttendees: (data = {}) => Number(data.partiesAttendees) || 0,
	serviceRev: (data = {}) => Number(data.serviceRev) || 0,
	haircutsRev: (data = {}) => Number(data.haircutsRev) || 0,
	haircareRev: (data = {}) => Number(data.haircareRev) || 0,
	otherRetailRev: (data = {}) => Number(data.otherRetailRev) || 0,
	productRev: (data = {}) => Number(data.productRev) || 0,
	totalRev: (data = {}) => Number(data.totalRev) || 0,
	retailRatio: (data = {}) => Number(data.retailRatio) || 0,
	addonRatio: (data = {}) => Number(data.addonRatio) || 0,
	haircareCommission: (data = {}) => Number(data.haircareCommission) || 0,
	addonCommission: (data = {}) => Number(data.addonCommission) || 0,
	prepaidCommission: (data = {}) => Number(data.prepaidCommission) || 0,
	otherRetailCommission: (data = {}) => Number(data.otherRetailCommission) || 0,
	totalCommission: (data = {}) => Number(data.totalCommission) || 0,
	hours: (data = {}) => Number(data.hours) || 0,
	reportedTips: (data = {}) => Number(data.reportedTips) || 0,
	actualTips: (data = {}) => Number(data.actualTips) || 0,
	additionalHourly: (data = {}) => Number(data.additionalHourly) || 0,
	addonRev: (data = {}) => Number(data.addonRev) || 0,
	partyRev: (data = {}) => Number(data.partyRev) || 0,
	prepaidRev: (data = {}) => Number(data.prepaidRev) || 0,
};
const fields = Object.keys(fieldMap);

module.exports = (startDate, endDate) => {
	let endDateAdjusted = endDateOrYesterday(endDate);
	let dates = dateRange(startDate, endDateAdjusted); 
	let results = [];
	for (let i = 0; i < dates.length; i++) {
		let singleDay = dates[i];
		let findPromise = Collection.Productivity.find({date: singleDay})
			.exec()
			.then(docs=>{
				if (docs.length === 0) {
					return fetchPortal(singleDay, singleDay)
						.then(dataArry=>{
							dataArry.forEach(element=>saveToDB(element));
							return dataArry;
						});
				}
				else {
					return docs; 
				}
			})
			.catch(err=>{
				console.error("error finding data in cache");
				return null;
			});
		results.push(findPromise);
	}

	return Promise.all(results)
		.then(dataArry=>{
			console.log('egewrhrwh', dataArry);
			if (dataArry.find(element=>element===null) === null) {
				console.error('something went wrong');
			}
			else {
				let perDayPerStylistArry = [];
				dataArry.forEach(element=>{element.forEach(ele=>perDayPerStylistArry.push(ele))});
				let viewReadyObj = prepareForView(perDayPerStylistArry, dates);
				console.log('ViewwwwwReadddy', viewReadyObj);
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

	return getCookie(username, password, 'http://portal.snipits.com/login.cfm')
	.then(cookie => getPage(cookie, 'http://portal.snipits.com/runreport.cfm?name=Productivity', formData))
	.then(productivityPg => getProductivityContent(productivityPg))
	.then(productivityTbl => {
		let prodArry = productivityArray(productivityTbl);
		let prodObj = productivityObject(prodArry);
		let newProdArry = [];
		// for (let name in prodObj) {
		// 	let data = prodObj[name];
		// 	newProdArry.push({
		// 		name,
		// 		date: fromDate,
		// 		hours: Number(data.hours) || 0,
		// 		haircuts: Number(data.haircuts) || 0,
		// 		addons: Number(data.addons) || 0,
		// 		haircare: Number(data.haircare) || 0,
		// 		prepaid: Number(data.prepaid) || 0,
		// 		partiesAttendees: Number(data.partiesAttendees) || 0,
		// 		serviceRev: Number(data.serviceRev) || 0,
		// 		haircutsRev: Number(data.haircutsRev) || 0,
		// 		addonRev: Number(data.addonRev) || 0,
		// 		prepaidRev: Number(data.prepaidRev) || 0,
		// 		partyRev: Number(data.partyRev) || 0,
		// 		haircareRev: Number(data.haircareRev) || 0,
		// 		otherRetailRev: Number(data.otherRetailRev) || 0,
		// 		productRev: Number(data.productRev) || 0,
		// 		totalRev: Number(data.totalRev) || 0,
		// 	});
		// }
		newProdArry = Object.keys(prodObj).map((name) => {
			const stylist = prodObj[name];
			return fields.reduce((data, field) => {
				data[field] = fieldMap[field](stylist);
				return data;
			}, {
				name,
				date: fromDate,
			});
		});

		if(newProdArry.length === 0) {
			newProdArry = [
				fields.reduce((data, field) => {
					data[field] = fieldMap[field]();
					return data;
				}, {
					name: 'Yan-Owner Hu',
					date: fromDate,
				})
			];
			// newProdArry.push({
			// 	name: 'Yan-Owner Hu',
			// 	date: fromDate,
			// 	hours: 0,
			// 	haircuts: 0,
			// 	addons: 0,
			// 	haircare: 0,
			// 	prepaid: 0,
			// 	partiesAttendees: 0,
			// 	serviceRev: 0,
			// 	haircutsRev: 0,
			// 	addonRev: 0,
			// 	prepaidRev: 0,
			// 	partyRev: 0,
			// 	haircareRev: 0,
			// 	otherRetailRev: 0,
			// 	productRev: 0,
			// 	totalRev: 0,
			// });	
		}
		return newProdArry;
	});
};
function saveToDB (singleDocument) {
	let newProd = new Collection.Productivity();
	// newProd.date = singleDocument.date;
	// newProd.name = singleDocument.name;
	// newProd.hours = singleDocument.hours;
	// newProd.haircuts = singleDocument.haircuts;
	// newProd.addons = singleDocument.addons; 
	// newProd.haircare = singleDocument.haircare;
	// newProd.prepaid = singleDocument.prepaid;
	// newProd.partiesAttendees = singleDocument.partiesAttendees;
	// newProd.serviceRev = singleDocument.serviceRev;
	// newProd.haircutsRev = singleDocument.haircutsRev;
	// newProd.haircareRev = singleDocument.haircareRev;
	// newProd.addonRev = singleDocument.addonRev;
	// newProd.partyRev = singleDocument.partyRev;
	// newProd.prepaidRev = singleDocument.prepaidRev;
	// newProd.otherRetailRev = singleDocument.otherRetailRev;
	// newProd.productRev = singleDocument.productRev;
	// newProd.totalRev = singleDocument.totalRev;
	const exclusions = [
		'retailRatio',
		'addonRatio',
		'haircareCommission',
		'addonCommission',
		'prepaidCommission',
		'otherRetailCommission',
		'totalCommission',
		'reportedTips',
		'actualTips',
		'additionalHourly',
	];
	Object.keys(singleDocument).forEach((key) => exclusions.indexOf(key) === -1 && (newProd[key] = singleDocument[key]));

	newProd.save(function(err, data){
		if (err) {
			console.error('error saving document');
		}
	});
}

function prepareForView(dataArry, headerRow) {
	//dataArry is in [{name, date, dayOfWeek, hours}]
	//return {name: {YYYY-MM-DD-MON: 7}, name:{...}}

	console.log('input data array', dataArry);
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
		partiesAttendees: 0,
		serviceRev: 0,
		haircutsRev: 0,
		haircareRev: 0,
		addonRev: 0,
		partyRev: 0,
		prepaidRev: 0,
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

		// console.log('dafhaerejej',dataObj);
		dataObj[nameKey].haircuts += +dataArry[i].haircuts || 0;
		dataObj[nameKey].addons += +dataArry[i].addons || 0;
		dataObj[nameKey].haircare += +dataArry[i].haircare || 0;
		dataObj[nameKey].prepaid += +dataArry[i].prepaid || 0;
		dataObj[nameKey].partiesAttendees += +dataArry[i].partiesAttendees || 0;
		dataObj[nameKey].serviceRev += +dataArry[i].serviceRev || 0;
		dataObj[nameKey].haircutsRev += +dataArry[i].haircutsRev || 0;
		dataObj[nameKey].addonRev += +dataArry[i].addonRev || 0;
		dataObj[nameKey].partyRev += +dataArry[i].partyRev || 0;
		dataObj[nameKey].prepaidRev += +dataArry[i].prepaidRev || 0;
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
		dataObj[name]['estimated Tips'] = (dataObj[name].serviceRev - dataObj[name].partyRev) * tip;
		dataObj[name].otherRetailRev = dataObj[name].productRev - dataObj[name].haircareRev;
		dataObj[name]['haircare Commission'] = dataObj[name]['retail Ratio'] <= 3.9
			? (dataObj[name].haircareRev * 0.15) : (
				dataObj[name]['retail Ratio'] <= 5.9 ? dataObj[name].haircareRev * 0.1 : 0);
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
		dataObj[name].haircutsRev = '$' + dataObj[name].haircutsRev.toFixed(0);
		dataObj[name].addonRev = '$' + dataObj[name].addonRev.toFixed(0);
		dataObj[name].partyRev = '$' + dataObj[name].partyRev.toFixed(0);
		dataObj[name].prepaidRev = '$' + dataObj[name].prepaidRev.toFixed(0);
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
				employee.haircutsRev = +numeral(row[7]).value();
				break;
			case 'Add On':
				employee.addons = numeral(row[5]).value();
				employee.addonRev = +numeral(row[7]).value();
				break;
			case 'Prepaid Items':
				employee.prepaid = numeral(row[5]).value();
				employee.prepaidRev = +numeral(row[7]).value();
				break;
			case 'Hair Care':
				employee.haircare = numeral(row[5]).value();
				employee.haircareRev = +numeral(row[7]).value();
				break;
			case 'Birthday Parties':
				employee.partiesAttendees = numeral(row[5]).value();
				employee.partyRev = +numeral(row[7]).value();
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