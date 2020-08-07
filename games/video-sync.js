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

  play(time) {
    this.state = PLAYING;
    this.time = time;

    this.interval = setInterval(this.incrementTime.bind(this), updateInterval);

    this.pushState();
  }

  pause(time) {
    this.state = PAUSED;
    this.time = time;

    clearInterval(this.interval);

    this.pushState();
  }

  seek(time) {
    this.time = time;

    this.pushState();
  }

  pushState() {
    this.sendMsgToAll({
        type: "update",
        time: this.time,
        state: this.state
    });
  }


  handleMsg(msg, player) {
    console.log(msg);
    switch (msg.type) {
        case "play":
            this.play(msg.currentTime);
            break;
        case "pause":
            this.pause(msg.currentTime);
            break;
        case "seek":
            this.seek(msg.currentTime);
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
