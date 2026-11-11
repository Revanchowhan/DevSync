import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

/**
 * useChatTransport: Pluggable chat polling transport with smart visibility pausing.
 */
export function useChatTransport(activeConversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const lastTimestampRef = useRef(null);

  // Fetch all messages initially or incremental new messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!activeConversationId) return;
    if (document.visibilityState === 'hidden') return;

    try {
      if (isInitial) setLoading(true);

      const params = new URLSearchParams();
      if (!isInitial && lastTimestampRef.current) {
        params.append('after', lastTimestampRef.current);
      }

      const { data } = await api.get(
        `/conversations/${activeConversationId}/messages?${params.toString()}`
      );

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          if (isInitial) return data.messages;
          const existingIds = new Set(prev.map((m) => m._id));
          const fresh = data.messages.filter((m) => !existingIds.has(m._id));
          return [...prev, ...fresh];
        });

        const latest = data.messages[data.messages.length - 1];
        lastTimestampRef.current = latest.createdAt;
      }
    } catch (err) {
      // Silently handle polling errors
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [activeConversationId]);

  // Initial load on active conversation switch
  useEffect(() => {
    if (activeConversationId) {
      setMessages([]);
      lastTimestampRef.current = null;
      fetchMessages(true);
      // Mark as read
      api.post(`/conversations/${activeConversationId}/read`).catch(() => {});
    }
  }, [activeConversationId, fetchMessages]);

  // Polling loop for active conversation (3.5s interval)
  useEffect(() => {
    if (!activeConversationId) return;

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConversationId, fetchMessages]);

  // Global unread count poller (30s interval)
  const fetchUnreadTotal = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const { data } = await api.get('/conversations/unread-total');
      setUnreadTotal(data.unreadTotal || 0);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadTotal();
    const interval = setInterval(fetchUnreadTotal, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadTotal]);

  const sendMessage = async (text) => {
    if (!activeConversationId || !text.trim()) return null;
    const { data } = await api.post(`/conversations/${activeConversationId}/messages`, {
      text: text.trim(),
    });

    if (data.message) {
      setMessages((prev) => [...prev, data.message]);
      lastTimestampRef.current = data.message.createdAt;
    }
    return data.message;
  };

  return {
    messages,
    loading,
    unreadTotal,
    sendMessage,
    refreshMessages: () => fetchMessages(false),
  };
}
