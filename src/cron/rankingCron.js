const getRankings = require('../others/ranking');
module.exports = ()=>{
	let thisDate = new Date();
	let year = thisDate.getFullYear();
	let month = thisDate.getMonth() + 1;
	let date = thisDate.getDate();

	let fromDate = year + '-' + month + '-' + date;
	let toDate = fromDate;
	getRankings(fromDate, toDate)
		.then(results=>{
			console.log('getRankings result', results);
		})
		.catch(err=>{
			console.error('get rankings error', err.message);
		});
}