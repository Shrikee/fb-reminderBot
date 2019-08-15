const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  triggerTime: { type: String, required: true },
  isTriggered: { type: Boolean, default: false },
  sender_psid: String,
});
const Reminder = mongoose.model('Reminder', reminderSchema);
// tried to change it to mongoose.Model to fix eslint but mongoose doesn't allow that

exports.Reminder = Reminder;
