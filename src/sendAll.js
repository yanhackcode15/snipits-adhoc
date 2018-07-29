const send = require('test');
const records = require('teamrecords');
const fromNum = '14245328717';
const messageTemplate = `Dear ${name}, your ratio from last week is: .`;


const promiseArry = records.map(record=>{
	return send(fromNum, record.number, combinedRecords.body);
});
Promise.all(promiseArry)
	.then()