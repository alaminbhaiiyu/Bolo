// route/index.js
const { userConnected, userDisconnected, findNewPartner, sendMessage, userTyping, userSeen, skipPartner, getActiveUsers } = require('../logic/chatManager');
const ipinfo = require('ipinfo'); // ipinfo import korun

const setupSocketHandlers = (io) => {
    io.on('connection', async (socket) => {
        console.log('A user connected:', socket.id);

        // Get the client's IP address.
        const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

        // User connects and sends their username (browserLat/Lon will be ignored for display logic now)
        socket.on('registerUser', async ({ username, browserLat, browserLon }) => { // browserLat/Lon are still received but not prioritized for display
            let finalLocation = 'Unknown Location';

            // 1. Check for localhost
            if (clientIp === '::1' || clientIp === '127.0.0.1') {
                // If localhost, use the desired default location
                finalLocation = 'Dhaka, Bangladesh'; // Set your desired default location for localhost
                console.log(`Localhost IP detected (${clientIp}). Setting location to: ${finalLocation}`);
                
                await userConnected(socket, username, finalLocation, io);
                findNewPartner(socket, io);
                return; // Location determined, exit this handler
            }

            // 2. For non-localhost IPs, use ipinfo to get City, Country
            ipinfo((err, cLoc) => {
                if (err) {
                    console.error("❌ Error fetching IP-based location:", err);
                    finalLocation = 'Unknown Location (IP info failed)';
                } else {
                    console.log("🌍 IPinfo details for IP:", cLoc.ip);
                    console.log(`City: ${cLoc.city || 'N/A'}, Country: ${cLoc.country || 'N/A'}`);

                    if (cLoc.city && cLoc.country) {
                        finalLocation = `${cLoc.city}, ${cLoc.country}`;
                    } else if (cLoc.country) {
                        finalLocation = `${cLoc.country}`; // Fallback to just country if city is missing
                    } else {
                        finalLocation = 'Unknown Location (IP info incomplete)';
                    }
                }
                
                // Connect the user with the determined IP-based location string
                userConnected(socket, username, finalLocation, io);
                findNewPartner(socket, io);
            }, clientIp); // Pass the specific client IP to ipinfo
        });

        // ... (rest of the socket event handlers remain the same)

        // Message sending
        socket.on('sendMessage', ({ message, toUserId, messageId }) => {
            sendMessage(socket, message, toUserId, io, messageId);
        });

        // Typing indicator
        socket.on('typing', ({ toUserId }) => {
            userTyping(socket, toUserId, io);
        });

        // Seen status
        socket.on('seen', ({ messageId, fromUserId }) => {
            userSeen(socket, messageId, fromUserId, io);
        });

        // Skip partner
        socket.on('skip', () => {
            skipPartner(socket, io);
        });

        // User disconnects
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            userDisconnected(socket, io);
        });

        // Update active user count for all clients
        io.emit('activeUsersCount', getActiveUsers());
    });
};

module.exports = { setupSocketHandlers };
