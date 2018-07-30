const Collection = require('../models/collection');

module.exports = function() {
	return Collection.PhoneNumber.findOne()
		.exec(function(err, doc){
			if (err) {
				console.error('error fetching phone numbers');
				return null;
			}
			else {
				return doc;
			}
		});
}