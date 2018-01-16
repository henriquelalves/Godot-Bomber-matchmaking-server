extends Control

onready var connecting_remote = true # If remote address fail, try private (other player may be on same lan)

func _ready():
	# Called every time the node is added to the scene.
	gamestate.connect("connection_failed", self, "_on_connection_failed")
	gamestate.connect("connection_succeeded", self, "_on_connection_success")
#	gamestate.connect("player_list_changed", self, "refresh_lobby")
	gamestate.connect("game_ended", self, "_on_game_ended")
	gamestate.connect("game_error", self, "_on_game_error")
	servertcp.connect("finished_server_tcp", self, "_on_servertcp_finished")

func _on_servertcp_finished():
	if (servertcp.is_master):
		gamestate.host_game($connect/name_label.text)
	else:
		gamestate.join_game(servertcp.other_remote_address, $connect/name_label.text, servertcp.other_remote_port)

#func _on_host_pressed():
#	if (get_node("connect/name").text == ""):
#		get_node("connect/error_label").text="Invalid name!"
#		return
#
#	get_node("connect").hide()
#	get_node("players").show()
#	get_node("connect/error_label").text=""
#
#	var name = get_node("connect/name").text
#	gamestate.host_game(name)
#	refresh_lobby()

#func _on_join_pressed():
#	if (get_node("connect/name").text == ""):
#		get_node("connect/error_label").text="Invalid name!"
#		return
#
#	var ip = get_node("connect/ip").text
#	if (not ip.is_valid_ip_address()):
#		get_node("connect/error_label").text="Invalid IPv4 address!"
#		return
#
#	get_node("connect/error_label").text=""
#	get_node("connect/host").disabled=true
#	get_node("connect/join").disabled=true
#
#	var name = get_node("connect/name").text
#	gamestate.join_game(ip, name)
	# refresh_lobby() gets called by the player_list_changed signal

func _on_connection_success():
	get_node("connect").hide()

func _on_connection_failed():
	if (connecting_remote): # try private
		print("Failed, trying private IP...")
		gamestate.join_game(servertcp.other_remote_address, $connect/name_label.text)
	else:
		get_node("connect/search").disabled = false
		get_node("connect/error_label").set_text("Connection failed.")

func _on_game_ended():
	show()
	get_node("connect").show()
	get_node("connect/search").disabled = false

func _on_game_error(errtxt):
	get_node("error").text = errtxt
	get_node("error").popup_centered_minsize()

#func refresh_lobby():
#	var players = gamestate.get_player_list()
#	players.sort()
#	get_node("players/list").clear()
#	get_node("players/list").add_item(gamestate.get_player_name() + " (You)")
#	for p in players:
#		get_node("players/list").add_item(p)
#	get_node("players/start").disabled=not get_tree().is_network_server()

#func _on_start_pressed():
#	gamestate.begin_game()

func _on_search_pressed():
	servertcp.player_name = $connect/name_label.text
	servertcp.start_connection()
