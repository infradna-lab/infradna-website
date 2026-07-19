# 방명록 개인정보 수집 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방명록을 익명 공개 벽에서 이름·소속·이메일·메시지를 수집하는 참가자 명부로 전환하되, 이메일은 관리자만 열람 가능하게 한다.

**Architecture:** 전체 항목을 단일 Redis 리스트(`guestbook:2026`)에 저장하고, 공개 `GET /api/guestbook`은 이메일을 뺀 `PublicEntry`로 투영해 반환한다. 관리자 열람은 별도 파일 `api/guestbook-export.ts` + 별도 시크릿 `GUESTBOOK_ADMIN_KEY`로 물리적으로 분리한다(설계 A안).

**Tech Stack:** React 19 + TypeScript + Vite 7, Vercel serverless(`@vercel/node`), Upstash Redis(`@upstash/redis`), vitest.

## Global Constraints

- 이메일·동의시각(`consentAt`)은 공개 경로(`GET /api/guestbook`)로 **절대 반환하지 않는다**. 공개 응답은 `PublicEntry`(id·name·affiliation·message·createdAt)로만 투영한다.
- 관리자 시크릿 `GUESTBOOK_ADMIN_KEY`는 **쓰기키 `GUESTBOOK_WRITE_KEY`와 반드시 다른 값**이며 서버 전용 — 클라이언트 번들에 절대 포함 금지.
- 키 검증은 fail-closed: 환경변수 미설정 시 `undefined` 비교로 항상 거부.
- 서버는 기계용 에러 코드만 반환하고, 한국어 문구 매핑은 클라이언트 `api.ts`의 `ERROR_MESSAGES`에서만 한다(기존 원칙).
- api/* 파일은 `erasableSyntaxOnly: true`이므로 파라미터 프로퍼티·enum 등 런타임 생성 문법 금지. src 임포트는 `.js` 확장자로 한다(예: `'../src/guestbook/validate.js'`).
- Redis 저장 항목의 절대 만료 TTL(`expireat`) 모델을 유지한다 — 이것이 곧 PIPA 보유기간이다.
- **중간 커밋은 빌드가 깨질 수 있다.** 이 변경은 스키마를 가로지르므로 Task 1~2는 vitest만 초록, full `npm run build`는 Task 4에서 처음으로 초록이 된다. **별도 브랜치에서 작업하고 Task 4의 full build 통과 후에만 push** 한다(main 자동 배포 보호).
- Redis 리스트는 현재 비어 있으므로 스키마 마이그레이션 불필요. 키 `guestbook:2026` 유지.

---

## File Structure

- `src/guestbook/validate.ts` (수정) — 순수 검증 로직. 철학 반전(이메일 필수 수집).
- `src/guestbook/validate.test.ts` (수정) — 위 로직의 vitest 스펙.
- `src/guestbook/csv.ts` (신규) — 순수 CSV 인코딩 헬퍼(수식 인젝션 방어 포함).
- `src/guestbook/csv.test.ts` (신규) — CSV 헬퍼 vitest 스펙.
- `src/guestbook/types.ts` (수정) — `Entry`·`PublicEntry`·`ApiErrorCode`.
- `api/guestbook.ts` (수정) — 공개 GET(투영)·POST(검증·저장).
- `api/guestbook-export.ts` (신규) — 관리자 전용 JSON/CSV export.
- `src/guestbook/api.ts` (수정) — 클라 fetch/post + 에러 문구.
- `src/guestbook/GuestbookForm.tsx` (수정) — 4개 입력 + 동의 체크박스 + 고지문.
- `src/guestbook/GuestbookList.tsx` (수정) — 이름·소속·메시지 표시.
- `src/guestbook/GuestbookPage.tsx` (수정) — 제출 핸들러 타입·안내문.
- `.env.local` / Vercel (수정) — `GUESTBOOK_ADMIN_KEY` 추가.

---

## Task 1: 검증 로직 반전 (validate.ts)

**Files:**
- Modify: `src/guestbook/validate.ts` (전면 교체)
- Test: `src/guestbook/validate.test.ts` (전면 교체)

**Interfaces:**
- Produces:
  - `NAME_MAX = 20`, `AFFILIATION_MAX = 40`, `EMAIL_MAX = 100`, `MESSAGE_MAX = 100` (상수)
  - `type ValidationInput = { name?: string; affiliation?: string; email?: string; message?: string; consent?: boolean }`
  - `type ValidationError = 'INVALID_INPUT' | 'INVALID_EMAIL' | 'PII_DETECTED' | 'CONSENT_REQUIRED'`
  - `type ValidationResult = { ok: true; name: string; affiliation: string; email: string; message: string } | { ok: false; error: ValidationError }`
  - `function validateEntry(input: ValidationInput): ValidationResult`
- Note: `DEFAULT_NICKNAME`은 제거된다(이름 필수).

- [ ] **Step 1: 실패 테스트 작성** — `src/guestbook/validate.test.ts` 전체를 아래로 교체

```ts
import { describe, it, expect } from 'vitest'
import { validateEntry } from './validate'

const valid = {
  name: '홍길동',
  affiliation: '인프라재난관리진흥원',
  email: 'hong@example.com',
  message: '잘 봤습니다',
  consent: true,
}

describe('validateEntry', () => {
  it('정상 입력을 통과시키고 trim한다', () => {
    const result = validateEntry({
      name: ' 홍길동 ',
      affiliation: ' 인프라DNA ',
      email: ' hong@example.com ',
      message: '  좋아요  ',
      consent: true,
    })
    expect(result).toEqual({
      ok: true,
      name: '홍길동',
      affiliation: '인프라DNA',
      email: 'hong@example.com',
      message: '좋아요',
    })
  })

  it.each([
    ['name', { ...valid, name: '   ' }],
    ['affiliation', { ...valid, affiliation: '' }],
    ['email', { ...valid, email: '' }],
    ['message', { ...valid, message: '  ' }],
  ])('%s 가 비면 INVALID_INPUT', (_field, input) => {
    expect(validateEntry(input)).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it.each([
    ['name', { ...valid, name: 'ㄱ'.repeat(21) }],
    ['affiliation', { ...valid, affiliation: 'ㄱ'.repeat(41) }],
    ['email', { ...valid, email: 'a'.repeat(90) + '@example.com' }],
    ['message', { ...valid, message: 'ㄱ'.repeat(101) }],
  ])('%s 길이 상한 초과는 INVALID_INPUT', (_field, input) => {
    expect(validateEntry(input)).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it.each([
    ['plainstring', '골뱅이 없음'],
    ['no-domain@', '도메인 없음'],
    ['@example.com', '로컬파트 없음'],
    ['a@b', 'TLD 없음'],
    ['a b@example.com', '공백 포함'],
  ])('잘못된 이메일 형식은 INVALID_EMAIL: %s (%s)', (email) => {
    expect(validateEntry({ ...valid, email })).toEqual({ ok: false, error: 'INVALID_EMAIL' })
  })

  it.each([
    ['hong.gil-dong+test@sub.example.co.kr', '복잡한 유효 주소'],
    ['a@b.co', '최소 유효 주소'],
  ])('유효한 이메일은 통과: %s (%s)', (email) => {
    expect(validateEntry({ ...valid, email }).ok).toBe(true)
  })

  it.each([
    ['name', { ...valid, name: '홍길동 010-1234-5678' }],
    ['affiliation', { ...valid, affiliation: '문의 hong@ex.com' }],
    ['message', { ...valid, message: '연락 주세요 010-1234-5678' }],
  ])('공개 필드(%s)에 연락처가 있으면 PII_DETECTED', (_field, input) => {
    expect(validateEntry(input)).toEqual({ ok: false, error: 'PII_DETECTED' })
  })

  it('이메일 칸의 이메일은 PII로 막지 않는다', () => {
    expect(validateEntry(valid).ok).toBe(true)
  })

  it('동의하지 않으면 CONSENT_REQUIRED', () => {
    expect(validateEntry({ ...valid, consent: false })).toEqual({
      ok: false,
      error: 'CONSENT_REQUIRED',
    })
  })

  it('consent 미지정이면 CONSENT_REQUIRED', () => {
    const { consent: _omit, ...noConsent } = valid
    expect(validateEntry(noConsent)).toEqual({ ok: false, error: 'CONSENT_REQUIRED' })
  })

  it('길이 위반과 PII가 겹치면 길이 위반을 먼저 알린다', () => {
    const input = { ...valid, message: '010-1234-5678 ' + 'ㄱ'.repeat(100) }
    expect(validateEntry(input)).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it.each([
    ['2026년 학회 잘 봤습니다', '연도'],
    ['부스 010번에서 만나요', '짧은 숫자'],
    ['버전 1.0.5 업데이트', '버전 표기'],
  ])('전화번호가 아닌 숫자는 통과: %s (%s)', (message) => {
    expect(validateEntry({ ...valid, message }).ok).toBe(true)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/guestbook/validate.test.ts`
Expected: FAIL — 기존 `validateEntry`가 `nickname` 기반이라 새 스펙과 불일치.

- [ ] **Step 3: 최소 구현** — `src/guestbook/validate.ts` 전체를 아래로 교체

```ts
export const NAME_MAX = 20
export const AFFILIATION_MAX = 40
export const EMAIL_MAX = 100
export const MESSAGE_MAX = 100

/**
 * 공개되는 이름·소속·메시지에 사용자가 적어 넣는 연락처를 걸러낸다.
 * 이메일은 전용 칸으로 받으므로 이 검사 대상에서 제외한다.
 */
const PHONE = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/
const EMAIL_IN_TEXT = /[\w.+-]+@[\w-]+\.[\w.]+/
/** 이메일 칸 형식 검증 — 문자열 전체가 하나의 주소여야 한다(앵커). */
const EMAIL_FORMAT = /^[\w.+-]+@[\w-]+\.[\w.]+$/

export type ValidationInput = {
  name?: string
  affiliation?: string
  email?: string
  message?: string
  consent?: boolean
}

export type ValidationError =
  | 'INVALID_INPUT'
  | 'INVALID_EMAIL'
  | 'PII_DETECTED'
  | 'CONSENT_REQUIRED'

export type ValidationResult =
  | { ok: true; name: string; affiliation: string; email: string; message: string }
  | { ok: false; error: ValidationError }

export function validateEntry(input: ValidationInput): ValidationResult {
  const name = (input.name ?? '').trim()
  const affiliation = (input.affiliation ?? '').trim()
  const email = (input.email ?? '').trim()
  const message = (input.message ?? '').trim()

  // 1) 필수 + 길이
  if (
    name.length === 0 || name.length > NAME_MAX ||
    affiliation.length === 0 || affiliation.length > AFFILIATION_MAX ||
    email.length === 0 || email.length > EMAIL_MAX ||
    message.length === 0 || message.length > MESSAGE_MAX
  ) {
    return { ok: false, error: 'INVALID_INPUT' }
  }

  // 2) 이메일 형식
  if (!EMAIL_FORMAT.test(email)) {
    return { ok: false, error: 'INVALID_EMAIL' }
  }

  // 3) 공개 필드의 연락처 차단 (이메일 칸 제외)
  const hasContact = (t: string) => PHONE.test(t) || EMAIL_IN_TEXT.test(t)
  if (hasContact(name) || hasContact(affiliation) || hasContact(message)) {
    return { ok: false, error: 'PII_DETECTED' }
  }

  // 4) 동의
  if (input.consent !== true) {
    return { ok: false, error: 'CONSENT_REQUIRED' }
  }

  return { ok: true, name, affiliation, email, message }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/guestbook/validate.test.ts`
Expected: PASS (모든 케이스 초록)

- [ ] **Step 5: 커밋**

```bash
git add src/guestbook/validate.ts src/guestbook/validate.test.ts
git commit -m "feat: 방명록 검증을 개인정보 수집형으로 반전(이름·소속·이메일·동의 필수)"
```

---

## Task 2: CSV 인코딩 헬퍼 (csv.ts)

**Files:**
- Create: `src/guestbook/csv.ts`
- Test: `src/guestbook/csv.test.ts`

**Interfaces:**
- Produces:
  - `function escapeCsvCell(value: string): string`
  - `function toCsv(rows: string[][]): string` — 행을 `\r\n`으로, 셀을 `,`로 결합. 각 셀은 `escapeCsvCell` 적용.

- [ ] **Step 1: 실패 테스트 작성** — `src/guestbook/csv.test.ts` 생성

```ts
import { describe, it, expect } from 'vitest'
import { escapeCsvCell, toCsv } from './csv'

describe('escapeCsvCell', () => {
  it('평범한 값은 그대로', () => {
    expect(escapeCsvCell('홍길동')).toBe('홍길동')
  })

  it('콤마가 있으면 따옴표로 감싼다', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
  })

  it('내부 따옴표는 두 번으로 이스케이프하고 감싼다', () => {
    expect(escapeCsvCell('그는 "안녕"')).toBe('"그는 ""안녕"""')
  })

  it('줄바꿈이 있으면 따옴표로 감싼다', () => {
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"')
  })

  it.each(['=1+1', '+1', '-1', '@SUM(A1)'])('수식 시작 문자는 작은따옴표를 붙인다: %s', (v) => {
    expect(escapeCsvCell(v)).toBe("'" + v)
  })

  it('수식 문자 + 콤마는 접두 후 감싼다', () => {
    expect(escapeCsvCell('=1,2')).toBe('"\'=1,2"')
  })
})

describe('toCsv', () => {
  it('행을 CRLF로, 셀을 콤마로 결합한다', () => {
    const csv = toCsv([
      ['이름', '소속'],
      ['홍길동', '인프라DNA'],
    ])
    expect(csv).toBe('이름,소속\r\n홍길동,인프라DNA')
  })

  it('각 셀에 이스케이프를 적용한다', () => {
    expect(toCsv([['a,b', '=x']])).toBe('"a,b",\'=x')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/guestbook/csv.test.ts`
Expected: FAIL — `./csv` 모듈 없음.

- [ ] **Step 3: 최소 구현** — `src/guestbook/csv.ts` 생성

```ts
/**
 * CSV 한 셀을 안전하게 인코딩한다.
 * - 수식 인젝션 방어: = + - @ 로 시작하면 앞에 작은따옴표를 붙인다.
 * - 특수문자(콤마·따옴표·줄바꿈)가 있으면 전체를 큰따옴표로 감싸고 내부 따옴표는 두 번 쓴다.
 */
export function escapeCsvCell(value: string): string {
  let v = value
  if (/^[=+\-@]/.test(v)) v = "'" + v
  if (/[",\n\r]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"'
  return v
}

/** 행 배열(각 행은 셀 문자열 배열)을 CSV 텍스트로 변환한다. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/guestbook/csv.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/guestbook/csv.ts src/guestbook/csv.test.ts
git commit -m "feat: 관리자 CSV export용 인코딩 헬퍼(수식 인젝션 방어) 추가"
```

---

## Task 3: 데이터 모델 + 백엔드 (types.ts, api/guestbook.ts, api/guestbook-export.ts)

**Files:**
- Modify: `src/guestbook/types.ts`
- Modify: `api/guestbook.ts`
- Create: `api/guestbook-export.ts`

**Interfaces:**
- Consumes: Task 1의 `validateEntry`, Task 2의 `toCsv`.
- Produces:
  - `type Entry = { id: string; name: string; affiliation: string; email: string; message: string; consentAt: string; createdAt: string }`
  - `type PublicEntry = Pick<Entry, 'id' | 'name' | 'affiliation' | 'message' | 'createdAt'>`
  - `type ApiErrorCode` (아래 목록)
  - `GET /api/guestbook` → `{ entries: PublicEntry[] }`
  - `POST /api/guestbook` → 201 `{ entry: PublicEntry }`
  - `GET /api/guestbook-export` (인증: `Authorization: Bearer <key>`) → `{ entries: Entry[] }`; `?format=csv` → CSV 텍스트. (Task 3에서는 `?admin=` 쿼리로 구현했으나 최종 리뷰 반영으로 Task 6에서 Bearer 헤더로 변경 — Task 5·관리자 페이지 참고.)

- [ ] **Step 1: 타입 교체** — `src/guestbook/types.ts` 전체를 아래로 교체

```ts
/** 방명록 항목 1건 전체. Redis에 JSON으로 저장된다(이메일·동의시각은 관리자만). */
export type Entry = {
  id: string
  name: string          // 이름 (공개)
  affiliation: string   // 소속 (공개)
  email: string         // 이메일 (비공개)
  message: string       // 메시지 (공개)
  /** 동의 시각 ISO 8601 — 동의 증빙 */
  consentAt: string
  /** ISO 8601, 서버 생성 */
  createdAt: string
}

/** 공개 목록/응답 전용 투영. 이메일·동의시각을 포함하지 않는다. */
export type PublicEntry = Pick<Entry, 'id' | 'name' | 'affiliation' | 'message' | 'createdAt'>

/** 서버가 반환하는 기계용 에러 코드. 한국어 문구 매핑은 클라이언트 책임. */
export type ApiErrorCode =
  | 'INVALID_KEY'
  | 'INVALID_INPUT'
  | 'INVALID_EMAIL'
  | 'PII_DETECTED'
  | 'CONSENT_REQUIRED'
  | 'STORAGE_ERROR'
  | 'CONFIG_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'NETWORK_ERROR'
```

- [ ] **Step 2: 공개 엔드포인트 교체** — `api/guestbook.ts` 전체를 아래로 교체

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { validateEntry } from '../src/guestbook/validate.js'
import type { Entry, PublicEntry } from '../src/guestbook/types.js'

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
    const publicEntries: PublicEntry[] = entries.map((e) => ({
      id: e.id,
      name: e.name,
      affiliation: e.affiliation,
      message: e.message,
      createdAt: e.createdAt,
    }))
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
    const publicEntry: PublicEntry = {
      id: entry.id,
      name: entry.name,
      affiliation: entry.affiliation,
      message: entry.message,
      createdAt: entry.createdAt,
    }
    return res.status(201).json({ entry: publicEntry })
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }
}
```

- [ ] **Step 3: 관리자 export 엔드포인트 생성** — `api/guestbook-export.ts` 생성

```ts
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

  if (req.query.format === 'csv') {
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
```

- [ ] **Step 4: api 타입체크**

Run: `npx tsc -p tsconfig.api.json --noEmit`
Expected: 오류 없음(exit 0). (참고: 이 시점에 `npm run build`의 app 부분은 아직 실패 — Task 4에서 초록.)

- [ ] **Step 5: 커밋**

```bash
git add src/guestbook/types.ts api/guestbook.ts api/guestbook-export.ts
git commit -m "feat: 방명록 백엔드 개인정보 수집형 전환 + 관리자 export 엔드포인트"
```

---

## Task 4: 프론트엔드 (api.ts, GuestbookForm, GuestbookList, GuestbookPage)

**Files:**
- Modify: `src/guestbook/api.ts`
- Modify: `src/guestbook/GuestbookForm.tsx`
- Modify: `src/guestbook/GuestbookList.tsx`
- Modify: `src/guestbook/GuestbookPage.tsx`

**Interfaces:**
- Consumes: Task 1의 검증 상수/`validateEntry`, Task 3의 `PublicEntry`·`ApiErrorCode`.
- Produces:
  - `fetchEntries(): Promise<PublicEntry[]>`
  - `postEntry(input: { key: string; name: string; affiliation: string; email: string; message: string; consent: boolean }): Promise<PublicEntry>`
  - `GuestbookForm` prop `onSubmit: (input: { name: string; affiliation: string; email: string; message: string; consent: boolean }) => Promise<void>`

- [ ] **Step 1: api.ts 교체** — `src/guestbook/api.ts` 전체를 아래로 교체

```ts
import type { ApiErrorCode, PublicEntry } from './types'

/** 서버는 코드만 준다. 화면 문구는 여기서만 정의한다(서버 문자열을 그대로 렌더하지 않음). */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_KEY: '이 링크로는 글을 남길 수 없습니다. 부스의 QR 코드를 다시 스캔해 주세요.',
  INVALID_INPUT: '이름·소속·이메일·메시지를 모두 입력해 주세요.',
  INVALID_EMAIL: '이메일 주소 형식이 올바르지 않습니다.',
  PII_DETECTED: '이름·소속·메시지에는 전화번호나 이메일을 넣지 말아 주세요. 이메일은 이메일 칸에만 입력해 주세요.',
  CONSENT_REQUIRED: '개인정보 수집·이용에 동의해 주세요.',
  STORAGE_ERROR: '잠시 문제가 생겼습니다. 다시 시도해 주세요.',
  CONFIG_ERROR: '잠시 문제가 생겼습니다. 다시 시도해 주세요.',
  METHOD_NOT_ALLOWED: '잠시 문제가 생겼습니다. 다시 시도해 주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해 주세요.',
}

export class GuestbookError extends Error {
  // erasableSyntaxOnly: true 이므로 파라미터 프로퍼티를 쓸 수 없다.
  code: ApiErrorCode

  constructor(code: ApiErrorCode) {
    super(code)
    this.name = 'GuestbookError'
    this.code = code
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof GuestbookError) return ERROR_MESSAGES[error.code]
  return ERROR_MESSAGES.NETWORK_ERROR
}

/** 응답 본문을 JSON으로 읽는다. 파싱 실패 시 STORAGE_ERROR. */
async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new GuestbookError('STORAGE_ERROR')
  }
}

/** 응답 본문에서 에러 코드를 꺼낸다. 본문이 깨져 있으면 STORAGE_ERROR. */
async function toError(res: Response): Promise<GuestbookError> {
  try {
    const body = await parseJson<{ error?: string }>(res)
    if (body.error && body.error in ERROR_MESSAGES) {
      return new GuestbookError(body.error as ApiErrorCode)
    }
  } catch {
    // 파싱 실패 또는 알 수 없는 코드 — 아래 기본값으로.
  }
  return new GuestbookError('STORAGE_ERROR')
}

export async function fetchEntries(): Promise<PublicEntry[]> {
  let res: Response
  try {
    res = await fetch('/api/guestbook')
  } catch {
    throw new GuestbookError('NETWORK_ERROR')
  }
  if (!res.ok) throw await toError(res)

  const body = await parseJson<{ entries: PublicEntry[] }>(res)
  return body.entries
}

export async function postEntry(input: {
  key: string
  name: string
  affiliation: string
  email: string
  message: string
  consent: boolean
}): Promise<PublicEntry> {
  let res: Response
  try {
    res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new GuestbookError('NETWORK_ERROR')
  }
  if (!res.ok) throw await toError(res)

  const body = await parseJson<{ entry: PublicEntry }>(res)
  return body.entry
}
```

- [ ] **Step 2: GuestbookForm 교체** — `src/guestbook/GuestbookForm.tsx` 전체를 아래로 교체

```tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  AFFILIATION_MAX,
  EMAIL_MAX,
  MESSAGE_MAX,
  NAME_MAX,
  validateEntry,
} from './validate'
import { errorMessage, GuestbookError } from './api'

type SubmitInput = {
  name: string
  affiliation: string
  email: string
  message: string
  consent: boolean
}

type Props = {
  onSubmit: (input: SubmitInput) => Promise<void>
  submitError: string | null
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:border-[#0891b2] focus:outline-none'

function GuestbookForm({ onSubmit, submitError }: Props) {
  const [name, setName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    // 즉각 피드백용. 실효적 방어는 서버 검증이다.
    const result = validateEntry({ name, affiliation, email, message, consent })
    if (!result.ok) {
      setLocalError(errorMessage(new GuestbookError(result.error)))
      return
    }
    setLocalError(null)
    setSubmitting(true)

    try {
      await onSubmit({ name, affiliation, email, message, consent })
      // 성공했을 때만 비운다
      setName('')
      setAffiliation('')
      setEmail('')
      setMessage('')
      setConsent(false)
    } catch {
      // 문구는 부모가 submitError로 내려준다. 입력값은 그대로 둔다.
    } finally {
      setSubmitting(false)
    }
  }

  const error = localError ?? submitError

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 mb-8">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={NAME_MAX}
        placeholder="이름"
        className={`${inputClass} mb-2`}
      />
      <input
        type="text"
        value={affiliation}
        onChange={(e) => setAffiliation(e.target.value)}
        maxLength={AFFILIATION_MAX}
        placeholder="소속 (예: OO대학교 / OO연구원)"
        className={`${inputClass} mb-2`}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={EMAIL_MAX}
        placeholder="이메일 (공개되지 않습니다)"
        className={`${inputClass} mb-2`}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MESSAGE_MAX}
        rows={3}
        placeholder="부스에 남기고 싶은 말을 적어주세요"
        className={`${inputClass} resize-none break-keep`}
      />

      <div className="flex items-center justify-end mt-1 mb-3">
        <span className="text-xs text-slate-400 shrink-0">
          {message.length}/{MESSAGE_MAX}
        </span>
      </div>

      <label className="flex items-start gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 shrink-0 accent-[#0891b2]"
        />
        <span className="text-xs text-slate-600 break-keep leading-relaxed">
          <strong className="font-semibold text-slate-700">[필수] 개인정보 수집·이용 동의</strong>
          <br />
          수집 항목: 이름, 소속, 이메일 · 이용 목적: 행사 참가자 명부·네트워킹, 행사 후 연락 및 경품 추첨
          당첨자 연락 · 보유 기간: 행사 종료 후 일괄 파기. 동의를 거부할 수 있으며, 이 경우 방명록 참여가
          제한됩니다.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 break-keep mb-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !consent}
        className="w-full rounded-lg bg-[#0891b2] py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? '남기는 중…' : '남기기'}
      </button>
    </form>
  )
}

export default GuestbookForm
```

- [ ] **Step 3: GuestbookList 교체** — `src/guestbook/GuestbookList.tsx` 전체를 아래로 교체

```tsx
import { motion } from 'framer-motion'
import type { PublicEntry } from './types'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`
}

function GuestbookList({ entries }: { entries: PublicEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-slate-500 py-16 break-keep">
        아직 남겨진 메시지가 없습니다.
        <br />
        첫 번째 메시지를 남겨보세요.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry, index) => (
        <motion.li
          key={entry.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            // 목록이 길어도 마지막 항목이 0.4초 안에는 나타나게 상한을 둔다
            delay: Math.min(index * 0.04, 0.4),
            ease: 'easeOut',
          }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="font-semibold text-[#1e3a5f] text-sm break-keep">
              {entry.name}
              <span className="font-normal text-slate-400"> · {entry.affiliation}</span>
            </span>
            <span className="text-xs text-slate-400 shrink-0">{formatTime(entry.createdAt)}</span>
          </div>
          <p className="text-slate-700 break-keep break-words whitespace-pre-wrap leading-relaxed">
            {entry.message}
          </p>
        </motion.li>
      ))}
    </ul>
  )
}

export default GuestbookList
```

- [ ] **Step 4: GuestbookPage의 handleSubmit 타입·payload 교체** — `src/guestbook/GuestbookPage.tsx`에서 `handleSubmit` 정의(현재 31~45행 부근)를 아래로 교체

```tsx
  const handleSubmit = useCallback(
    async (input: {
      name: string
      affiliation: string
      email: string
      message: string
      consent: boolean
    }) => {
      // 새 시도가 시작되면 이전 실패의 잔상을 바로 지운다.
      setSubmitError(null)
      try {
        await postEntry({ ...input, key: writeKey ?? '' })
        await load()
      } catch (error) {
        setSubmitError(errorMessage(error))
        // 폼이 입력값을 유지할 수 있도록 다시 던진다
        throw error
      }
    },
    [writeKey, load],
  )
```

- [ ] **Step 5: GuestbookPage의 entries 상태 타입 교체** — `src/guestbook/GuestbookPage.tsx` 상단 import와 상태 선언 교체

`import type { Entry } from './types'` 를 `import type { PublicEntry } from './types'` 로 바꾸고, `const [entries, setEntries] = useState<Entry[] | null>(null)` 를 `const [entries, setEntries] = useState<PublicEntry[] | null>(null)` 로 바꾼다.

- [ ] **Step 6: 전체 빌드·테스트 (첫 full-green 지점)**

Run: `npm run build && npx vitest run`
Expected: 두 명령 모두 성공(빌드 exit 0, 테스트 전부 PASS).
참고: `npm run lint`는 base부터 깨져 있음(ESLint 8.57.1 설치 vs 설정은 ESLint 9용) → 게이트에서 제외. lint 설정/무관 파일은 건드리지 않는다.

- [ ] **Step 7: 커밋**

```bash
git add src/guestbook/api.ts src/guestbook/GuestbookForm.tsx src/guestbook/GuestbookList.tsx src/guestbook/GuestbookPage.tsx
git commit -m "feat: 방명록 프론트엔드 개인정보 입력 폼·동의 체크박스·명부 표시 전환"
```

---

## Task 5: 운영 환경변수 + 프로덕션 수동 검증

**Files:**
- Modify: `.env.local` (로컬), Vercel 프로젝트 환경변수 (사용자 작업)

**Interfaces:**
- Consumes: 배포된 Task 3·4의 엔드포인트.

- [ ] **Step 1: 관리자 시크릿 생성**

Run: `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`
결과 문자열을 관리자키로 사용한다. **`GUESTBOOK_WRITE_KEY`와 다른 값**인지 확인.

- [ ] **Step 2: 로컬 `.env.local`에 추가**

`.env.local`에 다음 줄을 추가한다(값은 Step 1 결과):

```
GUESTBOOK_ADMIN_KEY=<Step 1에서 생성한 값>
```

- [ ] **Step 3: Vercel에 환경변수 등록 (사용자 작업)**

Vercel 대시보드 → 프로젝트 `infradna-website` → Settings → Environment Variables 에 `GUESTBOOK_ADMIN_KEY`(Production)를 등록한다. (CLI 사용 시: 세션에서 `! vercel env add GUESTBOOK_ADMIN_KEY production` 을 실행하고 값 입력.)

- [ ] **Step 4: push 및 프로덕션 배포**

```bash
git push
```
Vercel가 `main` 배포를 완료할 때까지 기다린다(대시보드에서 Ready 확인).

- [ ] **Step 5: 공개 GET에 이메일 미노출 검증**

Run: `curl -s https://www.infradna.or.kr/api/guestbook`
Expected: `{"entries":[...]}` — 각 항목에 `email`·`consentAt` **필드 없음**. (테스트 글을 하나 남긴 뒤 확인하면 명확.)

> **변경(최종 리뷰 반영):** 관리자 시크릿은 URL 쿼리(`?admin=`)가 아니라 **`Authorization: Bearer <키>` 헤더**로 전달한다(전체 PII 반환 엔드포인트의 키가 로그·히스토리에 남지 않도록). 일상 사용은 관리자 페이지 **`/guestbook-admin`**(암호 입력칸)에서 하고, 아래 curl은 검증용이다.

- [ ] **Step 6: 관리자 export 접근 제어 검증**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://www.infradna.or.kr/api/guestbook-export`
Expected: `403` (헤더 없음)

Run: `curl -s -H "Authorization: Bearer <올바른키>" https://www.infradna.or.kr/api/guestbook-export`
Expected: `{"entries":[...]}` — `email`·`consentAt` 포함.

- [ ] **Step 7: CSV 다운로드 검증**

Run: `curl -s -H "Authorization: Bearer <올바른키>" "https://www.infradna.or.kr/api/guestbook-export?format=csv" | head`
Expected: 첫 바이트에 UTF-8 BOM, 헤더 행 `이름,소속,이메일,메시지,동의시각,작성시각`, 한글 정상. 엑셀에서 열어 깨짐 없는지 확인.

- [ ] **Step 7b: 관리자 페이지 검증**

브라우저에서 `https://www.infradna.or.kr/guestbook-admin` 접속 → 비밀키 입력 → '명단 조회'로 표 표시, 'CSV 다운로드' 동작 확인. (키가 주소창/네트워크 URL이 아니라 요청 헤더로만 전송되는지 개발자도구 Network 탭에서 확인.)

- [ ] **Step 8: 동의·이메일 검증 (폼)**

브라우저에서 `https://www.infradna.or.kr/guestbook?k=<쓰기키>` 접속 →
- 동의 체크 전 '남기기' 비활성 확인
- 잘못된 이메일 입력 시 오류 문구(`이메일 주소 형식이 올바르지 않습니다.`) 확인
- 정상 입력 시 목록에 `이름 · 소속` + 메시지 표시(이메일 미표시) 확인

---

## Self-Review

**Spec coverage:**
- 데이터 모델(Entry/PublicEntry) → Task 3 ✓
- 공개 GET 투영(이메일 배제) → Task 3 Step 2 + Task 5 Step 5 ✓
- POST 검증·동의·저장 → Task 1 + Task 3 Step 2 ✓
- 관리자 export(JSON/CSV·별도 시크릿·fail-closed) → Task 3 Step 3 + Task 5 Step 6·7 ✓
- CSV BOM·수식 인젝션 방어 → Task 2 + Task 3 Step 3 ✓
- 검증 철학 반전(이메일 필수·메시지 PII 차단) → Task 1 ✓
- 동의 체크박스·고지문·consentAt 증빙 → Task 1(consent) + Task 3(consentAt) + Task 4 Step 2 ✓
- 프론트 폼·명부 표시·에러 문구 → Task 4 ✓
- 환경변수 GUESTBOOK_ADMIN_KEY → Task 5 ✓
- 마이그레이션 불필요(빈 리스트) → Global Constraints ✓

**Placeholder scan:** 코드 스텝은 모두 실제 코드 포함. `<올바른키>`·`<Step 1에서 생성한 값>`은 런타임 비밀값으로 계획상 불가피한 사용자 입력 표기(플레이스홀더 코드 아님).

**Type consistency:** `PublicEntry`(id·name·affiliation·message·createdAt)를 api.ts·GuestbookList·GuestbookPage·api/guestbook.ts에서 동일하게 사용. `validateEntry` 시그니처(name·affiliation·email·message·consent)를 Task 1 정의와 api/guestbook.ts·GuestbookForm 호출부에서 일치. 에러 코드 집합 `ApiErrorCode` ⊇ `ValidationError`(INVALID_INPUT·INVALID_EMAIL·PII_DETECTED·CONSENT_REQUIRED) 확인.

## 열린 항목 (구현과 별개, 사용자/기관 확인)

- 동의 고지문 최종 법적 문구 — 기관 개인정보 보호책임자 확인(현재는 초안).
- `GUESTBOOK_ADMIN_KEY` 실제 값 생성·Vercel 등록 — Task 5(사용자 작업 포함).
