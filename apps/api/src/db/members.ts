import type { Member, CreateMemberInput, UpdateMemberInput } from '@minton/types';
import { ulid } from '../lib/id';

export async function listMembers(db: D1Database): Promise<Member[]> {
  const { results } = await db
    .prepare('SELECT id, name, role, created_at FROM members ORDER BY created_at ASC')
    .all<Member>();
  return results;
}

export async function getMember(db: D1Database, id: string): Promise<Member | null> {
  return db
    .prepare('SELECT id, name, role, created_at FROM members WHERE id = ?')
    .bind(id)
    .first<Member>();
}

export async function createMember(
  db: D1Database,
  input: CreateMemberInput,
): Promise<Member> {
  const member: Member = {
    id: ulid(),
    name: input.name,
    role: input.role ?? 'member',
    created_at: new Date().toISOString(),
  };
  await db
    .prepare('INSERT INTO members (id, name, role, created_at) VALUES (?, ?, ?, ?)')
    .bind(member.id, member.name, member.role, member.created_at)
    .run();
  return member;
}

export async function updateMember(
  db: D1Database,
  id: string,
  input: UpdateMemberInput,
): Promise<Member | null> {
  const current = await getMember(db, id);
  if (!current) return null;

  const next: Member = {
    ...current,
    name: input.name ?? current.name,
    role: input.role ?? current.role,
  };
  await db
    .prepare('UPDATE members SET name = ?, role = ? WHERE id = ?')
    .bind(next.name, next.role, id)
    .run();
  return next;
}

export async function deleteMember(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM members WHERE id = ?').bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}
