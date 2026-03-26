"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Command, CheckCheck, Loader2 } from "lucide-react";
import { notificationsApi } from "@/lib/endpoints";
import { cn } from "@/lib/utils";

const NOTIF_COLORS: Record<string, string> = {
  TASK_STATUS_CHANGED: "bg-blue-500",
  TASK_ASSIGNED: "bg-violet-500",
  TASK_REASSIGNED: "bg-amber-500",
  TASK_OVERDUE: "bg-rose-500",
  TASK_CREATED: "bg-emerald-500",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !token) router.replace("/login");
  }, [mounted, token, router]);

  const fetchNotifs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data || []);
    } catch {}
  }, [token]);

  // Poll notifications every 15 seconds
  useEffect(() => {
    if (!mounted || !token) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [mounted, token, fetchNotifs]);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
    setMarkingAll(false);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!mounted || !token) return null;

  const initials = user?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "U";
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden font-sans">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-13 border-b border-white/5 flex items-center justify-between px-5 flex-shrink-0 relative overflow-hidden bg-[#080808]/90 backdrop-blur-xl">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          {/* Search pill */}
          <motion.div
            animate={{ width: searchFocused ? 320 : 256 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-xs text-zinc-500 cursor-pointer transition-all duration-200 ${
              searchFocused
                ? "bg-zinc-800/80 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                : "bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700/60"
            }`}>
              <Search size={12} className={searchFocused ? "text-indigo-400" : "text-zinc-600"} />
              <input
                type="text"
                placeholder="Search everything..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent outline-none text-zinc-300 placeholder-zinc-600 text-xs"
              />
              <div className="flex items-center gap-0.5 opacity-40">
                <Command size={9} /><span className="text-[9px]">K</span>
              </div>
            </div>
          </motion.div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Live</span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(p => !p); if (!notifOpen) fetchNotifs(); }}
                className="relative p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 transition-all border border-transparent hover:border-zinc-700/40"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-gradient-to-br from-rose-500 to-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
                {unreadCount === 0 && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.8)]"
                  />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-full text-[9px]">
                            {unreadCount} new
                          </span>
                        )}
                      </p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          disabled={markingAll}
                          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {markingAll ? <Loader2 size={10} className="animate-spin" /> : <CheckCheck size={10} />}
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-zinc-600">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors cursor-pointer",
                              !n.isRead && "bg-zinc-800/20"
                            )}
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-1.5 flex-shrink-0 shadow-lg",
                              NOTIF_COLORS[n.type] || "bg-zinc-500",
                              n.isRead && "opacity-40"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-semibold", n.isRead ? "text-zinc-400" : "text-white")}>
                                {n.title}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{n.description}</p>
                            </div>
                            <span className="text-[9px] text-zinc-700 font-bold uppercase flex-shrink-0">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 border-t border-zinc-800/60">
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="w-full text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-5 bg-zinc-800" />

            {/* User avatar */}
            <div className="flex items-center gap-2.5">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-indigo-500/30 cursor-pointer"
              >
                {initials}
              </motion.div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white leading-none">{user?.name ?? "User"}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{user?.email ?? ""}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
