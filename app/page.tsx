import {
  Wallet,
  Bell,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  FileText,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import BudgetSummary from "@/components/dashboard/BudgetSummary";
import StatusCard from "@/components/dashboard/StatusCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RoleSwitcher from "@/components/dev/RoleSwitcher";

export default function DashboardPage() {
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
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            {/* ユーザー情報 */}
            <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                田
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-gray-900">田中 太郎</p>
                <p className="text-[10px] text-gray-500">生徒会</p>
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
        {/* ページタイトル + 新規申請ボタン */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              ダッシュボード
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              令和6年度 ・ 生徒会予算の状況
            </p>
          </div>
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            新規申請
          </Link>
        </div>

        {/* ─── KPIカード群 ─── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <KpiCard
            label="今年度予算"
            value="¥1,000,000"
            icon={<Wallet className="h-4 w-4" />}
            iconBg="bg-blue-100 text-blue-600"
          />
          <KpiCard
            label="残高"
            value="¥600,000"
            sub="60%"
            icon={<TrendingUp className="h-4 w-4" />}
            iconBg="bg-emerald-100 text-emerald-600"
          />
          <KpiCard
            label="承認待ち"
            value="2件"
            sub="¥50,000"
            icon={<FileText className="h-4 w-4" />}
            iconBg="bg-amber-100 text-amber-600"
          />
          <KpiCard
            label="今月の支出"
            value="¥77,000"
            sub="前月比 +12%"
            icon={<TrendingDown className="h-4 w-4" />}
            iconBg="bg-violet-100 text-violet-600"
          />
        </div>

        {/* ─── メイングリッド ─── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* 左カラム: 予算サマリー (3/5幅) */}
          <div className="lg:col-span-3">
            <BudgetSummary />
          </div>

          {/* 右カラム: ステータスカード (2/5幅) */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900">
              あなたの申請状況
            </h2>
            <StatusCard
              type="pending"
              title="文化祭備品購入"
              description="現在、教頭先生の承認待ちです。提出から2日が経過しています。"
              timestamp="2024年11月18日 提出"
            />
            <StatusCard
              type="approved"
              title="理科実験器具の補充"
              description="全ての承認が完了しました。事務室で受取手続きを行ってください。"
              timestamp="2024年11月15日 全承認完了"
            />
            <StatusCard
              type="warning"
              title="予算残高に注意"
              description="生徒会費の残高が60%を下回りました。今後の申請は計画的に行ってください。"
            />
          </div>
        </div>

        {/* ─── 最近の申請テーブル ─── */}
        <div className="mt-6">
          <RecentActivity />
        </div>

        {/* ─── 承認フロー図 ─── */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            承認フロー（文化祭備品購入）
          </h2>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            <ApprovalStep
              role="申請者"
              name="田中 太郎"
              status="done"
              isFirst
            />
            <StepConnector done />
            <ApprovalStep role="担当教員" name="佐藤 先生" status="done" />
            <StepConnector done />
            <ApprovalStep
              role="教頭"
              name="鈴木 教頭"
              status="current"
            />
            <StepConnector />
            <ApprovalStep role="副校長" name="高橋 副校長" status="waiting" />
            <StepConnector />
            <ApprovalStep role="校長" name="山田 校長" status="waiting" />
            <StepConnector />
            <ApprovalStep
              role="事務長"
              name="伊藤 事務長"
              status="waiting"
              isLast
            />
          </div>
        </div>
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
        <span className={`h-3 w-3 rounded-full ${dotColor}`} />
      </div>
      <span className="text-[11px] font-semibold text-gray-700">{role}</span>
      <span className="text-[10px] text-gray-400">{name}</span>
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
