//Wraps all async functions so we don't have to try-catch in them:
//Receives a middleware, and returns a function that calls the original middleware and catches its errors
//Upon catching an error, it will be sent all the way down to the global error handling middleware in app.js
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
