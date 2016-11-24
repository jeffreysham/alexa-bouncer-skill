'use strict';
var Alexa = require('alexa-sdk');
var Set = require("collections/set");
var APP_ID = undefined;

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

var ev;
var guestMap = {};
var hostMap = {};


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = partyStrings;
    ev = event;

    if (!(ev.session.user.userId in guestMap)) {
        guestMap[ev.session.user.userId] = new Set();
        hostMap[ev.session.user.userId] = new Set();
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
        var host = ev.request.intent.slots.Host.value;
        var guest = ev.request.intent.slots.Guest.value;

        var hostList = hostMap[ev.session.user.userId];
        var guestList = guestMap[ev.session.user.userId];

        if (host) {
            this.emit(':tell', 'Welcome to the party, ' + host);
            hostList.add(host);
        } else if (guest) {
            if (guestList.has(guest)) {
                this.emit(':tell', guest + ' is already on the guest list.');
            } else {
                this.emit(':tell', guest + this.t("ADD_GUEST_MESSAGE"));
                guestList.add(guest);
            }
        } else {
            this.emit(':tell', 'Please repeat your message again.');
        }
    },
    'BouncerIntent': function () {
        var person = ev.request.intent.slots.Person.value;

        var hostList = hostMap[ev.session.user.userId];
        var guestList = guestMap[ev.session.user.userId];

        if (guestList.has(person) || hostList.has(person)) {
            this.emit(':tell', 'You are on the list. Welcome to the party!');
        } else {
            this.emit(':tell', this.t("PERSON_REJECTED_MESSAGE"));
        }
    },
    'GuestListIntent': function () {
        var hostList = hostMap[ev.session.user.userId];
        var guestList = guestMap[ev.session.user.userId];

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
            this.emit(':tell', 'The guest list has the following people. ' + guestString);
        } else {
            this.emit(':tell', 'There are no guests on the list.');
        }
    },
    'ClearListsIntent': function () {
        var hostList = hostMap[ev.session.user.userId];
        var guestList = guestMap[ev.session.user.userId];

        if (guestList.size > 0 || hostList.size > 0) {
            guestList.clear();
            hostList.clear();
            this.emit(':tell', 'The guest and host lists were cleared.');
        } else {
            this.emit(':tell', 'There are currently no guests or hosts.');
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
    }
};