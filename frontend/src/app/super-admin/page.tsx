"use client";
import { useState, useEffect } from "react";
import { Building2, Users, BarChart3, CheckSquare, Loader2 } from "lucide-react";
import { superAdminApi } from "@/lib/endpoints";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([superAdminApi.stats(), superAdminApi.orgs()])
      .then(([s, o]) => { setStats(s.data); setOrgs(o.data || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-600" size={24} /></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">Platform Overview</h1>
        <p className="text-zinc-500 text-sm mt-1">All organizations across the platform</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Organizations", value: stats?.orgs, icon: Building2, color: "text-blue-400" },
          { label: "Total Users", value: stats?.users, icon: Users, color: "text-emerald-400" },
          { label: "Total Deals", value: stats?.deals, icon: BarChart3, color: "text-violet-400" },
          { label: "Total Tasks", value: stats?.tasks, icon: CheckSquare, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <s.icon size={18} className={s.color + " mb-3"} />
            <p className={`text-3xl font-black ${s.color}`}>{s.value ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Organizations</h2>
        <div className="space-y-2">
          {orgs.slice(0, 10).map((org: any) => (
            <div key={org.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                {org.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{org.name}</p>
                <p className="text-xs text-zinc-500">{org.slug}</p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>{org._count?.users ?? 0} users</p>
                <p>{org._count?.deals ?? 0} deals</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
