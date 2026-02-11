// ============================================================
// メール通知モジュール（プレースホルダー）
// ============================================================
// 現在は console.log に出力するのみ。
// 将来的に Resend (https://resend.com) に差し替える場合は
// npm install resend して、下記の sendNotificationEmail 内を
// Resend API呼び出しに書き換えてください。
// ============================================================

// .env.local に追加予定:
// RESEND_API_KEY=re_xxxxxxxxxxxx
// NOTIFICATION_FROM_EMAIL=noreply@school-budget.example.com

export interface EmailPayload {
  /** 宛先メールアドレス */
  to: string;
  /** メール件名 */
  subject: string;
  /** メール本文（プレーンテキスト） */
  body: string;
}

/**
 * 通知メールを送信する（現在はダミー実装）
 *
 * @example
 * await sendNotificationEmail({
 *   to: "tanaka@example.com",
 *   subject: "現金準備完了のお知らせ",
 *   body: "文化祭備品購入の現金が準備できました。事務室までお越しください。",
 * });
 */
export async function sendNotificationEmail(
  payload: EmailPayload
): Promise<{ success: boolean; error?: string }> {
  // ─── ダミー実装: console.log に出力 ───
  console.log("══════════════════════════════════════");
  console.log("📧 メール送信（ダミー）");
  console.log(`  宛先:   ${payload.to}`);
  console.log(`  件名:   ${payload.subject}`);
  console.log(`  本文:   ${payload.body}`);
  console.log("══════════════════════════════════════");

  // ─── 将来の Resend 実装例 ───
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const { error } = await resend.emails.send({
  //   from: process.env.NOTIFICATION_FROM_EMAIL!,
  //   to: payload.to,
  //   subject: payload.subject,
  //   text: payload.body,
  // });
  // if (error) return { success: false, error: error.message };

  return { success: true };
}
