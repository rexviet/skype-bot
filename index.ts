import * as restify from 'restify';
import {BotFrameworkAdapter} from 'botbuilder';
import MyBot from "./bot";
import config from "./config";

const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

const adapter = new BotFrameworkAdapter({
  appId: config.botAdapter.appId,
  appPassword: config.botAdapter.appPassword
});

adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  console.error(`\n [onTurnError]: ${ error }`);
  // Send a message to the user
  await context.sendActivity(`Oops. Something went wrong!`);
};

const myBot = new MyBot(adapter);

server.listen(config.port, function () {
  console.log(`Bot server is listening to ${server.url}`);
});

server.post('/api/messages', async (req, res) => {
  await adapter.processActivity(req, res, async (context) => {
    // Route to main dialog.
    await myBot.run(context);
  });
});

server.post('/api/notify', async (req, res) => {
  const conversationIds = req.body.conversations;
  const message = req.body.message;

  try {
    await myBot.sendToConversations(conversationIds, message);
  } catch (e) {
    console.error('e:', e);
    return res.json({success: false, message: e.message});
  }

  return res.json({success: true});
});

