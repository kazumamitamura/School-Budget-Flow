// ============================================================
// 承認リレー ワークフロー定義
// ============================================================

/** 承認フローの各ステップ */
export interface ApprovalStep {
  /** budget_requests.status の値 */
  status: string;
  /** このステップで承認を行う役職 */
  role: string;
  /** 表示用ラベル */
  label: string;
}

/**
 * 承認フローの順序定義（わらしべ長者リレー）
 * 申請提出 → 担当教員 → 教頭 → 副校長 → 校長 → 事務長 → 理事長 → 決裁完了
 */
export const APPROVAL_FLOW: ApprovalStep[] = [
  { status: "pending_teacher", role: "teacher", label: "担当教員" },
  { status: "pending_kyoto", role: "kyoto", label: "教頭" },
  { status: "pending_vice_principal", role: "vice_principal", label: "副校長" },
  { status: "pending_principal", role: "principal", label: "校長" },
  { status: "pending_office", role: "office_chief", label: "事務長" },
  { status: "pending_chairman", role: "chairman", label: "理事長" },
];

/** 最終承認後のステータス */
export const FINAL_APPROVED_STATUS = "approved";

/**
 * 現在のステータスから、次のステータスを取得する
 * @returns 次のステータス。最終ステップの場合は "approved" を返す。
 *          該当しない場合は null を返す。
 */
export function getNextStatus(currentStatus: string): string | null {
  const idx = APPROVAL_FLOW.findIndex((s) => s.status === currentStatus);
  if (idx === -1) return null;
  if (idx === APPROVAL_FLOW.length - 1) return FINAL_APPROVED_STATUS;
  return APPROVAL_FLOW[idx + 1].status;
}

/**
 * 現在のステータスに対して承認権限を持つ役職を取得する
 */
export function getRequiredRole(currentStatus: string): string | null {
  const step = APPROVAL_FLOW.find((s) => s.status === currentStatus);
  return step?.role ?? null;
}

/**
 * ステータスがどのステップまで完了しているかのインデックスを返す
 * -1: まだ申請のみ（draft）
 *  0: 担当教員の承認待ち = 申請者提出済み
 *  1: 教頭の承認待ち = 担当教員まで承認済み ... etc
 *  FLOW.length: 全承認完了
 */
export function getCompletedStepIndex(status: string): number {
  if (status === "draft") return -1;

  const idx = APPROVAL_FLOW.findIndex((s) => s.status === status);
  if (idx !== -1) return idx; // そのステップの「待ち」= 前のステップまで完了

  // approved, ready_for_payment, completed → 全ステップ完了
  if (["approved", "ready_for_payment", "completed"].includes(status)) {
    return APPROVAL_FLOW.length;
  }

  // rejected や pending(旧) → 現在位置不明、-1を返す
  return -1;
}

/** 役職の表示ラベルマップ */
export const ROLE_LABELS: Record<string, string> = {
  student: "生徒",
  teacher: "担当教員",
  kyoto: "教頭",
  vice_principal: "副校長",
  principal: "校長",
  office_chief: "事務長",
  chairman: "理事長",
  accounting: "出納・事務室",
};

/** ステータスの表示ラベルマップ */
export const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  pending_teacher: "担当教員 承認待ち",
  pending_kyoto: "教頭 承認待ち",
  pending_vice_principal: "副校長 承認待ち",
  pending_principal: "校長 承認待ち",
  pending_office: "事務長 承認待ち",
  pending_chairman: "理事長 承認待ち",
  pending: "承認中",
  approved: "全承認完了・引出待ち",
  ready_for_payment: "現金用意済み・受取待ち",
  completed: "出納済",
  rejected: "却下",
};
