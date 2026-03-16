// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    const httpServer = http.createServer(server);
    
    // Initialize Socket.io
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Allow connections from anywhere (for now)
            methods: ["GET", "POST"]
        }
    });

    // --- SOCKET LOGIC STARTS HERE ---
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // 1. Join a Room
        socket.on('join-room', (roomId, userId, userName) => {
            socket.join(roomId)
            
            // Notify others in the room
            socket.to(roomId).emit('user-connected', userId, userName);

            // Handle Disconnect
            socket.on('disconnect', () => {
                console.log(`User ${userId} left room ${roomId}`);
                socket.to(roomId).emit('user-disconnected', userId);
            });
        });

        // 2. Chat Messages (Real-time Text)
        socket.on('send-message', (roomId, messageData) => {
            // Broadcast to everyone in the room INCLUDING sender (simple echo)
            socket.to(roomId).emit('receive-message', messageData);
        });

        // 3. Admin Controls (Mute/Kick)
        socket.on('admin-action', (roomId, actionData) => {
            // actionData = { targetId: '123', type: 'mute' }
            io.to(roomId).emit('admin-command', actionData);
        });

        // 4. WebRTC Signaling (The Magic Handshake)
        // These events just pass data between peers; the server doesn't look at it.
        socket.on('offer', (data) => {
            socket.to(data.roomId).emit('offer', data);
        });

        socket.on('answer', (data) => {
            socket.to(data.roomId).emit('answer', data);
        });

        socket.on('ice-candidate', (data) => {
            socket.to(data.roomId).emit('ice-candidate', data);
        });
    });

   // FIX: Use a Regex /.*/ instead of a string '*' or '(.*)'
// This bypasses the string parser completely.
server.all(/.*/, (req, res) => {
    return handle(req, res);
});

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:3000`);
    });
});