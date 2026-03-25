"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, Upload, Plus, Search, Filter, MoreHorizontal,
  CheckCircle2, XCircle, PhoneCall, PhoneMissed, PhoneOff,
  Voicemail, Clock, Trash2, Download, Users, BarChart3,
  TrendingUp, Zap, Target, ChevronDown, X, FileText,
  PhoneIncoming, ArrowUpRight, List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { outreachApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TABS = ["Prospects", "Call Log", "Sequences", "Email Templates", "Analytics"] as const;
type Tab = typeof TABS[number];

const STATUSES = ["NEW", "ATTEMPTED", "CONTACTED", "QUALIFIED", "CALLBACK", "DEAD"];
const OUTCOMES = ["ANSWERED", "NO_ANSWER", "CALLBACK", "VOICEMAIL", "INTERESTED", "NOT_INTERESTED"];

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  ATTEMPTED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CONTACTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  QUALIFIED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CALLBACK: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  DEAD: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const OUTCOME_COLORS: Record<string, string> = {
  ANSWERED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  NO_ANSWER: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  CALLBACK: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  VOICEMAIL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  INTERESTED: "bg-green-500/20 text-green-400 border-green-500/30",
  NOT_INTERESTED: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const OUTCOME_ICONS: Record<string, any> = {
  ANSWERED: PhoneCall,
  NO_ANSWER: PhoneMissed,
  CALLBACK: Clock,
  VOICEMAIL: Voicemail,
  INTERESTED: CheckCircle2,
  NOT_INTERESTED: XCircle,
};

export default function OutreachPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("Prospects");
  const [prospects, setProspects] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [showLogCall, setShowLogCall] = useState<any>(null);
  const [showAddSequence, setShowAddSequence] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Forms
  const [prospectForm, setProspectForm] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "" });
  const [callForm, setCallForm] = useState({ outcome: "ANSWERED", duration: "", notes: "" });
  const [seqForm, setSeqForm] = useState({ name: "", steps: [{ type: "CALL", day: 1, note: "" }] });
  const [tmplForm, setTmplForm] = useState({ name: "", subject: "", body: "", tags: "" });

  const load = async () => {
    try {
      const [p, c, s, t, a] = await Promise.all([
        outreachApi.prospects(),
        outreachApi.calls(),
        outreachApi.sequences(),
        outreachApi.templates(),
        outreachApi.analytics(),
      ]);
      setProspects(p.data);
      setCalls(c.data);
      setSequences(s.data);
      setTemplates(t.data);
      setAnalytics(a.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  // CSV Import
  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      }).filter(r => r["First Name"] || r.firstName);

      try {
        await outreachApi.importProspects(rows);
        toast(`Imported ${rows.length} prospects!`, "success");
        load();
      } catch {
        toast("Import failed", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const addProspect = async () => {
    if (!prospectForm.firstName) return;
    setLoading(true);
    try {
      await outreachApi.createProspect(prospectForm);
      toast("Prospect added!", "success");
      setShowAddProspect(false);
      setProspectForm({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "" });
      load();
    } catch { toast("Failed", "error"); }
    finally { setLoading(false); }
  };

  const logCall = async () => {
    if (!showLogCall) return;
    setLoading(true);
    try {
      await outreachApi.createCall({ prospectId: showLogCall.id, ...callForm, duration: Number(callForm.duration) });
      toast("Call logged!", "success");
      setShowLogCall(null);
      setCallForm({ outcome: "ANSWERED", duration: "", notes: "" });
      load();
    } catch { toast("Failed", "error"); }
    finally { setLoading(false); }
  };

  const deleteProspect = async (id: string) => {
    await outreachApi.deleteProspect(id);
    toast("Deleted", "success");
    load();
  };

  const deleteCall = async (id: string) => {
    await outreachApi.deleteCall(id);
    toast("Deleted", "success");
    load();
  };

  const addSequence = async () => {
    if (!seqForm.name) return;
    await outreachApi.createSequence(seqForm);
    toast("Sequence created!", "success");
    setShowAddSequence(false);
    setSeqForm({ name: "", steps: [{ type: "CALL", day: 1, note: "" }] });
    load();
  };

  const addTemplate = async () => {
    if (!tmplForm.name || !tmplForm.subject) return;
    await outreachApi.createTemplate({ ...tmplForm, tags: tmplForm.tags.split(",").map(t => t.trim()).filter(Boolean) });
    toast("Template saved!", "success");
    setShowAddTemplate(false);
    setTmplForm({ name: "", subject: "", body: "", tags: "" });
    load();
  };

  const filteredProspects = prospects.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName} ${p.company} ${p.email} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Cold Outreach
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Manage prospects, log calls, and track your team&apos;s outreach.</p>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700/60 text-zinc-300 hover:bg-zinc-800/60 transition-all text-sm font-semibold">
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={() => setShowAddProspect(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
            <Plus size={15} /> Add Prospect
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", tab === t ? "bg-zinc-800 text-white shadow border border-zinc-700/50" : "text-zinc-500 hover:text-zinc-300")}>
            {t}
          </button>
        ))}
      </div>

      {/* ── PROSPECTS TAB ── */}
      {tab === "Prospects" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prospects..."
                className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["ALL", ...STATUSES].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all",
                    statusFilter === s ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700")}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {STATUSES.map(s => (
              <div key={s} className={cn("p-3 rounded-xl border text-center", STATUS_COLORS[s])}>
                <p className="text-lg font-black">{prospects.filter(p => p.status === s).length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-70">{s}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-zinc-800/60 overflow-hidden bg-zinc-900/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/50">
                  {["Name", "Company", "Title", "Phone", "Email", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProspects.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    No prospects yet. Add one or import a CSV.
                  </td></tr>
                ) : filteredProspects.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-white">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.company || "—"}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{p.title || "—"}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{p.phone || "—"}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{p.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase border", STATUS_COLORS[p.status] || STATUS_COLORS.NEW)}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setShowLogCall(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all">
                          <Phone size={11} /> Log Call
                        </button>
                        <button onClick={() => deleteProspect(p.id)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CALL LOG TAB ── */}
      {tab === "Call Log" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800/60 overflow-hidden bg-zinc-900/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/50">
                  {["Prospect", "Outcome", "Duration", "Notes", "Date", "Delete"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calls.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    No calls logged yet. Click &quot;Log Call&quot; on a prospect.
                  </td></tr>
                ) : calls.map((c, i) => {
                  const prospect = prospects.find(p => p.id === c.prospectId);
                  const Icon = OUTCOME_ICONS[c.outcome] || Phone;
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {prospect ? `${prospect.firstName} ${prospect.lastName}` : "Unknown"}
                        {prospect?.company && <span className="text-zinc-500 text-xs ml-2">{prospect.company}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg text-[10px] font-black uppercase border", OUTCOME_COLORS[c.outcome] || "")}>
                          <Icon size={10} /> {c.outcome.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{c.duration ? `${c.duration}s` : "—"}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs truncate">{c.notes || "—"}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteCall(c.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SEQUENCES TAB ── */}
      {tab === "Sequences" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddSequence(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg transition-all hover:from-violet-500 hover:to-indigo-500">
              <Plus size={15} /> New Sequence
            </button>
          </div>
          {sequences.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">No sequences yet. Create your first outreach sequence.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sequences.map((seq, i) => (
                <motion.div key={seq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white">{seq.name}</h3>
                    <button onClick={() => { outreachApi.deleteSequence(seq.id); load(); }}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {seq.steps?.map((step: any, si: number) => (
                      <div key={si} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-[10px] font-black text-zinc-600 uppercase">Day {step.day}</span>
                        <span className={cn("px-2 py-0.5 rounded-md font-black uppercase text-[9px] border",
                          step.type === "CALL" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          step.type === "EMAIL" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-violet-500/10 text-violet-400 border-violet-500/20")}>
                          {step.type}
                        </span>
                        <span className="text-zinc-500">{step.note}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EMAIL TEMPLATES TAB ── */}
      {tab === "Email Templates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddTemplate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-bold shadow-lg transition-all hover:from-blue-500 hover:to-cyan-500">
              <Plus size={15} /> New Template
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">No templates yet. Create your first email template.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{t.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Subject: {t.subject}</p>
                    </div>
                    <button onClick={() => { outreachApi.deleteTemplate(t.id); load(); }}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{t.body}</p>
                  {t.tags?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {t.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold">{tag}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "Analytics" && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Prospects", value: analytics.totalProspects, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { label: "Total Calls", value: analytics.totalCalls, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              { label: "Connection Rate", value: `${analytics.connectionRate}%`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Qualified", value: analytics.qualified, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Conversion Rate", value: `${analytics.conversionRate}%`, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={cn("p-5 rounded-2xl border", s.bg)}>
                <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
              <h3 className="text-sm font-bold text-zinc-300 mb-6">Calls Last 7 Days</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.last7}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "10px" }} />
                    <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
              <h3 className="text-sm font-bold text-zinc-300 mb-6">Outcomes Breakdown</h3>
              <div className="space-y-3">
                {analytics.byOutcome.map((o: any) => (
                  <div key={o.outcome} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-semibold">{o.outcome.replace("_", " ")}</span>
                      <span className="text-white font-bold">{o.count}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: analytics.totalCalls > 0 ? `${(o.count / analytics.totalCalls) * 100}%` : "0%" }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Prospect ── */}
      <AnimatePresence>
        {showAddProspect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-white text-lg">Add Prospect</h2>
                <button onClick={() => setShowAddProspect(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "firstName", label: "First Name *" },
                  { key: "lastName", label: "Last Name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "company", label: "Company" },
                  { key: "title", label: "Title" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">{f.label}</label>
                    <input value={(prospectForm as any)[f.key]} onChange={e => setProspectForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddProspect(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={addProspect} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold disabled:opacity-50 transition-all">
                  Add Prospect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Log Call ── */}
      <AnimatePresence>
        {showLogCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="font-bold text-white text-lg">Log Call</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{showLogCall.firstName} {showLogCall.lastName} · {showLogCall.company}</p>
                </div>
                <button onClick={() => setShowLogCall(null)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Outcome</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OUTCOMES.map(o => {
                      const Icon = OUTCOME_ICONS[o] || Phone;
                      return (
                        <button key={o} onClick={() => setCallForm(p => ({ ...p, outcome: o }))}
                          className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[10px] font-black uppercase transition-all",
                            callForm.outcome === o ? OUTCOME_COLORS[o] + " border-current" : "border-zinc-800 text-zinc-600 hover:border-zinc-700")}>
                          <Icon size={16} />
                          {o.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Duration (seconds)</label>
                  <input type="number" value={callForm.duration} onChange={e => setCallForm(p => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g. 120"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Notes</label>
                  <textarea value={callForm.notes} onChange={e => setCallForm(p => ({ ...p, notes: e.target.value }))}
                    rows={3} placeholder="What happened on the call..."
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all resize-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowLogCall(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={logCall} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold disabled:opacity-50 transition-all">
                  Save Call Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add Sequence ── */}
      <AnimatePresence>
        {showAddSequence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-white text-lg">New Sequence</h2>
                <button onClick={() => setShowAddSequence(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Sequence Name</label>
                  <input value={seqForm.name} onChange={e => setSeqForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. 7-Day Cold Outreach"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Steps</label>
                  {seqForm.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select value={step.type} onChange={e => setSeqForm(p => ({ ...p, steps: p.steps.map((s, si) => si === i ? { ...s, type: e.target.value } : s) }))}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
                        <option>CALL</option><option>EMAIL</option><option>FOLLOWUP</option>
                      </select>
                      <input type="number" value={step.day} placeholder="Day"
                        onChange={e => setSeqForm(p => ({ ...p, steps: p.steps.map((s, si) => si === i ? { ...s, day: Number(e.target.value) } : s) }))}
                        className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                      <input value={step.note} placeholder="Note..."
                        onChange={e => setSeqForm(p => ({ ...p, steps: p.steps.map((s, si) => si === i ? { ...s, note: e.target.value } : s) }))}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                      <button onClick={() => setSeqForm(p => ({ ...p, steps: p.steps.filter((_, si) => si !== i) }))}
                        className="text-zinc-600 hover:text-rose-400"><X size={13} /></button>
                    </div>
                  ))}
                  <button onClick={() => setSeqForm(p => ({ ...p, steps: [...p.steps, { type: "CALL", day: p.steps.length + 1, note: "" }] }))}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">+ Add Step</button>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddSequence(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={addSequence} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold transition-all">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add Template ── */}
      <AnimatePresence>
        {showAddTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-white text-lg">New Email Template</h2>
                <button onClick={() => setShowAddTemplate(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name", label: "Template Name", placeholder: "e.g. Initial Outreach" },
                  { key: "subject", label: "Email Subject", placeholder: "e.g. Quick question about {{company}}" },
                  { key: "tags", label: "Tags (comma separated)", placeholder: "cold, saas, followup" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">{f.label}</label>
                    <input value={(tmplForm as any)[f.key]} onChange={e => setTmplForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Body</label>
                  <textarea value={tmplForm.body} onChange={e => setTmplForm(p => ({ ...p, body: e.target.value }))}
                    rows={5} placeholder="Hi {{firstName}}, I noticed..."
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddTemplate(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={addTemplate} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-bold transition-all">Save Template</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
