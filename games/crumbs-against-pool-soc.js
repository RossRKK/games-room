const Game = require("./game.js");
const type = "Crumbs";

const deckFolder = './decks/';
const fs = require('fs');

let decks = [];

fs.readdirSync("./games/decks/").forEach(file => {
  console.log(file);
  decks.push(require(deckFolder + file));
});

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function randomCard(deck) {
    let i = Math.floor(Math.random() * deck.length);

    let card = deck[i];

    deck.splice(i, 1);

    return card;
}

const HAND_SIZE = 10;


class CrumbsPlayer extends Game.Player {
    constructor(username, ws) {
        super(username, ws);

        this.hasPlayed = false;
        this.hand = [];

        this.score = 0;
    }

    /**
     * Inform the client that some event occurred.
     * @param evt the event that occured.
     */
    pushHand(black) {
        this.ws.send(JSON.stringify({
            type: "hand",
            black,
            hand: this.hand
        }));
    }

    pushIsCzar(black) {
        this.ws.send(JSON.stringify({
            type: "czar",
            black
        }));
    }

    pushOptions(black, options) {
        this.ws.send(JSON.stringify({
            type: "options",
            black: black,
            options: options
        }));
    }

    pushWinner(winner, black, whites) {
        this.ws.send(JSON.stringify({
            type: "winner",
            winner,
            black,
            whites
        }));
    }

    pushPlayers(players) {
        this.ws.send(JSON.stringify({
            type: "players",
            players
        }));
    }
}

//TODO this handles players on it's own and should probably change to not do that
class Crumbs extends Game.Game {
    constructor(gameId, creator) {
        super(gameId, creator);

        this.type = type;

        this.playerMap = {};

        this.hasStarted = false;
        this.whites = [];
        this.blacks = [];

        decks.forEach((deck) => {
            this.whites = this.whites.concat(deck.whites);
            this.blacks = this.blacks.concat(deck.blacks);
        })

        shuffle(this.whites)
        shuffle(this.blacks)


        this.players = [];
        this.czarIndex = -1;

        this.black = null;

        this.responses = [];
    }

    startRound() {
        this.responses = [];
        //deal out some cards
        this.players.forEach((p) => {
            this.hasPlayed = false;
            p.dealHand(this.whites);
        });

        //change the czar
        this.czarIndex = (this.czarIndex + 1) % this.players.length;
        //get the czar
        let czar = this.players[this.czarIndex];

        this.black = randomCard(this.blacks);

        czar.pushIsCzar(this.black);

        //tell the players that the hand has started
        this.players.forEach((p, i) => {
            p.hasPlayed = false;
            if (i != this.czarIndex) {
                p.pushHand(this.black);
            }
        });

        this.pushPlayers();

        czar.hasPlayed = true;

        this.hasStarted = true;
    }

    handleResponse(player, msg) {
        //ignore this if the player has played
        if (!player.hasPlayed) {
            player.hasPlayed = true;

            let index = player.hand.indexOf(msg.cards);
            if (index > -1) {
                player.hand.splice(index, 1);
            }

            this.responses.push({
                username: player.username,
                cards: msg.cards
            });

            this.pushPlayers();
            this.checkForCompleteResponse();
        }
    }

    checkForCompleteResponse() {
        var allPlayed = true;

        this.players.forEach((p) => {
            if (!p.hasPlayed) {
                allPlayed = false;
            }
        });

        if (allPlayed) {
            //tell the czar
            let czar = this.players[this.czarIndex];

            if (czar) {
                czar.pushOptions(this.black, this.responses);
            } else {
                console.log("Czar index is " + this.czarIndex + " there are " + this.players.length + " players");
            }
        }
    }

    handleDecision(player, msg) {
        //ignore any message from a player that isn;t the czarIndex
        if (player.username === this.players[this.czarIndex].username) {
            this.players.forEach((p) => {
                if (p.username === msg.winner) {
                    p.score++;
                }
            })

            this.players.forEach((p, i) => {
                if (i != this.czarIndex) {
                    p.pushWinner(msg.winner, this.black, msg.cards);
                }
            });

            this.pushPlayers();

            //start the next round
            this.startRound();
        }
    }

    pushPlayers() {
        this.players.forEach((p) => {
            p.pushPlayers(this.players.map((p, i) => {
                return {
                    username: p.username,
                    score: p.score,
                    hasPlayed: p.hasPlayed,
                    isCzar: i === this.czarIndex
                };
            }));
        });
    }


    /**
     *  Add a client to the list of subscribed clients.
     *  @param client The client to add.
     */
    addPlayer(nonCrumbsPlayer) {
        let player = new CrumbsPlayer(nonCrumbsPlayer.username, nonCrumbsPlayer.ws);
        this.playerMap[nonCrumbsPlayer.username] = player;
        this.players.push(player);

        if (this.hasStarted) {
            player.dealHand(this.whites);
            player.pushHand(this.black);
        }

        this.pushPlayers();
    }

    /**
     *  Remove a client from the list of subscribed clients
     *  @param client The client to remove.
     */
    removePlayer(nonCrumbsPlayer) {
        let player = this.playerMap[nonCrumbsPlayer.username];
        delete  this.playerMap[nonCrumbsPlayer.username];
        let index = this.players.indexOf(player);
        if (index > -1) {
            this.players.splice(index, 1);
        }

        //update the clients
        this.checkForCompleteResponse();
        this.pushPlayers();

        //if the czar left
        if (index === this.czarIndex) {
            this.startRound();
        }
    }

    handleMessage(msg, nonCrumbsPlayer) {
        let player = this.playerMap[nonCrumbsPlayer.username];
        console.log(msg)
        //handle incoming messages from clients
        switch (msg.action) {
            case "start":
                this.startRound();
                break;
            case "response":
                //the ball was potted
                this.handleResponse(player, msg);
                break;
            case "decision":
                //the pot was missed
                this.handleDecision(player, msg);
                break;
            case "ping":
                //ignore ping messages
                break;
            default:
                console.log("Unsupported action: " + msg.action);
                break;
        }
    }
}

exports.Game = Crumbs;
exports.id = type;
exports.title = "Crumbs Against Pool Soc";
exports.desc = "";
