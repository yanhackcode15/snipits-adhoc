'use strict';
const cheerio = require('cheerio');

exports.tagFilter = (body, tag, negativeIndex) => {
//filter from the body string the section that matches the tag at the index position, i.e. <table> at the second to the last, return the string containing the filtered section of the html
	console.log('inside the filters.js');
	console.log('body', body);
	let $ = cheerio.load(body);
	let tables = $('body').find(tag); 
	let tableString = $.html(tables[tables.length + negativeIndex]); //the second last table is the table containing payroll information
	return tableString;

}