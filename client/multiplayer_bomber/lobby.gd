extends Control

onready var connecting_remote = true # If remote address fail, try private (other player may be on same lan)

onready var player_udp = PacketPeerUDP.new()
onready var connecting_to_player = false
onready var player_ping_tick = 0.0

func _ready():
	# Called every time the node is added to the scene.
	gamestate.connect("connection_failed", self, "_on_connection_failed")
	gamestate.connect("connection_succeeded", self, "_on_connection_success")
	gamestate.connect("game_ended", self, "_on_game_ended")
	gamestate.connect("game_error", self, "_on_game_error")
	
	serverudp.connect("match_found", self, "_on_match_found")
	serverudp.connect("server_ok", self, "_on_server_ok")
	serverudp.connect("server_not_ok", self, "_on_server_not_ok")
	
	set_process(false)

func _process(delta):
	player_ping_tick += delta
	
	if(player_ping_tick > 1.0):
		player_ping_tick -= 1.0
		player_udp.put_packet("ping".to_utf8())
	
	if(player_udp.is_listening() and player_udp.get_available_packet_count() > 0):
		player_udp.put_packet("ping".to_utf8()) # Last packet!
		$connect/error_label.text = "Connected! Beginning match..."
		player_udp.close() # open the socket for us
		if(serverudp.is_master):
			gamestate.host_game($connect/name.text)
		else:
			gamestate.join_game(serverudp.other_remote_ip, $connect/name.text, serverudp.other_remote_port)
		set_process(false)

func _on_match_found():
	$connect/error_label.text = "Connecting to player..."
	connecting_to_player = true
	set_process(true)
	player_udp.listen(3456)
	player_udp.set_dest_address(serverudp.other_remote_ip, serverudp.other_remote_port)
	player_udp.put_packet("ping".to_utf8())

func _on_server_ok():
	$connect/error_label.text = "Finding match..."

func _on_server_not_ok():
	$connect/error_label.text = "Server not ok :("
	$connect/search.disabled = false

func _on_connection_success():
	$connect.hide()

func _on_connection_failed():
	$connect/search.disabled = false
	$connect/error_label.text = "Connection failed."

func _on_game_ended():
	show()
	$connect.show()
	$connect/search.disabled = false

func _on_game_error(errtxt):
	$error.text = errtxt
	$error.popup_centered_minsize()

func _on_search_pressed():
	$connect/error_label.text = "Connecting to server..."
	$connect/search.disabled = true
	
	serverudp.player_name = $connect/name.text
	serverudp.start_connection()
