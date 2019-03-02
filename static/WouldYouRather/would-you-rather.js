var WouldYouRather = function () {
    var isA = false;

    var players = [];

    function init() {
        //load html code into game div
        $("#game").load(gameType + "/game.html", function () {
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

            showPlayers(players);
        });
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

    function showPlayers(ps) {
        players = ps;
        $("#scores").empty();

        $("#scores").append(players.map(player => "<li>" + player.username + " " + player.score + "</li>"));
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
        handleMsg: handleMsg
    }
}();
