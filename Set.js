const fs = require("fs");
const path = require("path");

const files = {
  "web/public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Random Chat</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>`,

  "web/public/style.css": `body { font-family: sans-serif; margin: 0; }`,

  "web/src/App.js": `import React from 'react';
import ChatWindow from './components/ChatWindow';

export default function App() {
  return <ChatWindow />;
}`,

  "web/src/components/ChatWindow.js": `import React from 'react';
import MessageInput from './MessageInput';
import UserInfo from './UserInfo';

export default function ChatWindow() {
  return (
    <div>
      <UserInfo />
      <div id="messages">Messages go here</div>
      <MessageInput />
    </div>
  );
}`,

  "web/src/components/MessageInput.js": `import React from 'react';

export default function MessageInput() {
  return (
    <div>
      <input type="text" placeholder="Type a message..." />
      <button>Send</button>
    </div>
  );
}`,

  "web/src/components/UserInfo.js": `import React from 'react';

export default function UserInfo() {
  return <div>Logged in as: [username]</div>;
}`,

  "web/src/hooks/useSocket.js": `import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function useSocket(event, callback) {
  useEffect(() => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, [event, callback]);

  return socket;
}`,

  "web/src/utils/localStorage.js": `export function saveToLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFromLocal(key) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}`,

  "web/src/index.css": `/* Tailwind styles or global overrides */`,

  "logic/chatManager.js": `// ChatManager handles sending/receiving messages
module.exports = {
  sendMessage: (msg) => {},
  getMessages: () => []
};`,

  "logic/userManager.js": `// UserManager tracks usernames, IPs, locations
module.exports = {
  addUser: (id, name, ip) => {},
  removeUser: (id) => {},
  getAllUsers: () => []
};`,

  "logic/queueManager.js": `// QueueManager pairs users for random chat
module.exports = {
  enqueue: (user) => {},
  dequeue: () => {}
};`,

  "route/index.js": `const express = require('express');
const router = express.Router();

// Define your routes here
router.get("/", (req, res) => res.send("API Running"));

module.exports = router;`,

  "database/database.js": `// Common DB connection manager`,
  "database/localHandler.js": `// Local file-based data handling`,
  "database/mongoHandler.js": `// MongoDB database operations`,

  "server.js": `const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const routes = require('./route');
app.use(express.static(__dirname + '/web/public'));
app.use('/api', routes);

// Socket.io setup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,

  "package.json": `{
  "name": "random-chat-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.0"
  }
}`,

  "README.md": `# Random Chat App

This is a real-time random chat platform with user detection, IP tracking, queue matching, and frontend/backend separation.`
};

// Create all directories and files
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), "utf8");
  console.log("✅ Created:", filePath);
});