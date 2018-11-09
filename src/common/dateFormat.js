'use strict';
module.exports = (portalDate) => {
	//portalDate = Mon201802-09
	if (portalDate !== "TotalHours") {
		const year = portalDate.substring(3,7);
		const month = portalDate.substring(7,9);
		const day = portalDate.substring(10,12);
		//return 2018-02-09
		const newString = [year, month, day].join('-');
		return newString;
	}
	else {
		return portalDate;
	}
}