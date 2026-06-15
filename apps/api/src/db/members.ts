import { ulid } from '../lib/id';
import type { Member, CreateMemberInput, UpdateMemberInput } from '@minton/types';

const COLS = 'id, name, role, email, created_at';

function normEmail(email: string | null | undefined): string | null {
  return email ? email.toLowerCase() : null;
}

export async function listMembers(db: D1Database): Promise<Member[]> {
  const { results } = await db
    .prepare(`SELECT ${COLS} FROM members ORDER BY created_at ASC`)
    .all<Member>();
  return results;
}

export async function getMember(db: D1Database, id: string): Promise<Member | null> {
  return db
    .prepare(`SELECT ${COLS} FROM members WHERE id = ?`)
    .bind(id)
    .first<Member>();
}

export async function getMemberByEmail(
  db: D1Database,
  email: string,
): Promise<Member | null> {
  return db
    .prepare(`SELECT ${COLS} FROM members WHERE email = ?`)
    .bind(email.toLowerCase())
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
    email: normEmail(input.email),
    created_at: new Date().toISOString(),
  };
  await db
    .prepare(
      'INSERT INTO members (id, name, role, email, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(member.id, member.name, member.role, member.email, member.created_at)
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
    email: input.email !== undefined ? normEmail(input.email) : current.email,
  };
  await db
    .prepare('UPDATE members SET name = ?, role = ?, email = ? WHERE id = ?')
    .bind(next.name, next.role, next.email, id)
    .run();
  return next;
}

export async function deleteMember(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM members WHERE id = ?').bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}
