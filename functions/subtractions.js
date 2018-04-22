'use strict';

let globals = require("./globals");

function configure_subtractions(app, message = "") {
    if (app.data.cs == null) {
        app.data.cs = "first_range";
        globals.ask(app, message + "To configure subtractions quiz, I need to know the ranges of both numbers that need to be used. " +
            "What's the range of first number? For example, you can say between 1 and 10.", "get_num_range", "What's the range of first number?");
        return;
    }
    const type = app.getArgument("type");
    const conf = app.data.configuration.subtractions;
    if (type === "get_num_range" && app.data.cs === "first_range") {
        conf.left_range = app.getArgument("num_range");
        app.data.cs = "second_range";
        globals.ask(app, "Thanks, what's the range of second number?", "get_num_range", "What's the range of second number?");
    } else if (type === "get_num_range" && app.data.cs === "second_range") {
        conf.right_range = app.getArgument("num_range");
        app.data.cs = "num_questions";
        globals.ask(app, "Thanks, How many questions do you want to answer? For example, you can say 20 questions", "get_a_number", "How many questions do you want to answer?");
    } else if (app.data.cs === "num_questions") {
        conf.num_questions = parseInt(app.getArgument("number"));
        app.data.cs = null;
        app.userStorage.subtractions_conf = conf;
        globals.handler(app, "execute_subtractions");
        execute_subtractions(app, "Thanks, let's begin the subtractions. You can say quit any time to stop the quiz. Best of luck.");
    }
}

function execute_subtractions(app, initMessage = "") {
    const data = app.data;
    const addConf = data.configuration.subtractions;
    if (data.es == null) {
        data.es = {};
        data.es.quiz_data = {
            start_time: Date.now(),
            counter: addConf.num_questions,
            init: addConf.num_questions,
            num_rights: 0,
            corrections: [],
            left: -1,
            right: -1,
            started: false
        };
        data.number = null;
    }
    const quizData = data.es.quiz_data;
    const number = parseInt(app.getArgument("number"));
    if (quizData.started && app.getArgument("type") === "get_a_number" && number != null) {
        let diff = Math.trunc(quizData.left - quizData.right - number);
        quizData.counter = quizData.counter - 1;
        if (diff === 0) {
            quizData.num_rights = quizData.num_rights + 1;
        } else {
            quizData.corrections.push(quizData.left + " minus " + quizData.right + " is " +
                (quizData.left - quizData.right) + ", not " + number);
        }
    }
    if (quizData.counter === 0) {
        globals.tell(app, summarize(app));
    } else {
        quizData.left = globals.random(addConf.left_range.first, addConf.left_range.second);
        quizData.right = globals.random(addConf.right_range.first, addConf.right_range.second);
        let max = Math.trunc(Math.max(quizData.left, quizData.right));
        let min = Math.trunc(Math.min(quizData.left, quizData.right));
        quizData.left = max;
        quizData.right = min;
        quizData.started = true;
        if (quizData.counter === 1 && quizData.init > 1) {
            globals.ask(app, "Last question, what's " + quizData.left + " minus " + quizData.right + " equals to?", "get_a_number");
        } else {
            globals.ask(app, initMessage + " What's " + quizData.left + " minus " + quizData.right + " equals to?", "get_a_number");
        }
    }
}

function summarize(app, done = true) {
    const data = app.data;
    if (data.es != null && data.es.quiz_data != null) {
        const quizData = data.es.quiz_data;
        let message = done ? "The quiz is finished. " : "Thanks for taking the quiz. ";
        message = message + "You got " + quizData.num_rights + " questions right out of " + quizData.init + " questions. ";
        if (quizData.num_rights < quizData.init) {
            message += "There were some mistakes. Let me tell you those mistakes. " + quizData.corrections.join(". ") + ". Better luck next time!"
        } else message += ". You did an excellent job! See you next time.";
        return message;
    } else return null;
}

function summarize_conf(app) {
    let conf = app.userStorage.subtractions_conf == null ? globals.configuration.subtractions : app.userStorage.subtractions_conf;
    return "The range of first number for subtractions is between " + conf.left_range.first + " and " + conf.left_range.second +
        ". The range of second number for subtractions is between " + conf.right_range.first + " and " + conf.right_range.second +
        ". The total number of questions in subtractions quiz are " + conf.num_questions;
}

exports = module.exports = {
    configure: configure_subtractions,
    execute: execute_subtractions,
    summarize: summarize,
    summarize_conf: summarize_conf
};
