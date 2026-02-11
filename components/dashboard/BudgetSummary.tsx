"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ダミーデータ
const budgetData = [
  { name: "使用済み", value: 350000, color: "#3b82f6" },
  { name: "申請中", value: 50000, color: "#f59e0b" },
  { name: "残高", value: 600000, color: "#e5e7eb" },
];

const TOTAL = 1000000;

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

export default function BudgetSummary() {
  const usedAmount = budgetData[0].value;
  const pendingAmount = budgetData[1].value;
  const remaining = budgetData[2].value;
  const usageRate = Math.round(((usedAmount + pendingAmount) / TOTAL) * 100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-medium text-gray-500">
        全校予算（令和6年度）
      </h2>
      <p className="mb-6 text-2xl font-bold text-gray-900">
        {formatYen(TOTAL)}
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
            label="使用済み"
            amount={usedAmount}
            percentage={Math.round((usedAmount / TOTAL) * 100)}
          />
          <SummaryRow
            color="bg-amber-400"
            label="申請中"
            amount={pendingAmount}
            percentage={Math.round((pendingAmount / TOTAL) * 100)}
          />
          <SummaryRow
            color="bg-gray-200"
            label="残高"
            amount={remaining}
            percentage={Math.round((remaining / TOTAL) * 100)}
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
