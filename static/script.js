"use strict";

var gameTypes = {
    WouldYouRather: WouldYouRather,
    Killer: Killer
}

var gameType = "WouldYouRather";

var ws;

var user;

function joinGame(user, gameId) {
    ws = openWebSocket(null, user, gameId);

    handleWebSocket(ws);

    $("#join").hide();

    $("#game").show();
}

$(document).ready(function () {
    if (window.location.pathname) {
        var parts = window.location.pathname.split('/');
        joinGame(parts[0], parts[1]);
    } else {
        $("#game").hide();

        $("#join-btn").on("click", function (e) {
            var user = $("#name").val();
            var gameId = $("#game-id").val();

            joinGame(user, gameId);
        });
    }

    var games = $.get("/games").done(function (games) {
        console.log(games);
        addGameButtons(games);
    })

});

function addGameButtons(games) {
    games.forEach(function (game) {
        var btn = document.createElement("button");
        btn["data-game"] = game;
        btn.innerText = game.title;

        btn.className = "btn btn-primary";

        btn.onclick = function (e) {
            var game = e.target["data-game"];
            gameType = game.id;

            $("#header").text(game.title);
            document.title = game.title;

            user = $("#name").val();
            ws = openWebSocket(gameType, user);

            handleWebSocket(ws);

            $("#join").hide();
            $("#game").show();
        }

        $("#games").append(btn);
    });
}

function openWebSocket(gameType, username, gameId) {
    var loc = window.location, new_uri;
        if (loc.protocol === "https:") {
            new_uri = "wss:";
        } else {
            new_uri = "ws:";
        }
    new_uri += "//" + loc.host;

    var url = new_uri + "/"+ encodeURIComponent(gameType) + "/" + encodeURIComponent(username)
     + (gameId ? ("/" + encodeURIComponent(gameId)) : "");
     console.log(url)
    return new WebSocket(url);
}

function handleWebSocket(ws) {
    ws.onmessage = function (msg) {
        msg = JSON.parse(msg.data);

        console.log(msg);

        switch (msg.type) {
            case "ID":
                gameType = msg.gameType;
                //initialise the game
                gameTypes[gameType].init();
                $("#id").text(msg.id);
                break;
            default:
                gameTypes[gameType].handleMsg(msg);
        }
    }

    ws.onclose = function () {
        $("#join").show();
        $("#game").hide();
    }
}
