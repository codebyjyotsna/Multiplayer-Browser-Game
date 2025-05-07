const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};
const gameWidth = 800;
const gameHeight = 600;

// Helper function to detect collision
function isColliding(player1, player2) {
  const size = 20; // Assumes players are 20x20 squares
  return (
    player1.x < player2.x + size &&
    player1.x + size > player2.x &&
    player1.y < player2.y + size &&
    player1.y + size > player2.y
  );
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Add new player
  players[socket.id] = { x: Math.random() * gameWidth, y: Math.random() * gameHeight, score: 0 };

  // Send current players to the new player
  socket.emit('currentPlayers', players);

  // Notify others about the new player
  socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  // Handle player movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;

      // Check for collisions with other players
      for (const id in players) {
        if (id !== socket.id && isColliding(players[socket.id], players[id])) {
          // Award points for collisions
          players[socket.id].score += 1;
          players[id].score -= 1;

          // Broadcast updated scores
          io.emit('updateScores', { id1: socket.id, score1: players[socket.id].score, id2: id, score2: players[id].score });
        }
      }

      // Broadcast player movement
      io.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
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
