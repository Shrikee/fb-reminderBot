'use strict'
require('dotenv').config()
const express = require('express')
const port = 5000
const webhook = require('./controllers/webhook')
const app = express()
const { checker } = require('./helpers/schedule')
// connect to db
require('./helpers/db-init')()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/webhook', webhook.router)

app.get('/', (req, res) => {
  res.send('root')
})

app.listen(port, () => console.log('Server is up on ' + port))
