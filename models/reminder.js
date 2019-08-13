const mongoose = require('mongoose')

const reminderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  triggerTime: { type: String, required: true },
  isTriggered: { type: Boolean, default: false },
  sender_psid: String
})
const Reminder = new mongoose.model('Reminder', reminderSchema)

exports.Reminder = Reminder
