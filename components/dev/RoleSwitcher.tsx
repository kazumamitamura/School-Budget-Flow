"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { ROLE_LABELS } from "@/lib/workflow";

const ROLES = [
  "student",
  "teacher",
  "kyoto",
  "vice_principal",
  "principal",
  "office_chief",
  "chairman",
  "accounting",
] as const;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export default function RoleSwitcher() {
  const [role, setRole] = useState<string>("student");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const saved = getCookie("dev_role");
    if (saved) setRole(saved);
  }, []);

  function handleChange(newRole: string) {
    setRole(newRole);
    setCookie("dev_role", newRole);
    // ページをリフレッシュして Server Component に Cookie を反映
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-2.5 py-1.5">
      <Wrench className="h-3.5 w-3.5 text-orange-500" />
      <span className="hidden text-[10px] font-medium text-orange-600 sm:inline">
        DEV
      </span>
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="rounded border border-orange-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r] ?? r}
          </option>
        ))}
      </select>
    </div>
  );
}
