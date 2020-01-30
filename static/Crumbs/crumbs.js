"use strict";

var Crumbs = (function () {
    var update = true;

    var model = (function() {

        /**
         * Whether the controls should be enabled.
         */
        var controlEnabled = false;

        /**
         * The current status of the game.
         */
        var currentStatus;

        /**
         * Handle incoming messages from the server.
         */
        function handleMessage(msg) {

            console.log(msg);

            view.game();

            switch (msg.type) {
                case "admin":
                    controlEnabled = msg.isAdmin;
                    view.start(controlEnabled);
                    break;
                case "czar":
                    view.czar(true);
                    view.black(msg.black);
                    view.whites([]);
                    break;
                case "options":
                    view.czar(true);
                    view.black(msg.black);
                    view.options(msg.options);
                    break;
                case "hand":
                    view.czar(false);
                    view.black(msg.black);
                    view.whites(msg.hand);
                    break;
                case "winner":
                    alert(msg.winner + " wins" );
                    break;
                case "players":
                    view.players(msg.players);
                    break;
            }
        }

        /**
         * Tell the server to start the game.
         */
        function start() {
            //check that there is at least 2 players
            ws.send(JSON.stringify({
                type: "start"
            }));
        }

        function response(cards) {
            view.clearWhites(cards);
            ws.send(JSON.stringify({
                type: "response",
                cards: cards
            }));
        }

        function decision(winner) {
            ws.send(JSON.stringify({
                type: "decision",
                winner: winner
            }));
        }


        function newGame() {
            return $.ajax({
                url: "/newgame",
                method: "POST"
            });
        }

        //30s ping
        var pingInterval = 30000;

        var pingId;

        function ping() {
            ws.send(JSON.stringify({
                type: "ping"
            }));
        }

        return {
            init: init,
            newGame: newGame,
            start: start,
            response: response,
            decision: decision,
            handleMessage: handleMessage
        }
    })();


    var view = function () {

        function init() {
            $("#start").show();
    		$("#chooseGame").show();
        }

    	function start(isAdmin) {
            if (isAdmin) {
                $("#start").show();
            } else {
                $("#start").hide();
            }
    	}

        function game() {
            $("#game").show();
        }

        //make the element for a card
        function makeCard(text, colour, val, onClick) {
            var card = document.createElement("div");
            card.classList.add(colour);
            card.innerHTML = text;

            card.value = val;
            card.onclick = onClick;

            return card;
        }

        function black(card) {
            var black = document.getElementById("black");
            black.innerHTML = "";

            var card = makeCard(card, "black");

            black.appendChild(card);
        }

        function whites(cards) {
            var whites = document.getElementById("whites");

            whites.innerHTML = "";

            cards.forEach(function (card) {
                var card = makeCard(card, "white");

                card.onclick = controller.cardClick;

                whites.appendChild(card);
            });
        }

        function options(opts) {
            var whites = document.getElementById("whites");

            whites.innerHTML = "";

            opts.forEach(function (opt) {
                var card = makeCard(opt.cards, "white");

                card.onclick = controller.optClick;
                card.value = opt.username;

                whites.appendChild(card);
            });
        }

        function clearWhites(card) {
            var whites = document.getElementById("whites");

            whites.innerHTML = "Please wait for other players";

            var c = makeCard(card, "white");
            c.style.cursor = "default";
            whites.appendChild(c);
        }

        function czar(isCzar) {
            document.getElementById("message").innerText = isCzar ? "You are the card czar" : "";
        }

        function players(ps) {
            var players = $("#players");

            players.empty();

            ps.forEach(function (p) {
                $("<div/>", {
                    text: (p.isCzar ? "🂠" : (p.hasPlayed ? "✔" : "✖")) + " " + p.username + ": " + p.score
                }).appendTo(players);
            });
        }

    	function gameId(id) {
    		$("#gameId").text(id);
    		$("#game").show();
    		$("#chooseGame").hide();

    		//make it easy to reload this game if the connection times out
    		$("#gameIdIn").val(id);
    	}

    	return {
            init: init,
    		start: start,
            game: game,
            black: black,
            whites: whites,
            options: options,
    		gameId: gameId,
            clearWhites: clearWhites,
            czar: czar,
            players: players,
    	}
    }();


    var controller = (function () {
        function init() {
            $("#start").on("click", start);
            $("#start").hide();
        }

    	//Start the game
    	function start() {
        	model.start();
    	}

        function newGame() {
            var username = $("#username").val();
            model.newGame().done(function (gameId) {
                model.init(gameId, username);
                view.gameId(gameId);
            });
        }

        function joinGame() {
            var username = $("#username").val();
            var gameId = $("#gameIdIn").val();
            model.init(gameId, username);
            view.gameId(gameId);
        }

        function cardClick(e) {
            console.log(e);

            model.response(e.target.innerText);
        }

        function optClick(e) {
            console.log(e);

            model.decision(e.target.value);
        }


        return {
            init: init,
    		start:  start,
            newGame: newGame,
            joinGame: joinGame,

            cardClick: cardClick,
            optClick: optClick,
    	}
    }());

    function init() {

        var game = $("#game");

        $("<div/>", {
            id: "players"
        }).appendTo(game);

        $("<button/>", {
            id: "start",
            class: "btn btn-default",
            text: "Start"
        }).appendTo(game);

        $("<div/>", {
            id: "message"
        }).appendTo(game);

        $("<div/>", {
            id: "black"
        }).appendTo(game);

        $("<div/>", {
            id: "whites"
        }).appendTo(game);

        view.init();
        controller.init();
    }

    function handleMsg (msg) {
        switch (msg.type) {
            case "QUESTION":
                $("#next").hide();
                $("#next").text("Next Round");
                $("#prompt").text(msg.prompt);
                $("#opt1").text(msg.opt1);
                $("#opt2").text(msg.opt2);

                $("#resp1").empty();
                $("#resp2").empty();

                isA = msg.isA;

                $(".opt").show();

                $("#message").text(msg.isA ? "Answer honestly" : "Choose the answer you think will be most popular");
                break;
            case "RESULT":
                $("#resp1").text(arrToStr(msg.opt1.answers));
                $("#resp2").text(arrToStr(msg.opt2.answers));

                showPlayers(msg.scores);
                $("#next").show();
                break;
            case "PLAYER":
                showPlayers(msg.players);
                break;
        }
    }

    return {
        init: init,
        handleMsg: model.handleMessage
    }
}())
