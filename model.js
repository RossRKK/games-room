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

exports.startGame = function (gameType) {
    //check if a game type with that id exists
    if (gameTypes[gameType]) {
        let id = generateGameId();
        console.log(id);

        let game = new gameTypes[gameType](id);
        onGoingGames[id] = game;

        console.log("Constructed new game");

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

class Player {
    constructor (username, ws) {
        this.username = username;
        this.ws = ws;
    }

    sendMsg(msg) {
        this.ws.send(JSON.stringify(msg));
    }
}

exports.Player = Player;
