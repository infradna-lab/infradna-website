# 방명록 키캡 수령 페이지 설계 (2026-07-19)

## 배경 / 문제

방명록(부스용, 개인정보 수집형)을 성공적으로 작성한 방문자에게 **키캡 쿠폰**을 나눠준다. 쿠폰 값을 생성하지는 않는다 — 안내 데스크에서 **"이 화면을 보여주고 키캡을 수령하세요"** 문구 + 키캡 이미지를 담은 페이지로 이동시키는 것이 전부.

핵심 요구: **처음 작성자**에게는 수령 안내가, **이미 작성한 사람**에게는 "키캡을 이미 수령하셨습니다"가 떠야 한다. 즉 "이미 방명록을 작성한 사람"을 식별·필터링해야 한다.

## 결정 (확정된 요구사항)

| 항목 | 결정 |
|---|---|
| 중복 식별 방식 | **이메일 기준 서버 판정** (이미 필수 수집 중인 이메일 재사용; 기기·브라우저 무관하게 견고) |
| 재제출(이미 등록된 이메일) | **방명록 글 저장 안 함** + "이미 수령" 표시 (이메일당 1건 = 유니크 참가자) |
| 아키텍처 | **A안**: 기존 POST 하나가 판정+저장을 겸함(왕복 1회). 폼 제출이 곧 필터 |

### 비목표 (YAGNI)
- 쿠폰 코드/바코드 생성 — 물리 키캡을 데스크에서 수령하므로 불필요
- 위변조 방어(수령 페이지 직접 접근으로 "수령하세요" 강제 노출 방지) — 안내 데스크 직원이 육안 확인하므로 과함
- 별도 이메일 조회 엔드포인트(B안) — 왕복·이메일 취급 표면만 늘어남

## 상세 설계

### 1. 백엔드 — `api/guestbook.ts` POST 변경

검증(`validateEntry`) 통과 후, 저장 전에 이메일 중복을 검사한다.

- 리스트를 읽어(`lrange`) 각 항목의 `email`을 **소문자·trim 정규화**해 제출 이메일(동일 정규화)과 비교.
- **신규 이메일**: 기존과 동일하게 `multi(lpush→ltrim→expireat)`로 저장 → **201** `{ status: "claimed", entry: PublicEntry }`.
- **이미 존재**: 저장하지 않음 → **200** `{ status: "already_claimed" }` (entry 없음 — 공개/비공개 어떤 데이터도 반환 안 함).
- 그 외(검증 실패·CONFIG·STORAGE)는 기존 동작 유지.

정규화는 비교 목적. 저장되는 `email`은 사용자가 입력한 값(trim)을 그대로 둔다(관리자 export 가독성). 대소문자만 다른 재제출도 동일인으로 판정된다.

동시성: 부스 트래픽 수준에서 두 요청이 같은 신규 이메일로 거의 동시에 들어올 확률은 무시 가능. 최악의 경우 중복 1건이 저장될 수 있으나 키캡 물리 수령은 데스크가 통제하므로 허용.

### 2. 프론트엔드 — 흐름

- `postEntry`가 응답의 `status`(`"claimed" | "already_claimed"`)를 반환하도록 시그니처 확장. `claimed`일 때만 `entry` 존재.
- `GuestbookPage.handleSubmit`: 제출 성공 시 **`/guestbook/keycap`로 이동**하며 결과를 React Router state로 전달: `navigate('/guestbook/keycap', { state: { status } })`.
  - 두 상태 모두 "성공 응답"이므로(HTTP 200/201) 폼 오류로 처리하지 않는다.
  - `already_claimed`는 새 글이 없으므로 목록 갱신 불필요(이동해 버림).

### 3. 프론트엔드 — 수령 페이지 `src/guestbook/KeycapPage.tsx`

라우트 `/guestbook/keycap`. `useLocation().state.status`로 분기:

- **`claimed`**: 큰 제목 "안내 데스크에서 키캡을 수령하세요" + 키캡 이미지 + 보조 문구(예: "이 화면을 직원에게 보여주세요").
- **`already_claimed`**: "키캡을 이미 수령하셨습니다" + 이미지 흐리게/체크 오버레이 + 보조 문구.
- **state 없음(직접 URL 진입/새로고침)**: 중립 안내 "방명록을 작성하시면 키캡 안내가 표시됩니다" + `/guestbook` 링크. (새로고침 시 router state 소실은 이 폴백으로 흡수 — 부스에서는 제출 직후 1회 표시가 목적이라 허용.)

디자인: 방명록과 동일 팔레트(네이비 `#1e3a5f`·시안 `#0891b2`), 모바일 우선(방문자 폰에서 뜸), `break-keep`. framer-motion 등장 애니메이션(방명록 톤과 일치).

키캡 이미지: `public/keycap.png` 참조. 파일이 없으면 점선 placeholder(방명록 `MediaFrame` 패턴 참고)로 우선 렌더 → 실제 파일 투입 시 교체.

### 4. 라우트·정리

- `src/App.tsx`에 `<Route path="/guestbook/keycap" element={<KeycapPage />} />` 추가. `ScrollManager`가 이동 시 최상단 스크롤(기존 동작).
- 방명록과 묶어(`src/guestbook/`, `/guestbook/*`) 학회 종료 후 롤백 시 함께 제거되도록 한다.
- `?k=` 쓰기 게이팅은 방명록 폼에만. 수령 페이지는 제출 후 이동이므로 게이팅 없음.

## 타입 / 인터페이스

- 응답: `type SubmitResult = { status: 'claimed'; entry: PublicEntry } | { status: 'already_claimed' }`.
- `postEntry(...) → Promise<SubmitResult>`.
- 에러 코드 집합(`ApiErrorCode`) 변경 없음(정상 흐름만 추가).

## 에러 처리

- 서버는 정상 흐름에 새 에러 코드를 추가하지 않는다(`already_claimed`는 성공 응답).
- 클라이언트에서 `status`가 예상 밖이면 안전하게 중립 처리(수령 페이지 폴백).

## 테스트 / 검증

- 검증 게이트: `npm run build` + `npx vitest run` (lint은 base부터 깨짐 — 제외).
- 핸들러는 Redis 로드 때문에 단위 테스트 어려움 → **이메일 정규화·중복 판정 로직을 순수 함수로 분리**(예: `isDuplicateEmail(entries, email)` 또는 `normalizeEmail`)해 vitest로 커버. 프로덕션 왕복 검증(신규→claimed, 동일 이메일 재제출→already_claimed, 저장 안 됨)은 배포 후 수행.
- 직접 접근(state 없음) 시 중립 폴백 렌더 확인.

## 열린 항목
- **키캡 이미지 파일** — 실제 이미지 제공 시 `public/keycap.png` 교체(없으면 placeholder로 배포).
- 수령/이미수령 문구의 최종 카피(현재안으로 진행, 조정 가능).
