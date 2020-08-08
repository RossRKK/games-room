(function (){
  "use strict";
  var gameType = "VideoSync";

  var host = "wss://games-room.herokuapp.com";
  // var host = "ws://localhost:8080";

  var localToIgnore = 0;

  var networkToIgnore = 0;

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

        switch (msg.type) {
          case "update":
            if (networkToIgnore === 0) {
              localToIgnore++;
              video.currentTime = msg.time;

              if (msg.state === "PLAYING") {
                console.log("auto play")
                localToIgnore++;
                video.play();
              } else {
                console.log("auto pause")
                localToIgnore++;
                video.pause();
              }
            } else {
              networkToIgnore--;
            }
            break;
          case "ID":
            alert("Joined Room " +  msg.id);
            break;
        }
      }

      var localEvent = (innerHandler, event) => {
        networkToIgnore++;
        if (localToIgnore === 0) {
          innerHandler(event);
        } else {
          localToIgnore--;
        }
      };

      var onPlay = (event) => {
          ws.send(JSON.stringify({
            type: "play",
            currentTime: video.currentTime
          }));
      };

      video.addEventListener('play', (event) => { localEvent(onPlay, event) });

      var onStop = (event) => {
          ws.send(JSON.stringify({
            type: "pause",
            currentTime: video.currentTime
          }));
      }

      video.addEventListener('pause', (event) => { localEvent(onStop, event) });
      video.addEventListener('waiting', (event) => { localEvent(onStop, event) });
      video.addEventListener('stalled', (event) => { localEvent(onStop, event) });

      var onSeek = (event) => {
            ws.send(JSON.stringify({
              type: "seek",
              currentTime: video.currentTime
            }));
      };

      video.addEventListener('seeked', (event) => { localEvent(onSeek, event) });
  }

  var username = prompt("Username");

  var roomCode = prompt("Room Code");

  console.log(roomCode);

  start(username, roomCode);

  return start;
})();
