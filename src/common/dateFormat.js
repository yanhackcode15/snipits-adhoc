'use strict';
module.exports = (portalDate) => {
	//portalDate = Mon201802-09
	if (portalDate !== "TotalHours") {
		let dayofWeek = portalDate.substring(0,3); 
		let year = portalDate.substring(3,7);
		let month = portalDate.substring(7,9);
		let day = portalDate.substring(10,12);
		//return 2018-02-09-Mon
		let newString = [year, month, day, dayofWeek].join('-');
		console.log('newstring', newString);
		return newString;
	}
	else {
		return portalDate;
	}
}