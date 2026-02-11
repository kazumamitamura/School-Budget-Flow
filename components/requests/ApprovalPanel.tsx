"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Stamp, XCircle, CheckCircle2, MessageSquare } from "lucide-react";
import {
  approveRequest,
  type ApproveRequestState,
} from "@/app/actions/approveRequest";

const initialState: ApproveRequestState = { success: false };

export default function ApprovalPanel({
  requestId,
  canApprove,
  requiredRoleLabel,
  currentRoleLabel,
}: {
  requestId: string;
  canApprove: boolean;
  requiredRoleLabel: string;
  currentRoleLabel: string;
}) {
  const [state, formAction] = useActionState(approveRequest, initialState);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [stamped, setStamped] = useState(false);

  if (state.success && !state.error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="text-sm font-semibold text-emerald-800">
          処理が完了しました
        </p>
        <p className="text-xs text-emerald-600">
          ページを再読込すると最新状態が反映されます。
        </p>
      </div>
    );
  }

  if (!canApprove) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          現在の承認待ち：
          <span className="font-semibold text-gray-700">
            {requiredRoleLabel}
          </span>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          あなたの役職「{currentRoleLabel}」では承認できません。
          <br />
          ヘッダーの DEV ツールで役職を切り替えてください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* エラー表示 */}
      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* ── 承認フォーム ── */}
      {!showRejectForm && (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="action" value="approved" />

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <MessageSquare className="h-3.5 w-3.5" />
              コメント（任意）
            </label>
            <input
              type="text"
              name="comment"
              placeholder="承認コメントがあれば入力"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <ApproveButton stamped={stamped} onStamp={() => setStamped(true)} />
        </form>
      )}

      {/* ── 却下フォーム ── */}
      {showRejectForm && (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="action" value="rejected" />

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <MessageSquare className="h-3.5 w-3.5" />
              却下理由（必須）
            </label>
            <textarea
              name="comment"
              rows={3}
              required
              placeholder="却下する理由を記入してください"
              className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
            />
          </div>

          <div className="flex gap-3">
            <RejectButton />
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 却下切り替えボタン */}
      {!showRejectForm && (
        <button
          type="button"
          onClick={() => setShowRejectForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
        >
          <XCircle className="h-4 w-4" />
          却下する
        </button>
      )}
    </div>
  );
}

/* ── 承認ボタン（印鑑アニメーション付き） ── */
function ApproveButton({
  stamped,
  onStamp,
}: {
  stamped: boolean;
  onStamp: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onStamp}
      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {/* 印鑑アニメーション背景 */}
      <span
        className={`absolute inset-0 bg-blue-500 transition-transform duration-500 ease-out ${
          stamped && pending
            ? "scale-100 opacity-20"
            : "scale-0 opacity-0"
        } rounded-full`}
        style={{ transformOrigin: "center" }}
      />

      {pending ? (
        <>
          <span className="relative flex items-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            押印中...
          </span>
        </>
      ) : (
        <span className="relative flex items-center gap-2">
          <Stamp className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
          承認する（押印）
        </span>
      )}
    </button>
  );
}

/* ── 却下ボタン ── */
function RejectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          処理中...
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4" />
          却下を確定
        </>
      )}
    </button>
  );
}
