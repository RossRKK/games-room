"use strict";

var Supply = (function() {
  var status = null;

  function init() {
    $("#game").load(gameType + "/game.html", render);
  }

  function render() {
    if (status) {
      $('#opponent-name').text(status.opponent.name);
    }
  }

  function handleMsg(msg) {
    console.log(msg);
    switch (msg.type) {
      case "status":
        status = msg;
        render();
        break;
      default:
        console.log("Unknown message type " + msg.type);
    }
  }

  return {
    getStatus: () => status,
    init: init,
    handleMsg: handleMsg
  }
}());
