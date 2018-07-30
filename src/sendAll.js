const getStats = require('./index');
const sendOne = require('./sendOne');
const phoneNumbers = require('./teamNumbers');
const fromNum = process.env.TWILIO_PHONE;

const promiseArry = [];
getStats('2018-07-02', '2018-07-15')
	.then(allStats=>{
		for (let employee in allStats) {
			let retailRatio = allStats[employee]. ;
			let addonRatio = allStats[employee]. ;
			let messageTemplate = `Dear ${employee}, see your ratio report from last week below.  Retail Ratio: 1 in ${retailRatio}; Addon Ratio: 1 in ${addonRatio}`;
			let toNum = phoneNumbers[employee];
			if (toNum) {
				promiseArry.push(sendOne(fromNum, toNum, messageTemplate));
			}
		}

	});
Promise.all(promiseArry)
	.then(results=>{
		console.log('all done');
	});


