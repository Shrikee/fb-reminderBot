const schedule = require('node-schedule')
const moment = require('moment')
const { Reminder } = require('../models/reminder')
const { handleMessage } = require('../controllers/webhook')

let minTime
let runScheduledMessage
const checker = schedule.scheduleJob('* * * * * *', () => {
  getTimeAndSetNotificator()
  async function getTimeAndSetNotificator() {
    if (runScheduledMessage) {
      runScheduledMessage.cancel()
    }
    const timeObj = await Reminder.find({ isTriggered: false })
    if (timeObj.length != 0) {
      let i
      let result = []
      for (i = 0; i < timeObj.length; i++) {
        let time = moment(timeObj[i].triggerTime).format('x')

        /** adding time to an array and then compare with each array elements for smallest value to pass into a scheduler func */
        result.push(time)
      }
      minTime = new Date(Math.min(...result))
    }
    runScheduledMessage = schedule.scheduleJob(minTime, async function() {
      let notification = await getObject(minTime)
      let sender_psid = notification[0].sender_psid
      handleMessage(sender_psid, notification)
      setTrigger(minTime)
    })
  }
})

async function setTrigger(minTime) {
  minTime = moment().format()
  let triggerObj = await Reminder.findOneAndUpdate(
    { triggerTime: minTime },
    { isTriggered: true }
  )
}
async function getObject(minTime) {
  minTime = moment().format()
  let notification = await Reminder.find({ triggerTime: minTime })
  return notification
}
module.exports = {
  checker
}
