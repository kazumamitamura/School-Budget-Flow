"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter } from "lucide-react";

interface DepartmentFilterProps {
  /** 選択可能な部活動・所属の一覧 */
  departments: string[];
  /** 現在選択中の値（"" = 全て） */
  current: string;
}

export default function DepartmentFilter({
  departments,
  current,
}: DepartmentFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("dept", value);
    } else {
      params.delete("dept");
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-gray-400" />
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
      >
        <option value="">全体（学校全体）</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      )}
    </div>
  );
}
