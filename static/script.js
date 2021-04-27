"use strict";

var gameTypes = {
    WouldYouRather: WouldYouRather,
    Killer: Killer,
    Crumbs: Crumbs,
    ScoreBoard: ScoreBoard,
    VideoSync: VideoSync,
    Supply: Supply
}

var gameType = "WouldYouRather";

var ws;

var user;
var gamesMap = {};
var gameId;

function joinGame(user, gameId) {
    ws = openWebSocket(user, gameId);

    handleWebSocket(ws);

    $("#join").hide();

    $("#game").show();
}

$(document).ready(function () {
    // if (window.location.pathname) {
    //     var parts = window.location.pathname.split('/');
    //     joinGame(parts[0], parts[1]);
    // } else {
    //     $("#game").hide();
    // }

    $("#join-btn").on("click", function (e) {
        user = $("#name").val();
        gameId = $("#game-id").val();

        joinGame(user, gameId);
    });

    var games = $.get("/games").done(function (games) {
        console.log(games);
        addGameButtons(games);
    })

});

function addGameButtons(games) {
    games.forEach(function (game) {
        gamesMap[game.id] = game;

        var gameRow = $('<div/>', {
          class: 'row'
        });

        $('<div/>', {
          class: 'col',
          text: game.title
        }).appendTo(gameRow);

        var buttonWrapper = $('<div/>', {
          class: 'col'
        });
        buttonWrapper.appendTo(gameRow);

        var button = $('<button/>', {
          class: 'btn btn-primary',
          text: 'Start'
        });
        button.appendTo(buttonWrapper);

        button.attr('data-game', game.id);

        button.on('click', function (e) {
            var gameType = e.target.dataset.game;

            $.post('/api/' + encodeURIComponent(gameType)).done(function (id) {
              console.log(id);
              alert('Started ' + gamesMap[gameType].title + ' in room ' + id);
              $("#game-id").val(id);
            });

            // $("#header").text(game.title);
            // document.title = game.title;
            //
            // user = $("#name").val();
            // ws = openWebSocket(gameType, user);
            //
            // handleWebSocket(ws);
            //
            // $("#join").hide();
            // $("#game").show();
        });

        $("#games").append(gameRow);
    });
}

function openWebSocket(username, gameId) {
    var loc = window.location, new_uri;
        if (loc.protocol === "https:") {
            new_uri = "wss:";
        } else {
            new_uri = "ws:";
        }
    new_uri += "//" + loc.host;

    var url = new_uri + "/api/" + encodeURIComponent(gameId) + "/" + encodeURIComponent(username);
    console.log(url)
    var ws =  new WebSocket(url);

    //setup auto-ping
    ws.pingInterval = setInterval(function() {
        console.log("ping");
        ws.send(JSON.stringify({
            type: "ping"
        }));
    }, 30000);

    return ws;
}

function handleWebSocket(ws) {
    ws.onmessage = function (msg) {
        msg = JSON.parse(msg.data);

        console.log(msg);

        switch (msg.type) {
            case "ID":
                gameType = msg.gameType;
                id = msg.id;

                //initialise the game
                gameTypes[gameType].init();
                $("#id").text(msg.id);
                $("#header").text(gamesMap[msg.gameType].title);
                break;
            default:
                gameTypes[gameType].handleMsg(msg);
        }
    }

    ws.onclose = function () {
      alert('Connection to server failed');
        // clearInterval(ws.pingInterval);
        // $("#join").show();
        // $("#game").hide();
        // $("#game").empty();
        //
        // $("#header").text("Games Room");
        // $("#id").text("");
    }
}
