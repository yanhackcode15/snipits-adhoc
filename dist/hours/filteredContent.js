'use strict';

var contentFilters = require('../common/filters');
module.exports = function (body) {
  return contentFilters.tagFilter(body, 'table', -2);
};