# Games Room

Games room is a system that allows multiple different group games to be implmented with the same server. 
Each game takes place in a game "room", each with a different ID. Multiple people can use this ID to join the same game and play together.

This project uses websockets to provide players with realtime updates to the game state.

The main goal of this project was to develop a unified and extensible way to make this style of game.

## Games

### Killer

Killer is a pool game where players take it in turns to pot balls. Each time a player misses they lose a life and the last player standing wins.
Normally killer is played with a deck of cards to randmoise the order, this implmentation is designed to replace the cards and allow play with an unbounded number of players.

This was the first game I made in this style (before I realised the need to unify them).

### Crumbs Against Pool Soc

Crumbs Against Pool Soc is a cards against humanity clone that has specific in joke cards.
The cards are specified as JSON in the games/decks directory.

The ability for the user to add and choose which decks to use is a planned future feature.

This game was originally developed as a seperate project.

### Would You Rather

You you rather is a simple game. 
The players are divided into 2 teams, 1 team answers the questions honestly and the othertries to guess which answer will be more popular.

This game (and this system) was developed as the sample game as a proof of concept for this system at STACS Hack V.

### Score Board

Score board is currently incomplete. The idea is that it would be used as a scoreboard for (live streamed) pool matches, allowing spectators to look up the score on their phones.
