"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Send, BarChart2, Users, Zap, Target, Mail, MessageSquare, Megaphone, ArrowUpRight, MousePointer2, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { campaignsApi, leadsApi } from "@/lib/endpoints";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type MktTab = "campaigns" | "leads" | "analytics" | "segments";

const SEED_CAMPAIGNS = [
  { id: "cp1", name: "Q1 Cold Email — SaaS Founders", type: "Email", status: "active", sent: 2248, opens: 889, clicks: 334, replies: 122, created: "2024-03-01" },
  { id: "cp2", name: "LinkedIn DM — E-commerce Brands", type: "LinkedIn", status: "active", sent: 1120, opens: 667, clicks: 228, replies: 88, created: "2024-03-05" },
  { id: "cp3", name: "SMS Re-engagement — Lost Leads", type: "SMS", status: "paused", sent: 850, opens: 720, clicks: 118, replies: 55, created: "2024-02-20" },
  { id: "cp4", name: "Nurture Sequence — Warm Leads", type: "Email", status: "draft", sent: 0, opens: 0, clicks: 0, replies: 0, created: "2024-03-15" },
];

const SEED_LEADS = [
  { id: "l1", name: "Alice Walker", company: "Acme Corp", score: 92, signals: ["Pricing page: 4x", "Trial started"], source: "LinkedIn", status: "Hot" },
  { id: "l2", name: "Bob Chen", company: "Globex", score: 74, signals: ["Demo watched", "Newsletter: 5x"], source: "Cold Email", status: "Warm" },
  { id: "l3", name: "Carol Dunn", company: "Initech", score: 58, signals: ["Blog reader: 3x"], source: "Organic", status: "Warm" },
  { id: "l4", name: "Dan Fox", company: "Soylent Corp", score: 41, signals: ["1 website visit"], source: "Ads", status: "Cold" },
];

const FUNNEL_DATA = [
  { stage: "Visitors", count: 12400, color: "#3b82f6" },
  { stage: "Leads", count: 1860, color: "#6366f1" },
  { stage: "MQLs", count: 420, color: "#8b5cf6" },
  { stage: "SQLs", count: 94, color: "#a855f7" },
  { stage: "Customers", count: 18, color: "#d946ef" },
];

const SEGMENTS = [
  { id: "seg1", name: "SaaS Founders (Series A)", count: 248, source: "LinkedIn + Email", score: "High Intent", lastUpdated: "2024-03-20" },
  { id: "seg2", name: "E-commerce 7-fig Brands", count: 185, source: "Cold Email", score: "Medium Intent", lastUpdated: "2024-03-18" },
  { id: "seg3", name: "Healthcare Clinics", count: 92, source: "Paid Ads", score: "Low Intent", lastUpdated: "2024-03-15" },
  { id: "seg4", name: "Churned Customers (90d)", count: 34, source: "CRM Export", score: "Reactivation", lastUpdated: "2024-03-22" },
];

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  draft: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

export default function MarketingPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<MktTab>("campaigns");
  const [campaigns, setCampaigns] = useState(SEED_CAMPAIGNS);
  const [leads, setLeads] = useState(SEED_LEADS);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Email", status: "draft" });

  useEffect(() => {
    campaignsApi.list().then(res => {
      if (res.data?.length) {
        const mapped = res.data.map((c: any) => ({
          id: c.id, name: c.name, type: c.type ?? "EMAIL",
          status: (c.status ?? "ACTIVE").toLowerCase(),
          sent: c._count?.leads ?? 0, opens: 0, clicks: 0, replies: 0,
          created: new Date(c.createdAt).toLocaleDateString(),
        }));
        setCampaigns(mapped);
      }
    }).catch(() => {});
    leadsApi.list().then(res => {
      if (res.data?.length) {
        const mapped = res.data.map((l: any) => ({
          id: l.id, name: l.firstName + " " + (l.lastName ?? ""), company: l.company ?? "—",
          score: l.score ?? 50, signals: [], source: l.source ?? "Organic",
          status: (l.score ?? 50) >= 80 ? "Hot" : (l.score ?? 50) >= 60 ? "Warm" : "Cold",
        }));
        setLeads(mapped);
      }
    }).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await campaignsApi.create({ name: form.name, type: form.type, status: form.status.toUpperCase() });
      const created = res.data ?? { id: `cp${Date.now()}`, ...form, sent: 0, opens: 0, clicks: 0, replies: 0, created: new Date().toLocaleDateString() };
      setCampaigns(prev => [created, ...prev]);
      toast("Campaign created!", "success");
      setShowModal(false);
      setForm({ name: "", type: "Email", status: "draft" });
    } catch {
      toast("Failed to create campaign", "error");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "campaigns" as MktTab, label: "Campaigns", icon: Megaphone },
    { id: "leads" as MktTab, label: "Lead Scoring", icon: Target },
    { id: "analytics" as MktTab, label: "Funnel", icon: BarChart2 },
    { id: "segments" as MktTab, label: "Segments", icon: Users },
  ];

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Marketing Automation</h1>
          <p className="text-zinc-500 mt-1">Deploy multi-channel campaigns and track attribution.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5", tab === t.id ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>
                <t.icon size={12} /><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
            <Plus size={16} /><span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Reach", value: totalSent.toLocaleString(), trend: "+14.2%", icon: Users, color: "text-blue-400" },
          { label: "Avg. Open Rate", value: "32.4%", trend: "+2.1%", icon: Mail, color: "text-indigo-400" },
          { label: "Avg. Click Rate", value: "8.7%", trend: "-0.4%", icon: MousePointer2, color: "text-purple-400" },
          { label: "Lead-to-SQL", value: "11.2%", trend: "+5.1%", icon: Zap, color: "text-emerald-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors", s.color)}><s.icon size={20} /></div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", s.trend.startsWith("+") ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10")}>{s.trend}</span>
            </div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      {tab === "campaigns" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md border", STATUS_STYLE[c.status])}>{c.status}</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{c.type}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{c.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">Created {c.created}</p>
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <div><p className="text-[10px] font-bold text-zinc-600 uppercase">Sent</p><p className="text-sm font-bold text-white">{c.sent.toLocaleString()}</p></div>
                  <div><p className="text-[10px] font-bold text-zinc-600 uppercase">Replies</p><p className="text-sm font-bold text-blue-400">{c.replies.toLocaleString()}</p></div>
                  <div><p className="text-[10px] font-bold text-zinc-600 uppercase">Conv.</p><p className="text-sm font-bold text-emerald-400">{c.sent > 0 ? ((c.replies / c.sent) * 100).toFixed(1) : 0}%</p></div>
                </div>
              </div>
              <div className="w-full sm:w-48 h-32 bg-zinc-950/50 rounded-2xl border border-zinc-800/60 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500">ENGAGEMENT</span>
                  <ArrowUpRight size={14} className="text-zinc-600" />
                </div>
                <div className="flex items-end gap-1 h-12">
                  {[40, 70, 45, 90, 65, 80, 55].map((h, idx) => (
                    <div key={idx} className="flex-1 bg-blue-500/20 rounded-t-sm group-hover:bg-blue-500/40 transition-all" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span>MTWTFSS</span>
                  <span className={c.status === "active" ? "text-emerald-400" : "text-zinc-500"}>{c.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Leads", value: leads.length, color: "text-blue-400" },
              { label: "Hot Leads", value: leads.filter(l => l.status === "Hot").length, color: "text-rose-400" },
              { label: "Warm Leads", value: leads.filter(l => l.status === "Warm").length, color: "text-amber-400" },
              { label: "Avg Score", value: Math.round(leads.reduce((s, l) => s + l.score, 0) / Math.max(leads.length, 1)), color: "text-emerald-400" },
            ].map((s, i) => (
              <div key={s.label} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {leads.map((lead, i) => (
              <motion.div key={lead.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      lead.status === "Hot" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      lead.status === "Warm" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-zinc-800 text-zinc-500 border-zinc-700")}>{lead.status}</span>
                    <span className="text-xs text-zinc-500">{lead.source}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{lead.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{lead.company}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lead.signals.map((sig: string, idx: number) => (
                      <span key={idx} className="text-[9px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded">{sig}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Lead Score</p>
                    <div className="relative w-14 h-14">
                      <svg className="w-14 h-14 -rotate-90">
                        <circle cx="28" cy="28" r="24" className="stroke-zinc-800 fill-none" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" className={cn("fill-none", lead.score >= 80 ? "stroke-rose-500" : lead.score >= 60 ? "stroke-amber-500" : "stroke-zinc-600")} strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={`${2 * Math.PI * 24 * (1 - lead.score / 100)}`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{lead.score}</span>
                    </div>
                  </div>
                  <button onClick={() => toast(`Opening conversation with ${lead.name}...`, "info")}
                    className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
          <div className="lg:col-span-2 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60">
            <h3 className="text-lg font-bold mb-8">Marketing Funnel</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FUNNEL_DATA} layout="vertical" barSize={32}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontWeight: 600, fontSize: 12 }} width={100} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {FUNNEL_DATA.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 h-full">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Channel Attribution</h3>
            <div className="space-y-6">
              {[
                { channel: "Cold Email", value: 45, color: "bg-blue-500" },
                { channel: "LinkedIn DM", value: 30, color: "bg-indigo-500" },
                { channel: "Paid Ads", value: 15, color: "bg-purple-500" },
                { channel: "Referrals", value: 10, color: "bg-emerald-500" },
              ].map((item, i) => (
                <div key={item.channel} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-zinc-200">{item.channel}</span>
                    <span className="text-zinc-500">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1, delay: i * 0.1 }} className={cn("h-full rounded-full", item.color)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
              <p className="text-xs font-bold text-indigo-400">A/B Test Active</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Subject line test: &quot;Quick question&quot; (A) vs &quot;We can help&quot; (B). A is winning with 38.2% open rate (+12%).</p>
            </div>
          </div>
        </div>
      )}

      {tab === "segments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {SEGMENTS.map((seg, i) => (
              <motion.div key={seg.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      seg.score === "High Intent" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      seg.score === "Medium Intent" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      seg.score === "Reactivation" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-zinc-800 text-zinc-500 border-zinc-700")}>{seg.score}</span>
                    <span className="text-[10px] text-zinc-500">{seg.source}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{seg.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">Updated {seg.lastUpdated}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">Contacts</p>
                    <p className="text-xl font-bold text-white">{seg.count}</p>
                  </div>
                  <button onClick={() => toast(`Launching campaign to ${seg.name}...`, "success")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all">Launch</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">New Campaign</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Campaign Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Q2 Cold Email — SaaS Founders" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Channel</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                      <option>Email</option>
                      <option>LinkedIn</option>
                      <option>SMS</option>
                      <option>WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}Create Campaign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
