/* 
*  server.js
*  author: Ben Connick
*  last modified: 03/14/17
*  purpose: handle socket events, serve files to the clients
*/

const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const fileHandler = require('./fileHandler.js');
const playerHandler = require("./playerHandler.js");

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// handle requests
const onRequest = (request, response) => {
  switch(request.url) {
    case "/":
      fileHandler.serveController(response);
      break;
    case "/game":
      fileHandler.serveHost(response);
      break;
    default:
      // scripts
      if (request.url.indexOf(".js") > -1) {
        fileHandler.serveScript(request.url, response)
      } 
      // images
      else if (request.url.indexOf(".png") > -1) {
        // ONLY WORKS FOR PNG RIGHT NOW
        fileHandler.serveImage(request.url, response);
      // invalid request
      } else {
        response.end();
      }
  }
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab the websocket server
const io = socketio(app);

// object to hold all of our connected users
const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
  
  	// handle player joining game
  	playerHandler.playerJoined(socket, data);
  
  	/*
    // message back
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    if (users[socket.name] === undefined) {
      socket.name = data.name;
      socket.emit('msg', joinMsg);

      socket.join('room1');

      users[socket.name] = socket;

      // announcement to everyone in the room
      const response = {
        name: 'server',
        msg: `${data.name} has joined the room.`,
      };
      socket.broadcast.to('room1').emit('msg', response);

      console.log(`${data.name} joined`);
      // success message back to new user
      socket.emit('msg', { name: 'server', msg: 'You joined the room' });
    } else {
      // failure message to the user
      socket.emit('msg', { name: 'server', msg: 'Another user already has that name' });
    }
    */
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
  });
};

const onHostAnnounce = (sock) => {
	const socket = sock;
	
	socket.on('assert game', (data) => {
		playerHandler.hostGame(sock,data);
	}); 
}

const onDisconnect = (sock) => {
  const socket = sock;


  socket.on('disconnect', () => {
    // message for remaining users
    const leaveMsg = {
      name: 'server',
      msg: `${socket.name} left the room. There are ${Object.keys(users).length - 1} users online`,
    };

    delete users[socket.name]; // clear user from list

    socket.broadcast.to('room1').emit('msg', leaveMsg);

    console.log(`${socket.name} left`);
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  
  playerHandler.trackSocket(socket);

  onJoined(socket);
  onHostAnnounce(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('websocket server started');
