class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    //If the status code is 400 and something, it's a 'fail',
    //else it's an error:
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //Helps us distinguish between our errors and others:
    this.isOperational = true;
    //Helps us find the location of the error:
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
