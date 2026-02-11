import {
  Wallet,
  Bell,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  FileText,
  LogOut,
  ClipboardList,
  CheckCircle2,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import BudgetSummary from "@/components/dashboard/BudgetSummary";
import StatusCard from "@/components/dashboard/StatusCard";
import RecentActivity, {
  type ActivityItem,
} from "@/components/dashboard/RecentActivity";
import RoleSwitcher from "@/components/dev/RoleSwitcher";
import DepartmentFilter from "@/components/dashboard/DepartmentFilter";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/workflow";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // ── フィルター対象の department を決定 ──
  // 管理者: URLパラメータ ?dept=xxx で切り替え可。空なら全体。
  // 一般ユーザー: 自分の department 固定。
  let filterDept: string | null = null;
  if (user.isAdmin) {
    const deptParam = typeof params.dept === "string" ? params.dept : "";
    filterDept = deptParam || null; // 空文字列 → null(全体)
  } else {
    filterDept = user.department; // 一般ユーザーは自分の所属固定
  }

  // ── 予算科目 (budget_funds) の取得 ──
  const { data: funds } = await supabase
    .from("budget_funds")
    .select("id, name, total_amount, year")
    .order("year", { ascending: false });

  // ── 申請データ (budget_requests) の取得 ──
  let requestsQuery = supabase
    .from("budget_requests")
    .select("id, title, amount, status, organization, created_at")
    .order("created_at", { ascending: false });

  if (filterDept) {
    requestsQuery = requestsQuery.eq("organization", filterDept);
  }

  const { data: requests } = await requestsQuery;

  // ── 部活動リスト取得（管理者のフィルター用） ──
  let departmentList: string[] = [];
  if (user.isAdmin) {
    const { data: deptData } = await supabase
      .from("budget_requests")
      .select("organization");

    if (deptData) {
      const uniqueDepts = new Set(
        deptData
          .map((r) => r.organization as string)
          .filter((d) => d && d.length > 0)
      );
      departmentList = Array.from(uniqueDepts).sort();
    }
  }

  // ── KPI 集計 ──
  const allRequests = requests ?? [];

  // 使用済み（completed）
  const usedAmount = allRequests
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.amount, 0);

  // 申請中・確保済み（completed/rejected 以外）
  const pendingAmount = allRequests
    .filter((r) => r.status !== "completed" && r.status !== "rejected")
    .reduce((sum, r) => sum + r.amount, 0);

  // 承認待ち件数（pending_* のもの）
  const pendingCount = allRequests.filter((r) =>
    (r.status as string).startsWith("pending")
  ).length;
  const pendingSum = allRequests
    .filter((r) => (r.status as string).startsWith("pending"))
    .reduce((sum, r) => sum + r.amount, 0);

  // 予算総額
  // フィルターされている場合は関連する fund のみ集計したいが、
  // fund と department の紐付けが不明確なため、全 fund 合計を使用
  const totalBudget = (funds ?? []).reduce((s, f) => s + f.total_amount, 0);
  const remaining = Math.max(0, totalBudget - usedAmount - pendingAmount);
  const remainingPct =
    totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0;

  // 今月の支出（completed で今月分）
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlySpent = allRequests
    .filter(
      (r) =>
        r.status === "completed" &&
        new Date(r.created_at) >= thisMonthStart
    )
    .reduce((sum, r) => sum + r.amount, 0);

  // ── RecentActivity 用データ変換 ──
  const activityItems: ActivityItem[] = allRequests.slice(0, 10).map((r) => ({
    id: r.id,
    title: r.title,
    organization: r.organization ?? "",
    amount: r.amount,
    status: r.status as ActivityItem["status"],
    statusLabel: STATUS_LABELS[r.status] ?? r.status,
    date: new Date(r.created_at).toLocaleDateString("ja-JP"),
  }));

  // ── 表示ラベル ──
  const scopeLabel = filterDept ? `${filterDept}` : "学校全体";
  const budgetLabel = filterDept
    ? `${filterDept} 予算（令和6年度）`
    : "全校予算（令和6年度）";

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">
              School Budget Flow
            </span>
          </div>

          <div className="flex items-center gap-2">
            <RoleSwitcher />
            {/* 通知 */}
            <button className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {/* ユーザー情報 */}
            <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {user.department.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-gray-900">
                  {user.department}
                </p>
                <p className="text-[10px] text-gray-500">
                  {user.isAdmin ? "管理者" : "一般"}
                </p>
              </div>
            </div>
            <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── メインコンテンツ ─── */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ページタイトル + アクションボタン */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              ダッシュボード
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
              <Building2 className="h-3.5 w-3.5" />
              <span>
                令和6年度 ・ {scopeLabel}
                {!user.isAdmin && "の予算状況"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/office"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              <ClipboardList className="h-4 w-4" />
              事務室
            </Link>
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              新規申請
            </Link>
          </div>
        </div>

        {/* ─── 管理者向け: 部活動フィルター ─── */}
        {user.isAdmin && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <span className="text-xs font-medium text-blue-700">表示対象:</span>
            <Suspense fallback={null}>
              <DepartmentFilter
                departments={departmentList}
                current={filterDept ?? ""}
              />
            </Suspense>
          </div>
        )}

        {/* ─── 一般ユーザー向け: 所属表示 ─── */}
        {!user.isAdmin && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {user.department}
            </span>
            <span className="text-xs text-gray-400">
              の予算データを表示しています
            </span>
          </div>
        )}

        {/* ─── KPIカード群 ─── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <KpiCard
            label="予算総額"
            value={`¥${totalBudget.toLocaleString()}`}
            icon={<Wallet className="h-4 w-4" />}
            iconBg="bg-blue-100 text-blue-600"
          />
          <KpiCard
            label="残高"
            value={`¥${remaining.toLocaleString()}`}
            sub={`${remainingPct}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            iconBg="bg-emerald-100 text-emerald-600"
          />
          <KpiCard
            label="承認待ち"
            value={`${pendingCount}件`}
            sub={`¥${pendingSum.toLocaleString()}`}
            icon={<FileText className="h-4 w-4" />}
            iconBg="bg-amber-100 text-amber-600"
          />
          <KpiCard
            label="今月の支出"
            value={`¥${monthlySpent.toLocaleString()}`}
            icon={<TrendingDown className="h-4 w-4" />}
            iconBg="bg-violet-100 text-violet-600"
          />
        </div>

        {/* ─── メイングリッド ─── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* 左カラム: 予算サマリー (3/5幅) */}
          <div className="lg:col-span-3">
            <BudgetSummary
              data={{
                total: totalBudget,
                used: usedAmount,
                pending: pendingAmount,
              }}
              label={budgetLabel}
            />
          </div>

          {/* 右カラム: ステータスカード (2/5幅) */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900">
              {filterDept ? `${filterDept} の申請状況` : "全体の申請状況"}
            </h2>

            {pendingCount > 0 && (
              <StatusCard
                type="pending"
                title={`承認待ちが${pendingCount}件あります`}
                description={`合計 ¥${pendingSum.toLocaleString()} の申請が承認フロー中です。`}
              />
            )}

            {allRequests.some((r) => r.status === "approved") && (
              <StatusCard
                type="approved"
                title="承認完了の申請があります"
                description="全ての承認が完了した申請があります。事務室で受取手続きを行ってください。"
              />
            )}

            {totalBudget > 0 && remaining / totalBudget < 0.3 && (
              <StatusCard
                type="warning"
                title="予算残高に注意"
                description={`残高が${remainingPct}%まで低下しています。今後の申請は計画的に行ってください。`}
              />
            )}

            {allRequests.length === 0 && (
              <StatusCard
                type="info"
                title="申請データがありません"
                description={
                  filterDept
                    ? `${filterDept}の申請はまだありません。`
                    : "まだ申請が作成されていません。「新規申請」から始めましょう。"
                }
              />
            )}
          </div>
        </div>

        {/* ─── 最近の申請テーブル ─── */}
        <div className="mt-6">
          <RecentActivity activities={activityItems} />
        </div>

        {/* ─── 承認フロー図（mockデータの場合のみ表示） ─── */}
        {allRequests.length > 0 &&
          allRequests.some((r) =>
            (r.status as string).startsWith("pending")
          ) && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                承認フロー概要
              </h2>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                <ApprovalStep
                  role="申請者"
                  name="提出"
                  status="done"
                  isFirst
                />
                <StepConnector done />
                <ApprovalStep
                  role="担当教員"
                  name=""
                  status="done"
                />
                <StepConnector done />
                <ApprovalStep role="教頭" name="" status="current" />
                <StepConnector />
                <ApprovalStep
                  role="副校長"
                  name=""
                  status="waiting"
                />
                <StepConnector />
                <ApprovalStep
                  role="校長"
                  name=""
                  status="waiting"
                />
                <StepConnector />
                <ApprovalStep
                  role="事務長"
                  name=""
                  status="waiting"
                  isLast
                />
              </div>
            </div>
          )}
      </main>

      {/* ─── フッター ─── */}
      <footer className="mt-8 border-t border-gray-200 bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} School Budget Flow
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3.5 w-3.5" />
            <span>オンライン: 12人</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── KPI カード ─── */
function KpiCard({
  label,
  value,
  sub,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 sm:text-xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/* ─── 承認フローのステップ ─── */
function ApprovalStep({
  role,
  name,
  status,
  isFirst,
  isLast,
}: {
  role: string;
  name: string;
  status: "done" | "current" | "waiting";
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const ringColor =
    status === "done"
      ? "border-emerald-500 bg-emerald-50"
      : status === "current"
        ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
        : "border-gray-300 bg-gray-50";

  const dotColor =
    status === "done"
      ? "bg-emerald-500"
      : status === "current"
        ? "bg-blue-500 animate-pulse"
        : "bg-gray-300";

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${ringColor}`}
      >
        {status === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <span className={`h-3 w-3 rounded-full ${dotColor}`} />
        )}
      </div>
      <span className="text-[11px] font-semibold text-gray-700">{role}</span>
      {name && <span className="text-[10px] text-gray-400">{name}</span>}
    </div>
  );
}

/* ─── ステップ間のコネクター ─── */
function StepConnector({ done }: { done?: boolean }) {
  return (
    <div
      className={`mx-1 h-0.5 w-8 shrink-0 rounded-full sm:w-12 ${
        done ? "bg-emerald-400" : "bg-gray-200"
      }`}
    />
  );
}
