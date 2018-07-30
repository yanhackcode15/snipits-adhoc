const express = require('express');
const router = express.Router();
const getStats = require('../src/index');
const getPayDatePair = require('../src/common/getStartEndDates'); //a function returning an ojbect with key fromDate and toDate; 
const sendOne = require('../src/sendOne');
const phoneNumbers = require('../src/getPhoneNumbers'); //it's a promise to return the numbers doc as a single doc
// const phoneNumbers = require('../src/teamNumbers');

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
	const fromNum = process.env.TWILIO_PHONE;
	const promiseArry = [];
	let fromDate = getPayDatePair.recentStartEndDates().fromDate;
	let toDate = getPayDatePair.recentStartEndDates().toDate;
	const employeNames = {
		'Miriam-Stylist Hernandez': 'Miriam',
		'Yvonne-Manager Perez': 'Yvonne',
		'Sydney Ladage': 'Syndey',
		'Antonia Rodriguez': 'Toni',
		'Judith Quesada': 'Judy',
		'Hui Zhang': 'Lilian',
		'Erica-stylist Jimenez': 'Erica',
	};
	getStats(fromDate, toDate)
		.then(allStats=>{
			phoneNumbers()
				.then((numberTable)=>{
					console.log('number table', numberTable);
					for (let employee in allStats) {
						let retailRatio = +(allStats[employee]['retail Ratio']);
						let addonRatio = +(allStats[employee]['addon Ratio']);
						let messagePart1 = `Dear ${employeNames[employee]}, see your ratio report from last two weeks below.  Retail Ratio: 1 in ${retailRatio}; Addon Ratio: 1 in ${addonRatio}. `;
						let messagePart2 = '';
						if (retailRatio <= 5.9 && addonRatio <= 5.9) {
							messagePart2 = 'You are a rockstar - nailed both ratios! Sky is the limit. 😍';
						}
						else if (retailRatio <= 5.9 ){
							messagePart2 = 'Way to move those products! 😁';
						}
						else if (addonRatio <= 5.9){
							messagePart2 = 'Kids thank you for those add-ons! 😘';
						}
						else if (retailRatio <= 8.9 && addonRatio <= 8.9){
							messagePart2 = 'hey keep trying. You can still catch up on ratios next week. 😎';
						}
						else {
							messagePart2 = 'You can do it, lady. Get those ratio lower and earn commission for the month. 😋';	
						}

						let messageAll = messagePart1 + messagePart2;
						let toNum = numberTable[employee];
						console.log('toNum', toNum);
						if (toNum) {
							promiseArry.push(sendOne(fromNum, toNum, messageAll));
						}
						console.log('length', promiseArry.length);
						console.log('promise array', promiseArry);

					}
					return Promise.all(promiseArry)
						.then(results=>{
						res.send('all done');
						});
				});
		});
});

module.exports = router;
