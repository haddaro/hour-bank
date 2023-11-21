// Handles the logging of given messages to a file, for administration purposes.

const fs = require('fs').promises; // eslint-disable-line

const log = async (message) => {
  const now = new Date();
  const content = `${now.toISOString()} + \n ${message}\n\n`;
  try {
    await fs.appendFile(`${__dirname}/logs.txt`, content, 'utf-8');
  } catch (err) {
    console.log(err); // eslint-disable-line
  }
};

module.exports = log;
