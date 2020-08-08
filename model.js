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

const GAME_TIMEOUT = 10 * 60 * 1000; //10 mins

//kill a game, after time has elapsed
function killGame(id) {
    console.log("Killing " + id);
    //close all websockets
    let game = onGoingGames[id];

    Object.values(game.allPlayers).forEach((p, i) => {
        p.ws.close();
    });

    //delete the game from memory
    delete onGoingGames[id];
}

function resetTimeout(game) {
    //clear existing timeout
    if (game.timeout) {
        clearTimeout(game.timeout);
    }

    //create a new one
    game.timeout = setTimeout(killGame, GAME_TIMEOUT, game.id);
}

exports.resetTimeoutForGame = function (id) {
    resetTimeout(onGoingGames[id]);
}

exports.startGame = function (gameType) {
    //check if a game type with that id exists
    if (gameTypes[gameType]) {
        let id = generateGameId();
        console.log(id);

        let game = new gameTypes[gameType].Game(id);
        onGoingGames[id] = game;

        resetTimeout(game);

        return game;
    } else {
        console.log("No game of type " + gameType);
        //there isn't a type of game with that id
        return null;
    }
}

exports.getGame = function (id) {
    id = id.toUpperCase();
    console.log(Object.keys(onGoingGames))
    return onGoingGames[id];
}

exports.getGameTypes = () => gameTypes;

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
