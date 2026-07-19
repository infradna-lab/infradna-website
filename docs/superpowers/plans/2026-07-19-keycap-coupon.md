# 방명록 키캡 수령 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방명록을 처음 작성한 방문자에게는 "안내 데스크에서 키캡을 수령하세요" 페이지를, 이미 작성한(=이메일 중복) 방문자에게는 "키캡을 이미 수령하셨습니다"를 보여준다.

**Architecture:** 이메일 기준 서버 중복 판정(A안). 기존 `POST /api/guestbook` 하나가 판정+저장을 겸한다 — 신규 이메일이면 저장 후 `claimed`, 이미 있으면 저장하지 않고 `already_claimed`를 응답. 프론트는 제출 성공 시 `/guestbook/keycap`로 이동해 응답 상태에 따라 분기 렌더.

**Tech Stack:** React 19 + TS + Vite 7, react-router-dom v7, Vercel serverless(`@vercel/node`), Upstash Redis, vitest, framer-motion.

## Global Constraints

- 중복 식별은 **이메일 기준 서버 판정**. 비교는 **소문자·trim 정규화**(대소문자만 다른 재제출도 동일인). 저장되는 `email`은 사용자가 입력한 값(trim) 그대로.
- 재제출(이미 등록된 이메일): **방명록 글을 저장하지 않는다**. 이메일당 1건 유지.
- 응답 계약: 신규 → **201** `{ status: "claimed", entry: PublicEntry }`; 중복 → **200** `{ status: "already_claimed" }`(entry 없음). 둘 다 성공 응답(폼 오류 아님).
- 이메일·consentAt은 여전히 공개 경로로 나가지 않는다(기존 `toPublicEntry` 투영 유지). `already_claimed` 응답은 공개/비공개 어떤 데이터도 담지 않는다.
- 수령 페이지 위변조 방어는 하지 않는다(안내 데스크 직원 육안 확인). 직접 URL 접근/새로고침 시 중립 안내로 폴백.
- api/* 파일은 `erasableSyntaxOnly` — enum/파라미터 프로퍼티 금지(일반 함수 OK). src 상대 import는 `.js` 확장자.
- 검증 게이트: `npm run build` + `npx vitest run`. **`npm run lint` 실행 금지**(ESLint 8/9 불일치로 base부터 깨짐, eslint 설정 손대지 말 것).
- 방명록과 묶어 롤백 가능하게: 새 코드는 `src/guestbook/`와 `/guestbook/*` 라우트 안에 둔다.

---

## File Structure

- `src/guestbook/validate.ts` (수정) — `normalizeEmail`, `isDuplicateEmail` 순수 함수 추가.
- `src/guestbook/validate.test.ts` (수정) — 위 함수 vitest 스펙 추가.
- `src/guestbook/types.ts` (수정) — `SubmitResult` 타입 추가.
- `api/guestbook.ts` (수정) — POST에 이메일 중복 판정 + 응답 상태.
- `src/guestbook/api.ts` (수정) — `postEntry`가 `SubmitResult` 반환.
- `src/guestbook/GuestbookPage.tsx` (수정) — 제출 성공 시 `/guestbook/keycap`로 이동.
- `src/guestbook/KeycapPage.tsx` (신규) — 수령/이미수령/중립 분기 렌더.
- `src/App.tsx` (수정) — `/guestbook/keycap` 라우트.

---

## Task 1: 이메일 중복 판정 순수 함수 (validate.ts)

**Files:**
- Modify: `src/guestbook/validate.ts` (파일 끝에 함수 2개 추가)
- Test: `src/guestbook/validate.test.ts` (describe 블록 추가)

**Interfaces:**
- Produces:
  - `function normalizeEmail(email: string): string` — trim + toLowerCase.
  - `function isDuplicateEmail(existing: readonly { email: string }[], email: string): boolean` — 정규화 비교로 존재 여부.

- [ ] **Step 1: 실패 테스트 작성** — `src/guestbook/validate.test.ts` 상단 import를 확장하고 파일 끝에 describe 블록 추가.

import 줄 교체:
```ts
import { validateEntry, normalizeEmail, isDuplicateEmail } from './validate'
```

파일 맨 끝(마지막 `})` 다음)에 추가:
```ts
describe('normalizeEmail', () => {
  it('trim + 소문자로 정규화한다', () => {
    expect(normalizeEmail('  Hong@Example.COM ')).toBe('hong@example.com')
  })
})

describe('isDuplicateEmail', () => {
  const list = [{ email: 'a@example.com' }, { email: 'B@Example.com' }]

  it('대소문자·공백 무시하고 존재하면 true', () => {
    expect(isDuplicateEmail(list, 'A@EXAMPLE.COM')).toBe(true)
    expect(isDuplicateEmail(list, ' b@example.com ')).toBe(true)
  })

  it('없으면 false', () => {
    expect(isDuplicateEmail(list, 'new@example.com')).toBe(false)
  })

  it('빈 리스트면 false', () => {
    expect(isDuplicateEmail([], 'a@example.com')).toBe(false)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/guestbook/validate.test.ts`
Expected: FAIL — `normalizeEmail`/`isDuplicateEmail` export 없음.

- [ ] **Step 3: 최소 구현** — `src/guestbook/validate.ts` 파일 끝에 추가

```ts
/** 이메일 비교용 정규화 — 앞뒤 공백 제거 + 소문자. 저장값이 아니라 대조에만 쓴다. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** 정규화 기준으로 같은 이메일이 이미 목록에 있는지. */
export function isDuplicateEmail(
  existing: readonly { email: string }[],
  email: string,
): boolean {
  const target = normalizeEmail(email)
  return existing.some((e) => normalizeEmail(e.email) === target)
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/guestbook/validate.test.ts`
Expected: PASS (기존 + 신규 케이스 전부 초록)

- [ ] **Step 5: 커밋**

```bash
git add src/guestbook/validate.ts src/guestbook/validate.test.ts
git commit -m "feat: 방명록 이메일 중복 판정 순수 함수(normalizeEmail·isDuplicateEmail) 추가"
```

---

## Task 2: 백엔드 — 응답 상태 + 중복 판정 (types.ts, api/guestbook.ts)

**Files:**
- Modify: `src/guestbook/types.ts`
- Modify: `api/guestbook.ts`

**Interfaces:**
- Consumes: Task 1의 `isDuplicateEmail`, 기존 `validateEntry`·`toPublicEntry`.
- Produces:
  - `type SubmitResult = { status: 'claimed'; entry: PublicEntry } | { status: 'already_claimed' }`
  - `POST /api/guestbook` → 201 `{ status:'claimed', entry }` (신규) | 200 `{ status:'already_claimed' }` (중복) | 기존 에러 코드.

- [ ] **Step 1: 타입 추가** — `src/guestbook/types.ts`의 `PublicEntry` 정의 바로 아래에 추가

```ts
/** 방명록 제출 결과. claimed=첫 작성(키캡 수령 대상), already_claimed=이메일 중복(이미 수령). */
export type SubmitResult =
  | { status: 'claimed'; entry: PublicEntry }
  | { status: 'already_claimed' }
```

- [ ] **Step 2: POST 핸들러 교체** — `api/guestbook.ts`의 상단 import와 `handlePost` 함수를 아래로 교체

상단 import 교체(기존 validate import 줄을 이 줄로):
```ts
import { validateEntry, isDuplicateEmail } from '../src/guestbook/validate.js'
```

`handlePost` 전체 교체:
```ts
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
  let existing: Entry[]
  try {
    existing = await redis.lrange<Entry>(KEY, 0, -1)
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }
  if (isDuplicateEmail(existing, result.email)) {
    return res.status(200).json({ status: 'already_claimed' })
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
    return res.status(201).json({ status: 'claimed', entry: publicEntry })
  } catch {
    return res.status(500).json({ error: 'STORAGE_ERROR' })
  }
}
```

(참고: 중복 판정을 위해 매 POST에 `lrange` 1회 추가. 부스 규모에서 문제없음. `lrange` 읽기와 저장이 원자적이지 않아 거의 동시 신규 제출 시 최악의 경우 중복 1건 저장 가능 — 물리 수령은 데스크가 통제하므로 허용.)

- [ ] **Step 3: api 타입체크**

Run: `npx tsc -p tsconfig.api.json --noEmit`
Expected: 오류 없음(exit 0).

- [ ] **Step 4: 전체 테스트(회귀 확인)**

Run: `npx vitest run`
Expected: 전부 PASS(Task 1 포함). (프론트 `postEntry`는 아직 옛 형태를 기대하지만 타입만 볼 뿐 런타임 미실행 — full build는 Task 3에서 초록.)

- [ ] **Step 5: 커밋**

```bash
git add src/guestbook/types.ts api/guestbook.ts
git commit -m "feat: 방명록 POST에 이메일 중복 판정 + claimed/already_claimed 응답"
```

---

## Task 3: 프론트엔드 — 수령 페이지 + 이동 (api.ts, GuestbookPage, KeycapPage, App)

**Files:**
- Modify: `src/guestbook/api.ts`
- Modify: `src/guestbook/GuestbookPage.tsx`
- Create: `src/guestbook/KeycapPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 2의 `SubmitResult`, POST 응답 계약.
- Produces:
  - `postEntry(input): Promise<SubmitResult>`
  - 라우트 `/guestbook/keycap` → `KeycapPage`.

- [ ] **Step 1: api.ts의 postEntry 교체** — `src/guestbook/api.ts`

상단 import에 `SubmitResult` 추가(기존 타입 import 줄 교체):
```ts
import type { ApiErrorCode, PublicEntry, SubmitResult } from './types'
```
(참고: `PublicEntry`는 `fetchEntries` 반환 타입으로 계속 쓰인다. 유지할 것.)

`postEntry` 함수 전체 교체:
```ts
export async function postEntry(input: {
  key: string
  name: string
  affiliation: string
  email: string
  message: string
  consent: boolean
}): Promise<SubmitResult> {
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

  return parseJson<SubmitResult>(res)
}
```

- [ ] **Step 2: GuestbookPage — 제출 성공 시 이동** — `src/guestbook/GuestbookPage.tsx`

import 줄 교체(2행):
```ts
import { useNavigate, useSearchParams } from 'react-router-dom'
```

컴포넌트 상단에 navigate 추가(`const writeKey = ...` 아래):
```ts
  const navigate = useNavigate()
```

`handleSubmit` 전체 교체(제출 성공 시 목록 갱신 대신 수령 페이지로 이동):
```ts
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
        const result = await postEntry({ ...input, key: writeKey ?? '' })
        navigate('/guestbook/keycap', { state: { status: result.status } })
      } catch (error) {
        setSubmitError(errorMessage(error))
        // 폼이 입력값을 유지할 수 있도록 다시 던진다
        throw error
      }
    },
    [writeKey, navigate],
  )
```

(참고: `load`는 마운트 시 목록 표시에 계속 쓰이므로 그대로 둔다. `handleSubmit`에서 `load()` 호출만 제거됨 — 제출 후 페이지를 떠나므로 갱신 불필요.)

- [ ] **Step 3: KeycapPage 생성** — `src/guestbook/KeycapPage.tsx`

```tsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

type KeycapStatus = 'claimed' | 'already_claimed'
type KeycapState = { status?: KeycapStatus }

function KeycapImage() {
  const [ok, setOk] = useState(true)
  if (!ok) {
    return (
      <div className="mx-auto mb-6 flex aspect-square w-48 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-sm text-slate-400">
        키캡 이미지
      </div>
    )
  }
  return (
    <img
      src="/keycap.png"
      alt="키캡"
      onError={() => setOk(false)}
      className="mx-auto mb-6 w-48 max-w-full rounded-2xl"
    />
  )
}

function KeycapPage() {
  const state = (useLocation().state ?? {}) as KeycapState
  const status = state.status

  const claimed = status === 'claimed'
  const alreadyClaimed = status === 'already_claimed'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        {claimed && (
          <>
            <KeycapImage />
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2 break-keep">
              안내 데스크에서 키캡을 수령하세요
            </h1>
            <p className="text-slate-500 break-keep">이 화면을 안내 데스크 직원에게 보여주세요.</p>
          </>
        )}

        {alreadyClaimed && (
          <>
            <div className="mx-auto mb-6 flex aspect-square w-48 items-center justify-center rounded-2xl bg-slate-100 text-5xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2 break-keep">
              키캡을 이미 수령하셨습니다
            </h1>
            <p className="text-slate-500 break-keep">
              이 이메일로는 이미 방명록을 작성해 주셨습니다. 감사합니다!
            </p>
          </>
        )}

        {!claimed && !alreadyClaimed && (
          <>
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2 break-keep">키캡 수령 안내</h1>
            <p className="text-slate-500 break-keep mb-6">
              방명록을 작성하시면 키캡 수령 안내가 표시됩니다.
            </p>
            <Link
              to="/guestbook"
              className="inline-block rounded-lg bg-[#0891b2] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              방명록으로 가기
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default KeycapPage
```

- [ ] **Step 4: 라우트 추가** — `src/App.tsx`

import에 추가(기존 `GuestbookPage` import 아래):
```ts
import KeycapPage from './guestbook/KeycapPage'
```

`/guestbook` 라우트 바로 아래에 추가:
```tsx
        <Route path="/guestbook/keycap" element={<KeycapPage />} />
```

- [ ] **Step 5: 전체 빌드·테스트**

Run: `npm run build && npx vitest run`
Expected: 둘 다 성공(build exit 0; 모든 테스트 PASS).

- [ ] **Step 6: 커밋**

```bash
git add src/guestbook/api.ts src/guestbook/GuestbookPage.tsx src/guestbook/KeycapPage.tsx src/App.tsx
git commit -m "feat: 키캡 수령 페이지 + 제출 후 이동(claimed/already_claimed 분기)"
```

---

## Task 4: 배포 + 프로덕션 검증

**Files:**
- (선택) `public/keycap.png` — 실제 키캡 이미지(사용자 제공 시).

- [ ] **Step 1: (선택) 키캡 이미지 배치**

사용자가 키캡 이미지를 주면 `public/keycap.png`로 저장(권장 정사각형, 예 512×512). 없으면 건너뛴다(수령 페이지가 점선 placeholder로 렌더).

- [ ] **Step 2: main 병합 + push(배포)**

```bash
git checkout main
git merge --ff-only <feature-branch>   # 예: feat/keycap-coupon
npm run build && npx vitest run          # 병합본 재확인
git push
```
Vercel 배포 완료(대시보드 Ready) 대기.

- [ ] **Step 3: 신규 제출 → claimed 검증**

브라우저에서 `https://www.infradna.or.kr/guestbook?k=<쓰기키>` → 새 이메일로 작성·제출 →
- `/guestbook/keycap`로 이동, **"안내 데스크에서 키캡을 수령하세요"** + 이미지(또는 placeholder) 표시 확인.

- [ ] **Step 4: 동일 이메일 재제출 → already_claimed 검증**

같은 이메일로 다시 작성·제출 →
- **"키캡을 이미 수령하셨습니다"** 표시 확인.
- 관리자(`/guestbook-admin`)에서 해당 이메일 항목이 **1건만** 존재(중복 저장 안 됨) 확인.

- [ ] **Step 5: 직접 접근 폴백 검증**

`https://www.infradna.or.kr/guestbook/keycap` 직접 진입 → 중립 안내 + "방명록으로 가기" 링크 표시 확인.

- [ ] **Step 6: 검증 데이터 정리**

검증용으로 남은 항목은 Upstash REST `LREM`(정확값) 또는 키 DEL로 정리(운영 시작 전 빈 상태 확보).

---

## Self-Review

**Spec coverage:**
- 이메일 기준 서버 판정 → Task 1(순수함수) + Task 2(핸들러) ✓
- 재제출 시 미저장 + already_claimed → Task 2 Step 2 ✓
- 정규화(소문자·trim) 비교, 저장값은 원본 → Task 1 `normalizeEmail`(대조용) + Task 2(저장은 `result.email` 그대로) ✓
- 응답 계약(201 claimed / 200 already_claimed) → Task 2 ✓
- 이메일·consentAt 공개 미노출 유지 → 기존 `toPublicEntry` 유지, already_claimed는 데이터 없음 ✓
- 제출 후 `/guestbook/keycap` 이동 + 상태 분기 → Task 3 ✓
- 직접 접근/새로고침 폴백 → Task 3 KeycapPage `!claimed && !alreadyClaimed` ✓
- 키캡 이미지 placeholder/교체 → Task 3 `KeycapImage`(onError 폴백) + Task 4 Step 1 ✓
- 롤백 응집(guestbook 내부) → 모든 새 파일 `src/guestbook/`, 라우트 `/guestbook/keycap` ✓

**Placeholder scan:** 코드 스텝 모두 실제 코드. `<쓰기키>`·`<feature-branch>`는 런타임 값/브랜치명 표기(불가피).

**Type consistency:** `SubmitResult`(types.ts) ← api.ts `postEntry` 반환 ← GuestbookPage `result.status` 사용, KeycapPage `KeycapStatus`('claimed'|'already_claimed')와 일치. `isDuplicateEmail(existing, email)` 시그니처가 Task 1 정의와 Task 2 호출부 일치. `fetchEntries`는 `PublicEntry[]` 유지(변경 없음).

## 열린 항목
- 키캡 이미지 파일(실물) — 미제공 시 placeholder로 배포 후 교체.
- 수령/이미수령 카피 최종본(현재안으로 진행).
