"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Users, Zap, AlertTriangle, CheckCircle2, MoreHorizontal, Filter, Search, BarChart3, Clock, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { employeesApi, projectsApi } from "@/lib/endpoints";

const SEED_RESOURCES = [
  { id: "d1", name: "Sarah J.", role: "Sr. Developer", work: 85, capacity: 100, projects: 3, status: "Optimal" },
  { id: "d2", name: "Mike C.", role: "PM", work: 110, capacity: 100, projects: 5, status: "Overloaded" },
  { id: "d3", name: "Emma L.", role: "Designer", work: 40, capacity: 100, projects: 1, status: "Underutilized" },
  { id: "d4", name: "John P.", role: "Developer", work: 75, capacity: 100, projects: 2, status: "Optimal" },
];

const getStatus = (work: number) => work > 100 ? "Overloaded" : work < 50 ? "Underutilized" : "Optimal";

export default function ResourcesPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState(SEED_RESOURCES);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      employeesApi.list().then(r => r.data).catch(() => null),
      projectsApi.list().then(r => r.data).catch(() => null),
    ]).then(([emps, projs]) => {
      if (emps?.length) {
        const mapped = emps.map((e: any, i: number) => ({
          id: e.id,
          name: e.name?.split(" ").map((n: string, idx: number) => idx === 0 ? n : n[0] + ".").join(" ") ?? "Unknown",
          role: e.role ?? "Team Member",
          work: [85, 110, 40, 75, 65][i % 5],
          capacity: 100,
          projects: Math.floor(Math.random() * 4) + 1,
          status: getStatus([85, 110, 40, 75, 65][i % 5]),
        }));
        setResources(mapped);
      }
      if (projs?.length) setProjects(projs);
    }).finally(() => setLoading(false));
  }, []);

  const globalUtility = Math.round(resources.reduce((s, r) => s + Math.min(r.work, 100), 0) / Math.max(resources.length, 1));
  const overloaded = resources.filter(r => r.status === "Overloaded");
  const underutilized = resources.filter(r => r.status === "Underutilized");

  const handleBalance = () => {
    setResources(prev => prev.map(r => ({
      ...r,
      work: r.status === "Overloaded" ? Math.min(r.work - 15, 95) : r.status === "Underutilized" ? Math.min(r.work + 15, 90) : r.work,
      status: "Optimal",
    })));
    toast("Workload re-balanced across team!", "success");
  };

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Resource Engine</h1>
          <p className="text-zinc-500 mt-1">Monitor team utility, workload distribution, and burnout risks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleBalance} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2">
            <Zap size={16} /><span>Auto-Balance</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Global Utility", value: `${globalUtility}%`, icon: Cpu, color: "text-blue-400" },
          { label: "Active Team", value: resources.length, icon: Users, color: "text-indigo-400" },
          { label: "Overloaded", value: overloaded.length, icon: AlertTriangle, color: "text-rose-400" },
          { label: "Underutilized", value: underutilized.length, icon: BarChart3, color: "text-amber-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 group hover:border-zinc-700/60 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl bg-zinc-800", s.color)}><s.icon size={18} /></div>
              <span className="text-[10px] font-bold text-zinc-600 uppercase">Live</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-xl font-bold text-white mt-1">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workload Distribution */}
        <div className="p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold">Workload Distribution</h3>
              <p className="text-xs text-zinc-500 mt-1">Capacity utilization per team member.</p>
            </div>
            <Filter size={16} className="text-zinc-600 hover:text-white cursor-pointer" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-zinc-600" /></div>
          ) : (
            <div className="space-y-6">
              {resources.map((r, i) => (
                <div key={r.id} className="space-y-2 group cursor-pointer">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {r.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{r.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{r.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border mb-1 block",
                        r.status === "Overloaded" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        r.status === "Optimal" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-amber-500/10 text-amber-500 border-amber-500/20")}>{r.status}</span>
                      <span className="text-xs font-bold text-zinc-400">{r.work}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(r.work, 100)}%` }} transition={{ duration: 1.2, delay: i * 0.1 }}
                      className={cn("h-full rounded-full", r.work > 100 ? "bg-rose-500" : r.work > 80 ? "bg-emerald-500" : r.work > 50 ? "bg-blue-500" : "bg-amber-500")} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capacity Forecast */}
        <div className="p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Capacity Forecast</h3>

            {overloaded.length > 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800/60">
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20"><AlertTriangle size={20} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Resource Bottleneck Detected</h4>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      {overloaded[0].name} is at {overloaded[0].work}% capacity across {overloaded[0].projects} projects. Consider reassigning tasks to maintain delivery timelines.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => toast("Alert dismissed", "info")} className="flex-1 py-2 rounded-xl bg-zinc-800 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-zinc-700 transition-all">Dismiss</button>
                  <button onClick={handleBalance} className="flex-1 py-2 rounded-xl bg-blue-600 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">Auto-Reassign</button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={20} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Team is Balanced</h4>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">All team members are within optimal capacity range. No reassignments needed.</p>
                  </div>
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Projects</h4>
                {projects.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-xs font-medium text-zinc-300">{p.name}</span>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      p.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700")}>
                      {p.status?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Efficiency Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Avg Utilization", val: `${globalUtility}%`, icon: BarChart3 },
                { label: "Team Members", val: resources.length, icon: Users },
              ].map(m => (
                <div key={m.label} className="p-4 rounded-xl border border-zinc-800/60 flex items-center gap-3">
                  <m.icon size={14} className="text-zinc-500" />
                  <div>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase">{m.label}</p>
                    <p className="text-xs font-bold text-white">{m.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
