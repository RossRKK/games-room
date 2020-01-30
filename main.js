const express = require('express');

const app = express();

const expressWs = require('express-ws')(app);

const model = require("./model.js");

const controller = require("./controller.js");

const Game = require("./games/game.js");

app.use(express.static("static"));

app.get("/games", (req, res) => {
    res.send(Object.values(model.getGameTypes()).map(g => {
        console.log(g)
        return {
            id: g.id,
            title: g.title,
            desc: g.desc
        };
    }));
});

function handleWebSocket(ws, req) {
    try {
        console.log("Got connection \"" + req.params.gameType + "\" \"" + req.params.gameId + "\" \"" + req.params.username + "\"");

        // let player = new Game.Player(req.params.username, ws);
        let player;

        let game;

        if (req.params.gameId) {
            game = model.getGame(req.params.gameId);
        }

        //whether the requesting player is creating the game
        let isCreator = false;

        if (!game) {
            game = model.startGame(req.params.gameType);
            isCreator = true;
        }

        if (game) {
            //create a player of type matching the game
            player = new game.Player(req.params.username, ws);

            ws.send(JSON.stringify({
                type: "ID",
                id: game.id,
                gameType: game.type

            }));

            game.addPlayer(player);

            //make the player an admin
            if (isCreator && game.addAdmin) {
                game.addAdmin(player.username);
            }
        } else {
            ws.send("Error starting game");
            ws.close();
        }

        ws.on('message', function (msg) {
            try {
                msg = JSON.parse(msg);

                //ignore ping messages
                if (msg.type !== "ping") {
                    game.handleMsg(msg, player);
                }

                model.resetTimeoutForGame(game.id);
            } catch (ex) {
                console.log(ex);
            }
        });

        ws.on('close', function () {
            try {
                game.handleClose(player);
            } catch (ex) {
                console.log(ex);
            }
        });

        ws.on('error', function (err) {
            try {
                console.err(err);
                game.handleError(err, player);
            } catch (ex) {
                console.log(ex);
            }
        });
    } catch (ex) {
        console.log(ex);
    }
}

app.ws("/:gameType/:username/:gameId", handleWebSocket);
app.ws("/:gameType/:username", handleWebSocket);

const port = process.env.PORT ? process.env.PORT : 8080;

app.listen(port, () => {
    console.log("Hosted here http://localhost:" + port);
})
