'use strict';
const hoursCalc = require('./hours/calc');
const productivityCalc = require('./productivity/calc');

module.exports = function (fromDate, toDate) {
	return Promise.all([hoursCalc(fromDate, toDate), productivityCalc(fromDate, toDate)])
		.then(results=>{
			let hoursResult = results[0];
			let productivityResult = results[1];
			let allStats = {};
			for (let key in hoursResult) {
				allStats[key] = Object.assign(hoursResult[key], productivityResult[key]);
			}
			console.log("all stats",allStats);
			return allStats;
		})
	}
