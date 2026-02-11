"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

/**
 * 予算サマリーに渡すデータ
 * - used:     ステータスが completed のもの（支出確定）
 * - pending:  completed / rejected 以外の全て（申請中 + 承認中 + 準備中）
 * - total:    予算総額
 */
export interface BudgetSummaryData {
  total: number;
  used: number;
  pending: number;
}

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500">{item.name}</p>
      <p className="text-sm font-semibold text-gray-900">
        {formatYen(item.value)}
      </p>
    </div>
  );
}

export default function BudgetSummary({
  data,
  label,
}: {
  data?: BudgetSummaryData;
  /** サマリーの見出しラベル（例: "野球部 予算" / "全校予算"） */
  label?: string;
}) {
  // props が無い場合はダミーデータにフォールバック
  const total = data?.total ?? 1000000;
  const usedAmount = data?.used ?? 350000;
  const pendingAmount = data?.pending ?? 50000;
  const remaining = Math.max(0, total - usedAmount - pendingAmount);
  const usageRate =
    total > 0
      ? Math.round(((usedAmount + pendingAmount) / total) * 100)
      : 0;

  const budgetData = [
    { name: "使用済み（出納済）", value: usedAmount, color: "#3b82f6" },
    { name: "申請中・確保済み", value: pendingAmount, color: "#f59e0b" },
    { name: "残高", value: remaining, color: "#e5e7eb" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-medium text-gray-500">
        {label ?? "全校予算（令和6年度）"}
      </h2>
      <p className="mb-6 text-2xl font-bold text-gray-900">
        {formatYen(total)}
      </p>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        {/* ドーナツグラフ */}
        <div className="relative h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* 中央テキスト */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-400">消化率</span>
            <span className="text-2xl font-bold text-gray-900">
              {usageRate}%
            </span>
          </div>
        </div>

        {/* 数値サマリー */}
        <div className="flex w-full flex-col gap-4">
          <SummaryRow
            color="bg-blue-500"
            label="使用済み（出納済）"
            amount={usedAmount}
            percentage={
              total > 0 ? Math.round((usedAmount / total) * 100) : 0
            }
          />
          <SummaryRow
            color="bg-amber-400"
            label="申請中・確保済み"
            amount={pendingAmount}
            percentage={
              total > 0 ? Math.round((pendingAmount / total) * 100) : 0
            }
          />
          <SummaryRow
            color="bg-gray-200"
            label="残高"
            amount={remaining}
            percentage={
              total > 0 ? Math.round((remaining / total) * 100) : 0
            }
          />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  color,
  label,
  amount,
  percentage,
}: {
  color: string;
  label: string;
  amount: number;
  percentage: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
      <div className="flex flex-1 items-baseline justify-between gap-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {formatYen(amount)}
          </span>
          <span className="text-xs text-gray-400">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
