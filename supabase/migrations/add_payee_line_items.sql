-- ============================================================
-- マイグレーション: budget_requests に payee, line_items を追加
-- 紙の予算伺書の電子化: 支払先・品目明細を構造化データで保存
-- ============================================================

-- 支払先・振込先（例: 株式会社スポーツ用品店）
ALTER TABLE budget_requests
  ADD COLUMN IF NOT EXISTS payee TEXT NOT NULL DEFAULT '';

-- 品目明細（JSONB配列）
-- 各要素: { "name": "公式試合球", "quantity": 10, "unit_price": 9702, "amount": 97020 }
ALTER TABLE budget_requests
  ADD COLUMN IF NOT EXISTS line_items JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN budget_requests.payee      IS '支払先・振込先（例: 株式会社スポーツ用品店）';
COMMENT ON COLUMN budget_requests.line_items IS '品目明細 JSON配列 [{name, quantity, unit_price, amount}]';

-- ============================================================
-- 品目カテゴリマスタ（将来の学習・効率化のため）
-- 過去の申請で使用された品目名を蓄積し、次年度以降の入力補完に利用
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_item_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,                         -- 品目名（例: 公式試合球）
  category   TEXT NOT NULL DEFAULT '',              -- カテゴリ（例: スポーツ用品, 文房具）
  department TEXT NOT NULL DEFAULT '',              -- よく使う部活（例: 野球部）
  unit_price INTEGER,                               -- 直近の単価（参考値）
  use_count  INTEGER NOT NULL DEFAULT 1,            -- 使用回数（人気度）
  year       INTEGER NOT NULL,                      -- 年度
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  budget_item_categories IS '品目カテゴリマスタ - 過去データを蓄積し年度更新時の効率化に利用';

-- インデックス
CREATE INDEX IF NOT EXISTS idx_budget_item_categories_name
  ON budget_item_categories (name);
CREATE INDEX IF NOT EXISTS idx_budget_item_categories_department
  ON budget_item_categories (department);
CREATE INDEX IF NOT EXISTS idx_budget_item_categories_category
  ON budget_item_categories (category);

-- RLS
ALTER TABLE budget_item_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_item_categories: 認証済みユーザーは閲覧可"
  ON budget_item_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "budget_item_categories: 認証済みユーザーは作成可"
  ON budget_item_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "budget_item_categories: 事務系ロールのみ更新可"
  ON budget_item_categories FOR UPDATE
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

-- updated_at トリガー
CREATE TRIGGER budget_item_categories_updated_at
  BEFORE UPDATE ON budget_item_categories
  FOR EACH ROW EXECUTE FUNCTION budget_handle_updated_at();
