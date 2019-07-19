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
        delete this.allPlayers[player.username];
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

class AdminGame extends Game {
    constructor(gameId, creator) {
        super(gameId);

        this.admins = {
        };

        this.admins[creator.username] = creator;
    }

    removePlayer(player) {
        delete this.admins[player.username];
        super.removePlayer(player);
    }

    isAdmin(username) {
        return this.admins[username] !== undefined;
    }

    addAdmin(player) {
        this.admins[player.username] = player;
    }

    removeAdmin(username) {
        delete this.admins[username];
    }

    sendMsgToAdmins(msg) {
        this.sendMsgToGroup(msg, this.admins);
    }
}

exports.AdminGame = AdminGame;

exports.Game = Game;
