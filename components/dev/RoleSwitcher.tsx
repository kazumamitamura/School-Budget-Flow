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

/** デモ用の所属リスト */
const DEPARTMENTS = [
  "生徒会",
  "野球部",
  "サッカー部",
  "バスケ部",
  "美術部",
  "放送部",
  "図書委員会",
  "理科",
  "体育科",
  "事務室",
  "3年1組",
  "3年2組",
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
  const [department, setDepartment] = useState<string>("生徒会");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const savedRole = getCookie("dev_role");
    const savedDept = getCookie("dev_department");
    if (savedRole) setRole(savedRole);
    if (savedDept) setDepartment(savedDept);
  }, []);

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    setCookie("dev_role", newRole);
    startTransition(() => {
      router.refresh();
    });
  }

  function handleDeptChange(newDept: string) {
    setDepartment(newDept);
    setCookie("dev_department", newDept);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-2.5 py-1.5">
      <Wrench className="h-3.5 w-3.5 text-orange-500" />
      <span className="hidden text-[10px] font-medium text-orange-600 sm:inline">
        DEV
      </span>

      {/* 役職セレクト */}
      <select
        value={role}
        onChange={(e) => handleRoleChange(e.target.value)}
        disabled={isPending}
        className="rounded border border-orange-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r] ?? r}
          </option>
        ))}
      </select>

      {/* 所属セレクト */}
      <select
        value={department}
        onChange={(e) => handleDeptChange(e.target.value)}
        disabled={isPending}
        className="rounded border border-orange-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 disabled:opacity-50"
      >
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
