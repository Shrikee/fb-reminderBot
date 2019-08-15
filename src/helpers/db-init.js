const mongoose = require('mongoose');
const logger = require('pino')();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const dbInit = function init() {
  mongoose
    .connect('mongodb://localhost/MOC-bot', { useNewUrlParser: true })
    .then(() => logger.info('Connected to db...'))
    .catch(err => logger.error(`Could not connect to db...${err}`));
};

module.exports = {
  dbInit,
};
