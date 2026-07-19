import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { toCsv } from '../src/guestbook/csv.js'
import type { Entry } from '../src/guestbook/types.js'

const KEY = 'guestbook:2026'
const redis = Redis.fromEnv()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  // 쓰기키와 완전히 다른 별도 관리자 시크릿.
  // 환경변수 미설정 시 undefined 비교로 항상 거부(fail closed).
  const admin = typeof req.query.admin === 'string' ? req.query.admin : ''
  if (!admin || admin !== process.env.GUESTBOOK_ADMIN_KEY) {
    return res.status(403).json({ error: 'INVALID_KEY' })
  }

  let entries: Entry[]
  try {
    entries = await redis.lrange<Entry>(KEY, 0, -1)
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }

  const format = typeof req.query.format === 'string' ? req.query.format : ''
  if (format === 'csv') {
    const header = ['이름', '소속', '이메일', '메시지', '동의시각', '작성시각']
    const rows = entries.map((e) => [
      e.name,
      e.affiliation,
      e.email,
      e.message,
      e.consentAt,
      e.createdAt,
    ])
    const csv = toCsv([header, ...rows])
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="guestbook.csv"')
    // 엑셀 한글 깨짐 방지용 UTF-8 BOM.
    return res.status(200).send('﻿' + csv)
  }

  return res.status(200).json({ entries })
}
