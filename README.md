
# error-coder
A node.js module that generates unique error codes.

[![Build Status](https://drone.io/github.com/oferitz/error-coder/status.png)](https://drone.io/github.com/oferitz/error-coder/latest)

# example

## app.js

```js
var ErrorCoder = require('error-coder');

var errMap = {
  400: {
    15: 'invalid request object'
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
    .send(res);  // auto response: `response.status(this.currentStatus).json(generatedErrorsObject)`
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
EC.setStatus(400).add(15).send();
```
will return:

```js
{
  status: 400,
  errors: [{
    errorCode: 'APP40015',
    errorMessage: 'invalid request object'
  }]
}
```

# API

```js
var ErrorCoder = require('error-coder');
var EC = new ErrorCoder(options);
```

## EC.setStatus(statusCode)

Create a new directory and any necessary subdirectories at `dir` with octal
permission string `opts.mode`. If `opts` is a non-object, it will be treated as
the `opts.mode`.

If `opts.mode` isn't specified, it defaults to `0777 & (~process.umask())`.

`cb(err, made)` fires with the error or the first directory `made`
that had to be created, if any.

You can optionally pass in an alternate `fs` implementation by passing in
`opts.fs`. Your implementation should have `opts.fs.mkdir(path, mode, cb)` and
`opts.fs.stat(path, cb)`.

## EC.add(errorCode, [messageVariables])

Synchronously create a new directory and any necessary subdirectories at `dir`
with octal permission string `opts.mode`. If `opts` is a non-object, it will be
treated as the `opts.mode`.

If `opts.mode` isn't specified, it defaults to `0777 & (~process.umask())`.

Returns the first directory that had to be created, if any.

You can optionally pass in an alternate `fs` implementation by passing in
`opts.fs`. Your implementation should have `opts.fs.mkdirSync(path, mode)` and
`opts.fs.statSync(path)`.

## EC.send([response])

Synchronously create a new directory and any necessary subdirectories at `dir`
with octal permission string `opts.mode`. If `opts` is a non-object, it will be
treated as the `opts.mode`.

If `opts.mode` isn't specified, it defaults to `0777 & (~process.umask())`.

Returns the first directory that had to be created, if any.

You can optionally pass in an alternate `fs` implementation by passing in
`opts.fs`. Your implementation should have `opts.fs.mkdirSync(path, mode)` and
`opts.fs.statSync(path)`.

# usage

This package also ships with a `mkdirp` command.

```
usage: mkdirp [DIR1,DIR2..] {OPTIONS}

  Create each supplied directory including any necessary parent directories that
  don't yet exist.
  
  If the directory already exists, do nothing.

OPTIONS are:

  -m, --mode   If a directory needs to be created, set the mode as an octal
               permission string.

```

# install

With [npm](http://npmjs.org) do:

```
npm install mkdirp
```

to get the library, or

```
npm install -g mkdirp
```

to get the command.

# license

MIT
