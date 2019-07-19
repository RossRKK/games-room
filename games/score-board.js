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

class ScoreBoard extends Game.Game {
    constructor(gameId) {
        super(gameId);

        this.player1 = new Player("Player 1", 0, "green");
        this.player2 = new Player("Player 2", 0, "green");
    }

    handleMsg(msg, player) {
        switch (msg.type) {
            case "SET-COLOURS":
                //update colours
                this.player1.colour = msg.colour1;
                this.player2.colour = msg.colour2;

                //TODO pusback update to clients
                break;
            case "UPDATE-SCORE":
                //update score
                this.player1.score = msg.score1;
                this.player2.score = msg.score2;

                //TODO pushback update to clients
                break;
            case "NEW-FRAME":
                //reset colours
                this.player1.colour = defaultColour;
                this.player2.colour = defaultColour;
                //TODO pause the clock (send pasue to clients)
                break;
            case "RESET-CLOCK":
            case "PAUSE-CLOCK":
                //TODO pass these back to the clients
                break;
        }
    }
}


exports.Game = ScoreBoard;
exports.id = type;
exports.title = "Score Board";
exports.desc = "";
