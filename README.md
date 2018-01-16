# (WIP) Godot-Bomber-matchmaking-server
A simple nodejs server to create matches between random players for Godot Bomber demo (PoC).

## Lan VS Online
The original `multiplayer bomber` demo  (available on [Godot demo repository](https://github.com/godotengine/godot-demo-projects)) is very useful in showcasing how the Master-Slave network model works in Godot; but in a commercial game, finding your device Global IP is usually too much of a hassle to connect to other players - and even worse, if you are connected to a LAN (which certainly is the common case), you'd have to set Port Forwarding for your machine first before hosting a game. Those are steps that normally you'd want the players to avoid as the game's developer. The solution is creating a simple Server with a fixed IP that works as the "Matchmaker", handshaking pairs of players before starting a match. The technique used is called `Network Address Translator Hole-punching`.

A more complete explanation can be found here: https://keithjohnston.wordpress.com/2014/02/17/nat-punch-through-for-multiplayer-games/.

## Client
I used the base code of the `multiplayer bomber` demo and just updated the menu so it would connect to a Matchmaking server I created instead of using another's player IP; than it waits until the server sends back another player IP.

## Server
The server is a simple nodejs file - it will listens to the `:3456` port for players and just queue, waiting for other players to arrive.
