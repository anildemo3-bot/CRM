"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Search, Filter, MoreHorizontal, User, Building2,
  Briefcase, TrendingUp, Inbox, Users, Mail, Phone, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { pipelinesApi, contactsApi, dealsApi, employeesApi } from "@/lib/endpoints";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const REVENUE_DATA = [
  { month: "Jan", revenue: 45000 }, { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 }, { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 }, { month: "Jun", revenue: 67000 },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  MANAGER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DEVELOPER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  SALES: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  default: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export default function SalesCRMPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"pipeline" | "contacts" | "team" | "analytics">("pipeline");

  // Data state
  const [stages, setStages] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Deal modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", stageId: "", contactId: "" });

  // Search
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      pipelinesApi.list(),
      contactsApi.list(),
      employeesApi.list(),
    ]).then(([pipRes, ctxRes, empRes]) => {
      const pipeline = pipRes.data?.[0];
      if (pipeline?.stages) {
        setStages(pipeline.stages);
        const allDeals = pipeline.stages.flatMap((s: any) =>
          (s.deals ?? []).map((d: any) => ({ ...d, stageName: s.name }))
        );
        setDeals(allDeals);
      }
      if (ctxRes.data?.length) setContacts(ctxRes.data);
      if (empRes.data?.length) setEmployees(empRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const activeDeals = deals.filter(d => d.status === "OPEN");

  async function createDeal() {
    if (!form.title || !form.stageId) return;
    setSaving(true);
    try {
      const res = await dealsApi.create({
        title: form.title,
        value: parseFloat(form.value) || 0,
        stageId: form.stageId,
        contactId: form.contactId || undefined,
        status: "OPEN",
      });
      const stage = stages.find(s => s.id === form.stageId);
      setDeals(prev => [...prev, { ...res.data, stageName: stage?.name ?? "" }]);
      setShowModal(false);
      setForm({ title: "", value: "", stageId: "", contactId: "" });
      toast("Deal created", "success");
    } catch {
      toast("Failed to create deal", "error");
    } finally {
      setSaving(false);
    }
  }

  const filteredContacts = contacts.filter(c =>
    !search || `${c.firstName} ${c.lastName} ${c.email ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEmployees = employees.filter(e =>
    !search || `${e.name} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Sales CRM</h1>
          <p className="text-zinc-500 mt-1">Pipeline, contacts, and team directory — all in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(["pipeline","contacts","team","analytics"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize",
                  activeTab === t ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                )}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Plus size={16} />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Pipeline Value", value: `$${(totalValue/1000).toFixed(1)}k`, trend: "+12.5%", icon: TrendingUp, color: "text-blue-400" },
          { label: "Active Deals", value: `${activeDeals.length}`, trend: "+2", icon: Briefcase, color: "text-indigo-400" },
          { label: "Avg. Deal Size", value: `$${activeDeals.length ? (totalValue/activeDeals.length/1000).toFixed(1) : 0}k`, icon: User, color: "text-purple-400" },
          { label: "Team Members", value: `${employees.length}`, icon: Users, color: "text-emerald-400" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors", kpi.color)}>
                <kpi.icon size={20} />
              </div>
              {kpi.trend && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{kpi.trend}</span>
              )}
            </div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Tab */}
      {activeTab === "pipeline" && (
        loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageDeals = deals.filter(d => d.stageId === stage.id);
              const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
              return (
                <div key={stage.id} className="flex flex-col min-w-[210px] w-[210px] space-y-3">
                  <div className="flex items-baseline justify-between px-1">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stage.name}</h3>
                    <span className="text-[9px] font-medium text-zinc-600">{stageDeals.length} · ${(stageValue/1000).toFixed(1)}k</span>
                  </div>
                  <div className="flex-1 min-h-[400px] bg-zinc-900/30 border border-dashed border-zinc-800/60 rounded-2xl p-2 space-y-2">
                    {stageDeals.map((deal) => {
                      const contact = contacts.find(c => c.id === deal.contactId);
                      return (
                        <motion.div key={deal.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 cursor-pointer hover:border-blue-500/40 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400 group-hover:text-blue-400 transition-colors">
                              {(deal.title ?? "??").slice(0,2).toUpperCase()}
                            </div>
                            <button className="text-zinc-700 hover:text-zinc-400"><MoreHorizontal size={13} /></button>
                          </div>
                          <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{deal.title}</p>
                          {contact && (
                            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                              <User size={9} />{contact.firstName} {contact.lastName}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[11px] font-bold text-blue-400">${(deal.value ?? 0).toLocaleString()}</span>
                            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[7px] font-bold text-zinc-500">
                              {contact ? `${contact.firstName[0]}${contact.lastName[0]}` : "—"}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {stageDeals.length === 0 && (
                      <div className="h-20 flex items-center justify-center opacity-20">
                        <Inbox size={20} className="text-zinc-600" />
                      </div>
                    )}
                    <button onClick={() => { setForm(f => ({ ...f, stageId: stage.id })); setShowModal(true); }}
                      className="w-full py-2 flex items-center justify-center gap-1 text-[9px] font-bold text-zinc-700 hover:text-zinc-400 transition-colors">
                      <Plus size={10} /> ADD DEAL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
          <div className="p-5 border-b border-zinc-800/60 flex justify-between items-center">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts..." className="bg-zinc-800 border-none rounded-lg pl-8 pr-4 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-600 w-64" />
            </div>
            <span className="text-xs text-zinc-500">{filteredContacts.length} contacts</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 size={24} className="text-blue-500 animate-spin" /></div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredContacts.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="text-sm font-semibold text-white">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Building2 size={12} />
                        {c.company?.name ?? "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{c.position ?? "—"}</td>
                    <td className="px-6 py-4">
                      {c.email && (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <Mail size={11} />{c.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.phone && (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <Phone size={11} />{c.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-600 hover:text-white"><MoreHorizontal size={14} /></button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search team members..." className="bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-600 w-72" />
            </div>
            <span className="text-xs text-zinc-500">{filteredEmployees.length} team members</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 size={24} className="text-blue-500 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredEmployees.map((emp, i) => {
                const initials = emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                const roleStyle = ROLE_COLORS[emp.role?.toUpperCase()] ?? ROLE_COLORS.default;
                const joined = emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
                return (
                  <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-900/30">
                        {initials}
                      </div>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", roleStyle)}>
                        {emp.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{emp.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{emp.email}</p>
                    </div>
                    <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-600">
                      <span className="font-semibold">Joined {joined}</span>
                      {emp.salary && (
                        <span className="text-zinc-500">${(emp.salary/1000).toFixed(0)}k/yr</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60">
            <h3 className="text-lg font-bold text-white mb-8">Revenue Projection</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-5">Pipeline by Stage</h3>
              <div className="space-y-3">
                {stages.map(stage => {
                  const stageDeals = deals.filter(d => d.stageId === stage.id);
                  const val = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
                  const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
                  return (
                    <div key={stage.id} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-zinc-300">{stage.name}</span>
                        <span className="text-zinc-500">{stageDeals.length} deal{stageDeals.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                          className="h-full rounded-full bg-blue-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-blue-600 shadow-xl shadow-blue-600/10 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-white font-bold text-sm">Team Size</h3>
                <p className="text-blue-100 text-xs mt-2 leading-relaxed">
                  {employees.length} employees across {employees.map(e => e.role).filter((v, i, a) => a.indexOf(v) === i).length} roles. Pipeline has {activeDeals.length} open deals worth ${(totalValue/1000).toFixed(1)}k.
                </p>
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">New Deal</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Deal Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Acme Corp — CRM Build"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Value ($)</label>
                  <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    type="number" placeholder="0"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Stage *</label>
                  <select value={form.stageId} onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none">
                    <option value="">Select stage...</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Contact (optional)</label>
                  <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none">
                    <option value="">No contact</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} {c.company?.name ? `— ${c.company.name}` : ""}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-7">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:text-white hover:border-zinc-600 transition-all">
                  Cancel
                </button>
                <button onClick={createDeal} disabled={saving || !form.title || !form.stageId}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create Deal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
