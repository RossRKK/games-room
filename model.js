let gameTypes = require("./games");

let onGoingGames = {};

const allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const codeLength = 4;
function generateGameId() {
    let id = "";

    for (var i = 0; i < codeLength; i++) {
        id += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }

    return id;
}

exports.startGame = function (gameType, player) {
    //check if a game type with that id exists
    if (gameTypes[gameType]) {
        let id = generateGameId();
        console.log(id);

        let game = new gameTypes[gameType].Game(id, player);
        onGoingGames[id] = game;

        return game;
    } else {
        console.log("No game of type " + gameType);
        //there isn't a type of game with that id
        return null;
    }
}

exports.getGame = function (id) {
    id = id.toUpperCase();
    return onGoingGames[id];
}

exports.getGameTypes = () => gameTypes;

class Player {
    constructor (username, ws) {
        this.username = username;
        this.ws = ws;
    }

    sendMsg(msg) {
        console.log(msg);
        this.ws.send(JSON.stringify(msg));
    }
}

exports.Player = Player;
