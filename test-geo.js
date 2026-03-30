const path = require('path');
const gh = require(path.resolve('/tmp/geo-test/geography-hierarchy'));

console.log('=== Search Connecticut ===');
console.log(gh.findMatchingGeographies('Connecticut'));

console.log('=== Search Northeast ===');
console.log(gh.findMatchingGeographies('Northeast'));

console.log('=== Search California ===');
console.log(gh.findMatchingGeographies('California'));

console.log('=== Search Canada ===');
console.log(gh.findMatchingGeographies('Canada'));

console.log('=== Search Texas ===');
console.log(gh.findMatchingGeographies('Texas'));

console.log('=== Search west (lowercase) ===');
console.log(gh.findMatchingGeographies('west'));
