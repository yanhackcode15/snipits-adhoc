const express = require('express');
const router = express.Router();
const getStats = require('../src/index');
const getPayDatePair = require('../src/common/getStartEndDates'); //a function returning an ojbect with key fromDate and toDate; 

router.get('/', function(req, res, next){
	res.render('indexPage', {});
});

router.post('/viewHours', function(req, res, next){
	let year = parseInt(req.body.year, 10);
	let month = parseInt(req.body.month, 10);
	let pairs = getPayDatePair.startEndDates(month, year);
	res.render('monthPage', {dates: pairs});
});

router.get('/viewPay/:fromDate/:toDate', function(req, res, next) {
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	getStats(fromDate, toDate)
		.then(results=>{
			res.render('recentPage', {output: results});
		});
});

router.get('/recent', function(req, res, next){
	let fromDate = getPayDatePair.recentStartEndDates().fromDate;
	let toDate = getPayDatePair.recentStartEndDates().toDate;
	getStats(fromDate, toDate)
		.then(results=>{
			res.render('recentPage', {output: results});
		}); 
});

module.exports = router;
