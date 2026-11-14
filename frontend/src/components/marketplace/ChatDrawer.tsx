import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Send,
  ShieldCheck,
  LoaderCircle,
  MessageSquare,
  ArrowLeft,
  Search,
  Check,
  CheckCheck,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Message, ConversationSummary } from '@/lib/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  initialRecipientId?: string;
  initialRecipientName?: string;
  initialRecipientLocation?: string;
  initialEquipmentId?: string;
  initialEquipmentName?: string;
  initialRequestId?: string;
  initialView?: 'list' | 'chat';
  onUnreadCountChange?: (count: number) => void;
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatDateDivider(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function ChatDrawer({
  isOpen,
  onClose,
  currentUserId,
  initialRecipientId,
  initialRecipientName,
  initialRecipientLocation,
  initialEquipmentId,
  initialEquipmentName,
  initialRequestId,
  initialView = 'chat',
  onUnreadCountChange,
}: ChatDrawerProps) {
  // Navigation / View State
  const [view, setView] = useState<'list' | 'chat'>(initialView);

  // Active Chat State
  const [activeRecipientId, setActiveRecipientId] = useState(initialRecipientId || '');
  const [activeRecipientName, setActiveRecipientName] = useState(initialRecipientName || '');
  const [activeRecipientLocation, setActiveRecipientLocation] = useState(
    initialRecipientLocation || 'PEC Student'
  );
  const [activeEquipmentId, setActiveEquipmentId] = useState(initialEquipmentId || '');
  const [activeEquipmentName, setActiveEquipmentName] = useState(initialEquipmentName || '');
  const [activeRequestId, setActiveRequestId] = useState(initialRequestId || '');

  // Messages & Conversations state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsSearch, setConversationsSearch] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Update active state when props change
  useEffect(() => {
    if (initialRecipientId) {
      setActiveRecipientId(initialRecipientId);
      setActiveRecipientName(initialRecipientName || 'PEC Student');
      setActiveRecipientLocation(initialRecipientLocation || 'PEC Student');
      setActiveEquipmentId(initialEquipmentId || '');
      setActiveEquipmentName(initialEquipmentName || '');
      setActiveRequestId(initialRequestId || '');
      setView('chat');
    } else if (initialView) {
      setView(initialView);
    }
  }, [
    initialRecipientId,
    initialRecipientName,
    initialRecipientLocation,
    initialEquipmentId,
    initialEquipmentName,
    initialRequestId,
    initialView,
  ]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!isOpen) return;
    try {
      setConversationsLoading(true);
      const data = await api.getConversations();
      setConversations(data || []);

      const totalUnread = (data || []).reduce((acc, c) => acc + (c.unread_count || 0), 0);
      if (onUnreadCountChange) onUnreadCountChange(totalUnread);
    } catch (err) {
      console.warn('[ChatDrawer] Failed to load conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  }, [isOpen, onUnreadCountChange]);

  // Fetch conversations when drawer opens or when switched to list view
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Load active chat message history
  const loadHistory = useCallback(
    async (silent = false) => {
      if (!isOpen || !activeRecipientId) return;

      if (!silent) setMessagesLoading(true);
      try {
        const data = await api.getConversation({
          other_user_id: activeRecipientId,
          equipment_id: activeEquipmentId || undefined,
          request_id: activeRequestId || undefined,
        });

        setMessages(data || []);
        if (!silent) {
          setTimeout(scrollToBottom, 100);
        }

        // Also mark as read in local conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.other_user_id === activeRecipientId ? { ...c, unread_count: 0 } : c
          )
        );
      } catch (err) {
        console.warn('[ChatDrawer] Failed to load message history:', err);
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    [isOpen, activeRecipientId, activeEquipmentId, activeRequestId, scrollToBottom]
  );

  // Load history when entering chat view with activeRecipientId
  useEffect(() => {
    if (isOpen && view === 'chat' && activeRecipientId) {
      loadHistory();

      // Subscribe to Supabase Realtime for instant messaging
      const channel = supabase
        .channel(`chat_messages_${currentUserId}_${activeRecipientId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMsg = payload.new as Message;
            const isRelevant =
              (newMsg.sender_id === currentUserId && newMsg.recipient_id === activeRecipientId) ||
              (newMsg.sender_id === activeRecipientId && newMsg.recipient_id === currentUserId);

            if (isRelevant) {
              setMessages((prev) => {
                if (prev.some((m) => m.message_id === newMsg.message_id)) return prev;
                return [...prev, newMsg];
              });
              setTimeout(scrollToBottom, 50);

              // Mark read if incoming from the active conversation partner
              if (newMsg.sender_id === activeRecipientId) {
                api.markMessagesAsRead(activeRecipientId).catch(() => {});
              }
            }
          }
        )
        .subscribe();

      // Background polling fallback every 4 seconds to guarantee sync
      pollingRef.current = setInterval(() => {
        loadHistory(true);
      }, 4000);

      return () => {
        supabase.removeChannel(channel);
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [isOpen, view, activeRecipientId, currentUserId, loadHistory, scrollToBottom]);

  // Handle switching to a specific conversation from the list
  const handleSelectConversation = (conv: ConversationSummary) => {
    setActiveRecipientId(conv.other_user_id);
    setActiveRecipientName(conv.other_user_name);
    setActiveRecipientLocation(conv.other_user_location || 'PEC Student');
    setActiveEquipmentId(conv.equipment_id || '');
    setActiveEquipmentName(conv.equipment_name || '');
    setActiveRequestId(conv.request_id || '');
    setView('chat');
  };

  // Handle send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending || !activeRecipientId) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const sent = await api.sendMessage({
        recipient_id: activeRecipientId,
        equipment_id: activeEquipmentId || null,
        request_id: activeRequestId || null,
        content: text,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.message_id === sent.message_id)) return prev;
        return [...prev, sent];
      });
      setTimeout(scrollToBottom, 50);

      // Optimistically update conversation list preview
      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.other_user_id === activeRecipientId);
        const updatedItem: ConversationSummary = {
          other_user_id: activeRecipientId,
          other_user_name: activeRecipientName,
          other_user_location: activeRecipientLocation,
          last_message: text,
          last_message_time: new Date().toISOString(),
          last_sender_id: currentUserId,
          unread_count: 0,
          equipment_id: activeEquipmentId || undefined,
          equipment_name: activeEquipmentName || undefined,
          request_id: activeRequestId || undefined,
        };

        if (existingIdx >= 0) {
          const list = [...prev];
          list.splice(existingIdx, 1);
          return [updatedItem, ...list];
        }
        return [updatedItem, ...prev];
      });
    } catch (err: any) {
      console.error('[ChatDrawer] Send failed:', err);
      // Restore input text so the user doesn't lose what they typed
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const filteredConversations = conversations.filter((c) => {
    const q = conversationsSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.other_user_name.toLowerCase().includes(q) ||
      (c.equipment_name && c.equipment_name.toLowerCase().includes(q)) ||
      c.last_message.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full sm:max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ════════════════════════════════════════════════════════════
            VIEW: CONVERSATION LIST (INBOX)
           ════════════════════════════════════════════════════════════ */}
        {view === 'list' && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Messages
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Campus chat history
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={loadConversations}
                  disabled={conversationsLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                  title="Refresh conversations"
                >
                  <RefreshCw
                    size={15}
                    className={conversationsLoading ? 'animate-spin text-sky-500' : ''}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={conversationsSearch}
                  onChange={(e) => setConversationsSearch(e.target.value)}
                  placeholder="Search students, items, messages..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Conversation List Body */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {conversationsLoading && conversations.length === 0 ? (
                <div className="flex h-48 items-center justify-center">
                  <LoaderCircle size={24} className="animate-spin text-sky-500" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                  <MessageSquare size={36} className="stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {conversationsSearch ? 'No matches found' : 'No conversations yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    {conversationsSearch
                      ? 'Try a different search term.'
                      : 'Reach out to owners or buyers to discuss rentals and purchases. Your chat history will stay saved here!'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const initials = conv.other_user_name
                    ? conv.other_user_name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'P';
                  const isMine = conv.last_sender_id === currentUserId;

                  return (
                    <div
                      key={conv.other_user_id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition ${
                        conv.unread_count > 0
                          ? 'bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-50 dark:hover:bg-sky-950/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 font-extrabold text-sm text-sky-700 dark:bg-sky-950 dark:text-sky-300 shrink-0 shadow-sm">
                        {initials}
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-600 px-1 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {conv.other_user_name}
                            </span>
                            <ShieldCheck size={13} className="text-sky-500 shrink-0" />
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            {formatRelativeTime(conv.last_message_time)}
                          </span>
                        </div>

                        {conv.equipment_name && (
                          <div className="mt-0.5">
                            <span className="inline-block rounded-md bg-sky-100/70 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 truncate max-w-[200px]">
                              Item: {conv.equipment_name}
                            </span>
                          </div>
                        )}

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                          {isMine && <span className="font-semibold text-slate-400">You: </span>}
                          {conv.last_message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            VIEW: ACTIVE CHAT THREAD
           ════════════════════════════════════════════════════════════ */}
        {view === 'chat' && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    setView('list');
                    loadConversations();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition shrink-0"
                  title="Back to all conversations"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 font-extrabold text-sm text-sky-700 dark:bg-sky-950 dark:text-sky-300 shrink-0 shadow-sm">
                  {activeRecipientName ? activeRecipientName.charAt(0).toUpperCase() : 'P'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {activeRecipientName || 'PEC Student'}
                    </h3>
                    <ShieldCheck size={14} className="text-sky-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {activeRecipientLocation || 'PEC Student'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => loadHistory(false)}
                  disabled={messagesLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                  title="Refresh messages"
                >
                  <RefreshCw
                    size={14}
                    className={messagesLoading ? 'animate-spin text-sky-500' : ''}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Item context banner */}
            {activeEquipmentName && (
              <div className="flex items-center justify-between bg-sky-50/70 dark:bg-sky-950/30 px-4 py-2 border-b border-sky-100/60 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300">
                <span className="font-semibold truncate">Item: {activeEquipmentName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 shrink-0">
                  Marketplace
                </span>
              </div>
            )}

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <LoaderCircle size={24} className="animate-spin text-sky-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 mb-3">
                    <Sparkles size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Start the conversation!
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Discuss item condition, pickup spot (Hostel, Nescafe, Library), or rental duration.
                    Your messages are saved permanently.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.sender_id === currentUserId;
                  const timeStr = formatTime(msg.created_at);

                  // Show date separator if this is the first message or a new day
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const showDateDivider =
                    !prevMsg ||
                    new Date(prevMsg.created_at).toDateString() !==
                      new Date(msg.created_at).toDateString();

                  return (
                    <div key={msg.message_id} className="space-y-2">
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-3">
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 shadow-xs">
                            {formatDateDivider(msg.created_at)}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm transition shadow-xs ${
                            isMine
                              ? 'bg-sky-600 text-white rounded-br-none shadow-sky-600/10'
                              : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 px-1">
                          <span>{timeStr}</span>
                          {isMine && (
                            <span>
                              {msg.is_read ? (
                                <CheckCheck size={12} className="text-sky-500" />
                              ) : (
                                <Check size={12} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="border-t border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 active:scale-95 disabled:opacity-50 transition"
              >
                {sending ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
