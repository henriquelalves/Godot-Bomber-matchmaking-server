extends Node

const server_ip = "40.121.198.16"
const server_port = 3456

const game_port = 3457

onready var server_connection = StreamPeerTCP.new()
onready var server_connection_status = -1


func connection_status_change(new_status):
	server_connection_status = new_status
	print("Server status: ", new_status)
	
	if (new_status == 2):
		server_connection.put_utf8_string("aaa");
		server_connection.put_utf8_string("mdsdoceu");
		server_connection.put_u32(0x1f);

func start_connection():
	print("Trying to connect...")
	server_connection.connect_to_host(server_ip, server_port)
	
	set_process(true)

func _process(delta):
	if (server_connection.get_status() != server_connection_status):
		connection_status_change(server_connection.get_status())
	if (server_connection.is_connected_to_host() and server_connection.get_available_bytes() > 0):
		pass