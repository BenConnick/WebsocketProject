/*
*  playerHandler.js
*  author: Ben Connick
*  last modified: 03/14/17
*  purpose: handle server code related to player management
*/

// list of sockets and names
const players = [];
const gameClients = [];


// functions for tracking players
// ---------------------------------------

// roomcode generator
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const getRandomLetter = () => letters[Math.floor(Math.random() * 26)];

// search an array for an object with a given property == a value
const indexOfElemWithProperty = (arrayOfObjects, propertyName, match) => {
  // loop
  for (let i = 0; i < arrayOfObjects.length; i++) {
    // match found
    if (match === arrayOfObjects[i][propertyName]) {
      return i;
    }
  }
  // no match found
  return -1;
};

const getPlayerSocketFromName = (name) => {
  const id = indexOfElemWithProperty(players, 'name', name);
  if (id < 0) {
    return undefined;
  }
  return players[id].socket;
};

const getPlayerNameFromSocket = (socket) => {
  const id = indexOfElemWithProperty(players, 'socket', socket);
  if (id < 0) {
    return undefined;
  }
  return players[id].name;
};

const getPlayerRoomFromSocket = (socket) => {
  const id = indexOfElemWithProperty(players, 'socket', socket);
  if (id < 0) {
    return undefined;
  }
  return players[id].room;
};

const getHostSocketFromRoom = (room) => {
  const id = indexOfElemWithProperty(gameClients, 'roomKey', room);
  if (id < 0) {
    return undefined;
  }
  return gameClients[id].socket;
};

const getHostRoomFromSocket = (socket) => {
  const id = indexOfElemWithProperty(gameClients, 'socket', socket);
  if (id < 0) {
    return undefined;
  }
  return gameClients[id].roomKey;
};

const playerJoined = (socket, msg) => {
  // parse join args
  const join = JSON.parse(msg);
  // if the name is already taken
  if (indexOfElemWithProperty(players, 'name', join.name) > -1) {
    socket.emit('join status', 'name taken');
  } else {
    // locate the game client for this player
    const gameClient = getHostSocketFromRoom(join.roomKey);
    // if the room does not exist
    if (gameClient === undefined) {
      socket.emit('join status', 'room does not exist');
    } else {
      // join the room
      socket.join(join.roomKey);
      // set room
      players[players.length - 1].room = join.roomKey;
      // add player avatar to the world
      gameClient.emit('add player', `{ "name" : "${join.name}"}`);
      // set name
      players[players.length - 1].name = join.name;
      // success
      socket.emit('join status', 'success');

      // debug
      console.log(`${join.name} joined room ${join.roomKey}`);
    }
  }
};

const parsePlayerInput = (socket, msg) => {
  const gameClient = getHostSocketFromRoom(getPlayerRoomFromSocket(socket));
  // if there is no game client, do nothing
  if (!gameClient) return;
  // object
  const o = JSON.parse(msg);
  if (o) {
  // pass json string to game client
  // gameClient.emit('output', msg);
    socket.broadcast.to(gameClient.id).emit('output', msg);
  } else {
    console.log(`invalid input: ${msg}`);
  }
};

// when a client creates a game, remove the client from the player list
// ----------------------------------
const hostGame = (socket) => {
  // remove from player list
  const idx = indexOfElemWithProperty(players, 'socket', socket);
  if (idx !== undefined) {
    players.splice(idx, 1);
  }
  // create a room key
  let key = '';
  for (let i = 0; i < 4; i++) {
    key += getRandomLetter();
  }

  // set game
  gameClients.push({ socket, roomKey: key });
  // join own room
  socket.join(key);

  // debug
  console.log(`key ${key} assigned to socket id# ${socket.id}`);

  // server acknowledge key creation successful
  socket.emit('key', key);
};

const trackSocket = (socket) => {
  // add the client
  players.push({ socket, name: 'unknown', room: 'no room' });
};

module.exports.parsePlayerInput = parsePlayerInput;
module.exports.playerJoined = playerJoined;
module.exports.hostGame = hostGame;
module.exports.getPlayerSocketFromName = getPlayerSocketFromName;
module.exports.getPlayerNameFromSocket = getPlayerNameFromSocket;
module.exports.getHostSocketFromRoom = getHostSocketFromRoom;
module.exports.getHostRoomFromSocket = getHostRoomFromSocket;
module.exports.getRandomLetter = getRandomLetter;
module.exports.trackSocket = trackSocket;
