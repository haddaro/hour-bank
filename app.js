const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const userRouter = require('./routes/userRoute');
const orderRouter = require('./routes/orderRoute');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const version = 'v1';

const app = express();
//Parse incoming request, but limit their size:
app.use(express.json({ limit: '10kb' }));

//S E C U R I T Y:
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, please try again later',
});
//Limit to 100 requests per hour from an IP:
app.use('/api', limiter);
//Security http headers:
app.use(helmet());
//Data sanitization against noSQL query injection:
app.use(mongoSanitize());

//R O U T E R S
app.use(`/api/${version}/users`, userRouter);
app.use(`/api/${version}/orders`, orderRouter);
//Unimplemented routes:
app.all('*', (req, res, next) =>
  next(new AppError(`Cannot find ${req.originalUrl}`, 404)),
);

//E R R O R   H A N D L E R
app.use(globalErrorHandler);

module.exports = app;
