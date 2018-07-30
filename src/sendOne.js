const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNTSID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTHTOKEN;   // Your Auth Token from www.twilio.com/console

module.exports = function(fromNum, toNum, body) { 
	const client = new twilio(accountSid, authToken);
	return client.messages.create({
	    body,
	    to: `+${toNum}`,  // Text this number
	    from: `+${fromNum}`, // From a valid Twilio number
	})
	.then((message) => console.log('ageahwea',message.sid))
	.catch(err=>console.log('error', err));
}