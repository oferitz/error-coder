var assert = require('assert');
var _ = require('lodash');
var octcode = require('../lib/octcode');

describe('Octcode tests', function() {
	describe('initialization', function () {
		it('should generate provided namespace', function (done) {
			var ns = new octcode('FOO').namespace;
			assert.strictEqual(ns, 'FOO', 'failed to generate provided namespace');
			done();
		});

		it('should generate default namespace if one is not provided', function (done) {
			var ns = new octcode().namespace;
			assert.strictEqual(ns, 'DEFAULT', 'failed to generate default namespace if one is not provided');
			done();
		});

		it('should throw when provided namespace is not string', function (done) {
			assert.throws(
					function() {
							new octcode(6);
					},
					'failed to throw Error when provided namespace is not string'
			);
			done();
		});

		it('should initialize variables', function (done) {
			var ns = new octcode('test');
			assert.strictEqual(ns.delimiter, '\n', 'failed to initialize delimiter variable');
			assert.ok(_.isObject(ns.history), 'failed to initialize history variable, history is not an Object');
			assert.strictEqual(Object.keys(ns.history).length, 0, 'failed to initialize history variable, history is not an empty Object');
			assert.strictEqual(ns.currentBit, 0, 'failed to initialize currentBit variable');
			assert.strictEqual(ns.currentStatus, 0, 'failed to initialize currentStatus variable');
			assert.ok(_.isArray(ns.messages), 'failed to initialize history variable, messages is not an Array');
			assert.strictEqual(ns.messages.length, 0, 'failed to initialize messages variable, messages is not an empty Array');
			done();
		});

		it('should support initialization with status parameter', function (done) {
			var ns = new octcode('test2');
			ns.init(400);
			assert.strictEqual(ns.currentStatus, 400, 'failed to support initialization with status parameter');
			done();
		});

		it('should support passing custom delimiter as option on initialization', function (done) {
			var ns = new octcode('test3', {delimiter: ','});
			assert.strictEqual(ns.delimiter, ',', 'failed to initialize delimiter variable');
			done();
		});

		it('should support passing options as the first argument', function (done) {
			var ns = new octcode({delimiter: ','});
			assert.strictEqual(ns.delimiter, ',', 'support passing options as the first argument');
			done();
		});
	});

	describe('add method', function () {
		it('should throw Error when status parameter is not provided', function (done) {
			var ns = new octcode('BAR');
			assert.throws(
				function() {
					ns.add();
				},
				'failed to throw Error when provided namespace is not string'
			);
			done();
		});

		it('should generate correct codes and errors - simple', function (done) {
			var oc = new octcode('BAR');
			var actual = oc.add(400);
			assert.strictEqual(actual.code, 'BAR4001', 'failed to generate the correct code');
			assert.strictEqual(actual.errors, 'unknown error', 'failed to generate default error');
			done();
		});

		it('should generate correct codes and errors - grouped', function (done) {
			var oc = new octcode('BAR', {delimiter: '|'});
			oc.add(400, 'a');
			oc.add(400, 'b');
			var actual = oc.add(400, 'c');
			assert.strictEqual(actual.code, 'BAR4007', 'failed to generate the correct code');
			assert.strictEqual(actual.errors, 'a|b|c', 'failed to generate the correct errors');
			done();
		});

		it('should generate correct codes and errors - switch status codes', function (done) {
			var oc = new octcode('BAR', {delimiter: '|'});
			oc.add(400, 'a');
			oc.add(400, 'b');
			var actual = oc.add(401, 'c');
			assert.strictEqual(actual.code, 'BAR4011', 'failed to generate the correct code');
			assert.strictEqual(actual.errors, 'c', 'failed to generate the correct errors');
			actual = oc.add(500, 'c1');
			assert.strictEqual(actual.code, 'BAR5001', 'failed to generate the correct code');
			assert.strictEqual(actual.errors, 'c1', 'failed to generate the correct errors');
			done();
		});


		it('should generate correct codes and errors - use history (return to already used status code from the point we left it)', function (done) {
			var oc = new octcode('BAR', {delimiter: '|'});
			oc.add(400, 'a400-1');
			oc.add(400, 'b400-3');
			oc.add(401, 'c');
			oc.add(500, 'c1');
			oc.add(500, 'c2');
			oc.add(400, 'c400-7');
			var actual = oc.add(400, 'd400-15');
			assert.strictEqual(actual.code, 'BAR40015', 'failed to generate the correct code');
			assert.strictEqual(actual.errors, 'a400-1|b400-3|c400-7|d400-15', 'failed to generate the correct errors');
			done();
		});
	});

	describe('get method', function () {
		it('should return Error when passing status code that is not found', function (done) {
			var oc = new octcode('BAZ');
			var actual = oc.get(500);
			var isError = actual instanceof Error;
			assert.ok(isError, 'failed to return Error when passing status code that is not found - did not return Error');
			assert.strictEqual(actual.message, 'no errors for status code 500', 'failed to return Error when passing status code that is not found - incorrect message');
			done();
		});

		it('should get result when passing status code that is the current status code', function (done) {
			var oc = new octcode('BAZ', {delimiter: '|'});
			oc.add(400, 'a1');
			oc.add(400, 'a2');
			oc.add(400, 'a3');
			oc.add(500, 'b1');
			oc.add(400, 'a4');
			var actual = oc.get(400);
			assert.strictEqual(actual.code, 'BAZ40015', 'failed to get result when passing status code that is the current status code - incorrect code');
			assert.strictEqual(actual.errors, 'a1|a2|a3|a4', 'failed to get result when passing status code that is the current status code - incorrect errors');
			done();
		});

		it('should get result when passing status code that is not the current status code', function (done) {
			var oc = new octcode('BAZ', {delimiter: '|'});
			oc.add(400, 'a1');
			oc.add(400, 'a2');
			oc.add(400, 'a3');
			oc.add(500, 'b1');
			oc.add(500, 'b2');
			oc.add(400, 'a4');
			var actual = oc.get(500);
			assert.strictEqual(actual.code, 'BAZ5003', 'failed to get result when passing status code that is not the current status code - incorrect code');
			assert.strictEqual(actual.errors, 'b1|b2', 'failed to get result when passing status code that is not the current status code - incorrect errors');
			done();
		});
		/*
			oc.add(400, 25, "The error has occured in file: ssdf.txt");


			oc= new octcode('BAZ', ...
			oc.add(400, 25, "fstst.x);
		 */
	});
});