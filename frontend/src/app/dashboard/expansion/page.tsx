"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, Target, ArrowUpRight, CheckCircle2, MoreHorizontal, Search, Filter, Ship, Rocket, DollarSign, Brain, Star, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

const OPPORTUNITIES = [
  { id: "o1", client: "Acme Corp", type: "Upsell", opportunity: "Premium Automation Pack", value: "$500/mo", confidence: "94%", signal: "Manual tasks peak" },
  { id: "o2", client: "Globex Inc", type: "Expansion", opportunity: "Additional Seats (15→25)", value: "$250/mo", confidence: "76%", signal: "Login saturation" },
  { id: "o3", client: "Initech", type: "Cross-sell", opportunity: "Marketing SOP Pack", value: "$1,200", confidence: "62%", signal: "Department growth" },
  { id: "o4", client: "Soylent Tech", type: "Retention", opportunity: "Strategy Re-alignment", value: "Save $8k", confidence: "45%", signal: "Low activity spike" },
];

export default function ExpansionPage() {
  const { toast } = useToast();

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Growth & Expansion</h1>
          <p className="text-zinc-500 mt-1">Revenue intelligence and upsell opportunity detection engine.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => toast("Expansion model refreshed!", "success")} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2">
            <Rocket size={16} />
            <span>Launch Scan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Exp. Pipeline", value: "$124k", trend: "+$12k", icon: DollarSign, color: "text-blue-400" },
          { label: "Signals Detected", value: "48", trend: "+12", icon: Zap, color: "text-amber-400" },
          { label: "Close Confidence", value: "72%", trend: "+5%", icon: Brain, color: "text-emerald-400" },
          { label: "Avg. Upsell Val", value: "$840", trend: "+14%", icon: BarChart3, color: "text-purple-400" },
        ].map((s, i) => (
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">Detected Opportunities</h3>
               <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800"><Filter size={14} /></button>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
               {OPPORTUNITIES.map((o, i) => (
                 <motion.div key={o.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                   className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60 hover:border-indigo-500/40 transition-all group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                       <div className="flex items-center gap-3">
                          <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", 
                            o.type === "Upsell" ? "bg-blue-400/10 text-blue-400 border-blue-400/20" : 
                            o.type === "Expansion" ? "bg-indigo-400/10 text-indigo-400 border-indigo-400/20" : 
                            o.type === "Cross-sell" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : 
                            "bg-rose-400/10 text-rose-400 border-rose-400/20")}>
                            {o.type}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{o.client}</span>
                       </div>
                       <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{o.opportunity}</h3>
                       <p className="text-[10px] text-zinc-500">Signal: <span className="text-zinc-300 font-medium">{o.signal}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Est. Value</p>
                          <p className="text-sm font-bold text-white">{o.value}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Confidence</p>
                          <p className="text-sm font-bold text-indigo-400">{o.confidence}</p>
                       </div>
                       <button className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all group-hover:shadow-lg group-hover:shadow-indigo-600/20"><ArrowUpRight size={18} /></button>
                    </div>
                 </motion.div>
               ))}
            </div>
         </div>

         <div className="p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60 h-fit">
            <h3 className="text-lg font-bold mb-8">Intelligence Feed</h3>
            <div className="space-y-8">
               {[
                 { title: "Acme Corp High Burn", desc: "User activity has increased by 140% this week. Upsell probability: 94%.", time: "2h ago" },
                 { title: "Renewal Risk: Initech", desc: "Low login frequency for 3 critical stakeholders. Intervene immediately.", time: "5h ago" },
                 { title: "Referral Ready", desc: "Soylent Tech NPS score is 10/10. Launch referral offer now.", time: "1d ago" },
               ].map((item, i) => (
                 <div key={item.title} className="flex gap-4 relative">
                    <div className="absolute left-[7px] top-6 bottom-[-24px] w-[1px] bg-zinc-800" />
                    <div className="w-4 h-4 rounded-full border border-zinc-700 bg-zinc-900 flex-shrink-0 mt-1 z-10" />
                    <div className="pb-8">
                       <h4 className="text-xs font-bold text-white">{item.title}</h4>
                       <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
                       <p className="text-[9px] text-zinc-700 mt-2 font-bold uppercase tracking-widest">{item.time}</p>
                    </div>
                 </div>
              ))}
            </div>
            <button className="mt-8 text-xs font-bold text-zinc-500 hover:text-white transition-colors w-full text-center">VIEW FULL LOGS</button>
         </div>
      </div>
    </div>
  );
}
