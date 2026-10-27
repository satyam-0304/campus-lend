import { useEffect, useRef, useState } from 'react';
import { X, Send, ShieldCheck, LoaderCircle, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  recipientId: string;
  recipientName: string;
  recipientLocation?: string;
  equipmentId?: string;
  equipmentName?: string;
  requestId?: string;
}

export function ChatDrawer({
  isOpen,
  onClose,
  currentUserId,
  recipientId,
  recipientName,
  recipientLocation,
  equipmentId,
  equipmentName,
  requestId,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history
  useEffect(() => {
    if (!isOpen || !recipientId) return;

    let isMounted = true;
    setLoading(true);

    const loadHistory = async () => {
      try {
        const data = await api.getConversation({
          other_user_id: recipientId,
          equipment_id: equipmentId,
          request_id: requestId,
        });
        if (isMounted) {
          setMessages(data || []);
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }
      } catch {
        if (isMounted) {
          setMessages([]);
          setLoading(false);
        }
      }
    };

    loadHistory();

    // Supabase Realtime subscription for live instant message delivery
    const channel = supabase
      .channel(`chat_${currentUserId}_${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only append if it belongs to this conversation
          const isRelevant =
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === currentUserId);

          if (isRelevant) {
            setMessages((prev) => {
              if (prev.some((m) => m.message_id === newMsg.message_id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isOpen, recipientId, equipmentId, requestId, currentUserId]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const sent = await api.sendMessage({
        recipient_id: recipientId,
        equipment_id: equipmentId,
        request_id: requestId,
        content: text,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.message_id === sent.message_id)) return prev;
        return [...prev, sent];
      });
      setTimeout(scrollToBottom, 50);
    } catch {
      // Restore input text if send failed
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full sm:max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 font-extrabold text-sm text-sky-700 dark:bg-sky-950 dark:text-sky-300 shrink-0">
              {recipientName ? recipientName.charAt(0) : 'P'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {recipientName}
                </h3>
                <ShieldCheck size={14} className="text-sky-500 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {recipientLocation || 'PEC Student'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Item context banner */}
        {equipmentName && (
          <div className="flex items-center justify-between bg-sky-50/70 dark:bg-sky-950/30 px-4 py-2 border-b border-sky-100/60 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300">
            <span className="font-semibold truncate">Item: {equipmentName}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 shrink-0">
              Inquiry
            </span>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <LoaderCircle size={24} className="animate-spin text-sky-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
              <MessageSquare size={36} className="stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold">Start the conversation!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Discuss item condition, pickup location (Hostel, Nescafe, Library), or rental timing.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.message_id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMine
                        ? 'bg-sky-600 text-white rounded-br-none shadow-sm'
                        : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 px-1">
                    {timeStr}
                  </span>
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
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-sky-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 active:scale-95 disabled:opacity-50 transition"
          >
            {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
