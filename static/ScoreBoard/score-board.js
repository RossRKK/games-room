"use strict";

var ScoreBoard = (function () {

    var status = null;


    var paused = false;

    function setColour(div, colour) {
        div.removeClass("red");
        div.removeClass("yellow");
        div.removeClass("green");

        div.addClass(colour);
    }

    function render() {
        if (status !== null) {

            //update the colours and player name etc.
            var player1 = $("#player1");
            setColour(player1, status.player1.colour);
            player1.text(status.player1.name);

            var player2 = $("#player2");
            setColour(player2, status.player2.colour);
            player2.text(status.player2.name);

            $("#score").text(status.player1.score + " - " + status.player2.score);

            if (paused) {
                $("#pause").text("Resume");
            } else {
                $("#pause").text("Pause");
            }

            renderTime();
        }
    }

    function renderTime() {
        if (status) {
            //update the shot clock
            var sinceStart = status.clockStart ? (new Date() - new Date(status.clockStart)) : 0;
            var time = (sinceStart + status.clockElapsed)/1000;

            $("#shot-clock").text(time);
        }
    }

    function init() {
        $("#game").load(gameType + "/game.html", function () {
        });

        //render often to keep the time updated
        setInterval(renderTime, 100);
    }

    function handleMsg(msg) {
        console.log(msg);
        switch (msg.type) {
            case "status":
                status = msg.status;

                render();
                break;
            default:
                console.log("Unknown message type " + msg.type);
        }
    }

    function resetColours() {
        ws.send(JSON.stringify({
        	type: "SET-COLOURS",
        	colour1: "green",
        	colour2: "green"
        }))
    }

    function p1Red() {
        ws.send(JSON.stringify({
        	type: "SET-COLOURS",
        	colour1: "red",
        	colour2: "yellow"
        }));
    }

    function p2Red() {
        ws.send(JSON.stringify({
        	type: "SET-COLOURS",
        	colour1: "yellow",
        	colour2: "red"
        }));
    }

    function resetClock() {
        ws.send(JSON.stringify({
        	type: "RESET-CLOCK"
        }));
    }

    function pauseClock() {
        if (paused) {
            ws.send(JSON.stringify({
            	type: "RESUME-CLOCK"
            }));
        } else {
            ws.send(JSON.stringify({
            	type: "PAUSE-CLOCK"
            }));
        }

        //TODO this will cause issue if there are multiple admins
        paused = !paused;
    }

    function p1Score(up) {
        ws.send(JSON.stringify({
        	type: "UPDATE-SCORE",
        	score1: status.player1.score + (up ? 1 : -1),
        	score2: status.player2.score
        }));
    }

    function p2Score(up) {
        ws.send(JSON.stringify({
        	type: "UPDATE-SCORE",
        	score1: status.player1.score,
        	score2: status.player2.score + (up ? 1 : -1)
        }));
    }



    return {
        init: init,
        handleMsg: handleMsg,
        resetColours: resetColours,
        p1Red: p1Red,
        p2Red: p2Red,
        resetClock: resetClock,
        pauseClock: pauseClock,
        p1Score: p1Score,
        p2Score: p2Score
    }
}());
