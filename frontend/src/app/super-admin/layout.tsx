"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { LogOut, Building2, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    if (user?.role !== "SUPER_ADMIN") router.replace("/dashboard");
  }, [token, user]);

  if (!token || user?.role !== "SUPER_ADMIN") return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Super Admin</p>
            <p className="text-[10px] text-zinc-500">Platform Control</p>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { href: "/super-admin", label: "Dashboard", icon: BarChart3 },
            { href: "/super-admin/orgs", label: "Organizations", icon: Building2 },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <item.icon size={15} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 pt-4 mt-4">
          <p className="text-xs font-semibold text-white px-2 mb-1">{user?.name}</p>
          <p className="text-[10px] text-zinc-600 px-2 mb-3">{user?.email}</p>
          <button onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
