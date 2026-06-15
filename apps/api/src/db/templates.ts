import { eq } from 'drizzle-orm';
import { ulid } from '../lib/id';
import { getDb } from './client';
import { eventTemplates } from './schema';
import type {
  EventTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@minton/types';

export async function listTemplates(d1: D1Database): Promise<EventTemplate[]> {
  return getDb(d1)
    .select()
    .from(eventTemplates)
    .orderBy(eventTemplates.created_at);
}

export async function getTemplate(
  d1: D1Database,
  id: string,
): Promise<EventTemplate | null> {
  const rows = await getDb(d1)
    .select()
    .from(eventTemplates)
    .where(eq(eventTemplates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createTemplate(
  d1: D1Database,
  input: CreateTemplateInput,
): Promise<EventTemplate> {
  const template: EventTemplate = {
    id: ulid(),
    name: input.name,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location,
    note: input.note ?? null,
    created_at: new Date().toISOString(),
  };
  await getDb(d1).insert(eventTemplates).values(template);
  return template;
}

export async function updateTemplate(
  d1: D1Database,
  id: string,
  input: UpdateTemplateInput,
): Promise<EventTemplate | null> {
  const current = await getTemplate(d1, id);
  if (!current) return null;

  const next: EventTemplate = {
    ...current,
    ...input,
    note: input.note !== undefined ? (input.note ?? null) : current.note,
  };
  await getDb(d1)
    .update(eventTemplates)
    .set({
      name: next.name,
      start_time: next.start_time,
      end_time: next.end_time,
      location: next.location,
      note: next.note,
    })
    .where(eq(eventTemplates.id, id));
  return next;
}

export async function deleteTemplate(
  d1: D1Database,
  id: string,
): Promise<boolean> {
  const res = await getDb(d1).delete(eventTemplates).where(eq(eventTemplates.id, id));
  return (res.meta.changes ?? 0) > 0;
}
