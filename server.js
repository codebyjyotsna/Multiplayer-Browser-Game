const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Add new player
  players[socket.id] = { x: 0, y: 0 };

  // Send current players to the new player
  socket.emit('currentPlayers', players);

  // Notify others about the new player
  socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  // Handle player movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id] = data;
      io.emit('playerMoved', { id: socket.id, ...data });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
