const mongoose = require('mongoose');
//Set up default mongoose connection
const mongoDB = `mongodb://${process.env.MONGO_ID}:${process.env.MONGO_PASSWORD}@ds141621.mlab.com:41621/snipits`;

var options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};

mongoose.connect(mongoDB, options);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
const db = mongoose.connection;
//code review comments addressed

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const Schema = mongoose.Schema;
const hourSchema = new Schema({
	date: String,
	name: String, 
	hours: String, 
});

const prodSchema = new Schema({
	date: String,
	name: String, 
	hours: String, 
	haircuts: String, 
	addons: String, 
	haircare: String,
	prepaid: String,
	partiesAttendees: String,
	serviceRev: String,
	haircutsRev: String,
	haircareRev: String,
	addonRev: String,
	partyRev: String,
	prepaidRev: String,
	otherRetailRev: String,
	productRev: String,
	totalRev: String,
	reportedTips: String, 
	actualTips: String,
});

const phoneNumbersSchema = new Schema ({
	'Yvonne-Manager Perez': String,
	'Sydney Ladage': String,
	'Antonia Rodriguez':  String,
	'Judith Quesada': String,
	'Miriam-Stylist Hernandez': String,
	'Erica-stylist Jimenez': String,
	'Hui Zhang': String,
});

const storeRankingSchema = new Schema ({
	storeName: String,
	date: String,
	haircutCount: String,
	rank: String,
});

exports.Productivity = mongoose.model('Productivity', prodSchema);
exports.Hour = mongoose.model('Hour', hourSchema);
exports.PhoneNumber = mongoose.model('PhoneNumber', phoneNumbersSchema);
exports.TestNumber = mongoose.model('TestNumber', phoneNumbersSchema);
exports.StoreRanking = mongoose.model('StoreRanking', storeRankingSchema);

