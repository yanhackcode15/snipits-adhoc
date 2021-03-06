//
const endDateArry = [
	20211226,
	20211212,
	20211128,
	20211114,
	20211031,
	20211017,
	20211003,
	20210919,
	20210905,
	20210822,
	20210808,
	20210725,
	20210711,
	20210627,
	20210613,
	20210530,
	20210516,
	20210502,
	20210418,
	20210404,
	20210321,
	20210307,
	20210221,
	20210207,
	20210124,
	20210110,
	20201227,
	20201213,
	20201129,
	20201115,
	20201101,
	20201018,
	20201004,
	20200920,
	20200906,
	20200823,
	20200809,
	20200726,
	20200712,
	20200628,
	20200614,
	20200531,
	20200517,
	20200503,
	20200419,
	20200405,
	20200322,
	20200308,
	20200223,
	20200209,
	20200126,
	20200112,
	20191229,
	20191215,
	20191201,
	20191117,
	20191103,
	20191020,
	20191006,
	20190922,
	20190908,
	20190825,
	20190811,
	20190728,
	20190714,
	20190630,
	20190616,
	20190602,
	20190519,
	20190505,
	20190421,
	20190407,
	20190324,
	20190310,
	20190224,
	20190210,
	20190127,
	20190113,
	20181230,
	20181216,
	20181202,
	20181118,
	20181104,
	20181021,
	20181007,
	20180923,
	20180909,
	20180826,
	20180812,
	20180729,
	20180715,
	20180701,
	20180617,
	20180603,
	20180520,
	20180506,
	20180422,
	20180408,
	20180325,
	20180311,
	20180225,
	20180211,
	20180128,
	20180114,
];

const startDateArry = [
	20211213,
	20211129,
	20211115,
	20211101,
	20211018,
	20211004,
	20210920,
	20210906,
	20210823,
	20210809,
	20210726,
	20210712,
	20210628,
	20210614,
	20210531,
	20210517,
	20210503,
	20210419,
	20210405,
	20210322,
	20210308,
	20210222,
	20210208,
	20210125,
	20210111,
	20201228,
	20201214,
	20201130,
	20201116,
	20201102,
	20201019,
	20201005,
	20200921,
	20200907,
	20200824,
	20200810,
	20200727,
	20200713,
	20200629,
	20200615,
	20200601,
	20200518,
	20200504,
	20200420,
	20200406,
	20200323,
	20200309,
	20200224,
	20200210,
	20200127,
	20200113,
	20191230,
	20191216,
	20191202,
	20191118,
	20191104,
	20191021,
	20191007,
	20190923,
	20190909,
	20190826,
	20190812,
	20190729,
	20190715,
	20190701,
	20190617,
	20190603,
	20190520,
	20190506,
	20190422,
	20190408,
	20190325,
	20190311,
	20190225,
	20190211,
	20190128,
	20190114,
	20181231,
	20181217,
	20181203,
	20181119,
	20181105,
	20181022,
	20181008,
	20180924,
	20180910,
	20180827,
	20180813,
	20180730,
	20180716,
	20180702,
	20180618,
	20180604,
	20180521,
	20180507,
	20180423,
	20180409,
	20180326,
	20180312,
	20180226,
	20180212,
	20180129,
	20180115,
	20180101,
];

const anchorStartDate = 20180101;
const anchorEndDate = 20180114;

exports.recentStartEndDates = () => {
	var index = endDateArry.findIndex(findFirstSmallNumber);
	var endDate = endDateArry[index].toString().split('');
	endDate.splice(4,0,'-');
	endDate.splice(7,0,'-');
	endDate = endDate.join('');
	var startDate = startDateArry[index].toString().split('');
	startDate.splice(4,0,'-');
	startDate.splice(7,0,'-');
	startDate = startDate.join('');

	var datePair = {
		fromDate: startDate,
		toDate: endDate,
	};
	// console.log('fromdate', startDateArry[index].toString());
	return datePair;
}

exports.startEndDates = (mth, yr)=>{
	var anchorEndDate = new Date(2018, 0, 14); //UTC format of 2018/01/14
	//find all end dates falling in the mth, yr value, (6, 2018) => end dates between 2018/06/01 and 2018/06/30
	var firstDate = new Date(yr, mth-1, 1); //new Date(2018, 5, 1) => 6/01/2018 in UTC format
	var lastDate = new Date(yr, mth, 0); //new Date(2018, 6, 0) => 6/30/2018 in UTC format
	var index1 = payPeriodsBetween(anchorEndDate, firstDate) + 1; //return integer of pay periods from the anchor date
	var index2 = payPeriodsBetween(anchorEndDate, lastDate);

	var datePairs = [];
	for (let i = index1; i <= index2; i++) {
		let endDate = new Date(anchorEndDate.getTime() + i * (1000 * 60 * 60 * 24 * 14));
		let fromDate = new Date(endDate.getTime() - 13 * (1000 * 60 * 60 * 24));
		datePairs.push({fromDate: dateConverter(fromDate), toDate: dateConverter(endDate)});
	}
	return datePairs;
};

function getToday() {
	var today = new Date();
	var month = ((today.getMonth()+1)>9) ? (today.getMonth()+1) : ('0' + (today.getMonth()+1));

	var date = (today.getDate()>9) ? today.getDate() : ('0' + today.getDate());
	var dateInt = today.getFullYear()+''+month+''+date;
	return parseInt(dateInt, 10);
}

function findFirstSmallNumber(element) {
	return element < getToday();
}

function daysBetween(day1, day2) { //return days bewteen day 1 and day 2 including day 2 but excluding day 1, day 1 and day 1 are dates objects
	return Math.floor((day2 - day1)/(1000 * 3600 * 24));
}

function payPeriodsBetween(day1, day2) {
	return Math.floor(daysBetween(day1, day2)/14);
}

function dateConverter(dateUTC) {
	//return a formatted yyyy-mm-dd from a UTC date object
	var date = dateUTC.getDate();
	var date = (date < 10) ? ('0' + date) : ('' + date);
	var	month = dateUTC.getMonth() + 1;
	var month = (month < 10) ? ('0' + month) : ('' + month);
	var year = '' + dateUTC.getFullYear();
	return (year + '-' +  month + '-' + date);
}