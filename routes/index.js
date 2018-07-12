var express = require('express');
var router = express.Router();
var getStats = require('../src/index');
var getPayDatePair = require('../src/common/getStartEndDates'); //a function returning an ojbect with key fromDate and toDate; 

router.get('/', function(req, res, next){
	res.render('indexPage', {});
});

router.post('/viewHours', function(req, res, next){
	var year = parseInt(req.body.year, 10);
	var month = parseInt(req.body.month, 10);
	var pairs = getPayDatePair.startEndDates(month, year);
	res.render('monthPage', {dates: pairs});
});

router.get('/viewPay/:fromDate/:toDate', function(req, res, next) {
	var fromDate = req.params.fromDate;
	var toDate = req.params.toDate;
	getStats(fromDate, toDate)
		.then(results=>{
			res.render('recentPage', {output: results});
		});
});

router.get('/recent', function(req, res, next){
	var fromDate = getPayDatePair.recentStartEndDates().fromDate;
	var toDate = getPayDatePair.recentStartEndDates().toDate;
	getStats(fromDate, toDate)
		.then(results=>{
			res.render('recentPage', {output: results});
		}); 
});

module.exports = router;
