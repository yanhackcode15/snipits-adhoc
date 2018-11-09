'use strict';
const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');

exports.inversedTableArry = (contentString) =>{
    const $ = cheerio.load(contentString);
    cheerioTableparser($);
    let tableArry = $('table').parsetable(false, false, true); //return array using col
	return tableArry; 
};

exports.removeCol = (arry, colRemovedArray) => {
	const out = [...arry];
	colRemovedArray.map((i) => i < 0 ? arry.length + i : i)
		.sort((a, b) => a - b)
		.forEach((i, count) => out.splice(i - count, 1));
	return out;
	// let indexArry = []; //containing all positive indexes after the for loop
	// let newArry = [];
	// for (let i = 0; i<colRemovedArray.length; i++) {
	// 	if (colRemovedArray[i] < 0) {
	// 		//remove from left (top);
	// 		indexArry[i] = arry.length + colRemovedArray[i];
	// 	}
	// 	else {
	// 		indexArry[i] = colRemovedArray[i];
	// 	}
	// }
	// arry.filter((elem, i) =>{
	// 	if(!indexArry.includes(i)) {
	// 		newArry.push(elem);
	// 	}
	// });
	// return newArry;
};

exports.flipAxis = (tableArry) => {
	//convert a 2-D table-like array into an array of objects along the Y axis, the first element of every inner array is the property name of the object.
    var arry = [];
    for (var i = 0; i < tableArry.length; i++) {
        for (var j = 0; j < tableArry[i].length; j++) {
            arry[j] = arry[j] || [];
            arry[j].push(tableArry[i][j]);
        }
    }
    return arry;
};