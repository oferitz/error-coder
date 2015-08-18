var assert = require('assert');
var _ = require('lodash');
var httpMocks  = require('node-mocks-http');
var MockRes = require('mock-res');
var errCoder = require('../lib/error-coder');

var errMap = {
	400: {
		15: 'meh',
		25: '%s msg',
		35: '%d msg',
		45: '%j msg',
    55: '%s two %s four %s'
	},
	500: {
		'01': 'moo',
		'AA': 'foo',
     15: 'baz'
	}
};

describe('error-coder tests', function() {
	describe('initialization', function () {

		it('should generate default namespace if one is not provided', function (done) {
			var EC = new errCoder(errMap);
			var actual = EC.setStatus(400).add(15).send();
			assert.strictEqual(actual.errorCode.slice(0,3), 'APP', 'failed to generate default namespace if one is not provided');
			done();
		});

		it('should throw Error if errorsMap is not provided', function (done) {
      assert.throws(
        function() {
          new errCoder();
        },
        'failed to throw Error if errorsMap is not provided'
      );
			done();
		});

		it('should generate default errorDelimiter if one is not provided', function (done) {
			var EC = new errCoder(errMap);
			var actual = EC.setStatus(400).add(15).send();
			assert.strictEqual(actual.errorCode.indexOf('_'), 6, 'failed to generate default errorDelimiter if one is not provided');
			done();
		});

		it('should generate default messageDelimiter if one is not provided', function (done) {
      var EC = new errCoder(errMap);
      var actual = EC.setStatus(400).add(15).send();
			assert.strictEqual(actual.errorMessages, 'meh<br>','failed to generate default messageDelimiter if one is not provided');
			done();
		});

		it('should generate provided namespace', function (done) {
      var EC = new errCoder(errMap, {namespace: 'TST'});
      var actual = EC.setStatus(400).add(15).send();
			assert.strictEqual(actual.errorCode.slice(0,3), 'TST', 'failed to generate default namespace if one is not provided');
			done();
		});

    it('should enforce namespace standard', function (done) {
      var EC = new errCoder(errMap, {namespace: 'foobar'});
      var actual = EC.setStatus(400).add(15).send();
      assert.strictEqual(actual.errorCode.slice(0,3), 'FOO', 'failed to generate default namespace if one is not provided');
      done();
    });

		it('should support provided errorsMap', function (done) {
      var EC = new errCoder(errMap);
      var actual = EC.getErrorsMap();
			assert.deepEqual(actual, errMap, 'failed to support provided errorsMap');
			done();
		});

		it('should support provided errorDelimiter', function (done) {
      var EC = new errCoder(errMap, {errorDelimiter: ','});
      var actual = EC.setStatus(400).add(15).send();
			assert.strictEqual(actual.errorCode.indexOf(','), 6, 'failed to support default errorDelimiter if one is not provided');
			done();
		});

		it('should support provided messageDelimiter', function (done) {
      var EC = new errCoder(errMap, {messageDelimiter: '<hr>'});
      var actual = EC.setStatus(400).add(15).send();
      assert.strictEqual(actual.errorMessages, 'meh<hr>','failed to support provided messageDelimiter');
			done();
		});

    it('should support default distinctCodes set to false', function (done) {
      var EC = new errCoder(errMap);
      var actual = EC.setStatus(400).add(15).add(15).add(15).send();
      assert.strictEqual(actual.errorCode, 'APP400_15_15_15','support default distinctCodes set to false');
      done();
    });

    it('should support distinctCodes set to true', function (done) {
      var EC = new errCoder(errMap, {distinctCodes: true});
      var actual = EC.setStatus(400).add(15).add(15).add(15).send();
      assert.strictEqual(actual.errorCode, 'APP400_15','support default distinctCodes set to false');
      done();
    });

		it('should throw Error when provided namespace is not string', function (done) {
			assert.throws(
				function() {
					new errCoder(errMap, {namespace: 6});
				},
				'failed to throw Error when provided namespace is not string'
			);
			done();
		});

		it('should throw Error when provided errorsMap is not an Object', function (done) {
			assert.throws(
				function() {
					new errCoder(6);
				},
				'failed to throw Error when provided errorsMap is not an Object'
			);
			done();
		});

		it('should throw Error when provided errorDelimiter is not a String', function (done) {
			assert.throws(
				function() {
					new errCoder(errMap, {errorDelimiter: 6});
				},
				'failed to throw Error when provided errorDelimiter is not a String'
			);
			done();
		});

		it('should throw Error when provided messageDelimiter is not a String', function (done) {
			assert.throws(
				function() {
					new errCoder(errMap, {messageDelimiter: 6});
				},
				'failed to throw Error when provided messageDelimiter is not a String'
			);
			done();
		});
	});

	describe('setStatus method', function () {
		it('should throw Error when statusCode is not provided', function (done) {
      var EC = new errCoder(errMap);
			assert.throws(
				function() {
          EC.setStatus();
				},
				'failed to throw Error when statusCode is not provided'
			);
			done();
		});

    it('should throw Error when statusCode is not valid http status code', function (done) {

      assert.throws(
        function() {
          EC.setStatus(600);
        },
        'failed to throw Error when statusCode is not valid http status code'
      );
      done();
    });

    it('should throw Error when statusCode is defined in the errors map', function (done) {
      assert.throws(
        function() {
          EC.setStatus(503);
        },
        'failed to throw Error when statusCode is defined in the errors map'
      );
      done();
    });

		it('should set the current status', function (done) {
      var EC = new errCoder(errMap);
      var actual = EC.setStatus(400).add(15).send();
			assert.strictEqual(actual.errorCode.slice(3,6), '400', 'failed to set the current status');
      actual = EC.setStatus(500).add(15).send();
      assert.strictEqual(actual.errorCode.slice(3,6), '500', 'failed to set the current status');
			done();
		});
	});

	describe('add method', function () {
		it('should throw Error when not passing error code', function (done) {
      var EC = new errCoder(errMap);
			assert.throws(
				function() {
					ec.add();
				},
				'failed to throw Error when errorCode is not provided'
			);
			done();
		});

		it('should throw Error when trying to add error before setting status', function (done) {
      var EC = new errCoder(errMap);
			assert.throws(
				function() {
          EC.add(15);
				},
				'failed to throw Error when trying to add error before setting status'
			);
			done();
		});

    it('should throw Error when trying to add error code that is not defined in the errors map', function (done) {
      var EC = new errCoder(errMap);
      assert.throws(
        function() {
          EC.setStatus(400).add(95);
        },
        'failed to throw Error when trying to add error code that is not defined in the errors map'
      );
      done();
    });

		it('should add new error - simple (message without variables)', function (done) {
      var EC = new errCoder(errMap);
      var actual = EC.setStatus(400).add(25).send();
			assert.strictEqual(actual.errorCode, 'APP400_25', 'failed to add new error - simple (message without variables) - incorrect code');
			assert.strictEqual(actual.errorMessages, errMap[400][25] + '<br>', 'failed to add new error - simple (message without variables) - incorrect message');
			done();
		});

		it('should add new error - with variables (message with variables)', function (done) {
      var EC = new errCoder(errMap);
      var actual = EC.setStatus(400).add(25, 'STRING').add(35, 666).add(45, {json: 'json message'}).send();
      assert.strictEqual(actual.errorCode, 'APP400_25_35_45', 'failed to add new error - with variables (message with variables) - incorrect code');
			assert.strictEqual(actual.errorMessages, 'STRING msg<br>666 msg<br>{"json":"json message"} msg<br>', 'failed to add new error - with variables (message with variables) - incorrect message');
			done();
		});


		it('should support alpha-numeric error codes', function (done) {
      var EC = new errCoder(errMap);
      EC.setStatus(500);
      EC.add(15)
				.add('AA');
      var actual = EC.send();
			assert.strictEqual(actual.errorCode, 'APP500_15_AA', 'failed to support alpha-numeric error codes');
			done();
		});

		it('should support adding after changing status', function (done) {
      var EC = new errCoder(errMap);
      EC.setStatus(400);
      EC.add(15);
      EC.setStatus(500);
      EC.add('01');
      var actual = EC.send();
			assert.strictEqual(actual.errorCode, 'APP500_01', 'failed to support adding after changing status - wrong error code');
      assert.strictEqual(actual.errorMessages, errMap[500]['01'] + '<br>', 'failed to support adding after changing status - wrong error messages');
			done();
		});

	});

	describe('send method', function () {

		it('should return errors object when no response parameter was sent', function (done) {

      var EC = new errCoder(errMap);
			var actual = EC
				.setStatus(400)
        .add(15)
				.add(25, 'NICE')
				.add(35, 333)
				.add(45, {foo: 'bar'})
        .add(55, 'one', 'three', 'five')
				.send();
			assert.strictEqual(actual.status, 400, 'failed to return errors object when no response parameter was sent - wrong status');
			assert.strictEqual(actual.errorCode, 'APP400_15_25_35_45_55', 'failed to return errors object when no response parameter was sent - wrong errorCode');
			assert.strictEqual(actual.errorMessages, 'meh<br>NICE msg<br>333 msg<br>{"foo":"bar"} msg<br>one two three four five<br>', 'failed to return errors object when no response parameter was sent - wrong errorCode');
			done();
		});

		it('should send http response - express.js support', function (done) {
			var res = httpMocks.createResponse();
      var EC = new errCoder(errMap);
      EC.setStatus(400);
      EC.add(15);
      EC.send(res);
			var resData = JSON.parse(res._getData());
			assert.strictEqual(res.statusCode, 400, 'failed to send http response - express.js support - wrong status code');
			assert.strictEqual(resData.status, 400, 'failed to send http response - express.js support - wrong status code in returned object');
			assert.strictEqual(resData.errorCode, 'APP400_15', 'failed to send http response - express.js support - incorrect code');
			assert.strictEqual(resData.errorMessages, errMap[400][15] + '<br>', 'failed to send http response - express.js support - incorrect message');
			done();
		});

		it('should send http response - node.js native support', function (done) {
			var res = new MockRes(function() {
				var resData = res._getJSON();
				assert.strictEqual(res.statusCode, 400, 'failed to send http response - node.js native support - wrong status code');
				assert.strictEqual(resData.status, 400, 'failed to send http response - node.js native support - wrong status code in returned object');
				assert.strictEqual(resData.errorCode, 'APP400_15', 'failed to send http response - node.js native support support - incorrect code');
				assert.strictEqual(resData.errorMessages, errMap[400][15] + '<br>', 'failed to send http response - node.js native support - incorrect message');
				done();
			});

      var EC = new errCoder(errMap);
      EC.setStatus(400);
      EC.add(15);
      EC.send(res);

		});

    it('should throw Error when passing unknown response object', function (done) {
      var EC = new errCoder(errMap);
      assert.throws(
        function() {
          EC.setStatus(400);
          EC.add(15);
          EC.send({foo: 'bar'});
        },
        'failed to throw Error when trying to add error code that is not defined in the errors map'
      );
      done();
    });
	});
});