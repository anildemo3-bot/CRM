"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, User, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", orgName: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast("Passwords don't match", "error"); return; }
    if (form.password.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        organizationName: form.orgName,
      });
      setUser(res.data.user, res.data.access_token);
      toast("Account created! Welcome 🎉", "success");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Registration failed";
      toast(Array.isArray(msg) ? msg[0] : msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const INPUT_CLASS = "w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all";

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl shadow-black/60 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-500/30 mb-4">
              N
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-zinc-500 text-sm mt-1">Start your agency OS free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input required placeholder="John Smith" value={form.name} onChange={e => set("name", e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Work Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input required type="email" placeholder="you@agency.com" value={form.email} onChange={e => set("email", e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>

            {/* Org Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Agency / Company Name</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input required placeholder="Acme Ventures" value={form.orgName} onChange={e => set("orgName", e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input required type={showPass ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={e => set("password", e.target.value)} className={INPUT_CLASS + " pr-10"} />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input required type="password" placeholder="Re-enter password" value={form.confirm} onChange={e => set("confirm", e.target.value)}
                  className={INPUT_CLASS + (form.confirm && form.password !== form.confirm ? " border-red-500/60" : "")} />
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-400 mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign in →
            </Link>
          </p>

          <p className="text-center text-[10px] text-zinc-700 mt-4">
            By signing up you agree to our Terms & Privacy Policy.
          </p>
        </div>

        <p className="text-center text-[10px] text-zinc-700 mt-4">Niche CRM · Agency OS · v2.0</p>
      </motion.div>
    </div>
  );
}
