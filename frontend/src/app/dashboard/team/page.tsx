"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Mail, Trash2, Crown, Shield, Code2, Phone, User, Loader2, X, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { teamApi } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/Toast";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SUPER_ADMIN: { label: "Super Admin",  color: "bg-violet-500/20 text-violet-400 border-violet-500/30", icon: Crown },
  ADMIN:       { label: "Admin",        color: "bg-rose-500/20 text-rose-400 border-rose-500/30",       icon: Crown },
  MANAGER:     { label: "Manager",      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",       icon: Shield },
  SALES:       { label: "Sales",        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Phone },
  DEVELOPER:   { label: "Developer",    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",       icon: Code2 },
  COLD_CALLER: { label: "Cold Caller",  color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Phone },
  OUTREACHER:  { label: "Outreacher",   color: "bg-teal-500/20 text-teal-400 border-teal-500/30",       icon: Phone },
  FREELANCER:  { label: "Freelancer",   color: "bg-amber-500/20 text-amber-400 border-amber-500/30",    icon: User },
  CLIENT:      { label: "Client",       color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",       icon: User },
};

const INVITE_ROLES = ["MANAGER", "DEVELOPER", "COLD_CALLER", "OUTREACHER", "FREELANCER", "SALES", "CLIENT"];

export default function TeamPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "DEVELOPER" });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ token: string; inviteUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isManager = user?.role === "MANAGER";

  const load = async () => {
    setLoading(true);
    try {
      const [memRes, invRes] = await Promise.all([teamApi.members(), teamApi.invites().catch(() => ({ data: [] }))]);
      setMembers(memRes.data || []);
      setInvites(invRes.data || []);
    } catch { toast("Failed to load team", "error"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendInvite = async () => {
    if (!inviteForm.email.trim()) return;
    setInviting(true);
    try {
      const res = await teamApi.invite(inviteForm);
      setInviteResult({ token: res.data.token, inviteUrl: `${window.location.origin}/accept-invite/${res.data.token}` });
      load();
      toast("Invite created!", "success");
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to create invite", "error");
    }
    setInviting(false);
  };

  const copyInviteLink = () => {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeInvite = async (id: string) => {
    try {
      await teamApi.revokeInvite(id);
      setInvites(p => p.filter(i => i.id !== id));
      toast("Invite revoked", "success");
    } catch { toast("Failed", "error"); }
  };

  const changeRole = async (memberId: string, role: string) => {
    try {
      await teamApi.changeRole(memberId, role);
      setMembers(p => p.map(m => m.id === memberId ? { ...m, role } : m));
      toast("Role updated", "success");
    } catch (err: any) { toast(err?.response?.data?.message ?? "Failed", "error"); }
  };

  const removeMember = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      await teamApi.removeMember(memberId);
      setMembers(p => p.filter(m => m.id !== memberId));
      toast("Member removed", "success");
    } catch (err: any) { toast(err?.response?.data?.message ?? "Failed", "error"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-zinc-600" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Team</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""} in your organization</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all">
            <RefreshCw size={14} />
          </button>
          {(isAdmin || isManager) && (
            <button onClick={() => { setShowInvitePanel(true); setInviteResult(null); setInviteForm({ email: "", role: "DEVELOPER" }); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all">
              <UserPlus size={13} /> Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map(member => {
          const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.CLIENT;
          const Icon = cfg.icon;
          return (
            <div key={member.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                {member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  {member.name} {member.id === user?.id && <span className="text-xs text-zinc-600">(you)</span>}
                </p>
                <p className="text-xs text-zinc-500">{member.email}</p>
              </div>
              <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border flex-shrink-0", cfg.color)}>
                <Icon size={11} /> {cfg.label}
              </span>
              {isAdmin && member.id !== user?.id && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={member.role} onChange={e => changeRole(member.id, e.target.value)}
                    className="bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-zinc-500">
                    {Object.entries(ROLE_CONFIG).filter(([k]) => k !== "SUPER_ADMIN").map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button onClick={() => removeMember(member.id, member.name)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Pending Invites</p>
          <div className="space-y-2">
            {invites.map(inv => (
              <div key={inv.id} className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3 flex items-center gap-3">
                <Mail size={14} className="text-zinc-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">{inv.email}</p>
                  <p className="text-[10px] text-zinc-600">
                    {ROLE_CONFIG[inv.role]?.label ?? inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={() => revokeInvite(inv.id)} className="text-xs text-zinc-600 hover:text-rose-400 transition-colors">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite panel */}
      <AnimatePresence>
        {showInvitePanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowInvitePanel(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <p className="text-base font-bold text-white">Invite Team Member</p>
                <button onClick={() => setShowInvitePanel(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors"><X size={18} /></button>
              </div>

              {!inviteResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                    <input type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="colleague@company.com"
                      className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Role</label>
                    <select value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500">
                      {INVITE_ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label ?? r}</option>)}
                      {isAdmin && <option value="ADMIN">Admin</option>}
                    </select>
                  </div>
                  <button onClick={sendInvite} disabled={inviting || !inviteForm.email.trim()}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    {inviting ? "Creating invite..." : "Generate Invite Link"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-sm font-bold text-white mb-1">Invite link created!</p>
                    <p className="text-xs text-zinc-500">Share this link with {inviteForm.email}</p>
                  </div>
                  <div className="bg-zinc-800/60 rounded-xl p-3">
                    <p className="text-xs text-zinc-600 mb-1.5 font-bold uppercase tracking-widest">Invite Link</p>
                    <p className="text-xs text-zinc-300 font-mono break-all">{inviteResult.inviteUrl}</p>
                  </div>
                  <button onClick={copyInviteLink}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy Invite Link"}
                  </button>
                  <button onClick={() => { setInviteResult(null); setInviteForm({ email: "", role: "DEVELOPER" }); }}
                    className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Invite another person
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
