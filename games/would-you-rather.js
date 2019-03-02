const Game = require("./game.js");

class WouldYouRather extends Game.Game {
    constructor (gameId) {
        super(gameId);
    }
}

exports.Game = WouldYouRather;
exports.id = "WouldYouRather";
exports.title = "Would You Rather";
exports.desc = "";
