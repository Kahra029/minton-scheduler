#!/usr/bin/env node
// 初期管理者をシードする (X-Admin-Token 廃止に伴うブートストラップ)。
//
// 使い方:
//   npm run seed:admin -- --email admin@example.com --name 幹事
//   npm run seed:admin -- --email admin@example.com --remote   # 本番 D1
//
// 既に同じ email のメンバーがいれば admin に昇格する。
import { execFileSync } from 'node:child_process'
import { ulid } from 'ulid'

const args = process.argv.slice(2)
const getArg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const email = getArg('email')
const name = getArg('name') ?? '管理者'
const remote = args.includes('--remote')

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error(
    '使い方: npm run seed:admin -- --email <email> [--name <名前>] [--remote]',
  )
  process.exit(1)
}

const id = ulid()
const now = new Date().toISOString()
const emailLc = email.toLowerCase()
const safeName = name.replace(/'/g, "''") // SQL リテラルのエスケープ

const sql =
  `INSERT INTO members (id, name, role, email, created_at) ` +
  `VALUES ('${id}', '${safeName}', 'admin', '${emailLc}', '${now}') ` +
  `ON CONFLICT(email) DO UPDATE SET role = 'admin', name = excluded.name;`

const target = remote ? 'REMOTE (本番)' : 'LOCAL (開発)'
console.log(`管理者をシードします [${target}]: ${name} <${emailLc}>`)

try {
  execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'minton-scheduler',
      remote ? '--remote' : '--local',
      '--command',
      sql,
    ],
    // stdin を渡さず非対話実行 (確認プロンプトは fallback で yes になる)
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )
  console.log('✅ 管理者をシードしました')
} catch {
  console.error('❌ シードに失敗しました')
  process.exit(1)
}
