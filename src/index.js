'use strict';
var Alexa = require('alexa-sdk');
var Set = require("collections/set");
var APP_ID = 'amzn1.ask.skill.187be03d-6395-449d-bce7-bc20d8a646d1';

var partyStrings = {
    "en-US": {
        "translation": {
            "SKILL_NAME": "Bouncer Skill",
            "ADD_GUEST_MESSAGE": " was added to the guest list.",
            "HELP_MESSAGE": "You can say your name to try to enter the party, or, " + 
                "you can add a guest if you are the host... " + 
                "What can I help you with?",
            "WELCOME_MESSAGE": "Welcome to the party. What can I help you with?",
            "PERSON_REJECTED_MESSAGE": "You are not on the list. Ask the host to add you to the guest list.",
            "STOP_MESSAGE": "Goodbye!"
        }
    }
};

var guestMap = {};
var hostMap = {};

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = partyStrings;

    if (!(event.context.System.user.userId in guestMap)) {
        guestMap[event.context.System.user.userId] = new Set();
        hostMap[event.context.System.user.userId] = new Set();
    }

    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        var welcome = this.t("WELCOME_MESSAGE");
        this.emit(':ask', welcome, welcome);
    },
    'AddGuestIntent': function () {
        var host = this.event.request.intent.slots.Host.value;
        var guest = this.event.request.intent.slots.Guest.value;

        var hostList = hostMap[this.event.context.System.user.userId];
        var guestList = guestMap[this.event.context.System.user.userId];

        if (host) {
            this.emit(':ask', 'Welcome to the party, ' + host, 'What else can I help you with?');
            hostList.add(host);
        } else if (guest) {
            if (guestList.has(guest)) {
                this.emit(':ask', guest + ' is already on the guest list.', 'What else can I help you with?');
            } else {
                this.emit(':ask', guest + this.t("ADD_GUEST_MESSAGE"), 'What else can I help you with?');
                guestList.add(guest);
            }
        } else {
            this.emit(':ask', 'Please repeat your message again.', 'Please repeat your message again.');
        }
    },
    'BouncerIntent': function () {
        var person = this.event.request.intent.slots.Person.value;

        var hostList = hostMap[this.event.context.System.user.userId];
        var guestList = guestMap[this.event.context.System.user.userId];

        if (guestList.has(person) || hostList.has(person)) {
            this.emit(':ask', 'You are on the list. Welcome to the party!', 'What else can I help you with?');
        } else {
            this.emit(':ask', this.t("PERSON_REJECTED_MESSAGE"), this.t("PERSON_REJECTED_MESSAGE"));
        }
    },
    'GuestListIntent': function () {
        var hostList = hostMap[this.event.context.System.user.userId];
        var guestList = guestMap[this.event.context.System.user.userId];

        var guestString = '';
        var guestArray = guestList.toArray();
        var i;
        for (i = 0; i < guestArray.length - 1; i++) {
            guestString += guestArray[i] + ', ';
        }

        if (guestArray.length > 0) {
            var preposition = '';
            if (guestArray.length > 1) {
                preposition = 'and';
            }
            guestString += preposition + ' ' + guestArray[i];
            this.emit(':ask', 'The guest list has the following people. ' + guestString, 'What else can I help you with?');
        } else {
            this.emit(':ask', 'There are no guests on the list.', 'What else can I help you with?');
        }
    },
    'ClearListsIntent': function () {
        var hostList = hostMap[this.event.context.System.user.userId];
        var guestList = guestMap[this.event.context.System.user.userId];

        if (guestList.size > 0 || hostList.size > 0) {
            guestList.clear();
            hostList.clear();
            this.emit(':ask', 'The guest and host lists were cleared.', 'What else can I help you with?');
        } else {
            this.emit(':ask', 'There are currently no guests or hosts.', 'What else can I help you with?');
        }
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, speechOutput);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'Unhandled': function() {
        var speechOutput = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, speechOutput);
    }
};