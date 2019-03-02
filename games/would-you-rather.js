const Game = require("./game.js");
let questions = require('./questions.json');

const type = "WouldYouRather";

let playerToViewModel = (p) => { return { username: p.username, score: p.score, isA: p.isA } };

class Question {
    constructor (prompt, opt1, opt2) {
        this.prompt = prompt;
        this.opt1 = opt1;
        this.opt2 = opt2;

        this.reset();
    }

    answer(opt, player) {
        if (opt === 1) {
            this.opt1Answers.push(player);
        } else {
            this.opt2Answers.push(player);
        }
    }

    vote(opt, player) {
        if (opt === 1) {
            this.opt1Votes.push(player);
        } else {
            this.opt2Votes.push(player);
        }
    }

    reset() {
        this.opt1Answers = [];
        this.opt2Answers = [];

        this.opt1Votes = [];
        this.opt2Votes = [];
    }
}

class WouldYouRather extends Game.Game {
    constructor (gameId) {
        super(gameId);

        this.type = type;

        this.midRound = false;

        //TODO load questions
        this.questions = questions;
        console.log(this.questions);

        this.questions = this.questions.map(q => new Question(q.prompt, q.opt1, q.opt2));


        this.currentQuestion = new Question("Test Question", "Opt1", "Opt2");
        this.questions.push(this.currentQuestion);

        this.groupA = {};
        this.opt1Answers = [];
        this.opt2Answers = [];

        this.opt1Votes = [];
        this.opt2Votes = [];
        this.groupB = {};
    }

    removePlayer(player) {
        super.removePlayer();
        if (player.isA) {
            delete this.groupA[player.username];
        } else {
            delete this.groupB[player.username];
        }

        this.sendPlayerUpdate();
    }

    addPlayer(player) {
        super.addPlayer(player);
        //add the player to the smaller group
        if (Object.keys(this.groupA).length > Object.keys(this.groupB).length) {
            this.groupB[player.username] = player;

            player.isA = false;
        } else {
            this.groupA[player.username] = player;
            player.isA = true;
        }

        player.hasPlayed = false;
        player.score = 0;

        this.sendPlayerUpdate();
    }

    removePlayer(player) {
        super.removePlayer(player);
        if (player.isA) {
            delete this.groupA[player.username];
        } else {this.currentQuestionbreak;
            delete this.groupB[player.username];
        }
        this.sendPlayerUpdate();
    }

    sendPlayerUpdate() {
        this.sendMsgToAll({
            type: "PLAYER",
            players: Object.values(this.allPlayers).map(playerToViewModel)
        });
    }

    startRound() {
        Object.values(this.allPlayers).forEach((p) => { p.hasPlayed = false });

        //swap the groups round
        let temp = this.groupA;
        this.groupA = this.groupB;
        this.groupB = temp;



        Object.values(this.groupA).forEach((p) => {
            p.isA = true;
        });

        Object.values(this.groupB).forEach((p) => {
            p.isA = false;
        });

        //draw new question
        this.currentQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];
        this.currentQuestion.reset();

        Object.values(this.allPlayers).forEach((p) => {
            p.sendMsg({
                type: "QUESTION",
                prompt: this.currentQuestion.prompt,
                opt1: this.currentQuestion.opt1,
                opt2: this.currentQuestion.opt2,
                isA: p.isA
            });
        });
        this.midRound = true;
    }

    handleMsg(msg, player) {
        switch (msg.type) {
            case "ANSWER":
                if (!player.hasPlayed && this.midRound) {
                    this.currentQuestion.answer(msg.opt, player);
                    player.hasPlayed = true;
                }
                break;
            case "VOTE":
                if (!player.hasPlayed && this.midRound) {
                    this.currentQuestion.vote(msg.opt, player);
                    player.hasPlayed = true;
                }
                break;
            case "START":
                this.startRound();
                break;
        }

        if (this.midRound) {

            if (Object.values(this.groupA).every((p) => p.hasPlayed) && Object.values(this.groupB).every((p) => p.hasPlayed)) {
                this.midRound = false;
                if (this.currentQuestion.opt2Answers.length > this.currentQuestion.opt1Answers.length) {
                    this.currentQuestion.opt2Votes.forEach((p) => {
                        p.score++;
                    });
                } else if (this.currentQuestion.opt2Answers.length < this.currentQuestion.opt1Answers.length) {
                    this.currentQuestion.opt1Votes.forEach((p) => {
                        p.score++;
                    });
                } else {
                    //draw
                }

                this.sendMsgToAll({
                    type: "RESULT",
                    opt1: {
                        answers: this.currentQuestion.opt1Answers.map(p => p.username),
                        votes: this.currentQuestion.opt1Votes.map(p => p.username)
                    },
                    opt2: {
                        answers: this.currentQuestion.opt2Answers.map(p => p.username),
                        votes: this.currentQuestion.opt2Votes.map(p => p.username)
                    },
                    scores: Object.values(this.allPlayers).map(playerToViewModel).sort((a, b) => b.score - a.score)
                });
            }
        }
    }
}

exports.Game = WouldYouRather;
exports.id = type;
exports.title = "Would You Rather";
exports.desc = "";
