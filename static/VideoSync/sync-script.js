(function (){
  "use strict";
  var gameType = "VideoSync";

  var host = "wss://games-room.herokuapp.com";
  // var host = "ws://localhost:8080";

  var localToIgnore = 0;

  var networkToIgnore = 0;

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
            if (networkToIgnore === 0) {
              //localToIgnore++;
              video.currentTime = msg.time;

              if (msg.state === "PLAYING") {
                console.log("auto play")
                //localToIgnore++;
                video.play();
              } else {
                console.log("auto pause")
                //localToIgnore++;
                video.pause();
              }
            } else {
              console.log("network ignored " + networkToIgnore);
              networkToIgnore--;
            }
            break;
          case "ID":
            alert("Joined Room " +  msg.id);
            break;
        }
      }

      var localEvent = (innerHandler, event) => {
        if (localToIgnore === 0) {
          networkToIgnore++;
          innerHandler(event);
        } else {
          console.log("local ignored " + localToIgnore);
          //localToIgnore--;
        }
      };

      var onPlay = (event) => {
          console.log("local play")
          ws.send(JSON.stringify({
            type: "play",
            currentTime: video.currentTime
          }));
      };

      // video.addEventListener('play', (event) => { localEvent(onPlay, event) });
      video.addEventListener('playing', (event) => { localEvent(onPlay, event) });

      var onStop = (event) => {
          console.log("local pause")
          ws.send(JSON.stringify({
            type: "pause",
            currentTime: video.currentTime
          }));
      }

      video.addEventListener('pause', (event) => { localEvent(onStop, event) });
      video.addEventListener('waiting', (event) => { localEvent(onStop, event) });
      video.addEventListener('stalled', (event) => { localEvent(onStop, event) });

      var onSeek = (event) => {
          console.log("local seek")
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
