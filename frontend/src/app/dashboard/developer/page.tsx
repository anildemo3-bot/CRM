"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, CheckCircle2, AlertTriangle, Play, Eye,
  Clock, Timer, Award, Loader2, RefreshCw,
  Upload, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";
import { useAuthStore } from "@/lib/store";

const TABS = ["My Today", "All Tasks", "Log Time", "Leaderboard", "Import CSV"] as const;
type Tab = typeof TABS[number];

const ACTIONS = [
  { key: "IN_PROGRESS", label: "Start",       icon: Play,          color: "bg-blue-600 hover:bg-blue-500",     text: "text-white" },
  { key: "REVIEW",      label: "Send Review", icon: Eye,           color: "bg-violet-600 hover:bg-violet-500", text: "text-white" },
  { key: "DONE",        label: "Mark Done",   icon: CheckCircle2,  color: "bg-emerald-600 hover:bg-emerald-500",text: "text-white" },
  { key: "BLOCKED",     label: "Blocked",     icon: AlertTriangle, color: "bg-rose-600 hover:bg-rose-500",     text: "text-white" },
];

const STATUS_COLORS: Record<string, string> = {
  TODO:        "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  IN_PROGRESS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  REVIEW:      "bg-violet-500/20 text-violet-400 border-violet-500/30",
  DONE:        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  BLOCKED:     "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-rose-500",
  HIGH:   "bg-orange-500",
  MEDIUM: "bg-amber-400",
  LOW:    "bg-zinc-600",
};

export default function DeveloperPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("My Today");

  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Time log form
  const [timeForm, setTimeForm] = useState({ taskId: "", hours: "", description: "" });
  const [loggingTime, setLoggingTime] = useState(false);

  // Update modal
  const [updateModal, setUpdateModal] = useState<any>(null);
  const [updateNote, setUpdateNote] = useState("");

  // CSV import
  const csvRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tasksRes, timeRes] = await Promise.all([
        tasksApi.list(),
        tasksApi.getTime(),
      ]);
      const tasks: any[] = tasksRes.data || [];
      const mine = tasks.filter((t: any) =>
        t.assigneeId === user?.id || t.assignee?.id === user?.id
      );
      setMyTasks(mine);
      setAllTasks(tasks);
      setTimeEntries(timeRes.data || []);
    } catch {
      toast("Failed to load", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (taskId: string, status: string, note?: string) => {
    setUpdatingId(taskId);
    try {
      await tasksApi.updateStatus(taskId, { status, note });
      setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      toast(
        status === "DONE" ? "Task completed!" :
        status === "BLOCKED" ? "Marked as blocked" :
        status === "REVIEW" ? "Sent for review" :
        "Status updated",
        status === "BLOCKED" ? "error" : "success"
      );
      setUpdateModal(null);
      setUpdateNote("");
    } catch {
      toast("Update failed", "error");
    }
    setUpdatingId(null);
  };

  const logTime = async () => {
    if (!timeForm.taskId || !timeForm.hours) return;
    setLoggingTime(true);
    try {
      await tasksApi.logTime({
        taskId: timeForm.taskId,
        hours: parseFloat(timeForm.hours),
        description: timeForm.description,
      });
      toast("Time logged!", "success");
      setTimeForm({ taskId: "", hours: "", description: "" });
      load();
    } catch {
      toast("Failed", "error");
    }
    setLoggingTime(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = (ev.target?.result as string)
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
      });
      setImporting(true);
      try {
        const res = await tasksApi.importTasks(rows);
        toast(`Imported ${res.data.imported} tasks — distributed to ${res.data.distributed} developers`, "success");
        load();
      } catch { toast("Import failed", "error"); }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = "title,description,priority,dueDate\nFix login bug,Users can't log in on mobile,HIGH,2026-04-01\nAdd dark mode,Implement dark mode toggle,MEDIUM,";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "tasks_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const done       = myTasks.filter(t => t.status === "DONE").length;
  const inProgress = myTasks.filter(t => t.status === "IN_PROGRESS").length;
  const blocked    = myTasks.filter(t => t.status === "BLOCKED").length;
  const todo       = myTasks.filter(t => t.status === "TODO").length;
  const progress   = myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0;
  const myTime     = timeEntries.filter((e: any) => !user?.id || e.userId === user.id || e.user?.id === user.id);
  const totalHours = myTime.reduce((s: number, e: any) => s + (e.hours || 0), 0);

  // Leaderboard: group by assignee
  const devMap: Record<string, { name: string; done: number; inProgress: number; tasks: number }> = {};
  allTasks.forEach((t: any) => {
    const name = t.assignee?.name || "Unassigned";
    if (!devMap[name]) devMap[name] = { name, done: 0, inProgress: 0, tasks: 0 };
    devMap[name].tasks++;
    if (t.status === "DONE") devMap[name].done++;
    if (t.status === "IN_PROGRESS") devMap[name].inProgress++;
  });
  const leaderboard = Object.values(devMap).sort((a, b) => b.done - a.done);

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
          <h1 className="text-xl font-bold text-white">Developer Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Your daily task queue</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
              tab === t ? "bg-zinc-700 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
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
              { label: "My Tasks",    value: myTasks.length, color: "text-white" },
              { label: "To Do",       value: todo,           color: "text-zinc-400" },
              { label: "In Progress", value: inProgress,     color: "text-blue-400" },
              { label: "In Review",   value: myTasks.filter(t => t.status === "REVIEW").length, color: "text-violet-400" },
              { label: "Done",        value: done,           color: "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">Task Progress</span>
              <span className="text-xs font-black text-white">{progress}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">{done} of {myTasks.length} tasks completed</p>
          </div>

          {/* Blocked warning */}
          {blocked > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300 font-semibold">
                {blocked} blocked task{blocked > 1 ? "s" : ""} — needs attention
              </p>
            </div>
          )}

          {/* Task cards */}
          {myTasks.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Code2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No tasks assigned to you</p>
              <p className="text-xs mt-1">Ask your manager to assign tasks from the Task Board</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {[...myTasks].sort((a, b) => {
                const order: Record<string, number> = { BLOCKED: 0, IN_PROGRESS: 1, REVIEW: 2, TODO: 3, DONE: 4 };
                const pa: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
                return (pa[a.priority] ?? 2) - (pa[b.priority] ?? 2);
              }).map(task => (
                <DevTaskCard
                  key={task.id}
                  task={task}
                  onAction={(t, action) => {
                    if (["BLOCKED", "DONE", "REVIEW"].includes(action)) {
                      setUpdateModal({ task: t, action });
                      setUpdateNote("");
                    } else {
                      updateStatus(t.id, action);
                    }
                  }}
                  updating={updatingId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL TASKS ── */}
      {tab === "All Tasks" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">{myTasks.length} tasks assigned to you</p>
          {myTasks.map(task => (
            <div key={task.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", PRIORITY_DOT[task.priority] || "bg-zinc-600")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                <p className="text-xs text-zinc-500">{task.project?.name} · {task.priority}</p>
              </div>
              {task.dueDate && (
                <p className="text-[10px] text-amber-500 flex-shrink-0">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0", STATUS_COLORS[task.status])}>
                {task.status?.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── LOG TIME ── */}
      {tab === "Log Time" && (
        <div className="space-y-5">
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-white">Log Work Time</p>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Task</label>
              <select
                value={timeForm.taskId}
                onChange={e => setTimeForm(p => ({ ...p, taskId: e.target.value }))}
                className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                <option value="">Select task...</option>
                {myTasks.filter(t => t.status !== "DONE").map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Hours</label>
                <input
                  type="number" step="0.25" min="0.25"
                  value={timeForm.hours}
                  onChange={e => setTimeForm(p => ({ ...p, hours: e.target.value }))}
                  placeholder="2.5"
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Note</label>
                <input
                  type="text"
                  value={timeForm.description}
                  onChange={e => setTimeForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What did you build?"
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <button
              onClick={logTime}
              disabled={loggingTime || !timeForm.taskId || !timeForm.hours}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {loggingTime ? <Loader2 size={13} className="animate-spin" /> : <Timer size={13} />}
              Log Time
            </button>
          </div>

          {/* History */}
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Time History · <span className="text-white">{totalHours.toFixed(1)}h total</span>
            </p>
            {myTime.length === 0 ? (
              <p className="text-xs text-zinc-600">No time logged yet</p>
            ) : myTime.map((e: any) => (
              <div key={e.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{e.task?.title || "Task"}</p>
                  {e.description && <p className="text-xs text-zinc-500">{e.description}</p>}
                </div>
                <p className="text-sm font-black text-blue-400">{e.hours}h</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === "Leaderboard" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Dev Team Performance</p>
          {leaderboard.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Award size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tasks yet</p>
            </div>
          ) : leaderboard.map((dev, i) => (
            <div key={dev.name} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0",
                i === 0 ? "bg-amber-400 text-black" :
                i === 1 ? "bg-zinc-400 text-black" :
                i === 2 ? "bg-amber-700 text-white" :
                "bg-zinc-800 text-zinc-400"
              )}>
                {i + 1}
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                {dev.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{dev.name}</p>
                <p className="text-xs text-zinc-500">{dev.tasks} tasks · {dev.inProgress} in progress</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-400">{dev.done}</p>
                <p className="text-[10px] text-zinc-600">done</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── IMPORT CSV ── */}
      {tab === "Import CSV" && (
        <div className="space-y-5">
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-bold text-white">Import Tasks from CSV</p>
                <p className="text-xs text-zinc-500 mt-0.5">Tasks auto-distributed round-robin across all developers in your org</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
                >
                  <Download size={12} /> Template
                </button>
                <button
                  onClick={() => csvRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  {importing ? "Importing..." : "Import CSV"}
                </button>
                <input ref={csvRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { col: "title", note: "Task name", req: true },
                { col: "description", note: "Details", req: false },
                { col: "priority", note: "HIGH / MEDIUM / LOW", req: false },
                { col: "dueDate", note: "YYYY-MM-DD", req: false },
              ].map(c => (
                <div key={c.col} className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-xs font-bold text-white font-mono">{c.col}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{c.note}</p>
                  {c.req && <span className="text-[10px] text-rose-400 font-bold">required</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STATUS UPDATE MODAL ── */}
      <AnimatePresence>
        {updateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setUpdateModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <p className="text-base font-bold text-white mb-1">{updateModal.task?.title}</p>
              <p className="text-xs text-zinc-500 mb-5">
                {updateModal.action === "DONE" && "Confirm this task is fully complete"}
                {updateModal.action === "REVIEW" && "Send this task for code/QA review"}
                {updateModal.action === "BLOCKED" && "Describe what is blocking you"}
              </p>

              <div className="mb-5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {updateModal.action === "BLOCKED" ? "Blocker Description *" : "Notes (optional)"}
                </label>
                <textarea
                  value={updateNote}
                  onChange={e => setUpdateNote(e.target.value)}
                  placeholder={
                    updateModal.action === "BLOCKED" ? "What is blocking you?" :
                    updateModal.action === "DONE" ? "What was delivered?" :
                    "Any notes for the reviewer?"
                  }
                  rows={3}
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setUpdateModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStatus(updateModal.task.id, updateModal.action, updateNote)}
                  disabled={updatingId === updateModal.task.id || (updateModal.action === "BLOCKED" && !updateNote.trim())}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50",
                    updateModal.action === "BLOCKED" ? "bg-rose-600 hover:bg-rose-500" :
                    updateModal.action === "DONE" ? "bg-emerald-600 hover:bg-emerald-500" :
                    "bg-violet-600 hover:bg-violet-500"
                  )}
                >
                  {updatingId === updateModal.task.id
                    ? "Updating..."
                    : updateModal.action === "DONE" ? "Complete Task"
                    : updateModal.action === "REVIEW" ? "Send for Review"
                    : "Report Blocker"
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TASK CARD ──────────────────────────────────────────────────

function DevTaskCard({ task, onAction, updating }: {
  task: any;
  onAction: (task: any, action: string) => void;
  updating: boolean;
}) {
  const isBlocked = task.status === "BLOCKED";
  const isDone    = task.status === "DONE";

  return (
    <motion.div
      layout
      className={cn(
        "bg-zinc-900/60 border rounded-xl p-4 transition-all",
        isBlocked ? "border-rose-500/40 bg-rose-500/5" :
        isDone    ? "border-zinc-800/30 opacity-55" :
        task.status === "IN_PROGRESS" ? "border-blue-500/30 bg-blue-500/5" :
        task.status === "REVIEW" ? "border-violet-500/30 bg-violet-500/5" :
        "border-zinc-800/60 hover:border-zinc-700/60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", PRIORITY_DOT[task.priority] || "bg-zinc-600")} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white leading-snug">{task.title}</p>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0", STATUS_COLORS[task.status])}>
              {task.status?.replace(/_/g, " ")}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.project?.name && (
              <span className="text-[10px] text-zinc-600">{task.project.name}</span>
            )}
            {task.priority && (
              <span className="text-[10px] text-zinc-600 font-semibold">{task.priority}</span>
            )}
            {task.dueDate && (
              <span className="text-[10px] text-amber-500">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {isDone && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
      </div>

      {/* Action buttons */}
      {!isDone && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {ACTIONS.filter(a => {
            if (isBlocked) return a.key === "IN_PROGRESS";
            if (task.status === "IN_PROGRESS") return ["REVIEW", "DONE", "BLOCKED"].includes(a.key);
            if (task.status === "REVIEW") return ["DONE", "BLOCKED"].includes(a.key);
            return a.key !== "REVIEW" && a.key !== "DONE" || task.status !== "TODO";
          }).map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => onAction(task, action.key)}
                disabled={updating}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50",
                  action.color, action.text
                )}
              >
                {updating ? <Loader2 size={10} className="animate-spin" /> : <Icon size={10} />}
                {isBlocked && action.key === "IN_PROGRESS" ? "Unblock" : action.label}
              </button>
            );
          })}

          {/* TODO tasks: just show Start */}
          {task.status === "TODO" && (
            <button
              onClick={() => onAction(task, "IN_PROGRESS")}
              disabled={updating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all disabled:opacity-50"
            >
              <Play size={10} /> Start
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
