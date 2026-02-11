"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getNextStatus, getRequiredRole } from "@/lib/workflow";

// ──────────────────────────────────────────────
// 仮のユーザーID（認証実装後は auth.uid() に差し替え）
// ──────────────────────────────────────────────
const TEMP_APPROVER_ID = "00000000-0000-0000-0000-000000000001";

export type ApproveRequestState = {
  success: boolean;
  error?: string;
};

/**
 * 承認アクション
 * - approve: 次のステータスへ移行 + 承認履歴を記録
 * - reject:  ステータスを rejected に変更 + 却下履歴を記録
 */
export async function approveRequest(
  _prevState: ApproveRequestState,
  formData: FormData
): Promise<ApproveRequestState> {
  const requestId = formData.get("request_id") as string;
  const action = formData.get("action") as "approved" | "rejected";
  const comment = (formData.get("comment") as string) ?? "";

  if (!requestId || !action) {
    return { success: false, error: "必要なパラメータが不足しています。" };
  }

  // ── DevTool の Cookie から現在の役職を取得 ──
  const cookieStore = await cookies();
  const currentRole = cookieStore.get("dev_role")?.value ?? "student";

  // ── 申請データを取得 ──
  const { data: request, error: fetchError } = await supabase
    .from("budget_requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { success: false, error: "申請データが見つかりません。" };
  }

  // ── 権限チェック: 現在のステータスに対して正しい役職か ──
  const requiredRole = getRequiredRole(request.status);
  if (!requiredRole) {
    return {
      success: false,
      error: "この申請は現在承認待ち状態ではありません。",
    };
  }
  if (currentRole !== requiredRole) {
    return {
      success: false,
      error: `この承認には「${requiredRole}」の権限が必要です。現在の役職: ${currentRole}`,
    };
  }

  // ── ステータス更新 ──
  let newStatus: string;

  if (action === "rejected") {
    newStatus = "rejected";
  } else {
    const next = getNextStatus(request.status);
    if (!next) {
      return { success: false, error: "次のステータスが見つかりません。" };
    }
    newStatus = next;
  }

  const { error: updateError } = await supabase
    .from("budget_requests")
    .update({ status: newStatus })
    .eq("id", requestId);

  if (updateError) {
    console.error("budget_requests UPDATE error:", updateError);
    return {
      success: false,
      error: `ステータス更新に失敗しました: ${updateError.message}`,
    };
  }

  // ── 承認履歴を INSERT ──
  const { error: approvalError } = await supabase
    .from("budget_approvals")
    .insert({
      request_id: requestId,
      approver_id: TEMP_APPROVER_ID,
      approver_role: currentRole,
      status: action,
      comment: comment.trim(),
    });

  if (approvalError) {
    console.error("budget_approvals INSERT error:", approvalError);
    // 履歴の保存失敗はステータス更新が成功しているので警告のみ
    return {
      success: true,
      error: "承認は完了しましたが、履歴の保存に失敗しました。",
    };
  }

  // ── ページを再検証 ──
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/");

  return { success: true };
}
