"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Clock, CheckCircle2, AlertTriangle, Play, Pause, BarChart3,
  Loader2, Plus, ChevronRight, Timer, Zap, Target, Flag, RefreshCw,
  ArrowRight, Circle, XCircle, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";
import { useAuthStore } from "@/lib/store";

const TABS = ["My Tasks", "Today's Focus", "Log Time", "My Stats"] as const;
type Tab = typeof TABS[number];

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  TODO:        { label: "To Do",      color: "text-zinc-400",   bg: "bg-zinc-500/20 border-zinc-500/30",   icon: Circle },
  IN_PROGRESS: { label: "In Progress",color: "text-blue-400",   bg: "bg-blue-500/20 border-blue-500/30",   icon: Play },
  REVIEW:      { label: "In Review",  color: "text-violet-400", bg: "bg-violet-500/20 border-violet-500/30",icon: Eye },
  DONE:        { label: "Done",       color: "text-emerald-400",bg: "bg-emerald-500/20 border-emerald-500/30",icon: CheckCircle2 },
  BLOCKED:     { label: "Blocked",    color: "text-rose-400",   bg: "bg-rose-500/20 border-rose-500/30",   icon: AlertTriangle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT:  { label: "Urgent",  color: "text-rose-400 bg-rose-500/20 border-rose-500/30" },
  HIGH:    { label: "High",    color: "text-orange-400 bg-orange-500/20 border-orange-500/30" },
  MEDIUM:  { label: "Medium",  color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
  LOW:     { label: "Low",     color: "text-zinc-500 bg-zinc-500/20 border-zinc-500/30" },
};

export default function DeveloperPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("My Tasks");

  const [tasks, setTasks] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Time log form
  const [timeForm, setTimeForm] = useState({ taskId: "", hours: "", description: "" });
  const [loggingTime, setLoggingTime] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tasksRes, timeRes] = await Promise.all([
        tasksApi.list(),
        tasksApi.getTime(),
      ]);
      const allTasks = tasksRes.data || [];
      // Show only tasks assigned to me
      const myTasks = user?.id
        ? allTasks.filter((t: any) => t.assigneeId === user.id || t.assignee?.id === user.id)
        : allTasks;
      setTasks(myTasks);
      setTimeEntries(timeRes.data || []);
    } catch {
      toast("Failed to load tasks", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (taskId: string, status: string) => {
    setUpdatingId(taskId);
    try {
      await tasksApi.updateStatus(taskId, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      toast(`Moved to ${STATUS_CONFIG[status]?.label}`, "success");
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
      await load();
    } catch {
      toast("Failed to log time", "error");
    }
    setLoggingTime(false);
  };

  const myTime = timeEntries.filter((e: any) => !user?.id || e.userId === user.id || e.user?.id === user.id);
  const totalHours = myTime.reduce((s: number, e: any) => s + (e.hours || 0), 0);
  const doneCount = tasks.filter(t => t.status === "DONE").length;
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
  const blockedTasks = tasks.filter(t => t.status === "BLOCKED");
  const todayFocus = tasks.filter(t => ["IN_PROGRESS", "TODO"].includes(t.status) && t.priority !== "LOW");

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
          <p className="text-xs text-zinc-500 mt-0.5">Your tasks, time, and daily focus</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Tasks",    value: tasks.length,            color: "text-white" },
          { label: "In Progress", value: inProgressTasks.length,  color: "text-blue-400" },
          { label: "Blocked",     value: blockedTasks.length,     color: "text-rose-400" },
          { label: "Done",        value: doneCount,               color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
            <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
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

      {/* ── MY TASKS ── */}
      {tab === "My Tasks" && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Code2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No tasks assigned to you yet</p>
            </div>
          ) : STATUS_ORDER.filter(s => tasks.some(t => t.status === s)).map(status => {
            const grouped = tasks.filter(t => t.status === status);
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon size={13} className={cfg.color} />
                  <p className={cn("text-xs font-bold uppercase tracking-widest", cfg.color)}>
                    {cfg.label} <span className="text-zinc-600">({grouped.length})</span>
                  </p>
                </div>
                {grouped.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateStatus}
                    updating={updatingId === task.id}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TODAY'S FOCUS ── */}
      {tab === "Today's Focus" && (
        <div className="space-y-4">
          {blockedTasks.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-2">
                <AlertTriangle size={13} /> {blockedTasks.length} Blocked Task{blockedTasks.length > 1 ? "s" : ""}
              </p>
              {blockedTasks.map(t => (
                <p key={t.id} className="text-xs text-rose-300/70 ml-5">• {t.title}</p>
              ))}
            </div>
          )}

          {inProgressTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Play size={12} /> Currently Working On
              </p>
              {inProgressTasks.map(task => (
                <TaskCard key={task.id} task={task} onStatusChange={updateStatus} updating={updatingId === task.id} />
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Target size={12} /> Up Next (High Priority)
            </p>
            {todayFocus.filter(t => t.status !== "IN_PROGRESS").slice(0, 5).length === 0 ? (
              <p className="text-xs text-zinc-600 ml-4">All high-priority tasks are in progress</p>
            ) : todayFocus.filter(t => t.status !== "IN_PROGRESS").slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={updateStatus} updating={updatingId === task.id} />
            ))}
          </div>
        </div>
      )}

      {/* ── LOG TIME ── */}
      {tab === "Log Time" && (
        <div className="space-y-5">
          {/* Log form */}
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-white">Log Time Entry</p>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Task</label>
              <select
                value={timeForm.taskId}
                onChange={e => setTimeForm(prev => ({ ...prev, taskId: e.target.value }))}
                className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                <option value="">Select a task...</option>
                {tasks.filter(t => t.status !== "DONE").map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Hours</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={timeForm.hours}
                  onChange={e => setTimeForm(prev => ({ ...prev, hours: e.target.value }))}
                  placeholder="e.g. 2.5"
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                <input
                  type="text"
                  value={timeForm.description}
                  onChange={e => setTimeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What did you work on?"
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

          {/* Time history */}
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
              My Time Log · <span className="text-white">{totalHours.toFixed(1)}h total</span>
            </p>
            {myTime.length === 0 ? (
              <p className="text-xs text-zinc-600">No time logged yet</p>
            ) : (
              <div className="space-y-2">
                {myTime.map((e: any) => (
                  <div key={e.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={13} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{e.task?.title || "Task"}</p>
                      {e.description && <p className="text-xs text-zinc-500">{e.description}</p>}
                    </div>
                    <p className="text-sm font-black text-blue-400 flex-shrink-0">{e.hours}h</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MY STATS ── */}
      {tab === "My Stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Tasks",   value: tasks.length,           sub: "assigned to me",   color: "text-white",        icon: Code2 },
              { label: "Completed",     value: doneCount,              sub: "tasks done",        color: "text-emerald-400",  icon: CheckCircle2 },
              { label: "Hours Logged",  value: totalHours.toFixed(1),  sub: "total time logged", color: "text-blue-400",     icon: Clock },
              { label: "Completion",    value: tasks.length ? `${Math.round((doneCount / tasks.length) * 100)}%` : "0%", sub: "task rate", color: "text-violet-400", icon: Target },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{s.label}</p>
                    <Icon size={16} className={cn("opacity-50", s.color)} />
                  </div>
                  <p className={cn("text-3xl font-black", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{s.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Status breakdown */}
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Status Breakdown</p>
            <div className="space-y-3">
              {STATUS_ORDER.map(status => {
                const count = tasks.filter(t => t.status === status).length;
                const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                const cfg = STATUS_CONFIG[status];
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</p>
                      <p className="text-xs text-zinc-500">{count} tasks</p>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className={cn("h-full rounded-full", {
                          "bg-zinc-500": status === "TODO",
                          "bg-blue-500": status === "IN_PROGRESS",
                          "bg-violet-500": status === "REVIEW",
                          "bg-emerald-500": status === "DONE",
                          "bg-rose-500": status === "BLOCKED",
                        })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TASK CARD ──────────────────────────────────────────────────

function TaskCard({ task, onStatusChange, updating }: {
  task: any;
  onStatusChange: (id: string, status: string) => void;
  updating: boolean;
}) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const Icon = cfg.icon;

  const nextStatus: Record<string, string> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "REVIEW",
    REVIEW: "DONE",
    DONE: "DONE",
    BLOCKED: "IN_PROGRESS",
  };

  const nextLabel: Record<string, string> = {
    TODO: "Start",
    IN_PROGRESS: "Send to Review",
    REVIEW: "Mark Done",
    DONE: "Done",
    BLOCKED: "Unblock",
  };

  return (
    <div className={cn(
      "bg-zinc-900/60 border rounded-xl p-4 transition-all",
      task.status === "BLOCKED" ? "border-rose-500/30" :
      task.status === "DONE" ? "border-zinc-800/30 opacity-60" :
      "border-zinc-800/60 hover:border-zinc-700/60"
    )}>
      <div className="flex items-start gap-3">
        <Icon size={15} className={cn("mt-0.5 flex-shrink-0", cfg.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", pCfg.color)}>
              {pCfg.label}
            </span>
            {task.project?.name && (
              <span className="text-[10px] text-zinc-600">{task.project.name}</span>
            )}
            {task.dueDate && (
              <span className="text-[10px] text-amber-500">Due {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Next action button */}
        {task.status !== "DONE" && (
          <button
            onClick={() => onStatusChange(task.id, nextStatus[task.status])}
            disabled={updating}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex-shrink-0 disabled:opacity-50",
              task.status === "BLOCKED"
                ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            )}
          >
            {updating ? <Loader2 size={10} className="animate-spin" /> : <ArrowRight size={10} />}
            {nextLabel[task.status]}
          </button>
        )}
      </div>

      {/* Mark blocked button */}
      {["TODO", "IN_PROGRESS"].includes(task.status) && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => onStatusChange(task.id, "BLOCKED")}
            disabled={updating}
            className="text-[10px] text-zinc-700 hover:text-rose-400 transition-colors"
          >
            Mark Blocked
          </button>
        </div>
      )}
    </div>
  );
}
