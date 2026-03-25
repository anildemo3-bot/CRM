"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, Upload, Plus, Search, Trash2, X,
  CheckCircle2, XCircle, PhoneCall, PhoneMissed,
  Clock, Voicemail, Users, BarChart3, MessageSquare,
  Linkedin, Globe, Send, Eye, Reply, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { outreachApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MAIN_TABS = ["Cold Callers", "Outreachers"] as const;
type MainTab = typeof MAIN_TABS[number];

const CALL_STATUSES = ["NEW", "ATTEMPTED", "CONTACTED", "QUALIFIED", "CALLBACK", "DEAD"];
const OUTREACH_STATUSES = ["NEW", "SENT", "REPLIED", "INTERESTED", "NOT_INTERESTED", "BOUNCED"];
const OUTCOMES = ["ANSWERED", "NO_ANSWER", "CALLBACK", "VOICEMAIL", "INTERESTED", "NOT_INTERESTED"];
const CHANNELS = ["EMAIL", "LINKEDIN", "WHATSAPP", "SMS"];

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  ATTEMPTED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CONTACTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  QUALIFIED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CALLBACK: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  DEAD: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  SENT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  REPLIED: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  INTERESTED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  NOT_INTERESTED: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  BOUNCED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
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

const CHANNEL_ICONS: Record<string, any> = {
  EMAIL: Mail,
  LINKEDIN: Linkedin,
  WHATSAPP: MessageSquare,
  SMS: Phone,
};

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  LINKEDIN: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  WHATSAPP: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SMS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function OutreachPage() {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<MainTab>("Cold Callers");

  // Data
  const [prospects, setProspects] = useState<any[]>([]);
  const [outreachLeads, setOutreachLeads] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [showAddOutreachLead, setShowAddOutreachLead] = useState(false);
  const [showLogCall, setShowLogCall] = useState<any>(null);
  const [showLogOutreach, setShowLogOutreach] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const callerFileRef = useRef<HTMLInputElement>(null);
  const outreachFileRef = useRef<HTMLInputElement>(null);

  // Forms
  const [prospectForm, setProspectForm] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "", assignedTo: "" });
  const [outreachForm, setOutreachForm] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "", channel: "EMAIL", assignedTo: "" });
  const [callForm, setCallForm] = useState({ outcome: "ANSWERED", duration: "", notes: "" });
  const [outreachLogForm, setOutreachLogForm] = useState({ channel: "EMAIL", status: "SENT", notes: "", subject: "" });

  const load = async () => {
    try {
      const [p, c, a] = await Promise.all([
        outreachApi.prospects(),
        outreachApi.calls(),
        outreachApi.analytics(),
      ]);
      // Split prospects into callers vs outreachers by type
      setProspects(p.data.filter((x: any) => x.type !== "OUTREACH"));
      setOutreachLeads(p.data.filter((x: any) => x.type === "OUTREACH"));
      setCalls(c.data);
      setAnalytics(a.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  // CSV import for callers
  const handleCallerCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
        const obj: any = { type: "CALLER" };
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      }).filter(r => r["First Name"] || r.firstName);
      try {
        await outreachApi.importProspects(rows);
        toast(`Imported ${rows.length} leads for callers!`, "success");
        load();
      } catch { toast("Import failed", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // CSV import for outreachers
  const handleOutreachCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
        const obj: any = { type: "OUTREACH" };
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      }).filter(r => r["First Name"] || r.firstName);
      try {
        await outreachApi.importProspects(rows);
        toast(`Imported ${rows.length} leads for outreachers!`, "success");
        load();
      } catch { toast("Import failed", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const addProspect = async () => {
    if (!prospectForm.firstName) return;
    setLoading(true);
    try {
      await outreachApi.createProspect({ ...prospectForm, type: "CALLER" });
      toast("Lead added for callers!", "success");
      setShowAddProspect(false);
      setProspectForm({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "", assignedTo: "" });
      load();
    } catch { toast("Failed", "error"); }
    finally { setLoading(false); }
  };

  const addOutreachLead = async () => {
    if (!outreachForm.firstName) return;
    setLoading(true);
    try {
      await outreachApi.createProspect({ ...outreachForm, type: "OUTREACH" });
      toast("Lead added for outreachers!", "success");
      setShowAddOutreachLead(false);
      setOutreachForm({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "", channel: "EMAIL", assignedTo: "" });
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

  const logOutreach = async () => {
    if (!showLogOutreach) return;
    setLoading(true);
    try {
      await outreachApi.createCall({
        prospectId: showLogOutreach.id,
        outcome: outreachLogForm.status,
        notes: outreachLogForm.notes,
        duration: 0,
        channel: outreachLogForm.channel,
        subject: outreachLogForm.subject,
      });
      await outreachApi.updateProspect(showLogOutreach.id, { status: outreachLogForm.status });
      toast("Outreach logged!", "success");
      setShowLogOutreach(null);
      setOutreachLogForm({ channel: "EMAIL", status: "SENT", notes: "", subject: "" });
      load();
    } catch { toast("Failed", "error"); }
    finally { setLoading(false); }
  };

  const deleteProspect = async (id: string) => {
    await outreachApi.deleteProspect(id);
    toast("Deleted", "success");
    load();
  };

  const filteredProspects = prospects.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName} ${p.company} ${p.email} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredOutreachLeads = outreachLeads.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName} ${p.company} ${p.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Outreach Center
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Manage your cold callers and outreachers from one place.</p>
        </div>
        {/* Stats pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Phone size={13} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">{prospects.length} Caller Leads</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Mail size={13} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-400">{outreachLeads.length} Outreach Leads</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-1 w-fit">
        {MAIN_TABS.map(t => (
          <button key={t} onClick={() => { setMainTab(t); setSearch(""); setStatusFilter("ALL"); }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              mainTab === t
                ? t === "Cold Callers"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-zinc-500 hover:text-zinc-300"
            )}>
            {t === "Cold Callers" ? <Phone size={14} /> : <Mail size={14} />}
            {t}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          COLD CALLERS TAB
      ═══════════════════════════════════════ */}
      {mainTab === "Cold Callers" && (
        <div className="space-y-5">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
                  className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-all w-56" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["ALL", ...CALL_STATUSES].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                      statusFilter === s ? "bg-emerald-600 border-emerald-500 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input ref={callerFileRef} type="file" accept=".csv" className="hidden" onChange={handleCallerCSV} />
              <button onClick={() => callerFileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700/60 text-zinc-300 hover:bg-zinc-800/60 transition-all text-sm font-semibold">
                <Upload size={14} /> Import CSV
              </button>
              <button onClick={() => setShowAddProspect(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
                <Plus size={14} /> Add Lead
              </button>
            </div>
          </div>

          {/* Status counts */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {CALL_STATUSES.map(s => (
              <div key={s} className={cn("p-3 rounded-xl border text-center cursor-pointer hover:opacity-80 transition-opacity", STATUS_COLORS[s])}
                onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}>
                <p className="text-lg font-black">{prospects.filter(p => p.status === s).length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-70">{s}</p>
              </div>
            ))}
          </div>

          {/* Leads table */}
          <div className="rounded-2xl border border-zinc-800/60 overflow-hidden bg-zinc-900/30">
            <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                {filteredProspects.length} Leads
              </h3>
              <span className="text-[10px] text-zinc-600">Hover a row to log call</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/40">
                  {["Name", "Company", "Phone", "Email", "Assigned To", "Status", "Calls", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProspects.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-16 text-center">
                    <Phone size={32} className="text-zinc-800 mx-auto mb-3" />
                    <p className="text-zinc-600 text-sm">No leads yet. Import a CSV or add manually.</p>
                  </td></tr>
                ) : filteredProspects.map((p, i) => {
                  const prospectCalls = calls.filter(c => c.prospectId === p.id);
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white text-sm">{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] text-zinc-600">{p.title}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{p.company || "—"}</td>
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{p.phone || "—"}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{p.email || "—"}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{p.assignedTo || "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase border", STATUS_COLORS[p.status] || STATUS_COLORS.NEW)}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs font-bold">{prospectCalls.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setShowLogCall(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all">
                            <Phone size={10} /> Log
                          </button>
                          <button onClick={() => deleteProspect(p.id)}
                            className="p-1.5 rounded-lg text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recent call logs */}
          {calls.length > 0 && (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/50">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Recent Call Logs</h3>
              </div>
              <div className="divide-y divide-zinc-800/30">
                {calls.slice(0, 8).map((c, i) => {
                  const prospect = prospects.find(p => p.id === c.prospectId);
                  const Icon = OUTCOME_ICONS[c.outcome] || Phone;
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors">
                      <div className={cn("p-1.5 rounded-lg border", OUTCOME_COLORS[c.outcome] || "")}>
                        <Icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {prospect ? `${prospect.firstName} ${prospect.lastName}` : "Unknown"}
                          {prospect?.company && <span className="text-zinc-500 text-xs ml-2">{prospect.company}</span>}
                        </p>
                        {c.notes && <p className="text-xs text-zinc-500 truncate">{c.notes}</p>}
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase border", OUTCOME_COLORS[c.outcome] || "")}>
                        {c.outcome.replace("_", " ")}
                      </span>
                      {c.duration > 0 && <span className="text-[10px] text-zinc-600">{c.duration}s</span>}
                      <button onClick={() => { outreachApi.deleteCall(c.id); load(); }}
                        className="p-1 text-zinc-700 hover:text-rose-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          OUTREACHERS TAB
      ═══════════════════════════════════════ */}
      {mainTab === "Outreachers" && (
        <div className="space-y-5">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
                  className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500/50 transition-all w-56" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["ALL", ...OUTREACH_STATUSES].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                      statusFilter === s ? "bg-blue-600 border-blue-500 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input ref={outreachFileRef} type="file" accept=".csv" className="hidden" onChange={handleOutreachCSV} />
              <button onClick={() => outreachFileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700/60 text-zinc-300 hover:bg-zinc-800/60 transition-all text-sm font-semibold">
                <Upload size={14} /> Import CSV
              </button>
              <button onClick={() => setShowAddOutreachLead(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
                <Plus size={14} /> Add Lead
              </button>
            </div>
          </div>

          {/* Status counts */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {OUTREACH_STATUSES.map(s => (
              <div key={s} className={cn("p-3 rounded-xl border text-center cursor-pointer hover:opacity-80 transition-opacity", STATUS_COLORS[s])}
                onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}>
                <p className="text-lg font-black">{outreachLeads.filter(p => p.status === s).length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-70">{s}</p>
              </div>
            ))}
          </div>

          {/* Channel filter pills */}
          <div className="flex gap-2">
            {CHANNELS.map(ch => {
              const Icon = CHANNEL_ICONS[ch];
              return (
                <button key={ch}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all", CHANNEL_COLORS[ch])}>
                  <Icon size={11} /> {ch}
                </button>
              );
            })}
          </div>

          {/* Leads table */}
          <div className="rounded-2xl border border-zinc-800/60 overflow-hidden bg-zinc-900/30">
            <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                {filteredOutreachLeads.length} Leads
              </h3>
              <span className="text-[10px] text-zinc-600">Hover a row to log outreach</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/40">
                  {["Name", "Company", "Email", "Channel", "Assigned To", "Status", "Touches", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOutreachLeads.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-16 text-center">
                    <Mail size={32} className="text-zinc-800 mx-auto mb-3" />
                    <p className="text-zinc-600 text-sm">No outreach leads yet. Import a CSV or add manually.</p>
                  </td></tr>
                ) : filteredOutreachLeads.map((p, i) => {
                  const leadCalls = calls.filter(c => c.prospectId === p.id);
                  const ChanIcon = CHANNEL_ICONS[p.channel || "EMAIL"] || Mail;
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white text-sm">{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] text-zinc-600">{p.title}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{p.company || "—"}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{p.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase border", CHANNEL_COLORS[p.channel || "EMAIL"])}>
                          <ChanIcon size={9} /> {p.channel || "EMAIL"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{p.assignedTo || "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase border", STATUS_COLORS[p.status] || STATUS_COLORS.NEW)}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs font-bold">{leadCalls.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setShowLogOutreach(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-all">
                            <Send size={10} /> Log
                          </button>
                          <button onClick={() => deleteProspect(p.id)}
                            className="p-1.5 rounded-lg text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recent outreach logs */}
          {calls.filter(c => outreachLeads.some(l => l.id === c.prospectId)).length > 0 && (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/50">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Recent Outreach Activity</h3>
              </div>
              <div className="divide-y divide-zinc-800/30">
                {calls.filter(c => outreachLeads.some(l => l.id === c.prospectId)).slice(0, 8).map((c) => {
                  const lead = outreachLeads.find(l => l.id === c.prospectId);
                  const ChanIcon = CHANNEL_ICONS[c.channel || "EMAIL"] || Mail;
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors">
                      <div className={cn("p-1.5 rounded-lg border", CHANNEL_COLORS[c.channel || "EMAIL"])}>
                        <ChanIcon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {lead ? `${lead.firstName} ${lead.lastName}` : "Unknown"}
                          {lead?.company && <span className="text-zinc-500 text-xs ml-2">{lead.company}</span>}
                        </p>
                        {c.notes && <p className="text-xs text-zinc-500 truncate">{c.notes}</p>}
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase border", STATUS_COLORS[c.outcome] || "")}>
                        {c.outcome?.replace("_", " ")}
                      </span>
                      <button onClick={() => { outreachApi.deleteCall(c.id); load(); }}
                        className="p-1 text-zinc-700 hover:text-rose-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Add Caller Lead ── */}
      <AnimatePresence>
        {showAddProspect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-white text-lg flex items-center gap-2"><Phone size={18} className="text-emerald-400" /> Add Caller Lead</h2>
                <button onClick={() => setShowAddProspect(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "firstName", label: "First Name *" },
                  { key: "lastName", label: "Last Name" },
                  { key: "phone", label: "Phone" },
                  { key: "email", label: "Email" },
                  { key: "company", label: "Company" },
                  { key: "title", label: "Title" },
                  { key: "assignedTo", label: "Assign To (name)" },
                ].map(f => (
                  <div key={f.key} className={f.key === "assignedTo" ? "col-span-2" : ""}>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">{f.label}</label>
                    <input value={(prospectForm as any)[f.key]} onChange={e => setProspectForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddProspect(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={addProspect} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold disabled:opacity-50 transition-all">
                  Add Lead
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add Outreach Lead ── */}
      <AnimatePresence>
        {showAddOutreachLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-white text-lg flex items-center gap-2"><Mail size={18} className="text-blue-400" /> Add Outreach Lead</h2>
                <button onClick={() => setShowAddOutreachLead(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "firstName", label: "First Name *" },
                  { key: "lastName", label: "Last Name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "company", label: "Company" },
                  { key: "title", label: "Title" },
                  { key: "assignedTo", label: "Assign To (name)" },
                ].map(f => (
                  <div key={f.key} className={f.key === "assignedTo" ? "col-span-2" : ""}>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">{f.label}</label>
                    <input value={(outreachForm as any)[f.key]} onChange={e => setOutreachForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Channel</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CHANNELS.map(ch => {
                      const Icon = CHANNEL_ICONS[ch];
                      return (
                        <button key={ch} onClick={() => setOutreachForm(p => ({ ...p, channel: ch }))}
                          className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all",
                            outreachForm.channel === ch ? CHANNEL_COLORS[ch] + " border-current" : "border-zinc-800 text-zinc-600 hover:border-zinc-700")}>
                          <Icon size={16} />{ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddOutreachLead(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={addOutreachLead} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold disabled:opacity-50 transition-all">
                  Add Lead
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
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-white text-lg">Log Call</h2>
                <button onClick={() => setShowLogCall(null)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-xs text-zinc-500 mb-5">{showLogCall.firstName} {showLogCall.lastName} · {showLogCall.company} · {showLogCall.phone}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Outcome *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OUTCOMES.map(o => {
                      const Icon = OUTCOME_ICONS[o] || Phone;
                      return (
                        <button key={o} onClick={() => setCallForm(p => ({ ...p, outcome: o }))}
                          className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[10px] font-black uppercase transition-all",
                            callForm.outcome === o ? OUTCOME_COLORS[o] + " border-current" : "border-zinc-800 text-zinc-600 hover:border-zinc-700")}>
                          <Icon size={16} />{o.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Duration (seconds)</label>
                  <input type="number" value={callForm.duration} onChange={e => setCallForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 120"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Notes</label>
                  <textarea value={callForm.notes} onChange={e => setCallForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                    placeholder="What happened on the call..."
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowLogCall(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={logCall} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold disabled:opacity-50 transition-all">
                  Save Call
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Log Outreach ── */}
      <AnimatePresence>
        {showLogOutreach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-white text-lg">Log Outreach</h2>
                <button onClick={() => setShowLogOutreach(null)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-xs text-zinc-500 mb-5">{showLogOutreach.firstName} {showLogOutreach.lastName} · {showLogOutreach.company} · {showLogOutreach.email}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Channel</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CHANNELS.map(ch => {
                      const Icon = CHANNEL_ICONS[ch];
                      return (
                        <button key={ch} onClick={() => setOutreachLogForm(p => ({ ...p, channel: ch }))}
                          className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all",
                            outreachLogForm.channel === ch ? CHANNEL_COLORS[ch] + " border-current" : "border-zinc-800 text-zinc-600 hover:border-zinc-700")}>
                          <Icon size={16} />{ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Status *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OUTREACH_STATUSES.map(s => (
                      <button key={s} onClick={() => setOutreachLogForm(p => ({ ...p, status: s }))}
                        className={cn("p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all",
                          outreachLogForm.status === s ? STATUS_COLORS[s] + " border-current" : "border-zinc-800 text-zinc-600 hover:border-zinc-700")}>
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Subject / Topic</label>
                  <input value={outreachLogForm.subject} onChange={e => setOutreachLogForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Initial outreach email"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Notes</label>
                  <textarea value={outreachLogForm.notes} onChange={e => setOutreachLogForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                    placeholder="What was the response or context..."
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowLogOutreach(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all">Cancel</button>
                <button onClick={logOutreach} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold disabled:opacity-50 transition-all">
                  Save Outreach
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
