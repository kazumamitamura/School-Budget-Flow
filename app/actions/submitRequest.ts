"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ──────────────────────────────────────────────
// 仮の固定ユーザーID（認証機能が完成するまでの暫定値）
// Supabase の budget_profiles にこのIDのレコードが必要です。
// 認証実装後は auth.uid() から取得するように差し替えてください。
// ──────────────────────────────────────────────
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

export type SubmitRequestState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string;
    amount?: string;
    fund_id?: string;
    reason?: string;
  };
};

export async function submitRequest(
  _prevState: SubmitRequestState,
  formData: FormData
): Promise<SubmitRequestState> {
  // ── フォームデータ取得 ──
  const title = formData.get("title") as string | null;
  const amountStr = formData.get("amount") as string | null;
  const fundId = formData.get("fund_id") as string | null;
  const reason = formData.get("reason") as string | null;

  // ── バリデーション ──
  const fieldErrors: SubmitRequestState["fieldErrors"] = {};

  if (!title || title.trim().length === 0) {
    fieldErrors.title = "件名を入力してください。";
  }

  const amount = Number(amountStr);
  if (!amountStr || isNaN(amount) || amount <= 0) {
    fieldErrors.amount = "1円以上の金額を入力してください。";
  }

  if (!fundId || fundId.trim().length === 0) {
    fieldErrors.fund_id = "予算科目を選択してください。";
  }

  if (!reason || reason.trim().length === 0) {
    fieldErrors.reason = "理由・詳細を入力してください。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // ── Supabase に INSERT ──
  const { error } = await supabase.from("budget_requests").insert({
    user_id: TEMP_USER_ID,
    fund_id: fundId!.trim(),
    title: title!.trim(),
    amount: Math.floor(amount),
    reason: reason!.trim(),
    status: "pending_teacher",
  });

  if (error) {
    console.error("budget_requests INSERT error:", error);
    return {
      success: false,
      error: `保存に失敗しました: ${error.message}`,
    };
  }

  // ── 成功 → ダッシュボードへリダイレクト ──
  redirect("/");
}
