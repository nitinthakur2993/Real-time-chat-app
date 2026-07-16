import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from your .env file
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Allow the frontend to communicate with the backend
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
}));

// Set up Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

// Listen for connections from clients
io.on('connection', (socket) => {
    console.log(`A user connected with ID: ${socket.id}`);

    // NEW: Listen for a user joining a specific room
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ID: ${socket.id} joined room: ${room}`);
    });

    // Listen for incoming messages and send ONLY to the specific room
    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
    });

    // Broadcast typing status ONLY to the specific room
    socket.on('typing', (data) => {
        socket.to(data.room).emit('user_typing', data.username);
    });

    socket.on('stop_typing', (room) => {
        socket.to(room).emit('user_stopped_typing');
    });

    // Listen for disconnections
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running beautifully on port ${PORT}`);
});