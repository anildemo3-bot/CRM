"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, DollarSign, ArrowUpRight, FileText, MoreVertical, Search, Filter, TrendingUp, Calendar, CreditCard, PieChart, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { invoicesApi } from "@/lib/endpoints";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type FinTab = "overview" | "invoices" | "expenses" | "subscriptions";

const REVENUE_DATA = [
  { day: "Mon", income: 4200, expenses: 1800 },
  { day: "Tue", income: 3800, expenses: 2200 },
  { day: "Wed", income: 5100, expenses: 1900 },
  { day: "Thu", income: 4900, expenses: 2100 },
  { day: "Fri", income: 6200, expenses: 2500 },
  { day: "Sat", income: 3200, expenses: 1200 },
  { day: "Sun", income: 2800, expenses: 1100 },
];

const EXPENSES = [
  { id: "e1", category: "Software", vendor: "AWS", amount: 1200, date: "2024-03-01", recurring: true },
  { id: "e2", category: "Payroll", vendor: "ADP", amount: 28000, date: "2024-03-15", recurring: true },
  { id: "e3", category: "Marketing", vendor: "Meta Ads", amount: 3500, date: "2024-03-10", recurring: false },
  { id: "e4", category: "Tools", vendor: "Figma", amount: 450, date: "2024-03-01", recurring: true },
];

const SUBSCRIPTIONS = [
  { id: "s1", client: "Acme Corp", plan: "Growth", amount: 2500, billingCycle: "Monthly", nextBilling: "2024-04-01", status: "Active" },
  { id: "s2", client: "Globex Inc", plan: "Enterprise", amount: 8000, billingCycle: "Monthly", nextBilling: "2024-04-05", status: "Active" },
  { id: "s3", client: "Initech", plan: "Starter", amount: 500, billingCycle: "Monthly", nextBilling: "2024-04-12", status: "Active" },
  { id: "s4", client: "Soylent Corp", plan: "Growth", amount: 2500, billingCycle: "Monthly", nextBilling: "2024-04-20", status: "Past Due" },
];

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  PAID: { label: "Paid", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  SENT: { label: "Sent", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  DRAFT: { label: "Draft", style: "bg-zinc-800 text-zinc-500 border-zinc-700" },
  VOID: { label: "Void", style: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

const SEED_INVOICES = [
  { id: "INV-001", invoiceNumber: "INV-001", clientId: null, amount: 12000, status: "PAID", createdAt: "2024-03-20", dueDate: "2024-04-20" },
  { id: "INV-002", invoiceNumber: "INV-002", clientId: null, amount: 4500, status: "SENT", createdAt: "2024-03-22", dueDate: "2024-04-22" },
  { id: "INV-003", invoiceNumber: "INV-003", clientId: null, amount: 25000, status: "SENT", createdAt: "2024-03-10", dueDate: "2024-03-31" },
  { id: "INV-004", invoiceNumber: "INV-004", clientId: null, amount: 8000, status: "PAID", createdAt: "2024-03-15", dueDate: "2024-04-15" },
];

export default function FinancePage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<FinTab>("overview");
  const [invoices, setInvoices] = useState<any[]>(SEED_INVOICES);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invForm, setInvForm] = useState({ invoiceNumber: "", amount: "", status: "DRAFT", dueDate: "", client: "" });

  useEffect(() => {
    invoicesApi.list()
      .then(res => { if (res.data?.length) setInvoices(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter(i => i.status === "SENT").reduce((s, i) => s + i.amount, 0);
  const mrr = SUBSCRIPTIONS.filter(s => s.status === "Active").reduce((s, sub) => s + sub.amount, 0);

  const handleCreateInvoice = async () => {
    if (!invForm.invoiceNumber || !invForm.amount) return;
    setSaving(true);
    try {
      const payload = { invoiceNumber: invForm.invoiceNumber, amount: parseFloat(invForm.amount), status: invForm.status, dueDate: invForm.dueDate };
      const res = await invoicesApi.create(payload);
      const created = res.data ?? { id: `INV-${Date.now()}`, ...payload, createdAt: new Date().toISOString() };
      setInvoices(prev => [created, ...prev]);
      toast("Invoice created!", "success");
      setShowModal(false);
      setInvForm({ invoiceNumber: "", amount: "", status: "DRAFT", dueDate: "", client: "" });
    } catch {
      toast("Failed to create invoice", "error");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "overview" as FinTab, label: "Overview", icon: PieChart },
    { id: "invoices" as FinTab, label: "Invoices", icon: FileText },
    { id: "expenses" as FinTab, label: "Expenses", icon: Receipt },
    { id: "subscriptions" as FinTab, label: "Billing", icon: CreditCard },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Finance Dashboard</h1>
          <p className="text-zinc-500 mt-1">Track revenue, manage invoices, and monitor profit margins.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5", tab === t.id ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>
                <t.icon size={12} /><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
            <Plus size={16} /><span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, trend: "+12.5%", icon: DollarSign, color: "text-blue-400" },
          { label: "MRR", value: `$${mrr.toLocaleString()}`, trend: "+8.2%", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Outstanding", value: `$${outstanding.toLocaleString()}`, trend: "-5.3%", icon: ArrowUpRight, color: "text-amber-400" },
          { label: "Invoices", value: `${invoices.length}`, trend: "+15.0%", icon: Calendar, color: "text-purple-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/60 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors", s.color)}><s.icon size={20} /></div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", s.trend.startsWith("+") ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10")}>{s.trend}</span>
            </div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-white">Income vs Expenses</h3>
              <select className="bg-zinc-800 border-none rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:ring-0">
                <option>Last 7 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#income)" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#expenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 flex flex-col justify-between text-white">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Financial Health</h3>
              {[
                { label: "Burn Rate", value: "$12.4k/mo" },
                { label: "Runway", value: "14 Months", highlight: "text-emerald-400" },
                { label: "Profit Margin", value: "48%", highlight: "text-blue-400" },
                { label: "COGS (monthly)", value: "$8.2k" },
                { label: "Net MRR", value: `$${mrr.toLocaleString()}`, highlight: "text-emerald-400" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center border-b border-zinc-800/40 pb-3">
                  <span className="text-xs text-zinc-400">{item.label}</span>
                  <span className={cn("text-sm font-bold", item.highlight || "text-white")}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Top Clients</p>
              <div className="space-y-3">
                {[{ name: "Acme Corp", share: 32 }, { name: "Globex Inc", share: 24 }, { name: "Initech", share: 18 }].map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-xs text-zinc-300 flex-1">{c.name}</span>
                    <span className="text-xs font-bold text-white">{c.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden text-white">
          <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input placeholder="Search invoices..." className="bg-zinc-800 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-600 w-64" />
              </div>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {invoices.map((inv, i) => {
                const statusInfo = STATUS_MAP[inv.status] ?? { label: inv.status, style: "bg-zinc-800 text-zinc-500 border-zinc-700" };
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-zinc-300">{inv.invoiceNumber ?? inv.id}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4 text-xs font-bold text-white">${inv.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md border", statusInfo.style)}>{statusInfo.label}</span></td>
                    <td className="px-6 py-4 text-right"><button className="text-zinc-600 hover:text-zinc-400 p-1"><MoreVertical size={14} /></button></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "expenses" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Expenses", value: `$${EXPENSES.reduce((s, e) => s + e.amount, 0).toLocaleString()}` },
              { label: "Recurring", value: `$${EXPENSES.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0).toLocaleString()}` },
              { label: "Payroll %", value: "85%" },
              { label: "Software Stack", value: `$${EXPENSES.filter(e => e.category === "Software" || e.category === "Tools").reduce((s, e) => s + e.amount, 0).toLocaleString()}` },
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
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {EXPENSES.map((e, i) => (
                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 text-xs font-bold text-white">{e.category}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{e.vendor}</td>
                    <td className="px-6 py-4 text-xs font-bold text-rose-400">${e.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{e.date}</td>
                    <td className="px-6 py-4"><span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", e.recurring ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700")}>{e.recurring ? "Recurring" : "One-time"}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "MRR", value: `$${mrr.toLocaleString()}` },
              { label: "ARR", value: `$${(mrr * 12).toLocaleString()}` },
              { label: "Active Subs", value: `${SUBSCRIPTIONS.filter(s => s.status === "Active").length}` },
              { label: "Past Due", value: `${SUBSCRIPTIONS.filter(s => s.status === "Past Due").length}` },
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
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Billing Cycle</th>
                  <th className="px-6 py-4">Next Billing</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {SUBSCRIPTIONS.map((sub, i) => (
                  <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 text-xs font-bold text-white">{sub.client}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{sub.plan}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-400">${sub.amount.toLocaleString()}/mo</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{sub.billingCycle}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{sub.nextBilling}</td>
                    <td className="px-6 py-4"><span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", sub.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>{sub.status}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Create Invoice</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Invoice # *</label>
                    <input value={invForm.invoiceNumber} onChange={e => setInvForm(p => ({ ...p, invoiceNumber: e.target.value }))}
                      placeholder="INV-005" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Amount ($) *</label>
                    <input type="number" value={invForm.amount} onChange={e => setInvForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="5000" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Client</label>
                  <input value={invForm.client} onChange={e => setInvForm(p => ({ ...p, client: e.target.value }))}
                    placeholder="Client name" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Status</label>
                    <select value={invForm.status} onChange={e => setInvForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Due Date</label>
                    <input type="date" value={invForm.dueDate} onChange={e => setInvForm(p => ({ ...p, dueDate: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleCreateInvoice} disabled={saving || !invForm.invoiceNumber || !invForm.amount}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}Create Invoice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
