const express = require('express');

const app = express();

const expressWs = require('express-ws')(app);

const model = require("./model.js");

const controller = require("./controller.js");


app.use(express.static("static"));

app.ws("/:gameType/:gameId/:username", function (ws, req) {
    console.log("Got connection");

    console.log(req.params);

    let player = new model.Player(req.params.username, ws);
    console.log(player);

    let game = model.getGame(req.params.gameId);

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
        console.log(msg);
        game.handleMsg(msg, player);
    });

    ws.on('close', function () {
        game.handleClose(player);
    });

    ws.on('error', function (err) {
        console.err(err);
        game.handleError(player);
    });
});

const port = process.env.PORT ? process.env.PORT : 8080;

app.listen(port, () => {
    console.log("Hosted here localhost:" + port);
})
