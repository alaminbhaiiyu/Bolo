// RandomRealChat/server.js

const express = require('express');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const path = require('path');
const { setupSocketHandlers } = require('./route');
const { initializeDatabase } = require('./database/database');

const app = express(); // ✅ এটা আগে ডিক্লেয়ার করতে হবে
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Production e specific domain use korben
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// ✅ Uploads folder serve করার আগে check করে তৈরি করা হচ্ছে
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log(`Created uploads directory: ${uploadsDir}`);
}
app.use('/uploads', express.static(uploadsDir)); // Serve files from /uploads

// ✅ Static file serve করা হচ্ছে
app.use(express.static(path.join(__dirname, 'web/public')));
app.use('/src', express.static(path.join(__dirname, 'web/src')));

// ✅ Root route: index.html serve
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/public', 'index.html'));
});

// ✅ Database initialize
initializeDatabase('local'); // 'local' অথবা 'mongo' দিন

// ✅ Socket.io setup
setupSocketHandlers(io);

// ✅ Server listen
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});