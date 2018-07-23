'use strict';

module.exports = (fromDate, toDate) =>{
	//return all dates as an array ['2018-06-12', '2018-06-13'...]
	let fromArr = fromDate.split('-'); //[2018, 6, 12]
	let fromYear = fromArr[0];
	let fromMonth = fromArr[1];
	let fromDay = fromArr[2];
	let fromDateObj = new Date(fromYear, fromMonth-1, fromDay);
	let toArr = toDate.split('-'); //[2018, 7, 12]
	let toYear = toArr[0];
	let toMonth = toArr[1];
	let toDay = toArr[2];
	let toDateObj = new Date(toYear, toMonth-1, toDay);
	let days = daysBetween(fromDateObj, toDateObj) + 1;
	let range = [];
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