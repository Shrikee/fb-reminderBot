'use strict'

const express = require('express')
const moment = require('moment')
const router = new express.Router()
const request = require('request')
const { Reminder } = require('../models/reminder')
// const { getTimeAndSetNotificator } = require('../helpers/schedule') CIRCULAR DEPENDENCY
const projectId = 'newagent-hwrlxh'
const msngrSettings = require('../helpers/messengerSettings')
const {
  dialogFlowResponse,
  sessionClient,
  sessionId,
  sessionPath
} = require('../helpers/dialogFlow')
const { snooze } = require('../helpers/dbops')

let sender_psid
let time
// Handles messages events
const handleMessage = async (sender_psid, received_message) => {
  let response
  // Check if the message contains text
  if (received_message.text) {
    let text = received_message.text

    // Create the payload for a basic text message
    let dfResponse = await dialogFlowResponse(
      projectId,
      text,
      sessionClient,
      sessionPath,
      sessionId
    )

    response = {
      text: dfResponse.fulfillmentText
    }
  } else if (received_message[0].name) {
    time = received_message[0].triggerTime
    // Get the URL of the message attachment
    response = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title:
                'You asked to remind you about ' + received_message[0].name,
              subtitle: 'Push the button!',
              buttons: [
                {
                  type: 'postback',
                  title: 'Accept',
                  payload: 'Accept'
                },
                {
                  type: 'postback',
                  title: 'Snooze for 5 minutes',
                  payload: 'Snooze'
                }
              ]
            }
          ]
        }
      }
    }
  }
  // Sends the response message
  callSendAPI(sender_psid, response)
}
// Handles messaging_postbacks events
async function handlePostback(sender_psid, received_postback, time) {
  let response
  // Get the payload for the postback
  let payload = received_postback.payload

  // Set the response based on the postback payload
  switch (payload) {
    case 'Start':
      response = { text: 'Ok, lets Go!!' }
      break
    case 'Add reminder':
    case 'Show all reminders':
    case 'Delete all reminders':
      let dfResponse = await dialogFlowResponse(
        projectId,
        payload,
        sessionClient,
        sessionPath,
        sessionId
      )
      response = {
        text: dfResponse.fulfillmentText
      }
      break
    case 'Accept':
      response = {
        text: 'Woohoo'
      }
      break
    case 'Snooze':
      console.log('  Snoozee time ' + time)
      snooze(time)
      response = {
        text: 'Will remind you in 5 minutes'
      }
    default:
      response = {
        text: 'oops'
      }
  }

  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response)
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  }

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: 'POST',
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log('message sent!')
      } else {
        console.error('Unable to send message:' + err)
      }
    }
  )
}

/** Facebook hook  */

router.get('/', (req, res) => {
  let VERIFY_TOKEN = 'bot'
  let mode = req.query['hub.mode']
  let token = req.query['hub.verify_token']
  let challenge = req.query['hub.challenge']
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      msngrSettings()
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403)
    }
  } else {
    res.status(404)
  }
})

/** Facebook hook  */

router.post('/', (req, res) => {
  let body = req.body

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      let webhook_event = entry.messaging[0]
      console.log(webhook_event)

      // Get the sender PSID
      sender_psid = webhook_event.sender.id
      console.log('Sender PSID: ' + sender_psid)

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message)
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback, time)
      }
    })
    res.status(200).send('EVENT_RECEIVED')
  } else {
    res.status(404)
  }
})

/** Dialogflow hook  */

router.post('/dialogflow', async (req, res) => {
  let body = req.body
  console.log('This is a DF body: ' + JSON.stringify(body))
  let action = body.queryResult.action
  let name = body.queryResult.parameters.name
  let triggerTime = body.queryResult.parameters['date-time'].date_time
  if (!triggerTime) {
    triggerTime = body.queryResult.parameters['date-time'].endDateTime
  }
  if (!triggerTime) {
    triggerTime = body.queryResult.parameters['date-time']
  }

  if (action === 'reminders.add') {
    // add reminder to db
    let reminder = new Reminder({
      name: name,
      triggerTime: triggerTime,
      sender_psid: sender_psid
    })
    try {
      reminder = await reminder.save()
      // add time to queue array
      // getTimeAndSetNotificator()
      res.status(200).send({
        fulfillmentText: 'Reminder saved!'
      })
    } catch (error) {
      res.send(error.message)
    }
  }
  if (action === 'reminders.get') {
    try {
      let reminders = await Reminder.find({ isTriggered: false })
      let result = ''
      let i

      for (i = 0; i < reminders.length; i++) {
        let time = moment(reminders[i].triggerTime).format('MMMM Do, HH:mm')
        result = result + reminders[i].name + ' at ' + time + '; '
      }
      res.status(200).send({
        fulfillmentText: 'Reminders: ' + result
      })
    } catch (error) {
      res.send(error.message)
    }
  }
  if (action === 'reminders.remove') {
    console.log('       REMOVE')
    let reminders = await Reminder.deleteMany({})
    res.status(200).send({
      fulfillmentText: 'Deleted: ' + reminders.deletedCount
    })
  }
  if (action === ' reminders.snooze') {
    // modify reminder trigger time
  }
  res.status(200)
})
module.exports = { router, handleMessage, time }
