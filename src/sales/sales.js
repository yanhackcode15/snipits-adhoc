'use strict';
require('promise.prototype.finally').shim();
const firebase = require("firebase");
var config = {
	apiKey: "AIzaSyDhCdLyt5M_AIx4s-z8SyEPrxyHSqtCm38",
	authDomain: "snipits-sign-in.firebaseapp.com",
	databaseURL: "https://snipits-sign-in.firebaseio.com",
	projectId: "snipits-sign-in",
	storageBucket: "snipits-sign-in.appspot.com",
	messagingSenderId: "129088095571"
};
firebase.initializeApp(config);

const db = firebase.database();
const ref = db.ref('/transactions');

// module.exports = (fromDate, toDate)=>{
// 	//convert from and to date to 'YYYYMMDD' from 'YYYY-MM-DD'
// 	let startDateArry = fromDate.split('-');
// 	let startDate = +('' + startDateArry[0] + startDateArry[1] + startDateArry[2]);
// 	let endDateArry = toDate.split('-');
// 	let endDate = +('' + endDateArry[0] + endDateArry[1] + endDateArry[2]);
// 	var tranx = [];
// 	let orderedRef = ref.orderByChild('payment/DateValue')
// 		.startAt(startDate)
// 		.endAt(endDate);
// 	return orderedRef.once('value',
// 		snapshot=>{
// 			snapshot.forEach(childSnapShot=>{
// 				tranx.push(childSnapShot.val());
// 			});
// 			return tranx;
// 		});
// }


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
