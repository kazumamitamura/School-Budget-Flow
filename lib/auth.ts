import { cookies } from "next/headers";

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

/**
 * Server Component / Server Action から現在のユーザー情報を取得する
 * （DevTool Cookie ベース。認証実装後は Supabase Auth に差し替え）
 */
export async function getCurrentUser(): Promise<{
  role: string;
  department: string;
  isAdmin: boolean;
}> {
  const cookieStore = await cookies();
  const role = cookieStore.get("dev_role")?.value ?? "student";
  const department = cookieStore.get("dev_department")?.value ?? "生徒会";

  return {
    role,
    department,
    isAdmin: isAdminRole(role),
  };
}
