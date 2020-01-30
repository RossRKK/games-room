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

class Game {
    constructor(gameId) {
        this.id = gameId;

        this.allPlayers = {};

        this.Player = Player;
    }

    log(msg) {
        console.log(this.id + ": " + msg);
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

exports.Game = Game;

class AdminGame extends Game {
    constructor(gameId) {
        super(gameId);

        this.admins = {};
    }

    removePlayer(player) {
        delete this.admins[player.username];
        super.removePlayer(player);
    }

    isAdmin(username) {
        return username in this.admins;
    }

    addAdmin(player) {
        this.admins[player.username] = player;

        player.sendMsg({
            type: "admin",
            isAdmin: true
        });
    }

    removeAdmin(username) {
        delete this.admins[username];

        player.sendMsg({
            type: "admin",
            isAdmin: false
        });
    }

    sendMsgToAdmins(msg) {
        this.sendMsgToGroup(msg, this.admins);
    }
}

exports.AdminGame = AdminGame;
