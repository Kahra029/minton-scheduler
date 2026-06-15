import { eq } from 'drizzle-orm';
import { ulid } from '../lib/id';
import { getDb } from './client';
import { members } from './schema';
import type { Member, CreateMemberInput, UpdateMemberInput } from '@minton/types';

function normEmail(email: string | null | undefined): string | null {
  return email ? email.toLowerCase() : null;
}

export async function listMembers(d1: D1Database): Promise<Member[]> {
  return getDb(d1).select().from(members).orderBy(members.created_at);
}

export async function getMember(d1: D1Database, id: string): Promise<Member | null> {
  const rows = await getDb(d1).select().from(members).where(eq(members.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getMemberByEmail(
  d1: D1Database,
  email: string,
): Promise<Member | null> {
  const rows = await getDb(d1)
    .select()
    .from(members)
    .where(eq(members.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function createMember(
  d1: D1Database,
  input: CreateMemberInput,
): Promise<Member> {
  const member: Member = {
    id: ulid(),
    name: input.name,
    role: input.role ?? 'member',
    email: normEmail(input.email),
    created_at: new Date().toISOString(),
  };
  await getDb(d1).insert(members).values(member);
  return member;
}

export async function updateMember(
  d1: D1Database,
  id: string,
  input: UpdateMemberInput,
): Promise<Member | null> {
  const current = await getMember(d1, id);
  if (!current) return null;

  const next = {
    name: input.name ?? current.name,
    role: input.role ?? current.role,
    email: input.email !== undefined ? normEmail(input.email) : current.email,
  };
  await getDb(d1).update(members).set(next).where(eq(members.id, id));
  return { ...current, ...next };
}

export async function deleteMember(d1: D1Database, id: string): Promise<boolean> {
  const res = await getDb(d1).delete(members).where(eq(members.id, id));
  return (res.meta.changes ?? 0) > 0;
}
