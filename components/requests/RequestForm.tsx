"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  FileText,
  Coins,
  FolderOpen,
  MessageSquare,
  Send,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  submitRequest,
  type SubmitRequestState,
} from "@/app/actions/submitRequest";

interface Fund {
  id: string;
  name: string;
  year: number;
  total_amount: number;
}

const initialState: SubmitRequestState = {
  success: false,
};

export default function RequestForm({ funds }: { funds: Fund[] }) {
  const [state, formAction] = useActionState(submitRequest, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {/* ── グローバルエラー ── */}
      {state.error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* ── 件名 ── */}
      <div>
        <label
          htmlFor="title"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <FileText className="h-4 w-4 text-gray-400" />
          件名
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          placeholder="例: 文化祭ペンキ購入費"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-1 ${
            state.fieldErrors?.title
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
          }`}
        />
        {state.fieldErrors?.title && (
          <p className="mt-1.5 text-xs text-red-600">
            {state.fieldErrors.title}
          </p>
        )}
      </div>

      {/* ── 金額 ── */}
      <div>
        <label
          htmlFor="amount"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <Coins className="h-4 w-4 text-gray-400" />
          金額
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
            ¥
          </span>
          <input
            type="number"
            id="amount"
            name="amount"
            min="1"
            step="1"
            placeholder="50000"
            className={`w-full rounded-xl border bg-white py-3 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-1 ${
              state.fieldErrors?.amount
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
            }`}
          />
        </div>
        {state.fieldErrors?.amount && (
          <p className="mt-1.5 text-xs text-red-600">
            {state.fieldErrors.amount}
          </p>
        )}
      </div>

      {/* ── 予算科目 ── */}
      <div>
        <label
          htmlFor="fund_id"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <FolderOpen className="h-4 w-4 text-gray-400" />
          予算科目
          <span className="text-red-500">*</span>
        </label>
        <select
          id="fund_id"
          name="fund_id"
          defaultValue=""
          className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:ring-2 focus:ring-offset-1 ${
            state.fieldErrors?.fund_id
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
          }`}
        >
          <option value="" disabled>
            予算科目を選択してください
          </option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name}（{fund.year}年度 / ¥
              {fund.total_amount.toLocaleString()}）
            </option>
          ))}
        </select>
        {funds.length === 0 && (
          <p className="mt-1.5 text-xs text-amber-600">
            予算科目が登録されていません。事務室に確認してください。
          </p>
        )}
        {state.fieldErrors?.fund_id && (
          <p className="mt-1.5 text-xs text-red-600">
            {state.fieldErrors.fund_id}
          </p>
        )}
      </div>

      {/* ── 理由・詳細 ── */}
      <div>
        <label
          htmlFor="reason"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <MessageSquare className="h-4 w-4 text-gray-400" />
          理由・詳細
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={5}
          placeholder="申請理由や用途の詳細を記入してください。&#10;例: 文化祭の装飾に使用するペンキ10缶（水性、各色）を購入するため。"
          className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-1 ${
            state.fieldErrors?.reason
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
          }`}
        />
        {state.fieldErrors?.reason && (
          <p className="mt-1.5 text-xs text-red-600">
            {state.fieldErrors.reason}
          </p>
        )}
      </div>

      {/* ── ボタン群 ── */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-between">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

/* ── 送信ボタン (useFormStatus) ── */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          送信中...
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          申請を提出する
        </>
      )}
    </button>
  );
}
