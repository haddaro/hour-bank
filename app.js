/* Express application setup.
 * Includes middlewares for security and routers for endpoints
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const userRouter = require('./routes/userRoute');
const orderRouter = require('./routes/orderRoute');
const reviewRouter = require('./routes/reviewRoute');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const version = 'v1';
const app = express();

// Middleware to parse incoming request and limit their size:
app.use(express.json({ limit: '10kb' }));

// Security configurations
// -------------------------------------------

// Rate-limiting: limit to 100 requests per hour per IP:
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, please try again later',
});
app.use('/api', limiter);

// Set various http headers for security:
app.use(helmet());

//Data sanitization: protects against noSQL injection attacks:
app.use(mongoSanitize());

// Routers
// -------------------------------------------

// Route handlers for each resource:
app.use(`/api/${version}/users`, userRouter);
app.use(`/api/${version}/orders`, orderRouter);
app.use(`/api/${version}/reviews`, reviewRouter);

// Test route:
app.get('/test', (req, res) => res.send('Test route works!'));

// Handle Unimplemented routes:
app.all('*', (req, res, next) =>
  next(new AppError(`Cannot find ${req.originalUrl}`, 404)),
);

// Compress text responses:
app.use(compression());

// Global error-handling middleWare:
app.use(globalErrorHandler);

module.exports = app;
