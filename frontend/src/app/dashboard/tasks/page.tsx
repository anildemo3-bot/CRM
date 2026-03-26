"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Search, Clock, AlertTriangle, Users,
  BarChart3, CheckSquare, Timer, Trash2, ChevronDown,
  Calendar, Loader2, Play, Square, Activity,
  Circle, CheckCircle2, ArrowRight, AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi, projectsApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type View = "board" | "list" | "workload";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  projectId?: string;
  assigneeId?: string;
  assignee?: { id: string; name: string };
  creator?: { id: string; name: string };
  dueDate?: string;
  notes?: any[];
  timeEntries?: any[];
  project?: { id: string; name: string };
}

interface Member { id: string; name: string; email: string; role: string; }
interface Project { id: string; name: string; status: string; }

const COLUMNS: { key: TaskStatus; label: string; color: string; dot: string }[] = [
  { key: "TODO", label: "To Do", color: "border-zinc-700", dot: "bg-zinc-500" },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-blue-500/30", dot: "bg-blue-500" },
  { key: "REVIEW", label: "Review", color: "border-amber-500/30", dot: "bg-amber-500" },
  { key: "DONE", label: "Done", color: "border-emerald-500/30", dot: "bg-emerald-500" },
];

const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  MEDIUM: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  HIGH: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  URGENT: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const PRIORITY_ICON: Record<Priority, string> = {
  LOW: "↓", MEDIUM: "→", HIGH: "↑", URGENT: "⚡",
};

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<View>("board");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Task modal
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM" as Priority,
    status: "TODO" as TaskStatus, projectId: "", assigneeId: "", dueDate: "",
  });

  // Time tracking
  const [timers, setTimers] = useState<Record<string, { running: boolean; seconds: number; interval?: any }>>({});
  const [showTimeLog, setShowTimeLog] = useState<string | null>(null);
  const [timeNote, setTimeNote] = useState("");
  const [timeDuration, setTimeDuration] = useState(30);

  // Checklist note input per task
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Drag-and-drop
  const dragTask = useRef<string | null>(null);

  useEffect(() => {
    Promise.all([
      tasksApi.list().catch(() => ({ data: [] })),
      projectsApi.members?.().catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
      projectsApi.list().catch(() => ({ data: [] })),
    ]).then(([tRes, mRes, pRes]) => {
      if (tRes.data?.length) setTasks(tRes.data);
      if (mRes.data?.length) setMembers(mRes.data);
      if (pRes.data?.length) setProjects(pRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    if (q && !t.title.toLowerCase().includes(q)) return false;
    if (filterAssignee && t.assigneeId !== filterAssignee) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  // ─── CRUD ─────────────────────────────────────────────────────

  const openCreate = () => {
    setSelectedTask(null);
    setForm({ title: "", description: "", priority: "MEDIUM", status: "TODO", projectId: "", assigneeId: "", dueDate: "" });
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setSelectedTask(t);
    setForm({
      title: t.title, description: t.description || "",
      priority: t.priority, status: t.status,
      projectId: t.projectId || "", assigneeId: t.assigneeId || "",
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const saveTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (selectedTask) {
        const res = await tasksApi.updateStatus(selectedTask.id, form);
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...res.data } : t));
        toast("Task updated", "success");
      } else {
        const res = await tasksApi.create(form);
        setTasks(prev => [res.data, ...prev]);
        toast("Task created", "success");
      }
      setShowModal(false);
    } catch {
      toast("Failed to save task", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksApi.delete?.(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast("Task deleted", "success");
    } catch {
      toast("Delete failed", "error");
    }
  };

  const moveTask = async (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      await tasksApi.updateStatus(taskId, { status });
    } catch {
      toast("Failed to move task", "error");
    }
  };

  // ─── TIME TRACKING ────────────────────────────────────────────

  const startTimer = (taskId: string) => {
    if (timers[taskId]?.running) return;
    const interval = setInterval(() => {
      setTimers(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], seconds: (prev[taskId]?.seconds || 0) + 1 },
      }));
    }, 1000);
    setTimers(prev => ({ ...prev, [taskId]: { running: true, seconds: prev[taskId]?.seconds || 0, interval } }));
  };

  const stopTimer = (taskId: string) => {
    if (timers[taskId]?.interval) clearInterval(timers[taskId].interval);
    setTimers(prev => ({ ...prev, [taskId]: { ...prev[taskId], running: false, interval: undefined } }));
    setTimeDuration(Math.ceil((timers[taskId]?.seconds || 0) / 60));
    setShowTimeLog(taskId);
  };

  const logTime = async (taskId: string) => {
    try {
      await tasksApi.logTime?.({ taskId, duration: timeDuration, note: timeNote });
      toast(`Logged ${timeDuration}min`, "success");
      setTimers(prev => ({ ...prev, [taskId]: { running: false, seconds: 0 } }));
      setShowTimeLog(null);
      setTimeNote("");
      setTimeDuration(30);
    } catch {
      toast("Failed to log time", "error");
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── CHECKLIST ────────────────────────────────────────────────

  const addNote = async (taskId: string) => {
    const content = noteInput[taskId]?.trim();
    if (!content) return;
    try {
      const res = await tasksApi.addNote?.(taskId, content);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, notes: [...(t.notes || []), res.data] } : t));
      setNoteInput(prev => ({ ...prev, [taskId]: "" }));
    } catch {
      toast("Failed to add note", "error");
    }
  };

  const deleteNote = async (taskId: string, noteId: string) => {
    try {
      await tasksApi.deleteNote?.(noteId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, notes: t.notes?.filter(n => n.id !== noteId) } : t));
    } catch {}
  };

  // ─── DRAG & DROP ─────────────────────────────────────────────

  const onDragStart = (taskId: string) => { dragTask.current = taskId; };
  const onDrop = (status: TaskStatus) => {
    if (dragTask.current) moveTask(dragTask.current, status);
    dragTask.current = null;
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  // ─── WORKLOAD ─────────────────────────────────────────────────

  const workload = members.map(m => {
    const myTasks = tasks.filter(t => t.assigneeId === m.id && t.status !== "DONE");
    const overdue = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
    const urgent = myTasks.filter(t => t.priority === "URGENT").length;
    return { ...m, activeTasks: myTasks.length, overdue, urgent, tasks: myTasks };
  });

  // ─── STATS ────────────────────────────────────────────────────

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "TODO").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    review: tasks.filter(t => t.status === "REVIEW").length,
    done: tasks.filter(t => t.status === "DONE").length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE").length,
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isExpanded = expandedTask === task.id;
    const timer = timers[task.id];
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

    return (
      <motion.div
        layout
        draggable
        onDragStart={() => onDragStart(task.id)}
        className={cn(
          "bg-zinc-800/60 border rounded-lg p-3 cursor-grab active:cursor-grabbing group",
          isOverdue ? "border-rose-500/30" : "border-zinc-700/50",
          "hover:border-zinc-600 transition-colors"
        )}
      >
        <div className="flex items-start gap-2 mb-2">
          <button
            onClick={() => moveTask(task.id, task.status === "DONE" ? "TODO" : "DONE")}
            className="mt-0.5 flex-shrink-0"
          >
            {task.status === "DONE"
              ? <CheckCircle2 size={16} className="text-emerald-500" />
              : <Circle size={16} className="text-zinc-600 hover:text-zinc-400" />}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={cn("text-sm font-medium leading-snug cursor-pointer hover:text-white",
                task.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-200"
              )}
              onClick={() => openEdit(task)}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{task.description}</p>
            )}
          </div>
          <button
            onClick={() => deleteTask(task.id)}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", PRIORITY_STYLE[task.priority])}>
            {PRIORITY_ICON[task.priority]} {task.priority}
          </span>
          {task.assignee && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400">
              {task.assignee.name.split(" ")[0]}
            </span>
          )}
          {isOverdue && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1">
              <AlertTriangle size={10} /> Overdue
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={cn("text-xs flex items-center gap-1", isOverdue ? "text-rose-400" : "text-zinc-500")}>
                <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.notes && task.notes.length > 0 && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <CheckSquare size={10} /> {task.notes.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {timer?.running ? (
              <button onClick={() => stopTimer(task.id)} className="text-xs text-emerald-400 flex items-center gap-1">
                <Square size={10} /> {fmt(timer.seconds)}
              </button>
            ) : (
              <button
                onClick={() => startTimer(task.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-emerald-400 transition-all"
              >
                <Play size={12} />
              </button>
            )}
            <button
              onClick={() => setExpandedTask(isExpanded ? null : task.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300"
            >
              <AlignLeft size={12} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 pt-2 border-t border-zinc-700/50"
            >
              {/* Checklist */}
              <p className="text-xs text-zinc-500 mb-1.5 font-medium">Checklist</p>
              <div className="space-y-1 mb-2">
                {(task.notes || []).map(note => (
                  <div key={note.id} className="flex items-center gap-2 group/note">
                    <CheckCircle2 size={12} className="text-zinc-500 flex-shrink-0" />
                    <span className="text-xs text-zinc-400 flex-1">{note.content}</span>
                    <button
                      onClick={() => deleteNote(task.id, note.id)}
                      className="opacity-0 group-hover/note:opacity-100 text-zinc-600 hover:text-rose-400"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={noteInput[task.id] || ""}
                  onChange={e => setNoteInput(p => ({ ...p, [task.id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addNote(task.id)}
                  placeholder="Add checklist item..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder-zinc-600 outline-none"
                />
                <button
                  onClick={() => addNote(task.id)}
                  className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-300"
                >
                  +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold">Task Board</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Developer task control & project management</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3 px-6 py-3 border-b border-zinc-800">
        {[
          { label: "Total", val: stats.total, color: "text-zinc-300" },
          { label: "To Do", val: stats.todo, color: "text-zinc-400" },
          { label: "In Progress", val: stats.inProgress, color: "text-blue-400" },
          { label: "Review", val: stats.review, color: "text-amber-400" },
          { label: "Done", val: stats.done, color: "text-emerald-400" },
          { label: "Overdue", val: stats.overdue, color: "text-rose-400" },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 rounded-lg px-3 py-2 text-center">
            <div className={cn("text-xl font-bold", s.color)}>{s.val}</div>
            <div className="text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-800">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-300 placeholder-zinc-500 outline-none focus:border-zinc-500"
          />
        </div>
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none"
        >
          <option value="">All Members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none"
        >
          <option value="">All Priorities</option>
          {["URGENT", "HIGH", "MEDIUM", "LOW"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
          {(["board", "list", "workload"] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-sm capitalize transition-colors",
                view === v ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {v === "board" ? "Kanban" : v === "list" ? "List" : "Workload"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-500" size={24} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-6 py-4">

          {/* Kanban Board */}
          {view === "board" && (
            <div className="grid grid-cols-4 gap-4 min-h-full">
              {COLUMNS.map(col => {
                const colTasks = filtered.filter(t => t.status === col.key);
                return (
                  <div
                    key={col.key}
                    className={cn("flex flex-col rounded-xl border bg-zinc-900/50 p-3", col.color)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(col.key)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", col.dot)} />
                        <span className="text-sm font-medium text-zinc-300">{col.label}</span>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {colTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setForm(f => ({ ...f, status: col.key }));
                          openCreate();
                        }}
                        className="text-zinc-600 hover:text-zinc-400"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {colTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-16 border border-dashed border-zinc-700/50 rounded-lg">
                          <p className="text-xs text-zinc-600">Drop tasks here</p>
                        </div>
                      ) : (
                        colTasks.map(task => <TaskCard key={task.id} task={task} />)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {view === "list" && (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-zinc-500 font-medium uppercase tracking-wide">
                <span className="col-span-4">Task</span>
                <span className="col-span-2">Assignee</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-1">Priority</span>
                <span className="col-span-2">Due Date</span>
                <span className="col-span-1">Time</span>
              </div>
              {filtered.map(task => {
                const timer = timers[task.id];
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
                return (
                  <motion.div
                    key={task.id}
                    layout
                    className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group items-center"
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <button onClick={() => moveTask(task.id, task.status === "DONE" ? "TODO" : "DONE")}>
                        {task.status === "DONE"
                          ? <CheckCircle2 size={16} className="text-emerald-500" />
                          : <Circle size={16} className="text-zinc-600" />}
                      </button>
                      <span
                        className={cn("text-sm cursor-pointer hover:text-white",
                          task.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-200"
                        )}
                        onClick={() => openEdit(task)}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-zinc-400">
                      {task.assignee?.name || "—"}
                    </div>
                    <div className="col-span-2">
                      <select
                        value={task.status}
                        onChange={e => moveTask(task.id, e.target.value as TaskStatus)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      >
                        {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded border", PRIORITY_STYLE[task.priority])}>
                        {task.priority}
                      </span>
                    </div>
                    <div className={cn("col-span-2 text-xs flex items-center gap-1", isOverdue ? "text-rose-400" : "text-zinc-500")}>
                      {task.dueDate ? <><Calendar size={10} />{new Date(task.dueDate).toLocaleDateString()}</> : "—"}
                    </div>
                    <div className="col-span-1 flex items-center gap-1">
                      {timer?.running ? (
                        <button onClick={() => stopTimer(task.id)} className="text-emerald-400 text-xs flex items-center gap-1">
                          <Square size={10} />{fmt(timer.seconds)}
                        </button>
                      ) : (
                        <button onClick={() => startTimer(task.id)} className="text-zinc-600 hover:text-emerald-400">
                          <Play size={12} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Workload View */}
          {view === "workload" && (
            <div className="space-y-4">
              {workload.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No team members found. Members appear after tasks are assigned.</p>
                </div>
              ) : (
                workload.map(m => (
                  <div key={m.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
                          {m.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-zinc-500">{m.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className={cn("font-bold text-lg",
                            m.activeTasks > 8 ? "text-rose-400" : m.activeTasks < 2 ? "text-zinc-500" : "text-emerald-400"
                          )}>
                            {m.activeTasks}
                          </div>
                          <div className="text-xs text-zinc-500">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg text-amber-400">{m.urgent}</div>
                          <div className="text-xs text-zinc-500">Urgent</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg text-rose-400">{m.overdue}</div>
                          <div className="text-xs text-zinc-500">Overdue</div>
                        </div>
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                          m.activeTasks > 8 ? "bg-rose-500/20 text-rose-400" :
                          m.activeTasks < 2 ? "bg-zinc-700 text-zinc-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {m.activeTasks > 8 ? "Overloaded" : m.activeTasks < 2 ? "Idle" : "Normal"}
                        </span>
                      </div>
                    </div>
                    {/* Workload bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
                      <div
                        className={cn("h-2 rounded-full transition-all",
                          m.activeTasks > 8 ? "bg-rose-500" : m.activeTasks > 4 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min((m.activeTasks / 10) * 100, 100)}%` }}
                      />
                    </div>
                    {/* Task mini-list */}
                    {m.tasks.slice(0, 3).map(t => (
                      <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full",
                            t.priority === "URGENT" ? "bg-rose-500" :
                            t.priority === "HIGH" ? "bg-amber-500" :
                            t.priority === "MEDIUM" ? "bg-blue-500" : "bg-zinc-500"
                          )} />
                          <span className="text-sm text-zinc-300">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.dueDate && (
                            <span className={cn("text-xs",
                              new Date(t.dueDate) < new Date() ? "text-rose-400" : "text-zinc-500"
                            )}>
                              {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-xs text-zinc-600">
                            {COLUMNS.find(c => c.key === t.status)?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                    {m.tasks.length > 3 && (
                      <p className="text-xs text-zinc-500 mt-2">+{m.tasks.length - 3} more tasks</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Time Log Modal */}
      <AnimatePresence>
        {showTimeLog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-sm"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Timer size={18} className="text-emerald-400" /> Log Time
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Duration (minutes)</label>
                  <input
                    type="number"
                    value={timeDuration}
                    onChange={e => setTimeDuration(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Note (optional)</label>
                  <input
                    value={timeNote}
                    onChange={e => setTimeNote(e.target.value)}
                    placeholder="What did you work on?"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => logTime(showTimeLog)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Log Time
                </button>
                <button
                  onClick={() => setShowTimeLog(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg py-2 text-sm text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{selectedTask ? "Edit Task" : "New Task"}</h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Task title *"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                />
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Priority</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      {["URGENT", "HIGH", "MEDIUM", "LOW"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Assignee</label>
                    <select
                      value={form.assigneeId}
                      onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Project</label>
                    <select
                      value={form.projectId}
                      onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      <option value="">No project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveTask}
                  disabled={saving || !form.title.trim()}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {selectedTask ? "Update" : "Create Task"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg py-2 text-sm text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
