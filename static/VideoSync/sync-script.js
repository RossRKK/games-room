(function (){
  "use strict";
  var gameType = "VideoSync";

  var host = "wss://games-room.herokuapp.com";
  // var host = "ws://localhost:8080";


  function iframeRef(frameRef) {
      return frameRef.contentWindow
          ? frameRef.contentWindow.document
          : frameRef.contentDocument
  }

  function determineVideo(doc) {
    let videos = doc.querySelectorAll('video');

    if (videos.length === 0) {
      return null;
    } else if (videos.length === 1) {
      return videos[0];
    } else {
      //determine which video is the one we want,
      //tested on iplayer
      let hasBeenPlayed = (video) => {
        return video.currentTime > 0;
      };

      let hasSrcAttribute = (video) => {
        return video.src !== "";
      };

      let filters = [hasBeenPlayed, hasSrcAttribute];

      let filteredVideos = Array.from(videos);

      for (let i = 0; filteredVideos.length > 0 && i < filters.length; i++) {
        filteredVideos = filteredVideos.filter(filters[i]);
      }

      return filteredVideos.length ? filteredVideos[0] : null;
    }
  }

  let video = determineVideo(document);

  if (!video) {
    let iframe = document.querySelector('iframe');

    if (iframe) {
      let inside = iframeRef(iframe);

      video = determineVideo(inside);

      if (!video) {
        alert("No video element found");
        return;
      }
    } else {
      alert("No video element found");

      return;
    }
  }

  const PAUSED = "PAUSED";
  const PLAYING = "PLAYING";

  let networkState = PAUSED;

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

      ws.onmessage = function (msg) {
        msg = JSON.parse(msg.data);

        switch (msg.type) {
          case "update":
              video.currentTime = msg.time;

              networkState = msg.state;

              if (networkState === PLAYING && video.paused) {
                console.log("auto play");
                video.play();
              } else if (networkState === PAUSED && !video.paused) {
                console.log("auto pause");
                video.pause();
              } else {
                console.log("local state matched network message");
              }
            break;
          case "ID":
            alert("Joined Room " +  msg.id);
            console.log(msg.id);
            break;
        }
      }

      var localEvent = (innerHandler, event) => {
        let localState = video.paused ? PAUSED : PLAYING;

        if (localState !== networkState) {
          innerHandler(event);
        }
      };

      var onPlay = (event) => {
          console.log("sending play msg")
          ws.send(JSON.stringify({
            type: "play",
            currentTime: video.currentTime
          }));
      };

      video.addEventListener('play', (event) => { localEvent(onPlay, event) });
      // video.addEventListener('playing', (event) => { localEvent(onPlay, event) });

      var onStop = (event) => {
          console.log("sending pause msg")
          ws.send(JSON.stringify({
            type: "pause",
            currentTime: video.currentTime
          }));
      }

      video.addEventListener('pause', (event) => { localEvent(onStop, event) });
      // video.addEventListener('waiting', (event) => { localEvent(onStop, event) });
      // video.addEventListener('stalled', (event) => { localEvent(onStop, event) });

      var onSeek = (event) => {
          console.log("sending seek msg")
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
