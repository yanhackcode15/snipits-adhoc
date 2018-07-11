'use strict';
const hoursCalc = require('./hours/calc');
const productivityCalc = require('./productivity/calc');

let hoursStats = hoursCalc();
let productivityStats = productivityCalc();

Promise.all([hoursStats, productivityStats])
	.then(results=>{
		let hoursResult = results[0];
		let productivityResult = results[1];
		let allStats = {};
		for (let key in hoursResult) {
			allStats[key] = Object.assign(hoursResult[key], productivityResult[key]);
		}
		console.log(allStats);
		return allStats;
	})
