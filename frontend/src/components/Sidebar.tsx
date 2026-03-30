"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FolderKanban, CreditCard,
  Settings, LogOut, BarChart3, CheckSquare, Sparkles,
  Briefcase, Phone, Megaphone, Brain, BookOpen,
  Handshake, Cpu, TrendingUp, ChevronDown, Rocket, Zap, PhoneCall, Code2, Users2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";

// Nav items shown to admin/manager (full access)
const ADMIN_NAV_GROUPS = [
  {
    label: "Overview",
    color: "from-sky-400 to-blue-500",
    glow: "shadow-blue-500/40",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    ],
  },
  {
    label: "Revenue",
    color: "from-emerald-400 to-green-500",
    glow: "shadow-emerald-500/40",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
    items: [
      { name: "Sales CRM", icon: Users, href: "/dashboard/crm" },
      { name: "Cold Callers", icon: Phone, href: "/dashboard/cold-callers" },
      { name: "Cold Outreach", icon: PhoneCall, href: "/dashboard/outreach" },
      { name: "Marketing", icon: Megaphone, href: "/dashboard/marketing" },
      { name: "Finance", icon: CreditCard, href: "/dashboard/finance" },
    ],
  },
  {
    label: "Delivery",
    color: "from-violet-400 to-purple-500",
    glow: "shadow-purple-500/40",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    dot: "bg-purple-400",
    items: [
      { name: "Projects", icon: FolderKanban, href: "/dashboard/projects" },
      { name: "Task Board", icon: CheckSquare, href: "/dashboard/tasks" },
      { name: "Developer", icon: Code2, href: "/dashboard/developer" },
      { name: "Freelancer Hub", icon: Briefcase, href: "/dashboard/freelancer" },
      { name: "Resources", icon: Cpu, href: "/dashboard/resources" },
    ],
  },
  {
    label: "Clients",
    color: "from-orange-400 to-amber-500",
    glow: "shadow-amber-500/40",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
    items: [
      { name: "Client Success", icon: Phone, href: "/dashboard/clients" },
      { name: "Client Expansion", icon: TrendingUp, href: "/dashboard/expansion" },
    ],
  },
  {
    label: "Operations",
    color: "from-rose-400 to-pink-500",
    glow: "shadow-rose-500/40",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
    items: [
      { name: "Operations", icon: Briefcase, href: "/dashboard/operations" },
      { name: "Partners", icon: Handshake, href: "/dashboard/partners" },
      { name: "Team", icon: Users2, href: "/dashboard/team" },
    ],
  },
  {
    label: "Intelligence",
    color: "from-indigo-400 to-cyan-500",
    glow: "shadow-cyan-500/40",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    dot: "bg-cyan-400",
    items: [
      { name: "AI Automation", icon: Sparkles, href: "/dashboard/ai" },
      { name: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
      { name: "Data Intel", icon: Brain, href: "/dashboard/intelligence" },
    ],
  },
];

// Role-specific nav — each role only sees their workspace
const ROLE_NAV: Record<string, { label: string; color: string; glow: string; bg: string; border: string; dot: string; items: { name: string; icon: any; href: string }[] }[]> = {
  DEVELOPER: [
    {
      label: "My Workspace",
      color: "from-blue-400 to-cyan-500",
      glow: "shadow-blue-500/40",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      dot: "bg-blue-400",
      items: [
        { name: "Developer Dashboard", icon: Code2, href: "/dashboard/developer" },
        { name: "Task Board", icon: CheckSquare, href: "/dashboard/tasks" },
        { name: "Projects", icon: FolderKanban, href: "/dashboard/projects" },
      ],
    },
    {
      label: "Resources",
      color: "from-violet-400 to-purple-500",
      glow: "shadow-purple-500/40",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      dot: "bg-purple-400",
      items: [
        { name: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
        { name: "Resources", icon: Cpu, href: "/dashboard/resources" },
      ],
    },
  ],
  COLD_CALLER: [
    {
      label: "My Workspace",
      color: "from-violet-400 to-purple-500",
      glow: "shadow-purple-500/40",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      dot: "bg-purple-400",
      items: [
        { name: "Cold Callers", icon: Phone, href: "/dashboard/cold-callers" },
      ],
    },
    {
      label: "Resources",
      color: "from-indigo-400 to-cyan-500",
      glow: "shadow-cyan-500/40",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      dot: "bg-cyan-400",
      items: [
        { name: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
      ],
    },
  ],
  OUTREACHER: [
    {
      label: "My Workspace",
      color: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/40",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      dot: "bg-emerald-400",
      items: [
        { name: "Cold Outreach", icon: PhoneCall, href: "/dashboard/outreach" },
      ],
    },
    {
      label: "Resources",
      color: "from-indigo-400 to-cyan-500",
      glow: "shadow-cyan-500/40",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      dot: "bg-cyan-400",
      items: [
        { name: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
      ],
    },
  ],
  FREELANCER: [
    {
      label: "My Workspace",
      color: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/40",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      dot: "bg-amber-400",
      items: [
        { name: "Freelancer Hub", icon: Briefcase, href: "/dashboard/freelancer" },
        { name: "Projects", icon: FolderKanban, href: "/dashboard/projects" },
        { name: "Task Board", icon: CheckSquare, href: "/dashboard/tasks" },
      ],
    },
    {
      label: "Resources",
      color: "from-indigo-400 to-cyan-500",
      glow: "shadow-cyan-500/40",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      dot: "bg-cyan-400",
      items: [
        { name: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
      ],
    },
  ],
};

const ADMIN_ROLES = ["ADMIN", "MANAGER", "SUPER_ADMIN", "SALES"]; // same set as FULL_ACCESS_ROLES in RoleGuard

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin",  color: "text-violet-400" },
  ADMIN:       { label: "Admin",        color: "text-rose-400" },
  MANAGER:     { label: "Manager",      color: "text-blue-400" },
  SALES:       { label: "Sales",        color: "text-emerald-400" },
  DEVELOPER:   { label: "Developer",    color: "text-cyan-400" },
  COLD_CALLER: { label: "Cold Caller",  color: "text-purple-400" },
  OUTREACHER:  { label: "Outreacher",   color: "text-teal-400" },
  FREELANCER:  { label: "Freelancer",   color: "text-amber-400" },
  CLIENT:      { label: "Client",       color: "text-zinc-400" },
};

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");
  const navGroups = isAdmin ? ADMIN_NAV_GROUPS : (ROLE_NAV[user?.role ?? ""] ?? ADMIN_NAV_GROUPS);

  const toggleGroup = (label: string) =>
    setCollapsed((p) => p.includes(label) ? p.filter((x) => x !== label) : [...p, label]);

  const badge = ROLE_BADGE[user?.role ?? ""] ?? { label: user?.role ?? "", color: "text-zinc-400" };

  return (
    <div className="w-64 border-r border-white/5 bg-[#080808] flex flex-col h-screen flex-shrink-0 relative overflow-hidden">
      {/* Animated background glows */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] left-[-30%] w-72 h-72 bg-blue-600/8 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[20%] right-[-20%] w-56 h-56 bg-violet-600/8 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Logo Section */}
      <div className="p-6 mb-1">
        <Link href={isAdmin ? "/dashboard" : (Object.values(ROLE_NAV[user?.role ?? ""] ?? [])[0]?.items[0]?.href ?? "/dashboard")} className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Rocket size={17} strokeWidth={2.5} className="text-white relative z-10" />
          </motion.div>
          <div>
            <h1 className="text-white font-black text-sm tracking-tighter uppercase bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Niche CRM
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              <p className="text-[9px] text-zinc-600 font-bold tracking-widest uppercase">
                {isAdmin ? "Mission Control" : `${badge.label} View`}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-8 custom-scrollbar">
        {navGroups.map((group, gi) => {
          const isCollapsed = collapsed.includes(group.label);
          return (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="space-y-0.5"
            >
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1 mb-1 group"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-1 h-3 rounded-full bg-gradient-to-b", group.color, "opacity-60 group-hover:opacity-100 transition-opacity")} />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    {group.label}
                  </span>
                </div>
                <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={9} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden space-y-0.5"
                  >
                    {group.items.map((item, ii) => {
                      const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ii * 0.04 }}
                        >
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative overflow-hidden",
                              active
                                ? cn("text-white border", group.bg, group.border)
                                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.025]"
                            )}
                          >
                            {active && (
                              <motion.div
                                layoutId="active-pill"
                                className={cn("absolute left-0 w-0.5 h-5 rounded-r-full bg-gradient-to-b", group.color)}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            {active && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn("absolute inset-0 bg-gradient-to-r opacity-5", group.color)}
                              />
                            )}
                            <div className={cn(
                              "relative z-10 p-1.5 rounded-lg transition-all duration-200",
                              active
                                ? cn("bg-gradient-to-br", group.color, "shadow-lg", group.glow, "text-white")
                                : "bg-zinc-800/60 text-zinc-500 group-hover:text-zinc-300"
                            )}>
                              <item.icon size={13} strokeWidth={active ? 2.5 : 2} />
                            </div>
                            <span className="relative z-10 flex-1">{item.name}</span>
                            {active && (
                              <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", group.dot, "shadow-lg", group.glow)}
                              />
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-black/30 backdrop-blur-md">
        <div className="space-y-0.5">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-zinc-800/60 group-hover:bg-zinc-700/60 transition-colors">
              <Settings size={13} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </div>
            <span>Settings</span>
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/15 transition-colors">
              <LogOut size={13} className="text-rose-500/70 group-hover:text-rose-400 transition-colors" />
            </div>
            <span>Logout</span>
          </button>
        </div>

        <div className="mt-3 p-3 bg-gradient-to-r from-zinc-900/60 to-zinc-800/40 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
            {user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{user?.name ?? "Unknown"}</p>
            <p className={cn("text-[9px] font-bold uppercase tracking-tighter", badge.color)}>{badge.label}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        </div>
      </div>
    </div>
  );
}
