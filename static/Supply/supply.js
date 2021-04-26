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

  function renderDefence(defence, i) {
    var fakeCard = {
      type: 'DEFENCE',
      displayValue: defence.map(x => x.value).reduce((x,y) => x+y)
    };
    var cardDiv = renderCard(fakeCard, i);
    return cardDiv;
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
      text: card.displayValue
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
    var minAttack = status.opponent.defences.map(x => x.map(y=>y.value).reduce((a,b)=>a+b)).reduce((x,y) => x < y ? x : y,0);
    var unspentAttack = status.player.attackPool > minAttack;
    var minCost = status.supplyRow.map(x => x.cost).reduce((x,y) => x < y ? x : y);
    var unspentMoney = status.player.moneyPool >= minCost;

    if (unspentMoney || unspentAttack) {
      var msg = unspentMoney && unspentAttack
        ? 'You have unspent money and attack points. Continue?'
        : unspentMoney ? 'You have unspent money points. Continue?'
        : 'You have unspent attack points. Continue?'

      var pass = confirm(msg);

      if (!pass) {
        return;
      }
    }

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

  function attackDefence(targetIndex) {
    if (status.currentPlayer == user) {
      ws.send(JSON.stringify({
        type: "attack",
        cardIndex: targetIndex
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
      if (status.currentPlayer != user) {
        $('#opponent-name').addClass('current-player');
      } else {
        $('#opponent-name').removeClass('current-player');
      }
      $('#opponent-health').text(status.opponent.health);

      $('#deck').empty();
      $('#deck').append(renderEmptyCard());

      $('#scrapped').empty();
      $('#scrapped').append(renderEmptyCard());

      $('#supply-row').empty();
      $('#supply-row').append(status.supplyRow.map(renderCard).map(wrapCol));

      $('#hand').empty();
      $('#hand').append(status.player.hand.map(renderCard).map(wrapCol));

      $('#defences').empty();
      $('#defences').append(status.player.defences.map(renderDefence).map(wrapCol));

      $('#opponent-defences').empty();
      $('#opponent-defences').append(status.opponent.defences.map(renderDefence).map(wrapCol));

      $('#play-area').empty();
      $('#play-area').append(status.player.playArea.map(renderCard).map(wrapCol));
      $('#play-area').append(status.player.newDefence.map(renderCard).map(wrapCol));

      $('#opponent-play-area').empty();
      $('#opponent-play-area').append(status.opponent.playArea.map(renderCard).map(wrapCol));
      $('#opponent-play-area').append(status.opponent.newDefence.map(renderCard).map(wrapCol));

      $('#player-name').text(user);
      if (status.currentPlayer == user) {
        $('#player-name').addClass('current-player');
      } else {
        $('#player-name').removeClass('current-player');
      }
      $('#player-health').text(status.player.health);

      $('#opponent-attack-pool').text(status.opponent.attackPool);
      $('#opponent-money-pool').text(status.opponent.moneyPool);

      $('#player-attack-pool').text(status.player.attackPool);
      $('#player-money-pool').text(status.player.moneyPool);

      $('#discard-count').text(status.player.mustDiscard);
      //hide warning when non-zero
      $('#dicard-warning').toggle(status.player.mustDiscard > 0);

      $('#supply-row .card').on('click', function (evt) {
        var targetIndex = evt.currentTarget.dataset.index;
        acquireCard(targetIndex);
      });

      $('#hand .card').on('click', function (evt) {
        var targetIndex = evt.currentTarget.dataset.index;
        playCard(targetIndex);
      });

      $('#opponent-defences .card').on('click', function (evt) {
        console.log(evt);
        var targetIndex = evt.currentTarget.dataset.index;
        attackDefence(targetIndex);
      });
    }
  }

  function handleMsg(msg) {
    switch (msg.type) {
      case 'status':
        status = msg;
        render();
        break;
      case 'reject':
        alert(msg.msg);
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
