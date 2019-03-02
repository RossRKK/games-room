"use strict";

var gameType = "WouldYouRather";

var ws;

var isA = false;

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

    $("#next").on("click", function (e) {
        ws.send(JSON.stringify({
            type: "START"
        }));
    });
});

function openWebSocket(gameType, username, gameId) {
    var url = "ws://localhost:8080/" + encodeURIComponent(gameType) + "/" + encodeURIComponent(username)
     + (gameId ? ("/" + encodeURIComponent(gameId)) : "");
     console.log(url)
    return new WebSocket(url);
}

function arrToStr(arr) {
    var str = "";

    for (var i = 0; i < arr.length; i++) {
        str += arr[i];

        if (i !=arrToStr.length - 1) {
            str += ", ";
        }
    }

    return str;
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
                $("#resp1").text(arrToStr(msg.opt1.answers));
                $("#resp2").text(arrToStr(msg.opt2.answers));

                $("#scores").empty();

                $("#scores").append(msg.scores.map(score => score.username + " " + score.score));
                break;
            case "ID":
                $("#id").text(msg.id);
                break;
        }
    }

    ws.onclose = function () {
        $("#join").show();
        $("#game").hide();
    }
}
