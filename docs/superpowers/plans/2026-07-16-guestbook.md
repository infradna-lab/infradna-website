# 학회 부스용 임시 방명록 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IAHR-APD2026 · SWGIC2026 부스 방문객이 QR로 들어와 익명 메시지를 남기고 목록을 볼 수 있는, 학회 종료 후 롤백 가능한 임시 방명록을 만든다.

**Architecture:** `/guestbook` 단일 라우트. 읽기는 공개, 쓰기는 URL의 `?k=` 키를 서버가 환경변수와 대조해 게이팅한다. 저장은 Upstash Redis 리스트 키 1개 + `EXPIREAT` 절대 만료. 모든 신규 프론트 코드는 `src/guestbook/` 한 폴더에 격리한다.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, react-router-dom 7, framer-motion(`motion` 패키지), Tailwind v4(기본 유틸 + 임의값), Vercel Functions(`@vercel/node`), `@upstash/redis`, vitest.

**설계 문서:** `docs/superpowers/specs/2026-07-16-guestbook-design.md`

## Global Constraints

이 섹션은 **모든 태스크의 요구사항에 암묵적으로 포함된다.**

- **npm 설치는 반드시 `--legacy-peer-deps`** — 기존 `@tokens-studio/sd-transforms`가 `style-dictionary@^5`를 요구하나 저장소는 `4.4.0`이라 모든 install이 peer 충돌로 실패한다.
- **`erasableSyntaxOnly: true`** (tsconfig.app.json) — 파라미터 프로퍼티(`constructor(public x)`), `enum`, 네임스페이스 사용 불가. 클래스 필드는 명시적으로 선언하고 생성자에서 대입한다.
- **`verbatimModuleSyntax: true`** — 타입만 가져올 때 반드시 `import type { X } from '...'`.
- **`noUnusedLocals` / `noUnusedParameters`: true** — 안 쓰는 변수·인자가 있으면 빌드가 깨진다.
- **애니메이션 import는 `'framer-motion'`에서** — `motion/react` 아님.
- **브랜드 색은 임의값 유틸리티**: 네이비 `text-[#1e3a5f]`, 시안 `bg-[#0891b2]`. `tailwind.config.js`는 로드되지 않으므로 커스텀 토큰·테마 클래스는 동작하지 않는다. 중립 팔레트는 `slate-*`.
- **한국어 본문에는 `break-keep`** — 단어 중간 줄바꿈 방지.
- **컴포넌트는 `export default`** — 기존 파일 전부 이 방식.
- **작업 브랜치는 `feat/guestbook`** — 학회 종료 후 브랜치 revert로 롤백한다.
- **학회명 표기는 정확히 `IAHR-APD2026 · SWGIC2026`** (가운뎃점 `·` 사용).
- **커밋 메시지는 한국어 + `feat:`/`fix:`/`docs:` 접두.**

## 설계 문서 대비 변경점 (착수 전 확인 완료)

1. **vitest 도입** — 스펙 9절은 "테스트 러너 없음, 수동 검증"이라고 적었으나, 개인정보 정규식은 조용히 틀리면 연락처가 공개 페이지에 박제되는 유일한 지점이다. 순수 함수라 테스트가 싸므로 `validate.ts`에만 단위 테스트를 붙인다. 나머지(네트워크·UI·배포)는 스펙대로 수동 검증.
2. **수정하는 기존 파일이 2개** — 스펙 3절은 `App.tsx` 하나라고 했으나, `tsconfig.app.json`이 `include: ["src"]`라서 `api/`가 타입체크되지 않는다. `tsconfig.api.json`을 새로 만들고 `tsconfig.json`에 참조 1줄을 추가한다. 브랜치 revert로 롤백하므로 추가 비용은 없다.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/guestbook/types.ts` | `Entry`, `ApiErrorCode` — 서버·클라이언트 공유 계약 |
| `src/guestbook/validate.ts` | 순수 검증 (길이·개인정보 패턴). **서버와 클라이언트가 같이 쓴다** |
| `src/guestbook/validate.test.ts` | 위 모듈의 단위 테스트 |
| `api/guestbook.ts` | Vercel Function. 키 대조 → 검증 → Redis I/O |
| `src/guestbook/api.ts` | fetch 래퍼 + 에러코드→한국어 매핑 + `GuestbookError` |
| `src/guestbook/GuestbookList.tsx` | 목록 렌더 전용. 상태 없음 |
| `src/guestbook/GuestbookForm.tsx` | 입력값·제출중 상태만 소유. fetch 하지 않음 |
| `src/guestbook/GuestbookPage.tsx` | 라우트 진입점. `k` 파싱, 데이터 로딩, 에러 상태 소유 |
| `tsconfig.api.json` | `api/` 타입체크용 (신규) |
| `tsconfig.json` | 참조 1줄 추가 (수정) |
| `src/App.tsx` | import 1줄 + Route 1줄 추가 (수정) |

**검증 로직을 `src/guestbook/`에 두고 `api/`가 가져다 쓰는 이유:** 스펙 8절이 클라이언트·서버 양쪽 검증을 요구한다. 규칙을 두 벌 쓰면 반드시 갈라지므로 한 벌만 두고 공유한다. Vercel Function은 번들 시 `src/`를 함께 가져간다.

---

## Task 1: 공유 계약 + 검증 로직 (TDD)

**Files:**
- Create: `src/guestbook/types.ts`
- Create: `src/guestbook/validate.ts`
- Create: `src/guestbook/validate.test.ts`
- Modify: `package.json` (vitest devDependency + `test` 스크립트)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `type Entry = { id: string; nickname: string; message: string; createdAt: string }`
  - `type ApiErrorCode = 'INVALID_KEY' | 'INVALID_INPUT' | 'PII_DETECTED' | 'STORAGE_ERROR' | 'CONFIG_ERROR' | 'METHOD_NOT_ALLOWED' | 'NETWORK_ERROR'`
  - `validateEntry(input: { nickname?: string; message?: string }): ValidationResult`
  - `type ValidationResult = { ok: true; nickname: string; message: string } | { ok: false; error: 'INVALID_INPUT' | 'PII_DETECTED' }`
  - 상수 `NICKNAME_MAX = 12`, `MESSAGE_MAX = 100`, `DEFAULT_NICKNAME = '익명 방문자'`

- [ ] **Step 1: vitest 설치**

```bash
npm i -D vitest --legacy-peer-deps
```

- [ ] **Step 2: `package.json`에 test 스크립트 추가**

`"scripts"` 안에 `"preview"` 다음 줄로 추가:

```json
    "test": "vitest run",
```

- [ ] **Step 3: 공유 타입 작성**

`src/guestbook/types.ts`:

```ts
/** 방명록 항목 1건. Redis에 JSON으로 저장되고 API가 그대로 반환한다. */
export type Entry = {
  id: string
  nickname: string
  message: string
  /** ISO 8601, 서버 생성 */
  createdAt: string
}

/** 서버가 반환하는 기계용 에러 코드. 한국어 문구 매핑은 클라이언트 책임. */
export type ApiErrorCode =
  | 'INVALID_KEY'
  | 'INVALID_INPUT'
  | 'PII_DETECTED'
  | 'STORAGE_ERROR'
  | 'CONFIG_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'NETWORK_ERROR'
```

- [ ] **Step 4: 실패하는 테스트 작성**

`src/guestbook/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateEntry, DEFAULT_NICKNAME } from './validate'

describe('validateEntry', () => {
  it('정상 입력을 통과시킨다', () => {
    const result = validateEntry({ nickname: '방문객', message: '잘 봤습니다' })
    expect(result).toEqual({ ok: true, nickname: '방문객', message: '잘 봤습니다' })
  })

  it('닉네임이 비면 기본값으로 대체한다', () => {
    const result = validateEntry({ nickname: '   ', message: '안녕하세요' })
    expect(result).toEqual({ ok: true, nickname: DEFAULT_NICKNAME, message: '안녕하세요' })
  })

  it('앞뒤 공백을 제거한다', () => {
    const result = validateEntry({ nickname: ' 김 ', message: '  좋아요  ' })
    expect(result).toEqual({ ok: true, nickname: '김', message: '좋아요' })
  })

  it('빈 메시지를 거부한다', () => {
    expect(validateEntry({ message: '   ' })).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it('100자를 넘는 메시지를 거부한다', () => {
    expect(validateEntry({ message: 'ㄱ'.repeat(101) })).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it('정확히 100자는 통과시킨다', () => {
    const result = validateEntry({ message: 'ㄱ'.repeat(100) })
    expect(result.ok).toBe(true)
  })

  it('12자를 넘는 닉네임을 거부한다', () => {
    expect(validateEntry({ nickname: 'ㄱ'.repeat(13), message: '안녕' })).toEqual({
      ok: false,
      error: 'INVALID_INPUT',
    })
  })

  it.each([
    ['010-1234-5678', '하이픈 구분'],
    ['01012345678', '구분자 없음'],
    ['010 1234 5678', '공백 구분'],
    ['010.1234.5678', '점 구분'],
    ['연락 주세요 010-1234-5678 입니다', '문장 속'],
    ['070-1234-5678', '인터넷전화'],
    ['02-1234-5678', '서울 유선 (2자리 지역번호)'],
    ['031-123-4567', '3자리 지역번호 + 3자리 국번'],
    ['032-256-2407', '실제 유선 형식'],
    ['021234567', '유선, 구분자 없음'],
  ])('전화번호를 거부한다: %s (%s)', (message) => {
    expect(validateEntry({ message })).toEqual({ ok: false, error: 'PII_DETECTED' })
  })

  it.each([
    ['2026년 학회 잘 봤습니다', '연도'],
    ['2026-07-16에 방문했습니다', '날짜'],
    ['0.5초 만에 로딩되네요', '소수'],
    ['08:30에 왔습니다', '시각'],
    ['우편번호 06134 입니다', '우편번호'],
    ['버전 1.0.5 좋아요', '버전'],
    ['010번 부스 잘 봤습니다', '부스 번호'],
  ])('전화번호가 아닌 숫자는 통과시킨다: %s (%s)', (message) => {
    expect(validateEntry({ message }).ok).toBe(true)
  })

  it.each([
    ['hong@example.com', '기본'],
    ['메일은 hong.gil-dong+test@sub.example.co.kr 입니다', '문장 속 복잡한 주소'],
  ])('이메일을 거부한다: %s (%s)', (message) => {
    expect(validateEntry({ message })).toEqual({ ok: false, error: 'PII_DETECTED' })
  })

  it('닉네임에 있는 개인정보도 거부한다', () => {
    expect(validateEntry({ nickname: 'hong@ex.com', message: '안녕' })).toEqual({
      ok: false,
      error: 'PII_DETECTED',
    })
  })

  it('길이 위반과 개인정보가 겹치면 길이 위반을 먼저 알린다', () => {
    const message = '010-1234-5678 ' + 'ㄱ'.repeat(100)
    expect(validateEntry({ message })).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })
})
```

- [ ] **Step 5: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./validate"` (파일이 아직 없음)

- [ ] **Step 6: 최소 구현 작성**

`src/guestbook/validate.ts`:

```ts
export const NICKNAME_MAX = 12
export const MESSAGE_MAX = 100
export const DEFAULT_NICKNAME = '익명 방문자'

/**
 * 방문객이 스스로 적어 넣는 연락처를 걸러낸다.
 * 휴대폰(01x)·070 인터넷전화·유선전화(02, 031…)를 모두 잡는다.
 * 선행 0을 강제하므로 "2026년" 같은 연도는 오탐하지 않는다.
 * 의도적 한계: "공대 김씨"처럼 패턴에 걸리지 않는 자기 식별과
 * 국제번호(+82)는 통과한다. 실질 위험(연락처가 공개 페이지에
 * 박제되는 것)만 차단하는 것이 목표다.
 */
const PHONE = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/

export type ValidationResult =
  | { ok: true; nickname: string; message: string }
  | { ok: false; error: 'INVALID_INPUT' | 'PII_DETECTED' }

export function validateEntry(input: { nickname?: string; message?: string }): ValidationResult {
  const nickname = (input.nickname ?? '').trim()
  const message = (input.message ?? '').trim()

  if (message.length === 0 || message.length > MESSAGE_MAX) {
    return { ok: false, error: 'INVALID_INPUT' }
  }
  if (nickname.length > NICKNAME_MAX) {
    return { ok: false, error: 'INVALID_INPUT' }
  }

  const containsPii = (text: string) => PHONE.test(text) || EMAIL.test(text)
  if (containsPii(message) || containsPii(nickname)) {
    return { ok: false, error: 'PII_DETECTED' }
  }

  return { ok: true, nickname: nickname || DEFAULT_NICKNAME, message }
}
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 전체 통과

- [ ] **Step 8: 타입체크 확인**

Run: `npm run build`
Expected: 성공 (에러 없음)

- [ ] **Step 9: 커밋**

```bash
git add package.json package-lock.json src/guestbook/types.ts src/guestbook/validate.ts src/guestbook/validate.test.ts
git commit -m "feat: 방명록 공유 타입과 입력 검증 로직

연락처(전화번호·이메일) 패턴 차단 포함. 서버·클라이언트가 같이 쓴다."
```

---

## Task 2: 서버 엔드포인트

**Files:**
- Create: `api/guestbook.ts`
- Create: `tsconfig.api.json`
- Modify: `tsconfig.json` (references에 1줄 추가)
- Modify: `.gitignore` (`.env.local` 미포함 시 추가)

**Interfaces:**
- Consumes: Task 1의 `validateEntry`, `Entry` 타입
- Produces:
  - `GET /api/guestbook` → `200 { entries: Entry[] }` (최신순)
  - `POST /api/guestbook` body `{ key: string, nickname?: string, message: string }` → `201 { entry: Entry }` | `400 { error: 'INVALID_INPUT' | 'PII_DETECTED' }` | `403 { error: 'INVALID_KEY' }` | `500 { error: 'STORAGE_ERROR' | 'CONFIG_ERROR' }`
  - `405 { error: 'METHOD_NOT_ALLOWED' }` (그 외 메서드)

- [ ] **Step 1: 의존성 설치**

```bash
npm i @upstash/redis --legacy-peer-deps
npm i -D @vercel/node --legacy-peer-deps
```

- [ ] **Step 2: Vercel CLI 설치 및 프로젝트 연결**

```bash
npm i -g vercel
vercel link
```

Expected: `.vercel/` 폴더 생성, 기존 프로젝트에 연결됨.

- [ ] **Step 3: Upstash Redis 연결**

Vercel 대시보드 → 프로젝트 → Storage → Marketplace에서 **Upstash Redis** 추가(무료 티어).
연결하면 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`이 자동 주입된다.

- [ ] **Step 4: 환경변수 등록**

`<키값>`은 QR에 심을 임의 문자열(예: `dna-booth-2026`), `<만료시각>`은 **학회 종료 + 7일**의 ISO 8601 값(예: `2026-09-30T23:59:59Z`).

```bash
vercel env add GUESTBOOK_WRITE_KEY production preview development
vercel env add GUESTBOOK_EXPIRES_AT production preview development
vercel env pull .env.local
```

Expected: `.env.local`에 4개 변수(Upstash 2개 + 위 2개)가 채워진다.

`.gitignore`에 `.env.local`이 없으면 추가한다. **이 파일은 절대 커밋하지 않는다.**

- [ ] **Step 5: `api/` 타입체크 설정 파일 작성**

`tsconfig.api.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.api.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["api", "src/guestbook/validate.ts", "src/guestbook/types.ts"]
}
```

`tsconfig.json`의 `references` 배열에 1줄 추가:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.api.json" }
  ]
}
```

- [ ] **Step 6: 엔드포인트 작성**

`api/guestbook.ts`:

```ts
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
```

- [ ] **Step 7: 타입체크**

Run: `npm run build`
Expected: 성공. (`api/`가 이제 `tsconfig.api.json`으로 체크된다)

- [ ] **Step 8: 로컬에서 엔드포인트 검증**

터미널 1: `vercel dev`

터미널 2에서 순서대로 실행하고 각 응답을 확인한다. `<키값>`은 Step 4에서 정한 값.

```bash
# 빈 목록 조회 → 200 {"entries":[]}
curl -s localhost:3000/api/guestbook

# 잘못된 키 → 403 {"error":"INVALID_KEY"}
curl -s -X POST localhost:3000/api/guestbook \
  -H 'Content-Type: application/json' \
  -d '{"key":"wrong","message":"안녕"}'

# 키 없음 → 403 {"error":"INVALID_KEY"}
curl -s -X POST localhost:3000/api/guestbook \
  -H 'Content-Type: application/json' -d '{"message":"안녕"}'

# 전화번호 → 400 {"error":"PII_DETECTED"}
curl -s -X POST localhost:3000/api/guestbook \
  -H 'Content-Type: application/json' \
  -d '{"key":"<키값>","message":"010-1234-5678로 연락주세요"}'

# 빈 메시지 → 400 {"error":"INVALID_INPUT"}
curl -s -X POST localhost:3000/api/guestbook \
  -H 'Content-Type: application/json' -d '{"key":"<키값>","message":"  "}'

# 정상 → 201 {"entry":{...,"nickname":"익명 방문자",...}}
curl -s -X POST localhost:3000/api/guestbook \
  -H 'Content-Type: application/json' \
  -d '{"key":"<키값>","message":"부스 잘 봤습니다"}'

# 조회 → 200, 위 항목 1건
curl -s localhost:3000/api/guestbook

# 잘못된 메서드 → 405 {"error":"METHOD_NOT_ALLOWED"}
curl -s -X DELETE localhost:3000/api/guestbook
```

- [ ] **Step 9: 커밋**

```bash
git add api/guestbook.ts tsconfig.api.json tsconfig.json package.json package-lock.json .gitignore
git commit -m "feat: 방명록 API 엔드포인트

GET 공개 조회 / POST는 서버에서 쓰기 키 대조.
Redis 리스트 1개 + EXPIREAT 절대 만료로 학회 후 자동 소멸."
```

---

## Task 3: 클라이언트 API 계층

**Files:**
- Create: `src/guestbook/api.ts`

**Interfaces:**
- Consumes: Task 1의 `Entry`, `ApiErrorCode`; Task 2의 HTTP 계약
- Produces:
  - `class GuestbookError extends Error { code: ApiErrorCode }`
  - `errorMessage(error: unknown): string` — 던져진 에러를 한국어 문구로. `GuestbookError`가 아니면 `NETWORK_ERROR` 문구로 떨어진다
  - `fetchEntries(): Promise<Entry[]>`
  - `postEntry(input: { key: string; nickname: string; message: string }): Promise<Entry>`
  - 둘 다 실패 시 `GuestbookError`를 throw 한다

- [ ] **Step 1: 작성**

`src/guestbook/api.ts`:

```ts
import type { ApiErrorCode, Entry } from './types'

/** 서버는 코드만 준다. 화면 문구는 여기서만 정의한다(서버 문자열을 그대로 렌더하지 않음). */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_KEY: '이 링크로는 글을 남길 수 없습니다. 부스의 QR 코드를 다시 스캔해 주세요.',
  INVALID_INPUT: '메시지를 1자 이상 100자 이하로 입력해 주세요.',
  PII_DETECTED: '전화번호나 이메일은 남길 수 없습니다. 연락처를 빼고 다시 시도해 주세요.',
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

/** 응답 본문에서 에러 코드를 꺼낸다. 본문이 깨져 있으면 STORAGE_ERROR로 처리. */
async function toError(res: Response): Promise<GuestbookError> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body.error && body.error in ERROR_MESSAGES) {
      return new GuestbookError(body.error as ApiErrorCode)
    }
  } catch {
    // 본문 파싱 실패 — 아래 기본값으로 떨어진다
  }
  return new GuestbookError('STORAGE_ERROR')
}

export async function fetchEntries(): Promise<Entry[]> {
  let res: Response
  try {
    res = await fetch('/api/guestbook')
  } catch {
    throw new GuestbookError('NETWORK_ERROR')
  }
  if (!res.ok) throw await toError(res)

  const body = (await res.json()) as { entries: Entry[] }
  return body.entries
}

export async function postEntry(input: {
  key: string
  nickname: string
  message: string
}): Promise<Entry> {
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

  const body = (await res.json()) as { entry: Entry }
  return body.entry
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add src/guestbook/api.ts
git commit -m "feat: 방명록 클라이언트 API 계층

에러코드를 한국어 문구로 매핑. 서버는 코드만 반환한다."
```

---

## Task 4: 목록 컴포넌트

**Files:**
- Create: `src/guestbook/GuestbookList.tsx`

**Interfaces:**
- Consumes: Task 1의 `Entry`
- Produces: `default GuestbookList` — props `{ entries: Entry[] }`. 상태 없음, 렌더 전용.

- [ ] **Step 1: 작성**

`src/guestbook/GuestbookList.tsx`:

```tsx
import { motion } from 'framer-motion'
import type { Entry } from './types'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`
}

function GuestbookList({ entries }: { entries: Entry[] }) {
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
            <span className="font-semibold text-[#1e3a5f] text-sm break-keep">{entry.nickname}</span>
            <span className="text-xs text-slate-400 shrink-0">{formatTime(entry.createdAt)}</span>
          </div>
          <p className="text-slate-700 break-keep whitespace-pre-wrap leading-relaxed">
            {entry.message}
          </p>
        </motion.li>
      ))}
    </ul>
  )
}

export default GuestbookList
```

- [ ] **Step 2: 타입체크**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add src/guestbook/GuestbookList.tsx
git commit -m "feat: 방명록 목록 컴포넌트"
```

---

## Task 5: 입력 폼 컴포넌트

**Files:**
- Create: `src/guestbook/GuestbookForm.tsx`

**Interfaces:**
- Consumes: Task 1의 `validateEntry`, `MESSAGE_MAX`, `NICKNAME_MAX`, `DEFAULT_NICKNAME`; Task 3의 `errorMessage`
- Produces: `default GuestbookForm` — props `{ onSubmit: (input: { nickname: string; message: string }) => Promise<void>; submitError: string | null }`

**핵심 요구:** 제출이 실패해도 **입력한 텍스트를 지우지 않는다.** 부스에서 글이 날아가면 방문객은 다시 타이핑하지 않고 떠난다. 성공했을 때만 비운다.

- [ ] **Step 1: 작성**

`src/guestbook/GuestbookForm.tsx`:

```tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { DEFAULT_NICKNAME, MESSAGE_MAX, NICKNAME_MAX, validateEntry } from './validate'
import { errorMessage, GuestbookError } from './api'

type Props = {
  onSubmit: (input: { nickname: string; message: string }) => Promise<void>
  submitError: string | null
}

function GuestbookForm({ onSubmit, submitError }: Props) {
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    // 즉각 피드백용. 실효적 방어는 서버 검증이다.
    const result = validateEntry({ nickname, message })
    if (!result.ok) {
      setLocalError(errorMessage(new GuestbookError(result.error)))
      return
    }
    setLocalError(null)
    setSubmitting(true)

    try {
      await onSubmit({ nickname, message })
      // 성공했을 때만 비운다
      setNickname('')
      setMessage('')
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
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={NICKNAME_MAX}
        placeholder={`닉네임 (선택, 비우면 '${DEFAULT_NICKNAME}')`}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:border-[#0891b2] focus:outline-none mb-2"
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MESSAGE_MAX}
        rows={3}
        placeholder="부스에 남기고 싶은 말을 적어주세요"
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:border-[#0891b2] focus:outline-none break-keep"
      />

      <div className="flex items-center justify-between gap-3 mt-1 mb-3">
        <p className="text-xs text-slate-400 break-keep">전화번호·이메일은 남기지 말아주세요.</p>
        <span className="text-xs text-slate-400 shrink-0">
          {message.length}/{MESSAGE_MAX}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 break-keep mb-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#0891b2] py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? '남기는 중…' : '남기기'}
      </button>
    </form>
  )
}

export default GuestbookForm
```

- [ ] **Step 2: 타입체크**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add src/guestbook/GuestbookForm.tsx
git commit -m "feat: 방명록 입력 폼

제출 실패 시 입력 텍스트를 유지한다."
```

---

## Task 6: 페이지 + 라우트 연결

**Files:**
- Create: `src/guestbook/GuestbookPage.tsx`
- Modify: `src/App.tsx` (import 1줄 + Route 1줄)

**Interfaces:**
- Consumes: Task 3의 `fetchEntries`/`postEntry`/`errorMessage`, Task 4의 `GuestbookList`, Task 5의 `GuestbookForm`
- Produces: `/guestbook` 라우트

- [ ] **Step 1: 페이지 작성**

`src/guestbook/GuestbookPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Entry } from './types'
import { errorMessage, fetchEntries, postEntry } from './api'
import GuestbookForm from './GuestbookForm'
import GuestbookList from './GuestbookList'

function GuestbookPage() {
  const [searchParams] = useSearchParams()
  // ?k= 가 있을 때만 폼을 렌더한다. 이것은 경험 분기일 뿐 방어가 아니다(방어는 서버).
  const writeKey = searchParams.get('k')

  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setEntries(await fetchEntries())
      setLoadError(null)
    } catch (error) {
      setLoadError(errorMessage(error))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = useCallback(
    async (input: { nickname: string; message: string }) => {
      try {
        await postEntry({ ...input, key: writeKey ?? '' })
        setSubmitError(null)
        await load()
      } catch (error) {
        setSubmitError(errorMessage(error))
        // 폼이 입력값을 유지할 수 있도록 다시 던진다
        throw error
      }
    },
    [writeKey, load],
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] px-4 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto max-w-xl"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">방명록</h1>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0891b2]">
            IAHR-APD2026 · SWGIC2026
          </p>
        </motion.div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        {writeKey && <GuestbookForm onSubmit={handleSubmit} submitError={submitError} />}

        {loadError && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-600 break-keep mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              다시 시도
            </button>
          </div>
        )}

        {!loadError && entries === null && (
          <p className="py-16 text-center text-slate-400">불러오는 중…</p>
        )}

        {!loadError && entries !== null && <GuestbookList entries={entries} />}
      </main>
    </div>
  )
}

export default GuestbookPage
```

- [ ] **Step 2: 라우트 연결**

`src/App.tsx` — import 1줄과 Route 1줄만 추가한다. 나머지는 손대지 않는다.

```tsx
import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import HomePage from './pages/HomePage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import GuestbookPage from './guestbook/GuestbookPage'
import ScrollManager from './components/ScrollManager'

function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/guestbook" element={<GuestbookPage />} />
      </Routes>
      <Analytics />
    </>
  )
}

export default App
```

- [ ] **Step 3: 타입체크**

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: 로컬 전체 흐름 검증**

Run: `vercel dev`

브라우저에서 각각 확인한다 (`<키값>`은 Task 2 Step 4의 값):

| URL | 기대 결과 |
|---|---|
| `localhost:3000/guestbook` | 폼이 **없고** 목록만 보인다 |
| `localhost:3000/guestbook?k=wrong` | 폼은 보이지만, 제출하면 "부스의 QR 코드를 다시 스캔해 주세요" |
| `localhost:3000/guestbook?k=<키값>` | 폼 제출 시 목록에 즉시 반영된다 |
| `localhost:3000/guestbook?k=<키값>` | 닉네임을 비우고 제출 → "익명 방문자"로 표시 |
| `localhost:3000/guestbook?k=<키값>` | `010-1234-5678` 입력 → 거부 문구가 뜨고 **입력 텍스트가 남아 있다** |
| `localhost:3000/` | 홈이 그대로 동작하고 방명록 링크는 어디에도 없다 |

브라우저 개발자도구를 모바일(iPhone SE 등)로 두고 폼과 목록이 세로 화면에서 깨지지 않는지 본다.

- [ ] **Step 5: 커밋**

```bash
git add src/guestbook/GuestbookPage.tsx src/App.tsx
git commit -m "feat: 방명록 페이지와 /guestbook 라우트 연결"
```

---

## Task 7: 프리뷰 배포 검증

**Files:** 없음 (설정 확인 및 필요 시 `vercel.json` 수정)

**Interfaces:**
- Consumes: Task 6까지의 전체 기능

**이 태스크가 존재하는 이유:** `vercel.json`의 `/(.*)` → `/index.html` 리라이트가 `/api/guestbook`을 삼키면 함수가 죽는다. Vercel은 리라이트보다 파일시스템·함수를 먼저 매칭하므로 정상 동작이 유력하나, **배포 전에는 확정할 수 없다.**

- [ ] **Step 1: 프리뷰 배포**

```bash
vercel
```

Expected: 프리뷰 URL 출력.

- [ ] **Step 2: 리라이트가 API를 삼키는지 확인**

```bash
curl -s <프리뷰URL>/api/guestbook
```

Expected: `{"entries":[...]}` (JSON)

**만약 HTML(`<!doctype html>...`)이 돌아오면** 리라이트가 함수를 가로챈 것이다. `vercel.json`을 다음으로 고치고 재배포한다:

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

그리고 `curl`을 다시 실행해 JSON이 오는지 확인한다.

- [ ] **Step 3: 새로고침 확인**

브라우저에서 `<프리뷰URL>/guestbook?k=<키값>`에 직접 접속(주소창 입력 후 새로고침).
Expected: 404가 아니라 방명록 페이지가 뜬다.

- [ ] **Step 4: 실제 휴대폰에서 QR 완주**

`<프리뷰URL>/guestbook?k=<키값>`으로 QR 코드를 만들어(예: 온라인 QR 생성기) 휴대폰으로 스캔한다.

Expected: 폼이 열리고 → 메시지 제출 → 목록에 반영되는 흐름이 휴대폰 세로 화면에서 완주된다.

- [ ] **Step 5: 만료 설정 확인**

Upstash 콘솔 → Data Browser에서 `guestbook:2026` 키의 TTL을 확인한다.
Expected: `GUESTBOOK_EXPIRES_AT`으로 지정한 시각과 일치한다. **`-1`(만료 없음)이면 안 된다.**

- [ ] **Step 6: 커밋 (`vercel.json`을 고쳤을 때만)**

```bash
git add vercel.json
git commit -m "fix: 리라이트가 /api를 가로채지 않도록 예외 추가"
```

---

## 롤백 절차 (학회 종료 후)

`feat/guestbook` 브랜치를 `main`에 머지했다면:

```bash
git revert -m 1 <머지커밋>
git push
```

머지하지 않았다면 브랜치를 삭제하면 끝난다.

그 다음 Vercel에서:

1. 환경변수 `GUESTBOOK_WRITE_KEY`, `GUESTBOOK_EXPIRES_AT` 삭제
2. Marketplace에서 Upstash 인테그레이션 제거

**데이터는 `GUESTBOOK_EXPIRES_AT` 시각에 자동 소멸하므로 별도 삭제 작업이 없다.**
