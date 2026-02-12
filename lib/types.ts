// ============================================================
// 共通型定義
// ============================================================

/** 品目明細の1行 */
export interface LineItem {
  /** 品目・品名 */
  name: string;
  /** 数量 */
  quantity: number;
  /** 単価（円） */
  unit_price: number;
  /** 金額（円） = quantity × unit_price */
  amount: number;
}

/** LineItem の空行を作成 */
export function createEmptyLineItem(): LineItem {
  return { name: "", quantity: 1, unit_price: 0, amount: 0 };
}

/** line_items 配列から合計金額を計算 */
export function calcTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
