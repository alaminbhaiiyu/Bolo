// database/database.js
const localHandler = require('./localHandler');
const mongoHandler = require('./mongoHandler'); // Eita banate hobe jodi MongoDB use koren

let currentDbHandler = null;

/**
 * Initializes the database handler.
 * @param {'local' | 'mongo'} dbType - 'local' for file system, 'mongo' for MongoDB.
 */
const initializeDatabase = (dbType) => {
    if (dbType === 'mongo') {
        console.log('Using MongoDB for database operations.');
        currentDbHandler = mongoHandler;
        // mongoHandler.connect(); // MongoDB connection logic mongoHandler er moddhe thakbe
    } else {
        console.log('Using local file system for database operations.');
        currentDbHandler = localHandler;
    }
};

const saveMessage = async (senderUsername, receiverUsername, messageData) => {
    if (!currentDbHandler) throw new Error("Database not initialized. Call initializeDatabase() first.");
    return currentDbHandler.saveMessage(senderUsername, receiverUsername, messageData);
};

const getChatHistory = async (user1Username, user2Username) => {
    if (!currentDbHandler) throw new Error("Database not initialized. Call initializeDatabase() first.");
    return currentDbHandler.getChatHistory(user1Username, user2Username);
};

const updateMessageSeenStatus = async (senderUsername, receiverUsername, messageId, seenStatus) => {
    if (!currentDbHandler) throw new Error("Database not initialized. Call initializeDatabase() first.");
    return currentDbHandler.updateMessageSeenStatus(senderUsername, receiverUsername, messageId, seenStatus);
};

module.exports = {
    initializeDatabase,
    saveMessage,
    getChatHistory,
    updateMessageSeenStatus
};
