import {ActivityHandler, TurnContext, Activity, BotFrameworkAdapter} from 'botbuilder';
import {ConversationReference} from "botframework-schema";
import * as fs from 'fs';
import {AppCredentials} from "botframework-connector";

enum ConversationMemberChanged {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  OTHER = 'OTHER',
}

export default class MyBot extends ActivityHandler {
  private conversationReferences: {[keys: string]: Partial<ConversationReference>} = {};

  constructor(private readonly adapter: BotFrameworkAdapter) {
    super();
    this.loadConversations();

    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    this.onMessage(async (context, next) => {
      // await context.sendActivity(`You said '${ context.activity.text }'`);
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onConversationUpdate(async (context, next) => {
      // console.log('activity:', context.activity);
      const memberChanged = this.getConversationMemberChanged(context.activity);
      console.log('memberChanged:', memberChanged);
      console.log('conversation id:', context.activity.conversation.id);

      switch (memberChanged) {
        case ConversationMemberChanged.ADDED:
          this.addConversationReference(context.activity);
          break;
        case ConversationMemberChanged.REMOVED:
          this.removeConversationReferance(context.activity);
          break;
      }
      await next();
    });
    // console.log('conversationReferences:', this.conversationReferences);
  }

  private addConversationReference(activity) {
    const conversationReference = TurnContext.getConversationReference(activity);
    this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    this.storeConversations();
  }

  private removeConversationReferance(activity) {
    const conversationReference = TurnContext.getConversationReference(activity);
    delete this.conversationReferences[conversationReference.conversation.id];
    this.storeConversations();
  }

  private getConversationMemberChanged(activity: Activity): ConversationMemberChanged {
    const myId = activity.recipient.id;

    if (activity.membersAdded && activity.membersAdded.length) {
      for (let i = 0, max = activity.membersAdded.length; i < max; i++) {
        if (activity.membersAdded[i].id === myId) {
          return ConversationMemberChanged.ADDED;
        }
      }
    }

    if (activity.membersRemoved && activity.membersRemoved.length) {
      for (let i = 0, max = activity.membersRemoved.length; i < max; i++) {
        if (activity.membersRemoved[i].id === myId) {
          return ConversationMemberChanged.REMOVED;
        }
      }
    }

    return ConversationMemberChanged.OTHER;
  }

  // public async sendToAllConversations() {
  //   for (const conversationReference of Object.values(this.conversationReferences)) {
  //     AppCredentials.trustServiceUrl(conversationReference.serviceUrl);
  //     await this.adapter.continueConversation(conversationReference, async turnContext => {
  //       // If you encounter permission-related errors when sending this message, see
  //       // https://aka.ms/BotTrustServiceUrl
  //       await turnContext.sendActivity('proactive hello');
  //     });
  //   }
  // }
  public async sendToConversations(conversationIds: string[], message: string) {
    return conversationIds.forEach(conversationId => this.sendToConversation(conversationId, message));
  }

  private async sendToConversation(conversationId: string, message: string) {
    // console.log('conversationId:', conversationId);
    // console.log('message:', message);
    const conversation = this.conversationReferences[conversationId];
    if (!conversation) {
      // throw new Error('can not send message to this conversation. Please contact supporter.');
      return;
    }

    if (!AppCredentials.isTrustedServiceUrl(conversation.serviceUrl)) {
      AppCredentials.trustServiceUrl(conversation.serviceUrl);
    }

    await this.adapter.continueConversation(conversation, async turnContext => {
      await turnContext.sendActivity(message);
    });
  }

  private storeConversations() {
    return fs.writeFileSync('conversations.json', JSON.stringify(this.conversationReferences), {encoding: 'utf8'});
  }

  private loadConversations() {
    if (fs.existsSync('conversations.json')) {
      this.conversationReferences = JSON.parse(fs.readFileSync('conversations.json', {encoding: 'utf8'}));
    }
  }
}