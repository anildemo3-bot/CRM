"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, MoreHorizontal, Search, Calendar, Tag, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { tasksApi } from "@/lib/endpoints";

interface Task {
  id: string;
  title: string;
  project?: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  due?: string;
  assignee?: string;
}

const SEED_TASKS: Task[] = [
  { id: "1", title: "Design hi-fi wireframes", project: "Client Portal v2", priority: "High", status: "In Progress", due: "2024-03-25", assignee: "Sarah J." },
  { id: "2", title: "Integrate Stripe webhooks", project: "API Suite", priority: "Critical", status: "To Do", due: "2024-03-24", assignee: "Mike R." },
  { id: "3", title: "Setup marketing sequences", project: "Q3 Launch", priority: "Medium", status: "Done", due: "2024-03-20", assignee: "Sarah J." },
  { id: "4", title: "Update legal docs", project: "Internal", priority: "Low", status: "To Do", due: "2024-04-01", assignee: "Emma W." },
  { id: "5", title: "Review sprint goals", project: "All Projects", priority: "High", status: "In Progress", due: "2024-03-22", assignee: "Mike R." },
];

const COLUMNS: Task["status"][] = ["To Do", "In Progress", "Done"];

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  High: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Medium: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Low: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [view, setView] = useState<"board" | "list">("board");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", project: "", priority: "Medium" as Task["priority"], status: "To Do" as Task["status"], due: "", assignee: "" });

  useEffect(() => {
    tasksApi.list()
      .then(res => {
        if (res.data?.length) {
          const mapped = res.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            project: t.project?.name ?? "General",
            priority: t.priority === "URGENT" ? "Critical" : (t.priority?.charAt(0) + (t.priority?.slice(1).toLowerCase() ?? "")) || "Medium",
            status: t.status === "TODO" ? "To Do" : t.status === "IN_PROGRESS" ? "In Progress" : t.status === "DONE" ? "Done" : "To Do",
            due: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : undefined,
            assignee: t.assignee?.name ?? "Unassigned",
          }));
          setTasks(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await tasksApi.create({ title: form.title, priority: form.priority.toUpperCase(), status: form.status === "To Do" ? "TODO" : form.status === "In Progress" ? "IN_PROGRESS" : "DONE" });
      const created: Task = res.data ?? { id: `t${Date.now()}`, ...form };
      setTasks(prev => [{ id: created.id, title: form.title, project: form.project, priority: form.priority, status: form.status, due: form.due, assignee: form.assignee }, ...prev]);
      toast("Task created!", "success");
      setShowModal(false);
      setForm({ title: "", project: "", priority: "Medium", status: "To Do", due: "", assignee: "" });
    } catch {
      toast("Failed to create task", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus: Task["status"] = task.status === "Done" ? "To Do" : "Done";
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
      await tasksApi.updateStatus(id, newStatus === "Done" ? "DONE" : "TODO");
    } catch { /* optimistic already applied */ }
  };

  const filtered = tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Task Board</h1>
          <p className="text-zinc-500 mt-1">Manage individual tasks and sprint requirements.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-700 outline-none w-48" />
          </div>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button onClick={() => setView("board")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg transition-all", view === "board" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>Board</button>
            <button onClick={() => setView("list")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg transition-all", view === "list" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>List</button>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Plus size={16} /><span>New Task</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const count = filtered.filter(t => t.status === col).length;
          return (
            <div key={col} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{col}</p>
              <p className="text-2xl font-bold text-white mt-1">{count}</p>
            </div>
          );
        })}
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
        </div>
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[600px]">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter(t => t.status === col);
            return (
              <div key={col} className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", col === "Done" ? "bg-emerald-500" : col === "In Progress" ? "bg-blue-500" : "bg-zinc-600")} />
                    {col}
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-700">{colTasks.length}</span>
                </div>
                <div className="flex-1 bg-zinc-900/20 border border-dashed border-zinc-800/40 rounded-3xl p-3 space-y-3">
                  {colTasks.map((task) => (
                    <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border", PRIORITY_COLORS[task.priority])}>{task.priority}</span>
                        <button onClick={() => toggleDone(task.id)} className="text-zinc-600 hover:text-emerald-400 transition-colors">
                          {task.status === "Done" ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                        </button>
                      </div>
                      <h4 className={cn("text-sm font-semibold leading-snug", task.status === "Done" ? "text-zinc-500 line-through" : "text-zinc-200")}>{task.title}</h4>
                      {task.project && <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1"><Tag size={10} /> {task.project}</p>}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                        {task.due && <div className="flex items-center gap-1.5 text-[10px] text-zinc-500"><Calendar size={12} className="text-zinc-600" /><span>{task.due}</span></div>}
                        {task.assignee && <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500">{task.assignee.split(" ").map(n => n[0]).join("")}</div>}
                      </div>
                    </motion.div>
                  ))}
                  <button onClick={() => { setForm(f => ({ ...f, status: col })); setShowModal(true); }}
                    className="w-full py-3 rounded-2xl border border-dashed border-zinc-800/60 text-[10px] font-black text-zinc-700 hover:text-zinc-500 hover:border-zinc-700 transition-all uppercase tracking-widest">
                    Quick Add +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleDone(t.id)} className="text-zinc-600 hover:text-blue-500 transition-colors">
                        {t.status === "Done" ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                      </button>
                      <span className={cn("text-sm font-medium", t.status === "Done" ? "text-zinc-500 line-through" : "text-white")}>{t.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{t.project}</td>
                  <td className="px-6 py-4">
                    {t.assignee && <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500">{t.assignee.split(" ").map(n => n[0]).join("")}</div>
                      <span className="text-xs text-zinc-300">{t.assignee}</span>
                    </div>}
                  </td>
                  <td className="px-6 py-4"><span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md border", PRIORITY_COLORS[t.priority])}>{t.priority}</span></td>
                  <td className="px-6 py-4 text-xs font-semibold text-white">{t.status}</td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{t.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">New Task</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Task Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Build login flow" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Priority</label>
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Task["priority"] }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Task["status"] }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Project</label>
                    <input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
                      placeholder="Project name" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Due Date</label>
                    <input type="date" value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Assignee</label>
                  <input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                    placeholder="e.g. Sarah J." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.title.trim()}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
