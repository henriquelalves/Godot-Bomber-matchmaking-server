extends Node

const server_ip = "40.121.198.16"
const server_port = 3456

const game_port = 3457

onready var server_connection = StreamPeerTCP.new()
onready var server_connection_status = -1

onready var timer = Timer.new()

func connection_status_change(new_status):
	if server_connection_status == 2 and new_status != 2:
		timer.stop()
	
	server_connection_status = new_status
	print("Server status: ", new_status)
	
	if new_status == 2:
		timer.start()

func on_timeout():
	server_connection.put_utf8_string("abcRONALDO")

func _ready():
	print("Trying to connect...")
	server_connection.connect_to_host(server_ip, server_port)
	
	timer.wait_time = 2.0
	timer.connect("timeout", self, "on_timeout")
	timer.one_shot = false
	
	add_child(timer)
	
	set_process(true)

func _process(delta):
	if (server_connection.get_status() != server_connection_status):
		connection_status_change(server_connection.get_status())
	if (server_connection.is_connected_to_host() and server_connection.get_available_bytes() > 0):
		var test = "OE"
		print(test)
