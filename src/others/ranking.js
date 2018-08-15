'use strict';
const numeral = require('numeral');
const stringToArry = require('../common/stringToArray');
const getCookie = require('../common/cookie');
const getPage = require('../common/pageBody');
const getRankingsContent = require('./filteredContent');
const dateFormated = require('../common/dateFormat');
const dateRange = require('../common/dateRange');
const Collection = require('../../models/collection');

module.exports = (startDate, endDate) => {
	let dates = dateRange(startDate, endDate); 
	let results = [];
	console.log(dates);
	for (let i = 0; i < dates.length; i++) {
		let singleDay = dates[i];
		let findPromise = Collection.StoreRanking
			.find({date: singleDay})
			.exec()
			.then((docs)=>{
				if (!docs || docs.length === 0) {
					return fetchPortal(singleDay, singleDay)
						.then(dataArry=>{
							console.log('no data in cache but gone fishing');
							dataArry.forEach(element=>saveToDB(element));
							console.log('dataarry length', dataArry.length)
							return dataArry;
						})
						.catch(err => {
							console.error('error fetch portal', err.message);
							return Promise.reject(err);
						});
				}
				console.log('found in cache');
				return docs; 
			});
		results.push(findPromise);

	}
	console.log('results', results);

	return Promise.all(results)
		.then(dataArry=>{
			if (dataArry.find(element=>element===null) === null) {
				console.error('something went wrong');
			}
			else {
				console.log('data array', dataArry);
				let perDayPerStoreArry = [];
				dataArry.forEach(perDay=>{perDay.forEach(perStore=>perDayPerStoreArry.push(perStore))});
				let headerRow = ['El Segundo, CA', 'Avon, OH'];
				let viewReadyObj = prepareForView(perDayPerStoreArry, headerRow);
				console.log('object',viewReadyObj);
				return viewReadyObj;
			}

			//el segundo, avon, 
		})
		.catch(err=>{
			// return err;
			console.error('eror in promise all', err.message);
			return Promise.reject(err);
		});
}

function fetchPortal(startDate, endDate){
	const username = process.env.PORTAL_ID;
	const password = process.env.PORTAL_PASSWORD;
	const ciphers = 'DES-CBC3-SHA';
	
	const formData = {
		criteria: 'Total Haircut Customers',
		prod_desc: '',
		range_type:'Custom',
		from_date: startDate,
		to_date: endDate,
		output_as: 'html',
		run: 'Run',
	};

	return getCookie(username, password, 'https://portal.snipits.com/login.cfm', ciphers)
	.then(cookie => {
		console.log('yanyanyan');
		return getPage(cookie, 'http://portal.snipits.com/runreport.cfm?name=Rankings', formData, ciphers);
	})
	.then(rankingsPg => {
		console.log('aegwhwgweh');
		return getRankingsContent(rankingsPg);
	})
	.then(rankingsTbl => {
		console.log('getting rankingsTbl');
		let rankingArry = rankArry(rankingsTbl);
		let newRankingArry = [];
		for (let i = 0; i < rankingArry.length; i++) {
			newRankingArry[i] = {};
			newRankingArry[i].date = startDate;
			newRankingArry[i].rank = rankingArry[i][0];
			newRankingArry[i].storeName = rankingArry[i][1];
			newRankingArry[i].haircutCount = rankingArry[i][2];
		}
		console.log('ranking arryay length', newRankingArry.length);
		return newRankingArry;
	})
	.catch(err => {
		console.error('error fetching', err.message);
		return Promise.reject(err);
		// return err; 
	});
}

function saveToDB (singleDocument) {
	let newStoreRank = new Collection.StoreRanking();
	newStoreRank.date = singleDocument.date;
	newStoreRank.rank = singleDocument.rank;
	newStoreRank.storeName = singleDocument.storeName;
	newStoreRank.haircutCount = singleDocument.haircutCount;

	newStoreRank.save(function(err, data){
		if (err) {
			console.error('error saving document');
		}
	});
}

function prepareForView(dataArry, headerRow) {
	//dataArry is in [{storeName, date, rank, haircutCount}]
	//return {YYYY-MM-DD: {Avon: 7}, YYYY-MM-DD:{...}}
	//only show Avon and El Segundo
	let dataObj = {};
	for (let i = 0; i < dataArry.length; i++) {
		if (headerRow.includes(dataArry[i].storeName)) {
			if (!dataObj[dataArry[i].date]) {
				dataObj[dataArry[i].date] = {};
			}
			dataObj[dataArry[i].date][dataArry[i].storeName] = dataArry[i].haircutCount;
		}
	}
	return dataObj;
}

function rankArry(dataString) {
	let dataArray = stringToArry.inversedTableArry(dataString);
	dataArray = stringToArry.removeCol(dataArray, [3, 4, 5]);
	let dataArrayTransposed = stringToArry.flipAxis(dataArray);
	dataArrayTransposed.shift();
	//remove rows where each element is an empty string;
	let dataArrayCleaned = dataArrayTransposed.filter(row =>{return !row.equals([ '', '', ''])});
    return dataArrayCleaned;
}	

if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});