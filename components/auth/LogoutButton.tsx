"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
      >
        <LogOut className="h-3.5 w-3.5" />
        ログアウト
      </button>
    </form>
  );
}
