const net = require('net');
const http = require('http');

var client_count = 0;
var host = '0.0.0.0';//'40.121.198.16';
var port = 3456 // Port we want to spin up our server on.

/*----
 TODO: find a way to encode a client name (possibly unique) and keep a reference of it, allowing targeted responses 
----*/

// TODO: make a switch for at least the main types. 
//Also FIXME: should check for data type before reading it ( sending pure strings crashes the server)
function read_var(data){
	

	/*
	// First 4 bytes are the length of the packet, so I think they can be 
	// ignored, at least when reading. The length of the header is 4bytes
	// NOTE: If you need different kinds of inputs, you can use the integer
	// value (dataType) to differentiate data types
	var dataType = data.readUIntLE(4,4) 
	
	// In strings, the bytes from 4 to 7 (n. 4,5,6,7)
	// are used to define the string length
	var dataLength = data.readUIntLE(8,4)
	
	// Length of the entire buffer
	var dataBufLength = data.length 
	
	// Actual string content starts on byte 12 
	// and ends after %length of the string sent%
	var dataContent = data.toString('utf-8',12,12+dataLength)
	
	return dataContent;
	*/
	return "test";
}
function send_var(type,data,socket){
	
	var dataLength= Buffer.byteLength(data)
	
	// Round UP dataLength to nearest multiple of 4
	while (dataLength%4){

		dataLength++
	}
	
	// The size of the buffer is:
	// 4 bytes for the length of the packet +
	// 4 bytes for the type +
	// 4 bytes for the length of the string +
	// the length of the string, rounded up to the nearest multiple of 4
	var response = new Buffer(4+4+4+dataLength)
	response.writeUIntLE(4+4+dataLength,0,4) // Write the length of the remaining packet
	response.writeUIntLE(0x00000004,4,4) // Write the type, 4 is for strings
	response.writeUIntLE(Buffer.byteLength(data),8,4) // Write the length of the string (in bytes)
	response.write(data,12) // Write the actual string
	
	socket.write(response)
	
}

var server = net.createServer(function(socket){
	
	client_count++
	console.log('Socket address: ', socket.address());
	console.log('Socket localAddress: ', socket.localAddress);
	console.log('Socket localPort: ', socket.localPort);
	console.log('Socket remoteAddress: ', socket.remoteAddress);
	console.log('Socket remotePort: ', socket.remotePort);

	console.log('Client number %d connected', client_count)
	socket.on('data',function(chunk){
			console.log(chunk);
		
			var read = read_var(chunk)

			// Let's see if he can reply
			if (read=="who am I?"){
				
				console.log("Read: "+read)
				var strResp = "you are a demo"
				send_var(4,strResp,socket)
			}
			else if (read=="bye"){
				
				console.log("Read: "+read)
				var strResp = "GoodBye"
				send_var(4,strResp,socket)
			} 
			else {
			
				// Printing some values 
				console.log("Read: "+read)
								
				// Send the data back to the client to verify that
				// the communication works both ways.
				// NOTE: Remember to send the encoded data
				socket.write(chunk)  
			} 
	})
	socket.on('end',function(){

		console.log('Client disconnected')
		client_count--
	})
})

server.listen(port, host, function(){
	console.log(server.address())
	//console.log('Server created on %s : %d', host,port )
})

var httpserver = http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write("<!DOCTYPE \"html\">");
  response.write("<html>");
  response.write("<head>");
  response.write("<title>Bomber Matchmaking server</title>");
  response.write("</head>");
  response.write("<body>");
  response.write("Number of clients: " + client_count);
  response.write("</body>");
  response.write("</html>");
  response.end();
});

httpserver.listen(80,"0.0.0.0");
