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
			var len = splitName.length >= 3 ? 3 : splitName.length;
			for(var i = 0; i < len; i++) {
					ns += splitName[i][0];
			}
		}
		else {
			ns = projectName.slice(0, 3);
		}
	}
	else {
		ns = 'app'
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
	var ed = (options && options.errorDelimiter) ? options.errorDelimiter : '_';
	var md = (options && options.messageDelimiter) ? options.messageDelimiter : '\n';

	// validations
	if(!_.isString(ns)) {
		throw new Error('namespace should be a string');
	}
	if(!_.isString(ed)) {
		throw new Error('error delimiter should be a string');
	}
	if(!_.isString(md)) {
		throw new Error('message delimiter should be a string');
	}
	if(!_.isObject(em)) {
		throw new Error('errorsMap should be an object');
	}

	this.namespace = ns;
	this.errorsMap = em;
	this.errorDelimiter = ed;
	this.messageDelimiter = md;
	this.errorsLog = {};
	this.currentStatus = 0;
}
/**
 * Sets new status code.
 * @param  {Object} status - the actual status code of the http response.
 * @return {ErrorCoder} the current ErrorCoder instance
 */
ErrorCoder.prototype.setStatus = function(status) {
	if(_.isUndefined(status)) {
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
	if(_.isUndefined(errorCode)) {
		throw new Error('status code is required');
	}
	if(_.isUndefined(this.errorsMap[this.currentStatus])) {
		throw new Error(util.format('errors map Error: the status code property "%s" does not contain property with the name "%s"', this.currentStatus, errorCode));
	}
	var errorMapEntry = this.errorsMap[this.currentStatus][errorCode];

	if(errorMapEntry) {
		var msgArgs = [errorMapEntry];

		for(var i = 1, len = arguments.length; i < len; i++) {
			msgArgs.push(arguments[i]);
		}

		var msg = util.format.apply(this, msgArgs);

		if(!this.errorsLog.hasOwnProperty(this.currentStatus)) {
			this.errorsLog[this.currentStatus] = {
				status: this.currentStatus,
				errorCode: this.namespace + this.currentStatus + this.errorDelimiter + errorCode,
				errorMessages: this.messageDelimiter + msg
			}
		}
		else {
			this.errorsLog[this.currentStatus].errorCode += (this.errorDelimiter + errorCode);
			this.errorsLog[this.currentStatus].errorMessages += (this.messageDelimiter + msg);
		}

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
	if(_.isUndefined(this.errorsLog[this.currentStatus])) {
		throw new Error('no errors to send yet!');
	}
  // we handle the response for the caller.
	if(response) {
		var resObj = {
			status: this.currentStatus,
			errorCode: this.errorsLog[this.currentStatus].errorCode,
			errorMessages: this.errorsLog[this.currentStatus].errorMessages
		};
		// express support
		if(response.status && response.json) {
			response.status(this.currentStatus).json(resObj);
		}
		// support node.js native response.
		else if(response.writeHead && response.end) {
			response.writeHead(this.currentStatus, {'Content-Type': 'application/json'});
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
		return this.errorsLog[this.currentStatus];
	}
};

module.exports = ErrorCoder;
