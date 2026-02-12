import { Wallet } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "新規登録 - School Budget Flow",
};

export default async function SignupPage() {
  // budget_funds から部活動リストを取得（ドロップダウン用）
  const supabase = await createClient();
  const { data: funds } = await supabase
    .from("budget_funds")
    .select("name")
    .order("name", { ascending: true });

  // 部活動名の重複排除リスト
  const departments = Array.from(
    new Set((funds ?? []).map((f) => f.name as string))
  );

  // 管理系を追加
  if (!departments.includes("事務室")) departments.push("事務室");
  if (!departments.includes("生徒会")) departments.push("生徒会");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            School Budget Flow
          </h1>
          <p className="mt-1 text-sm text-gray-500">アカウントを作成</p>
        </div>

        {/* フォームカード */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            新規登録
          </h2>
          <SignupForm departments={departments} />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          既にアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            ログインはこちら
          </Link>
        </p>
      </div>
    </div>
  );
}
