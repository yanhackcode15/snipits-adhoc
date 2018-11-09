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

ref.once('value', snapshot=>{
	snapshot.forEach(childSnapShot=>{
		let dateString = childSnapShot.val().payment.DateValue;
		let dateObj = new Date(dateString);
		let dateSortVal = dateObj.getTime();
		childSnapShot.getRef().child('payment').update({
			test1: 'wgrwhrw'
		});
	});
});
		