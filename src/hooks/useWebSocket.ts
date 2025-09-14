import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  createdAt: string;
}

export function useWebSocket(groupId: string, userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!groupId || !userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join the group room
      ws.send(JSON.stringify({
        type: 'join',
        groupId,
        userId
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message' && data.groupId === groupId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [groupId, userId]);

  const sendMessage = (content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        groupId,
        content,
        userId
      }));
    }
  };

  return {
    messages,
    sendMessage,
    isConnected
  };
}