"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRef, useState, useCallback } from "react";
import {
  FileText,
  FolderOpen,
  MessageSquare,
  Send,
  ArrowLeft,
  AlertCircle,
  Upload,
  X,
  Users,
  Plus,
  Trash2,
  Building2,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import {
  submitRequest,
  type SubmitRequestState,
} from "@/app/actions/submitRequest";
import type { LineItem } from "@/lib/types";
import { createEmptyLineItem, calcTotal } from "@/lib/types";

export interface FundWithBalance {
  id: string;
  name: string;
  year: number;
  total_amount: number;
  remaining: number;
}

const initialState: SubmitRequestState = {
  success: false,
};

export default function RequestForm({ funds }: { funds: FundWithBalance[] }) {
  const [state, formAction] = useActionState(submitRequest, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 品目明細の状態管理 ──
  const [lineItems, setLineItems] = useState<LineItem[]>([
    createEmptyLineItem(),
    createEmptyLineItem(),
    createEmptyLineItem(),
  ]);

  const totalAmount = calcTotal(lineItems);

  const updateLineItem = useCallback(
    (index: number, field: keyof LineItem, value: string) => {
      setLineItems((prev) => {
        const updated = [...prev];
        const item = { ...updated[index] };

        if (field === "name") {
          item.name = value;
        } else if (field === "quantity") {
          item.quantity = Math.max(0, parseInt(value) || 0);
          item.amount = item.quantity * item.unit_price;
        } else if (field === "unit_price") {
          item.unit_price = Math.max(0, parseInt(value) || 0);
          item.amount = item.quantity * item.unit_price;
        }

        updated[index] = item;
        return updated;
      });
    },
    []
  );

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  }, []);

  const removeLineItem = useCallback(
    (index: number) => {
      if (lineItems.length <= 1) return;
      setLineItems((prev) => prev.filter((_, i) => i !== index));
    },
    [lineItems.length]
  );

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
    <form action={formAction} className="space-y-8">
      {/* ── グローバルエラー ── */}
      {state.error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* ━━━━━ セクション1: 基本情報 ━━━━━ */}
      <fieldset className="space-y-5">
        <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <FileText className="h-3.5 w-3.5" />
          </div>
          基本情報
        </legend>

        {/* 申請団体名 + 件名（事由）を横並び */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* 申請団体名 */}
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

          {/* 件名（事由） */}
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
            >
              <FileText className="h-4 w-4 text-gray-400" />
              事由（件名）
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="例: 令和6年度生徒会配当金として"
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
        </div>

        {/* 支払先 + 予算科目 */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* 支払先・振込先 */}
          <div>
            <label
              htmlFor="payee"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
            >
              <Building2 className="h-4 w-4 text-gray-400" />
              支払先・振込先
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="payee"
              name="payee"
              placeholder="例: 株式会社スポーツ用品店"
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-1 ${
                state.fieldErrors?.payee
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              }`}
            />
            {state.fieldErrors?.payee && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.fieldErrors.payee}
              </p>
            )}
          </div>

          {/* 予算科目 */}
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
                予算科目を選択
              </option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}（残額: ¥{fund.remaining.toLocaleString()}）
                </option>
              ))}
            </select>
            {funds.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                予算科目が未登録です。事務室に確認してください。
              </p>
            )}
            {state.fieldErrors?.fund_id && (
              <p className="mt-1.5 text-xs text-red-600">
                {state.fieldErrors.fund_id}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ━━━━━ セクション2: 品目明細 ━━━━━ */}
      <fieldset className="space-y-4">
        <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <ShoppingCart className="h-3.5 w-3.5" />
          </div>
          品目明細
        </legend>

        {/* 明細テーブル */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                <th className="px-3 py-2.5 text-left">品目・品名</th>
                <th className="w-20 px-3 py-2.5 text-right">数量</th>
                <th className="w-28 px-3 py-2.5 text-right">単価（円）</th>
                <th className="w-32 px-3 py-2.5 text-right">金額（円）</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineItems.map((item, idx) => (
                <tr key={idx} className="group">
                  {/* 品目名 */}
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateLineItem(idx, "name", e.target.value)
                      }
                      placeholder="例: 公式試合球"
                      className="w-full rounded-lg border-0 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder-gray-300 outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-blue-300"
                    />
                  </td>
                  {/* 数量 */}
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateLineItem(idx, "quantity", e.target.value)
                      }
                      className="w-full rounded-lg border-0 bg-transparent px-2 py-2 text-right text-sm text-gray-900 outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-blue-300"
                    />
                  </td>
                  {/* 単価 */}
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.unit_price || ""}
                      onChange={(e) =>
                        updateLineItem(idx, "unit_price", e.target.value)
                      }
                      className="w-full rounded-lg border-0 bg-transparent px-2 py-2 text-right text-sm text-gray-900 outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-blue-300"
                    />
                  </td>
                  {/* 金額（自動計算） */}
                  <td className="px-3 py-1.5 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {item.amount > 0
                        ? `¥${item.amount.toLocaleString()}`
                        : "—"}
                    </span>
                  </td>
                  {/* 削除 */}
                  <td className="px-2 py-1.5 text-center">
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="rounded-lg p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* 合計行 */}
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-blue-50/50">
                <td
                  colSpan={3}
                  className="px-3 py-3 text-right text-sm font-semibold text-gray-700"
                >
                  合計金額
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-lg font-bold text-blue-600">
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 行追加ボタン */}
        <button
          type="button"
          onClick={addLineItem}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
        >
          <Plus className="h-3.5 w-3.5" />
          品目を追加
        </button>

        {state.fieldErrors?.line_items && (
          <p className="text-xs text-red-600">
            {state.fieldErrors.line_items}
          </p>
        )}

        {/* hidden: line_items JSON をフォームに含める */}
        <input
          type="hidden"
          name="line_items"
          value={JSON.stringify(lineItems)}
        />
        {/* hidden: 合計金額 */}
        <input type="hidden" name="amount" value={totalAmount} />
      </fieldset>

      {/* ━━━━━ セクション3: 理由・添付 ━━━━━ */}
      <fieldset className="space-y-5">
        <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Receipt className="h-3.5 w-3.5" />
          </div>
          理由・添付資料
        </legend>

        {/* 理由・詳細 */}
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
            rows={3}
            placeholder={"申請理由や用途の詳細を記入してください。"}
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

        {/* 領収書・資料の添付 */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Upload className="h-4 w-4 text-gray-400" />
            領収書・見積書の添付
            <span className="text-xs font-normal text-gray-400">（任意）</span>
          </label>
          <p className="mb-2 text-xs text-gray-400">
            紙の領収書を裏に貼る代わりに、スマホで撮影またはPDFをアップロードしてください。
          </p>

          {!fileName ? (
            <label
              htmlFor="attachment"
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-gray-50/50 px-6 py-6 transition-colors hover:border-blue-400 hover:bg-blue-50/30 ${
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
      </fieldset>

      {/* ━━━━━ 合計・送信 ━━━━━ */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            申請合計金額
          </span>
          <span className="text-xl font-bold text-blue-600">
            ¥{totalAmount.toLocaleString()}
          </span>
        </div>
        {totalAmount === 0 && (
          <p className="mt-1 text-xs text-amber-600">
            品目明細に数量と単価を入力すると自動計算されます。
          </p>
        )}
      </div>

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
