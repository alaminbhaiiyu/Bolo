// database/mongoHandler.js
// const mongoose = require('mongoose');

// // Define your Chat Message Schema
// const chatMessageSchema = new mongoose.Schema({
//     id: String, // Unique ID for frontend tracking (e.g., for seen status)
//     senderId: String,
//     senderName: String,
//     message: String,
//     timestamp: { type: Date, default: Date.now },
//     seen: { type: Boolean, default: false }
// });

// const ChatConversationSchema = new mongoose.Schema({
//     participants: [{ type: String, required: true }], // Usernames
//     messages: [chatMessageSchema]
// });

// const ChatConversation = mongoose.model('ChatConversation', ChatConversationSchema);

// const connect = async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/randomRealChatDB', {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log('MongoDB connected successfully.');
//     } catch (error) {
//         console.error('MongoDB connection error:', error);
//         process.exit(1);
//     }
// };

// const getConversation = async (user1Username, user2Username) => {
//     const sortedParticipants = [user1Username, user2Username].sort();
//     let conversation = await ChatConversation.findOne({ participants: sortedParticipants });
//     if (!conversation) {
//         conversation = new ChatConversation({ participants: sortedParticipants, messages: [] });
//         await conversation.save();
//     }
//     return conversation;
// };

// const saveMessage = async (senderUsername, receiverUsername, messageData) => {
//     const conversation = await getConversation(senderUsername, receiverUsername);
//     conversation.messages.push(messageData);
//     await conversation.save();
// };

// const getChatHistory = async (user1Username, user2Username) => {
//     const conversation = await getConversation(user1Username, user2Username);
//     return conversation.messages;
// };

// const updateMessageSeenStatus = async (senderUsername, receiverUsername, messageId, seenStatus) => {
//     const conversation = await getConversation(senderUsername, receiverUsername);
//     const message = conversation.messages.find(msg => msg.id === messageId && msg.senderName === senderUsername);
//     if (message) {
//         message.seen = seenStatus;
//         await conversation.save();
//     }
// };

// module.exports = {
//     connect,
//     saveMessage,
//     getChatHistory,
//     updateMessageSeenStatus
// };
