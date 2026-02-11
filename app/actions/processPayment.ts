"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { sendNotificationEmail } from "@/lib/mail";

export type ProcessPaymentState = {
  success: boolean;
  error?: string;
};

/**
 * 現金準備完了処理
 * approved → ready_for_payment に更新し、申請者にメール通知を送る
 */
export async function markReadyForPayment(
  _prevState: ProcessPaymentState,
  formData: FormData
): Promise<ProcessPaymentState> {
  const requestId = formData.get("request_id") as string;
  if (!requestId) {
    return { success: false, error: "申請IDが指定されていません。" };
  }

  // ── 申請データ + 申請者情報を取得 ──
  const { data: request, error: fetchError } = await supabase
    .from("budget_requests")
    .select(
      `
      id, title, status,
      budget_profiles!budget_requests_user_id_fkey ( email, full_name )
    `
    )
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { success: false, error: "申請データが見つかりません。" };
  }

  if (request.status !== "approved") {
    return {
      success: false,
      error: `この案件はまだ全承認が完了していません。（現在: ${request.status}）`,
    };
  }

  // ── ステータス更新 ──
  const { error: updateError } = await supabase
    .from("budget_requests")
    .update({ status: "ready_for_payment" })
    .eq("id", requestId);

  if (updateError) {
    return {
      success: false,
      error: `更新に失敗しました: ${updateError.message}`,
    };
  }

  // ── メール通知（ダミー） ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = request.budget_profiles as any;
  if (profile) {
    await sendNotificationEmail({
      to: profile.email ?? "unknown@example.com",
      subject: `【現金準備完了】${request.title}`,
      body: `${profile.full_name ?? "申請者"}様\n\n「${request.title}」の現金準備ができました。\n事務室までお越しください。\n\n--- School Budget Flow`,
    });
  }

  revalidatePath("/office");
  revalidatePath("/");
  revalidatePath(`/requests/${requestId}`);

  return { success: true };
}

/**
 * 引き渡し完了（出納）処理
 * ready_for_payment → completed に更新
 */
export async function markCompleted(
  _prevState: ProcessPaymentState,
  formData: FormData
): Promise<ProcessPaymentState> {
  const requestId = formData.get("request_id") as string;
  if (!requestId) {
    return { success: false, error: "申請IDが指定されていません。" };
  }

  // ── 申請データを取得 ──
  const { data: request, error: fetchError } = await supabase
    .from("budget_requests")
    .select("id, title, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { success: false, error: "申請データが見つかりません。" };
  }

  if (request.status !== "ready_for_payment") {
    return {
      success: false,
      error: `この案件はまだ受取待ち状態ではありません。（現在: ${request.status}）`,
    };
  }

  // ── ステータス更新 → completed（支出確定） ──
  const { error: updateError } = await supabase
    .from("budget_requests")
    .update({ status: "completed" })
    .eq("id", requestId);

  if (updateError) {
    return {
      success: false,
      error: `更新に失敗しました: ${updateError.message}`,
    };
  }

  console.log(
    `✅ 出納完了: 「${request.title}」(${requestId}) が completed に更新されました。`
  );

  revalidatePath("/office");
  revalidatePath("/");
  revalidatePath(`/requests/${requestId}`);

  return { success: true };
}
