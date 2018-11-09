'use strict';
require('promise.prototype.finally').shim();
const firebase = require("firebase");
const config = {
	apiKey: process.env.FIREBASE_APIKEY,
	authDomain: process.env.FIREBASE_AUTHDOMAIN,
	databaseURL: process.env.FIREBASE_DATABASEURL,
	projectId: process.env.FIREBASE_PROJECTID,
	storageBucket: process.env.FIREBASE_STORAGEBUCKET,
	messagingSenderId: process.env.FIREBASE_SENDERID
};
firebase.initializeApp(config);



const db = firebase.database();
const ref = db.ref('/transactions');

module.exports = (fromDate, toDate) => ref
	// Order By
	.orderByChild('payment/DateValue')
	// Filter
	.startAt(dateStrToInt(fromDate))
	.endAt(dateStrToInt(toDate))
	// Fetch
	.once('value',
		(snapshot) => {
			const outputArry = [];
			snapshot.forEach((childSnapshot) => outputArry.push(childSnapshot.val()));
			console.log('snapshot', snapshot.val());
			return outputArry;
		}
	);


/**
 * Converts international date string to integer
 *
 * @param {string} dateString A date string in the form "YYYY-MM-DD"
 * @returns {integer} An integer value of YYYYMMDD
 **/
function dateStrToInt(dateString) { return +(dateString.split('-').join('')); }
