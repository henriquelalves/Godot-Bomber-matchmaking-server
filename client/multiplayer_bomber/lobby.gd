extends Control

onready var connecting_remote = true # If remote address fail, try private (other player may be on same lan)
onready var player_tcp = StreamPeerTCP.new()
onready var player_tcp_tick = 0

func _ready():
	# Called every time the node is added to the scene.
	gamestate.connect("connection_failed", self, "_on_connection_failed")
	gamestate.connect("connection_succeeded", self, "_on_connection_success")
#	gamestate.connect("player_list_changed", self, "refresh_lobby")
	gamestate.connect("game_ended", self, "_on_game_ended")
	gamestate.connect("game_error", self, "_on_game_error")
	servertcp.connect("finished_server_tcp", self, "_on_servertcp_finished")

func _process(delta):
	player_tcp_tick += delta
	if (player_tcp_tick > 2.0):
		if (player_tcp.is_connected_to_host()):
			$connect/error_label.text = "Connected!"
			print("Connected via remote!")
		
			if (servertcp.is_master):
				print("This client will be master!")
				gamestate.host_game($connect/name_label.text)
			else:
				print("This client will be slave!")
				gamestate.join_game(servertcp.other_remote_address, $connect/name.text, servertcp.other_remote_port)
		else:
			print("Failed, trying private IP...")
			gamestate.join_game(servertcp.other_private_address, $connect/name.text)
		set_process(false)
		player_tcp.disconnect_from_host()

func _on_servertcp_finished():
	# try stabilishing a tcp connection with other player using remote_address; if it doesnt work,
	# players are probably in the same LAN
	player_tcp.connect_to_host(servertcp.other_remote_address, servertcp.other_remote_port)
	player_tcp_tick = 0
	$connect/error_label.text = "Connecting to player..."
	set_process(true)

func _on_connection_success():
	get_node("connect").hide()

func _on_connection_failed():
	get_node("connect/search").disabled = false
	get_node("connect/error_label").set_text("Connection failed.")

func _on_game_ended():
	show()
	get_node("connect").show()
	get_node("connect/search").disabled = false

func _on_game_error(errtxt):
	get_node("error").text = errtxt
	get_node("error").popup_centered_minsize()

func _on_search_pressed():
	servertcp.player_name = $connect/name_label.text
	servertcp.start_connection()
