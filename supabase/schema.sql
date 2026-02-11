-- ============================================================
-- School Budget Flow - データベーススキーマ
-- 学校予算・電子決裁システム
-- ============================================================
-- 注意: 他アプリとの共存のため、全テーブル・Enumに `budget_` 接頭辞を使用
-- Supabase SQL Editor にそのまま貼り付けて実行できます
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. カスタム Enum 型の作成
-- ────────────────────────────────────────────────────────────

-- ユーザー役割
CREATE TYPE budget_role_enum AS ENUM (
  'student',          -- 申請者: 生徒
  'teacher',          -- 申請者: 担当教員
  'kyoto',            -- 承認者: 教頭
  'vice_principal',   -- 承認者: 副校長
  'principal',        -- 承認者: 校長
  'office_chief',     -- 承認者: 事務長
  'chairman',         -- 承認者: 理事長
  'accounting'        -- 実務担当: 出納・事務室
);

-- 申請ステータス
CREATE TYPE budget_status_enum AS ENUM (
  'draft',              -- 下書き
  'pending',            -- 承認フロー中
  'approved',           -- 全承認完了・引出待ち
  'ready_for_payment',  -- 現金用意済み・受取待ち
  'completed',          -- 受取完了・出納済
  'rejected'            -- 却下
);

-- 承認アクション (approved / rejected)
CREATE TYPE budget_approval_action_enum AS ENUM (
  'approved',   -- 承認
  'rejected'    -- 却下
);


-- ────────────────────────────────────────────────────────────
-- 2. budget_profiles - ユーザー役割管理
-- ────────────────────────────────────────────────────────────

CREATE TABLE budget_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL DEFAULT '',
  role       budget_role_enum NOT NULL DEFAULT 'student',
  department TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  budget_profiles             IS 'ユーザーのプロフィール・役割管理（auth.usersと1:1）';
COMMENT ON COLUMN budget_profiles.id          IS 'auth.users.id と同一UUID';
COMMENT ON COLUMN budget_profiles.role        IS 'ユーザーの役職（承認フローの権限に使用）';
COMMENT ON COLUMN budget_profiles.department  IS '所属（生徒会, 理科, 事務室 など）';


-- ────────────────────────────────────────────────────────────
-- 3. budget_funds - 予算科目管理
-- ────────────────────────────────────────────────────────────

CREATE TABLE budget_funds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT    NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0,
  year         INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  budget_funds              IS '年間の予算科目・予算枠を管理';
COMMENT ON COLUMN budget_funds.name         IS '予算名（例: 令和6年度 生徒会費）';
COMMENT ON COLUMN budget_funds.total_amount IS '予算総額（円）';
COMMENT ON COLUMN budget_funds.year         IS '年度（例: 2024）';


-- ────────────────────────────────────────────────────────────
-- 4. budget_requests - 申請データ
-- ────────────────────────────────────────────────────────────

CREATE TABLE budget_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES budget_profiles (id) ON DELETE CASCADE,
  fund_id    UUID NOT NULL REFERENCES budget_funds (id)    ON DELETE RESTRICT,
  title      TEXT    NOT NULL,
  amount     INTEGER NOT NULL CHECK (amount > 0),
  reason     TEXT    NOT NULL DEFAULT '',
  status     budget_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  budget_requests          IS '予算使用の申請書データ';
COMMENT ON COLUMN budget_requests.user_id  IS '申請者（budget_profiles.id）';
COMMENT ON COLUMN budget_requests.fund_id  IS '使用する予算科目（budget_funds.id）';
COMMENT ON COLUMN budget_requests.amount   IS '申請金額（円, 1以上）';
COMMENT ON COLUMN budget_requests.status   IS '申請のステータス（承認フローの進捗）';

-- 検索性能向上のためのインデックス
CREATE INDEX idx_budget_requests_user_id ON budget_requests (user_id);
CREATE INDEX idx_budget_requests_fund_id ON budget_requests (fund_id);
CREATE INDEX idx_budget_requests_status  ON budget_requests (status);


-- ────────────────────────────────────────────────────────────
-- 5. budget_approvals - 承認履歴（ハンコ）
-- ────────────────────────────────────────────────────────────

CREATE TABLE budget_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES budget_requests (id) ON DELETE CASCADE,
  approver_id   UUID NOT NULL REFERENCES budget_profiles (id) ON DELETE CASCADE,
  approver_role budget_role_enum NOT NULL,
  status        budget_approval_action_enum NOT NULL,
  comment       TEXT NOT NULL DEFAULT '',
  approved_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  budget_approvals               IS '承認履歴 - 誰がいつ承認/却下したかを記録';
COMMENT ON COLUMN budget_approvals.approver_role  IS '承認時の役職（承認当時のスナップショット）';
COMMENT ON COLUMN budget_approvals.status         IS '承認アクション（approved / rejected）';
COMMENT ON COLUMN budget_approvals.comment        IS '承認コメントまたは却下理由';

-- 検索性能向上のためのインデックス
CREATE INDEX idx_budget_approvals_request_id  ON budget_approvals (request_id);
CREATE INDEX idx_budget_approvals_approver_id ON budget_approvals (approver_id);


-- ────────────────────────────────────────────────────────────
-- 6. updated_at 自動更新トリガー
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION budget_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_profiles_updated_at
  BEFORE UPDATE ON budget_profiles
  FOR EACH ROW EXECUTE FUNCTION budget_handle_updated_at();

CREATE TRIGGER budget_funds_updated_at
  BEFORE UPDATE ON budget_funds
  FOR EACH ROW EXECUTE FUNCTION budget_handle_updated_at();

CREATE TRIGGER budget_requests_updated_at
  BEFORE UPDATE ON budget_requests
  FOR EACH ROW EXECUTE FUNCTION budget_handle_updated_at();


-- ────────────────────────────────────────────────────────────
-- 7. 新規ユーザー登録時に budget_profiles を自動作成するトリガー
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION budget_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.budget_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_budget_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION budget_handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 8. Row Level Security (RLS) ポリシー
-- ────────────────────────────────────────────────────────────

-- ========================
-- budget_profiles
-- ========================
ALTER TABLE budget_profiles ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全プロフィールを閲覧可能
CREATE POLICY "budget_profiles: 認証済みユーザーは閲覧可"
  ON budget_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 自分自身のプロフィールのみ更新可能
CREATE POLICY "budget_profiles: 自分のプロフィールのみ更新可"
  ON budget_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========================
-- budget_funds
-- ========================
ALTER TABLE budget_funds ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは予算科目を閲覧可能
CREATE POLICY "budget_funds: 認証済みユーザーは閲覧可"
  ON budget_funds FOR SELECT
  TO authenticated
  USING (true);

-- 予算科目の作成は accounting / office_chief のみ
CREATE POLICY "budget_funds: 事務系ロールのみ作成可"
  ON budget_funds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('accounting', 'office_chief')
    )
  );

-- 予算科目の更新も accounting / office_chief のみ
CREATE POLICY "budget_funds: 事務系ロールのみ更新可"
  ON budget_funds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('accounting', 'office_chief')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('accounting', 'office_chief')
    )
  );

-- ========================
-- budget_requests
-- ========================
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全申請を閲覧可能
CREATE POLICY "budget_requests: 認証済みユーザーは閲覧可"
  ON budget_requests FOR SELECT
  TO authenticated
  USING (true);

-- 申請の作成は認証済みユーザーが自分の申請として作成可能
CREATE POLICY "budget_requests: 認証済みユーザーは申請作成可"
  ON budget_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 申請の更新: 申請者本人（下書き状態のみ）または承認権限を持つユーザー
CREATE POLICY "budget_requests: 申請者本人または承認者が更新可"
  ON budget_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('kyoto', 'vice_principal', 'principal', 'office_chief', 'chairman', 'accounting')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('kyoto', 'vice_principal', 'principal', 'office_chief', 'chairman', 'accounting')
    )
  );

-- ========================
-- budget_approvals
-- ========================
ALTER TABLE budget_approvals ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全承認履歴を閲覧可能
CREATE POLICY "budget_approvals: 認証済みユーザーは閲覧可"
  ON budget_approvals FOR SELECT
  TO authenticated
  USING (true);

-- 承認権限を持つユーザーのみ承認レコードを作成可能
CREATE POLICY "budget_approvals: 承認者のみ作成可"
  ON budget_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = approver_id
    AND EXISTS (
      SELECT 1 FROM budget_profiles
      WHERE id = auth.uid()
        AND role IN ('kyoto', 'vice_principal', 'principal', 'office_chief', 'chairman', 'accounting')
    )
  );


-- ────────────────────────────────────────────────────────────
-- 完了
-- ────────────────────────────────────────────────────────────
-- テーブル一覧:
--   1. budget_profiles   - ユーザー役割管理
--   2. budget_funds      - 予算科目管理
--   3. budget_requests   - 申請データ
--   4. budget_approvals  - 承認履歴（ハンコ）
--
-- Enum 型:
--   1. budget_role_enum            - ユーザー役割
--   2. budget_status_enum          - 申請ステータス
--   3. budget_approval_action_enum - 承認アクション
--
-- トリガー:
--   1. updated_at 自動更新 (profiles, funds, requests)
--   2. auth.users 新規登録時に budget_profiles 自動作成
-- ============================================================
