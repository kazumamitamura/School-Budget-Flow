import {
  CheckCircle2,
  Clock,
  XCircle,
  FileEdit,
  Banknote,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type RequestStatus =
  | "draft"
  | "pending_teacher"
  | "pending_kyoto"
  | "pending_vice_principal"
  | "pending_principal"
  | "pending_office"
  | "pending_chairman"
  | "pending"
  | "approved"
  | "ready_for_payment"
  | "completed"
  | "rejected";

interface Activity {
  id: string;
  title: string;
  department: string;
  amount: number;
  status: RequestStatus;
  statusLabel: string;
  date: string;
}

// ダミーデータ
const activities: Activity[] = [
  {
    id: "REQ-2024-012",
    title: "文化祭備品購入",
    department: "生徒会",
    amount: 45000,
    status: "pending_kyoto",
    statusLabel: "教頭 承認待ち",
    date: "2024-11-18",
  },
  {
    id: "REQ-2024-011",
    title: "理科実験器具の補充",
    department: "理科",
    amount: 32000,
    status: "approved",
    statusLabel: "全承認完了",
    date: "2024-11-15",
  },
  {
    id: "REQ-2024-010",
    title: "体育祭用テント修繕費",
    department: "体育科",
    amount: 28000,
    status: "completed",
    statusLabel: "出納済",
    date: "2024-11-10",
  },
  {
    id: "REQ-2024-009",
    title: "図書室 新刊購入",
    department: "図書委員会",
    amount: 15000,
    status: "ready_for_payment",
    statusLabel: "受取待ち",
    date: "2024-11-08",
  },
  {
    id: "REQ-2024-008",
    title: "放送機器メンテナンス",
    department: "放送部",
    amount: 50000,
    status: "rejected",
    statusLabel: "却下",
    date: "2024-11-05",
  },
  {
    id: "REQ-2024-007",
    title: "美術部 画材購入",
    department: "美術部",
    amount: 12000,
    status: "draft",
    statusLabel: "下書き",
    date: "2024-11-03",
  },
];

function getStatusStyle(status: RequestStatus): {
  bg: string;
  text: string;
  icon: LucideIcon;
} {
  if (status.startsWith("pending")) {
    return { bg: "bg-amber-100", text: "text-amber-700", icon: Clock };
  }
  const map: Partial<
    Record<RequestStatus, { bg: string; text: string; icon: LucideIcon }>
  > = {
    draft: { bg: "bg-gray-100", text: "text-gray-600", icon: FileEdit },
    approved: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle2,
    },
    ready_for_payment: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: Banknote,
    },
    completed: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle2,
    },
    rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  };
  return (
    map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", icon: FileEdit }
  );
}

export default function RecentActivity() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900">最近の申請</h2>
        <button className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700">
          すべて見る →
        </button>
      </div>

      {/* モバイル: カードレイアウト */}
      <div className="divide-y divide-gray-100 sm:hidden">
        {activities.map((activity) => {
          const style = getStatusStyle(activity.status);
          const Icon = style.icon;
          return (
            <Link
              key={activity.id}
              href={`/requests/${activity.id}`}
              className="block px-6 py-4 transition-colors hover:bg-gray-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {activity.department} ・ {activity.date}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-900">
                  ¥{activity.amount.toLocaleString()}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">{activity.id}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                >
                  <Icon className="h-3 w-3" />
                  {activity.statusLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* デスクトップ: テーブルレイアウト */}
      <div className="hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="px-6 py-3 font-medium">申請番号</th>
              <th className="px-6 py-3 font-medium">件名</th>
              <th className="px-6 py-3 font-medium">所属</th>
              <th className="px-6 py-3 text-right font-medium">金額</th>
              <th className="px-6 py-3 font-medium">ステータス</th>
              <th className="px-6 py-3 font-medium">日付</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activities.map((activity) => {
              const style = getStatusStyle(activity.status);
              const Icon = style.icon;
              return (
                <tr
                  key={activity.id}
                  className="group transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-3.5 text-xs text-gray-400">
                    {activity.id}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                    {activity.title}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">
                    {activity.department}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">
                    ¥{activity.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                    >
                      <Icon className="h-3 w-3" />
                      {activity.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">
                    {activity.date}
                  </td>
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/requests/${activity.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      詳細
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
