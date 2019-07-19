const express = require('express');

const app = express();

const expressWs = require('express-ws')(app);

const model = require("./model.js");

const controller = require("./controller.js");


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

        let player = new model.Player(req.params.username, ws);

        console.log(player.username)

        let game;

        if (req.params.gameId) {
            game = model.getGame(req.params.gameId);
        }

        if (!game) {
            game = model.startGame(req.params.gameType, player);
        }

        console.log("Created game")

        if (game) {
            ws.send(JSON.stringify({
                type: "ID",
                id: game.id,
                gameType: game.type
            }));

            game.addPlayer(player);
        } else {
            ws.send("Error starting game");
            ws.close();
        }

        ws.on('message', function (msg) {
            try {
                msg = JSON.parse(msg);
                console.log(msg);
                game.handleMsg(msg, player);
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
