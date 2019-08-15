const schedule = require('node-schedule');
const moment = require('moment');
const logger = require('pino')();
const { Reminder } = require('../models/reminder');
const { handleMessage } = require('../controllers/webhook');

let minTime;
let runScheduledMessage;

async function updateTriggeredState(_minTime) {
  let updateTime = _minTime;
  updateTime = moment().format();
  await Reminder.findOneAndUpdate({ triggerTime: updateTime }, { isTriggered: true });
}
async function getObject(_minTime) {
  let timeParam = _minTime;
  timeParam = moment().format();
  const notification = await Reminder.find({ triggerTime: timeParam });
  return notification;
}

async function getTimeAndSetNotificator() {
  if (runScheduledMessage) {
    runScheduledMessage.cancel();
  }
  const timeObj = await Reminder.find({ isTriggered: false });
  if (timeObj.length !== 0) {
    let i;
    const result = [];
    for (i = 0; i < timeObj.length; i += 1) {
      const time = moment(timeObj[i].triggerTime).format('x');

      /** adding time to an array and then compare with each array elements for smallest value to pass into a scheduler func */
      result.push(time);
    }
    minTime = new Date(Math.min(...result));
    logger.info(result);
  }
  runScheduledMessage = schedule.scheduleJob(minTime, async () => {
    const notification = await getObject(minTime);
    logger.info(notification);
    const senderId = notification[0].sender_psid;
    handleMessage(senderId, notification);
    updateTriggeredState(minTime);
  });
}

const checker = schedule.scheduleJob('* * * * * *', () => {
  logger.info('triggered');
  getTimeAndSetNotificator();
});

module.exports = {
  checker,
};
