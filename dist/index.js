'use strict';

var hoursCalc = require('./hours/calc');
var productivityCalc = require('./productivity/calc');

var hoursStats = hoursCalc();
var productivityStats = productivityCalc();

Promise.all([hoursStats, productivityStats]).then(function (results) {
	var hoursResult = results[0];
	var productivityResult = results[1];
	var allStats = {};
	for (var key in hoursResult) {
		allStats[key] = Object.assign(hoursResult[key], productivityResult[key]);
	}
	console.log(allStats);
});

console.log('merge2');