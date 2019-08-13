'use strict'
const dialogflow = require('dialogflow')
const uuid = require('uuid')
const projectId = 'newagent-hwrlxh'

const sessionClient = new dialogflow.SessionsClient()
const sessionId = uuid.v4()
const sessionPath = sessionClient.sessionPath(projectId, sessionId)

const dialogFlowResponse = async (
  projectId,
  text,
  sessionClient,
  sessionPath,
  sessionId
) => {
  const languageCode = 'en-US'

  // The text query request.
  let request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: text,
        // The language used by the client (en-US)
        languageCode: languageCode,
      },
    },
  }

  // Send request and log result
  const responses = await sessionClient.detectIntent(request)
  console.log(' SessionClient : ' + sessionClient)
  console.log(' SessionPath : ' + sessionPath)
  console.log(' SessionID : ' + sessionId)
  console.log('Detected intent')
  const result = responses[0].queryResult
  console.log(`  Query: ${result.queryText}`)
  console.log(`  Response: ${result.fulfillmentText}`)
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`)
    return result
  } else {
    console.log(`  No intent matched.`)
    return result
  }
}

module.exports = {
  dialogFlowResponse,
  sessionClient,
  sessionPath,
  sessionId,
}
