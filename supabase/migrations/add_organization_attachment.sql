-- ============================================================
-- マイグレーション: budget_requests に organization, attachment_url を追加
-- ============================================================

-- 申請団体名（部活動・クラス名など）
ALTER TABLE budget_requests
  ADD COLUMN IF NOT EXISTS organization TEXT NOT NULL DEFAULT '';

-- 領収書・資料の添付URL（Supabase Storage の Public URL）
ALTER TABLE budget_requests
  ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT NULL;

COMMENT ON COLUMN budget_requests.organization    IS '申請団体名（例: 野球部, 3年2組）';
COMMENT ON COLUMN budget_requests.attachment_url   IS '添付ファイルのURL（Supabase Storage）';

-- ============================================================
-- Supabase Storage バケット作成（SQL Editorでは作成不可のため、
-- Supabase ダッシュボード > Storage > New Bucket で作成してください）
--
-- バケット名: receipts
-- Public: ON（公開バケット）
-- ============================================================
