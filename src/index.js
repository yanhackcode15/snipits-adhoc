'use strict';
const hoursCalc = require('./hours/calc');
const productivityCalc = require('./productivity/calc');

module.exports = (fromDate, toDate) => {
	return Promise.all([hoursCalc(fromDate, toDate), productivityCalc(fromDate, toDate)])
		.then(dataArry=>{
			var hoursData = dataArry[0];
			var prodData = dataArry[1];
			let allStats = {};
			for (let key in hoursData) {
				allStats[key] = Object.assign(hoursData[key], prodData[key]);
			}
			// console.log(allStats);
			return allStats;
		});
}