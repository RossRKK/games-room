(function (){
  "use strict";
  var gameType = "VideoSync";

  var host = "wss://games-room.herokuapp.com";
  // var host = "ws://localhost:8080";

  var lock = false;

  var seekIgnore = 0;

  function start(username, gameId) {
      var url = host + "/"+ encodeURIComponent(gameType) + "/" + encodeURIComponent(username)
       + (gameId ? ("/" + encodeURIComponent(gameId)) : "");
       console.log(url)
      var ws =  new WebSocket(url);

      //setup auto-ping
      ws.pingInterval = setInterval(function() {
          console.log("ping");
          ws.send(JSON.stringify({
              type: "ping"
          }));
      }, 30000);

      let video = document.querySelector('video');

      ws.onmessage = function (msg) {
        msg = JSON.parse(msg.data);
        console.log(msg);

        switch (msg.type) {
          case "update":
            if (!lock) {
              seekIgnore++;
              video.currentTime = msg.time;
              if (msg.state === "PLAYING") {
                video.play();
              } else {
                video.pause();
              }
            } else {
              lock = false;
            }
            break;
          case "ID":
            alert("Joined Room " +  msg.id);
            break;
        }
      }

      video.addEventListener('play', (event) => {
        lock = true;
        ws.send(JSON.stringify({
          type: "play",
          currentTime: video.currentTime
        }));
      });

      video.addEventListener('pause', (event) => {
        lock = true;
        ws.send(JSON.stringify({
          type: "pause",
          currentTime: video.currentTime
        }));
      });

      video.addEventListener('seeked', (event) => {
        if (seekIgnore === 0) {
            lock = true;
            ws.send(JSON.stringify({
              type: "seek",
              currentTime: video.currentTime
            }));
          }
      });
      seekIgnore--;
  }

  var username = prompt("Username");

  var roomCode = prompt("Room Code");

  console.log(roomCode);

  start(username, roomCode);

  return start;
})();
