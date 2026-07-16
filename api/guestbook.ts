import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { validateEntry } from '../src/guestbook/validate'
import type { Entry } from '../src/guestbook/types'

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

async function handleGet(res: VercelResponse) {
  try {
    const entries = await redis.lrange<Entry>(KEY, 0, -1)
    return res.status(200).json({ entries })
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
    nickname: typeof body.nickname === 'string' ? body.nickname : '',
    message: typeof body.message === 'string' ? body.message : '',
  })
  if (!result.ok) {
    return res.status(400).json({ error: result.error })
  }

  const expiresAtMs = Date.parse(process.env.GUESTBOOK_EXPIRES_AT ?? '')
  if (Number.isNaN(expiresAtMs)) {
    return res.status(500).json({ error: 'CONFIG_ERROR' })
  }

  const entry: Entry = {
    id: crypto.randomUUID(),
    nickname: result.nickname,
    message: result.message,
    createdAt: new Date().toISOString(),
  }

  try {
    await redis.lpush(KEY, entry)
    await redis.ltrim(KEY, 0, MAX_ENTRIES - 1)
    // 슬라이딩이 아닌 절대 만료. 마지막 글이 언제 올라오든 예정 시각에 전체 소멸.
    await redis.expireat(KEY, Math.floor(expiresAtMs / 1000))
    return res.status(201).json({ entry })
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }
}
