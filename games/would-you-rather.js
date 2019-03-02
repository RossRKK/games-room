const Game = require("./game.js");

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

        //TODO load questions
        this.questions = [];
        this.currentQuestion = new Question("Test Question", "Opt1", "Opt2");
        this.questions.push(this.currentQuestion);

        this.groupA = {};this.opt1Answers = [];
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
    }

    addPlayer(player) {
        super.addPlayer(player);
        //add the player to the smaller group
        if (Object.keys(this.groupA).length > Object.keys(this.groupB).length) {
            this.groupB[player.username] = player;

            // player.sendMsg({
            //     type: "TEAM",
            //     team: "B"
            // });

            player.isA = false;
        } else {
            this.groupA[player.username] = player;

            // player.sendMsg({
            //     type: "TEAM",
            //     team: "A"this.opt1Answers = [];
        this.opt2Answers = [];

        this.opt1Votes = [];
        this.opt2Votes = [];
            // });
            player.isA = true;
        }

        player.hasPlayed = false;
        player.score = 0;
    }

    removePlayer(player) {
        super.removePlayer();
        if (player.isA) {
            delete this.groupA[player.username];
        } else {this.currentQuestionbreak;
            delete this.groupB[player.username];
        }
    }

    startRound() {
        console.log("Starting round");
        Object.values(this.allPlayers).forEach((p) => { p.hasPlayed = false });

        //swap the groups round
        let temp = this.groupA;
        this.groupA = this.groupB;
        this.groupB = temp;


        Object.values(this.groupA).forEach((p) => {
            p.isA = true;
            // p.sendMsg({
            //     type: "TEAM",
            //     team: "A"
            // });
        });

        Object.values(this.groupB).forEach((p) => {
            p.isA = false;
            // p.sendMsg({
            //     type: "TEAM",
            //     team: "B"
            // });
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
        console.log("done")
    }

    handleMsg(msg, player) {
        console.log(msg);
        switch (msg.type) {
            case "ANSWER":
                this.currentQuestion.answer(msg.opt, player);
                player.hasPlayed = true;

                break;
            case "VOTE":
                this.currentQuestion.vote(msg.opt, player);
                player.hasPlayed = true;
                break;
            case "START":
                this.startRound();
                break;
        }

        //if everyone has played, push back the resul{opt1: {
        if (Object.values(this.groupA).every((p) => p.hasPlayed) && Object.values(this.groupB).every((p) => p.hasPlayed)) {
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
                scores: Object.values(this.allPlayers).map((p) => { return { username: p.username, score: p.score } })
            });
        }
    }
}

exports.Game = WouldYouRather;
exports.id = "WouldYouRather";
exports.title = "Would You Rather";
exports.desc = "";
