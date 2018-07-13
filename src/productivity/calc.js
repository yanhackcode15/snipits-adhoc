'use strict';
const numeral = require('numeral');
const stringToArry = require('../common/stringToArray');
const getCookie = require('../common/cookie');
const getPage = require('../common/pageBody');
const getProductivityContent = require('./filteredContent');
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

module.exports = (startDate, endDate)=> {
	const username = 'yan';
	const password = 'huy95';
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
		const prodObj = productivityObject(prodArry);
		return prodObj;
		// console.log(prodObj);
	});
};

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
				employee.haircareRev = +numeral(row[7]).value().toFixed(0);
				break;
			case 'Services Subtotal':
				const serRev = employee.serviceRev = numeral(row[7]).value();
				const reportedTips = numeral(serRev).value() * 0.1;
				const actualTips = numeral(serRev).value() * tip;
				employee.reportedTips = +reportedTips.toFixed(0);
				employee.actualTips = +actualTips.toFixed(0);
				break;
			case 'Products Subtotal':
				employee.productRev = +numeral(row[7]).value().toFixed(0);
				break;
			case 'Total':
				employee.totalRev = +numeral(row[7]).value().toFixed(0);
				employee.hours = +numeral(row[1]).value().toFixed(2);
		}
		return obj;
	}, {});

	for (let key in dataObj) {
		const employee = dataObj[key];
		const otherRetailRev = employee.productRev - employee.haircareRev;
		employee.otherRetailCommission = otherRetailRev >= 50
			? otherRetailRev * 0.2
			: 0;
		employee.otherRetailRev = otherRetailRev;

		const retailCount = employee.haircare || 0;
		const addonCount = employee.addons || 0;
		const retailRat = employee.haircuts / retailCount ;
		const addonRat = employee.haircuts / addonCount;
		const haircareComm = retailRat <= 3.9
			? (retailCount * 2) : (
				retailRat <= 5.9 ? retailCount * 1 : (
					retailRat <= 8.9 ? retailCount * 0.5 : 0
					));
		const addonComm = addonRat <= 5.9
			? addonCount
			: (addonRat <= 8.9 ? addonCount * 0.5 : 0);
		const prepaidComm = employee.prepaid * 5 || 0 ;

		employee.retailRatio = +retailRat.toFixed(1);
		employee.addonRatio = +addonRat.toFixed(1);
		employee.haircareCommission = +haircareComm.toFixed(1);
		employee.addonCommission = +addonComm.toFixed(1);
		employee.prepaidCommission = +prepaidComm.toFixed(0);
		employee.totalCommission = +(employee.haircareCommission + employee.addonCommission + employee.prepaidCommission);
		employee.additionalHourly = +((employee.totalCommission + employee.actualTips) / employee.hours).toFixed(1);
	}

	for (let employee in dataObj) {
		const employeeAttributes = Object.keys(dataObj[employee]);
		for (let i = 0; i<reportKeys.length; i++)
		{
			if (!employeeAttributes.includes(reportKeys[i]))
			{
				dataObj[employee][reportKeys[i]] = 0;
			}
			else if (isNaN(dataObj[employee][reportKeys[i]])) {
				dataObj[employee][reportKeys[i]] = 0;
			}	
		}
	}
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