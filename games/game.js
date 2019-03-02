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
        delete this.allPlayers[player.username];
    }

    handleError(player) {
        delete this.allPlayers[player.username];
    }
}

exports.Game = Game;
