'use strict';

module.exports = (fromDate, toDate) =>{
	//return all dates as an array ['2018-06-12', '2018-06-13'...]
	var fromArr = fromDate.split('-'); //[2018, 6, 12]
	var fromYear = fromArr[0];
	var fromMonth = fromArr[1];
	var fromDay = fromArr[2];
	var fromDateObj = new Date(fromYear, fromMonth-1, fromDay);
	var toArr = toDate.split('-'); //[2018, 7, 12]
	var toYear = toArr[0];
	var toMonth = toArr[1];
	var toDay = toArr[2];
	var toDateObj = new Date(toYear, toMonth-1, toDay);
	var days = daysBetween(fromDateObj, toDateObj) + 1;
	var range = [];
	for (let i = 0; i < days; i++) {
		let thisDay = new Date(fromYear, fromMonth-1, fromDay-0+i);
		range.push(thisDay);
	}
	return range.map(dayObj=>dayObj.toISOString().substring(0,10));
	//return [yyyy-mm-dd...]
}

function daysBetween(day1, day2) { //return days bewteen day 1 and day 2 including day 2 but excluding day 1, day 1 and day 1 are dates objects
	return Math.floor((day2 - day1)/(1000 * 3600 * 24));
}