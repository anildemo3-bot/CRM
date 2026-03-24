"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Target, ArrowRight, MousePointer2, Briefcase, Zap, Calendar, Ship } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const PERFORMANCE_DATA = [
  { name: "Week 1", value: 420 },
  { name: "Week 2", value: 580 },
  { name: "Week 3", value: 490 },
  { name: "Week 4", value: 720 },
  { name: "Week 5", value: 650 },
  { name: "Week 6", value: 890 },
];

const SECTOR_DATA = [
  { name: "Tech", value: 45 },
  { name: "Finance", value: 25 },
  { name: "Real Estate", value: 15 },
  { name: "Other", value: 15 },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence Analytics</h1>
          <p className="text-zinc-500 mt-1">Holistic view of agency performance and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {["7d", "30d", "90d", "YTD"].map(r => (
              <button 
                key={r}
                onClick={() => setRange(r)}
                className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", range === r ? "bg-zinc-800 text-white shadow-lg border border-zinc-700/50" : "text-zinc-500 hover:text-zinc-300")}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: "$1.2M", trend: "+14%", icon: DollarSign, color: "text-blue-400" },
          { label: "Lead Velocity", value: "248/mo", trend: "+22%", icon: Zap, color: "text-indigo-400" },
          { label: "LTV:CAC Ratio", value: "5.4x", trend: "+0.8", icon: Target, color: "text-emerald-400" },
          { label: "Churn Rate", value: "1.2%", trend: "-0.5%", icon: TrendingDown, color: "text-rose-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 group hover:border-zinc-700/60 transition-all">
            <div className="flex justify-between items-start mb-4">
               <div className={cn("p-2.5 rounded-xl bg-zinc-800", s.color)}><s.icon size={18} /></div>
               <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", s.trend.startsWith("+") ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10")}>{s.trend}</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-xl font-bold text-white mt-1">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Performance Chart */}
         <div className="lg:col-span-2 p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-lg font-bold">Performance Index</h3>
                  <p className="text-xs text-zinc-500 mt-1">Aggregate agency output vs revenue targets.</p>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Target
                  <div className="w-2 h-2 rounded-full bg-indigo-500/20 ml-3" /> Projection
               </div>
            </div>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA}>
                     <defs>
                        <linearGradient id="pColor" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                     <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px'}} />
                     <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#pColor)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Diversification / Sector breakdown */}
         <div className="p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60 flex flex-col justify-between">
            <div>
               <h3 className="text-lg font-bold mb-8">Niche Mix</h3>
               <div className="space-y-8">
                  {SECTOR_DATA.map((s, i) => (
                    <div key={s.name} className="space-y-3">
                       <div className="flex justify-between text-xs font-bold uppercase">
                          <span className="text-zinc-200">{s.name}</span>
                          <span className="text-zinc-500">{s.value}%</span>
                       </div>
                       <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full bg-blue-500 rounded-full" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="mt-12 p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800/50">
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Goal Attendance</p>
               <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12">
                     <svg className="w-12 h-12 -rotate-90">
                        <circle cx="24" cy="24" r="20" className="stroke-zinc-800 fill-none" strokeWidth="4" />
                        <circle cx="24" cy="24" r="20" className="stroke-blue-500 fill-none" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="31.4" strokeLinecap="round" />
                     </svg>
                     <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">75%</span>
                  </div>
                  <div>
                     <p className="text-xs font-bold text-white">Q1 Revenue Target</p>
                     <p className="text-[10px] text-zinc-500 leading-tight">You are ahead of schedule by 8 days.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
