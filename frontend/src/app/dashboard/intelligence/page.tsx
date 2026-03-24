"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, DollarSign, Target, Zap, ArrowUpRight, BarChart3, Globe, Rocket, PieChart, Activity, ShieldCheck, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const NICHE_DATA = [
  { niche: "SaaS Founders", revenue: 84000, color: "#3b82f6" },
  { niche: "E-commerce", revenue: 62000, color: "#6366f1" },
  { niche: "Healthcare", revenue: 45000, color: "#8b5cf6" },
  { niche: "Real Estate", revenue: 28000, color: "#a855f7" },
  { niche: "Agencies", revenue: 19000, color: "#d946ef" },
];

export default function IntelligencePage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"niches" | "scripts" | "offers">("niches");

  const STATS = [
    { label: "Optimal CAC", value: "$412", trend: "-12%", icon: Target, color: "text-blue-400" },
    { label: "Best Channel", value: "LinkedIn", trend: "+8%", icon: Zap, color: "text-amber-400" },
    { label: "Rev/Lead Avg", value: "$1,248", trend: "+$220", icon: DollarSign, color: "text-emerald-400" },
    { label: "Expansion Vol", value: "24%", trend: "+2%", icon: TrendingUp, color: "text-indigo-400" },
  ];

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence Layer</h1>
          <p className="text-zinc-500 mt-1">Cross-platform data aggregation for strategic decisioning.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => toast("Predictive model updated!", "success")} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2">
            <Brain size={16} />
            <span>Regenerate Model</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 group hover:border-zinc-700/60 transition-all">
            <div className="flex justify-between items-start mb-4">
               <div className={cn("p-2.5 rounded-xl bg-zinc-800", s.color)}><s.icon size={18} /></div>
               <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", s.trend.startsWith("+") ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-400")}>{s.trend}</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-xl font-bold text-white mt-1">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Top Niche Chart */}
         <div className="lg:col-span-2 p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-lg font-bold">Revenue by Segment</h3>
                  <p className="text-xs text-zinc-500 mt-1">Niche profitability rank based on Q1 data.</p>
               </div>
               <div className="flex bg-zinc-800 rounded-lg p-0.5">
                  {["Revenue","Conversion","LTV"].map(f => <button key={f} className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", f === "Revenue" ? "bg-zinc-700 text-white" : "text-zinc-500")}>{f}</button>)}
               </div>
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={NICHE_DATA} barSize={32}>
                     <XAxis dataKey="niche" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} tickFormatter={v => `$${v/1000}k`} />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px'}} />
                     <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {NICHE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* AI Insight Box */}
         <div className="space-y-6">
            <div className="p-8 rounded-[2rem] bg-indigo-600 shadow-xl shadow-indigo-600/10 relative overflow-hidden h-full flex flex-col justify-between text-white">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                     <Brain size={24} className="text-white opacity-80" />
                     <h3 className="font-bold">Strategic Insight</h3>
                  </div>
                  <p className="text-base font-medium leading-relaxed mb-6">&quot;SaaS Founders show a 2.4x higher LTV but 40% longer sales cycle. Consider re-allocating SDR resources to E-commerce for faster cashflow in Q2.&quot;</p>
                  <div className="space-y-3">
                     {[
                       { label: "Confience", val: "94%" },
                       { label: "Data points", val: "12,480" },
                       { label: "Impact", val: "High" }
                     ].map(i => (
                       <div key={i.label} className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-xs text-white/60">{i.label}</span>
                          <span className="text-xs font-bold text-white">{i.val}</span>
                       </div>
                     ))}
                  </div>
               </div>
               <button className="mt-8 bg-white text-indigo-600 w-full py-3 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all uppercase tracking-widest shadow-lg">Apply Strategy</button>
               <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            </div>
         </div>
      </div>
    </div>
  );
}
