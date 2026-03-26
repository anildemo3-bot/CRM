"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, Upload, Plus, Search, Trash2, X,
  CheckCircle2, XCircle, PhoneCall, PhoneMissed,
  Clock, Voicemail, Users, BarChart3, MessageSquare,
  Linkedin, Globe, Send, Eye, Reply, ChevronDown,
  Activity, Zap, Inbox, TrendingUp, GripVertical,
  Bot, Sparkles, ArrowRight, Target, List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { outreachApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

// ─── CONSTANTS ────────────────────────────────────────────────

const MAIN_TABS = ["Leads", "Sequences", "Inbox", "Activity", "SDR Dashboard", "Analytics"] as const;
type MainTab = typeof MAIN_TABS[number];

const CALL_STATUSES = ["NEW", "ATTEMPTED", "CONTACTED", "QUALIFIED", "CALLBACK", "DEAD"];
const OUTREACH_STATUSES = ["NEW", "SENT", "REPLIED", "INTERESTED", "NOT_INTERESTED", "BOUNCED"];
const OUTCOMES = ["ANSWERED", "NO_ANSWER", "CALLBACK", "VOICEMAIL", "INTERESTED", "NOT_INTERESTED"];
const CHANNELS = ["EMAIL", "LINKEDIN", "WHATSAPP", "SMS"];
const STEP_TYPES = ["EMAIL", "LINKEDIN", "CALL", "WHATSAPP", "WAIT"];
const TONES = ["PROFESSIONAL", "FRIENDLY", "DIRECT"];

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
  ANSWERED: PhoneCall, NO_ANSWER: PhoneMissed, CALLBACK: Clock,
  VOICEMAIL: Voicemail, INTERESTED: CheckCircle2, NOT_INTERESTED: XCircle,
};

const CHANNEL_ICONS: Record<string, any> = {
  EMAIL: Mail, LINKEDIN: Linkedin, WHATSAPP: MessageSquare, SMS: Phone, CALL: Phone, WAIT: Clock,
};

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  LINKEDIN: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  WHATSAPP: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SMS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CALL: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  WAIT: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────

export default function OutreachPage() {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<MainTab>("Leads");
  const fileRef = useRef<HTMLInputElement>(null);

  // Data state
  const [prospects, setProspects] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [inbox, setInbox] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [sdrStats, setSdrStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  // Lead modal
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [leadForm, setLeadForm] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "", channel: "EMAIL", status: "NEW" });

  // Call modal
  const [showCallModal, setShowCallModal] = useState(false);
  const [callProspect, setCallProspect] = useState<any>(null);
  const [callForm, setCallForm] = useState({ outcome: "NO_ANSWER", duration: 0, notes: "" });

  // Sequence builder
  const [showSeqModal, setShowSeqModal] = useState(false);
  const [editSeq, setEditSeq] = useState<any>(null);
  const [seqForm, setSeqForm] = useState({ name: "", description: "", steps: [] as any[] });
  const [enrollModal, setEnrollModal] = useState<any>(null);
  const [enrollSelected, setEnrollSelected] = useState<string[]>([]);

  // Inbox compose
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ prospectId: "", channel: "EMAIL", subject: "", body: "", direction: "OUTBOUND" });
  const [inboxFilter, setInboxFilter] = useState("");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  // AI
  const [showAI, setShowAI] = useState(false);
  const [aiForm, setAiForm] = useState({ prospectName: "", company: "", channel: "EMAIL", tone: "PROFESSIONAL", context: "" });
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);

  // Load all data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      outreachApi.prospects().catch(() => ({ data: [] })),
      outreachApi.calls().catch(() => ({ data: [] })),
      outreachApi.sequences().catch(() => ({ data: [] })),
      outreachApi.templates().catch(() => ({ data: [] })),
      outreachApi.analytics().catch(() => ({ data: null })),
      outreachApi.inbox?.().catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
      outreachApi.activities?.().catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
      outreachApi.sdrStats?.().catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
    ]).then(([p, c, s, t, a, i, act, sdr]) => {
      setProspects(p.data || []);
      setCalls(c.data || []);
      setSequences(s.data || []);
      setTemplates(t.data || []);
      setAnalytics(a.data || null);
      setInbox(i.data || []);
      setActivities(act.data || []);
      setSdrStats(sdr.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredProspects = prospects.filter(p => {
    const q = search.toLowerCase();
    if (q && !`${p.firstName} ${p.lastName} ${p.email} ${p.company}`.toLowerCase().includes(q)) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterChannel && p.channel !== filterChannel) return false;
    return true;
  });

  // ─── PROSPECTS ───────────────────────────────────────────────

  const saveLead = async () => {
    try {
      if (editLead) {
        const res = await outreachApi.updateProspect(editLead.id, leadForm);
        setProspects(p => p.map(x => x.id === editLead.id ? res.data : x));
        toast("Lead updated", "success");
      } else {
        const res = await outreachApi.createProspect(leadForm);
        setProspects(p => [res.data, ...p]);
        toast("Lead created", "success");
      }
      setShowLeadModal(false);
    } catch { toast("Failed to save lead", "error"); }
  };

  const deleteLead = async (id: string) => {
    await outreachApi.deleteProspect(id);
    setProspects(p => p.filter(x => x.id !== id));
    toast("Lead deleted", "success");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
      });
      try {
        const res = await outreachApi.importProspects(rows);
        setProspects(p => [...(res.data.prospects || []), ...p]);
        toast(`Imported ${res.data.imported} leads`, "success");
      } catch { toast("Import failed", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ─── CALLS ───────────────────────────────────────────────────

  const saveCall = async () => {
    if (!callProspect) return;
    try {
      const res = await outreachApi.createCall({ ...callForm, prospectId: callProspect.id });
      setCalls(c => [res.data, ...c]);
      setProspects(p => p.map(x => x.id === callProspect.id
        ? { ...x, status: res.data.prospectStatus || x.status } : x));
      toast("Call logged", "success");
      setShowCallModal(false);
    } catch { toast("Failed to log call", "error"); }
  };

  // ─── SEQUENCES ───────────────────────────────────────────────

  const addStep = () => {
    setSeqForm(f => ({
      ...f,
      steps: [...f.steps, { type: "EMAIL", dayOffset: f.steps.length, subject: "", body: "" }],
    }));
  };

  const updateStep = (i: number, data: any) => {
    setSeqForm(f => ({
      ...f,
      steps: f.steps.map((s, idx) => idx === i ? { ...s, ...data } : s),
    }));
  };

  const removeStep = (i: number) => {
    setSeqForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  };

  const saveSequence = async () => {
    try {
      if (editSeq) {
        const res = await outreachApi.updateSequence(editSeq.id, seqForm);
        setSequences(s => s.map(x => x.id === editSeq.id ? res.data : x));
      } else {
        const res = await outreachApi.createSequence(seqForm);
        setSequences(s => [res.data, ...s]);
      }
      toast("Sequence saved", "success");
      setShowSeqModal(false);
    } catch { toast("Failed to save sequence", "error"); }
  };

  const enrollLeads = async () => {
    if (!enrollModal || enrollSelected.length === 0) return;
    try {
      const res = await outreachApi.enrollProspects?.(enrollModal.id, enrollSelected);
      toast(`Enrolled ${res?.data?.enrolled || 0} leads`, "success");
      setEnrollModal(null);
      setEnrollSelected([]);
    } catch { toast("Enrollment failed", "error"); }
  };

  // ─── INBOX ────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!composeForm.body.trim()) return;
    try {
      const res = await outreachApi.sendMessage?.(composeForm);
      setInbox(m => [res?.data, ...m]);
      toast("Message sent", "success");
      setShowCompose(false);
      setComposeForm({ prospectId: "", channel: "EMAIL", subject: "", body: "", direction: "OUTBOUND" });
    } catch { toast("Failed to send", "error"); }
  };

  const threadedInbox = filteredProspects.reduce((acc: any, p) => {
    const msgs = inbox.filter(m => m.prospectId === p.id);
    if (msgs.length > 0 || inboxFilter === "") {
      acc.push({ prospect: p, messages: msgs, unread: msgs.filter(m => !m.isRead).length });
    }
    return acc;
  }, []).filter((t: any) => !inboxFilter || `${t.prospect.firstName} ${t.prospect.lastName} ${t.prospect.email}`.toLowerCase().includes(inboxFilter.toLowerCase()));

  // ─── AI ───────────────────────────────────────────────────────

  const generateMessage = async () => {
    if (!aiForm.prospectName || !aiForm.company) {
      toast("Fill in prospect name and company", "error"); return;
    }
    setAiLoading(true);
    try {
      const res = await outreachApi.generateMessage?.(aiForm);
      setAiResult(res?.data?.message || "");
      toast("Message generated", "success");
    } catch { toast("Generation failed", "error"); }
    finally { setAiLoading(false); }
  };

  const getFollowUps = async (prospectId: string) => {
    try {
      const res = await outreachApi.getFollowUps?.(prospectId);
      setFollowUps(res?.data || []);
    } catch {}
  };

  // ─── RENDER ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold">Outreach Engine</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cold call, email sequences, and multi-channel outreach</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 rounded-lg text-sm text-violet-400 transition-colors"
          >
            <Sparkles size={14} /> AI Generate
          </button>
          <button
            onClick={() => { setEditLead(null); setLeadForm({ firstName: "", lastName: "", email: "", phone: "", company: "", title: "", channel: "EMAIL", status: "NEW" }); setShowLeadModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800">
        {MAIN_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap",
              mainTab === tab
                ? "border-violet-500 text-white bg-violet-500/10"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* ── LEADS TAB ─────────────────────────────────── */}
        {mainTab === "Leads" && (
          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-6 gap-3 mb-5">
              {["NEW", "ATTEMPTED", "CONTACTED", "QUALIFIED", "CALLBACK", "DEAD"].map(s => (
                <div key={s} className={cn("rounded-xl border p-3 text-center cursor-pointer transition-all",
                  filterStatus === s ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700",
                )} onClick={() => setFilterStatus(filterStatus === s ? "" : s)}>
                  <div className="text-lg font-bold text-zinc-100">
                    {prospects.filter(p => p.status === s).length}
                  </div>
                  <div className="text-xs text-zinc-500">{s}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search leads..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none" />
              </div>
              <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="">All Channels</option>
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors">
                <Upload size={14} /> Import CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </div>

            {/* Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {["Lead", "Company", "Email", "Phone", "Channel", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-xs text-zinc-500 font-medium text-left uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-zinc-600">No leads yet — add one or import a CSV</td></tr>
                  ) : filteredProspects.map(p => {
                    const CIcon = CHANNEL_ICONS[p.channel] || Mail;
                    return (
                      <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-zinc-200">{p.firstName} {p.lastName}</div>
                            {p.title && <div className="text-xs text-zinc-500">{p.title}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{p.company || "—"}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{p.email || "—"}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{p.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded border flex items-center gap-1 w-fit", CHANNEL_COLORS[p.channel] || "bg-zinc-700 text-zinc-300 border-zinc-600")}>
                            <CIcon size={10} /> {p.channel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded border", STATUS_COLORS[p.status] || "bg-zinc-700 text-zinc-300 border-zinc-600")}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setCallProspect(p); setCallForm({ outcome: "NO_ANSWER", duration: 0, notes: "" }); setShowCallModal(true); }}
                              title="Log Call" className="p-1.5 rounded hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400">
                              <Phone size={14} />
                            </button>
                            <button onClick={() => { setComposeForm(f => ({ ...f, prospectId: p.id })); setShowCompose(true); setMainTab("Inbox"); }}
                              title="Send Message" className="p-1.5 rounded hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400">
                              <Mail size={14} />
                            </button>
                            <button onClick={() => { getFollowUps(p.id); setEditLead(p); setLeadForm({ firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone || "", company: p.company || "", title: p.title || "", channel: p.channel || "EMAIL", status: p.status }); setShowLeadModal(true); }}
                              title="Edit" className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200">
                              <Reply size={14} />
                            </button>
                            <button onClick={() => deleteLead(p.id)}
                              title="Delete" className="p-1.5 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SEQUENCES TAB ─────────────────────────────── */}
        {mainTab === "Sequences" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-zinc-200">Sequence Builder</h2>
              <button
                onClick={() => { setEditSeq(null); setSeqForm({ name: "", description: "", steps: [] }); setShowSeqModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium"
              >
                <Plus size={14} /> New Sequence
              </button>
            </div>

            {sequences.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
                <Zap size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium mb-1">No sequences yet</p>
                <p className="text-sm">Build multi-step sequences to automate your outreach</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sequences.map(seq => (
                  <div key={seq.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-zinc-200">{seq.name}</h3>
                        {seq.description && <p className="text-sm text-zinc-500 mt-0.5">{seq.description}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                          {seq.enrolledCount || 0} enrolled
                        </span>
                      </div>
                    </div>

                    {/* Steps preview */}
                    <div className="flex items-center gap-1 flex-wrap mb-3">
                      {(seq.steps || []).map((step: any, i: number) => {
                        const SIcon = CHANNEL_ICONS[step.type] || Mail;
                        return (
                          <div key={i} className="flex items-center gap-1">
                            <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs border", CHANNEL_COLORS[step.type] || "bg-zinc-700 text-zinc-300 border-zinc-600")}>
                              <SIcon size={10} /> Day {step.dayOffset} · {step.type}
                            </div>
                            {i < seq.steps.length - 1 && <ArrowRight size={12} className="text-zinc-600" />}
                          </div>
                        );
                      })}
                      {(!seq.steps || seq.steps.length === 0) && (
                        <span className="text-xs text-zinc-600">No steps</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditSeq(seq); setSeqForm({ name: seq.name, description: seq.description || "", steps: seq.steps || [] }); setShowSeqModal(true); }}
                        className="flex-1 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setEnrollModal(seq); setEnrollSelected([]); }}
                        className="flex-1 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg text-violet-400"
                      >
                        Enroll Leads
                      </button>
                      <button
                        onClick={async () => { await outreachApi.deleteSequence(seq.id); setSequences(s => s.filter(x => x.id !== seq.id)); }}
                        className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INBOX TAB ─────────────────────────────────── */}
        {mainTab === "Inbox" && (
          <div className="flex h-full" style={{ minHeight: 0 }}>
            {/* Thread list */}
            <div className="w-80 border-r border-zinc-800 flex flex-col">
              <div className="p-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Conversations</span>
                  <button onClick={() => setShowCompose(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-500 rounded text-xs">
                    <Plus size={12} /> Compose
                  </button>
                </div>
                <input value={inboxFilter} onChange={e => setInboxFilter(e.target.value)}
                  placeholder="Search conversations..." className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs outline-none" />
                <div className="flex gap-1 mt-2">
                  {["", "EMAIL", "LINKEDIN", "WHATSAPP"].map(ch => (
                    <button key={ch} onClick={() => setFilterChannel(ch)}
                      className={cn("px-2 py-0.5 rounded text-xs transition-colors",
                        filterChannel === ch ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}>
                      {ch || "All"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {threadedInbox.map((thread: any) => (
                  <div
                    key={thread.prospect.id}
                    onClick={() => setSelectedThread(thread.prospect.id)}
                    className={cn(
                      "px-3 py-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 transition-colors",
                      selectedThread === thread.prospect.id && "bg-zinc-800/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-sm">{thread.prospect.firstName} {thread.prospect.lastName}</div>
                      {thread.unread > 0 && (
                        <span className="text-xs bg-violet-600 text-white rounded-full px-1.5 py-0.5">{thread.unread}</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">{thread.prospect.company}</div>
                    {thread.messages[0] && (
                      <div className="text-xs text-zinc-600 truncate mt-1">{thread.messages[0].body}</div>
                    )}
                    <div className="flex gap-1 mt-1">
                      {[...new Set(thread.messages.map((m: any) => m.channel))].map((ch: any) => {
                        const CIcon = CHANNEL_ICONS[ch] || Mail;
                        return <CIcon key={ch} size={10} className="text-zinc-600" />;
                      })}
                    </div>
                  </div>
                ))}
                {threadedInbox.length === 0 && (
                  <div className="text-center py-12 text-zinc-600 text-sm">No conversations yet</div>
                )}
              </div>
            </div>

            {/* Thread view */}
            <div className="flex-1 flex flex-col">
              {selectedThread ? (
                <>
                  <div className="p-4 border-b border-zinc-800">
                    {(() => {
                      const p = prospects.find(x => x.id === selectedThread);
                      return p ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{p.firstName} {p.lastName}</h3>
                            <p className="text-sm text-zinc-500">{p.email} · {p.company}</p>
                          </div>
                          <span className={cn("text-xs px-2 py-0.5 rounded border", STATUS_COLORS[p.status])}>
                            {p.status}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {inbox.filter(m => m.prospectId === selectedThread).map(msg => (
                      <div key={msg.id} className={cn(
                        "max-w-lg rounded-xl p-3",
                        msg.direction === "OUTBOUND"
                          ? "ml-auto bg-violet-600/20 border border-violet-500/20"
                          : "bg-zinc-800 border border-zinc-700"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          {(() => { const CIcon = CHANNEL_ICONS[msg.channel] || Mail; return <CIcon size={12} className="text-zinc-400" />; })()}
                          <span className="text-xs text-zinc-500">{msg.channel}</span>
                          {msg.subject && <span className="text-xs font-medium text-zinc-300">{msg.subject}</span>}
                        </div>
                        <p className="text-sm text-zinc-200">{msg.body}</p>
                        <p className="text-xs text-zinc-600 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                    {inbox.filter(m => m.prospectId === selectedThread).length === 0 && (
                      <div className="text-center py-12 text-zinc-600 text-sm">No messages yet</div>
                    )}
                  </div>
                  <div className="p-4 border-t border-zinc-800">
                    <div className="flex gap-2">
                      <textarea
                        placeholder="Reply..."
                        rows={2}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-violet-500"
                        onKeyDown={async e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const body = (e.target as HTMLTextAreaElement).value;
                            if (body.trim()) {
                              try {
                                const res = await outreachApi.sendMessage?.({ prospectId: selectedThread, channel: "EMAIL", body, direction: "OUTBOUND" });
                                setInbox(m => [res?.data, ...m]);
                                (e.target as HTMLTextAreaElement).value = "";
                              } catch {}
                            }
                          }
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        {CHANNELS.map(ch => {
                          const CIcon = CHANNEL_ICONS[ch] || Mail;
                          return (
                            <button key={ch} title={ch} className={cn("p-2 rounded text-xs border", CHANNEL_COLORS[ch] || "bg-zinc-800 border-zinc-700")}>
                              <CIcon size={12} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-zinc-600">
                    <Inbox size={40} className="mx-auto mb-2 opacity-30" />
                    <p>Select a conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVITY TAB ──────────────────────────────── */}
        {mainTab === "Activity" && (
          <div className="p-6">
            <h2 className="font-semibold text-zinc-200 mb-4">Activity Feed</h2>
            {activities.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
                <Activity size={40} className="mx-auto mb-3 opacity-30" />
                <p>No activity yet. Start making calls and sending messages.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map(act => {
                  const actProspect = prospects.find(p => p.id === act.prospectId);
                  const icons: Record<string, any> = {
                    CALL_MADE: Phone, PROSPECT_CREATED: Plus, STATUS_CHANGED: Activity,
                    SEQUENCE_ENROLLED: Zap, EMAIL_OUTBOUND: Mail, LINKEDIN_OUTBOUND: Linkedin,
                    WHATSAPP_OUTBOUND: MessageSquare,
                  };
                  const AIcon = icons[act.type] || Activity;
                  return (
                    <div key={act.id} className="flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <AIcon size={14} className="text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {actProspect && (
                            <span className="text-sm font-medium text-zinc-200">
                              {actProspect.firstName} {actProspect.lastName}
                            </span>
                          )}
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{act.type}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-0.5">{act.description}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SDR DASHBOARD TAB ─────────────────────────── */}
        {mainTab === "SDR Dashboard" && (
          <div className="p-6">
            <h2 className="font-semibold text-zinc-200 mb-4">SDR KPI Dashboard</h2>
            {sdrStats.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
                <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                <p>No SDR data yet. Data appears once calls and messages are logged.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {sdrStats.map(sdr => (
                  <div key={sdr.userId} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <h3 className="font-medium text-zinc-200 mb-4">SDR: {sdr.userId}</h3>
                    <div className="grid grid-cols-5 gap-4 mb-5">
                      {[
                        { label: "Calls Today", val: sdr.callsToday, color: "text-blue-400" },
                        { label: "Calls This Week", val: sdr.callsThisWeek, color: "text-violet-400" },
                        { label: "Emails Sent", val: sdr.emailsSent, color: "text-cyan-400" },
                        { label: "Reply Rate", val: `${sdr.replyRate}%`, color: "text-emerald-400" },
                        { label: "Qualified", val: sdr.qualified, color: "text-amber-400" },
                      ].map(s => (
                        <div key={s.label} className="bg-zinc-800/60 rounded-lg p-3 text-center">
                          <div className={cn("text-2xl font-bold", s.color)}>{s.val}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Calls per day (last 7 days)</p>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={sdr.callsByDay || []}>
                          <Bar dataKey="calls" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ─────────────────────────────── */}
        {mainTab === "Analytics" && analytics && (
          <div className="p-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Prospects", val: analytics.totalProspects, color: "text-zinc-300" },
                { label: "Total Calls", val: analytics.totalCalls, color: "text-violet-400" },
                { label: "Connection Rate", val: `${analytics.connectionRate}%`, color: "text-blue-400" },
                { label: "Conversion Rate", val: `${analytics.conversionRate}%`, color: "text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
                  <div className={cn("text-3xl font-bold", s.color)}>{s.val}</div>
                  <div className="text-sm text-zinc-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Calls & Emails (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={analytics.last7 || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#71717a" }} />
                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} />
                    <Bar dataKey="calls" name="Calls" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="emails" name="Emails" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Leads by Status</h3>
                <div className="space-y-2">
                  {(analytics.byStatus || []).map((s: any) => (
                    <div key={s.status} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-24">{s.status}</span>
                      <div className="flex-1 bg-zinc-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-violet-500"
                          style={{ width: `${analytics.totalProspects ? (s.count / analytics.totalProspects) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 w-8 text-right">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Call Outcomes */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Call Outcomes</h3>
              <div className="grid grid-cols-6 gap-3">
                {(analytics.byOutcome || []).map((o: any) => {
                  const OIcon = OUTCOME_ICONS[o.outcome] || Phone;
                  return (
                    <div key={o.outcome} className={cn("rounded-lg border p-3 text-center", OUTCOME_COLORS[o.outcome] || "bg-zinc-800 border-zinc-700")}>
                      <OIcon size={18} className="mx-auto mb-1" />
                      <div className="text-lg font-bold">{o.count}</div>
                      <div className="text-xs">{o.outcome}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ────────────────────────────────────────── */}

      {/* Lead Modal */}
      <AnimatePresence>
        {showLeadModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editLead ? "Edit Lead" : "New Lead"}</h3>
                <button onClick={() => setShowLeadModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["First Name", "firstName"], ["Last Name", "lastName"], ["Email", "email"], ["Phone", "phone"], ["Company", "company"], ["Title", "title"]].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
                    <input value={(leadForm as any)[key]} onChange={e => setLeadForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Channel</label>
                  <select value={leadForm.channel} onChange={e => setLeadForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                  <select value={leadForm.status} onChange={e => setLeadForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                    {CALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* Follow-up suggestions */}
              {followUps.length > 0 && (
                <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                  <p className="text-xs font-medium text-violet-400 mb-2">AI Suggested Follow-ups</p>
                  {followUps.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-300 mb-1">
                      <span className={cn("px-1.5 py-0.5 rounded text-xs", f.urgency === "HIGH" ? "bg-rose-500/20 text-rose-400" : "bg-zinc-700 text-zinc-400")}>{f.urgency}</span>
                      {f.message}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={saveLead} className="flex-1 bg-violet-600 hover:bg-violet-500 rounded-lg py-2 text-sm font-medium">Save</button>
                <button onClick={() => setShowLeadModal(false)} className="flex-1 bg-zinc-800 rounded-lg py-2 text-sm text-zinc-300">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Call Modal */}
      <AnimatePresence>
        {showCallModal && callProspect && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Log Call</h3>
                  <p className="text-sm text-zinc-500">{callProspect.firstName} {callProspect.lastName}</p>
                </div>
                <button onClick={() => setShowCallModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Outcome</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {OUTCOMES.map(o => {
                      const OIcon = OUTCOME_ICONS[o] || Phone;
                      return (
                        <button key={o} onClick={() => setCallForm(f => ({ ...f, outcome: o }))}
                          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                            callForm.outcome === o ? OUTCOME_COLORS[o] : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                          <OIcon size={14} /> {o.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Duration (seconds)</label>
                  <input type="number" value={callForm.duration} onChange={e => setCallForm(f => ({ ...f, duration: Number(e.target.value) }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
                  <textarea value={callForm.notes} onChange={e => setCallForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Call notes..." rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveCall} className="flex-1 bg-violet-600 hover:bg-violet-500 rounded-lg py-2 text-sm font-medium">Log Call</button>
                <button onClick={() => setShowCallModal(false)} className="flex-1 bg-zinc-800 rounded-lg py-2 text-sm text-zinc-300">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sequence Builder Modal */}
      <AnimatePresence>
        {showSeqModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editSeq ? "Edit Sequence" : "New Sequence"}</h3>
                <button onClick={() => setShowSeqModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Sequence Name</label>
                  <input value={seqForm.name} onChange={e => setSeqForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. SaaS Cold Outreach" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                  <input value={seqForm.description} onChange={e => setSeqForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              {/* Steps */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-300">Steps ({seqForm.steps.length})</p>
                  <button onClick={addStep} className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300">
                    <Plus size={12} /> Add Step
                  </button>
                </div>
                {seqForm.steps.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-zinc-700 rounded-xl text-zinc-600 text-sm">
                    Click "Add Step" to build your sequence
                  </div>
                )}
                {seqForm.steps.map((step, i) => {
                  const SIcon = CHANNEL_ICONS[step.type] || Mail;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-2">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-bold",
                          CHANNEL_COLORS[step.type] || "bg-zinc-800 border-zinc-700 text-zinc-300")}>
                          {i + 1}
                        </div>
                        {i < seqForm.steps.length - 1 && <div className="w-0.5 h-8 bg-zinc-700 mt-1" />}
                      </div>
                      <div className="flex-1 bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Type</label>
                            <select value={step.type} onChange={e => updateStep(i, { type: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs outline-none">
                              {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Day Offset</label>
                            <input type="number" value={step.dayOffset} onChange={e => updateStep(i, { dayOffset: Number(e.target.value) })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs outline-none" />
                          </div>
                          <div className="flex items-end">
                            <button onClick={() => removeStep(i)} className="w-full py-1.5 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-400 hover:bg-rose-500/20">
                              Remove
                            </button>
                          </div>
                        </div>
                        {["EMAIL", "LINKEDIN", "WHATSAPP"].includes(step.type) && (
                          <>
                            {step.type === "EMAIL" && (
                              <input value={step.subject} onChange={e => updateStep(i, { subject: e.target.value })}
                                placeholder="Email subject..." className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs mb-2 outline-none" />
                            )}
                            <textarea value={step.body} onChange={e => updateStep(i, { body: e.target.value })}
                              placeholder="Message body..." rows={2}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs outline-none resize-none" />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={saveSequence} disabled={!seqForm.name.trim()}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium">
                  Save Sequence
                </button>
                <button onClick={() => setShowSeqModal(false)} className="flex-1 bg-zinc-800 rounded-lg py-2 text-sm text-zinc-300">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enroll Modal */}
      <AnimatePresence>
        {enrollModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Enroll in: {enrollModal.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Select leads to enroll</p>
                </div>
                <button onClick={() => setEnrollModal(null)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 mb-4">
                {prospects.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer">
                    <input type="checkbox" checked={enrollSelected.includes(p.id)}
                      onChange={e => setEnrollSelected(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                      className="rounded" />
                    <div className="flex-1">
                      <span className="text-sm text-zinc-200">{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-zinc-500 ml-2">{p.company}</span>
                    </div>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded border", STATUS_COLORS[p.status])}>{p.status}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={enrollLeads} disabled={enrollSelected.length === 0}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium">
                  Enroll {enrollSelected.length} Lead{enrollSelected.length !== 1 ? "s" : ""}
                </button>
                <button onClick={() => setEnrollModal(null)} className="flex-1 bg-zinc-800 rounded-lg py-2 text-sm text-zinc-300">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compose Message Modal */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Compose Message</h3>
                <button onClick={() => setShowCompose(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">To (Lead)</label>
                  <select value={composeForm.prospectId} onChange={e => setComposeForm(f => ({ ...f, prospectId: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="">Select lead...</option>
                    {prospects.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Channel</label>
                  <div className="flex gap-1">
                    {CHANNELS.map(ch => {
                      const CIcon = CHANNEL_ICONS[ch] || Mail;
                      return (
                        <button key={ch} onClick={() => setComposeForm(f => ({ ...f, channel: ch }))}
                          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                            composeForm.channel === ch ? CHANNEL_COLORS[ch] : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                          <CIcon size={12} /> {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {composeForm.channel === "EMAIL" && (
                  <input value={composeForm.subject} onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Subject" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
                )}
                <textarea value={composeForm.body} onChange={e => setComposeForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Message..." rows={5}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={sendMessage} disabled={!composeForm.body.trim()}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
                  <Send size={14} /> Send
                </button>
                <button onClick={() => setShowCompose(false)} className="flex-1 bg-zinc-800 rounded-lg py-2 text-sm text-zinc-300">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAI && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><Bot size={18} className="text-violet-400" /> AI Message Generator</h3>
                <button onClick={() => setShowAI(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Prospect Name</label>
                  <input value={aiForm.prospectName} onChange={e => setAiForm(f => ({ ...f, prospectName: e.target.value }))}
                    placeholder="John Doe" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Company</label>
                  <input value={aiForm.company} onChange={e => setAiForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="Acme Inc." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Channel</label>
                  <select value={aiForm.channel} onChange={e => setAiForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Tone</label>
                  <select value={aiForm.tone} onChange={e => setAiForm(f => ({ ...f, tone: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-zinc-500 mb-1 block">Context / Pain Point (optional)</label>
                <input value={aiForm.context} onChange={e => setAiForm(f => ({ ...f, context: e.target.value }))}
                  placeholder="e.g. struggling with lead conversion, recently raised Series A..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <button onClick={generateMessage} disabled={aiLoading || !aiForm.prospectName || !aiForm.company}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium mb-3 flex items-center justify-center gap-2">
                {aiLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Message</>}
              </button>
              {aiResult && (
                <div className="bg-zinc-800 border border-violet-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-violet-400 font-medium">Generated Message</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(aiResult); toast("Copied!", "success"); }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-0.5 bg-zinc-700 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-sans">{aiResult}</pre>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
