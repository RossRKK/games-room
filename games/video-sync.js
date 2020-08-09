const Game = require("./game.js");
const type = "VideoSync";

const PAUSED = "PAUSED";
const PLAYING = "PLAYING";

const updateInterval = 1;

class VideoSync extends Game.Game {
  constructor (gameId) {
      super(gameId);

      this.type = type;

      this.state = PAUSED;
      this.time = 0;
  }

  incrementTime() {
    this.time += 1/(updateInterval*1000);
  }

  play(time, player) {
    this.state = PLAYING;
    this.time = time;

    this.interval = setInterval(this.incrementTime.bind(this), updateInterval);

    this.pushState(player);
  }

  pause(time, player) {
    this.state = PAUSED;
    this.time = time;

    clearInterval(this.interval);

    this.pushState(player);
  }

  seek(time, player) {
    this.time = time;

    this.pushState();
  }

  pushState(causingPlayer) {

    let allButCausingPlayer = {};

    Object.keys(this.allPlayers).forEach((item, i) => {
      if (item.username !== causingPlayer.username) {
        allButCausingPlayer[item] = this.allPlayers[item];
      }
    });


    this.sendMsgToGroup({
        type: "update",
        time: this.time,
        state: this.state
    }, allButCausingPlayer);
  }


  handleMsg(msg, player) {
    console.log(msg);
    switch (msg.type) {
        case "play":
            this.play(msg.currentTime, player);
            break;
        case "pause":
            this.pause(msg.currentTime, player);
            break;
        case "seek":
            this.seek(msg.currentTime, player);
            break;
        case "ping":
            //ignore ping messages
            break;
        default:
            return false; //no action was taken
    }
  }
}

exports.Game = VideoSync;
exports.id = type;
exports.title = "Video Sync";
exports.desc = "";
