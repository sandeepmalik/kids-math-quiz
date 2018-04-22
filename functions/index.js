'use strict';

// Enable actions client library debugging
//process.env.DEBUG = 'actions-on-google:*';

let App = require('actions-on-google').DialogflowApp;
let express = require('express');
let bodyParser = require('body-parser');

let globals = require("./globals");

let additions = require("./additions");
let comparisons = require("./comparisons");
let subtractions = require("./subtractions");

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

app.post('/', http_handler);

// Start the server
let server = app.listen(app.get('port'), function () {
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});

function http_handler(request, response) {

    const app = new App({request: request, response: response});

    const function_dict = {
        "init": init,
        "configure_additions": additions.configure,
        "execute_additions": additions.execute,
        "configure_comparisons": comparisons.configure,
        "execute_comparisons": comparisons.execute,
        "configure_subtractions": subtractions.configure,
        "execute_subtractions": subtractions.execute,
    };

    const quizzes = {
        "additions": additions,
        "comparisons": comparisons,
        "subtractions": subtractions
    };

    const unknowns = ["Sorry, what was that?", "Sorry, I didn't get that.", "Can you say that again?",
        "Sorry, can you say that again?", "One more time?", "What was that?", "I didn't get that.", "I missed that."];

    function isValid(app) {
        const incoming = app.getArgument("type");
        const type = app.getArgument("type");
        if (type === "repeat") {
            if (app.data.prompt != null) {
                app.ask(app.data.prompt);
            } else {
                app.ask("I am not sure what you want me to repeat");
            }
            return false;
        } else {
            const expected = app.data.expected == null ? globals.default_expected : app.data.expected;
            console.log("incoming = " + incoming + ", expected = " + expected);
            const list = expected.split(",");
            const matched = list.findIndex(function (element) {
                return element === incoming;
            }) !== -1;
            if (!matched) {
                handleUnknown(app);
            }
            return matched;
        }
    }

    function handleUnknown(app) {
        if (app.data.unknown_retry > 4) {
            app.data.unknown_retry = 0;
            globals.tell(app, "Sorry, I don't know how to help.");
        } else {
            let message = "";
            if (app.data.unknown_retry <= 2) {
                message = unknowns[globals.random(0, unknowns.length - 1)];
            } else if (app.data.unknown_retry <= 4) {
                if (app.data.prompt != null)
                    message = unknowns[globals.random(0, unknowns.length - 1)] + ". I asked " + app.data.prompt;
                else message = unknowns[globals.random(0, unknowns.length - 1)];
            } else if (isNaN(app.data.unknown_retry)) {
                app.data.unknown_retry = 1;
                message = app.data.prompt;
            }
            app.data.unknown_retry = app.data.unknown_retry + 1;
            globals.ask(app, message, app.data.expected, app.data.prompt);
        }
    }

    function main(app) {
        if (!isValid(app)) {
            return;
        }
        if (globals.handler(app) != null) {
            try {
                function_dict[globals.handler(app)](app);
            } catch (e) {
                console.error("error in serving request: " + e.stack);
            }
        } else
            app.tell("Sorry, not sure what to do here? Good bye!")
    }

    function init(app) {
        const type = app.getArgument("type");
        if (type === "main") {
            globals.ask(app, "Hello! What kind of quiz you want to take today? You can say " + globals.QUIZ_OPTIONS, "get_quiz_type", "What kind of quiz you want to take today?");
        } else if (type === "get_quiz_type") {
            app.data.quiz_type = app.getArgument("quiz_type");
            globals.ask(app, "Sure, let's do " + app.data.quiz_type +
                ". If you wish to change the current settings say change, otherwise say continue to proceed with " +
                "current settings, you can also say review to review the current settings.", "get_a_configuration", "Please say change to change settings, or say continue to proceed");
        } else if (type === "get_a_configuration") {
            let quiz_type = app.data.quiz_type;
            app.data.configuration = globals.configuration;
            console.log("user storage: " + JSON.stringify(app.userStorage));
            if (app.userStorage[quiz_type + "_conf"] != null) {
                app.data.configuration[quiz_type] = app.userStorage[quiz_type + "_conf"];
            }
            const conf = app.getArgument("configuration");
            if (conf === "review") {
                const conf_summary = quizzes[quiz_type].summarize_conf(app);
                globals.ask(app, "Sure, let's review current settings. " + conf_summary + ". If you wish to change the current settings say change, otherwise say continue to proceed with " +
                    "current settings, If you want to review again, say review the current settings.", "get_a_configuration", "Please say change to change settings, or say continue to proceed");
            } else if (conf === "configure") {
                globals.handler(app, globals.quiz_types[quiz_type].configure);
                function_dict[globals.handler(app)](app, "Alright, let's configure " + app.data.quiz_type + ". ");
            } else {
                globals.handler(app, globals.quiz_types[quiz_type].execute);
                function_dict[globals.handler(app)](app, "Alright, let's get started. ");
            }
        }
    }

    function quit(app) {
        let message = "Thanks for taking the quiz... see you soon.";
        if (app.data.quiz_type != null) {
            message = quizzes[app.data.quiz_type].summarize(app, false);
            if (message == null) {
                message = "Thanks for taking the quiz... see you soon.";
            }
        }
        app.tell(message);
    }

    function unknown(app) {
        if (app.data.unknown_retry == null || app.data.unknown_retry === 0)
            app.data.unknown_retry = 1;
        handleUnknown(app);
    }

    let actionMap = new Map();
    actionMap.set("main", main);
    actionMap.set("quit", quit);
    actionMap.set("input.unknown", unknown);
    app.handleRequest(actionMap);
}