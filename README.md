
# error-coder
A node.js module that generates unique error codes.

[![Build Status](https://drone.io/github.com/oferitz/error-coder/status.png)](https://drone.io/github.com/oferitz/error-coder/latest)

# example

## app.js

```js
var ErrorCoder = require('error-coder');

var errMap = {
  400: {
    15: 'invalid request object',
    25: 'horrible error number %d'
  },
  422: {
    15: 'missing %s parameter',
    25: 'missing %s parameter'
  },
  503: {
    15: 'database error',
    25: 'api server error'
  }
 
// create new instance
var EC = new ErrorCoder({ namespace: 'APP', errorsMap: errMap });

function handleRequest(req, res) {
  // validations: set status for all potential 422 errors
  EC.setStatus(422);
  if(!req.body.username && !req.body.url) {
    EC
    .add(15, 'username')
    .add(25, 'url')
    .send(res);  // auto: `res.status(this.currentStatus).json(generatedErrorsObject)`
  }
  
  EC.setStatus(503);
  db.connect('foo.bar', function(err, connection) {
    if(err) {
      EC.add(15);
      var errObj = EC.send(); // do not send auto response
      res.send(errObj.status).json(errObj.errorsList);
    }
  });
}
```

## the generated error object

```js
EC.setStatus(400).add(15).add(25, 10025).send();
```
will return:

```js
{
  status: 400,
  errorCode: 'APP400_15_25',
  errorMessages: 'invalid request object\nhorrible error number 10025'
}
```

# API

```js
var ErrorCoder = require('error-coder');
var EC = new ErrorCoder(options);
```

Create new instance and passes the options object to the constructor class

`options` include:
  * `namespace {String}`: The name that will prefix the unique errorCode.
    If omitted it will be created automatically for you, first by trying to read the name attribute from your `package.json` file,
    if the name includes '-' it takes the first letter of each separated word, otherwise it will just take the first ? 3 letters. 
    If for some reason the name could be generatd from `package.json` file, the name space will be 'APP'.
  * `errorsMap {Object}`: An object that define possible errors and their related messages (see example above).
  * `errorDelimiter {string}`: A character for separating the error codes. defaults to `_`.
  * `messageDelimiter {string}`: A character for separating the errors messages. defaults to `\n`.

  
## EC.setStatus(statusCode)

Set a new group of errors. This is the actual status code of the http response.
The `statusCode` should match to one of your `errorsMap` entries. 
After setting new status adding new error(`EC.add`) and sending (`EC.send`)
will are related to the current status until you set a new `statusCode`


## EC.add(errorCode, [messageVariables])

Add new error to the list of current status code errors. Needles to say that he `errorCode` should match one of the entries in the `errorsMap`

The error messages supports [`util.format`](https://nodejs.org/api/util.html#util_util_format_format) for message formatting
so in `messageVariables` you can pass any variables that will replace your `errorsMap` messages placeholders.

## EC.send([response])

Send the current errors object.

If `response` is omitted it will return an object. Otherwise it will automatically send http.response

The `response` could be "native" node.js `http.ServerResponse` or express.js response object.


# install

```
npm install error-coder
```

# test

```
npm test
```
# license

(The MIT License)

Copyright (c) 2015 Ofer Itzhaki & the Contributors
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
