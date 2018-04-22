'use strict';

const QUIZ_OPTIONS = "additions, or subtractions, or number comparisons";
const configuration = {
    quiz_type: "",
    additions: {
        left_range: {first: 1, second: 30},
        right_range: {first: 1, second: 7},
        num_questions: 10
    },
    comparisons: {
        range: {first: 1, second: 20},
        num_questions: 10
    },
    subtractions: {
        left_range: {first: 1, second: 10},
        right_range: {first: 1, second: 2},
        num_questions: 5
    }
};

const quiz_types = {
    additions: {configure: "configure_additions", execute: "execute_additions"},
    subtractions: {configure: "configure_subtractions", execute: "execute_subtractions"},
    comparisons: {configure: "configure_comparisons", execute: "execute_comparisons"},
    follows: "follows"
};

const default_expected = "main";

function handler(app, handler = null) {
    if (handler != null) {
        app.data.current_handler = handler;
        return null;
    } else {
        return app.data.current_handler == null ? "init" : app.data.current_handler;
    }
}

function ask(app, message, expected = null, prompt = null) {
    if (expected != null)
        app.data.expected = expected;
    app.data.prompt = prompt == null ? message : prompt;
    console.log("ask response: " + message);
    app.ask(message);
}

function tell(app, message) {
    handler(app, "init");
    console.log("tell response: " + message);
    app.tell(message);
}

function random(min, max) {
    return Math.trunc(min) + Math.trunc(Math.random() * (max - min + 1));
}

exports = module.exports = {
    QUIZ_OPTIONS: QUIZ_OPTIONS,
    ask: ask,
    handler: handler,
    tell: tell,
    configuration: configuration,
    quiz_types: quiz_types,
    default_expected: default_expected,
    random: random
};