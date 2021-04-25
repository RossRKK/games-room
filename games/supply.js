const Game = require("./game.js");
const type = "Supply";

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

const aceSpecial = (game, player, special) => {

};

const kingSpecial = (game, player, special) => {

};

const queenSpecial = (game, player, special) => {

};

const jackSpecial = (game, player, special) => {

};

const MONEY = 'MONEY';
const ATTACK = 'ATTACK';
const DEFENCE = 'DEFENCE';
const cardTypes = [MONEY, ATTACK, DEFENCE];

class Card {
  constructor(type, value, cost, special) {
    this.type = type;
    this.value = value;
    this.special = special;
  }
}

const PLAY_LIMIT = 3;
const HAND_SIZE = 5;
const LOWEST_STARTING_MONEY = 2;
const LARGEST_STARTING_MONEY = 4;
const STARTING_HEALTH = 30;
class SupplyPlayer extends Game.Player {
  constructor (username, ws) {
    super(username, ws);

    //whether the player is ready to start
    this.ready = false;

    this.health = STARTING_HEALTH;

    //turn specific properties
    this.cardsPlayed = 0;
    this.moneyPool = 0;
    this.attackPool = 0;
    this.newDefence = []; //temporary pool that forms a new defensive barrier

    //TODO initialise with starting hand
    this.hand = [];
    for (let i = LOWEST_STARTING_MONEY; i <= LARGEST_STARTING_MONEY; i++) {
      this.hand.push(new Card(MONEY,i,i,null));
    }

    //this players current deck
    this.deck = [];

    // //this players current 'play area'
    // this.playArea = [];

    //this players current defences
    this.defences = [];
  }

  resetForNextTurn() {
    this.cardsPlayed = 0;
    this.moneyPool = 0;
    this.attackPool = 0;
    this.newDefence = [];
  }

  lookupFromHand(cardIndex) {
    return this.hand[cardIndex];
  }

  removeFromHand(cardIndex) {
    this.hand.splice(cardIndex, 1);
  }

  playCard(card, game, special) {
    if (this.cardsPlayed < PLAY_LIMIT) {
      switch (card.type) {
        case MONEY:
          this.moneyPool += card.value;
          break;
        case ATTACK:
          this.attackPool += card.value;
          break;
        case DEFENCE:
          this.newDefence.push(card);
          break;
      }

      //play the cards special
      if (card.special) {
        card.special(game, player, special);
      }
      return true;
    } else {
      return false;
    }
  }

  draw(count) {
    let drawn = [];
    //draw new cards
    for (let i = 0; i < count; i++) {
      if (deck.length > 0) {
        drawn.push(deck.pop());
      } else {
        //re-suffle discard to form new deck
        this.deck = shuffle(this.discard);
        this.discard = [];
      }
    }

    return drawn;
  }

  acquire(card) {
    //add acquired card to discard pile
    this.discard.push(card);
  }

  endTurn() {
    //reset pools for next turn
    resetForNextTurn();

    //draw up to correct number of cards
    let missing = HAND_SIZE - this.hand.length;
    this.draw(missing);
  }
}

function constructDeck() {
  let deck = [];
  let lookup = {};

  //add standard value cards
  for (let i = 2; i <= 10; i++) {
    //2 sets of money cards
    //exclude the starting cards
    if (i > LARGEST_STARTING_MONEY) {
      deck.push(new Card(MONEY,i,i,null));
      deck.push(new Card(MONEY,i,i,null));
    }

    //attack cards
    deck.push(new Card(ATTACK,i,i,null));

    //defence cards
    deck.push(new Card(DEFENCE,i,i,null));
  }

  return deck;
}

const SUPPLY_ROW_SIZE = 5;

class Supply extends Game.Game {
  constructor (gameId) {
    super(gameId);

    this.type = type;
    this.player = SupplyPlayer;

    // populate supply deck
    this.deck = constructDeck();

    this.supplyRow = [];

    this.scrapped = [];

    //mechanism for tracking the current player
    this.currentPlayer = null;
    this.playOrder = [];
  }

  addPlayer(player) {
    if (Object.keys(this.allPlayers).length >= 2) {
      throw "Only 2 players can play";
    } else {
      super.addPlayer(player);
    }

    if (Object.keys(this.allPlayers).length == 2) {
      this.start();
    }
  }

  allReady() {
    return this.allPlayers.map(x => x.ready).reduce((x,y) => x && y);
  }

  start() {
    this.log('Starting');
    //randomise player order
    this.playOrder = shuffle(Object.keys(this.allPlayers));

    if (this.playOrder.length != 2) {
      throw 'Must have exactly 2 players';
    }

    //suffle the deck
    this.deck = shuffle(this.deck);

    //draw the supply row
    for (let i = 0; i < SUPPLY_ROW_SIZE; i++) {
      this.supplyRow.push(this.deck.pop());
    }

    //pop the current player
    this.currentPlayer = this.playOrder.pop();

    this.sendStatus();
  }

  sendStatus() {
    //send current state to the players
    let alice = this.allPlayers[this.currentPlayer];
    let bob = this.allPlayers[this.playOrder[0]];

    alice.sendMsg(this.status(alice, bob));
    bob.sendMsg(this.status(bob, alice))
  }

  status(player, opponent) {
    return {
      type: 'status',
      player: {
        health: player.health,
        hand: player.hand,
        defences: player.defences,
        discard: player.discard
      },
      opponent: {
        name: opponent.username,
        health: opponent.health,
        defences: opponent.defences,
        discard: opponent.discard
      },
      currentPlayer: this.currentPlayer,
      supplyRow: this.supplyRow,
      scrapped: this.scrapped
    }
  }

  handleMsg(msg, player) {
    //let the super class handle the message first
    if (super.handleMsg(msg, player)) {
      return true;
    }

    this.log(msg.type);
    //handle incoming messages from clients
    switch (msg.type) {
        case 'ready':
          //indicate that the player is ready
          player.ready = true;
          //start if all players are ready
          if (this.allReady()) {
            this.start();
          }
          break;
        case 'play':
          if (this.currentPlayer == player.username) {
            //a card was played
            let card = player.lookupFromHand(msg.cardIndex);
            player.playCard(card, this, msg.special); //TODO handle failure

            this.sendStatus();
          }
          break;
        case 'attack':
          //attack opponent
          if (this.currentPlayer == player.username) {
            //TODO allow the player to specify a target
            let opponent = this.allPlayers[this.playOrder[0]];

            opponent.health -= player.attackPool;
            player.attackPool = 0;
            this.sendStatus();
          }
          break;
        case 'acquire':
          //buy a new card
          if (this.currentPlayer == player.username) {
            let targetCard = this.supplyRow[targetCardIndex];

            if (targetCard.cost < player.moneyPool) {
              player.acquire(targetCard);

              //draw a new card to replace it
              if (deck.length <= 0) {
                this.deck = suffle(this.scrapped);
                this.scrapped = [];
              }
              this.supplyRow[targetCardIndex] = this.deck.pop();
            }
          }
          break;
        case 'scrap':
          //scrap the supply row
          if (this.currentPlayer == player.username) {
            //TODO scrap the supply row
          }
        case 'pass':
          // pass turn to the next player
          if (this.currentPlayer == player.username) {
            //pass the turn to the next player
            player.endTurn();
            this.playOrder.push(this.currentPlayer);
            this.currentPlayer = this.playOrder.pop();
          }
          break;
        case "ping":
            //ignore ping messages
            break;
        default:
            return false; //no action was taken
    }

    //an action was taken
    return true;

    return false;
  }
}

exports.Game = Supply;
exports.id = type;
exports.title = "Supply";
exports.desc = "";