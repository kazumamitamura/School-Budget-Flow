"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// 認証 Server Actions
// ============================================================

export type AuthState = {
  success: boolean;
  error?: string;
};

/**
 * ログイン処理
 */
export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error);
    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: "メールアドレスまたはパスワードが正しくありません。",
      };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: "メールアドレスの確認が完了していません。確認メールをご確認ください。",
      };
    }
    return { success: false, error: `ログインに失敗しました: ${error.message}` };
  }

  redirect("/");
}

/**
 * 新規登録処理
 * 1. supabase.auth.signUp() でユーザー作成
 * 2. budget_profiles に department, role を設定
 */
export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const department = formData.get("department") as string;

  // バリデーション
  if (!fullName || fullName.trim().length === 0) {
    return { success: false, error: "氏名を入力してください。" };
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "有効なメールアドレスを入力してください。" };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "パスワードは6文字以上で入力してください。" };
  }
  if (!department || department.trim().length === 0) {
    return { success: false, error: "所属・担当部活動を選択してください。" };
  }

  const supabase = await createClient();

  // ── ユーザー作成 ──
  // metadata に full_name と department を含め、トリガーで profile を作成
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        department: department.trim(),
      },
    },
  });

  if (signUpError) {
    console.error("SignUp error:", signUpError);
    if (signUpError.message.includes("already registered")) {
      return {
        success: false,
        error: "このメールアドレスは既に登録されています。ログインしてください。",
      };
    }
    return {
      success: false,
      error: `登録に失敗しました: ${signUpError.message}`,
    };
  }

  // ── budget_profiles の department と role を更新 ──
  // トリガーが email, full_name を設定済み → department と role を追加
  if (data.user) {
    const { error: profileError } = await supabase
      .from("budget_profiles")
      .update({
        department: department.trim(),
        role: "teacher", // デフォルトは teacher
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // プロファイル更新失敗でもユーザー作成は成功しているので続行
    }
  }

  redirect("/");
}

/**
 * ログアウト処理
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
