"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Search, Copy, CheckCheck, FileText, Bookmark, Star, ChevronDown, MoreHorizontal, Trash2, X, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { knowledgeApi } from "@/lib/endpoints";

type KbTab = "scripts" | "playbooks" | "templates";

const CATEGORY_STYLE: Record<string, string> = {
  Outreach: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Sales: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Delivery: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Retention: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Legal: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  Internal: "text-zinc-400 bg-zinc-400/10 border-zinc-700",
};

const PERF_COLORS: Record<string, string> = {
  Top: "text-emerald-400",
  High: "text-blue-400",
  Med: "text-amber-400",
  Low: "text-zinc-500",
};

export default function KnowledgePage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<KbTab>("scripts");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [scripts, setScripts] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Outreach", content: "", tags: "", steps: "5", performance: "High", description: "" });

  useEffect(() => {
    Promise.all([
      knowledgeApi.scripts().then(r => r.data).catch(() => []),
      knowledgeApi.playbooks().then(r => r.data).catch(() => []),
      knowledgeApi.templates().then(r => r.data).catch(() => []),
    ]).then(([s, p, t]) => {
      setScripts(s ?? []);
      setPlaybooks(p ?? []);
      setTemplates(t ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      toast("Copied to clipboard!", "success");
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleDelete = async (id: string, type: KbTab) => {
    try {
      if (type === "scripts") { await knowledgeApi.deleteScript(id); setScripts(p => p.filter(s => s.id !== id)); }
      else if (type === "playbooks") { await knowledgeApi.deletePlaybook(id); setPlaybooks(p => p.filter(pb => pb.id !== id)); }
      else { await knowledgeApi.deleteTemplate(id); setTemplates(p => p.filter(t => t.id !== id)); }
      toast("Deleted successfully", "success");
    } catch {
      toast("Delete failed", "error");
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (tab === "scripts") {
        const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
        const res = await knowledgeApi.createScript({ title: form.title, category: form.category, content: form.content, tags });
        setScripts(p => [res.data, ...p]);
      } else if (tab === "playbooks") {
        const res = await knowledgeApi.createPlaybook({ title: form.title, category: form.category, steps: parseInt(form.steps), performance: form.performance, lastUpdated: new Date().toISOString().split("T")[0] });
        setPlaybooks(p => [res.data, ...p]);
      } else {
        const res = await knowledgeApi.createTemplate({ title: form.title, category: form.category, description: form.description });
        setTemplates(p => [res.data, ...p]);
      }
      toast(`${tab.slice(0, -1)} created!`, "success");
      setShowModal(false);
      setForm({ title: "", category: "Outreach", content: "", tags: "", steps: "5", performance: "High", description: "" });
    } catch {
      toast("Failed to create", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredScripts = scripts.filter(s => !search || s.title?.toLowerCase().includes(search.toLowerCase()));
  const filteredPlaybooks = playbooks.filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()));
  const filteredTemplates = templates.filter(t => !search || t.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SOP Engine</h1>
          <p className="text-zinc-500 mt-1">Standard Operating Procedures, scripts, and playbooks for high-velocity scaling.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(["scripts", "playbooks", "templates"] as KbTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize", tab === t ? "bg-zinc-800 text-white shadow-lg border border-zinc-700/50" : "text-zinc-500 hover:text-zinc-300")}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Plus size={16} /><span>New Asset</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Scripts", value: scripts.length },
          { label: "Playbooks", value: playbooks.length },
          { label: "Templates", value: templates.length },
          { label: "Total Assets", value: scripts.length + playbooks.length + templates.length },
        ].map((s, i) => (
          <div key={s.label} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input placeholder="Search library..." className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-700 outline-none"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 space-y-4">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Library Sections</h3>
            <div className="space-y-1">
              {["Outreach Scripts", "Sales Frameworks", "Delivery SOPs", "Retention Playbooks", "Legal Templates"].map(cat => (
                <button key={cat} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all group">
                  <span className="flex items-center gap-2"><Bookmark size={12} className="text-zinc-600 group-hover:text-blue-400" />{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {tab === "scripts" && (
            <div className="grid grid-cols-1 gap-4">
              {filteredScripts.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60 overflow-hidden group hover:border-zinc-700/60 transition-all">
                  <div className="p-6 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", CATEGORY_STYLE[s.category] ?? CATEGORY_STYLE["Internal"])}>{s.category}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); handleCopy(s.id, s.content); }} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white">
                          {copied === s.id ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(s.id, "scripts"); }} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{s.title}</h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(s.tags ?? []).map((t: string) => <span key={t} className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">#{t}</span>)}
                        </div>
                      </div>
                      <ChevronDown size={18} className={cn("text-zinc-600 transition-transform", expanded === s.id && "rotate-180")} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {expanded === s.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-zinc-950/30">
                        <div className="p-6 pt-0">
                          <pre className="text-xs text-zinc-400 font-mono leading-relaxed bg-zinc-950 p-6 rounded-2xl border border-zinc-800/50 whitespace-pre-wrap">{s.content}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
              {filteredScripts.length === 0 && <div className="text-center py-12 text-zinc-600">No scripts found. Click &quot;New Asset&quot; to create one.</div>}
            </div>
          )}

          {tab === "playbooks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlaybooks.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-500/40 transition-all group flex flex-col justify-between h-64">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all"><BookOpen size={24} /></div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", CATEGORY_STYLE[p.category] ?? CATEGORY_STYLE["Internal"])}>{p.category}</span>
                        <button onClick={() => handleDelete(p.id, "playbooks")} className="p-1 rounded text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight">{p.title}</h3>
                    <p className="text-xs text-zinc-500 mt-2">{p.steps} critical steps · Updated {p.lastUpdated?.split("T")[0] ?? "recently"}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-400" />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", PERF_COLORS[p.performance] ?? PERF_COLORS["Med"])}>{p.performance} Performance</span>
                    </div>
                    <button onClick={() => toast(`Launching ${p.title} SOP...`, "info")} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Launch SOP →</button>
                  </div>
                </motion.div>
              ))}
              {filteredPlaybooks.length === 0 && <div className="col-span-2 text-center py-12 text-zinc-600">No playbooks found.</div>}
            </div>
          )}

          {tab === "templates" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-500/40 transition-all group flex flex-col justify-between h-56">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={20} /></div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", CATEGORY_STYLE[t.category] ?? CATEGORY_STYLE["Internal"])}>{t.category}</span>
                        <button onClick={() => handleDelete(t.id, "templates")} className="p-1 rounded text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">{t.title}</h3>
                    <p className="text-xs text-zinc-500 mt-2">{t.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600">{t.uses ?? 0} uses</span>
                    <button onClick={() => { handleCopy(t.id, t.description ?? t.title); }} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Use Template →</button>
                  </div>
                </motion.div>
              ))}
              {filteredTemplates.length === 0 && <div className="col-span-2 text-center py-12 text-zinc-600">No templates found.</div>}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white capitalize">New {tab.slice(0, -1)}</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder={tab === "scripts" ? "Cold Email — Niche Target" : tab === "playbooks" ? "Client Onboarding SOP" : "Proposal Template"}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option>Outreach</option><option>Sales</option><option>Delivery</option><option>Retention</option><option>Legal</option><option>Internal</option>
                  </select>
                </div>

                {tab === "scripts" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Script Content</label>
                      <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5}
                        placeholder="Write your script here... Use {{first_name}}, {{company}} for variables."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Tags (comma separated)</label>
                      <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                        placeholder="cold, saas, email" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                  </>
                )}

                {tab === "playbooks" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Steps</label>
                      <input type="number" value={form.steps} onChange={e => setForm(p => ({ ...p, steps: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Performance</label>
                      <select value={form.performance} onChange={e => setForm(p => ({ ...p, performance: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                        <option>Top</option><option>High</option><option>Med</option><option>Low</option>
                      </select>
                    </div>
                  </div>
                )}

                {tab === "templates" && (
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                      placeholder="What is this template for?" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.title.trim()}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
