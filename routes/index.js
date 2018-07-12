var express = require('express');
var router = express.Router();
var getStats = require('../src/index');
var getLastPayDatePair = require('../src/common/getRecent'); //a function returning an ojbect with key fromDate and toDate; 

router.get('/', function(req, res, next){
	res.render('indexPage', {});
});

router.get('/recent', function(req, res, next){
	var fromDate = getLastPayDatePair().fromDate;
	var toDate = getLastPayDatePair().toDate;
	getStats(fromDate, toDate)
		.then(results=>{
			res.render('recentPage', {output: results});
		}); 
});

module.exports = router;
