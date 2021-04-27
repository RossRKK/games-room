var VideoSync = function () {


    function init() {
      $('#game').text("var vidSync=document.createElement('script');vidSync.src='https://games-room.herokuapp.com/VideoSync/sync-script.js';document.body.append(vidSync);");
    }

    function handleMsg (msg) {
        switch (msg.type) {

        }
    }

    return {
        init: init,
        handleMsg: handleMsg
    }
}();
