const mongoose = require('mongoose');
//Set up default mongoose connection
const mongoDB = `mongodb://${process.env.MONGO_ID}:${process.env.MONGO_PASSWORD}@ds141621.mlab.com:41621/snipits`;
mongoose.connect(mongoDB);
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
	serviceRev: String,
	haircareRev: String,
	otherRetailRev: String,
	productRev: String,
	totalRev: String,
	reportedTips: String, 
	actualTips: String,
});

exports.Productivity = mongoose.model('Productivity', prodSchema);
exports.Hour = mongoose.model('Hour', hourSchema);
