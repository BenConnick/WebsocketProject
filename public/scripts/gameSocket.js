let output;
let socket;

const setupSocketIO = () => {
  socket = io();
  socket.emit('assert game', 'I am the game host');
  
  // handles player input, global func in game.js
  socket.on('output', (msg) => {
	handlePlayerInput(msg);
  });
  
  socket.on('add player', (msg) => {
  	// new player
	const o = JSON.parse(msg);
	// add and track avatar
	addPlayer(o.name, o.type);
  });
  socket.on('key', (msg) => {
	document.querySelector(".follow").innerHTML = document.querySelector(".follow").innerHTML + "<br>room key: "  + msg;
  });
}

const initSocket = () => {
	if (!offline) setupSocketIO();
	output = document.getElementById("resultsInner");
	console.log("Ready to begin");
}
const send = (recipientName, msg) => {
	if (offline) return;
	const json = '{ "name": "' + recipientName + '", "message": "'+msg+'"}';
	socket.emit('feedback',json);
}

window.addEventListener("load",initSocket);