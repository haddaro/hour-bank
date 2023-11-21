/* Connects to the MongoDB database via Mongoose.
 * The connection string is taken from environment variables.
 * If the connection fails, logs the error to a file.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');
const log = require('./utils/logger');

// Load the environment variables:
dotenv.config({ path: './config.env' });

// Construct the connection string:
const database = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.PASSWORD,
);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(database);
  } catch (err) {
    const now = Date.now();
    await log(`${now.toString()}: Could not connect to db \nerror: ${err} `);
  }
};

connectToDatabase();

const port = parseInt(process.env.PORT, 10) || 3000;

// Listen for incoming requests:

app.listen(port);
