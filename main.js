const express = require('express');

const app = express();

const expressWs = require('express-ws')(app);

const model = require("./model.js");

const controller = require("./controller.js");


app.use(express.static("static"));



function handleWebSocket(ws, req) {
    console.log(req.params)
    console.log("Got connection \"" + req.params.gameType + "\" \"" + req.params.gameId + "\" \"" + req.params.username + "\"");

    let player = new model.Player(req.params.username, ws);

    let game;

    if (req.params.gameId) {
        game = model.getGame(req.params.gameId);
    }

    if (!game) {
        console.log("Starting new game");
        game = new model.startGame(req.params.gameType);
    }

    if (game) {
        console.log("Adding player");
        game.addPlayer(player);
    } else {
        ws.send("Error starting game");
        ws.close();
    }

    ws.on('message', function (msg) {
        console.log("Hello")
        console.log(msg);
        msg = JSON.parse(msg);
        game.handleMsg(msg, player);
    });

    ws.on('close', function () {
        game.handleClose(player);
    });

    ws.on('error', function (err) {
        console.err(err);
        game.handleError(err, player);
    });
}

app.ws("/:gameType/:username/:gameId", handleWebSocket);
app.ws("/:gameType/:username", handleWebSocket);

const port = process.env.PORT ? process.env.PORT : 8080;

app.listen(port, () => {
    console.log("Hosted here localhost:" + port);
})
