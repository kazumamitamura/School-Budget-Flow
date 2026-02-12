-- ============================================================
-- 認証機能の本格導入に伴うDB更新
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ────────────────────────────────────────────────
-- 1. budget_handle_new_user トリガーの更新
--    signUp() の metadata から department も取得する
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION budget_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.budget_profiles (id, email, full_name, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'department', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────
-- 2. budget_profiles の RLS ポリシー追加
--    自分のプロファイルは自分で読み書きできる
-- ────────────────────────────────────────────────

-- 既存ポリシーの削除（重複回避）
DROP POLICY IF EXISTS "budget_profiles: 自分の読取" ON budget_profiles;
DROP POLICY IF EXISTS "budget_profiles: 自分の更新" ON budget_profiles;
DROP POLICY IF EXISTS "budget_profiles: 自分の作成" ON budget_profiles;
DROP POLICY IF EXISTS "Allow authenticated read access" ON budget_profiles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON budget_profiles;

-- RLSが有効になっていることを確認
ALTER TABLE budget_profiles ENABLE ROW LEVEL SECURITY;

-- 全認証済みユーザーが全プロファイルを読めるようにする
-- (承認フローで他ユーザーの名前・所属を表示するため)
CREATE POLICY "budget_profiles: 認証済みユーザーの読取"
  ON budget_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 自分のプロファイルのみ更新可能
CREATE POLICY "budget_profiles: 自分の更新"
  ON budget_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 自分のプロファイルのみ作成可能
CREATE POLICY "budget_profiles: 自分の作成"
  ON budget_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ────────────────────────────────────────────────
-- 3. budget_requests の INSERT ポリシー
--    認証済みユーザーが自分のIDで申請を作成可能
-- ────────────────────────────────────────────────

DROP POLICY IF EXISTS "budget_requests: 認証済みユーザーの作成" ON budget_requests;
DROP POLICY IF EXISTS "Allow authenticated insert" ON budget_requests;

CREATE POLICY "budget_requests: 認証済みユーザーの作成"
  ON budget_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────
-- 4. budget_requests の UPDATE ポリシー
--    管理者ロールは全申請のステータスを更新可能
--    一般ユーザーは自分の申請のみ更新可能
-- ────────────────────────────────────────────────

DROP POLICY IF EXISTS "budget_requests: 更新制御" ON budget_requests;
DROP POLICY IF EXISTS "Allow authenticated update" ON budget_requests;

CREATE POLICY "budget_requests: 更新制御"
  ON budget_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('kyoto', 'vice_principal', 'principal', 'office_chief', 'chairman', 'accounting', 'teacher')
    )
    OR
    auth.uid() = user_id
  );

-- ────────────────────────────────────────────────
-- 5. budget_approvals の INSERT ポリシー
--    認証済みユーザーが自分のIDで承認記録を作成可能
-- ────────────────────────────────────────────────

DROP POLICY IF EXISTS "budget_approvals: 認証済みユーザーの作成" ON budget_approvals;
DROP POLICY IF EXISTS "Allow authenticated insert" ON budget_approvals;

CREATE POLICY "budget_approvals: 認証済みユーザーの作成"
  ON budget_approvals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = approver_id);

-- ────────────────────────────────────────────────
-- 6. budget_item_categories の RLS
--    認証済みユーザーが読み書き可能
-- ────────────────────────────────────────────────

ALTER TABLE budget_item_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_item_categories: 認証済みユーザーの読取" ON budget_item_categories;
DROP POLICY IF EXISTS "budget_item_categories: 認証済みユーザーの作成" ON budget_item_categories;
DROP POLICY IF EXISTS "budget_item_categories: 認証済みユーザーの更新" ON budget_item_categories;

CREATE POLICY "budget_item_categories: 認証済みユーザーの読取"
  ON budget_item_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "budget_item_categories: 認証済みユーザーの作成"
  ON budget_item_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "budget_item_categories: 認証済みユーザーの更新"
  ON budget_item_categories FOR UPDATE
  TO authenticated
  USING (true);
