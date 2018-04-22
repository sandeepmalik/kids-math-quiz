'use strict';

let globals = require("./globals");

function configure_comparisons(app) {
    if (app.data.cc == null) {
        app.data.cc = "range";
        globals.ask(app, "Please provide a range of numbers to use in comparisons. For example, you can say between 1 and 100.", "get_num_range", "What's the range of numbers?");
    } else if (app.data.cc === "range") {
        app.data.cc = "num_questions";
        app.data.configuration.comparisons.range = app.getArgument("num_range");
        globals.ask(app, "Thanks, how many comparisons you want to do? For example you can say 10.", "get_a_number", "How many comparisons you want to do?");
    } else if (app.data.cc === "num_questions") {
        app.data.configuration.comparisons.num_questions = parseInt(app.getArgument("number"));
        app.data.cc = null;
        app.userStorage.comparisons_conf = app.data.configuration.comparisons;
        globals.handler(app, "execute_comparisons");
        execute_comparisons(app, "Thanks, let's begin the comparisons. You can say quit any time to stop the quiz. Best of luck.");
    }
}

function execute_comparisons(app, message = "") {
    let data = app.data;
    let compConf = data.configuration.comparisons;
    if (data.ec == null) {
        data.ec = {};
        data.ec.quiz_data = {
            start_time: Date.now(),
            counter: compConf.num_questions,
            init: compConf.num_questions,
            num_rights: 0,
            corrections: [],
            left: -1,
            right: -1,
            answer: -1,
            started: false
        };
        data.number = null;
    }
    let quizData = data.ec.quiz_data;
    if (quizData.started && app.getArgument("type") === "get_a_number" && app.getArgument("number") != null) {
        let number = parseInt(app.getArgument("number"));
        quizData.counter = quizData.counter - 1;
        if (number === quizData.answer) {
            quizData.num_rights = quizData.num_rights + 1;
        } else if (quizData.answer > 0) {
            if (quizData.left < quizData.right) {
                quizData.corrections.push(quizData.left + " is smaller than " + quizData.right);
            } else {
                quizData.corrections.push(quizData.left + " is bigger than " + quizData.right);
            }
        }
    }
    if (quizData.counter === 0) {
        globals.tell(app, summarize(app));
    } else {
        quizData.left = globals.random(compConf.range.first, compConf.range.second);
        quizData.right = globals.random(compConf.range.first, compConf.range.second);
        let tries = 0;
        while (quizData.left === quizData.right && tries++ < 10) {
            quizData.right = globals.random(compConf.range.first, compConf.range.second);
        }
        if (quizData.right === quizData.left) {
            quizData.left = quizData.right - 1;
        }
        let question = " Which is ";
        if ((quizData.left + quizData.right) % 2 === 0) {
            question += "smaller, " + quizData.left + " or " + quizData.right + "?";
            quizData.answer = Math.trunc(Math.min(quizData.left, quizData.right));
        } else {
            question += "bigger, " + quizData.left + " or " + quizData.right + "?";
            quizData.answer = Math.trunc(Math.max(quizData.left, quizData.right));
        }
        quizData.started = true;
        if (quizData.counter === 1 && quizData.init > 1) {
            globals.ask(app, "Last question, " + question, "get_a_number");
        } else {
            globals.ask(app, message + question, "get_a_number")
        }
    }
}

function summarize(app, done = true) {
    const data = app.data;
    if (data.ec != null && data.ec.quiz_data != null) {
        const quizData = data.ec.quiz_data;
        let message = done ? "The quiz is finished. " : "Thanks for taking the quiz. ";
        message = message + "You got " + quizData.num_rights + " questions right out of " + quizData.init + " questions. ";
        if (quizData.num_rights < quizData.init) {
            message += "There were some mistakes. Let me tell you those mistakes. " + quizData.corrections.join(". ") + ". Better luck next time!"
        } else message += ". You did an excellent job!";
        return message;
    } else return null;
}

function summarize_conf(app) {
    let conf = app.userStorage.comparisons_conf == null ? globals.configuration.comparisons : app.userStorage.comparisons_conf;
    return "The range of numbers for comparisons is between " + conf.range.first + " and " + conf.range.second +
        ". The total number of questions in comparisons quiz are " + conf.num_questions;
}

exports = module.exports = {
    configure: configure_comparisons,
    execute: execute_comparisons,
    summarize: summarize,
    summarize_conf: summarize_conf
};