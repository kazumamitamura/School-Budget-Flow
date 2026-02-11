import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Wallet,
  ArrowLeft,
  Calendar,
  Coins,
  FolderOpen,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  APPROVAL_FLOW,
  getCompletedStepIndex,
  getRequiredRole,
  ROLE_LABELS,
  STATUS_LABELS,
} from "@/lib/workflow";
import RoleSwitcher from "@/components/dev/RoleSwitcher";
import ApprovalPanel from "@/components/requests/ApprovalPanel";

export const metadata = {
  title: "申請詳細 - School Budget Flow",
};

interface Approval {
  id: string;
  approver_role: string;
  status: "approved" | "rejected";
  comment: string;
  approved_at: string;
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── 申請データ取得 ──
  const { data: request, error } = await supabase
    .from("budget_requests")
    .select(
      `
      id, title, amount, reason, status, created_at, updated_at,
      budget_profiles!budget_requests_user_id_fkey ( full_name, department, role ),
      budget_funds!budget_requests_fund_id_fkey ( name, year, total_amount )
    `
    )
    .eq("id", id)
    .single();

  if (error || !request) {
    notFound();
  }

  // ── 承認履歴取得 ──
  const { data: approvals } = await supabase
    .from("budget_approvals")
    .select("id, approver_role, status, comment, approved_at")
    .eq("request_id", id)
    .order("approved_at", { ascending: true });

  // ── DevTool: Cookie から現在の役職を取得 ──
  const cookieStore = await cookies();
  const currentRole = cookieStore.get("dev_role")?.value ?? "student";
  const requiredRole = getRequiredRole(request.status);
  const canApprove = requiredRole !== null && currentRole === requiredRole;
  const isRejected = request.status === "rejected";
  const isTerminal = ["approved", "ready_for_payment", "completed"].includes(
    request.status
  );
  const completedIdx = getCompletedStepIndex(request.status);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = request.budget_profiles as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fund = request.budget_funds as any;

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
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ━━━ 左カラム: 申請内容 (2/3) ━━━ */}
          <div className="space-y-6 lg:col-span-2">
            {/* 申請ヘッダー */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* ステータスバッジ */}
              <div className="mb-4">
                <StatusBadge status={request.status} />
              </div>

              <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
                {request.title}
              </h1>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<Coins className="h-4 w-4" />}
                  label="申請金額"
                  value={`¥${request.amount.toLocaleString()}`}
                  highlight
                />
                <InfoRow
                  icon={<FolderOpen className="h-4 w-4" />}
                  label="予算科目"
                  value={
                    fund
                      ? `${fund.name}（${fund.year}年度）`
                      : "不明"
                  }
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="申請者"
                  value={
                    profile
                      ? `${profile.full_name}（${profile.department}）`
                      : "不明"
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="申請日"
                  value={new Date(request.created_at).toLocaleDateString(
                    "ja-JP"
                  )}
                />
              </div>
            </div>

            {/* 理由・詳細 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-gray-400" />
                理由・詳細
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {request.reason || "（理由の記載なし）"}
              </p>
            </div>

            {/* ━━━ 承認タイムライン ━━━ */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-sm font-semibold text-gray-900">
                承認フロー
              </h2>
              <div className="space-y-0">
                {/* 申請者ステップ (常にdone) */}
                <TimelineStep
                  label="申請者"
                  sublabel={
                    profile
                      ? `${profile.full_name} が提出`
                      : "提出済み"
                  }
                  status="done"
                  date={new Date(request.created_at).toLocaleDateString(
                    "ja-JP"
                  )}
                  isFirst
                />

                {/* 各承認ステップ */}
                {APPROVAL_FLOW.map((step, idx) => {
                  // 却下された場合の処理
                  const rejectedAtThisStep =
                    isRejected &&
                    (approvals as Approval[] | null)?.some(
                      (a) =>
                        a.approver_role === step.role &&
                        a.status === "rejected"
                    );

                  const approval = (approvals as Approval[] | null)?.find(
                    (a) =>
                      a.approver_role === step.role &&
                      a.status === "approved"
                  );

                  let stepStatus: "done" | "current" | "waiting" | "rejected";
                  if (rejectedAtThisStep) {
                    stepStatus = "rejected";
                  } else if (approval) {
                    stepStatus = "done";
                  } else if (idx === completedIdx) {
                    stepStatus = "current";
                  } else {
                    stepStatus = "waiting";
                  }

                  return (
                    <TimelineStep
                      key={step.status}
                      label={step.label}
                      sublabel={
                        approval
                          ? `承認済み${approval.comment ? ` — ${approval.comment}` : ""}`
                          : rejectedAtThisStep
                            ? `却下${
                                (approvals as Approval[] | null)?.find(
                                  (a) =>
                                    a.approver_role === step.role &&
                                    a.status === "rejected"
                                )?.comment
                                  ? ` — ${(approvals as Approval[] | null)?.find((a) => a.approver_role === step.role && a.status === "rejected")?.comment}`
                                  : ""
                              }`
                            : stepStatus === "current"
                              ? "承認待ち"
                              : ""
                      }
                      status={stepStatus}
                      date={
                        approval
                          ? new Date(approval.approved_at).toLocaleDateString(
                              "ja-JP"
                            )
                          : undefined
                      }
                      isLast={idx === APPROVAL_FLOW.length - 1 && !isTerminal}
                    />
                  );
                })}

                {/* 全承認完了ステップ */}
                {(isTerminal ||
                  completedIdx === APPROVAL_FLOW.length) && (
                  <TimelineStep
                    label="決裁完了"
                    sublabel={STATUS_LABELS[request.status] ?? ""}
                    status="done"
                    isLast
                  />
                )}
              </div>
            </div>
          </div>

          {/* ━━━ 右カラム: 承認アクション (1/3) ━━━ */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              承認アクション
            </h2>

            {isRejected ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <XCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm font-semibold text-red-700">
                  この申請は却下されました
                </p>
              </div>
            ) : isTerminal ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-700">
                  全ての承認が完了しています
                </p>
                <p className="text-xs text-emerald-600">
                  {STATUS_LABELS[request.status]}
                </p>
              </div>
            ) : (
              <ApprovalPanel
                requestId={request.id}
                canApprove={canApprove}
                requiredRoleLabel={
                  requiredRole ? (ROLE_LABELS[requiredRole] ?? requiredRole) : ""
                }
                currentRoleLabel={ROLE_LABELS[currentRole] ?? currentRole}
              />
            )}

            {/* 承認履歴 */}
            {(approvals as Approval[] | null) &&
              (approvals as Approval[]).length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold text-gray-500">
                    承認履歴
                  </h3>
                  <div className="space-y-3">
                    {(approvals as Approval[]).map((a) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            a.status === "approved"
                              ? "bg-emerald-100"
                              : "bg-red-100"
                          }`}
                        >
                          {a.status === "approved" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-700">
                            {ROLE_LABELS[a.approver_role] ?? a.approver_role}
                            {a.status === "approved"
                              ? " が承認"
                              : " が却下"}
                          </p>
                          {a.comment && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {a.comment}
                            </p>
                          )}
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {new Date(a.approved_at).toLocaleString("ja-JP")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── ステータスバッジ ─── */
function StatusBadge({ status }: { status: string }) {
  const isPending = status.startsWith("pending");
  const colorClass = {
    draft: "bg-gray-100 text-gray-600",
    rejected: "bg-red-100 text-red-700",
    approved: "bg-emerald-100 text-emerald-700",
    ready_for_payment: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
  }[status] ?? (isPending ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600");

  const icon = isPending ? (
    <Clock className="h-3.5 w-3.5" />
  ) : status === "rejected" ? (
    <XCircle className="h-3.5 w-3.5" />
  ) : (
    <CheckCircle2 className="h-3.5 w-3.5" />
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
    >
      {icon}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ─── 情報行 ─── */
function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`text-sm font-medium ${highlight ? "text-blue-600" : "text-gray-900"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── タイムラインステップ ─── */
function TimelineStep({
  label,
  sublabel,
  status,
  date,
  isFirst,
  isLast,
}: {
  label: string;
  sublabel?: string;
  status: "done" | "current" | "waiting" | "rejected";
  date?: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const dotClass = {
    done: "border-emerald-500 bg-emerald-500",
    current: "border-blue-500 bg-blue-500 ring-4 ring-blue-100 animate-pulse",
    waiting: "border-gray-300 bg-white",
    rejected: "border-red-500 bg-red-500",
  }[status];

  const lineClass =
    status === "done" || status === "rejected"
      ? "bg-emerald-300"
      : "bg-gray-200";

  const iconInDot =
    status === "done" ? (
      <CheckCircle2 className="h-3 w-3 text-white" />
    ) : status === "rejected" ? (
      <XCircle className="h-3 w-3 text-white" />
    ) : null;

  return (
    <div className="flex gap-4">
      {/* 縦ライン + ドット */}
      <div className="flex flex-col items-center">
        {!isFirst && <div className={`h-4 w-0.5 ${lineClass}`} />}
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${dotClass}`}
        >
          {iconInDot}
        </div>
        {!isLast && <div className={`h-full min-h-4 w-0.5 ${lineClass}`} />}
      </div>

      {/* テキスト */}
      <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
        <p
          className={`text-sm font-semibold ${
            status === "current"
              ? "text-blue-700"
              : status === "rejected"
                ? "text-red-700"
                : status === "done"
                  ? "text-gray-900"
                  : "text-gray-400"
          }`}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className={`text-xs ${
              status === "rejected" ? "text-red-500" : "text-gray-500"
            }`}
          >
            {sublabel}
          </p>
        )}
        {date && <p className="text-[10px] text-gray-400">{date}</p>}
      </div>
    </div>
  );
}
