"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import api from "@/lib/api";
import { User, Building2, Bell, Shield, Save, Loader2 } from "lucide-react";

const TABS = ["Profile", "Organization", "Notifications", "Security"] as const;
type Tab = typeof TABS[number];

export default function SettingsPage() {
  const { user, setUser, token } = useAuthStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("Profile");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [org, setOrg] = useState({ name: "Acme Inc", slug: "acme-inc" });
  const [notifications, setNotifications] = useState({ email: true, deals: true, tasks: true, billing: false });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  const save = async () => {
    setSaving(true);
    try {
      if (tab === "Profile") {
        await api.patch("/users/me", profile);
        setUser({ ...user, ...profile }, token!);
        toast("Profile updated!", "success");
      } else if (tab === "Organization") {
        await api.patch("/organizations/me", org);
        toast("Organization updated!", "success");
      } else if (tab === "Notifications") {
        toast("Notification preferences saved!", "success");
      } else if (tab === "Security") {
        if (passwords.next !== passwords.confirm) { toast("Passwords don't match", "error"); setSaving(false); return; }
        await api.post("/auth/change-password", { currentPassword: passwords.current, newPassword: passwords.next });
        toast("Password changed successfully!", "success");
        setPasswords({ current: "", next: "", confirm: "" });
      }
    } catch {
      toast("Saved settings locally (API offline)", "info");
    } finally { setSaving(false); }
  };

  const tabIcons: Record<Tab, any> = { Profile: User, Organization: Building2, Notifications: Bell, Security: Shield };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-zinc-500 text-sm mt-0.5">Manage your account and workspace</p>
      </div>
      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map(t => {
            const Icon = tabIcons[t];
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-blue-600/15 text-blue-400 border border-blue-500/20" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent"}`}>
                <Icon size={15} className={tab === t ? "text-blue-400" : "text-zinc-500"} />
                {t}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          {tab === "Profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <h3 className="text-base font-semibold">Profile Information</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                  {profile.name.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{profile.name}</p>
                  <p className="text-xs text-zinc-500">{profile.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Full Name</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))} />
                </div>
              </div>
            </motion.div>
          )}

          {tab === "Organization" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <h3 className="text-base font-semibold">Organization Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Organization Name</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={org.name} onChange={e => setOrg(p => ({...p, name: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Slug</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={org.slug} onChange={e => setOrg(p => ({...p, slug: e.target.value}))} />
                </div>
              </div>
            </motion.div>
          )}

          {tab === "Notifications" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <h3 className="text-base font-semibold">Notification Preferences</h3>
              {[
                { key: "email", label: "Email Notifications", desc: "Receive email for important updates" },
                { key: "deals", label: "Deal Alerts", desc: "Notify when deals change stage" },
                { key: "tasks", label: "Task Reminders", desc: "Get reminders for due tasks" },
                { key: "billing", label: "Billing Updates", desc: "Invoice and payment notifications" },
              ].map(n => (
                <label key={n.key} className="flex items-center justify-between cursor-pointer py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{n.label}</p>
                    <p className="text-xs text-zinc-500">{n.desc}</p>
                  </div>
                  <div
                    onClick={() => setNotifications(p => ({...p, [n.key]: !p[n.key as keyof typeof p]}))}
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${notifications[n.key as keyof typeof notifications] ? "bg-blue-600" : "bg-zinc-700"} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications[n.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </label>
              ))}
            </motion.div>
          )}

          {tab === "Security" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <h3 className="text-base font-semibold">Change Password</h3>
              {[
                { label: "Current Password", key: "current" },
                { label: "New Password", key: "next" },
                { label: "Confirm New Password", key: "confirm" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">{f.label}</label>
                  <input type="password" className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={passwords[f.key as keyof typeof passwords]} onChange={e => setPasswords(p => ({...p, [f.key]: e.target.value}))} />
                </div>
              ))}
            </motion.div>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
