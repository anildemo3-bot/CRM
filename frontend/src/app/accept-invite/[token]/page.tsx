"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { inviteApi } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/Toast";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", MANAGER: "Manager", SALES: "Sales / Caller",
  DEVELOPER: "Developer", CLIENT: "Client",
};

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { setUser } = useAuthStore();
  const { toast } = useToast();

  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inviteApi.validate(token)
      .then(res => setInviteInfo(res.data))
      .catch(() => setError("This invite link is invalid or has expired."))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast("Passwords don't match", "error"); return; }
    if (form.password.length < 8) { toast("Min 8 characters", "error"); return; }
    setSubmitting(true);
    try {
      const res = await inviteApi.accept({ token, name: form.name, password: form.password });
      setUser(res.data.user, res.data.access_token);
      toast("Welcome to the team! 🎉", "success");
      router.push("/dashboard");
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to join", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-black text-sm">N</span>
          </div>
          <h1 className="text-2xl font-black text-white">You&apos;re Invited</h1>
          <p className="text-zinc-500 text-sm mt-1">Set up your account to get started</p>
        </div>

        {loadingInvite && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-zinc-500" size={24} />
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
            <XCircle size={32} className="text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">{error}</p>
            <button onClick={() => router.push("/register")} className="mt-4 text-xs text-blue-400 hover:text-blue-300">
              Go to Register
            </button>
          </motion.div>
        )}

        {inviteInfo && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white">
                  Join <span className="text-emerald-400">{inviteInfo.orgName}</span>
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Role: <span className="text-white font-semibold">{ROLE_LABELS[inviteInfo.role] ?? inviteInfo.role}</span>
                  {" · "}Invited by {inviteInfo.invitedBy}
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name" required
                  className="w-full mt-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
              </div>
              <div className="bg-zinc-800/40 rounded-xl px-3 py-2.5">
                <p className="text-xs text-zinc-500">Email: <span className="text-zinc-300">{inviteInfo.email}</span></p>
              </div>
              {["password", "confirm"].map(k => (
                <div key={k}>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {k === "password" ? "Password" : "Confirm Password"}
                  </label>
                  <div className="relative mt-1.5">
                    <input type={showPw ? "text" : "password"} value={(form as any)[k]}
                      onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                      placeholder="••••••••" required minLength={8}
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                {submitting ? "Creating account..." : "Create Account & Join"}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
