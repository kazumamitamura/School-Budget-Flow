import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Wallet,
  ArrowLeft,
  ClipboardList,
  Banknote,
  Package,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { STATUS_LABELS } from "@/lib/workflow";
import RoleSwitcher from "@/components/dev/RoleSwitcher";
import {
  ReadyForPaymentButton,
  CompletedButton,
} from "@/components/office/PaymentActions";

export const metadata = {
  title: "事務室 出納管理 - School Budget Flow",
};

interface RequestRow {
  id: string;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  budget_profiles: { full_name: string; department: string } | null;
  budget_funds: { name: string } | null;
}

export default async function OfficePage() {
  // ── 権限チェック（DEV Cookie） ──
  const cookieStore = await cookies();
  const currentRole = cookieStore.get("dev_role")?.value ?? "student";
  const hasAccess = ["accounting", "office_chief"].includes(currentRole);

  if (!hasAccess) {
    redirect("/?error=unauthorized");
  }

  // ── 承認済み（準備待ち）案件を取得 ──
  const { data: approvedRequests } = await supabase
    .from("budget_requests")
    .select(
      `
      id, title, amount, status, created_at, updated_at,
      budget_profiles!budget_requests_user_id_fkey ( full_name, department ),
      budget_funds!budget_requests_fund_id_fkey ( name )
    `
    )
    .eq("status", "approved")
    .order("updated_at", { ascending: true });

  // ── 現金準備済み（受取待ち）案件を取得 ──
  const { data: readyRequests } = await supabase
    .from("budget_requests")
    .select(
      `
      id, title, amount, status, created_at, updated_at,
      budget_profiles!budget_requests_user_id_fkey ( full_name, department ),
      budget_funds!budget_requests_fund_id_fkey ( name )
    `
    )
    .eq("status", "ready_for_payment")
    .order("updated_at", { ascending: true });

  const approved = (approvedRequests ?? []) as unknown as RequestRow[];
  const ready = (readyRequests ?? []) as unknown as RequestRow[];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">
              School Budget Flow
            </span>
          </Link>
          <RoleSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* 戻るリンク */}
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>

        {/* ページタイトル */}
        <div className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            事務室 出納管理
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            承認済み案件の現金準備と引き渡しを管理します。
          </p>
        </div>

        {/* ── KPIサマリー ── */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Banknote className="h-4 w-4" />
              <span className="text-xs font-medium">準備待ち</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {approved.length}件
            </p>
            <p className="text-xs text-blue-600">
              ¥{approved.reduce((s, r) => s + r.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium">受取待ち</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-900">
              {ready.length}件
            </p>
            <p className="text-xs text-amber-600">
              ¥{ready.reduce((s, r) => s + r.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <ClipboardList className="h-4 w-4" />
              <span className="text-xs font-medium">合計</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {approved.length + ready.length}件
            </p>
            <p className="text-xs text-gray-500">
              ¥
              {[...approved, ...ready]
                .reduce((s, r) => s + r.amount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            A. 準備待ちリスト (approved)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
              <Banknote className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              準備待ちリスト
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {approved.length}
            </span>
          </div>

          {approved.length === 0 ? (
            <EmptyState message="準備待ちの案件はありません。" />
          ) : (
            <div className="space-y-3">
              {approved.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  action={<ReadyForPaymentButton requestId={req.id} />}
                />
              ))}
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            B. 受取待ちリスト (ready_for_payment)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <Package className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              受取待ちリスト
            </h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {ready.length}
            </span>
          </div>

          {ready.length === 0 ? (
            <EmptyState message="受取待ちの案件はありません。" />
          ) : (
            <div className="space-y-3">
              {ready.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  action={
                    <CompletedButton
                      requestId={req.id}
                      title={req.title}
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* 注意事項 */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <h3 className="text-xs font-semibold text-amber-800">
                出納時の注意
              </h3>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
                <li>
                  ・「引き渡し完了」を押すと支出が確定します（取消不可）。
                </li>
                <li>
                  ・現金を渡す際は、必ず領収書の受け取りを確認してください。
                </li>
                <li>
                  ・「現金準備完了」を押すと、申請者に通知メールが送信されます。
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── 案件カード ─── */
function RequestCard({
  request,
  action,
}: {
  request: RequestRow;
  action: React.ReactNode;
}) {
  const profile = request.budget_profiles;
  const fund = request.budget_funds;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/requests/${request.id}`}
            className="truncate text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600"
          >
            {request.title}
          </Link>
          <Link
            href={`/requests/${request.id}`}
            className="shrink-0 text-gray-400 hover:text-blue-500"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
          <span>
            申請者: {profile?.full_name ?? "不明"}（
            {profile?.department ?? ""}）
          </span>
          <span>予算: {fund?.name ?? "不明"}</span>
          <span>
            更新:{" "}
            {new Date(request.updated_at).toLocaleDateString("ja-JP")}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-base font-bold text-gray-900">
            ¥{request.amount.toLocaleString()}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            {STATUS_LABELS[request.status] ?? request.status}
          </span>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

/* ─── 空状態 ─── */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
