'use strict';
module.exports = (endDate) => {
	let endDateFormated = new Date(endDate);
	let thisDate = new Date();
	let endDateAdjusted = endDate;
	if (endDateFormated > thisDate||(endDateFormated.getFullYear()===thisDate.getFullYear() && endDateFormated.getMonth()===thisDate.getMonth() && endDateFormated.getDate()===thisDate.getDate())) 
	{
		let yesterday = new Date(thisDate.getTime() - 24*3600*1000);
		endDateAdjusted = yesterday.getFullYear() + '-' + (yesterday.getMonth() + 1) + '-' + yesterday.getDate();
	}
	return endDateAdjusted;
}
