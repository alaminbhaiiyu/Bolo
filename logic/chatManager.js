// logic/chatManager.js
const { addUser, removeUser, getUser, getPartner, setPartner, removePartner, getActiveUsersCount } = require('./userManager');
const { enqueueUser, dequeueUser, isUserInQueue, removeFromQueue, getQueueSize } = require('./queueManager');
const { saveMessage, getChatHistory, updateMessageSeenStatus } = require('../database/database');

const userConnected = (socket, username, location, io) => {
    // User already connected thakle re-register korar dorkar nei
    if (getUser(socket.id)) {
        return;
    }
    const user = addUser(socket.id, username, location);
    io.emit('activeUsersCount', getActiveUsersCount()); // Shob client ke update kora hocche
    console.log(`User registered: ${username} (${socket.id}) at ${location}`);
};

const userDisconnected = (socket, io) => {
    const user = getUser(socket.id);
    if (user) {
        // Jodi user kono chat e thake, tar partner ke notify korbe
        const partner = getPartner(socket.id);
        if (partner) {
            removePartner(socket.id);
            removePartner(partner.id);
            const partnerSocket = io.sockets.sockets.get(partner.id);
            if (partnerSocket) {
                partnerSocket.emit('partnerLeft', { message: 'Your partner left the chat. Finding new partner...' });
                enqueueUser(partner.id); // Partner ke queue te abar dhukano holo
                findNewPartner(partnerSocket, io); // Partner er jonno notun partner khuje deya holo
            }
        }
        // Jodi user queue te thake, queue theke remove kora holo
        if (isUserInQueue(socket.id)) {
            removeFromQueue(socket.id);
        }
        removeUser(socket.id); // User ke system theke remove kora holo
        io.emit('activeUsersCount', getActiveUsersCount()); // Active user count update kora holo
        console.log(`User disconnected: ${user.username} (${socket.id})`);
    }
};

const findNewPartner = (socket, io) => {
    const userId = socket.id;
    const currentUser = getUser(userId);

    if (!currentUser) {
        console.log(`Attempted to find partner for unregistered user: ${userId}`);
        return;
    }

    if (currentUser.partnerId) {
        console.log(`${currentUser.username} already has a partner.`);
        return; // Already has a partner
    }

    const availablePartnerId = dequeueUser(userId);

    if (availablePartnerId) {
        const partnerSocket = io.sockets.sockets.get(availablePartnerId);
        const partnerUser = getUser(availablePartnerId);

        if (partnerSocket && partnerUser) {
            setPartner(userId, availablePartnerId); // Duijoner moddhe partner set kora holo

            // Duijon ke notify kora holo, partner er location soho
            socket.emit('partnerFound', {
                partnerName: partnerUser.username,
                partnerLocation: partnerUser.location, // Partner er location pathano
                partnerId: partnerUser.id
            });
            partnerSocket.emit('partnerFound', {
                partnerName: currentUser.username,
                partnerLocation: currentUser.location, // Current user er location pathano
                partnerId: currentUser.id
            });
            console.log(`Paired ${currentUser.username} with ${partnerUser.username}`);

            // Chat history load kora (optional)
            // getChatHistory(currentUser.username, partnerUser.username).then(history => {
            //     socket.emit('chatHistory', history);
            //     partnerSocket.emit('chatHistory', history);
            // });

        } else {
            // Jodi partner disconnect hoye jay dequeue korar por
            console.log(`Dequeued partner ${availablePartnerId} not found. Re-enqueueing ${currentUser.username}.`);
            enqueueUser(userId); // Current user ke abar queue te dhukano holo
            socket.emit('waitingForPartner', { message: 'Oops! Partner disconnected. Finding new user...' });
        }
    } else {
        // Partner na pele queue te dhukano holo
        enqueueUser(userId);
        socket.emit('waitingForPartner', { message: 'Waiting for new user...' });
        console.log(`${currentUser.username} added to queue. Queue size: ${getQueueSize()}`);
    }
};

const sendMessage = (socket, message, toUserId, io, messageId) => {
    const sender = getUser(socket.id);
    const receiver = getUser(toUserId);

    if (sender && receiver && sender.partnerId === receiver.id) {
        const messageData = {
            id: messageId, // Frontend generate koreche
            senderId: sender.id,
            senderName: sender.username,
            message: message,
            timestamp: new Date().toISOString(),
            seen: false // Initially not seen
        };

        // Message database e save kora hocche
        saveMessage(sender.username, receiver.username, messageData);

        // Message receiver ke pathano hocche
        io.to(toUserId).emit('receiveMessage', messageData);

        // Sender ke confirmation deya hocche (optional)
        socket.emit('messageSentConfirmation', { messageId: messageId });
        console.log(`Message from ${sender.username} to ${receiver.username}: "${message}"`);
    } else {
        console.log(`Failed to send message from ${sender?.username} to ${receiver?.username}. Invalid partner or user.`);
    }
};

const userTyping = (socket, toUserId, io) => {
    const sender = getUser(socket.id);
    const receiver = getUser(toUserId);

    if (sender && receiver && sender.partnerId === receiver.id) {
        io.to(toUserId).emit('partnerTyping', { isTyping: true });
    }
};

const userSeen = (socket, messageId, fromUserId, io) => {
    const receiver = getUser(socket.id);
    const sender = getUser(fromUserId);

    if (receiver && sender && receiver.partnerId === sender.id) {
        // Message database e seen hishebe update kora hocche
        updateMessageSeenStatus(sender.username, receiver.username, messageId, true);
        // Sender ke notify kora hocche je message seen hoyeche
        io.to(fromUserId).emit('messageSeen', { messageId: messageId });
        console.log(`Message ${messageId} from ${sender.username} to ${receiver.username} seen.`);
    }
};

const skipPartner = (socket, io) => {
    const currentUser = getUser(socket.id);
    if (!currentUser) {
        console.log(`Attempted to skip for unregistered user: ${socket.id}`);
        return;
    }

    const previousPartnerId = currentUser.partnerId;

    if (previousPartnerId) {
        const previousPartnerSocket = io.sockets.sockets.get(previousPartnerId);

        // Duijoner partner relation remove kora holo
        removePartner(socket.id);
        removePartner(previousPartnerId);

        if (previousPartnerSocket) {
            // Previous partner ke notify kora holo
            previousPartnerSocket.emit('partnerLeft', { message: 'Your partner skipped the chat. Finding new partner...' });
            enqueueUser(previousPartnerId); // Previous partner ke queue te dhukano holo
            findNewPartner(previousPartnerSocket, io); // Notun partner khuje deya holo
        }
        socket.emit('partnerLeft', { message: 'You skipped the chat. Finding new partner...' });
    } else {
        socket.emit('partnerLeft', { message: 'Finding new partner...' });
    }
    // Current user ke queue te dhukano holo
    enqueueUser(socket.id);
    findNewPartner(socket, io);
    console.log(`${currentUser.username} skipped. Searching for new partner.`);
};

const getActiveUsers = () => {
    return getActiveUsersCount();
};

module.exports = {
    userConnected,
    userDisconnected,
    findNewPartner,
    sendMessage,
    userTyping,
    userSeen,
    skipPartner,
    getActiveUsers
};
