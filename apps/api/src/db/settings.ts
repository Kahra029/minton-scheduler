import { eq } from 'drizzle-orm';
import { getDb } from './client';
import { settings } from './schema';
import type { FeeSettings, UpdateFeeSettingsInput } from '@minton/types';

const DEFAULT: FeeSettings = {
  fee_present: 0,
  fee_partial: 0,
  fee_leave_early: 0,
  fee_visitor: 0,
};

export async function getSettings(d1: D1Database): Promise<FeeSettings> {
  const rows = await getDb(d1).select().from(settings).where(eq(settings.id, 1)).limit(1);
  const r = rows[0];
  if (!r) return DEFAULT;
  return {
    fee_present: r.fee_present,
    fee_partial: r.fee_partial,
    fee_leave_early: r.fee_leave_early,
    fee_visitor: r.fee_visitor,
  };
}

export async function updateSettings(
  d1: D1Database,
  input: UpdateFeeSettingsInput,
): Promise<FeeSettings> {
  await getDb(d1)
    .update(settings)
    .set({ ...input, updated_at: new Date().toISOString() })
    .where(eq(settings.id, 1));
  return input;
}
