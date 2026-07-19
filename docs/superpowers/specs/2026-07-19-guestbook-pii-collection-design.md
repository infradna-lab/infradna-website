# 방명록 개인정보 수집 전환 설계 (2026-07-19)

## 배경 / 문제

현재 방명록(`/guestbook`)은 **익명 공개 벽** 철학으로 만들어져 있다.

- `validate.ts`가 전화번호·이메일을 **차단**(`PII_DETECTED`)하고, 안내문은 "전화번호·이메일은 남기지 말아주세요".
- `GET /api/guestbook`가 모든 항목을 반환하고 페이지가 그대로 공개 표시.
- 항목은 `nickname`(선택, 익명 허용) + `message`뿐.

운영 방침이 바뀌어 **소속·이름·이메일 개인정보를 의도적으로 수집**하기로 결정되었다. 이는 단순 입력칸 추가가 아니라 데이터 흐름·공개 범위·법적(개인정보보호법, PIPA) 처리를 다시 설계해야 하는 철학의 반전이다.

## 목표 (확정된 요구사항)

| 항목 | 결정 |
|---|---|
| 수집 목적 | 참가자 명부·네트워킹 + 행사 후 연락·후속 대응 + 경품 추첨/이벤트 |
| 입력 항목 | 이름·소속·이메일·메시지 **모두 필수** |
| 공개 범위 | 이름·소속·메시지 **공개**, 이메일 **비공개(관리자만)** |
| 동의 | 필수 동의 체크박스 + 간략 고지문(PIPA) |
| 관리자 열람 | 비밀키 URL로 명단/CSV 다운로드 |

### 비목표 (YAGNI)

- 별도 개인정보처리방침 전용 페이지/모달 (지금은 간략 고지문으로 충분)
- 제출 시 기관 이메일 알림 발송 (SMTP/API 설정 필요 — 추후)
- 이중 저장(공개 리스트 + 비공개 맵) 완전 격리 아키텍처(B안) — 저용량 행사용엔 과함
- 로그인/관리자 세션 등 인증 체계 (비밀키 URL로 충분)

## 채택 아키텍처 (A안)

**단일 리스트 + 공개 투영(projection) + 별도 관리자 export 엔드포인트.**

전체 항목을 지금처럼 리스트 한 곳(`guestbook:2026`)에 저장하되, 공개 GET은 응답을 만들 때 이메일을 담지 않는 `PublicEntry`로만 매핑한다. 관리자 열람은 물리적으로 다른 파일 + 별도 시크릿으로 분리한다.

대안 검토:
- **B안(공개 리스트 + 비공개 이메일 맵 분리)**: 버그로도 유출 불가한 최강 격리. 그러나 쓰기 2건·조인·만료 키 2개로 복잡 → 저용량 행사용엔 과함. 유출 위험이 크게 커지면 이 안으로 승격 가능.
- **C안(단일 엔드포인트 쿼리 분기)**: 파일 최소지만 공개/관리자 로직이 한 파일에 섞여 이메일 유출 리스크 최대 → 기각.

## 상세 설계

### 1. 데이터 모델 (`src/guestbook/types.ts`)

저장용 `Entry`와 공개 응답 전용 `PublicEntry`를 타입으로 분리해, 이메일이 공개 경로에 들어가는 것을 컴파일 단계에서 차단한다.

```ts
export type Entry = {           // Redis 저장 전체 (관리자만)
  id: string
  name: string          // 이름  (공개)
  affiliation: string   // 소속  (공개)
  email: string         // 이메일 (비공개)
  message: string       // 메시지 (공개)
  consentAt: string     // 동의 시각 ISO — 동의 증빙
  createdAt: string
}

export type PublicEntry = Pick<Entry, 'id' | 'name' | 'affiliation' | 'message' | 'createdAt'>
```

`ApiErrorCode`에 `INVALID_EMAIL`, `CONSENT_REQUIRED` 추가. 기존 `PII_DETECTED`는 메시지 필드 방어용으로 유지.

### 2. 백엔드 — 공개 엔드포인트 (`api/guestbook.ts`)

- **POST**: `GUESTBOOK_WRITE_KEY` 확인(기존 유지) → 전 항목 + 이메일 형식 + **동의 플래그(`consent === true`)** 검증 → `consentAt = createdAt = now`로 `Entry` 생성 → 기존과 동일한 `multi(lpush → ltrim → expireat)` 트랜잭션 + 절대 만료 TTL 유지.
- **공개 GET**: `lrange`로 읽되 각 항목을 `PublicEntry`로 매핑해 반환(email·consentAt 제거). 이메일은 이 경로에서 직렬화되지 않는다.

### 3. 백엔드 — 관리자 export (신규 `api/guestbook-export.ts`)

- **GET 전용.** `req.query.admin === process.env.GUESTBOOK_ADMIN_KEY` 일 때만 응답. 환경변수 미설정 시 `undefined` 비교로 항상 거부(fail-closed). **쓰기키와 완전히 다른 별도 시크릿.**
- `?format=csv` → **UTF-8 BOM** 포함 CSV(엑셀 한글 대응), 컬럼 `이름,소속,이메일,메시지,동의시각,작성시각`, `Content-Disposition: attachment`. **CSV 수식 인젝션 방어**: `=`,`+`,`-`,`@`로 시작하는 셀 값 앞에 `'` 삽입. 따옴표·줄바꿈·콤마는 표준 CSV 이스케이프(값을 `"`로 감싸고 내부 `"`는 `""`).
- 기본(포맷 미지정) → 전체 `Entry[]` JSON.
- 관리자키·쓰기키는 응답 본문에 절대 포함하지 않는다.

### 4. 검증 (`src/guestbook/validate.ts`) — 철학 반전

- 기존 "이메일·전화 차단" → 이메일은 **형식 검증해 필수 수집**으로 반전.
- `DEFAULT_NICKNAME`(익명) 제거 — 이름 필수.
- 규칙: 이름·소속·이메일·메시지 모두 1자 이상 필수 + 각 길이 상한, 이메일 형식 유효성, 동의 `true` 필수.
- **메시지(공개 필드)에 한해** 전화번호·이메일 문자열 차단 유지 — 공개 화면에 불필요한 연락처가 박히는 것 방지(전용 이메일 칸이 별도로 있으므로).
- 상수: `NAME_MAX`, `AFFILIATION_MAX`, `EMAIL_MAX`, `MESSAGE_MAX`.
- 검증 순서: 필수/길이 → 이메일 형식(`INVALID_EMAIL`) → 메시지 PII(`PII_DETECTED`) → 동의(`CONSENT_REQUIRED`).

### 5. 동의·고지문 (PIPA)

폼 하단 필수 체크박스 + 간략 고지문. **초안** — 정확한 법적 문구는 기관 개인정보 보호책임자 확인 권장:

- 수집 항목: 이름, 소속, 이메일 주소
- 이용 목적: 행사 참가자 명부·네트워킹, 행사 후 연락·후속 안내, 경품 추첨 및 당첨자 연락
- 보유·이용 기간: `GUESTBOOK_EXPIRES_AT` 날짜까지 보관 후 일괄 파기 (TTL과 연동 — 기술적 파기와 고지가 자동 일치)
- 거부 권리: 동의를 거부할 수 있으며, 이 경우 방명록 참여가 제한됩니다.

동의 시각(`consentAt`)을 항목마다 저장해 동의 증빙을 남긴다.

### 6. 프론트엔드

- **`GuestbookForm.tsx`**: 이름/소속/이메일/메시지 입력 + 필수 동의 체크박스 + 고지문. 동의 체크 전 제출 비활성. 클라 검증은 서버와 동일(즉시 피드백용). `onSubmit` 시그니처를 `{ name, affiliation, email, message, consent }`로 변경.
- **`GuestbookList.tsx`**: `이름 · 소속` + 메시지 + 시각 표시. **이메일 없음.** `nickname` → `name` 참조로 교체.
- **`api.ts`**: `postEntry` payload에 name·affiliation·email·consent 추가. `ERROR_MESSAGES`에 `INVALID_EMAIL`·`CONSENT_REQUIRED` 문구 추가.
- **`GuestbookPage.tsx`**: `handleSubmit` 입력 타입 교체, "전화번호·이메일 남기지 마세요" 안내문 교체. `?k=` 쓰기 게이팅은 그대로 유지.

### 7. 운영 · 마이그레이션 · 보안

- **환경변수**: 기존 `GUESTBOOK_WRITE_KEY`·`GUESTBOOK_EXPIRES_AT` 유지 + **신규 `GUESTBOOK_ADMIN_KEY`**(Vercel·`.env.local` 양쪽 설정, 강한 무작위 값). 쓰기키와 반드시 다른 값.
- **마이그레이션 불필요**: 리스트를 방금 비웠으므로 스키마를 깔끔히 교체(키 `guestbook:2026` 유지). 구 스키마(`nickname`) 잔존 항목 없음.
- **보안 요점**:
  1. 이메일은 `PublicEntry` 투영으로 공개 경로 원천 배제.
  2. 관리자키는 서버 전용 — 클라이언트 번들에 절대 미포함.
  3. CSV 수식 인젝션 방어 + 표준 이스케이프.
  4. 동의 증빙(`consentAt`) 저장.

## 에러 처리

- 서버는 기계용 코드만 반환, 한국어 문구는 클라 `ERROR_MESSAGES`에서만 매핑(기존 원칙 유지).
- 키 검증 fail-closed(환경변수 비면 항상 거부).
- `GUESTBOOK_EXPIRES_AT` 파싱 실패·과거 시각은 `CONFIG_ERROR`(기존 로직 유지) — 과거 시각 EXPIREAT로 인한 즉시 삭제 방지.

## 테스트 / 검증

테스트 러너 미구성(`package.json`) → 공개 프로덕션 alias(`https://www.infradna.or.kr`)에서 수동 검증:

1. 공개 `GET /api/guestbook` 응답에 `email`·`consentAt` **미포함** 확인.
2. `GET /api/guestbook-export` — 키 없이 403, 잘못된 키 403, 올바른 키로 전체 JSON.
3. `?format=csv` — 한글 정상(엑셀), 컬럼·이스케이프 정상.
4. 동의 미체크 제출 거부(`CONSENT_REQUIRED`), 잘못된 이메일 거부(`INVALID_EMAIL`).
5. 프리뷰 `*.vercel.app`은 SSO 보호로 익명 접근 불가 → 프로덕션 alias에서 검증(PROJECT_CONTEXT 참고).

## 열린 항목 (구현 전 확인)

- 고지문 최종 법적 문구 — 기관 확인.
- `GUESTBOOK_ADMIN_KEY` 실제 값 생성·Vercel 등록 — 사용자 작업 필요.
