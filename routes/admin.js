const express = require('express');
const router = express.Router();
const getStats = require('../src/index');
const removeRanking = require('../src/others/removeRanking');
const removeHour = require('../src/others/removeHour');
const removeProductivity = require('../src/others/removeProductivity');
const getPayDatePair = require('../src/common/getStartEndDates'); //a function returning an ojbect with key fromDate and toDate; 
const sendAll = require('../src/sendAll');
const sendTest = require('../src/sendTest');
const getRankings = require('../src/others/ranking');
const getSales = require('../src/sales/sales');
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

router.get('/', function(req, res, next){
	res.render('indexPageAdmin', {});
});

router.post('/viewHours', function(req, res, next){
	let year = parseInt(req.body.year, 10);
	let month = parseInt(req.body.month, 10);
	let pairs = getPayDatePair.startEndDates(month, year);
	res.render('monthPageAdmin', {dates: pairs});
});

router.get('/viewPay/:fromDate/:toDate', function(req, res, next) {
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	getStats(fromDate, toDate)
		.then(results=>{
			res.render('recentPageAdmin', {output: results});
		});
});

router.get('/recent', function(req, res, next){
	let fromDate = getPayDatePair.recentStartEndDates().fromDate;
	let toDate = getPayDatePair.recentStartEndDates().toDate;
	getStats(fromDate, toDate)
		.then(results=>{
			res.render('recentPageAdmin', {output: results});
		}); 
});
router.get('/sendAlerts', function(req, res, next){
	let fromDate = getPayDatePair.recentStartEndDates().fromDate;
	let toDate = getPayDatePair.recentStartEndDates().toDate;
	sendAll(fromDate, toDate)
		.then(result=>{
			res.send('all done');
		});
});

router.get('/monthlyCommissionAlerts/:fromDate/:toDate', function(req, res, next){
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	sendAll(fromDate, toDate)
		.then(result=>{
			res.send('all done');
		});
});

router.get('/TestCommissionAlerts/:fromDate/:toDate', function(req, res, next){
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	sendTest(fromDate, toDate)
		.then(result=>{
			res.send('all done');
		});
});


router.get('/testRankings', function(req, res, next){
	let fromDate = '2018-08-07';
	let toDate = '2018-08-07';
	getRankings(fromDate, toDate)
		.then(result=>{
			res.send('all done');
		})
		.catch(err=>{
			console.error('get rankings error', err.message);
			res.send('error getting rankings data');
		});
});

router.get('/getRanking', function(req, res, next){
	res.render('rankPage', {});
});

router.post('/viewRanks', function(req, res, next){
	let year = parseInt(req.body.year, 10);
	let month = parseInt(req.body.month, 10);
	let days = daysInMonth[month-1];
	
	let fromDate = year + '-' + req.body.month + '-' + '01';
	let	toDate = year + '-' + req.body.month + '-' + days;
	// let fromDate = '2018-08-19';
	// let toDate = '2018-08-21';
	getRankings(fromDate, toDate)
		.then(results=>{
			res.render('monthPageRanksAdmin', {output: results});
		})
		.catch(err=>{
			console.error('get rankings error', err.message);
			res.send('error getting rankings data');
		});
});

router.get('/removeRanking/:fromDate/:toDate', function(req, res, next){
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	removeRanking(fromDate, toDate)
		.then(result=>{
			res.send('removed');
		});
});

router.get('/removeHour/:fromDate/:toDate', function(req, res, next){
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	removeHour(fromDate, toDate)
		.then(result=>{
			res.send('removed');
		});
});

router.get('/removeProductivity/:fromDate/:toDate', function(req, res, next){
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	removeProductivity(fromDate, toDate)
		.then(result=>{
			res.send('removed');
		});
});

router.get('/salesDetail/:fromDate/:toDate', function(req, res, next){
	let fromDate = req.params.fromDate;
	let toDate = req.params.toDate;
	getSales(fromDate, toDate)
		.then(result=>{
			if (!result) {
				res.send(result);	
			} 
			else {
				res.render('salesDetailPageAdmin', {output: result.toJSON()});
			}
		});
});

router.post('/viewSales', function(req, res, next){
	let year = req.body.yearMonth.split('-')[0];
	let month = req.body.yearMonth.split('-')[1];
	console.log('year', year, 'month', month);
	let fromDate = year + '-' + month + '-' + '01';
	let toDate = year + '-' + month + '-' + '31';
	getSales(fromDate, toDate)
		.then(result=>{
			res.render('salesDetailPageAdmin', {output: result.toJSON()});
		});
});

module.exports = router;
