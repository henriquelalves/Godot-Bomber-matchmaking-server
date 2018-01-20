extends Control

onready var connecting_remote = true # If remote address fail, try private (other player may be on same lan)

onready var player_udp = PacketPeerUDP.new()
onready var connecting_to_player = false
onready var player_ping_tick = 0.0
onready var hosting = false
onready var joining = false
onready var hosting_countdown = 0.0
onready var joining_countdown = 0.0
onready var player_response = "ping"

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
	
	if(player_udp.is_listening() and player_ping_tick > 0.5): # ping other player
		player_ping_tick -= 0.5
		player_udp.put_packet(player_response.to_utf8())
	
	if (hosting): # is hosting
		hosting_countdown += delta
		if(hosting_countdown > 3.0):
			$connect/error_label.text = "Connected! Beginning match..."
			print("Closing socket, hosting...")
			set_process(false)
			player_udp.close()
			gamestate.host_game($connect/name.text)
	elif (joining): # is joining
		joining_countdown += delta
		if(joining_countdown > 3.0):
			$connect/error_label.text = "Connected! Beginning match..."
			print("Closing socket, joining...")
			set_process(false)
			player_udp.close()
			gamestate.join_game(serverudp.other_remote_ip, $connect/name.text, serverudp.other_remote_port)
	else:
		if(player_udp.is_listening() and player_udp.get_available_packet_count() > 0):
			var response = player_udp.get_packet().get_string_from_utf8()
			print(response)
			
			if (response == "ping"): # trying to connect
				player_udp.put_packet("pong".to_utf8())
				player_response = "pong"
			elif (response == "pong" and serverudp.is_master == 1): # i reached it!
				player_udp.put_packet("hosting".to_utf8())
				player_response = "hosting"
				connecting_to_player = true
				hosting = true
			elif (response == "pong" and serverudp.is_master == 0):
				player_response = "pong"
			elif (response == "hosting" and not joining):
				joining = true

func _on_match_found():
	$connect/error_label.text = "Connecting to player..."
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
#	print("working\n")
	$connect/error_label.text = "Connecting to server..."
	$connect/search.disabled = true
	
#	serverudp.player_name = $connect/name.text
	serverenet.start_connection()
