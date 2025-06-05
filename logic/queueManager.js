// logic/queueManager.js
const userQueue = []; // Users waiting for a partner

const enqueueUser = (userId) => {
    if (!userQueue.includes(userId)) {
        userQueue.push(userId);
        console.log(`User ${userId} enqueued. Queue size: ${userQueue.length}`);
    }
};

const dequeueUser = (currentUserId) => {
    for (let i = 0; i < userQueue.length; i++) {
        if (userQueue[i] !== currentUserId) { // Nijer shathe nijer chat hobena
            const partnerId = userQueue[i];
            userQueue.splice(i, 1); // Queue theke remove kora holo
            console.log(`User ${partnerId} dequeued for ${currentUserId}. Remaining queue size: ${userQueue.length}`);
            return partnerId;
        }
    }
    return null; // No available partner
};

const removeFromQueue = (userId) => {
    const index = userQueue.indexOf(userId);
    if (index !== -1) {
        userQueue.splice(index, 1);
        console.log(`User ${userId} removed from queue. Remaining queue size: ${userQueue.length}`);
        return true;
    }
    return false;
};

const isUserInQueue = (userId) => {
    return userQueue.includes(userId);
};

const getQueueSize = () => {
    return userQueue.length;
};

module.exports = {
    enqueueUser,
    dequeueUser,
    removeFromQueue,
    isUserInQueue,
    getQueueSize
};
