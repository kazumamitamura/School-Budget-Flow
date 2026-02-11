-- ============================================================
-- マイグレーション: budget_requests の RLS ポリシー更新
-- 所属 (department) ベースのアクセス制御を実装
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 管理者ロールの定義（このロールのユーザーは全レコードを閲覧可能）
-- kyoto, vice_principal, principal, office_chief, chairman, accounting
-- ────────────────────────────────────────────────────────────

-- ========================
-- budget_requests: SELECT ポリシーの置き換え
-- ========================

-- 旧ポリシーを削除
DROP POLICY IF EXISTS "budget_requests: 認証済みユーザーは閲覧可" ON budget_requests;

-- 新ポリシー: 所属ベースのアクセス制御
-- 一般ユーザー (student, teacher): 自分の department と budget_requests.organization が一致するレコードのみ
-- 管理者 (kyoto 以上): 全レコード閲覧可
CREATE POLICY "budget_requests: 所属ベースの閲覧制御"
  ON budget_requests FOR SELECT
  TO authenticated
  USING (
    -- 管理者ロールは全件閲覧可能
    EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('kyoto', 'vice_principal', 'principal', 'office_chief', 'chairman', 'accounting')
    )
    OR
    -- 一般ユーザーは自分の所属と一致するレコードのみ
    EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND budget_profiles.department = budget_requests.organization
    )
    OR
    -- 自分自身の申請は常に閲覧可能
    auth.uid() = user_id
  );

-- ========================
-- budget_approvals: SELECT ポリシーの更新
-- 承認履歴も同様に、自分の所属の申請分のみ閲覧可（管理者は全件）
-- ========================

DROP POLICY IF EXISTS "budget_approvals: 認証済みユーザーは閲覧可" ON budget_approvals;

CREATE POLICY "budget_approvals: 所属ベースの閲覧制御"
  ON budget_approvals FOR SELECT
  TO authenticated
  USING (
    -- 管理者ロールは全件閲覧可能
    EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('kyoto', 'vice_principal', 'principal', 'office_chief', 'chairman', 'accounting')
    )
    OR
    -- 自分が承認者のレコードは閲覧可能
    auth.uid() = approver_id
    OR
    -- 自分の所属の申請に紐づく承認履歴は閲覧可能
    EXISTS (
      SELECT 1
      FROM budget_requests br
      JOIN budget_profiles bp ON bp.id = auth.uid()
      WHERE br.id = budget_approvals.request_id
        AND (br.user_id = auth.uid() OR bp.department = br.organization)
    )
  );


-- ========================
-- budget_requests に organization カラムのインデックス追加（検索性能向上）
-- ========================
CREATE INDEX IF NOT EXISTS idx_budget_requests_organization ON budget_requests (organization);


-- ============================================================
-- 適用手順:
-- 1. Supabase ダッシュボード > SQL Editor にこのSQLを貼り付けて実行
-- 2. 既存データの organization カラムが空の場合は適宜データを更新してください
-- ============================================================
