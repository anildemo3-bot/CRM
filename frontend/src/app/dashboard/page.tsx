"use client";
// sync check 2026-04-02
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Target, TrendingUp, DollarSign, ArrowUpRight, Zap,
  BarChart3, Code2, Phone, PhoneCall, Briefcase, Eye,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { analyticsApi } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/store";

const SEED_CHART = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 1890 },
  { name: "Jun", value: 2390 },
];

// Role → auto-redirect destination
const ROLE_REDIRECT: Record<string, string> = {
  DEVELOPER:   "/dashboard/developer",
  COLD_CALLER: "/dashboard/cold-callers",
  OUTREACHER:  "/dashboard/outreach",
  FREELANCER:  "/dashboard/freelancer",
};

// Role dashboard cards shown to admins
const ROLE_DASHBOARDS = [
  {
    role: "DEVELOPER",
    label: "Developer Dashboard",
    desc: "Task queue, time logging, leaderboard",
    href: "/dashboard/developer",
    icon: Code2,
    gradient: "from-blue-500 to-cyan-500",
    bg: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-500/20",
    textColor: "text-blue-400",
  },
  {
    role: "COLD_CALLER",
    label: "Cold Callers",
    desc: "Daily call queue, outcomes, leaderboard",
    href: "/dashboard/cold-callers",
    icon: Phone,
    gradient: "from-violet-500 to-purple-500",
    bg: "from-violet-500/10 to-purple-500/5",
    border: "border-violet-500/20",
    textColor: "text-violet-400",
  },
  {
    role: "OUTREACHER",
    label: "Outreach Engine",
    desc: "Prospects, sequences, inbox, SDR KPIs",
    href: "/dashboard/outreach",
    icon: PhoneCall,
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-emerald-500/10 to-teal-500/5",
    border: "border-emerald-500/20",
    textColor: "text-emerald-400",
  },
  {
    role: "FREELANCER",
    label: "Freelancer Hub",
    desc: "Projects, tasks, time tracking, earnings",
    href: "/dashboard/freelancer",
    icon: Briefcase,
    gradient: "from-amber-500 to-orange-500",
    bg: "from-amber-500/10 to-orange-500/5",
    border: "border-amber-500/20",
    textColor: "text-amber-400",
  },
];

function AnimatedNumber({ value }: { value: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {value}
    </motion.span>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<any>(null);
  const [chartData, setChartData] = useState(SEED_CHART);

  // Role-based redirect — send restricted roles straight to their home dashboard
  useEffect(() => {
    if (!user) return;
    const dest = ROLE_REDIRECT[user.role];
    if (dest) router.replace(dest);
  }, [user, router]);

  useEffect(() => {
    analyticsApi.overview()
      .then((res) => setOverview(res.data))
      .catch(() => {});
    analyticsApi.revenueByMonth()
      .then((res) => {
        if (res.data?.length) {
          setChartData(res.data.map((d: any) => ({ name: d.month, value: d.revenue })));
        }
      })
      .catch(() => {});
  }, []);

  // While redirecting non-admins, show nothing
  if (user && ROLE_REDIRECT[user.role]) return null;

  const stats = [
    {
      name: "Total Revenue",
      value: overview ? `$${overview.totalRevenue.toLocaleString()}` : "$0",
      icon: DollarSign,
      trend: "+20.1%",
      gradient: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/30",
      bg: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/20",
      textColor: "text-emerald-400",
    },
    {
      name: "Active Projects",
      value: overview ? `${overview.totalProjects}` : "...",
      icon: Target,
      trend: "+2",
      gradient: "from-blue-500 to-indigo-500",
      glow: "shadow-blue-500/30",
      bg: "from-blue-500/10 to-indigo-500/5",
      border: "border-blue-500/20",
      textColor: "text-blue-400",
    },
    {
      name: "Total Contacts",
      value: overview ? `${overview.totalContacts}` : "...",
      icon: Users,
      trend: "+15.4%",
      gradient: "from-violet-500 to-purple-500",
      glow: "shadow-violet-500/30",
      bg: "from-violet-500/10 to-purple-500/5",
      border: "border-violet-500/20",
      textColor: "text-violet-400",
    },
    {
      name: "Conversion Rate",
      value: overview ? `${overview.conversionRate}%` : "...",
      icon: TrendingUp,
      trend: "+0.5%",
      gradient: "from-orange-500 to-amber-500",
      glow: "shadow-orange-500/30",
      bg: "from-orange-500/10 to-amber-500/5",
      border: "border-orange-500/20",
      textColor: "text-orange-400",
    },
  ];

  const snapshot = overview ? [
    { label: "Pipeline Value", value: `$${overview.pipelineValue.toLocaleString()}`, gradient: "from-blue-500 to-indigo-500", pct: Math.min(overview.pipelineValue / 100000 * 100, 100) },
    { label: "Open Tickets",   value: `${overview.openTickets}`,  gradient: "from-rose-500 to-pink-500",    pct: Math.min(overview.openTickets * 10, 100) },
    { label: "Active Deals",   value: `${overview.activeDeals}`,  gradient: "from-emerald-500 to-teal-500", pct: Math.min(overview.activeDeals * 10, 100) },
    { label: "Team Members",   value: `${overview.totalEmployees}`,gradient: "from-violet-500 to-purple-500",pct: Math.min(overview.totalEmployees * 5, 100) },
    { label: "Total Tasks",    value: `${overview.totalTasks}`,   gradient: "from-amber-500 to-orange-500", pct: Math.min(overview.totalTasks * 4, 100) },
  ] : null;

  return (
    <div className="space-y-8 text-white pb-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
          >
            Mission Control
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 mt-1 text-sm"
          >
            Real-time overview of your agency performance.
          </motion.p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Zap size={13} className="text-indigo-400" />
          </motion.div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Live Data</span>
        </div>
      </div>

      {/* Role Dashboards — Admin Quick Access */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-3">Role Dashboards</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLE_DASHBOARDS.map((d, i) => (
            <motion.a
              key={d.role}
              href={d.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={cn(
                "p-5 rounded-2xl border bg-gradient-to-br cursor-pointer group relative overflow-hidden",
                d.bg, d.border
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-lg", d.gradient)}>
                  <d.icon size={15} className="text-white" />
                </div>
                <Eye size={12} className="text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1" />
              </div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", d.textColor)}>{d.label}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{d.desc}</p>
            </motion.a>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={cn(
              "p-6 rounded-2xl border bg-gradient-to-br relative overflow-hidden cursor-pointer group",
              stat.bg, stat.border
            )}
          >
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/3 to-transparent skew-x-12 pointer-events-none"
            />
            <div className="flex items-start justify-between mb-5">
              <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-lg", stat.gradient, stat.glow)}>
                <stat.icon size={17} className="text-white" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={9} />
                {stat.trend}
              </span>
            </div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", stat.textColor)}>{stat.name}</p>
            <h3 className="text-2xl font-black text-white">
              <AnimatedNumber value={stat.value} />
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 p-7 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-base font-bold text-white">Revenue Growth</h3>
              <p className="text-xs text-zinc-500 mt-1">Monthly paid invoice totals</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400/80">
              <BarChart3 size={12} />
              <span>MRR Trend</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "12px", fontSize: 12 }}
                  itemStyle={{ color: "#a78bfa" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                  dot={{ fill: "#818cf8", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#a78bfa", stroke: "#4f46e5", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="p-7 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/3 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-7">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
            />
            <h3 className="text-base font-bold text-white">Live Snapshot</h3>
          </div>

          {snapshot ? (
            <div className="space-y-5">
              {snapshot.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-400">{item.label}</span>
                    <span className="text-xs font-black text-white">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 1.2, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className={cn("h-full rounded-full bg-gradient-to-r", item.gradient)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-zinc-800/60 rounded-full w-2/3 animate-pulse" />
                  <div className="h-1.5 bg-zinc-800/60 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
