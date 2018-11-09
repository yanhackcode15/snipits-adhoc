const getStats = require('./index');
const testNumbers = require('./getTestNumbers'); //it's a promise to return the numbers doc as a single doc
const sendOne = require('./sendOne');

const employeNames = {
	'Miriam-Stylist Hernandez': 'Miriam',
	'Yvonne-Manager Perez': 'Yvonne',
	'Sydney Ladage': 'Syndey',
	'Antonia Rodriguez': 'Toni',
	'Judith Quesada': 'Judy',
	'Hui Zhang': 'Lilian',
	'Erica-stylist Jimenez': 'Erica',
};
const fromNum = process.env.TWILIO_PHONE;

module.exports = function (fromDate, toDate) {
	return getStats(fromDate, toDate)
		.then(allStats=>{
			return testNumbers()
				.then((numberTable)=>{
					const promiseArry = [];
					for (let employee in allStats) {
						let retailRatio = +(allStats[employee]['retail Ratio']);
						let addonRatio = +(allStats[employee]['addon Ratio']);
						let messagePart1 = `Dear ${employeNames[employee]}, see your ratio report from ${fromDate} to ${toDate} below.  Retail Ratio: 1 in ${retailRatio}; Addon Ratio: 1 in ${addonRatio}. `;
						let messagePart2 = '';
						if (retailRatio <= 5.9 && addonRatio <= 5.9) {
							messagePart2 = 'You are a rockstar - nailed both ratios! Sky is the limit. 😍';
						}
						else if (retailRatio <= 5.9 ){
							messagePart2 = 'Way to move those products! 😁';
						}
						else if (addonRatio <= 5.9){
							messagePart2 = 'Kids thank you for those add-ons! 😘 Remember the commission cut off is 1 to 5.9 for product ratio.';
						}
						else if (retailRatio <= 8.9 && addonRatio <= 8.9){
							messagePart2 = 'hey keep trying. You can still catch up on ratios next week. 😎';
						}
						else {
							messagePart2 = 'You can do it, lady. Get those ratio lower and earn commission for the month. 😋';	
						}

						let messageAll = messagePart1 + messagePart2;
						let toNum = numberTable[employee];
						if (toNum) {
							promiseArry.push(sendOne(fromNum, toNum, messageAll));
						}
					}
					return Promise.all(promiseArry)
						.then(results=>{
						return true;
						});
				});
		});
}