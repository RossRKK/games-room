"use strict";

var Killer = (function() {
    var controller = (function () {
        function init() {
            $("#addPlayer").on("submit",function(e) {
    		    e.preventDefault(); // cancel the actual submit
    				addPlayer();
    		});

            $("#noLives").on("change", function(e) {
                model.promptRender();
            });

    		$("#rulesTitle").click(function(e) {
    	    	e.preventDefault();
    			$("#rules").toggle();
    			if (rulesOpen) {
    				$("#rulesTitle").empty();
    				$("#rulesTitle").append("(expand)");
    				rulesOpen = false;
    			} else {
    				$("#rulesTitle").empty();
    				$("#rulesTitle").append("(collapse)");
    				rulesOpen = true;
    			}
    		});

            $("#start").on("click", start);
            $("#pot").on("click", pot);
            $("#miss").on("click", miss);
            $("#replace").on("click", replace);
        }

        function bindListHandlers() {
            $(".remove").click(function (e) {
    			model.remove(e.currentTarget.dataset.player, e.currentTarget.dataset.through === "true");
    		});

    		$(".putThrough").click(function (e) {
    			model.putThrough(e.currentTarget.dataset.player);
    		});

    		$(".demote").click(function (e) {
    			model.demote(e.currentTarget.dataset.player);
    		});
        }

        //Add a player to the game
    	function addPlayer() {
    		var p = $("#add").val();
    		if (p) {
    			model.addPlayer(p);
    		} else {
    			alert("The player field is required");
    		}
    	}

    	//The player missed
    	function miss() {
    		model.miss();
    	}

    	//The player potted
    	function pot() {
    		model.pot(0);
    	}


    	//Add Lives
    	function addLives() {
    		var lives = parseInt($("#lives").val())
    		model.pot(lives);
    	}

    	function replace() {
    		model.replace();
    	}

    	//Start the game
    	function start() {
            var noLives = $("#noLives").val();

        	model.start(noLives);
    	}

        function toggleControlsClick() {
            model.toggleControls();
        }

        return {
            init: init,
    		start:  start,
    		pot: pot,
    		miss: miss,
    		replace: replace,
    		addLives: addLives,
            bindListHandlers: bindListHandlers,
            toggleControlsClick: toggleControlsClick,
    	}
    }());

    var update = true;

    var model = (function() {

        /**
         * Whether the controls should be enabled.
         */
        var controlEnabled = true;

        /**
         * The current status of the game.
         */
        var currentStatus;

        function disableControls() {
            controlEnabled = false;

            view.disableControls();
        }

        function enableControls() {
            controlEnabled = true;

            view.enableControls();
        }

        function toggleControls() {
            controlEnabled = !controlEnabled;

            controlEnabled ? view.enableControls() : view.disableControls();
        }

        /**
         * Handle incoming messages from the server.
         */
        function handleMessage(msg) {
            // var msg = JSON.parse(event.data);

            console.log(msg);

            currentStatus = msg.status;

            promptRender(msg.status);

            if (msg.status.hasStarted) {
                view.start();
            }

            switch (msg.type) {
                case "draw":
                    view.draw(msg.player);
                    break;
                case "win":
                    view.winner(msg.player);
                    break;
                case "start":
                    view.start();
                    break;
                case "redraw":
                    view.redraw();
                    break;
                case "reset":
                    view.reset();
                    break;
            }
        }

        function promptRender(status) {
            view.render(status, controlEnabled);
        }

        /**
         * Tell the server to add another player.
         * @param player The name of the player to add.
         */
        function addPlayer(player) {
            ws.send(JSON.stringify({
                type: "addPlayer",
                player: player
            }));

            view.clearPlayer();
        }

        /**
         * Tell the server that the player potted.
         * @param extraLives The number of extra lives the player should recieve.
         */
        function pot(extraLives) {
            view.fadeOut();

            ws.send(JSON.stringify({
                type: "pot",
                extraLives: extraLives
            }));
        }

        /**
         * Tell the server that the player missed.
         */
        function miss() {
            view.fadeOut();

            ws.send(JSON.stringify({
                type: "miss",
            }));
        }

        /**
         * Tell the server to replace the current player.
         */
        function replace() {
            view.fadeOut();

            ws.send(JSON.stringify({
                type: "replace",
            }));
        }

        /**
         * Tell the server to start the game.
         */
        function start(lives) {
            //check that there is at least 2 players
            if (currentStatus.players.length > 1) {
                ws.send(JSON.stringify({
                    type: "start",
                    lives: lives
                }));
            } else {
                alert("There must be players to start a game");
            }
        }

        function remove(player, through) {
            ws.send(JSON.stringify({
                type: "remove",
                player: player,
                through: through
            }));
        }

        function putThrough(player) {
            ws.send(JSON.stringify({
                type: "putThrough",
                player: player
            }));
        }

        function demote(player) {
            ws.send(JSON.stringify({
                type: "demote",
                player: player
            }));
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
            handleMessage: handleMessage,
            addPlayer: addPlayer,
            pot: pot,
            miss: miss,
            replace: replace,
            start: start,
            putThrough: putThrough,
            demote: demote,
            remove: remove,

            disableControls: disableControls,
            enableControls: enableControls,
            toggleControls: toggleControls,
            promptRender: promptRender,
        }
    })();

    var rulesOpen = false;

    var view = function () {
    	var prevStatus;

    	function init() {
    		$("#curDraw").hide();
    		$("#rules").hide();

    		$("#chooseGame").show();
    		$("#start").show();
    	}

    	function start() {
    		$("#start").fadeOut();
    		$("#curDraw").fadeIn();
    		$("#lifeCount").hide();
    	}

    	function listLives(player, through) {
    		$("#players").append("<tr><td><div class=\"player\">" + player.name + " (" + player.lives + ")</td><td><button class=\"" + (through ? "demote" : "putThrough") + " control btn btn-default\" data-player=\"" + player.name + "\">" + (through ? "Demote" : "Put Through") +
    		"</button><button class=\"control remove btn btn-default\" data-player=\"" + player.name + "\" data-through=\"" + through + "\">X</button></div></td></tr>");
    	}

    	//Re-render the page
    	function render(status, controlEnabled) {
    		if (status) {
    			prevStatus = status;
    		} else {
    			status = prevStatus;
    		}

            if (!$("#player").text()) {
                showName(status.drawn);
            }

    		$("#players").empty();
    		if (status.hasStarted) {

    			$("#players").append("<h3>To Be Drawn: " + status.toBeDrawn.length + "</h3><table>")

    			status.toBeDrawn.forEach(function (player) { listLives(player, false) });

    			$("#players").append("</table><h3>Through: " + status.through.length + "</h3><table>")

    			status.through.forEach(function (player) { listLives(player, true) });

    			$("#players").append("</table>");
    		} else {
    			$("#players").append("<h3>Players: " + status.players.length +
    			" (" + ($("#noLives").val() * status.players.length)  + " lives)</h3><table>");

    			status.players.forEach(function (player) {
    				$("#players").append("<tr><td><div class=\"player\">" + player + "</div></td><td><button class=\"remove control btn btn-default\" data-player=\"" + player + "\">X</button></td></tr>");
    			});
    			$("#players").append("</table>");
    		}

    		controller.bindListHandlers();

            controlEnabled ? enableControls() : disableControls();
    	}

        //the name of the player currently being displayed
        var currentPlayer = null;
        var fadeComplete = true;
        var fadeStarted = false;

    	function draw(player) {
            if (fadeComplete) {
                if (!fadeStarted) {
                    //this is the case where the draw was done on a remote client
                    currentPlayer = player;
                    fadeOut();
                } else {
                    //this is when the name has finished fading out when the name comes back
                    showName(player);
                }
            } else {
                //this is when the drawn player comes back before the animation completes
                currentPlayer = player;
            }
    	}

    	function winner(player) {
            currentPlayer = "The winner is: " + player;
    	}

    	function redraw() {
    		alert("Redraw");
    	}

    	function reset() {
    		alert("Reset");
    	}

        function showName(player) {
            $("#player").empty();
            $("#player").append(player);
            $("#player").fadeIn();
        }

        function fadeOut() {
            fadeComplete = false;
            fadeStarted = true;
            $("#player").fadeOut(400, "swing", function () {
                if (currentPlayer) {
                    showName(currentPlayer);
                    currentPlayer = null;
                }
                fadeComplete = true;
                fadeStarted = false;
            });
        }

    	function gameId(id) {
    		$("#gameId").text(id);
    		$("#game").show();
    		$("#chooseGame").hide();

    		//make it easy to reload this game if the connection times out
    		$("#gameIdIn").val(id);
    	}

        function disableControls() {
            $(".control").hide();
        }

        function enableControls() {
            $(".control").show();
        }

        function clearPlayer() {
            $("#add").val("");
        }

    	return {
    		init: init,
    		start:  start,
    		draw: draw,
    		render: render,
    		redraw: redraw,
    		reset: reset,
    		winner: winner,
    		gameId: gameId,
            disableControls: disableControls,
            enableControls: enableControls,
            fadeOut: fadeOut,
            clearPlayer: clearPlayer,
    	}
    }();

    function init() {
        //load html code into game div
        $("#game").load(gameType + "/game.html", function () {
            view.init();
            controller.init();
        });
    }

    return {
        init: init,
        handleMsg: model.handleMessage
    }
}());
