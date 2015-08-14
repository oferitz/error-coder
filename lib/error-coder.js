var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var util = require('util');


/**
 * The Error Coder Object.
 */
function getNamespace() {
	var ns = '';
	var fileExists = fs.existsSync(path.dirname(require.main.filename) + '/package.json');
	if(fileExists) {
		var projectName = require(path.dirname(require.main.filename) + '/package.json').name;
		if(projectName.indexOf('-') !== -1) {
			var splitName = projectName.split('-');
			for(var i = 0, len = splitName.length; i < len; i++) {
					ns += splitName[i][0];
			}
		}
		else {
			ns = projectName.slice(0, 3);
		}
	}
	else {
		ns = 'default'
	}
	return ns.toUpperCase();
}

var defaults = {
	namespace: getNamespace(),
	errorsMap: {}
};

/**
 * The Error Coder Object.
 * @constructor
 * @param  {Object} options set of configuration options.
 */
function ErrorCoder(options) {
	this.options =  _.assign(defaults, options);
	this.errorsLog = {};
}
/**
 * The Error Coder Object.
 * @constructor
 * @param  {Object} status set of configuration options.
 */
ErrorCoder.prototype.init = function(status) {
	this.currentStatus = status || 0;
};
/**
 * The Error Coder Object.
 * @param  {Object} status http status code.
 */
ErrorCoder.prototype.setStatus = function(status) {
	if(!status) {
		throw new Error('status code is required');
	}
	this.currentStatus = status;
	return this;
};
/**
 * The Error Coder Object.
 * @param  {Number} errorCode.
 */
ErrorCoder.prototype.add = function(errorCode) {
	if(!errorCode) {
		throw new Error('status code is required');
	}

	var errorMapEntry = this.options.errorsMap[this.currentStatus][errorCode];

	if(errorMapEntry) {
		var msgArgs = [errorMapEntry];

		for(var i = 1, len = arguments.length; i < len; i++) {
			msgArgs.push(arguments[i]);
		}

		var msg = util.format.apply(this, msgArgs);
		var currentError = {
			errorCode: this.options.namespace + this.currentStatus + errorCode,
			errorMessage: msg
		};

		if(!this.errorsLog.hasOwnProperty(this.currentStatus)) {
			this.errorsLog[this.currentStatus] = {
				status: this.currentStatus,
				errors: []
			}
		}

		this.errorsLog[this.currentStatus].errors.push(currentError)
	}

	return this;
};
/**
 * The Error Coder Object.
 * @param  {Object} [statusCode] optional .
 * @param  {Object} [response] set of configuration options.
 */
ErrorCoder.prototype.send = function(statusCode, response) {
	//if(statusCode)
};

module.exports = ErrorCoder;
