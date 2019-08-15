const request = require('request');
const logger = require('pino')();

module.exports = function messangerSetter() {
  function setGreetingsText() {
    const requestBody = {
      greeting: [
        {
          locale: 'default',
          text: 'Hello {{user_first_name}}!',
        },
      ],
    };
    request(
      {
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: requestBody,
      },
      (err, res) => {
        if (!err) {
          logger.info(`   Greetings set! ${JSON.stringify(res.body)}`);
        } else {
          logger.error(`Unable to set greetings:${err}`);
        }
      },
    );
  }

  function setGetStartedPostback() {
    const requestBody = {
      get_started: { payload: 'Start' },
    };
    request(
      {
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: requestBody,
      },
      (err, res) => {
        if (!err) {
          logger.info(`   Get Started set!: ${JSON.stringify(res.body)}`);
        } else {
          logger.error(`Unable to set Get Started:${err}`);
        }
      },
    );
  }

  function setMenu() {
    const requestBody = {
      persistent_menu: [
        {
          locale: 'default',
          composer_input_disabled: false,
          call_to_actions: [
            {
              type: 'postback',
              title: 'Add reminder',
              payload: 'Add reminder',
            },
            {
              type: 'postback',
              title: 'Show all reminders',
              payload: 'Show all reminders',
            },
            {
              type: 'postback',
              title: 'Delete all reminders',
              payload: 'Delete all reminders',
            },
          ],
        },
      ],
    };
    request(
      {
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: requestBody,
      },
      (err, res) => {
        if (!err) {
          logger.info(`   setMenu set!: ${JSON.stringify(res.body)}`);
        } else {
          logger.error(`Unable to set Get Started:${err}`);
        }
      },
    );
  }
  setGetStartedPostback();
  setGreetingsText();
  setMenu();
};
