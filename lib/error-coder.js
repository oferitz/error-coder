var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var util = require('util');

/**
 * Generates namespace from package.json name property or sets default namespace.
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

/**
 * The Error Coder Object.
 * @constructor
 * @param  {Object} options set of configuration options.
 */
function ErrorCoder(options) {
	var ns = (options && options.namespace) ? options.namespace : getNamespace();
	var em = (options && options.errorsMap) ? options.errorsMap : {};

	// validations
	if(!_.isString(ns)) {
		throw new Error('namespace should be a string');
	}
	if(!_.isObject(em)) {
		throw new Error('errorsMap should be an object');
	}

	this.namespace = ns;
	this.errorsMap = em;
	this.errorsLog = {};
	this.currentStatus = 0;
}
/**
 * Sets new status code.
 * @param  {Object} status http status code.
 * @return {ErrorCoder} the current ErrorCoder instance
 */
ErrorCoder.prototype.setStatus = function(status) {
	if(!status) {
		throw new Error('status code is required');
	}
	this.currentStatus = status;
	return this;
};
/**
 * Adds new child error to the current error object.
 * @param  {Number} errorCode.
 * @return {ErrorCoder} the current ErrorCoder instance
 */
ErrorCoder.prototype.add = function(errorCode) {
	if(!errorCode) {
		throw new Error('status code is required');
	}
	if(!this.errorsMap[this.currentStatus]) {
		throw new Error(util.format('errors map Error: status code %s property does not contain error code %s', this.currentStatus, errorCode));
	}
	var errorMapEntry = this.errorsMap[this.currentStatus][errorCode];

	if(errorMapEntry) {
		var msgArgs = [errorMapEntry];

		for(var i = 1, len = arguments.length; i < len; i++) {
			msgArgs.push(arguments[i]);
		}

		var msg = util.format.apply(this, msgArgs);
		var currentError = {
			errorCode: this.namespace + this.currentStatus + errorCode,
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
 * Sends the current errors
 * @param  {Object} [response] http.response or express.js response object.
 * @return {Object} returns either errors object or http.response (express.js or node.js native response
 * @api public
 */
ErrorCoder.prototype.send = function(response) {
	if(!this.errorsLog[this.currentStatus]) {
		throw new Error('no errors to send yet!');
	}
  // we handle the response for the caller.
	if(response) {
		var resObj = {
			status: this.currentStatus,
			errorsList: this.errorsLog[this.currentStatus]
		};
		// express support
		if(response.status && response.json) {
			response.status(this.currentStatus).json(resObj);
		}
		// support node.js native response.
		else if(response.writeHead && response.end) {
			response.writeHead(200, {"Content-Type": "application/json"});
			var json = JSON.stringify(resObj);
			response.end(json);
		}
		// unsupported response object
		else {
			return new Error('unsupported response object');
		}
	}
	// the caller will handle the response, so just send back the error object.
	else {
		return this.errorsLog[this.currentStatus] ;
	}
};

module.exports = ErrorCoder;
