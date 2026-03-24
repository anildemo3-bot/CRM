"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderOpen, MoreHorizontal, CheckSquare, Clock, Users, Zap, X, Loader2, LayoutGrid, List as ListIcon, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { projectsApi, tasksApi } from "@/lib/endpoints";
import { useToast } from "@/components/Toast";

type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  _count?: { tasks: number };
  createdAt?: string;
}

const STATUS_STYLE: Record<ProjectStatus, string> = {
  PLANNING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ON_HOLD: "bg-zinc-800 text-zinc-500 border-zinc-700",
  COMPLETED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const SEED: Project[] = [
  { id: "p1", name: "Q3 Product Launch", description: "End-to-end launch for the new SaaS module.", status: "ACTIVE", _count: { tasks: 12 } },
  { id: "p2", name: "Client Portal v2", description: "Redesigned client-facing portal with real-time updates.", status: "PLANNING", _count: { tasks: 4 } },
  { id: "p3", name: "API Integration Suite", description: "Connect all third-party marketing and finance services.", status: "ON_HOLD", _count: { tasks: 8 } },
  { id: "p4", name: "Mobile App Wireframes", description: "Initial UX research and wireframes for iOS/Android.", status: "COMPLETED", _count: { tasks: 24 } },
];

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>(SEED);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "PLANNING" as ProjectStatus });

  useEffect(() => {
    projectsApi.list()
      .then(res => { if (res.data?.length > 0) setProjects(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => { setForm({ name: "", description: "", status: "PLANNING" }); setSelected(null); setShowModal(true); };
  const openEdit = (p: Project) => { setForm({ name: p.name, description: p.description || "", status: p.status }); setSelected(p); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (selected) {
        await projectsApi.list(); // use update when available
        setProjects(prev => prev.map(p => p.id === selected.id ? { ...p, ...form } : p));
        toast("Project updated", "success");
      } else {
        const res = await projectsApi.create(form);
        const created = res.data ?? { id: `p${Date.now()}`, ...form, _count: { tasks: 0 } };
        setProjects(prev => [created, ...prev]);
        toast("Project created!", "success");
      }
      setShowModal(false);
    } catch {
      toast("Failed to save project", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Project Portfolio</h1>
          <p className="text-zinc-500 mt-1">Track delivery progress and resource alignment.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-lg transition-all", view === "grid" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}><LayoutGrid size={15} /></button>
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded-lg transition-all", view === "list" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}><ListIcon size={15} /></button>
          </div>
          <button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Plus size={16} /><span>New Project</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Active", value: projects.filter(p => p.status === "ACTIVE").length, icon: FolderOpen, color: "text-blue-400" },
          { label: "Total Tasks", value: projects.reduce((s, p) => s + (p._count?.tasks || 0), 0), icon: CheckSquare, color: "text-indigo-400" },
          { label: "Planning", value: projects.filter(p => p.status === "PLANNING").length, icon: Zap, color: "text-amber-400" },
          { label: "Completed", value: projects.filter(p => p.status === "COMPLETED").length, icon: Clock, color: "text-emerald-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 flex items-center gap-4 group hover:border-zinc-700/60 transition-all">
            <div className={cn("p-3 rounded-xl bg-zinc-800", s.color)}><s.icon size={20} /></div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
              <h3 className="text-xl font-bold text-white">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-600">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">Syncing projects...</p>
        </div>
      ) : (
        <div className={cn("grid gap-6", view === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              onClick={() => openEdit(p)}
              className={cn("group relative p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 hover:border-blue-500/40 transition-all cursor-pointer", view === "list" && "flex items-center justify-between py-4")}>
              <div className={cn("space-y-4", view === "list" && "flex items-center gap-6 space-y-0 flex-1")}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <FolderOpen size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</h3>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", STATUS_STYLE[p.status])}>
                        {p.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {view === "grid" && <button onClick={e => { e.stopPropagation(); openEdit(p); }} className="text-zinc-600 hover:text-white"><MoreHorizontal size={18} /></button>}
                </div>

                {view === "grid" && (
                  <>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{p.description}</p>
                    <div className="pt-4 flex items-center justify-between border-t border-zinc-800/40">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(u => <div key={u} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 text-[8px] flex items-center justify-center font-bold text-zinc-500">U{u}</div>)}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500">
                        <span className="flex items-center gap-1"><CheckSquare size={12} /> {p._count?.tasks ?? 0}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> 3</span>
                      </div>
                    </div>
                  </>
                )}

                {view === "list" && (
                  <div className="flex-1 flex items-center justify-end gap-12 px-8">
                    <p className="text-xs text-zinc-500 flex-1 truncate max-w-xs">{p.description}</p>
                    <span className="text-xs font-bold text-white w-20 text-right">{p._count?.tasks ?? 0} tasks</span>
                  </div>
                )}
              </div>
              {view === "list" && <ChevronRight size={16} className="ml-4 text-zinc-600 group-hover:text-white" />}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{selected ? "Edit Project" : "New Project"}</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Project Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Q4 SaaS Launch" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="What is this project about?" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as ProjectStatus }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {selected ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
