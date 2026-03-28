"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, PhoneCall, PhoneMissed, Clock, CheckCircle2, XCircle,
  Voicemail, Users, BarChart3, Loader2, Play, ChevronRight,
  Building2, User, Mail, Target, TrendingUp, Award, Zap, RefreshCw, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { outreachApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";
import { useAuthStore } from "@/lib/store";

const TABS = ["My Today", "All Leads", "Call Log", "Leaderboard"] as const;
type Tab = typeof TABS[number];

const OUTCOMES = [
  { key: "ANSWERED",       label: "Answered",      icon: PhoneCall,    color: "bg-emerald-500 hover:bg-emerald-400", status: "CONTACTED" },
  { key: "INTERESTED",     label: "Booked",         icon: CheckCircle2, color: "bg-violet-600 hover:bg-violet-500",  status: "QUALIFIED" },
  { key: "NOT_INTERESTED", label: "Not Interested", icon: XCircle,      color: "bg-rose-600 hover:bg-rose-500",      status: "DEAD" },
  { key: "CALLBACK",       label: "Callback",       icon: Clock,        color: "bg-amber-500 hover:bg-amber-400",    status: "CALLBACK" },
  { key: "NO_ANSWER",      label: "No Answer",      icon: PhoneMissed,  color: "bg-zinc-600 hover:bg-zinc-500",      status: "ATTEMPTED" },
  { key: "VOICEMAIL",      label: "Voicemail",      icon: Voicemail,    color: "bg-blue-600 hover:bg-blue-500",      status: "ATTEMPTED" },
];

const STATUS_COLORS: Record<string, string> = {
  NEW:           "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  ATTEMPTED:     "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CONTACTED:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
  QUALIFIED:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CALLBACK:      "bg-violet-500/20 text-violet-400 border-violet-500/30",
  DEAD:          "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function ColdCallersPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("My Today");

  // Data
  const [todayLeads, setTodayLeads] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [callLog, setCallLog] = useState<any[]>([]);
  const [sdrStats, setSdrStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Call modal
  const [callModal, setCallModal] = useState<any>(null);
  const [callNotes, setCallNotes] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [logging, setLogging] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [todayRes, prospectsRes, callsRes, statsRes] = await Promise.all([
        outreachApi.myLeadsToday(),
        outreachApi.prospects(),
        outreachApi.calls(),
        outreachApi.sdrStats(),
      ]);
      setTodayLeads(todayRes.data?.leads || []);
      setTodayStats(todayRes.data?.stats || null);
      setAllLeads(prospectsRes.data || []);
      setCallLog(callsRes.data || []);
      setSdrStats(statsRes.data || []);
    } catch {
      toast("Failed to load data", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const distribute = async () => {
    setDistributing(true);
    try {
      await outreachApi.distributeLeads(55);
      toast("55 leads distributed per caller!", "success");
      await load();
    } catch {
      toast("Distribution failed", "error");
    }
    setDistributing(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");
      const lines = normalized.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast("CSV is empty", "error"); setImporting(false); return; }
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      }).filter(r => r["first name"] || r["firstname"] || r["first_name"] || r["name"]);
      const mapped = rows.map(r => ({
        firstName: r["first name"] || r["firstname"] || r["first_name"] || r["name"] || "",
        lastName: r["last name"] || r["lastname"] || r["last_name"] || "",
        email: r["email"] || "",
        phone: r["phone"] || r["phone number"] || r["mobile"] || "",
        company: r["company"] || r["company name"] || "",
        title: r["title"] || r["job title"] || r["position"] || "",
        channel: "PHONE",
      }));
      await outreachApi.importProspects(mapped);
      toast(`${mapped.length} prospects imported!`, "success");
      await load();
    } catch {
      toast("Import failed", "error");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const logCall = async (outcome: string, prospectStatus: string) => {
    if (!callModal) return;
    setLogging(true);
    try {
      await Promise.all([
        outreachApi.createCall({
          prospectId: callModal.id,
          outcome,
          duration: callDuration,
          notes: callNotes,
        }),
        outreachApi.updateProspect(callModal.id, { status: prospectStatus }),
      ]);
      toast("Call logged!", "success");
      setCallModal(null);
      setCallNotes("");
      setCallDuration(0);
      await load();
    } catch {
      toast("Failed to log call", "error");
    }
    setLogging(false);
  };

  // Quick action without modal (for No Answer / Voicemail)
  const quickLog = async (lead: any, outcome: typeof OUTCOMES[number]) => {
    try {
      await Promise.all([
        outreachApi.createCall({ prospectId: lead.id, outcome: outcome.key, duration: 0, notes: "" }),
        outreachApi.updateProspect(lead.id, { status: outcome.status }),
      ]);
      toast(`Marked as ${outcome.label}`, "success");
      await load();
    } catch {
      toast("Failed", "error");
    }
  };

  const called = todayLeads.filter(l => l.status !== "NEW").length;
  const booked = todayLeads.filter(l => l.status === "QUALIFIED").length;
  const notInterested = todayLeads.filter(l => l.status === "DEAD").length;
  const callbacks = todayLeads.filter(l => l.status === "CALLBACK").length;
  const pending = todayLeads.filter(l => l.status === "NEW" || l.status === "ATTEMPTED").length;
  const progress = todayLeads.length > 0 ? Math.round((called / todayLeads.length) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-zinc-600" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Cold Callers</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Daily phone outreach dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all">
            <RefreshCw size={14} />
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            Import CSV
          </button>
          <button
            onClick={distribute}
            disabled={distributing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {distributing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            Distribute 55 Leads
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
              tab === t
                ? "bg-zinc-700 text-white shadow"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── MY TODAY ── */}
      {tab === "My Today" && (
        <div className="space-y-5">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Today", value: todayLeads.length, color: "text-white" },
              { label: "Pending",     value: pending,           color: "text-amber-400" },
              { label: "Called",      value: called,            color: "text-blue-400" },
              { label: "Booked",      value: booked,            color: "text-emerald-400" },
              { label: "Not Int.",    value: notInterested,     color: "text-rose-400" },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">Daily Progress</span>
              <span className="text-xs font-black text-white">{progress}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">{called} of {todayLeads.length} leads actioned today</p>
          </div>

          {/* Callbacks highlight */}
          {callbacks > 0 && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex items-center gap-3">
              <Clock size={16} className="text-violet-400 flex-shrink-0" />
              <p className="text-xs text-violet-300 font-semibold">{callbacks} callback{callbacks > 1 ? "s" : ""} scheduled — call these first</p>
            </div>
          )}

          {/* Lead cards */}
          {todayLeads.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Phone size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No leads assigned yet</p>
              <p className="text-xs mt-1">Click &quot;Distribute 55 Leads&quot; to get your daily queue</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {/* Show callbacks first */}
              {[...todayLeads].sort((a, b) => {
                if (a.status === "CALLBACK" && b.status !== "CALLBACK") return -1;
                if (b.status === "CALLBACK" && a.status !== "CALLBACK") return 1;
                if (a.status === "NEW" && b.status !== "NEW") return -1;
                if (b.status === "NEW" && a.status !== "NEW") return 1;
                return 0;
              }).map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onCall={() => { setCallModal(lead); setCallNotes(""); setCallDuration(0); }}
                  onQuick={(outcome) => quickLog(lead, outcome)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL LEADS ── */}
      {tab === "All Leads" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">{allLeads.length} total prospects in system</p>
          {allLeads.map(lead => (
            <div key={lead.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                {lead.firstName?.[0]}{lead.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{lead.firstName} {lead.lastName}</p>
                <p className="text-xs text-zinc-500">{lead.company} · {lead.title}</p>
              </div>
              {lead.phone && <p className="text-xs text-zinc-400 font-mono hidden sm:block">{lead.phone}</p>}
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_COLORS[lead.status] || STATUS_COLORS.NEW)}>
                {lead.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── CALL LOG ── */}
      {tab === "Call Log" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">{callLog.length} calls logged</p>
          {callLog.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <PhoneCall size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No calls logged yet</p>
            </div>
          ) : callLog.map((call: any) => {
            const OutcomeIcon = OUTCOMES.find(o => o.key === call.outcome)?.icon || PhoneCall;
            return (
              <div key={call.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <OutcomeIcon size={14} className="text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {call.prospect?.firstName} {call.prospect?.lastName}
                  </p>
                  <p className="text-xs text-zinc-500">{call.prospect?.company}</p>
                  {call.notes && <p className="text-xs text-zinc-400 mt-1 italic">&quot;{call.notes}&quot;</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                    call.outcome === "INTERESTED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    call.outcome === "NOT_INTERESTED" ? "bg-rose-500/20 text-rose-400 border-rose-500/30" :
                    call.outcome === "CALLBACK" ? "bg-violet-500/20 text-violet-400 border-violet-500/30" :
                    "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                  )}>
                    {call.outcome?.replace(/_/g, " ")}
                  </span>
                  {call.duration > 0 && <p className="text-[10px] text-zinc-600 mt-1">{call.duration}s</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === "Leaderboard" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Team Performance</p>
          {sdrStats.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Award size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No stats yet — start calling!</p>
            </div>
          ) : sdrStats.map((s: any, i: number) => (
            <div key={s.userId || i} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0",
                i === 0 ? "bg-amber-400 text-black" :
                i === 1 ? "bg-zinc-400 text-black" :
                i === 2 ? "bg-amber-700 text-white" :
                "bg-zinc-800 text-zinc-400"
              )}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{s.name || s.userId}</p>
                <p className="text-xs text-zinc-500">{s.callsMade || 0} calls · {s.qualified || 0} booked</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-400">{s.qualified || 0}</p>
                <p className="text-[10px] text-zinc-600">bookings</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CALL LOG MODAL ── */}
      <AnimatePresence>
        {callModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setCallModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Prospect info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-black text-white">
                  {callModal.firstName?.[0]}{callModal.lastName?.[0]}
                </div>
                <div>
                  <p className="text-base font-bold text-white">{callModal.firstName} {callModal.lastName}</p>
                  <p className="text-xs text-zinc-500">{callModal.company} · {callModal.title}</p>
                  {callModal.phone && <p className="text-xs text-blue-400 font-mono mt-0.5">{callModal.phone}</p>}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Call Notes</label>
                <textarea
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="What happened on the call?"
                  rows={3}
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Duration (seconds)</label>
                <input
                  type="number"
                  value={callDuration}
                  onChange={e => setCallDuration(Number(e.target.value))}
                  min={0}
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>

              {/* Outcome buttons */}
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">What was the outcome?</p>
              <div className="grid grid-cols-2 gap-2">
                {OUTCOMES.map(o => {
                  const Icon = o.icon;
                  return (
                    <button
                      key={o.key}
                      onClick={() => logCall(o.key, o.status)}
                      disabled={logging}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50",
                        o.color
                      )}
                    >
                      <Icon size={13} />
                      {o.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCallModal(null)}
                className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LEAD CARD ─────────────────────────────────────────────────

function LeadCard({ lead, onCall, onQuick }: { lead: any; onCall: () => void; onQuick: (o: typeof OUTCOMES[number]) => void }) {
  const isDone = ["QUALIFIED", "DEAD"].includes(lead.status);
  const isCallback = lead.status === "CALLBACK";

  return (
    <motion.div
      layout
      className={cn(
        "bg-zinc-900/60 border rounded-xl p-4 transition-all",
        isCallback ? "border-violet-500/40 bg-violet-500/5" :
        isDone ? "border-zinc-800/40 opacity-60" :
        "border-zinc-800/60 hover:border-zinc-700/60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
          {lead.firstName?.[0]}{lead.lastName?.[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{lead.firstName} {lead.lastName}</p>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_COLORS[lead.status] || STATUS_COLORS.NEW)}>
              {lead.status}
            </span>
          </div>
          <p className="text-xs text-zinc-500">{lead.company} · {lead.title}</p>
          {lead.phone && <p className="text-xs text-blue-400 font-mono mt-0.5">{lead.phone}</p>}
          {lead.email && <p className="text-xs text-zinc-600 mt-0.5">{lead.email}</p>}
        </div>

        {/* Main call button */}
        {!isDone && (
          <button
            onClick={onCall}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex-shrink-0"
          >
            <Phone size={12} />
            Call
          </button>
        )}
        {isDone && (
          <CheckCircle2 size={18} className={lead.status === "QUALIFIED" ? "text-emerald-400" : "text-zinc-600"} />
        )}
      </div>

      {/* Quick actions for non-done leads */}
      {!isDone && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {OUTCOMES.filter(o => !["ANSWERED"].includes(o.key)).map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                onClick={() => onQuick(o)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-400 hover:text-white text-[10px] font-semibold transition-all border border-zinc-700/40"
              >
                <Icon size={10} />
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
