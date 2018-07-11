'use strict';

var cheerio = require('cheerio');

exports.tagFilter = function (body, tag, negativeIndex) {
	//filter from the body string the section that matches the tag at the index position, i.e. <table> at the second to the last, return the string containing the filtered section of the html
	var $ = cheerio.load(body);
	var tables = $('body').find(tag);
	var tableString = $.html(tables[tables.length + negativeIndex]); //the second last table is the table containing payroll information
	return tableString;
};