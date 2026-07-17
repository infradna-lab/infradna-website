# 프로젝트 컨텍스트 — infradna-website

> 이 문서는 **재단법인 인프라재난관리진흥원(Infra DNA)** 웹사이트의 모든 결정·맥락을 담은 단일 기록입니다.
> 새 세션 시작 시 `SessionStart` 훅이 이 문서를 컨텍스트에 자동 주입합니다.
> 세션을 마무리할 때는 `/session-log` 스킬로 이 문서를 보완하세요. (운영 방식은 `CLAUDE.md`의 "프로젝트 기억 체계" 참고)

---

## 1. 스냅샷

- **제품**: 재단법인 인프라재난관리진흥원 소개 단일 페이지 웹사이트 (마케팅/기관 소개)
- **스택**: React 19 + TypeScript + Vite 7 + Tailwind CSS v4, react-router-dom v7, framer-motion(=`motion` 패키지), lucide-react, @vercel/analytics
- **저장소**: `git@github.com:infradna-lab/infradna-website.git` (기본 브랜치 `main`)
- **배포**: Vercel 확정. Git 통합으로 `main` push 시 프로덕션 자동 배포. 라이브 도메인 `https://www.infradna.or.kr` (프로젝트 `jeongseoks-projects-2e720393/infradna-website`). 프리뷰 `*.vercel.app` URL은 SSO 배포 보호가 걸려 익명 접근 불가 → 프리뷰 API 검증은 보호 우회 토큰 없이는 불가하며, 공개 프로덕션 alias에서 검증한다.
- **작업 방식**: 1인 개발, `main`에 직접 커밋·푸시. 커밋 메시지 한국어 + `feat:`/`fix:` 접두.

## 2. 기관 정보 (사이트에 노출되는 사실)

- 기관명: 재단법인 인프라재난관리진흥원 (영문 Infrastructure Disaster Navigation Agency / Infra DNA)
- 설립허가: 2024년 7월, 행정안전부 (비영리 재단법인)
- 설립일: 2024년 8월 4일  ← 설립허가(7월)와 설립일(8월 4일)은 **서로 다른 시점**이며 둘 다 유효
- 대표자: 박상식
- 소재지: 인천광역시 연수구 송도미래로 9, BRC연구소 3동 803호 (우 21988)
- 대표번호: 032-256-2407 / 팩스: 032-232-4407
- 이메일: disastermanager2025@gmail.com
- 기관 성격: AI·데이터 분석 기반으로 기후재난 리스크를 분석·평가·예측하고, 재난 대응 전략 수립(정책 지원)과 인력 교육을 제공하는 전문기관

## 3. 아키텍처 & 핵심 결정

### 라우팅
- `main.tsx`가 `<App/>`을 `<BrowserRouter>`로 감쌈.
- 라우트: `/` → `HomePage`, `/projects/:id` → `ProjectDetailPage`.
- `ScrollManager`(App에 1회 렌더): 이동 시 해시가 있으면 해당 요소로, 없으면 최상단으로 스크롤.
- `HomePage` 섹션 순서: `HeaderSection → AboutSection → FocusSection → ProjectSection → FooterSection`.
- `ProjectSection`에 `id="projects"`(뒤로가기 앵커), 카드는 `/projects/:id`로 `<Link>`.

### 연구 과제 데이터
- `src/data/projects.ts`에 5개 과제 데이터 분리(`projects` 배열 + `getProject(id)`).
- 필드: `id, title, period, category, summary, overview, objectives[], methods[], outcomes[], info{organization, support, progress}, media?{hero, diagram, gallery}`.
- **상세 본문(summary/overview/objectives/methods/outcomes)과 info(주관기관·지원·진척도)는 placeholder** — 실제 과제 자료로 교체 필요.

### 상세 페이지 레이아웃 (결정: 모달/드로어가 아닌 "전용 상세 페이지")
- 히어로(네이비) → 2단 본문(좌: 개요/목표/추진내용/기대효과, 우: sticky 과제정보 사이드바) → 이전/다음 과제 → 사이트 푸터 재사용.
- **이미지/다이어그램 자리**: `MediaFrame` 컴포넌트가 `media.src` 있으면 이미지, 없으면 점선 placeholder 렌더.
  - 대표 이미지(21:9, 히어로 아래) / 추진체계도(16:9, 추진 내용 안) / 연구 성과 갤러리(4:3 × 3).
  - 실제 이미지는 `public/`에 넣고 `media` 필드에 `/파일명`으로 참조.

### 스타일링 (중요)
- Tailwind v4 + `@tailwindcss/vite`. `src/index.css`는 `@import "tailwindcss";`가 전부.
- **`tailwind.config.js`는 로드되지 않음** (index.css에 `@config` 없음) → 그 안의 theme·토큰·`darkMode`는 비활성.
- 컴포넌트는 기본 Tailwind 유틸(`slate-*`) + 임의값 브랜드 색을 사용: **네이비 `#1e3a5f`**, **시안 `#0891b2`**. 한글은 `break-keep`.
- `tokens/` → Style Dictionary 파이프라인(`sd-tokens-config.js`, `tw-tokens-config.js`)은 존재하나 **앱과 연결 안 됨**(`tokens.json` 미사용).

### SEO / 메타 (`index.html`)
- `<title>` = `(재)인프라재난관리진흥원`, `<html lang="ko">`.
- `meta description` + Open Graph(og:title/description/type/url/locale) 추가됨.
- **미완료**: `og:image` — `public/og-image.png`(1200×630) 추가 후 태그 연결 필요.

### 분석 / 배포
- `@vercel/analytics`의 `<Analytics/>`를 `App.tsx`에 추가. **import는 `@vercel/analytics/react`** (Next 아님 — Vite/React SPA이므로 `/next` 사용 금지).
- **SPA 새로고침 404 대응**: `vercel.json`에 `rewrites: [{ source:"/(.*)", destination:"/index.html" }]`. 정적 파일은 먼저 서빙되므로 안전. **검증 결과 이 리라이트는 `/api/guestbook` 함수를 삼키지 않음**(Vercel이 함수·파일시스템을 리라이트보다 먼저 매칭) → `/api` 예외 규칙 불필요.

### 방명록 (기간 한정, 롤백 전제 — `2026-07-17` 도입)
- **성격**: IAHR-APD2026 · SWGIC2026 부스용 임시 방명록. 사이트 방향 전환 아님. 학회 종료 후 **머지 커밋 revert로 롤백**. 상세 설계·계획은 `docs/superpowers/specs/2026-07-16-guestbook-design.md`, `docs/superpowers/plans/2026-07-16-guestbook.md`.
- **경계**: `api/guestbook.ts`(Vercel Function, GET/POST) + `src/guestbook/`(격리 폴더) + `src/App.tsx`에 `/guestbook` 라우트 1줄. 빌드 배관은 `tsconfig.api.json`(api/ 타입체크)·`package.json`의 `vitest`/`test` 스크립트.
- **데이터**: Upstash Redis 리스트 키 `guestbook:2026` 하나. `LPUSH`+`LTRIM 0 499`+`EXPIREAT`를 `multi()`(원자적)로 묶음. 만료는 `GUESTBOOK_EXPIRES_AT` 절대시각(현재 `2026-07-28T23:59:59+09:00`) → 그 시각에 전체 자동 소멸(롤백 시 지울 데이터 없음). **관리자 삭제 UI 없음** — 지우려면 Redis 키 DEL(REST: `POST {KV_REST_API_URL}/del/guestbook:2026`).
- **접근/방어**: 읽기 공개, 쓰기는 QR에 심은 `?k=` 키 게이팅. 실제 방어는 **서버**가 `GUESTBOOK_WRITE_KEY`와 대조(프론트 게이팅은 경험 분기일 뿐). PII(전화·이메일) 정규식 검출로 저장 거부.
- **환경변수**: `GUESTBOOK_WRITE_KEY`, `GUESTBOOK_EXPIRES_AT`(수동), Redis 접속은 `Redis.fromEnv()`가 `UPSTASH_REDIS_REST_URL`/`TOKEN` 없으면 **`KV_REST_API_URL`/`KV_REST_API_TOKEN`로 폴백**(Upstash Marketplace가 주입하는 이름) — 그래서 정상 동작.

## 4. 컨벤션 / 함정

- **npm 설치는 `--legacy-peer-deps` 필수**: 기존 `@tokens-studio/sd-transforms`가 `style-dictionary@^5`를 요구하나 저장소는 `4.4.0` → 모든 install이 peer 충돌로 실패함.
- 애니메이션 import는 `'framer-motion'`에서 (`motion/react` 아님). `motion` 패키지가 framer-motion을 함께 제공.
- 검증 루틴: 변경 후 `npm run build`(tsc -b + vite build)로 타입체크 겸 빌드 확인. **단, `npm run build`는 클라이언트만 검증하고 `api/` 함수는 로컬에서 실행하지 않는다** → 함수 런타임 오류는 배포해야 드러난다. 배포 검증엔 인증된 `npx vercel@latest`(`ls`/`logs <deploy-url> --json`)로 프로덕션 로그를 본다.
- **ESM 함정 (함수)**: `package.json`이 `"type":"module"`이라 Vercel 함수는 네이티브 ESM으로 실행된다. `api/`의 **상대 import는 반드시 `.js` 확장자**를 붙여야 한다(`'../src/guestbook/validate.js'`). 안 붙이면 런타임 `ERR_MODULE_NOT_FOUND`로 함수가 통째로 죽는데(전 메서드 500 `FUNCTION_INVOCATION_FAILED`), `tsconfig.api.json`의 `moduleResolution:"bundler"`가 확장자 없는 import를 허용해 **로컬 tsc는 통과**한다 → 배포 전엔 안 보이는 함정. (`"bundler"`는 `.js`→`.ts` 매핑을 지원하므로 확장자를 붙여도 타입체크는 통과.)
- 과거 버그: 여러 섹션 `className` 앞에 선행 백틱(`` `py-20 ``) 오타로 상하 패딩이 빠졌던 이슈 → 전부 수정 완료.

## 5. 열린 항목 (TODO)

- [ ] 연구 과제 5건의 상세 본문·사이드바 정보를 **실제 자료로 교체** (`src/data/projects.ts`)
- [ ] `og:image`용 공유 이미지(`public/og-image.png`) 추가 및 메타 연결
- [ ] 라이브 도메인 재배포 확인 + Google Search Console 색인 요청(검색 결과 갱신용)
- [ ] (선택) 3대 서비스(리스크 분석/정책 지원/인력 교육)를 About에서 아이콘 리스트로 시각화할지 결정
- [ ] **학회 종료 후 방명록 롤백**: 최신부터 순서로 `git revert 8d38d43 && git revert -m 1 dd44a9f` → push. 이어 Vercel 환경변수 `GUESTBOOK_*` 삭제 + Marketplace Upstash 제거. 데이터는 `2026-07-28 23:59 KST` 자동 소멸.
- [ ] 실기기에서 QR(`/guestbook?k=<키>`) 스캔 → 제출까지 완주 테스트(현장 확인)

## 6. 세션 로그 (최신이 위로, `/session-log`로 갱신)

### 2026-07-17 — 방명록 main 머지 + 배포 검증(ESM 버그 발견·수정)
- `feat/guestbook`(방명록 20여 커밋)을 **`--no-ff`로 main 머지**(커밋 `dd44a9f`) — fast-forward 시 머지 커밋이 안 생겨 설계 10절의 `revert -m 1` 롤백이 불가하므로 의도적으로 no-ff. push로 프로덕션 배포.
- **배포 검증 중 프로덕션 방명록 API가 전 메서드 500(`FUNCTION_INVOCATION_FAILED`)** 발견. 체계적 디버깅으로 근본원인 확정: 함수 상대 import에 `.js` 확장자 누락 → 네이티브 ESM 런타임 `ERR_MODULE_NOT_FOUND`. 로컬 build는 통과(4절 ESM 함정 참고). Vercel 런타임 로그(`npx vercel logs ... --json`)로 실증.
- **수정 `8d38d43`**: `api/guestbook.ts`의 두 상대 import에 `.js` 추가. 재배포 후 프로덕션에서 GET 200 / 잘못된키 403 / PII 400 / 유효제출 201·목록반영 / `/guestbook` 200 전부 확인.
- 검증으로 남은 테스트 글 정리: Redis 키 `guestbook:2026` DEL → 빈 목록. 머지 완료된 `feat/guestbook` 브랜치 로컬·원격 삭제.
- 사용자 확인 완료(정상 동작). **부스 QR에 심을 URL은 `/guestbook?k=<쓰기키>`** — 키 값은 Vercel 환경변수·`.env.local`에만 두고 저장소/문서엔 넣지 않는다(키 게이팅의 전제). 유출 시 `GUESTBOOK_WRITE_KEY` 값만 교체·재배포.
- 문서 커밋 `b03f982`(세션 기록)는 **push 보류** — git 통합상 main push가 프로덕션 재배포를 부르므로, 문서만 단독으로 배포를 트리거하지 않고 **다음 코드 변경과 함께 push**하기로 함. (그래서 현재 로컬 `main`이 `origin/main`보다 앞서 있음.)

### 2026-07-09 ~ 07-10 — 초기 구축 세션
- `/init`로 CLAUDE.md 정비(Tailwind v4가 config 미로드라는 핵심 사실 문서화).
- 연구 과제 상세 페이지 도입: react-router-dom v7 설치, 데이터 분리, `ProjectDetailPage`/`ScrollManager` 추가, 카드 링크화. (커밋 `c82a6ca`)
- 상세 페이지에 이미지/다이어그램 자리(`MediaFrame`) 추가 + 백틱 오타 수정.
- 헤더 중복 제거: 로고가 기관명을 포함하므로 중복 h1/영문 제거하고 **로고를 h1로 승격**(반응형, alt에 기관명).
- 푸터 기관정보 갱신: 설립일·대표자·팩스 추가, 대표번호·주소 갱신.
- About("우리가 하는 일") 공식 개요 반영, **"솔루션"→"해결책"**, "시스템"→"체계", "데이터 분석" 키워드 반영.
- `index.html` title → `(재)인프라재난관리진흥원`. (커밋 `bfc2a83`)
- SEO 메타 추가: lang=ko, description, Open Graph. (커밋 `f354cdf`)
- Vercel Analytics 연동. (커밋 `907cb65`)
- SPA 404 수정: `vercel.json` rewrites. (커밋 `e143abb`)
- 프로젝트 기억 체계 구축: 이 문서 + SessionStart/End 훅 + `/session-log` 스킬.
