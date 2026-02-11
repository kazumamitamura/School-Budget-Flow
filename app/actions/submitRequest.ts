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
    organization?: string;
    title?: string;
    amount?: string;
    fund_id?: string;
    reason?: string;
    attachment?: string;
  };
};

export async function submitRequest(
  _prevState: SubmitRequestState,
  formData: FormData
): Promise<SubmitRequestState> {
  // ── フォームデータ取得 ──
  const organization = formData.get("organization") as string | null;
  const title = formData.get("title") as string | null;
  const amountStr = formData.get("amount") as string | null;
  const fundId = formData.get("fund_id") as string | null;
  const reason = formData.get("reason") as string | null;
  const file = formData.get("attachment") as File | null;

  // ── バリデーション ──
  const fieldErrors: SubmitRequestState["fieldErrors"] = {};

  if (!organization || organization.trim().length === 0) {
    fieldErrors.organization = "申請団体名を入力してください。";
  }

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

  // ファイルバリデーション（任意項目だが、選択された場合はチェック）
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "application/pdf",
  ];
  if (file && file.size > 0) {
    if (!allowedTypes.includes(file.type)) {
      fieldErrors.attachment =
        "画像（JPEG, PNG, GIF, WebP）またはPDFファイルのみアップロードできます。";
    }
    if (file.size > 10 * 1024 * 1024) {
      fieldErrors.attachment = "ファイルサイズは10MB以下にしてください。";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // ── ファイルアップロード（Supabase Storage） ──
  let attachmentUrl: string | null = null;

  if (file && file.size > 0) {
    // ファイル名: タイムスタンプ + ランダム文字列 + 拡張子
    const ext = file.name.split(".").pop() ?? "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const storagePath = `uploads/${timestamp}-${random}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return {
        success: false,
        error: `ファイルのアップロードに失敗しました: ${uploadError.message}`,
      };
    }

    // Public URL を取得
    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(storagePath);

    attachmentUrl = publicUrl;
  }

  // ── Supabase に INSERT ──
  const { error } = await supabase.from("budget_requests").insert({
    user_id: TEMP_USER_ID,
    fund_id: fundId!.trim(),
    title: title!.trim(),
    amount: Math.floor(amount),
    reason: reason!.trim(),
    organization: organization!.trim(),
    attachment_url: attachmentUrl,
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
