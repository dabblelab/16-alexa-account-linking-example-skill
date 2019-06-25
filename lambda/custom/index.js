/* 
* Copyright (C) 2019 Dabble Lab - All Rights Reserved
* You may use, distribute and modify this code under the 
* terms and conditions defined in file 'LICENSE.txt', which 
* is part of this source code package.
*
* For additional copyright information please
* visit : http://dabblelab.com/copyright
*/

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;

    if (accessToken === undefined) {
      var speechText = "Please use the Alexa companion app to authenticate with your Amazon account to start using this skill.";

      return handlerInput.responseBuilder
        .speak(speechText)
        .withLinkAccountCard()
        .getResponse();
    } else {
    //let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
    let url = `https://api.amazon.com/user/profile?access_token=${accessToken}`;
    /*
    * data.user_id : "amzn1.account.xxxxxxxxxx"
    * data.email : "steve@dabblelab.com"
    * data.name : "Steve Tingiris"
    * data.postal_code : "33607"
    */
    let outputSpeech = 'This is the default message.';

    await getRemoteData(url)
      .then((response) => {
        const data = JSON.parse(response);
        outputSpeech = `Hi ${data.name}. I have yor email address as: ${data.email}.`;
      })
      .catch((err) => {
        //set an optional error message here
        outputSpeech = err.message;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .getResponse();
    }

  },
};

const MyNameIsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'MyNameIsIntent';
  },
  handle(handlerInput) {

    const nameSlot = handlerInput.requestEnvelope.request.intent.slots.name.value;
    const speechText = `Hello ${nameSlot}. It's nice to meet you.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can introduce yourself by telling me your name';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak(`Sorry I ran into an error. The error message was: ${error.message}`)
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    MyNameIsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

  const getRemoteData = function (url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? require('https') : require('http');
      const request = client.get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('Failed with status code: ' + response.statusCode));
        }
        const body = [];
        response.on('data', (chunk) => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', (err) => reject(err))
    })
  };