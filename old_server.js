var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var players = []; // store all the connected users' sockets
var playerNames = []; // index matches player socket index
var gameClients = []; // the clients running the game

// Send the controller to the phones
// ----------------------------------
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/controller.html');
});

// Send the game client to the computer
// ----------------------------------
app.get('/game', function(req, res){
  res.sendFile(__dirname + '/public/game.html');
});

// Add players when they connect
// ----------------------------------
io.on('connection', function(socket){
  // add the client
  players.push(socket);
  playerNames.push("unknown");
  
  // join command
  socket.on('join', function(msg) {
  	// parse join args
  	var join = JSON.parse(msg);
  	// if the name is already taken
	if (playerNames.indexOf(join.name) > -1) {
		socket.emit('join status', 'name taken');
	} 
	else {
		// game client
		var gameClient = getHostSocketFromRoom(join.roomKey);
		// if the room does not exist
		if (gameClient == undefined) {
			socket.emit('join status', 'room does not exist');
		} 
		else {
			// room and name valid, set both
			var idx = players.indexOf(socket);
			// check validity
			if (gameClient) {
				// join the room
				socket.join(join.roomKey);
				gameClient.emit('add player', '{ "name" : "' + join.name + '"}');
				playerNames[idx] = join.name;
				socket.emit('join status', 'success');
				console.log(join.name+" joined room "+join.roomKey)
			} else {
				socket.emit('join status', 'HOST ERROR: room exists but host is not valid');
			}
		}
	}
  });
  
  // when the player does something, pass the message to the client
  // ----------------------------------
  socket.on('input', function(msg){
  	//console.log ("input recieved from" + socket.id);
  	//var roomIdx = indexOfElemWithProperty(gameClients, "roomKey", socket.room);
  	//console.log ("input for room " + socket.rooms[1]);
  	var gameClient = getHostSocketFromRoom(socket.rooms[1])
  
  	// if there is no game client, do nothing
  	if (!gameClient) return;
	var o = JSON.parse(msg);
	if (o) {
		//io.emit('output', o.btn);
		// pass json string to game client
		io.to(gameClient.id).emit('output', msg); 
		}
	else {
		console.log("invalid input: " + msg);
		}
  });
  
  // when the player or host leaves, remove them from the list
  // ----------------------------------
  socket.on('disconnect', function() {
	// remove client
	
	// player?
	var idx = players.indexOf(socket);
	if (idx != -1) {
		players.splice(idx,	1);
		console.log(playerNames[idx] + " left the game");
		playerNames.splice(idx, 1);
	} 
	
	// host?
	else {
		idx = indexOfElemWithProperty(gameClients, "socket", socket);
		if (idx != -1) {
			gameClients.splice(idx, 1);
			console.log("Game host disconnected");
		}
	}
  });
  
  // when a client creates a game, remove the client from the player list
  // ----------------------------------
  socket.on('assert game', function() {
	// remove from player list
	var idx = players.indexOf(socket);
	if (idx != undefined) {
		players.splice(idx, 1);
		playerNames.splice(idx, 1);
	}
	// create a room key
	var key = "";
	for (var i=0; i<4; i++) {
		key += getRandomLetter();
	}
	
	// set game
	gameClients.push({"socket": socket, "roomKey": key});
	// join own room
	socket.join(key);
	console.log("key " + key + " to " + socket.id);
	io.to(socket.id).emit("key", key);
	//gameClient = socket;
  });
  
  // send a specific controller the feedback from the game
  // ----------------------------------
  socket.on('feedback', function(feedback) {
	// json
	var o = JSON.parse(feedback);
	// get name and make sure it exists
	var idx = playerNames.indexOf(o.name);
	if (idx > -1) {
		console.log(o.name + " " + o.message);
		socket.to(players[idx].id).emit('output',o.message); // send
	}
	else {
		console.log(o.name + " not found");
		console.log("All players: ");
		console.log(playerNames);
		/*console.log("adding...");
		playerNames[playerNames.length] = o.name;
		console.log(o.name + " added");*/
	}
  });
});

// port 80
var port = process.env.PORT || 8080;

// start server listen to all IPs on port
http.listen(port, "0.0.0.0", 511, function(){
  console.log('listening on *:'+port);
});


// utility functions
// ----------------------------------

// search an array for an object with a given property == a value
function indexOfElemWithProperty(arrayOfObjects, propertyName, match) {
	// loop
	for (var i=0; i<arrayOfObjects.length; i++) {
		//match found
		if (match === arrayOfObjects[i][propertyName]) {
			return i;
		}
	}
	// no match found
	return -1;
}

function getPlayerSocketFromName(name) {
	var id = playerNames.indexOf(name);
	if (id < 0) {
		return undefined;
	} else {
		return players[id];
	}
}

function getPlayerNameFromSocket(socket) {
	var id = players.indexOf(socket);
	if (id < 0) {
		return undefined;
	} else {
		return playerNames[id];
	}
}

function getHostSocketFromRoom(room) {
	var id = indexOfElemWithProperty(gameClients, "roomKey", room);
	if (id < 0) {
		return undefined;
	} else {
		return gameClients[id].socket;
	}
}

function getHostRoomFromSocket(socket) {
	var id = indexOfElemWithProperty(gameClients, "socket", socket);
	if (id < 0) {
		return undefined;
	} else {
		return gameClients[id].roomKey;
	}
}

var letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
function getRandomLetter() {
	return letters[Math.floor(Math.random()*26)];
}