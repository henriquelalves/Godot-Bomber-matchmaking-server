const net = require('net');
const http = require('http');
const dgram = require('dgram');

var player_count = 0;
const HOST = '0.0.0.0'; // Check for every incoming IP.
const TCP_PORT = 3457; // Port we want to spin up our server on.
const UDP_PORT = 3456

var udpserver = dgram.createSocket('udp4');
var tcpserver;

var players_connecting = {}
var players_connected = {}
var players_hosting = [];

function refresh(){

}

function host(){

}

function add_player(pid, psocket) {
	psocket.private_ip = pid.split(':')[1];

	players_connecting[pid] = {
		remote_ip: pid.split(':')[0],
		private_ip: pid.split(':')[1],
		remote_port: false,
		name: false,
		socket: psocket
	}
}

function set_player_name(pid, name){
	players_connecting[pid].name = name;
}

function check_player_connection(pid, psocket) {
	var player = players_connecting[pid];
	if (player && player.name) {
		console.log("UDP > Registering new player from " + pid)
		players_connected[pid] = {
			remote_ip: player.remote_ip,
			private_ip: player.private_ip,
			remote_port: psocket.remotePort,
			name: player.name,
			socket: player.socket
		}

	}
	players_connecting[pid] = false;
}

// ================== TCP ====================

// Read chunks out of buffer
function read_chunks(socket, buffer) {
	var str = buffer.toString('utf8');
	var type = str.substr(0, 3);
	var pid = socket.remoteAddress + ':' + socket.private_ip;
	console.log("TCP > " + pid + " " + str);

	if (type === "reg"){
		add_player(socket.remoteAddress + ":" + str.substr(3), socket);
	}
	else if (type === "nam"){
		set_player_name(pid, str.substr(3));
		send_str("hey", socket);
	} else if (type === "con"){

	}
}

function send_str(data, socket) {
	var response = new Buffer(Buffer.byteLength(data));
	console.log("TCP > Sending to " + socket.remoteAddress +  ":" + socket.private_ip + " " + data);
	response.write(data, 0); // String
	socket.write(response);
}

// When a player connects to the server
tcpserver = net.createServer(function (socket) {
	// Server socket received data
	socket.on('data', function (buffer) {
		read_chunks(this, buffer);
	});

	// Player ended connection
	// socket.on('end', function () {

	// 	console.log('Client disconnected')
	// 	player_count--;
	// });
})

server.listen(TCP_PORT, HOST, function () {
	console.log("TCP, listen!");
})

// ================== UDP =================

server.on('listening', function () {
    var address = server.address();
    console.log('UDP, listen!');
});

server.on('message', function (message, remote) {
    var string = message.toString('utf8');
    // console.log(remote.address + ':' + remote.port + ' - ' + string);
    var player_id = remote.address + ":" + string;
	check_player_connection(player_id);
});

server.bind(UDP_PORT, HOST);

// ========================================
// Lazy HTTP response.
var httpserver = http.createServer(function (request, response) {
	response.writeHead(200, { "Content-Type": "text/html" });
	response.write("<!DOCTYPE \"html\">");
	response.write("<html>");
	response.write("<head>");
	response.write("<title>Bomber Matchmaking server</title>");
	response.write("</head>");
	response.write("<body>");
	response.write("Number of players: " + player_count);
	response.write("</body>");
	response.write("</html>");
	response.end();
});

httpserver.listen(80, "0.0.0.0");
