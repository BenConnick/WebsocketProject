/* 
*  playerHandler.js
*  author: Ben Connick
*  last modified: 03/14/17
*  purpose: handle server code related to player management
*/

// list of sockets and names
const playerNames = [];
const players = [];
const gameClients = [];


// functions for tracking players
// ---------------------------------------

const playerJoined = (socket, msg) => {
  // parse join args
  const join = JSON.parse(msg);
  // if the name is already taken
  if (playerNames.indexOf(join.name) > -1) {
    socket.emit('join status', 'name taken');
  } 
  else {
    // locate the game client for this player
    const gameClient = getHostSocketFromRoom(join.roomKey);
    // if the room does not exist
    if (gameClient === undefined) {
      socket.emit('join status', 'room does not exist');
    } 
    else {
      // room and name valid, set both
      const idx = players.indexOf(socket);
      
      // join the room
      socket.join(join.roomKey);
      gameClient.emit('add player', '{ "name" : "' + join.name + '"}');
      playerNames[idx] = join.name;
      socket.emit('join status', 'success');
      
      // debug
      console.log(join.name+" joined room "+join.roomKey);
    }
  }
}

// search an array for an object with a given property == a value
const indexOfElemWithProperty = (arrayOfObjects, propertyName, match) => {
	// loop
	for (let i=0; i<arrayOfObjects.length; i++) {
		//match found
		if (match === arrayOfObjects[i][propertyName]) {
			return i;
		}
	}
	// no match found
	return -1;
}

const getPlayerSocketFromName = (name) => {
	let id = playerNames.indexOf(name);
	if (id < 0) {
		return undefined;
	} else {
		return players[id];
	}
}

const getPlayerNameFromSocket = (socket) => {
	let id = players.indexOf(socket);
	if (id < 0) {
		return undefined;
	} else {
		return playerNames[id];
	}
}

const getHostSocketFromRoom = (room) => {
	let id = indexOfElemWithProperty(gameClients, "roomKey", room);
	if (id < 0) {
		return undefined;
	} else {
		return gameClients[id].socket;
	}
}

const getHostRoomFromSocket = (socket) => {
	let id = indexOfElemWithProperty(gameClients, "socket", socket);
	if (id < 0) {
		return undefined;
	} else {
		return gameClients[id].roomKey;
	}
}

// roomcode generator
let letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
const getRandomLetter = () => {
	return letters[Math.floor(Math.random()*26)];
}

module.exports.playerJoined = playerJoined;
module.exports.getPlayerSocketFromName = getPlayerSocketFromName;
module.exports.getPlayerNameFromSocket = getPlayerNameFromSocket;
module.exports.getHostSocketFromRoom = getHostSocketFromRoom;
module.exports.getHostRoomFromSocket = getHostRoomFromSocket;
module.exports.getRandomLetter = getRandomLetter;
