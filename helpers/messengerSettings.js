const request = require('request')

module.exports = function() {
  setGetStartedPostback()
  setGreetingsText()
  setMenu()
  function setGreetingsText() {
    let request_body = {
      greeting: [
        {
          locale: 'default',
          text: 'Hello {{user_first_name}}!',
        },
      ],
    }
    request(
      {
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: request_body,
      },
      (err, res, body) => {
        if (!err) {
          console.log('   Greetings set! ' + JSON.stringify(res.body))
        } else {
          console.error('Unable to set greetings:' + err)
        }
      }
    )
  }

  function setGetStartedPostback() {
    let request_body = {
      get_started: { payload: 'Start' },
    }
    request(
      {
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: request_body,
      },
      (err, res, body) => {
        if (!err) {
          console.log('   Get Started set!: ' + JSON.stringify(res.body))
        } else {
          console.error('Unable to set Get Started:' + err)
        }
      }
    )
  }

  function setMenu() {
    let request_body = {
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
    }
    request(
      {
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: request_body,
      },
      (err, res, body) => {
        if (!err) {
          console.log('   setMenu set!: ' + JSON.stringify(res.body))
        } else {
          console.error('Unable to set Get Started:' + err)
        }
      }
    )
  }
}
