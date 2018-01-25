# (WIP) Godot-Bomber-matchmaking-server
A simple game client and nodejs server to create matches between random players for Godot Bomber demo (PoC).

Inspired by Godot TCP demo made by stisa: https://github.com/stisa/godot-tcp-example.

## Lan VS Online
The original `multiplayer bomber` demo  (available on [Godot demo repository](https://github.com/godotengine/godot-demo-projects)) is very useful in showcasing how the Master-Slave network model works in Godot; but in a commercial game, finding your device Global IP is usually too much of a hassle to connect to other players - and even worse, if you are connected to a LAN (which certainly is the common case), you'd have to set Port Forwarding for your machine first before hosting a game. Those are steps that normally you'd want the players to avoid as the game's developer. The solution is creating a simple Server with a fixed IP that works as the "Matchmaker", handshaking pairs of players before starting a match. The technique used is called `Network Address Translator Hole-punching`.

A more complete explanation can be found here: https://keithjohnston.wordpress.com/2014/02/17/nat-punch-through-for-multiplayer-games/.


## Engine

As of now, Godot 3.0 (rc3) high-level network API don't support nat-punching because you won't be able to setup a fixed client port when using `enet::create_client` (the engine will create the client Peer using an arbitrary available local port). [I made a PR](https://github.com/godotengine/godot/pull/16034) to address this problem - which means you'll need to recompile the engine to make this project work on Godot.

If you only need nat-punching working on your project, you can also use the lower-level network api's (`TCPStreamPeer` or `UDPPacketPeer`) to connect different players using the technique described previously - it still works (I tested both TCP and UDP), but the game network communication will have to be setup manually.

## Client
I used the base code of the `multiplayer bomber` demo and just updated the menu so it would connect to a Matchmaking server I created instead of using another's player IP, via `UDPPacketPeer`; than it waits until the server sends back a "mathfound" ping, with the other player information.

Then it starts pinging the other player using another `UDPPacketPeer`, on the same port used to connect with the server (`:3456`). Each player:
- Starts sending a "ping" packet.
- If it receives a "ping", than it means its router is now allowing the packets. It starts sending "pong".
- If it receives a "pong", than the other player's router also allows packet transfer. Than:
	- If it is a 'host', it will setup a 3 second timer while sending "hosting" to the other player; after that, it creates a host.
	- If it is not a 'host', it will wait for a "hosting" message from other player to setup its own 3 second timer to create a client.

_PS: The original idea was to connect with the server using TCP, which is generally better (you guarantee your packets will always arrive at the server, and vice versa), but I opted to test the project using UDPPacket as it was just way simpler to program with. There are both a TCP and a UDP server version for Client and Server though, althought those implementations are possibly not complete._

## Server
The server (**udpserver.js**) is a simple nodejs file - it will listens to the `:3456` port for players and just queue them, waiting for other players to arrive. When there is a new player and there are player(s) waiting, it will pair them up and send each the Socket information of the other. The tricky thing is that the server has to send both the Remote Socket information but the Private Socket information (the private IP the player is using); this happens because the players could be in the same LAN, which means they wouldn't be able to connect using the Router's global IP to each other (this is called Hairpin problem), so the client's should test for both (_this is not implemented on client yet, though_).

_PS2: The server implemented currently only works once (lol); it will pair two players but it's currently still keeping them on the player\_queue, instead of popping them out._
