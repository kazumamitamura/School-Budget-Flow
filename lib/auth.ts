import { createClient } from "@/lib/supabase/server";

// ============================================================
// 管理者ロールの定義
// これらのロールは全部活・全申請を閲覧できる
// ============================================================
export const ADMIN_ROLES = [
  "kyoto",
  "vice_principal",
  "principal",
  "office_chief",
  "chairman",
  "accounting",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * 管理者ロールかどうかを判定
 */
export function isAdminRole(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  isAdmin: boolean;
}

/**
 * Server Component / Server Action から現在のユーザー情報を取得する
 * Supabase Auth + budget_profiles テーブルを使用
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // budget_profiles からロールと所属を取得
  const { data: profile } = await supabase
    .from("budget_profiles")
    .select("role, department, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "student";

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? "",
    role,
    department: profile?.department ?? "",
    isAdmin: isAdminRole(role),
  };
}
