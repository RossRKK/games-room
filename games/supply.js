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

const aceSpecial = (game, player, special, index) => {
  if (special != index) {
    //if the ace was in a lower index than the target scrap card
    //the index of that scrap card is now 1 less
    //because the ace has been removed by this point
    if (index < special) {
      special -= 1;
    }
    //special is set to the index of the card to scrap by the client
    let targetCard = player.lookupFromHand(special);

    //remove the card from hand
    player.removeFromHand(special);

    //add to scrap pile
    game.scrapped.push(targetCard);
  } else {
    game.rejectAction(player, 'The ace cannot scrap itself');
  }
};

const kingSpecial = (game, player, special, index) => {
  player.health += 5;
};

const queenSpecial = (game, player, special, index) => {
  player.draw(1);
  player.cardsPlayed -= 1;
};

const jackSpecial = (game, player, special, index) => {
  let opponent = game.allPlayers[game.playOrder[0]];
  opponent.mustDiscard++;
};

const MONEY = 'MONEY';
const ATTACK = 'ATTACK';
const DEFENCE = 'DEFENCE';
const cardTypes = [MONEY, ATTACK, DEFENCE];

class Card {
  constructor(type, value, cost, displayValue, special) {
    this.displayValue = displayValue;
    this.type = type;
    this.value = value;
    this.cost = cost;
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

    //the number of cards this player must dicard at the start of their next turn
    this.mustDiscard = 0;

    //TODO initialise with starting hand
    this.hand = [];
    for (let i = LOWEST_STARTING_MONEY; i <= LARGEST_STARTING_MONEY; i++) {
      this.hand.push(new Card(MONEY,i,i,i,null));
    }

    //this players current deck
    this.deck = [];

    //this players current 'play area'
    this.playArea = [];

    //this players current defences
    this.defences = [];

    //the players current discard pile
    this.discard = [];

    //cards this player has reserved (i.e. their money ace)
    this.reserve = [];
    this.reserve.push(new Card(MONEY,1,15,'A',aceSpecial));
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

  playCard(card, game, special, index) {
    if (this.cardsPlayed < PLAY_LIMIT) {
      //remove from hand in order to play
      this.removeFromHand(index);

      switch (card.type) {
        case MONEY:
          this.moneyPool += card.value;
          this.playArea.push(card);
          break;
        case ATTACK:
          this.attackPool += card.value;
          this.playArea.push(card);
          break;
        case DEFENCE:
          this.newDefence.push(card);
          //do not add to play area
          break;
      }

      //play the cards special
      if (card.special) {
        card.special(game, this, special, index);
      }

      this.cardsPlayed++;
      return true;
    } else {
      return false;
    }
  }

  draw(count) {
    //draw new cards
    for (let i = 0; i < count; i++) {

      if (this.deck.length > 0) {
        this.hand.push(this.deck.pop());
      } else {
        //re-suffle discard to form new deck
        this.deck = shuffle(this.discard);
        this.discard = [];
        if (this.deck.length > 0) {
          this.hand.push(this.deck.pop());
        } else {
          //we cannot draw more cards
          break;
        }
      }
    }
  }

  acquire(card) {
    //add acquired card to discard pile
    this.discard.push(card);
    this.moneyPool -= card.cost;
  }

  endTurn() {
    //create the new defence permeneantly
    if (this.newDefence.length > 0) {
      this.defences.push(this.newDefence);
    }

    //reset pools for next turn
    this.resetForNextTurn();

    this.discard = this.discard.concat(this.playArea);
    this.playArea = [];

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
      deck.push(new Card(MONEY,i,i,i,null));
      deck.push(new Card(MONEY,i,i,i,null));
    }

    //attack cards
    deck.push(new Card(ATTACK,i,i,i,null));

    //defence cards
    deck.push(new Card(DEFENCE,i,i,i,null));
  }

  deck.push(new Card(ATTACK,1,15,'A',aceSpecial));
  deck.push(new Card(DEFENCE,1,15,'A',aceSpecial));

  deck.push(new Card(MONEY,10,15,'J',jackSpecial));
  deck.push(new Card(MONEY,10,15,'J',jackSpecial));
  deck.push(new Card(ATTACK,10,15,'J',jackSpecial));
  deck.push(new Card(DEFENCE,10,15,'J',jackSpecial));

  deck.push(new Card(MONEY,10,15,'Q',queenSpecial));
  deck.push(new Card(MONEY,10,15,'Q',queenSpecial));
  deck.push(new Card(ATTACK,10,15,'Q',queenSpecial));
  deck.push(new Card(DEFENCE,10,15,'Q',queenSpecial));

  deck.push(new Card(MONEY,10,15,'K',kingSpecial));
  deck.push(new Card(MONEY,10,15,'K',kingSpecial));
  deck.push(new Card(ATTACK,10,15,'K',kingSpecial));
  deck.push(new Card(DEFENCE,10,15,'K',kingSpecial));

  return deck;
}

const SUPPLY_ROW_SIZE = 5;

class Supply extends Game.Game {
  constructor (gameId) {
    super(gameId);

    this.type = type;
    this.Player = SupplyPlayer;

    // populate supply deck
    this.deck = constructDeck();

    this.supplyRow = [];

    this.scrapped = [];

    //mechanism for tracking the current player
    this.currentPlayer = null;
    this.playOrder = [];

    this.winner = null;
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
    this.currentPlayer = this.playOrder.shift();

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
      winner: this.winner ? this.winner.username : null,
      player: {
        health: player.health,
        hand: player.hand,
        defences: player.defences,
        deckCount: player.deck.length,
        discard: player.discard,
        playArea: player.playArea,
        attackPool: player.attackPool,
        moneyPool: player.moneyPool,
        newDefence: player.newDefence,
        mustDiscard: player.mustDiscard,
        toPlay: PLAY_LIMIT - player.cardsPlayed,
        reserve: player.reserve
      },
      opponent: {
        name: opponent.username,
        health: opponent.health,
        defences: opponent.defences,
        deckCount: opponent.deck.length,
        discard: opponent.discard,
        playArea: opponent.playArea,
        handCount: opponent.hand.length,
        attackPool: opponent.attackPool,
        moneyPool: opponent.moneyPool,
        newDefence: opponent.newDefence,
        mustDiscard: opponent.mustDiscard,
        reserve: opponent.reserve
      },
      currentPlayer: this.currentPlayer,
      supplyRow: this.supplyRow,
      scrapped: this.scrapped
    }
  }

  rejectAction(player, msg) {
    player.ws.send(JSON.stringify({
      type: 'reject',
      msg: msg
    }));
  }

  sendWinner() {
    this.sendMsgToAll({
      type: 'winner',
      winner: this.winner.username
    });
  }

  handleMsg(msg, player) {
    //let the super class handle the message first
    if (super.handleMsg(msg, player)) {
      return true;
    }

    this.log(msg.type);

    if (msg.type != 'ping' && this.winner) {
      this.rejectAction(player, 'Cannot take action. ' + this.winner.username + ' has won.');
      return true;
    }

    //handle incoming messages from clients
    switch (msg.type) {
        case 'play':
          if (this.currentPlayer == player.username) {
            //a card was played
            let card = player.lookupFromHand(msg.cardIndex);
            if (player.mustDiscard > 0) {
              //discard without action
              player.removeFromHand(msg.cardIndex);
              player.mustDiscard--;
              player.cardsPlayed++; //this counts as playing a card

              this.sendStatus();
            } else if (player.playCard(card, this, msg.special, msg.cardIndex)) {

              this.sendStatus();
            } else {
              this.rejectAction(player, 'You can only play ' + PLAY_LIMIT + ' cards per turn');
            }
          } else {
            this.rejectAction(player, 'It is not your turn');
          }
          break;
        case 'attack':
          //attack opponent
          if (this.currentPlayer == player.username) {
            let opponent = this.allPlayers[this.playOrder[0]];

            if (msg.cardIndex == null) {
              if (opponent.defences.length == 0) {
                opponent.health -= player.attackPool;
                player.attackPool = 0;
              } else {
                this.rejectAction(player, 'You must attack defences first');
              }
            } else {
              let defenceIndex = msg.cardIndex;

              let defence = opponent.defences[defenceIndex];

              let defenceTotal = defence.map(x => x.value).reduce((x,y) => x+y);

              if (player.attackPool >= defenceTotal) {
                player.attackPool -= defenceTotal;

                //destroy target defence
                opponent.defences.splice(defenceIndex, 1);

                opponent.discard = opponent.discard.concat(defence);
              } else {
                this.rejectAction(player, 'Insufficent attack points to destroy this defence');
              }
            }

            if (opponent.health <= 0) {
              this.winner = player;
              this.sendWinner();
            }

            this.sendStatus();
          } else {
            this.rejectAction(player, 'It is not your turn');
          }
          break;
        case 'acquire':
          //buy a new card
          if (this.currentPlayer == player.username) {
            let targetCard = msg.reserved
              ? player.reserve[msg.cardIndex]
              : this.supplyRow[msg.cardIndex];

            if (targetCard.cost <= player.moneyPool) {
              player.acquire(targetCard);

              if (msg.reserved) {
                player.reserve.splice(msg.cardIndex,1);
              } else {
                //draw a new card to replace it
                if (this.deck.length <= 0) {
                  this.deck = shuffle(this.scrapped);
                  this.scrapped = [];
                }

                this.supplyRow[msg.cardIndex] = this.deck.pop();
              }
            } else {
              this.rejectAction(player, 'Insufficent money to acquire this card');
            }

            this.sendStatus();
          } else {
            this.rejectAction(player, 'It is not your turn');
          }
          break;
        case 'scrap':
          //scrap the supply row
          if (this.currentPlayer == player.username) {
            // scrap the supply row
            let moneyCards = 0;
            let specialCards = 0;

            for (let i = 0; i < this.supplyRow.length; i++) {
              if (this.supplyRow[i].special != null) {
                specialCards++;
              }
              if (this.supplyRow[i].type == MONEY) {
                moneyCards++;
              }
            }

            if (moneyCards >= 3 || specialCards >= 3) {
              this.scrapped = this.scrapped.concat(this.supplyRow);
              this.supplyRow = [];

              //draw the supply row
              for (let i = 0; i < SUPPLY_ROW_SIZE; i++) {
                //draw a new card to replace it
                if (this.deck.length <= 0) {
                  this.deck = shuffle(this.scrapped);
                  this.scrapped = [];
                }
                this.supplyRow.push(this.deck.pop());
              }
              this.sendStatus();
            } else {
              this.rejectAction(player, 'There must be 3 special or money cards to scrap the supply row');
            }
          } else {
            this.rejectAction(player, 'It is not your turn');
          }
          break;
        case 'pass':
          // pass turn to the next player
          if (this.currentPlayer == player.username) {
            //pass the turn to the next player
            player.endTurn();
            this.playOrder.push(this.currentPlayer);
            this.currentPlayer = this.playOrder.shift();

            this.sendStatus();
          } else {
            this.rejectAction(player, 'It is not your turn');
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
