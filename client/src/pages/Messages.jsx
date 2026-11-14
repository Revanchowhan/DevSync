import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  MessageSquare, Users, Send, ShieldAlert, Ban, ArrowLeft, 
  Search, CheckCheck, Clock, Hash, Sparkles
} from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useChatTransport } from '../hooks/useChatTransport';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import ReportModal from '../components/ReportModal';
import BlockModal from '../components/BlockModal';
import { timeAgo } from '../utils/format';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const text = (value, fallback = '') =>
  typeof value === 'string' ? value : fallback;

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatTypeFilter, setChatTypeFilter] = useState('all'); // 'all' | 'direct' | 'team'
  const [searchQuery, setSearchQuery] = useState('');

  // Safety modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Hook for polling messages in active conversation
  const { messages, loading: messagesLoading, sendMessage, refreshMessages } =
    useChatTransport(activeConv?._id);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(Array.isArray(data?.conversations) ? data.conversations : []);
    } catch (err) {
      toast.error(apiError(err, 'Failed to load conversations.'));
    } finally {
      setLoadingConv(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    const text = inputText;
    setInputText('');
    setSending(true);
    try {
      await sendMessage(text);
      fetchConversations();
    } catch (err) {
      toast.error(apiError(err, 'Failed to send message.'));
      setInputText(text); // restore
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv || conv.type !== 'direct') return null;
    return (Array.isArray(conv.participants) ? conv.participants : []).find(
      (p) => String(p._id || p.id) !== String(user?._id || user?.id)
    );
  };

  const getConvTitle = (conv) => {
    if (conv?.type === 'team') {
      return text(conv.team?.name, 'Hackathon Squad');
    }
    const other = getOtherParticipant(conv);
    return text(other?.name, 'DevSync Member');
  };

  const lastMessageText = (conv) => text(conv?.lastMessageText);
  const senderName = (message) => text(message?.sender?.name, 'DevSync Member');

  const filteredConversations = conversations.filter((c) => {
    if (chatTypeFilter !== 'all' && c.type !== chatTypeFilter) return false;
    if (searchQuery.trim()) {
      const title = getConvTitle(c).toLowerCase();
      const lastMsg = lastMessageText(c).toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || lastMsg.includes(query);
    }
    return true;
  });

  const otherUser = getOtherParticipant(activeConv);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 h-[calc(100vh-100px)] flex flex-col">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-card flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`${
            activeConv ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60`}
        >
          {/* Header & Tabs */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Messages
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {conversations.length}
              </span>
            </div>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {[
                { id: 'all', label: 'All' },
                { id: 'direct', label: 'Direct' },
                { id: 'team', label: 'Teams' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setChatTypeFilter(t.id)}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    chatTypeFilter === t.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {loadingConv ? (
              <div className="p-3">
                <ListSkeleton count={4} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-medium text-slate-700 dark:text-slate-300">No conversations</p>
                <p className="text-[11px] mt-1 text-slate-400">Connect with students in Discover or join a team to start chatting.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const active = activeConv?._id === conv._id;
                const isTeam = conv.type === 'team';
                const other = getOtherParticipant(conv);

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs'
                        : 'hover:bg-white dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    {isTeam ? (
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                        <Users className="w-5 h-5" />
                      </div>
                    ) : other?.avatarUrl ? (
                      <img
                        src={other.avatarUrl}
                        alt={text(other.name, 'Conversation participant')}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-xs">
                        {text(other?.name, '?').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`font-semibold text-xs truncate ${active ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}>
                          {getConvTitle(conv)}
                        </p>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {timeAgo(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {lastMessageText(conv) || 'Started conversation'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Conversation */}
        <div
          className={`${
            activeConv ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-white dark:bg-slate-900`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1.5 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {getConvTitle(activeConv)}
                      {activeConv.type === 'team' ? (
                        <Badge variant="cyan" className="text-[10px] py-0">
                          Squad
                        </Badge>
                      ) : (
                        <Badge variant="purple" className="text-[10px] py-0">
                          Direct
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeConv.type === 'team'
                        ? `${Array.isArray(activeConv.participants) ? activeConv.participants.length : 0} teammates in this squad`
                        : text(otherUser?.college) || text(otherUser?.headline) || 'DevSync Student'}
                    </p>
                  </div>
                </div>

                {/* Safety & Moderation Actions */}
                {activeConv.type === 'direct' && otherUser && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="text-xs font-medium text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1 cursor-pointer"
                      title="Report User"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Report
                    </button>
                    <button
                      onClick={() => setBlockModalOpen(true)}
                      className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 cursor-pointer"
                      title="Block User"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Block
                    </button>
                  </div>
                )}
              </div>

              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                {messagesLoading ? (
                  <div className="p-4">
                    <ListSkeleton count={4} />
                  </div>
                ) : !Array.isArray(messages) || messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-16 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No messages yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Send a message to start coordinating hackathon tasks and team ideas!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = String(msg.sender?._id || msg.sender) === String(user?._id || user?.id);

                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-[11px] font-semibold shrink-0 mt-1">
                            {senderName(msg).charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className={`max-w-[80%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!isMe && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1 px-1">
                              {senderName(msg)}
                            </span>
                          )}

                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                              isMe
                                ? 'bg-indigo-600 text-white shadow-sm rounded-br-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-xs rounded-bl-xs'
                            }`}
                          >
                            {text(msg?.text)}
                          </div>

                          <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1 font-mono">
                            {timeAgo(msg.createdAt)}
                            {isMe && <CheckCheck className="w-3 h-3 text-indigo-500 inline" />}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
              >
                <input
                  type="text"
                  maxLength={2000}
                  placeholder={`Write a message to ${getConvTitle(activeConv)}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <Button type="submit" size="sm" disabled={!inputText.trim() || sending} className="gap-1.5 px-4">
                  {sending ? 'Sending...' : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={MessageSquare}
                title="Select a Conversation"
                message="Choose a teammate or squad chat from the sidebar to start collaborating in real time."
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {otherUser && (
        <ReportModal
          targetUser={otherUser}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {/* Block Modal */}
      {otherUser && (
        <BlockModal
          targetUser={otherUser}
          isOpen={blockModalOpen}
          onClose={() => setBlockModalOpen(false)}
          onBlocked={() => {
            setActiveConv(null);
            fetchConversations();
          }}
        />
      )}
    </div>
  );
}
