"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, User, Briefcase, Calendar, FileText, Star, Search, Filter, MoreHorizontal, UserCheck, UserPlus, FileCheck, Clock, DollarSign, ArrowUpRight, Loader2, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { employeesApi, tasksApi } from "@/lib/endpoints";

type OpsTab = "hr" | "recruitment" | "contracts" | "attendance" | "payroll" | "activitylog";

const SEED_EMPLOYEES = [
  { id: "e1", name: "Sarah Johnson", role: "Senior Developer", dept: "Engineering", status: "Active", email: "sarah@niche.com", joiningDate: "2023-01-15", salary: 8500 },
  { id: "e2", name: "Mike Chen", role: "Project Manager", dept: "Operations", status: "Active", email: "mike@niche.com", joiningDate: "2022-06-01", salary: 7200 },
  { id: "e3", name: "Emma Lee", role: "SDR", dept: "Sales", status: "Active", email: "emma@niche.com", joiningDate: "2024-01-10", salary: 4500 },
  { id: "e4", name: "John Park", role: "Developer", dept: "Engineering", status: "On Leave", email: "john@niche.com", joiningDate: "2023-07-20", salary: 6800 },
  { id: "e5", name: "Lisa Wang", role: "Designer", dept: "Creative", status: "Active", email: "lisa@niche.com", joiningDate: "2023-03-08", salary: 5500 },
];

const CANDIDATES = [
  { id: "r1", name: "Tom Baker", role: "Full Stack Dev", stage: "Interview", source: "LinkedIn", date: "2d ago" },
  { id: "r2", name: "Priya Sharma", role: "SDR", stage: "Offer", source: "Referral", date: "5h ago" },
  { id: "r3", name: "Alex Kim", role: "UI Designer", stage: "Applied", source: "Indeed", date: "1d ago" },
  { id: "r4", name: "Maria Costa", role: "Account Manager", stage: "Screening", source: "LinkedIn", date: "3d ago" },
];

const CONTRACTS = [
  { id: "co1", name: "SaaS Agreement — Acme", client: "Acme Corp", value: "$24,000", status: "Active", signed: "2024-01-15", expires: "2025-01-15" },
  { id: "co2", name: "Retainer — Globex", client: "Globex Inc", value: "$3,500/mo", status: "Active", signed: "2024-02-01", expires: "2025-02-01" },
  { id: "co3", name: "NDA — Soylent Corp", client: "Soylent Corp", value: "$0", status: "Signed", signed: "2024-03-01", expires: "2027-03-01" },
  { id: "co4", name: "Dev Services Agreement", client: "Initech", value: "$15,000", status: "Draft", signed: "—", expires: "—" },
];

const ATTENDANCE = [
  { id: "a1", name: "Sarah Johnson", date: "2024-03-20", checkIn: "09:02", checkOut: "18:05", hours: 9.05, status: "Present" },
  { id: "a2", name: "Mike Chen", date: "2024-03-20", checkIn: "08:45", checkOut: "18:30", hours: 9.75, status: "Present" },
  { id: "a3", name: "Emma Lee", date: "2024-03-20", checkIn: "09:15", checkOut: "17:45", hours: 8.5, status: "Present" },
  { id: "a4", name: "John Park", date: "2024-03-20", checkIn: "—", checkOut: "—", hours: 0, status: "On Leave" },
  { id: "a5", name: "Lisa Wang", date: "2024-03-20", checkIn: "10:30", checkOut: "19:00", hours: 8.5, status: "Late" },
];

const RECRUIT_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired"];

const STATUS_STYLE: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "On Leave": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Signed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Draft: "bg-zinc-800 text-zinc-500 border-zinc-700",
  Present: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Late: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Absent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function OperationsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<OpsTab>("hr");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<any[]>(SEED_EMPLOYEES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", role: "", dept: "", email: "", salary: "" });
  const [contractForm, setContractForm] = useState({ name: "", client: "", value: "", expires: "" });
  const [contracts, setContracts] = useState(CONTRACTS);

  useEffect(() => {
    employeesApi.list()
      .then(res => { if (res.data?.length) setEmployees(res.data.map((e: any) => ({ ...e, salary: e.salary ?? 0 }))); })
      .catch(() => {});
  }, []);

  const loadActivity = async () => {
    if (activityLog.length > 0) return;
    setActivityLoading(true);
    try {
      const [tasksRes, timeRes] = await Promise.all([
        tasksApi.list(),
        tasksApi.getTime(),
      ]);
      const tasks = (tasksRes.data || []).map((t: any) => ({
        id: `task-${t.id}`,
        type: "task",
        employee: t.assignee?.name || "Unassigned",
        action: t.status === "DONE" ? "Completed task" : t.status === "IN_PROGRESS" ? "Started task" : "Updated task",
        subject: t.title,
        status: t.status,
        time: t.updatedAt || t.createdAt,
      }));
      const times = (timeRes.data || []).map((e: any) => ({
        id: `time-${e.id}`,
        type: "time",
        employee: e.user?.name || "Unknown",
        action: `Logged ${e.hours}h`,
        subject: e.task?.title || "Task",
        status: "LOGGED",
        time: e.createdAt,
      }));
      const combined = [...tasks, ...times].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      setActivityLog(combined);
    } catch { /* silent */ }
    setActivityLoading(false);
  };

  const handleAddEmployee = async () => {
    if (!empForm.name || !empForm.role) return;
    setSaving(true);
    try {
      const res = await employeesApi.create({ ...empForm, salary: parseFloat(empForm.salary) || 0 });
      const created = res.data ?? { id: `e${Date.now()}`, ...empForm, status: "Active", joiningDate: new Date().toISOString() };
      setEmployees(prev => [created, ...prev]);
      toast("Employee added!", "success");
      setShowAddModal(false);
      setEmpForm({ name: "", role: "", dept: "", email: "", salary: "" });
    } catch {
      toast("Failed to add employee", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddContract = () => {
    if (!contractForm.name || !contractForm.client) return;
    const newContract = { id: `co${Date.now()}`, ...contractForm, status: "Draft", signed: "—" };
    setContracts(prev => [newContract, ...prev]);
    toast("Contract created!", "success");
    setShowContractModal(false);
    setContractForm({ name: "", client: "", value: "", expires: "" });
  };

  const TABS = [
    { id: "hr", label: "Registry", icon: User },
    { id: "recruitment", label: "Hiring", icon: UserPlus },
    { id: "contracts", label: "Legal", icon: FileCheck },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "activitylog", label: "Activity Log", icon: Activity },
  ];

  const totalPayroll = employees.filter(e => (e.status ?? "Active") === "Active").reduce((s, e) => s + (e.salary ?? 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Operations Control</h1>
          <p className="text-zinc-500 mt-1">Manage human capital, legal agreements, and internal logistics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id as OpsTab); if (t.id === "activitylog") loadActivity(); }}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5", tab === t.id ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>
                <t.icon size={12} /><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { if (tab === "activitylog") { loadActivity(); return; } tab === "contracts" ? setShowContractModal(true) : setShowAddModal(true); }}
            className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2">
            <Plus size={16} strokeWidth={3} />
            <span>{tab === "contracts" ? "New Contract" : "Add Entity"}</span>
          </button>
        </div>
      </div>

      {tab === "hr" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Headcount", value: employees.length, icon: UserCheck, color: "text-blue-400" },
              { label: "Active", value: employees.filter(e => (e.status ?? "Active") === "Active").length, icon: Star, color: "text-emerald-400" },
              { label: "On Leave", value: employees.filter(e => e.status === "On Leave").length, icon: Clock, color: "text-amber-400" },
              { label: "Open Roles", value: CANDIDATES.length, icon: Briefcase, color: "text-purple-400" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 group hover:border-zinc-700/60 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-2.5 rounded-xl bg-zinc-800", s.color)}><s.icon size={18} /></div>
                </div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
                <h3 className="text-xl font-bold text-white mt-1">{s.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
            <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search directory..." className="bg-zinc-800 border-none rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-600 w-72" />
              </div>
              <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"><Filter size={14} /></button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {employees.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase())).map((e) => {
                  const joined = e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : "—";
                  const status = e.status ?? "Active";
                  return (
                    <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                            {e.name?.split(" ").map((n: string) => n[0]).join("") ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{e.name}</p>
                            <p className="text-[10px] text-zinc-500">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-zinc-400">{e.role}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{e.dept ?? "—"}</td>
                      <td className="px-6 py-4"><span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", STATUS_STYLE[status] ?? STATUS_STYLE["Active"])}>{status}</span></td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{joined}</td>
                      <td className="px-6 py-4 text-right"><button className="text-zinc-600 hover:text-white"><MoreHorizontal size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "recruitment" && (
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[500px]">
          {RECRUIT_STAGES.map((stage) => {
            const stageCands = CANDIDATES.filter(c => c.stage === stage);
            return (
              <div key={stage} className="min-w-[260px] w-[260px] flex flex-col space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />{stage}
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-700">{stageCands.length}</span>
                </div>
                <div className="flex-1 bg-zinc-900/20 border border-dashed border-zinc-800/40 rounded-3xl p-3 space-y-3">
                  {stageCands.map(c => (
                    <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-blue-500/40 transition-all cursor-pointer group shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-sm uppercase">{c.stage}</span>
                        <span className="text-[10px] text-zinc-600">{c.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-200">{c.name}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{c.role} · {c.source}</p>
                    </motion.div>
                  ))}
                  <button className="w-full py-3 rounded-2xl border border-dashed border-zinc-800/60 text-[10px] font-black text-zinc-700 hover:text-zinc-500 hover:border-zinc-700 transition-all uppercase tracking-widest">
                    Add +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "contracts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Contracts", value: contracts.length },
              { label: "Active", value: contracts.filter(c => c.status === "Active").length },
              { label: "Draft", value: contracts.filter(c => c.status === "Draft").length },
              { label: "Signed", value: contracts.filter(c => c.status === "Signed").length },
            ].map((s, i) => (
              <div key={s.label} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Contract Name</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Signed</th>
                  <th className="px-6 py-4">Expires</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {contracts.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-zinc-500" />
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{c.client}</td>
                    <td className="px-6 py-4 text-xs font-bold text-white">{c.value}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{c.signed}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{c.expires}</td>
                    <td className="px-6 py-4"><span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", STATUS_STYLE[c.status] ?? STATUS_STYLE["Draft"])}>{c.status}</span></td>
                    <td className="px-6 py-4 text-right"><button className="text-zinc-600 hover:text-white"><MoreHorizontal size={14} /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Present Today", value: ATTENDANCE.filter(a => a.status === "Present").length, color: "text-emerald-400" },
              { label: "Late", value: ATTENDANCE.filter(a => a.status === "Late").length, color: "text-amber-400" },
              { label: "On Leave", value: ATTENDANCE.filter(a => a.status === "On Leave").length, color: "text-blue-400" },
              { label: "Avg Hours", value: `${(ATTENDANCE.filter(a => a.hours > 0).reduce((s, a) => s + a.hours, 0) / Math.max(ATTENDANCE.filter(a => a.hours > 0).length, 1)).toFixed(1)}h`, color: "text-purple-400" },
            ].map((s, i) => (
              <div key={s.label} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
            <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-300">Attendance — March 20, 2024</span>
              <button onClick={() => toast("Attendance report exported!", "success")} className="text-xs font-bold text-blue-400 hover:text-blue-300">Export CSV</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {ATTENDANCE.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 text-sm font-semibold text-white">{a.name}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400 font-mono">{a.checkIn}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400 font-mono">{a.checkOut}</td>
                    <td className="px-6 py-4 text-xs font-bold text-white">{a.hours > 0 ? `${a.hours}h` : "—"}</td>
                    <td className="px-6 py-4"><span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", STATUS_STYLE[a.status] ?? STATUS_STYLE["Active"])}>{a.status}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payroll" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Monthly Payroll", value: `$${totalPayroll.toLocaleString()}`, color: "text-blue-400" },
              { label: "Annual Cost", value: `$${(totalPayroll * 12).toLocaleString()}`, color: "text-indigo-400" },
              { label: "Headcount", value: employees.filter(e => (e.status ?? "Active") === "Active").length, color: "text-emerald-400" },
              { label: "Avg Salary", value: employees.length > 0 ? `$${Math.round(employees.reduce((s, e) => s + (e.salary ?? 0), 0) / employees.length).toLocaleString()}` : "$0", color: "text-purple-400" },
            ].map((s, i) => (
              <div key={s.label} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
            <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-300">Payroll Register — March 2024</span>
              <button onClick={() => toast("Payroll run initiated!", "success")} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Run Payroll</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Base Salary</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4">Net Pay</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {employees.map((e, i) => {
                  const gross = e.salary ?? 0;
                  const deductions = Math.round(gross * 0.22);
                  const net = gross - deductions;
                  return (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-800/30">
                      <td className="px-6 py-4 text-sm font-semibold text-white">{e.name}</td>
                      <td className="px-6 py-4 text-xs text-zinc-400">{e.role}</td>
                      <td className="px-6 py-4 text-xs font-bold text-white">${gross.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-rose-400">-${deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-emerald-400">${net.toLocaleString()}</td>
                      <td className="px-6 py-4"><span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Processed</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG ── */}
      {tab === "activitylog" && (
        <div className="space-y-4">
          {/* Per-employee summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {employees.slice(0, 4).map((emp, i) => {
              const empActivity = activityLog.filter(a => a.employee === emp.name);
              const done = empActivity.filter(a => a.status === "DONE").length;
              const hours = activityLog.filter(a => a.type === "time" && a.employee === emp.name)
                .reduce((s: number, e: any) => {
                  const match = e.action.match(/[\d.]+/);
                  return s + (match ? parseFloat(match[0]) : 0);
                }, 0);
              return (
                <div key={emp.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {emp.name?.split(" ").map((n: string) => n[0]).join("") ?? "?"}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{emp.name?.split(" ")[0]}</p>
                  </div>
                  <div className="flex gap-3">
                    <div>
                      <p className="text-[10px] text-zinc-600">Done</p>
                      <p className="text-sm font-black text-emerald-400">{done}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-600">Hours</p>
                      <p className="text-sm font-black text-blue-400">{hours.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refresh */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{activityLog.length} activity entries</p>
            <button
              onClick={() => { setActivityLog([]); loadActivity(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
            >
              <Activity size={12} />
              Refresh
            </button>
          </div>

          {/* Feed */}
          {activityLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-zinc-600" size={24} />
            </div>
          ) : activityLog.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <Activity size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No activity yet</p>
              <p className="text-xs mt-1">Task and time data will appear here</p>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Task / Subject</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {activityLog.slice(0, 50).map(entry => (
                    <tr key={entry.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-300 flex-shrink-0">
                            {entry.employee?.split(" ").map((n: string) => n[0]).join("") ?? "?"}
                          </div>
                          <p className="text-xs font-semibold text-white">{entry.employee}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-zinc-400">{entry.action}</td>
                      <td className="px-5 py-3 text-xs text-zinc-300 max-w-[200px] truncate">{entry.subject}</td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                          entry.status === "DONE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          entry.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          entry.status === "BLOCKED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          entry.status === "LOGGED" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                          "bg-zinc-800 text-zinc-500 border-zinc-700"
                        )}>
                          {entry.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[10px] text-zinc-600">
                        {entry.time ? new Date(entry.time).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Employee</h2>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Full Name *</label>
                    <input value={empForm.name} onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Jane Smith" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Role *</label>
                    <input value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))}
                      placeholder="Senior Developer" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Department</label>
                    <input value={empForm.dept} onChange={e => setEmpForm(p => ({ ...p, dept: e.target.value }))}
                      placeholder="Engineering" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Monthly Salary ($)</label>
                    <input type="number" value={empForm.salary} onChange={e => setEmpForm(p => ({ ...p, salary: e.target.value }))}
                      placeholder="5000" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Email</label>
                  <input type="email" value={empForm.email} onChange={e => setEmpForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="jane@company.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleAddEmployee} disabled={saving || !empForm.name || !empForm.role}
                  className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}Add Employee
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contract Modal */}
      <AnimatePresence>
        {showContractModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">New Contract</h2>
                <button onClick={() => setShowContractModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Contract Name *</label>
                  <input value={contractForm.name} onChange={e => setContractForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="SaaS Agreement — Client Name" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Client *</label>
                    <input value={contractForm.client} onChange={e => setContractForm(p => ({ ...p, client: e.target.value }))}
                      placeholder="Acme Corp" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Contract Value</label>
                    <input value={contractForm.value} onChange={e => setContractForm(p => ({ ...p, value: e.target.value }))}
                      placeholder="$10,000" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Expiry Date</label>
                  <input type="date" value={contractForm.expires} onChange={e => setContractForm(p => ({ ...p, expires: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowContractModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleAddContract} disabled={!contractForm.name || !contractForm.client}
                  className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-bold transition-all disabled:opacity-50">Create Contract</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
