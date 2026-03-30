"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  /** Roles that are allowed to access this page */
  allowedRoles: string[];
  children: React.ReactNode;
}

// These roles have full visibility — they can view any dashboard
const FULL_ACCESS_ROLES = ["ADMIN", "MANAGER", "SUPER_ADMIN", "SALES"];

// Where each restricted role should land when they try a page they don't own
const ROLE_HOME: Record<string, string> = {
  DEVELOPER:   "/dashboard/developer",
  COLD_CALLER: "/dashboard/cold-callers",
  OUTREACHER:  "/dashboard/outreach",
  FREELANCER:  "/dashboard/freelancer",
};

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const hasAccess = (() => {
    if (!user || !token) return false;
    if (FULL_ACCESS_ROLES.includes(user.role)) return true;
    return allowedRoles.includes(user.role);
  })();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!user) return;
    if (FULL_ACCESS_ROLES.includes(user.role)) return;
    if (!allowedRoles.includes(user.role)) {
      // Send the user directly to their own dashboard — no double-hop
      const home = ROLE_HOME[user.role] ?? "/dashboard";
      router.replace(home);
    }
  }, [user, token, router, allowedRoles]);

  // Not authenticated — layout handles the redirect, show nothing
  if (!token || !user) return null;

  // Access granted — render
  if (hasAccess) return <>{children}</>;

  // Access denied — show spinner while redirect fires (never flashes content)
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="animate-spin text-zinc-600" size={22} />
      <p className="text-xs text-zinc-600 font-semibold">Redirecting to your dashboard…</p>
    </div>
  );
}
