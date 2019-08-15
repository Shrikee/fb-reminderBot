const moment = require('moment');
const { Reminder } = require('../models/reminder');

const snooze = async function convertTimeAndUpdate(time) {
  let reminder = await Reminder.find({ triggerTime: time });
  // add 5 mins to time and save

  let newTime = moment().add(5, 'm');
  newTime = moment(newTime).toISOString();
  newTime = moment(newTime).format();

  reminder = new Reminder({
    name: reminder[0].name,
    triggerTime: newTime,
    isTriggered: false,
    sender_psid: reminder[0].sender_psid,
  });
  await reminder.save();
};

module.exports = {
  snooze,
};
