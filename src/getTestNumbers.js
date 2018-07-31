const Collection = require('../models/collection');

module.exports = function() {
	return Collection.TestNumber.findOne()
		.exec(function(err, doc){
			if (err) {
				console.error('error fetching test phone numbers');
				return null;
			}
			else {
				return doc;
			}
		});
}