const mongoose = require('mongoose')

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

module.exports = function() {
  mongoose
    .connect('mongodb://localhost/MOC-bot', { useNewUrlParser: true })
    .then(() => console.log('Connected to db...'))
    .catch(err => console.error('Could not connect to db...'))
}
