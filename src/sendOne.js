const twilio = require('twilio');
const accountSid = 'AC1128b79f91835051d0c255ed884fa6d1'; // Your Account SID from www.twilio.com/console
const authToken = 'e6f6fe40abe97889d76aab68f58b36cc';   // Your Auth Token from www.twilio.com/console

module.exports = function(fromNum, toNum, body) { 
	const client = new twilio(accountSid, authToken);
	client.messages.create({
	    body,
	    to: `+${toNum}`,  // Text this number
	    from: `+${fromNum}`, // From a valid Twilio number
	})
	.then((message) => console.log('ageahwea',message.sid))
	.catch(err=>console.log('error', err));
}