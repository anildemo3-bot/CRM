"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Plus, Search, MoreHorizontal, DollarSign, ArrowUpRight, Star, TrendingUp, Building2, X, Loader2, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { partnersApi } from "@/lib/endpoints";

type PartnerTab = "partners" | "payouts";

const SEED_PARTNERS = [
  { id: "p1", name: "Growth Lab", type: "Influencer", contactEmail: "hello@growthlab.io", revenue: 42000, referrals: 15, commissionRate: 20, commission: 8400, status: "Active", joinedAt: "2024-01-10" },
  { id: "p2", name: "SaaS Rocket", type: "Agency", contactEmail: "team@saasrocket.co", revenue: 125000, referrals: 32, commissionRate: 20, commission: 25000, status: "Active", joinedAt: "2023-11-05" },
  { id: "p3", name: "Legal Flow", type: "Affiliate", contactEmail: "info@legalflow.com", revenue: 12000, referrals: 4, commissionRate: 10, commission: 1200, status: "Pending", joinedAt: "2024-02-20" },
  { id: "p4", name: "Acme Partnerships", type: "Strategic", contactEmail: "partners@acme.com", revenue: 0, referrals: 0, commissionRate: 15, commission: 0, status: "Draft", joinedAt: "2024-03-01" },
];

const SEED_PAYOUTS = [
  { id: "pay1", partner: "SaaS Rocket", amount: 12500, period: "Feb 2024", status: "Paid", paidAt: "2024-03-05" },
  { id: "pay2", partner: "Growth Lab", amount: 4200, period: "Feb 2024", status: "Paid", paidAt: "2024-03-05" },
  { id: "pay3", partner: "SaaS Rocket", amount: 12500, period: "Mar 2024", status: "Pending", paidAt: null },
  { id: "pay4", partner: "Growth Lab", amount: 4200, period: "Mar 2024", status: "Pending", paidAt: null },
];

export default function PartnersPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<PartnerTab>("partners");
  const [partners, setPartners] = useState(SEED_PARTNERS);
  const [payouts, setPayouts] = useState(SEED_PAYOUTS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Agency", contactEmail: "", commissionRate: "20", status: "Draft" });

  useEffect(() => {
    partnersApi.list().then(r => { if (r.data?.length) setPartners(r.data); }).catch(() => {});
    partnersApi.payouts().then(r => { if (r.data?.length) setPayouts(r.data); }).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await partnersApi.create({ name: form.name, type: form.type, contactEmail: form.contactEmail, commissionRate: parseFloat(form.commissionRate), status: form.status });
      const created = res.data ?? { id: `p${Date.now()}`, ...form, commissionRate: parseFloat(form.commissionRate), revenue: 0, referrals: 0, commission: 0, joinedAt: new Date().toISOString() };
      setPartners(prev => [created, ...prev]);
      toast("Partner added!", "success");
      setShowModal(false);
      setForm({ name: "", type: "Agency", contactEmail: "", commissionRate: "20", status: "Draft" });
    } catch {
      toast("Failed to add partner", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePayout = async (id: string) => {
    try {
      await partnersApi.approvePayout(id);
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "Paid", paidAt: new Date().toISOString().split("T")[0] } : p));
      toast("Payout approved!", "success");
    } catch {
      toast("Failed to approve payout", "error");
    }
  };

  const totalRevenue = partners.reduce((s, p) => s + (p.revenue ?? 0), 0);
  const activePartners = partners.filter(p => p.status === "Active").length;
  const pendingPayout = payouts.filter(p => p.status === "Pending").reduce((s, p) => s + (p.amount ?? 0), 0);

  const filtered = partners.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Partner Ecosystem</h1>
          <p className="text-zinc-500 mt-1">Manage referral partners, payouts, and partnership growth metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button onClick={() => setTab("partners")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg transition-all", tab === "partners" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>Partners</button>
            <button onClick={() => setTab("payouts")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg transition-all", tab === "payouts" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>Payouts</button>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2">
            <Plus size={16} /><span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Partner Revenue", value: `$${totalRevenue.toLocaleString()}`, trend: "+24%", icon: DollarSign, color: "text-blue-400" },
          { label: "Active Partners", value: activePartners, trend: "+2", icon: Handshake, color: "text-indigo-400" },
          { label: "Avg Commission", value: `${partners.length > 0 ? Math.round(partners.reduce((s, p) => s + (p.commissionRate ?? 0), 0) / partners.length) : 0}%`, trend: "Stable", icon: Star, color: "text-emerald-400" },
          { label: "Pending Payout", value: `$${pendingPayout.toLocaleString()}`, trend: "", icon: TrendingUp, color: "text-amber-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 group hover:border-zinc-700/60 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl bg-zinc-800", s.color)}><s.icon size={18} /></div>
              {s.trend && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{s.trend}</span>}
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-xl font-bold text-white mt-1">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      {tab === "partners" && (
        <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden">
          <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-950/20">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners..." className="bg-zinc-800 border-none rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-zinc-600 w-64" />
            </div>
            <div className="flex bg-zinc-800 rounded-lg p-0.5">
              {["All", "Active", "Pending"].map(f => <button key={f} className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", f === "All" ? "bg-zinc-700 text-white" : "text-zinc-500")}>{f}</button>)}
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Partner</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Ref. Revenue</th>
                <th className="px-6 py-4">Commission ({`%`})</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-blue-400"><Building2 size={16} /></div>
                      <div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-[10px] text-zinc-600">{p.referrals ?? 0} referrals</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{p.type}</td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{p.contactEmail}</td>
                  <td className="px-6 py-4 text-xs font-bold text-white">${(p.revenue ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-400">{p.commissionRate ?? 0}%</td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                      p.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      p.status === "Pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-zinc-800 text-zinc-500 border-zinc-700")}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-zinc-600 hover:text-white"><MoreHorizontal size={14} /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "payouts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Paid", value: `$${payouts.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0).toLocaleString()}` },
              { label: "Pending", value: `$${pendingPayout.toLocaleString()}` },
              { label: "Total Payouts", value: payouts.length },
              { label: "This Month", value: `$${payouts.filter(p => p.period?.includes("Mar")).reduce((s, p) => s + p.amount, 0).toLocaleString()}` },
            ].map((s, i) => (
              <div key={s.label} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/20 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Partner</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Paid At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {payouts.map((payout, i) => (
                  <motion.tr key={payout.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 text-sm font-semibold text-white">{payout.partner}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{payout.period}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-400">${payout.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{payout.paidAt ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                        payout.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20")}>{payout.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {payout.status === "Pending" && (
                        <button onClick={() => handleApprovePayout(payout.id)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                          <CheckCircle2 size={12} />Approve
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Partner</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Partner Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Growth Lab" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                      <option>Agency</option><option>Influencer</option><option>Affiliate</option><option>Strategic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Commission Rate (%)</label>
                    <input type="number" value={form.commissionRate} onChange={e => setForm(p => ({ ...p, commissionRate: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="contact@partner.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Draft">Draft</option><option value="Pending">Pending</option><option value="Active">Active</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}Add Partner
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
