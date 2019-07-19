const Game = require("./game.js");
const type = "Killer";

//generate a ranodm int between lower and upper bound (upper bound not inclusive)
function randomInt(lower, upper) {
    return Math.floor(Math.random() * upper);
}

class Killer extends Game.AdminGame {
    constructor(gameId, creator) {
        super(gameId, creator);

        this.type = type;

        this.hasStarted = false;

        this.currentPlayerIndex = -1;

        this.players = [];

        this.toBeDrawn = [];
        this.through = [];

        this.losers = [];
    }

    determineWinner() {
        return null;
    }

    redraw() {
        this.toBeDrawn = this.through;
        this.through = [];
        this.losers = [];

        //inform the subscribers that the next round has been drawn
        this.sendMsgToAll({
            type: "redraw",
            status: this.status()
        });
    }

    draw() {
        let winner = this.determineWinner();
        if (!winner) {
            if (this.toBeDrawn.length > 0) {
                //select a player randomly
                this.currentPlayerIndex = randomInt(0, this.toBeDrawn.length);

                this.sendMsgToAll({
                    type: "draw",
                    player: this.toBeDrawn[this.currentPlayerIndex],
                    status: this.status()
                });
            } else if (this.through.length > 0) {
                this.redraw();
                this.draw();
            } else if (this.losers.length > 0){
    			//No one is through, reset the round
    			this.toBeDrawn = this.losers;
    			this.losers = [];

                this.sendMsgToAll({
                    type: "reset",
                    status: this.status()
                });

                //draw a new player
    			this.draw();
    		}
        } else {
            //TODO add win condition
        }

    }

    start(numLives) {
        this.hasStarted = true;

        //add lives for each player
        this.players.forEach((player) => {
            for (let i = 0; i < numLives; i++) {
                this.toBeDrawn.push(player);
            }
        });

        this.draw();
    }

    pot(extraLives) {
        if (this.currentPlayer !== -1) {
            extraLives = extraLives ? extraLives : 0;
            //add the player to the through list
            for (let i = 0; i <= extraLives; i++) {
                this.through.push(this.toBeDrawn[this.currentPlayerIndex]);
            }

            //remove the player from the current list
    	    this.toBeDrawn.splice(this.currentPlayerIndex, 1);

            this.draw();
    	} else {
            //TODO add error message
        }
    }

    miss() {
        if (this.currentPlayer !== -1) {
            //add the player to the losers list
            this.losers.push(this.toBeDrawn[this.currentPlayerIndex]);

            //remove the player from the current list
    	    this.toBeDrawn.splice(this.currentPlayerIndex, 1);

            this.draw();
    	} else {
            //TODO add error message
        }
    }

    replace() {
        this.draw();
    }

    restoreDrawnPlayer(player) {
        this.currentPlayer = this.toBeDrawn.indexOf(player);

        //if the operation performed removed the last instance of that player
        //do a replace
        if (this.currentPlayer === -1) {
            this.replace();
        }
    }

    addPoolPlayer(name) {
        console.log(this.players)
        this.players.push(name);

        console.log(this.players)

        this.sendMsgToAll({
            type: "addPlayer",
            status: this.status()
        });
    }

    removePoolPlayer(player, through) {
        try {
            if (this.hasStarted) {
                if (through) {
                    let index = this.through.indexOf(player);
                    //remove the player from the list
            	    this.through.splice(index, 1);
                } else {
                    let curPlayer = this.toBeDrawn[this.currentPlayerIndex];
                    let index = this.toBeDrawn.indexOf(player);
                    //remove the player from the list
            	    this.toBeDrawn.splice(index, 1);

                    //it is necessary to call replace, as the currentPlayer index
                    //will now be wrong
                    //this.replace();
                    this.restoreDrawnPlayer(curPlayer);
                }
            } else {
                let index = this.players.indexOf(player);
                //remove the player from the list
                this.players.splice(index, 1);
            }
        } catch (e) {}

        this.sendMsgToAll({
            type: "admin",
            status: this.status()
        });
    }

    putThrough(player) {
        try {
            let curPlayer = this.toBeDrawn[this.currentPlayerIndex];
            let index = this.toBeDrawn.indexOf(player);
            //remove the player from the list
            this.toBeDrawn.splice(index, 1);

            //it is necessary to call replace, as the currentPlayer index
            //will now be wrong
            //this.replace();
            this.restoreDrawnPlayer(curPlayer);
        } catch (e) {}

        this.through.push(player);
        this.sendMsgToAll({
            type: "admin",
            status: this.status()
        });
    }

    demote(player) {
        try {
            let index = this.through.indexOf(player);
            //remove the player from the list
    	    this.through.splice(index, 1);
        } catch (e) {}
        let curPlayer = this.toBeDrawn[this.currentPlayerIndex];
        this.toBeDrawn.push(player);

        //it is necessary to call replace, as the currentPlayer index
        //will now be wrong
        //this.replace();

        this.restoreDrawnPlayer(curPlayer);
        this.sendMsgToAll({
            type: "admin",
            status: this.status()
        });
    }

    status() {
        return {
            drawn: this.toBeDrawn[this.currentPlayerIndex],
            hasStarted: this.hasStarted,
            toBeDrawn: this.groupLives(this.toBeDrawn),
            through: this.groupLives(this.through),
            players: this.players
        };
    }


    handleMsg(msg, player) {
        if (msg.type === "ping") {
            player.sendMsg({
                type: "status",
                status: this.status()
            });
            return;
        }
        if (this.isAdmin(player.username)) {
            switch (msg.type) {
                case "pot":
                    this.pot(msg.extraLives);
                    break;
                case "miss":
                    this.miss();
                    break;
                case "replace":
                    this.replace();
                    break;
                case "start":
                    this.start(msg.lives);
                    break;
                case "addPlayer":
                    this.addPoolPlayer(msg.player);
                    break;
                case "removePlayer":
                    this.removePoolPlayer(msg.player, msg.through);
                    break;
                case "putThrough":
                    this.putThrough(msg.player);
                    break;
                case "demote":
                    this.demote(msg.player);
                    break;
                default:
                    console.log("Unsupported action " + msg.type);
                    console.log(msg);
                    break;
            }
        } else {
            let errMsg = player.username + " attempted to take action " + msg.type + " but isn't authorised";
            console.log(errMsg);
            sendMsgToAdmins({
                type: "info",
                msg: errMsg
            });
        }
    }

    groupLives(lives) {
        lives = lives.slice();
        lives.sort();

        let out = [];

		let groupingCount = 0;

		for (let i = 0; i < lives.length; i++) {

			if (i + 1 < lives.length && lives[i + 1] === lives[i]) {
				groupingCount++;
			} else if (groupingCount > 0) {
				let name = lives[i];

				//if this string says "flemming" or some variation
				if (name && name.match("[Ff]le[mM]*ing")) {
					name = "Fle" + Array(groupingCount + 2).join("m") + "ing";
				}

                out.push({
                    name: name,
                    lives: groupingCount + 1
                });

                groupingCount = 0;
			} else {
				let name = lives[i];

				//if this string says "flemming" or some variation
				if (name && name.match("[Ff]le[mM]*ing")) {
					name = "Fleming";
				}

                out.push({
                    name: name,
                    lives: groupingCount + 1
                });
			}
		}

        return out;
    }
}

exports.Game = Killer;
exports.id = type;
exports.title = "Killer";
exports.desc = "";
