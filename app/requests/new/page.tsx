import { Wallet, FilePlus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RequestForm from "@/components/requests/RequestForm";

export const metadata = {
  title: "新規申請 - School Budget Flow",
};

export default async function NewRequestPage() {
  // ── budget_funds テーブルから予算科目を取得 ──
  const { data: funds, error } = await supabase
    .from("budget_funds")
    .select("id, name, year, total_amount")
    .order("year", { ascending: false });

  if (error) {
    console.error("budget_funds fetch error:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">
              School Budget Flow
            </span>
          </Link>
        </div>
      </header>

      {/* ─── メインコンテンツ ─── */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* ページタイトル */}
        <div className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
            <FilePlus className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            新規申請を作成
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            予算の使用申請を作成します。すべての必須項目を入力して提出してください。
          </p>
        </div>

        {/* フォームカード */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <RequestForm funds={funds ?? []} />
        </div>

        {/* 補足情報 */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <h3 className="text-xs font-semibold text-blue-800">
            申請後の流れ
          </h3>
          <ol className="mt-2 space-y-1 text-xs leading-relaxed text-blue-700">
            <li>
              1. 申請を提出すると、担当教員 → 教頭 → 副校長 → 校長 → 事務長
              の順に承認フローが開始されます。
            </li>
            <li>
              2.
              すべての承認が完了すると、事務室から受取の連絡があります。
            </li>
            <li>
              3. ダッシュボードの「あなたの申請状況」から進捗を確認できます。
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
