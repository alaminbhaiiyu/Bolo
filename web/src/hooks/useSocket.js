import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function useSocket(event, callback) {
  useEffect(() => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, [event, callback]);

  return socket;
}