var express = require('express');
var router = express.Router();
var x = require('../src/index');

router.get('/', function(req, res, next){
	x(p1, p2).then(results=>{
		res.render('indexPage', {output: results});
	}); 
})
module.exports = router;
