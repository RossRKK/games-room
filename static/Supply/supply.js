"use strict";

var Supply = (function() {
  var status = null;

  function init() {
    $("#game").load(gameType + "/game.html", render);
  }

  function renderEmptyCard() {
    return $('<div/>', {
      class: 'card'
    });
  }

  function renderCard(card) {
    var cardDiv = renderEmptyCard();

    var col = wrapCol();
    cardDiv.append(col);

    $('<span/>', {
      class: 'row',
      text: card.type
    }).appendTo(col);

    $('<span/>', {
      class: 'row',
      text: card.value
    }).appendTo(col);

    return cardDiv;
  }

  function wrapRow(div) {
    var row = $('<div/>', {
      class: 'row'
    });
    row.append(div);
    return row;
  }

  function wrapCol(div) {
    var col = $('<div/>', {
      class: 'col'
    });
    col.append(div);
    return col;
  }

  function render() {
    if (status) {
      $('#opponent-name').text(status.opponent.name);
      $('#opponent-health').text(status.opponent.health);

      $('#deck').empty();
      $('#deck').append(renderEmptyCard());

      $('#scrapped').empty();
      $('#scrapped').append(renderEmptyCard());

      $('#supply-row').empty();
      $('#supply-row').append(status.supplyRow.map(renderCard).map(wrapCol));

      $('#hand').empty();
      $('#hand').append(status.player.hand.map(renderCard).map(wrapCol));

      $('#player-name').text(status.player.name);
      $('#player-health').text(status.player.health);
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
