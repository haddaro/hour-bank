const fs = require('fs').promises;

const log = async (message) => {
  const now = new Date();
  const content = `${now.toISOString()} + \n ${message}\n\n`;
  try {
    await fs.appendFile(`${__dirname}/logs.txt`, content, 'utf-8');
  } catch (err) {
    console.log(err);
  }
};

module.exports = log;
