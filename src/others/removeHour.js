'use strict';
const dateRange = require('../common/dateRange');
const Collection = require('../../models/collection');

module.exports = (startDate, endDate) => {
	let dates = dateRange(startDate, endDate); 
	let results = [];
	for (let i = 0; i < dates.length; i++) {
		let singleDay = dates[i];
		let findPromise = Collection.Hour.find({date: singleDay})
			.exec(function(err, docs){
				if (err) {
					console.error("error finding data in cache");
					return null;
				}
				else if (docs.length === 0) {
					console.error("no record found and nothing to remove");
				}
				else {
					console.log('about to remove data');
					docs.forEach(doc=>doc.remove()); 
					console.log('docs removed');
				}
			});
		results.push(findPromise);
	}
	return Promise.all(results)
		.then(dataArry=>{
			if (dataArry.find(element=>element===null) === null) {
				console.error('something went wrong');
			}
			else {
				return null;
			}

			//el segundo, avon, 
		});
}