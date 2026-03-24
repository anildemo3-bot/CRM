"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, AlertCircle, CheckCircle2, Clock, Plus, Filter, Search, MoreHorizontal, Smile, Frown, Meh, RefreshCw, Zap, TrendingUp, ShieldCheck, X, Loader2, Bell, ArrowUpRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { ticketsApi } from "@/lib/endpoints";

type CsTab = "tickets" | "nps" | "renewals" | "expansion";

const SEED_TICKETS = [
  { id: "t1", subject: "Critical: Login bypass identified", client: "Acme Corp", priority: "Critical", status: "Open", created: "2h ago" },
  { id: "t2", subject: "Export to CSV missing field", client: "Globex", priority: "Medium", status: "In Progress", created: "5h ago" },
  { id: "t3", subject: "Dashboard loadtime latency", client: "Initech", priority: "Low", status: "Resolved", created: "1d ago" },
  { id: "t4", subject: "Slack integration auth error", client: "Soylent Corp", priority: "High", status: "Open", created: "2d ago" },
];

const NPS_DATA = [
  { client: "Acme Corp", score: 9, feedback: "Platform is transformative for our sales team velocity.", date: "10 Mar" },
  { client: "Globex", score: 7, feedback: "Powerful features, but UI learning curve is steep.", date: "12 Mar" },
  { client: "Initech", score: 6, feedback: "Support response times are lagging behind SLAs.", date: "14 Mar" },
  { client: "Soylent Corp", score: 10, feedback: "The best CRM we've ever implemented, period.", date: "16 Mar" },
];

const RENEWALS = [
  { id: "r1", client: "Acme Corp", plan: "Enterprise", mrr: 8000, renewalDate: "2024-06-01", health: "Healthy", daysLeft: 73 },
  { id: "r2", client: "Globex Inc", plan: "Growth", mrr: 2500, renewalDate: "2024-04-15", health: "At Risk", daysLeft: 26 },
  { id: "r3", client: "Initech", plan: "Starter", mrr: 500, renewalDate: "2024-05-01", health: "Healthy", daysLeft: 42 },
  { id: "r4", client: "Soylent Corp", plan: "Growth", mrr: 2500, renewalDate: "2024-07-20", health: "Champion", daysLeft: 122 },
];

const UPSELLS = [
  { id: "u1", client: "Acme Corp", type: "Upsell", opportunity: "Premium Automation Pack", value: "$500/mo", confidence: 94, signal: "Manual tasks peak ↑140%" },
  { id: "u2", client: "Globex Inc", type: "Expansion", opportunity: "Additional Seats (15→25)", value: "$250/mo", confidence: 76, signal: "Login saturation" },
  { id: "u3", client: "Initech", type: "Cross-sell", opportunity: "Marketing SOP Pack", value: "$1,200", confidence: 62, signal: "Department growth" },
  { id: "u4", client: "Soylent Corp", type: "Referral", opportunity: "Referral Program Launch", value: "New $8k client", confidence: 88, signal: "NPS = 10, love the product" },
];

const PRIORITY_STYLE: Record<string, string> = {
  Critical: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  High: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Medium: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Low: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

const STATUS_CONFIG: Record<string, { icon: any; color: string }> = {
  Open: { icon: AlertCircle, color: "text-rose-400" },
  "In Progress": { icon: Clock, color: "text-amber-400" },
  Resolved: { icon: CheckCircle2, color: "text-emerald-400" },
};

export default function ClientSuccessPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<CsTab>("tickets");
  const [tickets, setTickets] = useState(SEED_TICKETS);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", client: "", priority: "Medium", description: "" });

  useEffect(() => {
    ticketsApi.list().then(res => {
      if (res.data?.length) {
        const mapped = res.data.map((t: any) => ({
          id: t.id, subject: t.subject, client: "Client",
          priority: t.priority === "URGENT" ? "Critical" : (t.priority?.charAt(0) + t.priority?.slice(1).toLowerCase()),
          status: t.status === "IN_PROGRESS" ? "In Progress" : (t.status?.charAt(0) + t.status?.slice(1).toLowerCase()),
          created: new Date(t.createdAt).toLocaleDateString(),
        }));
        setTickets(mapped);
      }
    }).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      const res = await ticketsApi.create({ subject: form.subject, priority: form.priority.toUpperCase(), status: "OPEN" });
      const created = res.data ?? { id: `t${Date.now()}`, ...form, status: "Open", created: "Just now" };
      setTickets(prev => [{ id: created.id, subject: form.subject, client: form.client || "—", priority: form.priority, status: "Open", created: "Just now" }, ...prev]);
      toast("Support case created!", "success");
      setShowModal(false);
      setForm({ subject: "", client: "", priority: "Medium", description: "" });
    } catch {
      toast("Failed to create case", "error");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "tickets", label: "Support", icon: MessageSquare },
    { id: "nps", label: "Sentiment", icon: Smile },
    { id: "renewals", label: "Renewals", icon: ShieldCheck },
    { id: "expansion", label: "Upsells", icon: Zap },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Client Success Center</h1>
          <p className="text-zinc-500 mt-1">Monitor account health, NPS sentiment, and retention risks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as CsTab)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5", tab === t.id ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>
                <t.icon size={12} /><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Plus size={16} /><span>New Case</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Net Promoter Score", value: "8.4", trend: "+0.2", icon: Smile, color: "text-emerald-400" },
          { label: "Churn Risk", value: "1.2%", trend: "-0.4%", icon: AlertCircle, color: "text-rose-400" },
          { label: "Avg. Resolution", value: "4.2h", trend: "+15m", icon: Clock, color: "text-blue-400" },
          { label: "Expansion Opps", value: "$42k", trend: "+$5k", icon: TrendingUp, color: "text-indigo-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 group hover:border-zinc-700/60 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl bg-zinc-800", s.color)}><s.icon size={18} /></div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", s.trend.startsWith("+") ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10")}>{s.trend}</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-xl font-bold text-white mt-1">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      {tab === "tickets" && (
        <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
          <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input placeholder="Search tickets..." className="bg-zinc-800 border-none rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-600 w-64" />
              </div>
            </div>
            <div className="flex bg-zinc-800 rounded-lg p-0.5">
              {["All", "Open", "Resolved"].map(f => (
                <button key={f} className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", f === "All" ? "bg-zinc-700 text-white" : "text-zinc-500")}>{f}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {tickets.map((t, i) => {
              const Config = STATUS_CONFIG[t.status] ?? STATUS_CONFIG["Open"];
              return (
                <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 hover:bg-zinc-800/20 transition-all cursor-pointer group">
                  <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center", Config.color)}>
                    <Config.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", PRIORITY_STYLE[t.priority])}>{t.priority}</span>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t.client}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{t.subject}</h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Received</p>
                      <p className="text-xs text-zinc-400">{t.created}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-600 hover:text-white cursor-pointer">
                      <MoreHorizontal size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "nps" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 text-white">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">Recent Feedback</h3>
            {NPS_DATA.map((n, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 group hover:border-zinc-700/60 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">{n.score >= 9 ? <Smile size={18} className="text-emerald-400" /> : n.score >= 7 ? <Meh size={18} className="text-amber-400" /> : <Frown size={18} className="text-rose-400" />}</div>
                    <span className="text-sm font-bold text-white">{n.client}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={12} className={n.score >= star * 2 ? "text-amber-400 fill-amber-400" : "text-zinc-700"} />)}
                    <span className={cn("text-xl font-black ml-2", n.score >= 9 ? "text-emerald-400" : n.score >= 7 ? "text-amber-400" : "text-rose-400")}>{n.score}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 italic leading-relaxed">&quot;{n.feedback}&quot;</p>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-4">Verified Customer · {n.date}</p>
              </motion.div>
            ))}
          </div>
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 h-fit text-white">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold">Sentiment Volume</h3>
              <RefreshCw size={14} className="text-zinc-600 hover:text-blue-400 cursor-pointer transition-colors" />
            </div>
            <div className="space-y-6">
              {[
                { label: "Promoters (9–10)", value: 65, color: "bg-emerald-500", count: "18 accounts" },
                { label: "Passives (7–8)", value: 25, color: "bg-amber-500", count: "8 accounts" },
                { label: "Detractors (0–6)", value: 10, color: "bg-rose-500", count: "3 accounts" },
              ].map((item, i) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div><p className="text-xs font-bold text-white">{item.label}</p><p className="text-[10px] text-zinc-500">{item.count}</p></div>
                    <span className="text-xs font-bold text-zinc-400">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full", item.color)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20">
              <p className="text-xs font-semibold text-blue-400">AI Tip</p>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">Promoters peaked in March. Launch a referral campaign for &quot;Acme Corp&quot; and &quot;Soylent Corp&quot; to capitalize on high sentiment.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "renewals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Renewal MRR", value: `$${RENEWALS.reduce((s, r) => s + r.mrr, 0).toLocaleString()}`, color: "text-blue-400" },
              { label: "Healthy", value: RENEWALS.filter(r => r.health === "Healthy" || r.health === "Champion").length, color: "text-emerald-400" },
              { label: "At Risk", value: RENEWALS.filter(r => r.health === "At Risk").length, color: "text-rose-400" },
              { label: "Avg Days Left", value: `${Math.round(RENEWALS.reduce((s, r) => s + r.daysLeft, 0) / RENEWALS.length)}d`, color: "text-amber-400" },
            ].map((s, i) => (
              <div key={s.label} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {RENEWALS.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      r.health === "Champion" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      r.health === "Healthy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-rose-500/10 text-rose-400 border-rose-500/20")}>{r.health}</span>
                    <span className="text-xs text-zinc-500">{r.plan}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{r.client}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Renews {r.renewalDate}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">MRR</p>
                    <p className="text-sm font-bold text-white">${r.mrr.toLocaleString()}/mo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">Days Left</p>
                    <p className={cn("text-lg font-bold", r.daysLeft <= 30 ? "text-rose-400" : "text-white")}>{r.daysLeft}</p>
                  </div>
                  <button onClick={() => toast(`Renewal reminder sent to ${r.client}!`, "success")}
                    className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-blue-600 transition-all">
                    <Bell size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tab === "expansion" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pipeline Value", value: "$12.5k", color: "text-blue-400" },
              { label: "Opportunities", value: UPSELLS.length, color: "text-indigo-400" },
              { label: "Avg Confidence", value: `${Math.round(UPSELLS.reduce((s, u) => s + u.confidence, 0) / UPSELLS.length)}%`, color: "text-emerald-400" },
              { label: "High Confidence", value: UPSELLS.filter(u => u.confidence >= 80).length, color: "text-amber-400" },
            ].map((s, i) => (
              <div key={s.label} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {UPSELLS.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 hover:border-indigo-500/40 transition-all group flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      o.type === "Upsell" ? "bg-blue-400/10 text-blue-400 border-blue-400/20" :
                      o.type === "Expansion" ? "bg-indigo-400/10 text-indigo-400 border-indigo-400/20" :
                      o.type === "Cross-sell" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" :
                      "bg-purple-400/10 text-purple-400 border-purple-400/20")}>{o.type}</span>
                    <span className="text-[10px] font-bold text-zinc-500">{o.client}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{o.opportunity}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">Signal: <span className="text-zinc-300">{o.signal}</span></p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">Value</p>
                    <p className="text-sm font-bold text-white">{o.value}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">Confidence</p>
                    <p className={cn("text-sm font-bold", o.confidence >= 80 ? "text-emerald-400" : "text-amber-400")}>{o.confidence}%</p>
                  </div>
                  <button onClick={() => toast(`Expansion proposal sent for ${o.client}!`, "success")}
                    className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* New Case Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">New Support Case</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Subject *</label>
                  <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Brief issue description" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Client</label>
                    <input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
                      placeholder="Acme Corp" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Priority</label>
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="Detailed description of the issue..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.subject.trim()}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}Create Case
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
