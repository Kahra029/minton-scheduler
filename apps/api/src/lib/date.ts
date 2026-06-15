import type { Recurrence } from '@minton/types';

/** 定期開催で生成するイベントの安全上限 */
export const MAX_OCCURRENCES = 100;

function toUTC(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, n: number): string {
  const d = toUTC(date);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

function addMonths(date: string, n: number): string {
  const d = toUTC(date);
  d.setUTCMonth(d.getUTCMonth() + n);
  return fmt(d);
}

/**
 * 開始日と定期設定から開催日リストを展開する。
 * YYYY-MM-DD は辞書順 = 日付順なので until との比較は文字列比較で行える。
 */
export function expandRecurrence(start: string, rec: Recurrence): string[] {
  const dates = [start];
  let cur = start;
  while (dates.length < MAX_OCCURRENCES) {
    cur =
      rec.type === 'monthly'
        ? addMonths(cur, 1)
        : addDays(cur, rec.type === 'biweekly' ? 14 : 7);
    if (cur > rec.until) break;
    dates.push(cur);
  }
  return dates;
}
