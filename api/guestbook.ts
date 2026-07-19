import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { validateEntry, isDuplicateEmail } from '../src/guestbook/validate.js'
import type { Entry, PublicEntry, SubmitResult } from '../src/guestbook/types.js'
import { toPublicEntry } from '../src/guestbook/types.js'

/** 두 학회(IAHR-APD2026 · SWGIC2026)가 동시 개최이므로 통합 키 1개를 쓴다. */
const KEY = 'guestbook:2026'
const MAX_ENTRIES = 500

const redis = Redis.fromEnv()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleGet(res)
  if (req.method === 'POST') return handlePost(req, res)

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

/** 공개 목록. 이메일·동의시각은 절대 내보내지 않는다(PublicEntry로 투영). */
async function handleGet(res: VercelResponse) {
  try {
    const entries = await redis.lrange<Entry>(KEY, 0, -1)
    const publicEntries: PublicEntry[] = entries.map(toPublicEntry)
    return res.status(200).json({ entries: publicEntries })
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const key = typeof body.key === 'string' ? body.key : ''

  // 프론트의 ?k= 게이팅은 경험 분기일 뿐이고, 실제 방어는 여기다.
  // 환경변수가 비어 있으면 undefined와 비교되어 항상 거부된다(fail closed).
  if (!key || key !== process.env.GUESTBOOK_WRITE_KEY) {
    return res.status(403).json({ error: 'INVALID_KEY' })
  }

  const result = validateEntry({
    name: typeof body.name === 'string' ? body.name : '',
    affiliation: typeof body.affiliation === 'string' ? body.affiliation : '',
    email: typeof body.email === 'string' ? body.email : '',
    message: typeof body.message === 'string' ? body.message : '',
    consent: body.consent === true,
  })
  if (!result.ok) {
    return res.status(400).json({ error: result.error })
  }

  // 이메일 중복 판정: 이미 있으면 저장하지 않고 '이미 수령'으로 응답.
  // 읽기-쓰기가 원자적이지 않아 거의 동시 제출 시 드물게 중복 저장 가능 — 물리 수령은 데스크 통제라 허용.
  let existing: Entry[]
  try {
    existing = await redis.lrange<Entry>(KEY, 0, -1)
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }
  if (isDuplicateEmail(existing, result.email)) {
    return res.status(200).json({ status: 'already_claimed' } satisfies SubmitResult)
  }

  const expiresAtMs = Date.parse(process.env.GUESTBOOK_EXPIRES_AT ?? '')
  // 파싱 실패뿐 아니라 과거 시각도 거부한다(과거 EXPIREAT는 키를 즉시 삭제).
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    return res.status(500).json({ error: 'CONFIG_ERROR' })
  }

  const now = new Date().toISOString()
  const entry: Entry = {
    id: crypto.randomUUID(),
    name: result.name,
    affiliation: result.affiliation,
    email: result.email,
    message: result.message,
    consentAt: now,
    createdAt: now,
  }

  try {
    // multi()로 세 명령을 트랜잭션으로 묶는다(부분 성공 방지). 절대 만료 TTL.
    await redis
      .multi()
      .lpush(KEY, entry)
      .ltrim(KEY, 0, MAX_ENTRIES - 1)
      .expireat(KEY, Math.floor(expiresAtMs / 1000))
      .exec()

    // 응답에도 공개 필드만 돌려준다(이메일 회신 금지).
    const publicEntry = toPublicEntry(entry)
    return res.status(201).json({ status: 'claimed', entry: publicEntry } satisfies SubmitResult)
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }
}
