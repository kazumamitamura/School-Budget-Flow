-- ============================================================
-- マイグレーション: budget_status_enum に承認リレー用ステータスを追加
-- ============================================================
-- 既存: draft, pending, approved, ready_for_payment, completed, rejected
-- 追加: pending_teacher, pending_kyoto, pending_vice_principal,
--       pending_principal, pending_office, pending_chairman
--
-- 注意: PostgreSQLの ALTER TYPE ... ADD VALUE は
--       トランザクション内では実行できません。
--       Supabase SQL Editor で1文ずつ実行してください。
-- ============================================================

ALTER TYPE budget_status_enum ADD VALUE IF NOT EXISTS 'pending_teacher'        AFTER 'draft';
ALTER TYPE budget_status_enum ADD VALUE IF NOT EXISTS 'pending_kyoto'          AFTER 'pending_teacher';
ALTER TYPE budget_status_enum ADD VALUE IF NOT EXISTS 'pending_vice_principal' AFTER 'pending_kyoto';
ALTER TYPE budget_status_enum ADD VALUE IF NOT EXISTS 'pending_principal'      AFTER 'pending_vice_principal';
ALTER TYPE budget_status_enum ADD VALUE IF NOT EXISTS 'pending_office'         AFTER 'pending_principal';
ALTER TYPE budget_status_enum ADD VALUE IF NOT EXISTS 'pending_chairman'       AFTER 'pending_office';

-- ============================================================
-- 実行後の budget_status_enum の値一覧:
--   draft
--   pending_teacher         ← NEW (担当教員の承認待ち)
--   pending_kyoto           ← NEW (教頭の承認待ち)
--   pending_vice_principal  ← NEW (副校長の承認待ち)
--   pending_principal       ← NEW (校長の承認待ち)
--   pending_office          ← NEW (事務長の承認待ち)
--   pending_chairman        ← NEW (理事長の承認待ち)
--   pending                 (旧: 汎用承認中 - 後方互換のため残す)
--   approved                (全承認完了・引出待ち)
--   ready_for_payment       (現金用意済み・受取待ち)
--   completed               (受取完了・出納済)
--   rejected                (却下)
-- ============================================================
