import Link from "next/link";
import { Wallet, User, Building2, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900">
            School Budget Flow
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            {/* ユーザー情報 */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {user.fullName || "未設定"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span>{user.department || "未設定"}</span>
              </div>
            </div>

            {/* ログアウトボタン */}
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
