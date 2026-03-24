"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/Toast";

const ORBS = [
  { color: "bg-blue-600/20", size: "w-[500px] h-[500px]", pos: "top-[-15%] left-[-10%]", blur: "blur-[130px]", delay: 0 },
  { color: "bg-violet-600/15", size: "w-[400px] h-[400px]", pos: "bottom-[-10%] right-[-8%]", blur: "blur-[120px]", delay: 1.5 },
  { color: "bg-indigo-500/10", size: "w-[600px] h-[600px]", pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", blur: "blur-[160px]", delay: 3 },
  { color: "bg-cyan-500/8", size: "w-[300px] h-[300px]", pos: "top-[60%] left-[10%]", blur: "blur-[100px]", delay: 0.8 },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser, token } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setUser(res.data.user, res.data.access_token);
      toast("Welcome back! 🎉", "success");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid credentials";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setEmail("nic@niche.com");
    setPassword("niche123");
  };

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center relative overflow-hidden">
      {/* Animated orbs */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
          className={`absolute ${orb.pos} ${orb.size} ${orb.color} rounded-full ${orb.blur} pointer-events-none`}
        />
      ))}

      {/* Grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`p${i}`}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * 15, 0],
          }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}
          className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
          style={{ left: `${15 + i * 14}%`, top: `${30 + (i % 3) * 20}%` }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Card glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-3xl blur-xl" />

        {/* Card */}
        <div className="relative bg-zinc-900/70 backdrop-blur-2xl border border-white/8 rounded-2xl shadow-2xl shadow-black/70 p-8 overflow-hidden">
          {/* Inner shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-8 relative">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4 relative overflow-hidden"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
              <Sparkles size={22} className="text-white relative z-10" />
            </motion.div>
            <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1">Sign in to Niche CRM</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === "email" ? "text-indigo-400" : "text-zinc-600"}`} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full bg-zinc-800/50 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 ${
                    focusedField === "email"
                      ? "border-indigo-500/60 ring-2 ring-indigo-500/15 shadow-lg shadow-indigo-500/5"
                      : "border-zinc-700/60 hover:border-zinc-600/60"
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === "password" ? "text-indigo-400" : "text-zinc-600"}`} />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full bg-zinc-800/50 border rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 ${
                    focusedField === "password"
                      ? "border-indigo-500/60 ring-2 ring-indigo-500/15 shadow-lg shadow-indigo-500/5"
                      : "border-zinc-700/60 hover:border-zinc-600/60"
                  }`}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-0.5">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 mt-2 overflow-hidden group"
            >
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-disabled:hidden"
              />
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>

          {/* Demo */}
          <button
            onClick={demoLogin}
            className="w-full mt-3 py-3 rounded-xl border border-zinc-700/60 text-zinc-400 text-sm hover:bg-zinc-800/50 hover:text-zinc-200 hover:border-zinc-600/60 transition-all font-medium"
          >
            Use demo credentials
          </button>

          <p className="text-center text-xs text-zinc-700 mt-5">
            No account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Create one →
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-zinc-800 mt-4 font-bold uppercase tracking-widest">Niche CRM · Agency OS · v2.0</p>
      </motion.div>
    </div>
  );
}
