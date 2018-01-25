const dgram = require('dgram');

const PORT = 3456;
const HOST = '0.0.0.0';

var server = dgram.createSocket('udp4');

var player_ids = {};
var player_queue = [];

function match_players() {
    var player1 = player_queue[0];
    var player2 = player_queue[1];

    send_message("im0", player1.remote_address, player1.remote_port); // Will be slave
    send_message("na" + player2.name, player1.remote_address, player1.remote_port);
    send_message("ri" + player2.remote_address, player1.remote_address, player1.remote_port);
    send_message("rp" + player2.remote_port, player1.remote_address, player1.remote_port);
    send_message("pi" + player2.private_address, player1.remote_address, player1.remote_port);

    send_message("im1", player2.remote_address, player2.remote_port); // Will be master
    send_message("na" + player1.name, player2.remote_address, player2.remote_port);
    send_message("ri" + player1.remote_address, player2.remote_address, player2.remote_port);
    send_message("rp" + player1.remote_port, player2.remote_address, player2.remote_port);
    send_message("pi" + player1.private_address, player2.remote_address, player2.remote_port);

    // player_queue.splice(0, 2)
}

function send_message(string, remote_address, remote_port) {
    var buffer = new Buffer(string, 'utf8');
    console.log("Sending message: ", remote_address, remote_port);
    server.send(buffer, 0, string.length, remote_port, remote_address);
}

server.on('listening', function () {
    var address = server.address();
    console.log('Hey, listen!');
});

server.on('message', function (message, remote) {
    var string = message.toString('utf8');
    console.log(remote.address + ':' + remote.port + ' - ' + string);

    var player_id = remote.address + ":" + remote.port;
    if (!player_ids[player_id]) { // New player
        player_ids[player_id] = { name: "", remote_address: remote.address, remote_port: remote.port, private_address: "", buffers: 0 };
    }

    if (string[0] === 'n') { // player name
        console.log("player name");
        player_ids[player_id].name = string.substr(1);
        player_ids[player_id].buffers += 1;
    }

    if (string[0] === 'i') { // player ip
        console.log("player ip");
        player_ids[player_id].private_address = string.substr(1);
        player_ids[player_id].buffers += 1;
    }

    if (player_ids[player_id].buffers === 2) {
        player_queue.push(player_ids[player_id]);
        console.log("New player added to the queue!")
        console.log(player_ids[player_id].name, player_ids[player_id].remote_address, player_ids[player_id].remote_port, player_ids[player_id].private_address, '3456');

        var buffer = new Buffer('ok', 'utf8');
        server.send(buffer, 0, 2, remote.port, remote.address);
    }

    if (player_queue.length >= 2) {
        match_players();
    }
});

server.bind(PORT, HOST);
