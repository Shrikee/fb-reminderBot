require('dotenv').config();
const express = require('express');
const logger = require('pino')();
const { dbInit } = require('./src/helpers/db-init');
require('./src/helpers/schedule');

const port = 5000;
const webhook = require('./src/controllers/webhook');

const app = express();
// connect to db
dbInit();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/webhook', webhook.router);

app.get('/', (req, res) => {
  res.send('root');
});

app.listen(port, () => logger.info(`Server is up on ${port}`));
