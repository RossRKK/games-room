class Game {
    constructor(gameId) {
        this.id = gameId;

        this.allPlayers = {};
    }

    addPlayer(player) {
        if (this.allPlayers[player.username]) {
            throw "Tried to add existing player";
        } else {
            this.allPlayers[player.username] = player;
        }
    }

    removePlayer(player) {
        if (player) {
            delete this.allPlayers[player.username];
        }
    }

    sendMsgToGroup(msg, group) {
        Object.values(group).forEach((player) => {
            player.sendMsg(msg);
        });
    }

    sendMsgToAll(msg) {
        this.sendMsgToGroup(msg, this.allPlayers);
    }

    //should be overriden
    handleMsg(msg, player) {
        player.sendMsg(msg);
    }

    handleClose(player) {
        this.removePlayer(player);
    }

    handleError(err, player) {
        this.removePlayer(player);
    }
}

exports.Game = Game;
