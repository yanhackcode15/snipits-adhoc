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

firebase.database().ref('/transactions').remove(function(err){
	if (!err) {
		console.log('all removed and no error');
		firebase.app().delete().then(()=>console.log('fire app deleted'));
	}
	else {
		console.log('error is:', err);
		firebase.app().delete().then(()=>console.log('fire app deleted'));
	}
});