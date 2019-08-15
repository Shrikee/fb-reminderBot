const express = require('express');
const moment = require('moment');

const router = new express.Router();
const request = require('request');
const logger = require('pino')();
const { Reminder } = require('../models/reminder');
// const { getTimeAndSetNotificator } = require('../helpers/schedule') CIRCULAR DEPENDENCY
const projectId = 'newagent-hwrlxh';
const msngrSettings = require('../helpers/messengerSettings');
const {
  dialogFlowResponse,
  sessionClient,
  sessionId,
  sessionPath,
} = require('../helpers/dialogFlow');
const { snooze } = require('../helpers/dbops');

let time;
let senderPsid;

function callSendAPI(_senderPsid, response) {
  // Construct the message body
  const requestBody = {
    recipient: {
      id: _senderPsid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: 'POST',
      json: requestBody,
    },
    err => {
      if (!err) {
        logger.info('message sent!');
      } else {
        logger.error(`Unable to send message:${err}`);
      }
    },
  );
}

// Handles messages events
const handleMessage = async (_senderPsid, receivedMessage) => {
  let response;
  // Check if the message contains text
  if (receivedMessage.text) {
    const { text } = receivedMessage;

    // Create the payload for a basic text message
    const dfResponse = await dialogFlowResponse(
      projectId,
      text,
      sessionClient,
      sessionPath,
      sessionId,
    );

    response = {
      text: dfResponse.fulfillmentText,
    };
  } else if (receivedMessage[0].name) {
    time = receivedMessage[0].triggerTime;
    // Get the URL of the message attachment
    response = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title: `You asked to remind you about ${receivedMessage[0].name}`,
              subtitle: 'Push the button!',
              buttons: [
                {
                  type: 'postback',
                  title: 'Accept',
                  payload: 'Accept',
                },
                {
                  type: 'postback',
                  title: 'Snooze for 5 minutes',
                  payload: 'Snooze',
                },
              ],
            },
          ],
        },
      },
    };
  }
  // Sends the response message
  callSendAPI(_senderPsid, response);
};
// Handles messaging_postbacks events
async function handlePostback(_senderPsid, receivedPostback, _time) {
  let response;
  // Get the payload for the postback
  const { payload } = receivedPostback;

  // Set the response based on the postback payload
  const dfResponse = await dialogFlowResponse(
    projectId,
    payload,
    sessionClient,
    sessionPath,
    sessionId,
  );
  switch (payload) {
    default:
      response = {
        text: 'oops',
      };
      break;
    case 'Start':
      response = { text: 'Ok, lets Go!!' };
      break;
    case 'Add reminder':
    case 'Show all reminders':
    case 'Delete all reminders':
      response = {
        text: dfResponse.fulfillmentText,
      };
      break;
    case 'Accept':
      response = {
        text: 'Woohoo',
      };
      break;
    case 'Snooze':
      logger.info(`  Snoozee time ${_time}`);
      snooze(_time);
      response = {
        text: 'Will remind you in 5 minutes',
      };
  }

  // Send the message to acknowledge the postback
  callSendAPI(_senderPsid, response);
}

// Sends response messages via the Send API

/** Facebook hook  */

router.get('/', (req, res) => {
  const VERIFY_TOKEN = 'bot';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      msngrSettings();
      logger.info('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  } else {
    res.status(404);
  }
});

/** Facebook hook  */

router.post('/', (req, res) => {
  const { body } = req;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      logger.info(webhookEvent);

      // Get the sender PSID
      senderPsid = webhookEvent.sender.id;
      logger.info(`Sender PSID: ${senderPsid}`);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback, time);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.status(404);
  }
});

/** Dialogflow hook  */

router.post('/dialogflow', async (req, res) => {
  const { body } = req;
  logger.info(`This is a DF body: ${JSON.stringify(body)}`);
  const { action } = body.queryResult;
  const { name } = body.queryResult.parameters;
  let triggerTime = body.queryResult.parameters['date-time'].date_time;
  if (!triggerTime) {
    triggerTime = body.queryResult.parameters['date-time'].endDateTime;
  }
  if (!triggerTime) {
    triggerTime = body.queryResult.parameters['date-time'];
  }

  if (action === 'reminders.add') {
    // add reminder to db

    try {
      const reminder = new Reminder({
        name,
        triggerTime,
        sender_psid: senderPsid,
      });
      await reminder.save();
      // add time to queue array
      res.status(200).send({
        fulfillmentText: 'Reminder saved!',
      });
    } catch (error) {
      res.send(error.message);
    }
  }
  if (action === 'reminders.get') {
    try {
      const reminders = await Reminder.find({ isTriggered: false });
      let result = '';
      let i;

      for (i = 0; i < reminders.length; i + 1) {
        const remindersTriggerTime = moment(reminders[i].triggerTime).format('MMMM Do, HH:mm');
        result = `${result + reminders[i].name} at ${remindersTriggerTime}; `;
      }
      res.status(200).send({
        fulfillmentText: `Reminders: ${result}`,
      });
    } catch (error) {
      res.send(error.message);
    }
  }
  if (action === 'reminders.remove') {
    logger.info('       REMOVE');
    const reminders = await Reminder.deleteMany({});
    res.status(200).send({
      fulfillmentText: `Deleted: ${reminders.deletedCount}`,
    });
  }
  if (action === ' reminders.snooze') {
    // modify reminder trigger time
  }
  res.status(200);
});
module.exports = { router, handleMessage, time };
