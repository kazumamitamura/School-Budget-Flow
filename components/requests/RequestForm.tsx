"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import {
  FileText,
  Coins,
  FolderOpen,
  MessageSquare,
  Send,
  ArrowLeft,
  AlertCircle,
  Upload,
  X,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  submitRequest,
  type SubmitRequestState,
} from "@/app/actions/submitRequest";

export interface FundWithBalance {
  id: string;
  name: string;
  year: number;
  total_amount: number;
  /** 残額（total_amount - 使用済み - 確保済み） */
  remaining: number;
}

const initialState: SubmitRequestState = {
  success: false,
};

export default function RequestForm({ funds }: { funds: FundWithBalance[] }) {
  const [state, formAction] = useActionState(submitRequest, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
  }

  function clearFile() {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* ── グローバルエラー ── */}
      {state.error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* ── 申請団体名 ── */}
      <div>
        <label
          htmlFor="organization"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <Users className="h-4 w-4 text-gray-400" />
          申請団体名
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="organization"
          name="organization"
          placeholder="例: 野球部、3年2組、生徒会"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-1 ${
            state.fieldErrors?.organization
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
          }`}
        />
        {state.fieldErrors?.organization && (
          <p className="mt-1.5 text-xs text-red-600">
            {state.fieldErrors.organization}
          </p>
        )}
      </div>

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
          placeholder="例: 文化祭ペンキ購入費、県大会遠征交通費"
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
              {fund.name}（残額: ¥{fund.remaining.toLocaleString()} / 総額: ¥
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
        {funds.length > 0 && (
          <p className="mt-1.5 text-xs text-gray-400">
            残額は現在の使用済み・申請中の金額を差し引いた値です。
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
          placeholder={"申請理由や用途の詳細を記入してください。\n例: 文化祭の装飾に使用するペンキ10缶（水性、各色）を購入するため。"}
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

      {/* ── 領収書・資料の添付 ── */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Upload className="h-4 w-4 text-gray-400" />
          領収書・資料の添付
          <span className="text-xs font-normal text-gray-400">（任意）</span>
        </label>

        {!fileName ? (
          <label
            htmlFor="attachment"
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-gray-50/50 px-6 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50/30 ${
              state.fieldErrors?.attachment
                ? "border-red-300"
                : "border-gray-300"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                クリックしてファイルを選択
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                画像（JPEG, PNG, GIF, WebP）または PDF ・ 最大 10MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="attachment"
              name="attachment"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
              {fileName}
            </p>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
            {/* hidden input to keep the file */}
            <input
              ref={fileInputRef}
              type="file"
              name="attachment"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>
        )}
        {state.fieldErrors?.attachment && (
          <p className="mt-1.5 text-xs text-red-600">
            {state.fieldErrors.attachment}
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
