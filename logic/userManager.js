// logic/userManager.js
const users = new Map(); // userId -> { id, username, location, socketId, partnerId }

const addUser = (id, username, location) => {
    const user = { id, username, location, partnerId: null };
    users.set(id, user);
    return user;
};

const removeUser = (id) => {
    const user = users.get(id);
    if (user) {
        users.delete(id);
        return user;
    }
    return null;
};

const getUser = (id) => {
    return users.get(id);
};

const setPartner = (userId1, userId2) => {
    const user1 = users.get(userId1);
    const user2 = users.get(userId2);
    if (user1 && user2) {
        user1.partnerId = userId2;
        user2.partnerId = userId1;
    }
};

const removePartner = (userId) => {
    const user = users.get(userId);
    if (user) {
        user.partnerId = null;
    }
};

const getPartner = (userId) => {
    const user = users.get(userId);
    if (user && user.partnerId) {
        return users.get(user.partnerId);
    }
    return null;
};

const getUsersInChat = () => {
    return Array.from(users.values()).filter(user => user.partnerId !== null);
};

const getActiveUsersCount = () => {
    return users.size;
};

module.exports = {
    addUser,
    removeUser,
    getUser,
    setPartner,
    removePartner,
    getPartner,
    getUsersInChat,
    getActiveUsersCount
};
