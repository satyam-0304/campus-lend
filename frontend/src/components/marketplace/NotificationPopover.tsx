import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, Star, Package, Info } from 'lucide-react';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

interface NotificationPopoverProps {
  onNavigateToDashboard?: () => void;
}

export function NotificationPopover({ onNavigateToDashboard }: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // not authenticated or network error
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // 15-second background refresh
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleItemClick = async (notif: Notification) => {
    if (!notif.is_read) {
      api.markNotificationRead(notif.notification_id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notif.notification_id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (onNavigateToDashboard) onNavigateToDashboard();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare size={14} className="text-sky-500" />;
      case 'review':
        return <Star size={14} className="text-amber-500 fill-amber-500" />;
      case 'request':
        return <Package size={14} className="text-emerald-500" />;
      default:
        return <Info size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 px-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="rounded-full bg-sky-100 dark:bg-sky-950 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto space-y-1 pr-1">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  onClick={() => handleItemClick(notif)}
                  className={`flex items-start gap-3 rounded-2xl p-2.5 transition cursor-pointer ${
                    notif.is_read
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      : 'bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-950/50'
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-700">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      {new Date(notif.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!notif.is_read && (
                    <span className="h-2 w-2 rounded-full bg-sky-500 mt-2 shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
