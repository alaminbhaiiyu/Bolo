import React from 'react';
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
}