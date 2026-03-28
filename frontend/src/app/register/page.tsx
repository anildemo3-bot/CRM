"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, UserPlus, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { inviteApi } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const [path, setPath] = useState<"choose" | "org" | "invite">("choose");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create org form
  const [orgForm, setOrgForm] = useState({ name: "", email: "", orgName: "", password: "", confirm: "" });

  // Invite form
  const [inviteToken, setInviteToken] = useState("");
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinForm, setJoinForm] = useState({ name: "", password: "", confirm: "" });

  const submitOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orgForm.password !== orgForm.confirm) { toast("Passwords don't match", "error"); return; }
    if (orgForm.password.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: orgForm.name,
        email: orgForm.email,
        password: orgForm.password,
        organizationName: orgForm.orgName,
      });
      setUser(res.data.user, res.data.access_token);
      toast("Organization created! Welcome 🎉", "success");
      router.push("/dashboard");
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Registration failed", "error");
    }
    setLoading(false);
  };

  const validateToken = async () => {
    if (!inviteToken.trim()) return;
    setInviteLoading(true);
    try {
      const res = await inviteApi.validate(inviteToken.trim());
      setInviteInfo(res.data);
    } catch {
      toast("Invalid or expired invite link", "error");
    }
    setInviteLoading(false);
  };

  const submitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinForm.password !== joinForm.confirm) { toast("Passwords don't match", "error"); return; }
    if (joinForm.password.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setLoading(true);
    try {
      const res = await inviteApi.accept({ token: inviteToken.trim(), name: joinForm.name, password: joinForm.password });
      setUser(res.data.user, res.data.access_token);
      toast("Welcome to the team! 🎉", "success");
      router.push("/dashboard");
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to join", "error");
    }
    setLoading(false);
  };

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Admin", MANAGER: "Manager", SALES: "Sales / Caller",
    DEVELOPER: "Developer", CLIENT: "Client", SUPER_ADMIN: "Super Admin",
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-black text-sm">N</span>
          </div>
          <h1 className="text-2xl font-black text-white">Get Started</h1>
          <p className="text-zinc-500 text-sm mt-1">Create your account</p>
        </div>

        <AnimatePresence mode="wait">
          {/* CHOOSE PATH */}
          {path === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-3">
              <button onClick={() => setPath("org")}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-5 text-left transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <Building2 size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Create Organization</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Start a new workspace — you&apos;ll be the Admin</p>
                  </div>
                </div>
              </button>

              <button onClick={() => setPath("invite")}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 text-left transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <UserPlus size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Join with Invite</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Have an invite code? Join your team here</p>
                  </div>
                </div>
              </button>

              <p className="text-center text-xs text-zinc-600 pt-2">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* CREATE ORG */}
          {path === "org" && (
            <motion.div key="org" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <button onClick={() => setPath("choose")} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors">
                <ArrowLeft size={13} /> Back
              </button>
              <form onSubmit={submitOrg} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <p className="text-sm font-bold text-white">Create your Organization</p>
                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "John Smith" },
                  { label: "Work Email", key: "email", type: "email", placeholder: "john@company.com" },
                  { label: "Organization Name", key: "orgName", type: "text", placeholder: "Acme Agency" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{f.label}</label>
                    <input type={f.type} value={(orgForm as any)[f.key]} onChange={e => setOrgForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} required
                      className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
                  </div>
                ))}
                {["password", "confirm"].map(k => (
                  <div key={k}>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{k === "password" ? "Password" : "Confirm Password"}</label>
                    <div className="relative mt-1.5">
                      <input type={showPw ? "text" : "password"} value={(orgForm as any)[k]} onChange={e => setOrgForm(p => ({ ...p, [k]: e.target.value }))}
                        placeholder="••••••••" required minLength={8}
                        className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
                      <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                  {loading ? "Creating..." : "Create Organization"}
                </button>
              </form>
            </motion.div>
          )}

          {/* JOIN WITH INVITE */}
          {path === "invite" && (
            <motion.div key="invite" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <button onClick={() => { setPath("choose"); setInviteInfo(null); setInviteToken(""); }} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors">
                <ArrowLeft size={13} /> Back
              </button>

              {!inviteInfo ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <p className="text-sm font-bold text-white">Enter your Invite Code</p>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Invite Code</label>
                    <input type="text" value={inviteToken} onChange={e => setInviteToken(e.target.value)}
                      placeholder="Paste your invite code here"
                      className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 font-mono" />
                  </div>
                  <button onClick={validateToken} disabled={inviteLoading || !inviteToken.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {inviteLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                    {inviteLoading ? "Validating..." : "Validate Invite"}
                  </button>
                </div>
              ) : (
                <form onSubmit={submitJoin} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white">Invite Valid!</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Joining <span className="text-white font-semibold">{inviteInfo.orgName}</span> as{" "}
                        <span className="text-emerald-400 font-semibold">{ROLE_LABELS[inviteInfo.role] ?? inviteInfo.role}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Invited by {inviteInfo.invitedBy}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Your Name</label>
                    <input type="text" value={joinForm.name} onChange={e => setJoinForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Full Name" required
                      className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
                  </div>
                  <div className="bg-zinc-800/40 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-zinc-500">Email: <span className="text-zinc-300">{inviteInfo.email}</span></p>
                  </div>
                  {["password", "confirm"].map(k => (
                    <div key={k}>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{k === "password" ? "Password" : "Confirm Password"}</label>
                      <div className="relative mt-1.5">
                        <input type={showPw ? "text" : "password"} value={(joinForm as any)[k]} onChange={e => setJoinForm(p => ({ ...p, [k]: e.target.value }))}
                          placeholder="••••••••" required minLength={8}
                          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
                        <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                    {loading ? "Joining..." : "Join Team"}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
