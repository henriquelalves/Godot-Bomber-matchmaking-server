const net = require('net');
const http = require('http');

var player_count = 0;
var host = '0.0.0.0'; // Check for every incoming IP.
var port = 3456; // Port we want to spin up our server on.

var player_queue = [];

// Queue player using socket and socket chunks gathered
function queue_player(socket) {

	var string_size = socket.available_chunks[0].readUIntLE(0, 32);
	var name_string = socket.available_chunks[1].toString('utf-8', 0, string_size);
	string_size = socket.available_chunks[3].readUIntLE(0, 32);
	var ip_string = socket.available_chunks[4].toString('utf-8', 0, string_size);
	var port = socket.available_chunks[5].readUIntLE(0, 32);

	player_queue.push([socket, name_string, ip_string, port]);
	console.log("New player on queue!", name_string, ip_string, port);
}

function read_chunks(socket, buffer) {
	// chunks are: 0. name-string size; 1. name-string; 2. ip-string size; 3. ip-string; 4. port
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
		} else if (socket.current_chunk === 4) {
			socket.player_port = buffer.readUIntLE(current_byte, 4);
			current_byte += 4;
		}
		socket.current_chunk++;
	}

	if (socket.current_chunk === 5) {
		player_queue.push([socket, socket.player_name, socket.player_ip, socket.player_port]);
		console.log("New player on queue!", socket.player_name, socket.player_ip, socket.player_port);
	}
}

function send_var(type, data, socket) {

}

// When a player connects to the server
var server = net.createServer(function (socket) {

	player_count++;
	console.log('--- Player number %d connected ---', player_count)
	console.log('Socket address: ', socket.address());
	console.log('Socket localAddress: ', socket.localAddress);
	console.log('Socket localPort: ', socket.localPort);
	console.log('Socket remoteAddress: ', socket.remoteAddress);
	console.log('Socket remotePort: ', socket.remotePort);

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
