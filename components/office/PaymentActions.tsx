"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Banknote,
  HandCoins,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  markReadyForPayment,
  markCompleted,
  type ProcessPaymentState,
} from "@/app/actions/processPayment";

const initialState: ProcessPaymentState = { success: false };

/* ──────────────────────────────────────────────
   現金準備完了ボタン
   ────────────────────────────────────────────── */
export function ReadyForPaymentButton({
  requestId,
}: {
  requestId: string;
}) {
  const [state, formAction] = useActionState(markReadyForPayment, initialState);

  if (state.success) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        準備完了通知済み
      </span>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="request_id" value={requestId} />
      {state.error && (
        <p className="mb-1 text-xs text-red-600">{state.error}</p>
      )}
      <SubmitBtn
        label="現金準備完了"
        pendingLabel="処理中..."
        icon={<Banknote className="h-4 w-4" />}
        className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
      />
    </form>
  );
}

/* ──────────────────────────────────────────────
   引き渡し完了（出納）ボタン
   ────────────────────────────────────────────── */
export function CompletedButton({
  requestId,
  title,
}: {
  requestId: string;
  title: string;
}) {
  const [state, formAction] = useActionState(markCompleted, initialState);

  if (state.success) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        出納完了
      </span>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `「${title}」の現金を申請者に引き渡しましたか？\nこの操作は取り消せません。`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="request_id" value={requestId} />
      {state.error && (
        <p className="mb-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {state.error}
        </p>
      )}
      <SubmitBtn
        label="引き渡し完了"
        pendingLabel="処理中..."
        icon={<HandCoins className="h-4 w-4" />}
        className="bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
      />
    </form>
  );
}

/* ── 共通送信ボタン ── */
function SubmitBtn({
  label,
  pendingLabel,
  icon,
  className,
}: {
  label: string;
  pendingLabel: string;
  icon: React.ReactNode;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
