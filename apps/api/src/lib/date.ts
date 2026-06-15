import dayjs from 'dayjs';
import type { Recurrence } from '@minton/types';

/** 定期開催で生成するイベントの安全上限 */
export const MAX_OCCURRENCES = 100;

/**
 * 開始日と定期設定から開催日リストを展開する。
 * YYYY-MM-DD は辞書順 = 日付順なので until との比較は文字列比較で行える。
 */
export function expandRecurrence(start: string, rec: Recurrence): string[] {
  const dates = [start];
  let cur = dayjs(start);
  while (dates.length < MAX_OCCURRENCES) {
    cur =
      rec.type === 'monthly'
        ? cur.add(1, 'month')
        : cur.add(rec.type === 'biweekly' ? 14 : 7, 'day');
    const formatted = cur.format('YYYY-MM-DD');
    if (formatted > rec.until) break;
    dates.push(formatted);
  }
  return dates;
}
