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
		