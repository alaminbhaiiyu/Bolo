const socket = io(); // Socket.IO server er shathe connect kora holo

// DOM Elements gulo ke select kora
const usernameInputSection = document.getElementById('username-input-section');
const usernameInput = document.getElementById('username-input');
const startChatButton = document.getElementById('start-chat-button');
const chatSection = document.getElementById('chat-section');
const partnerInfo = document.getElementById('partner-info');
const partnerTypingIndicator = document.getElementById('partner-typing');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const activeUsersCountSpan = document.getElementById('active-users-count');
const statusMessageDiv = document.getElementById('status-message');
const messageInputContainer = document.getElementById('message-input-container');
const attachmentIcon = document.getElementById('attachment-icon');
const attachmentInput = document.getElementById('attachment-input');

let currentPartnerId = null;
let currentUsername = localStorage.getItem('randomRealChatUsername'); // localStorage theke username load kora holo
let browserLocation = {
    lat: null,
    lon: null,
    fetched: false, // Track if we attempted to fetch browser location
    denied: false // Track if permission was denied
};

// --- Utility Functions ---

// Function to toggle status message without blur effect
const toggleStatusMessage = (show, message = '') => {
    statusMessageDiv.textContent = message;
    if (show) {
        statusMessageDiv.classList.remove('hidden');
    } else {
        statusMessageDiv.classList.add('hidden');
    }
};

// User er browser location fetch korar jonno
const fetchBrowserLocation = () => {
    return new Promise((resolve) => {
        browserLocation.fetched = true; // Mark that we attempted fetching

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    browserLocation.lat = position.coords.latitude;
                    browserLocation.lon = position.coords.longitude;
                    console.log('Browser location fetched:', browserLocation.lat, browserLocation.lon);
                    resolve(true); // Successfully fetched
                },
                (error) => {
                    console.warn('Browser geolocation error:', error.message);
                    if (error.code === error.PERMISSION_DENIED) {
                        browserLocation.denied = true;
                        alert("Location access denied. We'll use IP-based location for now. You can enable it in your browser settings.");
                    }
                    resolve(false); // Failed to fetch
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
            resolve(false); // Not supported
        }
    });
};

// Username localStorage e save korar jonno
const saveUsername = (username) => {
    localStorage.setItem('randomRealChatUsername', username);
    currentUsername = username;
};

// Chat UI te message add korar jonno (text or attachment)
const addMessageToUI = (senderName, message, timestamp, isOwnMessage, isSeen = false, messageId = null, attachment = null) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('mb-2', 'p-2', 'rounded-lg', 'max-w-[75%]');
    messageDiv.setAttribute('data-message-id', messageId); // Seen status track korar jonno

    if (isOwnMessage) {
        messageDiv.classList.add('bg-blue-500', 'text-white', 'ml-auto');
    } else {
        messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'mr-auto');
    }

    let contentHtml = `
        <p class="font-semibold text-sm">${senderName}</p>
    `;
    if (message) {
        contentHtml += `<p class="break-words">${message}</p>`;
    }
    if (attachment) {
        if (attachment.type.startsWith('image/')) {
            contentHtml += `<img src="${attachment.data}" alt="Attachment" class="attachment-img" />`;
        } else {
            contentHtml += `<p><a href="${attachment.data}" download>Download Attachment (${attachment.name})</a></p>`;
        }
    }
    contentHtml += `
        <div class="text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} mt-1 flex justify-between items-center">
            <span>${new Date(timestamp).toLocaleTimeString()}</span>
            ${isOwnMessage && messageId ? `<span class="seen-status text-xs">${isSeen ? '✔️ Seen' : ''}</span>` : ''}
        </div>
    `;

    messageDiv.innerHTML = contentHtml;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
};

// Message er seen status update korar jonno
const updateSeenStatusInUI = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"] .seen-status`);
    if (messageElement) {
        messageElement.textContent = '✔️ Seen';
        console.log(`Seen status updated for message ID: ${messageId}`);
    } else {
        console.warn(`Message element with ID ${messageId} not found to update seen status.`);
    }
};

let typingTimeout; // Typing indicator er timeout
const startTypingIndicator = () => {
    partnerTypingIndicator.classList.remove('hidden');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        partnerTypingIndicator.classList.add('hidden');
    }, 3000); // 3 second por hide hobe
};

// --- Event Listeners ---

// "Start Chat" button click korle
startChatButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (username) {
        saveUsername(username); // Username save kora holo
        usernameInputSection.classList.add('hidden');
        chatSection.classList.remove('hidden');

        // Attempt to fetch browser location before registering user
        await fetchBrowserLocation();

        // Register user with server, sending browser location if available
        socket.emit('registerUser', {
            username: currentUsername,
            browserLat: browserLocation.lat,
            browserLon: browserLocation.lon
        });
    } else {
        alert('Please enter your name to start chatting.');
    }
});

// Send button click korle
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && currentPartnerId) {
        // Unique message ID create kora
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        addMessageToUI(currentUsername, message, new Date().toISOString(), true, false, messageId);
        socket.emit('sendMessage', { message, toUserId: currentPartnerId, messageId }); // Server e message pathano
        messageInput.value = ''; // Input field empty kora
    }
});

// Enter key press korle message send korar jonno
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendButton.click();
    }
});

// Message input e type korle typing event emit korar jonno
messageInput.addEventListener('input', () => {
    if (currentPartnerId) {
        socket.emit('typing', { toUserId: currentPartnerId });
    }
});

// Attachment icon click korle file input trigger korar jonno
attachmentIcon.addEventListener('click', () => {
    attachmentInput.click();
});

// Attachment file select korle
attachmentInput.addEventListener('change', () => {
    if (currentPartnerId && attachmentInput.files.length > 0) {
        const file = attachmentInput.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const attachment = {
                name: file.name,
                type: file.type,
                data: reader.result // Base64 data
            };
            addMessageToUI(currentUsername, null, new Date().toISOString(), true, false, messageId, attachment);
            socket.emit('sendMessage', { 
                message: null, 
                toUserId: currentPartnerId, 
                messageId, 
                attachment 
            });
            attachmentInput.value = ''; // Clear file input
        };
        reader.readAsDataURL(file); // Read file as Base64
    }
});

// Skip button click korle
skipButton.addEventListener('click', () => {
    // Immediately skip and start searching for a new partner
    socket.emit('skip');
    toggleStatusMessage(true, 'Finding new partner...');
    partnerInfo.textContent = ''; // Clear partner name immediately
    messagesContainer.innerHTML = ''; // Clear chat
    currentPartnerId = null; // Reset partner ID
    partnerTypingIndicator.classList.add('hidden'); // Hide typing indicator
});

// --- Socket.IO Event Handlers ---

// Socket connect hole
socket.on('connect', async () => {
    console.log('Connected to Socket.IO server.');
    // Jodi username already localStorage e thake, tobe chat section show kore user ke register korbe
    if (currentUsername) {
        usernameInputSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
        // Attempt to fetch browser location before registering user
        await fetchBrowserLocation();
        socket.emit('registerUser', {
            username: currentUsername,
            browserLat: browserLocation.lat,
            browserLon: browserLocation.lon
        });
    } else {
        // Jodi username na thake, username input section dekhabe
        usernameInputSection.classList.remove('hidden');
        chatSection.classList.add('hidden');
    }
});

// Active user count update hole
socket.on('activeUsersCount', (count) => {
    activeUsersCountSpan.textContent = count;
});

// Partner paoa gele
socket.on('partnerFound', (data) => {
    currentPartnerId = data.partnerId;
    // Partner er name ar location display kora
    partnerInfo.textContent = `${data.partnerName} from ${data.partnerLocation}`;
    toggleStatusMessage(false); // Hide status message
    messagesContainer.innerHTML = ''; // Clear previous messages
    partnerTypingIndicator.classList.add('hidden'); // Hide typing indicator
    console.log('Partner found:', data.partnerName, 'from', data.partnerLocation);
});

// Partner na paoa gele waiting message dekhabe
socket.on('waitingForPartner', (data) => {
    partnerInfo.textContent = 'No partner yet.';
    toggleStatusMessage(true, data.message);
    messagesContainer.innerHTML = ''; // Clear chat
    currentPartnerId = null;
    partnerTypingIndicator.classList.add('hidden');
});

// Message receive korle
socket.on('receiveMessage', (data) => {
    addMessageToUI(data.senderName, data.message, data.timestamp, false, data.seen, data.id, data.attachment);
    // Message dekhar por server ke seen event emit kora
    if (currentPartnerId === data.senderId) {
        socket.emit('seen', { messageId: data.id, fromUserId: data.senderId });
    }
});

// Nije pathano message seen hole
socket.on('messageSeen', (data) => {
    updateSeenStatusInUI(data.messageId);
});

// Partner typing korle indicator dekhabe
socket.on('partnerTyping', (data) => {
    if (data.isTyping) {
        startTypingIndicator();
    }
});

// Partner chat chere gele (left/skipped)
socket.on('partnerLeft', (data) => {
    toggleStatusMessage(true, data.message);
    partnerInfo.textContent = 'No partner yet.';
    currentPartnerId = null;
    messagesContainer.innerHTML = ''; // Clear chat
    partnerTypingIndicator.classList.add('hidden');
    console.log('Partner left.');
});

// Socket disconnect hole
socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server.');
    toggleStatusMessage(true, 'Disconnected from server. Reconnecting...');
    partnerInfo.textContent = 'No partner yet.';
    currentPartnerId = null;
    messagesContainer.innerHTML = '';
    partnerTypingIndicator.classList.add('hidden');
});

// Initial load logic: check for username
if (currentUsername) {
    usernameInput.value = currentUsername; // Input field e username populate kora
    // Chat section hide kora, `startChatButton` click er por chat shuru hobe
} else {
    usernameInputSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
}