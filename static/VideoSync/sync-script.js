var gameType = "VideoSync";

var host = "ws://localhost:8080";

var lock = false;

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
    }, 3000);

    let video = document.querySelector('video');

    ws.onmessage = function (msg) {
      msg = JSON.parse(msg.data);
      console.log(msg);

      switch (msg.type) {
        case "update":
          if (!lock) {
            video.currentTime = msg.time;
            if (msg.state === "PLAYING") {
              video.play();
            } else {
              video.pause();
            }
          } else {
            lock = false;
          }
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
}
