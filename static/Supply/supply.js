"use strict";

var Supply = (function() {
  var status = null;

  function init() {
    $("#game").load(gameType + "/game.html", function () {
      $('#player-name').text(user);

      $('#scrap-btn').on('click', scrap);
      $('#attack-btn').on('click', attack);
      $('#end-turn-btn').on('click', pass);

      render();
    });
  }

  function renderEmptyCard() {
    return $('<div/>', {
      class: 'card'
    });
  }

  function renderCard(card, i) {
    var cardDiv = renderEmptyCard();
    cardDiv.attr('data-index', i);

    var col = wrapCol();
    cardDiv.append(col);

    var headerRow = $('<div/>', {
      class: 'row'
    }).appendTo(col);

    var bodyRow = $('<span/>', {
      class: 'row'
    }).appendTo(col);

    var displayType = card.type;

    switch (card.type) {
      case 'MONEY':
        displayType = '£';
        break;
      case 'DEFENCE':
        displayType = '🛡';
        break;
      case 'ATTACK':
        displayType = '⚔';
        break;
    }

    wrapCol($('<div/>', {
      class: 'card-type',
      text: displayType
    })).appendTo(headerRow);

    wrapCol($('<div/>', {
      class: 'card-value',
      text: card.value
    })).appendTo(bodyRow);

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

  function acquireCard(targetIndex) {
    if (status.currentPlayer == user) {
      ws.send(JSON.stringify({
        type: "acquire",
        cardIndex: targetIndex
      }));
    } else {
      alert('It is ' + status.currentPlayer + '\'s turn');
    }
  }

  function playCard(targetIndex) {
    if (status.currentPlayer == user) {
      ws.send(JSON.stringify({
        type: "play",
        cardIndex: targetIndex
      }));
    } else {
      alert('It is ' + status.currentPlayer + '\'s turn');
    }
  }

  function pass() {
    if (status.currentPlayer == user) {
      ws.send(JSON.stringify({
        type: "pass"
      }));
    } else {
      alert('It is ' + status.currentPlayer + '\'s turn');
    }
  }

  function attack() {
    if (status.currentPlayer == user) {
      ws.send(JSON.stringify({
        type: "attack"
      }));
    } else {
      alert('It is ' + status.currentPlayer + '\'s turn');
    }
  }

  function scrap() {
    if (status.currentPlayer == user) {
      ws.send(JSON.stringify({
        type: "scrap"
      }));
    } else {
      alert('It is ' + status.currentPlayer + '\'s turn');
    }
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

      $('#play-area').empty();
      $('#play-area').append(status.player.playArea.map(renderCard).map(wrapCol));

      $('#opponent-play-area').empty();
      $('#opponent-play-area').append(status.opponent.playArea.map(renderCard).map(wrapCol));

      $('#player-name').text(user);
      $('#player-health').text(status.player.health);

      $('#opponent-attack-pool').text(status.opponent.attackPool);
      $('#opponent-money-pool').text(status.opponent.moneyPool);

      $('#player-attack-pool').text(status.player.attackPool);
      $('#player-money-pool').text(status.player.moneyPool);

      $('#supply-row .card').on('click', function (evt) {
        var targetIndex = evt.currentTarget.dataset.index;
        acquireCard(targetIndex);
      });

      $('#hand .card').on('click', function (evt) {
        var targetIndex = evt.currentTarget.dataset.index;
        playCard(targetIndex);
      });
    }
  }

  function handleMsg(msg) {
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
