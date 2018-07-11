'use strict';
const contentFilters = require('../common/filters');
module.exports = (body) => contentFilters.tagFilter(body, 'table', -2); 