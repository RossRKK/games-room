const Game = require("./game.js");
const type = "ScoreBoard";

const defaultColour = "green";

class Player {
    constructor(name, score, colour) {
        this.name = name;
        this.score = score;
        this.colour = colour;
    }
}

class ScoreBoard extends Game.AdminGame {
    constructor(gameId) {
        super(gameId);

        this.type = type;

        this.poolPlayer1 = new Player("Player 1", 0, "green");
        this.poolPlayer2 = new Player("Player 2", 0, "green");

        this.clockStart = null;

        this.clockElapsed = 0;
    }

    status() {
        return {
            player1: this.poolPlayer1,
            player2: this.poolPlayer2,
            clockStart: this.clockStart,
            clockElapsed: this.clockElapsed
        }
    }

    sendStatus() {
        this.sendMsgToAll({
            type: "status",
            status: this.status()
        });
    }

    handleMsg(msg, player) {
        if (this.isAdmin(player.username)) {
            console.log(msg);
            switch (msg.type) {
                case "SET-COLOURS":
                    //update colours
                    console.log("Setting");
                    this.poolPlayer1.colour = msg.colour1;
                    this.poolPlayer2.colour = msg.colour2;

                    //pusback update to clients
                    this.sendStatus();
                    break;
                case "UPDATE-SCORE":
                    //update score
                    this.poolPlayer1.score = msg.score1;
                    this.poolPlayer2.score = msg.score2;

                    //pushback update to clients
                    this.sendStatus();
                    break;
                case "NEW-FRAME":
                    //reset colours
                    this.poolPlayer1.colour = defaultColour;
                    this.poolPlayer2.colour = defaultColour;

                    this.clockStart = null;

                    this.sendStatus();
                    break;
                case "RESET-CLOCK":
                    this.clockElapsed = 0;
                    this.clockStart = new Date();

                    this.sendStatus();
                    break;
                case "PAUSE-CLOCK":
                    //pass these back to the clients
                    this.clockElapsed += new Date() - this.clockStart;
                    this.clockStart = null;

                    this.sendStatus();
                    break;
                case "RESUME-CLOCK":
                    this.clockStart = new Date();

                    this.sendStatus();
                    break;
                default:
                    this.log("Unknown message type " + msg.type);
            }
        } else {
            this.log(player.username + " attempted top take unauthorised action");
        }
    }
}


exports.Game = ScoreBoard;
exports.id = type;
exports.title = "Score Board";
exports.desc = "";
