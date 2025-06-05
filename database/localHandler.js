// database/localHandler.js
const fs = require('fs').promises;
const path = require('path');

const baseDir = path.join(__dirname, '..', 'data'); // data folder root project e thakbe

const ensureDirExists = async (dir) => {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating directory ${dir}:`, error);
            throw error;
        }
    }
};

const getChatFilePath = (user1, user2) => {
    // Duita user er username alphabet order e sort kore chat file name banano hoy
    const [sortedUser1, sortedUser2] = [user1, user2].sort();
    const chatDir = path.join(baseDir, sortedUser1, 'chats');
    return path.join(chatDir, `${sortedUser2}.json`);
};

const saveMessage = async (senderUsername, receiverUsername, messageData) => {
    const chatFilePath = getChatFilePath(senderUsername, receiverUsername);
    await ensureDirExists(path.dirname(chatFilePath)); // Directory exist kore kina check kora

    let chatMessages = [];
    try {
        const data = await fs.readFile(chatFilePath, 'utf8');
        chatMessages = JSON.parse(data);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error reading chat file for saving:', error);
            return;
        }
        // File na thakle empty array theke shuru korbe
    }

    chatMessages.push(messageData);
    await fs.writeFile(chatFilePath, JSON.stringify(chatMessages, null, 2), 'utf8');
    // console.log(`Message saved for ${senderUsername} and ${receiverUsername}`);
};

const getChatHistory = async (user1Username, user2Username) => {
    const chatFilePath = getChatFilePath(user1Username, user2Username);
    try {
        const data = await fs.readFile(chatFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // No chat history yet
        }
        console.error('Error getting chat history:', error);
        return [];
    }
};

const updateMessageSeenStatus = async (senderUsername, receiverUsername, messageId, seenStatus) => {
    const chatFilePath = getChatFilePath(senderUsername, receiverUsername);
    try {
        const data = await fs.readFile(chatFilePath, 'utf8');
        let chatMessages = JSON.parse(data);

        // Fix: `messageId` er shathe `senderId` o match korar cheshta kora hoyeche,
        // jate unique message mark kora jay. (senderName diyeo kora jay)
        const messageIndex = chatMessages.findIndex(
            msg => msg.id === messageId && msg.senderName === senderUsername // Make sure it's the specific message by the specific sender
        );

        if (messageIndex !== -1) {
            chatMessages[messageIndex].seen = seenStatus;
            await fs.writeFile(chatFilePath, JSON.stringify(chatMessages, null, 2), 'utf8');
            console.log(`Message ${messageId} seen status updated.`);
        }
    } catch (error) {
        console.error('Error updating message seen status:', error);
    }
};

module.exports = {
    saveMessage,
    getChatHistory,
    updateMessageSeenStatus
};
