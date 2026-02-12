"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { LineItem } from "@/lib/types";

export type SubmitRequestState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    organization?: string;
    title?: string;
    payee?: string;
    amount?: string;
    fund_id?: string;
    reason?: string;
    line_items?: string;
    attachment?: string;
  };
};

export async function submitRequest(
  _prevState: SubmitRequestState,
  formData: FormData
): Promise<SubmitRequestState> {
  // ── 認証チェック ──
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "ログインが必要です。" };
  }

  const supabase = await createClient();

  // ── フォームデータ取得 ──
  const organization = formData.get("organization") as string | null;
  const title = formData.get("title") as string | null;
  const payee = formData.get("payee") as string | null;
  const fundId = formData.get("fund_id") as string | null;
  const reason = formData.get("reason") as string | null;
  const lineItemsJson = formData.get("line_items") as string | null;
  const amountStr = formData.get("amount") as string | null;
  const file = formData.get("attachment") as File | null;

  // ── バリデーション ──
  const fieldErrors: SubmitRequestState["fieldErrors"] = {};

  if (!organization || organization.trim().length === 0) {
    fieldErrors.organization = "申請団体名を入力してください。";
  }

  if (!title || title.trim().length === 0) {
    fieldErrors.title = "事由（件名）を入力してください。";
  }

  if (!payee || payee.trim().length === 0) {
    fieldErrors.payee = "支払先・振込先を入力してください。";
  }

  if (!fundId || fundId.trim().length === 0) {
    fieldErrors.fund_id = "予算科目を選択してください。";
  }

  if (!reason || reason.trim().length === 0) {
    fieldErrors.reason = "理由・詳細を入力してください。";
  }

  // ── 品目明細バリデーション ──
  let lineItems: LineItem[] = [];
  try {
    lineItems = lineItemsJson ? JSON.parse(lineItemsJson) : [];
  } catch {
    fieldErrors.line_items = "品目データの形式が不正です。";
  }

  const validItems = lineItems.filter(
    (item) => item.name && item.name.trim().length > 0
  );

  if (validItems.length === 0) {
    fieldErrors.line_items = "最低1つ以上の品目を入力してください。";
  }

  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i];
    if (item.quantity <= 0 || item.unit_price <= 0) {
      fieldErrors.line_items = `品目「${item.name}」の数量と単価を正しく入力してください。`;
      break;
    }
  }

  // 合計金額を再計算（クライアント側の値を信用しない）
  const calculatedTotal = validItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  if (calculatedTotal <= 0) {
    fieldErrors.amount = "合計金額が0円です。品目の数量と単価を入力してください。";
  }

  // ファイルバリデーション
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

  // ── 品目データを正規化 ──
  const normalizedItems: LineItem[] = validItems.map((item) => ({
    name: item.name.trim(),
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
  }));

  // ── ファイルアップロード（Supabase Storage） ──
  let attachmentUrl: string | null = null;

  if (file && file.size > 0) {
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

    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(storagePath);

    attachmentUrl = publicUrl;
  }

  // ── Supabase に INSERT（実際のユーザーIDを使用）──
  const { error } = await supabase.from("budget_requests").insert({
    user_id: user.id,
    fund_id: fundId!.trim(),
    title: title!.trim(),
    amount: calculatedTotal,
    reason: reason!.trim(),
    organization: organization!.trim(),
    payee: payee!.trim(),
    line_items: normalizedItems,
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

  // ── 品目カテゴリマスタに蓄積 ──
  const currentYear = new Date().getFullYear();
  try {
    for (const item of normalizedItems) {
      const { data: existing } = await supabase
        .from("budget_item_categories")
        .select("id, use_count")
        .eq("name", item.name)
        .eq("department", organization!.trim())
        .eq("year", currentYear)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("budget_item_categories")
          .update({
            unit_price: item.unit_price,
            use_count: existing.use_count + 1,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("budget_item_categories").insert({
          name: item.name,
          department: organization!.trim(),
          unit_price: item.unit_price,
          year: currentYear,
        });
      }
    }
  } catch (catError) {
    console.warn("budget_item_categories update warning:", catError);
  }

  // ── 成功 → ダッシュボードへリダイレクト ──
  redirect("/");
}
