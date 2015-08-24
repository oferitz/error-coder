var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var util = require('util');

/**
   generate namespace automatically, first by trying to read the name attribute from your `package.json` file,
	 if the name includes '-' it takes the first letter of each separated word, otherwise it will just take the first ? 3 letters.
	 If for some reason the name could be generated from `package.json` file, the name space will be 'APP'.
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
 * The name that will prefix the unique errorCode. the namespace should be 3 chars long and uppercase.
 * @private
 */
var namespace;
/**
 * An object that define possible errors and their related message.
 * @private
 */
var	errorsMap;
/**
 * A character for separating the error codes.
 * @private
 */
var	errorDelimiter;
/**
 * A character for separating the errors messages.
 * @private
 */
var	messageDelimiter;
/**
 * A boolean. filter duplicate codes from the response errorCode
 * @private
 */
var	distinctCodes;
/**
 * An object for storing the current added errors.
 * @private
 */
var	errorsLog;
/**
 * The current http status code.
 * @private
 */
var	currentStatus;


/**
 * The Error Coder Object.
 * @constructor
 * @param  {Object} errsMap.
 * @param  {Object} options set of configuration options.
 */
function ErrorCoder(errsMap, options) {

	namespace = (options && options.namespace) ? options.namespace : getNamespace();
	errorsMap = errsMap;
	errorDelimiter = (options && options.errorDelimiter) ? options.errorDelimiter : '_';
	messageDelimiter = (options && options.messageDelimiter) ? options.messageDelimiter : '<br>';
	distinctCodes = (options && options.distinctCodes) ? options.distinctCodes : false;
	errorsLog = {};
	currentStatus = 0;

	// validations
	if(_.isUndefined(errorsMap)) {
		throw new Error('errorsMap is required');
	}
	if(!_.isObject(errorsMap)) {
		throw new Error('errorsMap should be an object');
	}
	if(!_.isString(namespace)) {
		throw new Error('namespace should be a string');
	}
	if(!_.isString(errorDelimiter)) {
		throw new Error('error delimiter should be a string');
	}
	if(!_.isString(messageDelimiter)) {
		throw new Error('message delimiter should be a string');
	}

	// enforce namespace standard
	namespace = namespace.slice(0,3).toUpperCase();

}
/**
 * Sets new status code.
 * @param  {Number} status - the actual status code of the http response.
 * @return {ErrorCoder} the current ErrorCoder instance
 */
ErrorCoder.prototype.setStatus = function(status) {
	if(_.isUndefined(status)) {
		throw new Error('status code is required');
	}
	if(!_.isNumber(status) || _.isNaN(status) || (_.isNumber(status) && !_.inRange(status, 100, 600))) {
		throw new Error('status code should be a valid http status code according to http specification, RFC 2616 section 6.1.1');
	}
  if(_.isUndefined(errorsMap[status])) {
		throw new Error(util.format('status code "%s" is not defined in the errors map', status));
	}

	currentStatus = status;

	return this;
};
/**
 * Adds new child error to the current error object.
 * @param  {Number|String} errorCode.
 * @param  {...*} arguments optional error message variables.
 * @return {ErrorCoder} the current ErrorCoder instance
 */
ErrorCoder.prototype.add = function(errorCode) {

	if(_.isUndefined(errorCode)) {
		throw new Error('error code is required');
	}
	var hasMapEntry = !_.isUndefined(errorsMap[currentStatus][errorCode]);

	if(!hasMapEntry) {
		throw new Error(util.format('errors map Error: the status code property "%s" does not contain error code with the name "%s"', currentStatus, errorCode));
	}

	var msgArgs = [errorsMap[currentStatus][errorCode]];

	for(var i = 1, len = arguments.length; i < len; i++) {
		msgArgs.push(arguments[i]);
	}

	var msg = util.format.apply(this, msgArgs);

	if(!errorsLog.hasOwnProperty(currentStatus)) {
		errorsLog[currentStatus] = {
			status: currentStatus,
			errorCode: namespace + currentStatus + errorDelimiter + errorCode,
			errorMessages: msg + messageDelimiter
		}
	}
	else {
		errorsLog[currentStatus].errorCode += (errorDelimiter + errorCode);
		errorsLog[currentStatus].errorMessages += (msg + messageDelimiter);
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
	if(errorsLog[currentStatus]) {

		var errCode = errorsLog[currentStatus].errorCode;

		if(distinctCodes) {
			var errCodeArray = errCode.split(errorDelimiter);
			errCode = errCodeArray[0] + errorDelimiter + _.uniq(errCodeArray.slice(1)).join(errorDelimiter);
		}

		var resObj = {
			status: currentStatus,
			errorCode: errCode,
			errorMessages: errorsLog[currentStatus].errorMessages
		};

		if(response) {
			// express support
			if(response.status && response.json) {
				errorsLog[currentStatus].errorCode = '';
				errorsLog[currentStatus].errorMessages = '';
				response.status(currentStatus).json(resObj);

			}
			// support node.js native response.
			else if(response.writeHead && response.end) {
				response.writeHead(currentStatus, {'Content-Type':'application/json'});
				var json = JSON.stringify(resObj);
				errorsLog[currentStatus].errorCode = '';
				errorsLog[currentStatus].errorMessages = '';
				response.end(json);
			}
			// unsupported response object
			else {
				throw new Error('unsupported response object');
			}
		}
		// the caller will handle the response, so just send back the error object.
		else {
			return resObj;
		}
	}
};

/**
 * Get the current error map.
 * @return {Object} the errors map object
 */
ErrorCoder.prototype.getErrorsMap = function() {
	return errorsMap;
};

module.exports = ErrorCoder;
