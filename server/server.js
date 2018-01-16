const net = require('net');
const http = require('http');

var player_count = 0;
var host = '0.0.0.0'; // Check for every incoming IP.
var port = 3456; // Port we want to spin up our server on.

var player_queue = [];

// Read chunks out of buffer and queue player on the end
function read_chunks(socket, buffer) {
	// chunks are: 0. name-string size; 1. name-string; 2. ip-string size; 3. ip-string
	var current_byte = 0;

	console.log(buffer);
	console.log(buffer.length);

	while (buffer.length > current_byte) {
		console.log(current_byte, " ", socket.current_chunk);
		if (socket.current_chunk === 0) {
			socket.player_name_size = buffer.readUIntLE(current_byte, 4);
			current_byte += 4;
		} else if (socket.current_chunk === 1) {
			socket.player_name = buffer.toString('utf8', current_byte, current_byte + socket.player_name_size);
			current_byte += socket.player_name_size;
		} else if (socket.current_chunk === 2) {
			socket.player_ip_size = buffer.readUIntLE(current_byte, 4);
			current_byte += 4;
		} else if (socket.current_chunk === 3) {
			console.log(current_byte, socket.player_ip_size);
			socket.player_ip = buffer.toString('utf8', current_byte, current_byte + socket.player_ip_size);
			current_byte += socket.player_ip_size;
		}
		socket.current_chunk++;
	}

	if (socket.current_chunk === 4) {
		player_queue.push([socket, socket.player_name, socket.player_ip]);
		console.log("New player on queue!");
		console.log('Player remoteAddress: ', socket.remoteAddress);
		console.log('Player remotePort: ', socket.remotePort);
		console.log('Player privateAddress: ', socket.player_ip);
		console.log('Player privatePort: ', 3457);
		console.log(player_queue.length);
	}

	// Check if can arrange a match
	check_match();
}

// Check if match can be arranged
function check_match() {
	if (player_queue.length >= 2) {
		console.log("Match found!");

		send_var(player_queue[0][1], player_queue[1][0]); // Send name
		send_var(player_queue[0][0].remoteAddress, player_queue[1][0]); // Send remote IP
		send_var(player_queue[0][0].remotePort, player_queue[1][0]); // Send remote PORT
		send_var(player_queue[0][2], player_queue[1][0]); // Send private IP

		send_var(player_queue[1][1], player_queue[0][0]); // Send name
		send_var(player_queue[1][0].remoteAddress, player_queue[0][0]); // Send remote IP
		send_var(player_queue[1][0].remotePort, player_queue[0][0]); // Send remote PORT
		send_var(player_queue[1][2], player_queue[0][0]); // Send private IP

		player_queue = player_queue.splice(0, 2);
	}
}

function send_var(data, socket) {
	var response = null;

	if (typeof (data) === 'string') {
		response = new Buffer(4 + Buffer.byteLength(data));
		response.writeUIntLE(data.length, 0, 4); // Size of string
		response.write(data, 4); // String
	} else if (typeof (data) === 'number') {
		response = new Buffer(4);
		response.writeUIntLE(data, 0, 4);
	}

	socket.write(response);
}

// When a player connects to the server
var server = net.createServer(function (socket) {

	player_count++;
	console.log('--- Player number %d connected ---', player_count)
	console.log('Socket address: ', socket.address());

	socket.current_chunk = 0;

	// Server socket received data
	socket.on('data', function (buffer) {
		read_chunks(this, buffer);
	})

	// Player ended connection
	socket.on('end', function () {

		console.log('Client disconnected')
		player_count--;
	})
})

server.listen(port, host, function () {
	console.log("Hey, listen!");
})

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
