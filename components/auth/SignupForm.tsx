"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  User,
  Mail,
  Lock,
  Building2,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { signup, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = { success: false };

export default function SignupForm({
  departments,
}: {
  departments: string[];
}) {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* 氏名 */}
      <div>
        <label
          htmlFor="full_name"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <User className="h-4 w-4 text-gray-400" />
          氏名
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          required
          autoComplete="name"
          placeholder="山田 太郎"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
        />
      </div>

      {/* メールアドレス */}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <Mail className="h-4 w-4 text-gray-400" />
          メールアドレス
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          placeholder="example@school.jp"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
        />
      </div>

      {/* パスワード */}
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <Lock className="h-4 w-4 text-gray-400" />
          パスワード
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="6文字以上"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
        />
      </div>

      {/* 所属・担当部活動 */}
      <div>
        <label
          htmlFor="department"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
        >
          <Building2 className="h-4 w-4 text-gray-400" />
          所属・担当部活動
        </label>
        <select
          id="department"
          name="department"
          required
          defaultValue=""
          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
        >
          <option value="" disabled>
            所属を選択してください
          </option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-gray-400">
          登録後、あなたの所属する部活の予算が閲覧可能になります。
        </p>
      </div>

      <SignupButton />
    </form>
  );
}

function SignupButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          登録中...
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          アカウントを作成
        </>
      )}
    </button>
  );
}
