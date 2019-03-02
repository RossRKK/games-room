"use strict";

var gameType = "WouldYouRather";

var ws;

var isA = false;

$(document).ready(function () {
    $("#game").hide();
    
    $("#start").on("click", function (e) {
        var user = $("#name").val();
        ws = openWebSocket(gameType, user);

        handleWebSocket(ws);

        $("#join").hide();
        $("#game").show();
    });

    $("#join").on("click", function (e) {
        var user = $("#name").val();
        var gameId = $("#game-id").val();
        ws = openWebSocket(gameType, user, gameId);

        handleWebSocket(ws);

        $("#join").hide();
        $("#game").show();
    });

    $("#opt1").on("click", function (e) {
        ws.send(JSON.stringify({
            type: isA ? "ANSWER" : "VOTE",
            opt: 1
        }));
    });

    $("#opt2").on("click", function (e) {
        ws.send(JSON.stringify({
            type: isA ? "ANSWER" : "VOTE",
            opt: 2
        }));
    });
});

function openWebSocket(gameType, username, gameId) {
    var url = "ws://localhost:8080/" + encodeURIComponent(gameType) + "/" + encodeURIComponent(username)
     + (gameId ? ("/" + encodeURIComponent(gameId)) : "");
     console.log(url)
    return new WebSocket(url);
}

function handleWebSocket(ws) {
    ws.onmessage = function (msg) {
        msg = JSON.parse(msg.data);
            console.log(msg);

        switch (msg.type) {
            case "QUESTION":
                $("#prompt").text(msg.prompt);
                $("#opt1").text(msg.opt1);
                $("#opt2").text(msg.opt2);

                isA = msg.isA;

                $("#message").text(msg.isA ? "Answer honestly" : "Choose the answer you think will be most popular");
                break;
            case "RESULT":
                break;
        }
    }

    ws.onclose = function () {
        $("#join").show();
        $("#game").hide();
    }
}
