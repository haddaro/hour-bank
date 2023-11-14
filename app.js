const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
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

module.exports = app;
