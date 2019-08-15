const dialogflow = require('dialogflow');
const logger = require('pino')();
const uuid = require('uuid');

const projectId = 'newagent-hwrlxh';
const sessionClient = new dialogflow.SessionsClient();
const sessionId = uuid.v4();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const dialogFlowResponse = async (_projectId, text, _sessionClient, _sessionPath, _sessionId) => {
  const languageCode = 'en-US';

  // The text query request.
  const request = {
    session: _sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text,
        // The language used by the client (en-US)
        languageCode,
      },
    },
  };

  // Send request and log result
  const responses = await _sessionClient.detectIntent(request);
  logger.info(` SessionClient : ${_sessionClient}`);
  logger.info(` SessionPath : ${_sessionPath}`);
  logger.info(` SessionID : ${_sessionId}`);
  logger.info('Detected intent');
  const result = responses[0].queryResult;
  logger.info(`  Query: ${result.queryText}`);
  logger.info(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    logger.info(`  Intent: ${result.intent.displayName}`);
    return result;
  }
  logger.info(`  No intent matched.`);
  return result;
};

module.exports = {
  dialogFlowResponse,
  sessionClient,
  sessionPath,
  sessionId,
};
