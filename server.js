const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });
const database = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.PASSWORD,
);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(database);
  } catch (err) {
    console.log(err);
  }
};

connectToDatabase();

const port = parseInt(process.env.PORT, 10) || 3000;
app.listen(port);
