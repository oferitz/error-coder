var Octcode = require('./lib/octcode');

var oc = new Octcode('BOLBOL', {delimiter: '***'});
oc.add(400, 'missing username');
oc.add(401, 'missing timestamp');
oc.add(402, 'missing gss');
console.log('GET:', oc.get(500));
//console.log(oc.add(401));
//console.log(oc.add(404));