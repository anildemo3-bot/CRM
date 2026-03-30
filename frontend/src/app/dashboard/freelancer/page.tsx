"use client";

import RoleGuard from "@/components/RoleGuard";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, CheckCircle2, Clock, DollarSign, Play, Eye,
  AlertTriangle, Timer, Loader2, RefreshCw, FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi, projectsApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";
import { useAuthStore } from "@/lib/store";

const TABS = ["My Work", "Projects", "Log Time", "Earnings"] as const;
type Tab = typeof TABS[number];

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

const HOURLY_RATE = 25; // default $25/hr

function FreelancerDashboard() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("My Work");

  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [timeForm, setTimeForm] = useState({ taskId: "", hours: "", description: "" });
  const [loggingTime, setLoggingTime] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tasksRes, timeRes, projRes] = await Promise.all([
        tasksApi.list(),
        tasksApi.getTime(),
        projectsApi.list().catch(() => ({ data: [] })),
      ]);
      const tasks: any[] = tasksRes.data || [];
      const mine = tasks.filter((t: any) =>
        t.assigneeId === user?.id || t.assignee?.id === user?.id
      );
      setMyTasks(mine);
      setTimeEntries(timeRes.data || []);
      setProjects(projRes.data || []);
    } catch {
      toast("Failed to load", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (taskId: string, status: string) => {
    setUpdatingId(taskId);
    try {
      await tasksApi.updateStatus(taskId, { status });
      setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      toast(status === "DONE" ? "Task completed!" : "Status updated", status === "BLOCKED" ? "error" : "success");
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

  const done       = myTasks.filter(t => t.status === "DONE").length;
  const inProgress = myTasks.filter(t => t.status === "IN_PROGRESS").length;
  const todo       = myTasks.filter(t => t.status === "TODO").length;
  const blocked    = myTasks.filter(t => t.status === "BLOCKED").length;
  const progress   = myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0;

  const myTime     = timeEntries.filter((e: any) => !user?.id || e.userId === user.id || e.user?.id === user.id);
  const totalHours = myTime.reduce((s: number, e: any) => s + (e.hours || 0), 0);
  const earnings   = totalHours * HOURLY_RATE;

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
          <h1 className="text-xl font-bold text-white">Freelancer Hub</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Your projects, tasks, and earnings</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Tasks",    value: myTasks.length,    color: "text-white" },
          { label: "In Progress", value: inProgress,        color: "text-blue-400" },
          { label: "Completed",   value: done,              color: "text-emerald-400" },
          { label: "Hours Logged",value: totalHours.toFixed(1) + "h", color: "text-amber-400" },
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

      {/* ── MY WORK ── */}
      {tab === "My Work" && (
        <div className="space-y-5">
          {/* Progress bar */}
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">Overall Progress</span>
              <span className="text-xs font-black text-white">{progress}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">{done} of {myTasks.length} tasks done</p>
          </div>

          {blocked > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300 font-semibold">
                {blocked} blocked task{blocked > 1 ? "s" : ""} — needs attention
              </p>
            </div>
          )}

          {myTasks.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No tasks assigned yet</p>
              <p className="text-xs mt-1">Your manager will assign tasks to you</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {[...myTasks].sort((a, b) => {
                const order: Record<string, number> = { BLOCKED: 0, IN_PROGRESS: 1, REVIEW: 2, TODO: 3, DONE: 4 };
                return (order[a.status] ?? 5) - (order[b.status] ?? 5);
              }).map(task => (
                <div
                  key={task.id}
                  className={cn(
                    "bg-zinc-900/60 border rounded-xl p-4 transition-all",
                    task.status === "BLOCKED"     ? "border-rose-500/40 bg-rose-500/5" :
                    task.status === "IN_PROGRESS" ? "border-blue-500/30 bg-blue-500/5" :
                    task.status === "DONE"        ? "border-zinc-800/30 opacity-55" :
                    "border-zinc-800/60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", PRIORITY_DOT[task.priority] || "bg-zinc-600")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{task.title}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_COLORS[task.status])}>
                          {task.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {task.project?.name && <span className="text-[10px] text-zinc-600">{task.project.name}</span>}
                        {task.dueDate && (
                          <span className="text-[10px] text-amber-500">Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {task.status === "DONE" && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
                  </div>

                  {task.status !== "DONE" && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {task.status === "TODO" && (
                        <button
                          onClick={() => updateStatus(task.id, "IN_PROGRESS")}
                          disabled={updatingId === task.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all disabled:opacity-50"
                        >
                          {updatingId === task.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                          Start
                        </button>
                      )}
                      {task.status === "IN_PROGRESS" && (
                        <>
                          <button
                            onClick={() => updateStatus(task.id, "REVIEW")}
                            disabled={updatingId === task.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            <Eye size={10} /> Send for Review
                          </button>
                          <button
                            onClick={() => updateStatus(task.id, "DONE")}
                            disabled={updatingId === task.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 size={10} /> Done
                          </button>
                        </>
                      )}
                      {task.status === "REVIEW" && (
                        <button
                          onClick={() => updateStatus(task.id, "DONE")}
                          disabled={updatingId === task.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 size={10} /> Mark Done
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROJECTS ── */}
      {tab === "Projects" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">{projects.length} active projects</p>
          {projects.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <FolderKanban size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No projects yet</p>
            </div>
          ) : projects.map((p: any) => (
            <div key={p.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                {p.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{p.name}</p>
                {p.description && <p className="text-xs text-zinc-500 truncate">{p.description}</p>}
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                p.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                p.status === "ON_HOLD" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
              )}>
                {p.status || "ACTIVE"}
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
                  placeholder="What did you work on?"
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
            </div>
            <button
              onClick={logTime}
              disabled={loggingTime || !timeForm.taskId || !timeForm.hours}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {loggingTime ? <Loader2 size={13} className="animate-spin" /> : <Timer size={13} />}
              Log Time
            </button>
          </div>

          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Time History · <span className="text-white">{totalHours.toFixed(1)}h total</span>
            </p>
            {myTime.length === 0 ? (
              <p className="text-xs text-zinc-600">No time logged yet</p>
            ) : myTime.map((e: any) => (
              <div key={e.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{e.task?.title || "Task"}</p>
                  {e.description && <p className="text-xs text-zinc-500">{e.description}</p>}
                </div>
                <p className="text-sm font-black text-amber-400">{e.hours}h</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EARNINGS ── */}
      {tab === "Earnings" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Hours", value: totalHours.toFixed(1) + "h", icon: Clock, color: "text-blue-400", gradient: "from-blue-500 to-cyan-500" },
              { label: "Hourly Rate", value: `$${HOURLY_RATE}/hr`, icon: DollarSign, color: "text-amber-400", gradient: "from-amber-500 to-orange-500" },
              { label: "Est. Earnings", value: `$${earnings.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5"
              >
                <div className={cn("p-2 rounded-xl bg-gradient-to-br w-fit mb-3", s.gradient)}>
                  <s.icon size={15} className="text-white" />
                </div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-1">Earnings Breakdown</p>
            <p className="text-xs text-zinc-500 mb-5">Based on logged time × hourly rate</p>
            {myTime.length === 0 ? (
              <p className="text-xs text-zinc-600">No time entries yet — log your work time to see earnings</p>
            ) : myTime.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-white">{e.task?.title || "Task"}</p>
                  <p className="text-[10px] text-zinc-600">{e.hours}h × ${HOURLY_RATE}/hr</p>
                </div>
                <p className="text-sm font-black text-emerald-400">${(e.hours * HOURLY_RATE).toFixed(2)}</p>
              </div>
            ))}
            {myTime.length > 0 && (
              <div className="flex items-center justify-between pt-3 mt-1">
                <p className="text-sm font-bold text-zinc-400">Total</p>
                <p className="text-lg font-black text-emerald-400">${earnings.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FreelancerPage() {
  return (
    <RoleGuard allowedRoles={["FREELANCER"]}>
      <FreelancerDashboard />
    </RoleGuard>
  );
}
