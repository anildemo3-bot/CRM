"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Command, Zap } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !token) router.replace("/login");
  }, [mounted, token, router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!mounted || !token) return null;

  const initials = user?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden font-sans">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-13 border-b border-white/5 flex items-center justify-between px-5 flex-shrink-0 relative overflow-hidden bg-[#080808]/90 backdrop-blur-xl">
          {/* Subtle gradient line at bottom */}
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
                onClick={() => setNotifOpen(p => !p)}
                className="relative p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 transition-all border border-transparent hover:border-zinc-700/40"
              >
                <Bell size={15} />
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.8)]"
                />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-zinc-800/60">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Notifications</p>
                    </div>
                    {[
                      { title: "New deal won", desc: "Acme Corp · $12,400", color: "bg-emerald-500", time: "2m ago" },
                      { title: "Task overdue", desc: "Sprint #4 review due", color: "bg-rose-500", time: "1h ago" },
                      { title: "Invoice paid", desc: "Globex Inc · $8,200", color: "bg-blue-500", time: "3h ago" },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors cursor-pointer">
                        <div className={`w-2 h-2 rounded-full ${n.color} mt-1.5 flex-shrink-0 shadow-lg`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{n.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{n.desc}</p>
                        </div>
                        <span className="text-[9px] text-zinc-700 font-bold uppercase">{n.time}</span>
                      </div>
                    ))}
                    <div className="p-3 border-t border-zinc-800/60">
                      <button onClick={() => setNotifOpen(false)} className="w-full text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors">
                        Mark all read
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
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
