const path = require('path');
const { v4: uuid } = require('uuid');
const { format } = require('date-fns');

const fs = require('fs').promises;
const file = require('fs');

const logEvent = async (message, filename) => {
    const dateTime = `${format(new Date(), 'yyyy-MM-dd')}`;
    const logItems = `${dateTime}\t${uuid()}\t${message}\n`;
    try {
        if (!file.existsSync(path.join(__dirname, 'log'))) {
            await fs.mkdir(path.join(__dirname, 'log'));
        }
        await fs.appendFile(path.join(__dirname, 'log', filename), logItems);
    } catch (error) {
        console.error(error);
    }
}

module.exports = logEvent;