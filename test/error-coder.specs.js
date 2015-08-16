var assert = require('assert');
var _ = require('lodash');
var httpMocks  = require('node-mocks-http');
var MockRes = require('mock-res');
var errCoder = require('../lib/error-coder');

describe('error-coder tests', function() {
	describe('initialization', function () {
		it('should generate provided namespace', function (done) {
			var ec = new errCoder({namespace: 'TST'});
			assert.strictEqual(ec.namespace, 'TST', 'failed to generate default namespace if one is not provided');
			done();
		});

		it('should generate default namespace if one is not provided', function (done) {
			var ec2 = new errCoder();
			assert.strictEqual(ec2.namespace, 'DEFAULT', 'failed to generate default namespace if one is not provided');
			done();
		});

		it('should throw when provided namespace is not string', function (done) {
			assert.throws(
					function() {
							new errCoder({namespace: 6});
					},
					'failed to throw Error when provided namespace is not string'
			);
			done();
		});

		it('should generate provided errorsMap', function (done) {
			var em = {
				400: {
					25: 'abc'
				}
			};
			var ec = new errCoder({errorsMap: em});
			assert.deepEqual(ec.errorsMap, em, 'failed to generate provided errorsMap');
			done();
		});

		it('should generate default errorsMap if one is not provided', function (done) {
			var ec2 = new errCoder();
			assert.strictEqual(Object.keys(ec2.errorsMap).length, 0, 'failed to generate default errorMap if one is not provided');
			done();
		});

		it('should throw when provided errorsMap is not an Object', function (done) {
			assert.throws(
				function() {
					new errCoder({errorsMap: 6});
				},
				'failed to throw Error when provided errorsMap is not an Object'
			);
			done();
		});
		it('should initialize variables', function (done) {
			var ec = new errCoder();
			assert.ok(_.isObject(ec.errorsLog), 'failed to initialize errorsLog variable, errorsLog is not an Object');
			assert.strictEqual(Object.keys(ec.errorsLog).length, 0, 'failed to initialize errorsLog variable, errorsLog is not an empty Object');
			assert.strictEqual(ec.currentStatus, 0, 'failed to initialize currentStatus variable');
			done();
		});
	});

	describe('setStatus method', function () {
		it('should throw Error when statusCode is not provided', function (done) {
			var ec = new errCoder();
			assert.throws(
				function() {
					ec.setStatus();
				},
				'failed to throw Error when statusCode is not provided'
			);
			done();
		});

		it('should set the current status', function (done) {
			var ec = new errCoder();
			ec.setStatus(200);
			assert.strictEqual(ec.currentStatus, 200, 'failed to set the current status');
			ec.setStatus(300);
			assert.strictEqual(ec.currentStatus, 300, 'failed to set the current status');
			ec.setStatus(400);
			assert.strictEqual(ec.currentStatus, 400, 'failed to set the current status');
			ec.setStatus(500);
			assert.strictEqual(ec.currentStatus, 500, 'failed to set the current status');
			done();
		});
	});

	describe('add method', function () {
		it('should throw Error when not passing error code', function (done) {
			var ec = new errCoder();
			assert.throws(
				function() {
					ec.add();
				},
				'failed to throw Error when errorCode is not provided'
			);
			done();
		});

		it('should throw Error when trying to add error before setting status', function (done) {
			var ec = new errCoder();
			assert.throws(
				function() {
					ec.add();
				},
				'failed to throw Error when errorCode is not provided'
			);
			done();
		});

		it('should add new error - simple (message without variables)', function (done) {
			var errMap = {
				400: {
					25: 'simple message'
				}
			};
			var ec = new errCoder({errorsMap: errMap});
			ec.setStatus(400);
			ec.add(25);
			assert.strictEqual(ec.errorsLog[400].errors[0].errorCode, 'DEFAULT40025', 'failed to add new error - simple (message without variables) - incorrect code');
			assert.strictEqual(ec.errorsLog[400].errors[0].errorMessage, errMap[400][25], 'failed to add new error - simple (message without variables) - incorrect message');
			done();
		});

		it('should add new error - with variables (message with variables)', function (done) {
			var errMap = {
				400: {
					25: 'message with %s string variable and %d number variable and %j variable'
				}
			};
			var ec = new errCoder({errorsMap: errMap});
			ec.setStatus(400);
			ec.add(25, 'ONE', 1, {json: 'one JSON'});
			assert.strictEqual(ec.errorsLog[400].errors[0].errorMessage, 'message with ONE string variable and 1 number variable and {"json":"one JSON"} variable', 'failed to add new error - simple (message without variables) - incorrect message');
			done();
		});
	});

	describe('send method', function () {
		it('should throw Error when trying to send before adding any errors', function (done) {
			var ec = new errCoder();
			assert.throws(
				function() {
					ec.send();
				},
				'failed to throw Error when trying to send before adding any errors'
			);
			done();
		});

		it('should return errors object when no response parameter was sent', function (done) {
			var errMap = {
				400: {
					25: '%s message'
				}
			};
			var ec = new errCoder({errorsMap: errMap});
			var actual = ec
				.setStatus(400)
				.add(25, 'NICE')
				.send();
			assert.strictEqual(actual.status, 400, 'failed to return errors object when no response parameter was sent - wrong status');
			assert.strictEqual(actual.errors.length, 1, 'failed to return errors object when no response parameter was sent - unexpected errors length');
			assert.strictEqual(actual.errors[0].errorCode, 'DEFAULT40025', 'failed to return errors object when no response parameter was sent - wrong errorCode');
			assert.strictEqual(actual.errors[0].errorMessage, 'NICE message', 'failed to return errors object when no response parameter was sent - wrong errorCode');
			done();
		});

		it('should send http response - express.js support', function (done) {
			var res = httpMocks.createResponse();
			var errMap = {
				400: {
					25: 'simple message'
				}
			};
			var ec = new errCoder({errorsMap: errMap});
			ec.setStatus(400);
			ec.add(25);
			ec.send(res);
			var resData = JSON.parse(res._getData());
			assert.strictEqual(res.statusCode, 400, 'failed to send http response - express.js support - wrong status code');
			assert.strictEqual(resData.status, 400, 'failed to send http response - express.js support - wrong status code in returned object');
			assert.strictEqual(resData.errorsList.errors[0].errorCode, 'DEFAULT40025', 'failed to send http response - express.js support - incorrect code');
			assert.strictEqual(resData.errorsList.errors[0].errorMessage, errMap[400][25], 'failed to send http response - express.js support - incorrect message');
			done();
		});

		it('should send http response - node.js native support', function (done) {
			var errMap = {
				400: {
					25: 'simple message'
				}
			};

			var res = new MockRes(function() {
				var resData = res._getJSON();
				assert.strictEqual(res.statusCode, 400, 'failed to send http response - node.js native support - wrong status code');
				assert.strictEqual(resData.status, 400, 'failed to send http response - node.js native support - wrong status code in returned object');
				assert.strictEqual(resData.errorsList.errors[0].errorCode, 'DEFAULT40025', 'failed to send http response - node.js native support support - incorrect code');
				assert.strictEqual(resData.errorsList.errors[0].errorMessage, errMap[400][25], 'failed to send http response - node.js native support - incorrect message');
				done();
			});

			var ec = new errCoder({errorsMap: errMap});
			ec.setStatus(400);
			ec.add(25);
			ec.send(res);

		});
	});
});