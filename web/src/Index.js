// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files from 'public' directory

let users = {};
let waitingUsers = [];

io.on('connection', (socket) => {
    // Update active users count
    io.emit('activeUsersCount', Object.keys(users).length);

    socket.on('registerUser', ({ username, browserLat, browserLon }) => {
        users[socket.id] = { 
            username, 
            partner: null, 
            location: browserLat && browserLon ? `${browserLat.toFixed(2)},${browserLon.toFixed(2)}` : 'Unknown' 
        };
        
        // Check if there are waiting users to pair with
        if (waitingUsers.length > 0) {
            const partnerSocketId = waitingUsers.shift();
            users[socket.id].partner = partnerSocketId;
            users[partnerSocketId].partner = socket.id;

            // Notify both users about the pairing
            socket.emit('partnerFound', {
                partnerId: partnerSocketId,
                partnerName: users[partnerSocketId].username,
                partnerLocation: users[partnerSocketId].location
            });
            io.to(partnerSocketId).emit('partnerFound', {
                partnerId: socket.id,
                partnerName: username,
                partnerLocation: users[socket.id].location
            });
        } else {
            // No partner available, add to waiting list
            waitingUsers.push(socket.id);
            socket.emit('waitingForPartner', { message: 'Finding new partner...' });
        }
        io.emit('activeUsersCount', Object.keys(users).length);
    });

    socket.on('sendMessage', ({ message, toUserId, messageId }) => {
        if (users[socket.id] && users[socket.id].partner === toUserId) {
            io.to(toUserId).emit('receiveMessage', {
                senderId: socket.id,
                senderName: users[socket.id].username,
                message,
                timestamp: new Date().toISOString(),
                id: messageId,
                seen: false
            });
        }
    });

    socket.on('typing', ({ toUserId }) => {
        if (users[socket.id] && users[socket.id].partner === toUserId) {
            io.to(toUserId).emit('partnerTyping', { isTyping: true });
        }
    });

    socket.on('seen', ({ messageId, fromUserId }) => {
        if (users[socket.id] && users[socket.id].partner === fromUserId) {
            io.to(fromUserId).emit('messageSeen', { messageId });
        }
    });

    socket.on('skip', () => {
        const partnerId = users[socket.id]?.partner;
        if (partnerId) {
            // Notify partner of disconnection
            io.to(partnerId).emit('partnerLeft', { message: 'Your partner has left. Finding new partner...' });
            users[partnerId].partner = null;
            // Add partner back to waiting list
            if (!waitingUsers.includes(partnerId)) {
                waitingUsers.push(partnerId);
            }
            io.to(partnerId).emit('waitingForPartner', { message: 'Finding new partner...' });
        }
        // Clear current user's partner and add to waiting list
        users[socket.id].partner = null;
        if (!waitingUsers.includes(socket.id)) {
            waitingUsers.push(socket.id);
        }
        socket.emit('waitingForPartner', { message: 'Finding new partner...' });

        // Try to pair waiting users
        tryPairWaitingUsers();
    });

    socket.on('disconnect', () => {
        const partnerId = users[socket.id]?.partner;
        if (partnerId) {
            io.to(partnerId).emit('partnerLeft', { message: 'Your partner has disconnected. Finding new partner...' });
            users[partnerId].partner = null;
            if (!waitingUsers.includes(partnerId)) {
                waitingUsers.push(partnerId);
            }
            io.to(partnerId).emit('waitingForPartner', { message: 'Finding new partner...' });
        }
        waitingUsers = waitingUsers.filter(id => id !== socket.id);
        delete users[socket.id];
        io.emit('activeUsersCount', Object.keys(users).length);
        // Try to pair waiting users
        tryPairWaitingUsers();
    });

    // Function to try pairing waiting users
    function tryPairWaitingUsers() {
        while (waitingUsers.length >= 2) {
            const user1 = waitingUsers.shift();
            const user2 = waitingUsers.shift();
            if (users[user1] && users[user2]) {
                users[user1].partner = user2;
                users[user2].partner = user1;
                io.to(user1).emit('partnerFound', {
                    partnerId: user2,
                    partnerName: users[user2].username,
                    partnerLocation: users[user2].location
                });
                io.to(user2).emit('partnerFound', {
                    partnerId: user1,
                    partnerName: users[user1].username,
                    partnerLocation: users[user1].location
                });
            }
        }
    }
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});