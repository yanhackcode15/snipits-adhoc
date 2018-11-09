const getStats = require('./index');
const phoneNumbers = require('./getPhoneNumbers'); //it's a promise to return the numbers doc as a single doc
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
			return phoneNumbers()
				.then((numberTable)=>{
					const promiseArry = [];
					for (let employee in allStats) {
						let retailRatio = +(allStats[employee]['retail Ratio']);
						let addonRatio = +(allStats[employee]['addon Ratio']);
						let messagePart1 = `Dear ${employeNames[employee]}, see your ratio report from ${fromDate} to ${toDate} below.  Retail Ratio: 1 in ${retailRatio}; Addon Ratio: 1 in ${addonRatio}. `;
						let messagePart2 = '';
						if (retailRatio <= 3.9 && addonRatio <= 5.9) {
							messagePart2 = 'You are a rockstar - Both ratios were fantastic! Your earn 15% bonus on your haircare sales and $1 per addon. 😍';
						}
						else if (retailRatio <= 3.9 && addonRatio <= 8.9) {
							messagePart2 = `You are a rockstar - nailed your retail down. You qualified for 15% of retail sales! Your addon didn't meet 1 in 5.9. You earned $0.5 per addon. Get your addon ratio below 1 in 5.9 to earn higher bonus 😍`;	
						}
						else if (retailRatio <= 5.9 && addonRatio <= 5.9){
							messagePart2 = 'Way to move those products and addons! you earned retail bonus 10% of haircare sales and $1 per addon 😁. You can earn up to 15% retail if you can meet 1 in 3.9';
						}
						else if (addonRatio <= 5.9){
							messagePart2 = 'Kids thank you for those add-ons! 😘 Sorry your retail did not meet the 1 in 5.9 cut off';
						}
						else if (retailRatio <= 3.9) {
							messagePart2 = `You are a rockstar - nailed your retail down. You qualified for 15% of retail sales! Bummer your addon didn't meet 1 in 8.9 cutoff to earn bonus. 😍`;
						}
						else if (retailRatio <= 5.9) {
							messagePart2 = `You are a rockstar - nailed your retail. You qualified for 10% of retail sales! Bummer your addon didn't meet 1 in 8.9 cutoff to earn bonus. 😍`;
						}
						else {
							messagePart2 = 'bummer. your ratios did not meet either retail and addon cut off. Remember you earn bonus on retail when meeting 1 in 5.9 and addon 1 in 8.9. Catch up next week. 😎';
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