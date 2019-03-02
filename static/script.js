"use strict";

var gameTypes = {
    WouldYouRather: WouldYouRather
}

var gameType = "WouldYouRather";

var ws;

var user;

$(document).ready(function () {
    $("#game").hide();

    $("#start").on("click", function (e) {
        user = $("#name").val();
        ws = openWebSocket(gameType, user);

        handleWebSocket(ws);

        $("#join").hide();
        $("#game").show();
    });

    $("#join-btn").on("click", function (e) {
        var user = $("#name").val();
        var gameId = $("#game-id").val();
        ws = openWebSocket(gameType, user, gameId);

        handleWebSocket(ws);

        $("#join").hide();

        $("#game").show();
    });
});

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
