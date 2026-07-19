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
- 라우트: `/` → `HomePage`, `/projects/:id` → `ProjectDetailPage`, `/achievements` → `AchievementsPage`, `/research` → `ResearchPage` (그리고 부스용 `/guestbook`·관리자 `/guestbook-admin`).
- `ScrollManager`(App에 1회 렌더): 이동 시 해시가 있으면 해당 요소로, 없으면 최상단으로 스크롤.
- `HomePage` 섹션 순서: `HeaderSection → AboutSection → FocusSection → ProjectSection → FooterSection`.
- `ProjectSection`에 `id="projects"`(뒤로가기 앵커), 카드는 `/projects/:id`로 `<Link>`.
- **성과·홍보 진입 링크**(`/research`·`/achievements`)는 `AboutSection`(우리가 하는 일) 하단에 배치(밝은 배경용 카드). "우리가 하는 일(약속) → 실제로 해온 일(증거)" 흐름 + 상단 노출로 가시성 확보가 근거. (ProjectSection 하단에 잠깐 뒀다가 이전함.)

### 연구 과제 데이터
- `src/data/projects.ts`에 5개 과제 데이터 분리(`projects` 배열 + `getProject(id)`).
- 필드: `id, title, period, category, summary, overview, objectives[], methods[], outcomes[], outputs?[](연구 성과물), info{organization, support}, media?{hero, diagram(1개 또는 배열), gallery}`.
- **5개 과제 모두 실제 자료로 교체 완료(2026-07-19)** — 각 과제 발표자료/PDF 기반 본문 + 이미지. 주관기관은 과제별 실제 기관(id1·4=인프라재난관리진흥원, id2=중부대 산학협력단, id3=중부대, id5=한국토지주택공사 LH). `progress`(진척도) 필드·바 제거(실측값 없음). 원본 자료(pptx/pdf/이미지 폴더)는 gitignore, 최적화 이미지만 `public/projects/`에 커밋.

### 상세 페이지 레이아웃 (결정: 모달/드로어가 아닌 "전용 상세 페이지")
- 히어로(네이비) → 2단 본문(좌: 개요/목표/추진내용/기대효과, 우: sticky 과제정보 사이드바) → 이전/다음 과제 → 사이트 푸터 재사용.
- **이미지/다이어그램 자리**: `MediaFrame` 컴포넌트가 `media.src` 있으면 이미지, 없으면 점선 placeholder 렌더. `natural` prop이면 고정비율/크롭 없이 원본 비율 표시(대표 이미지·추진체계도에 적용).
  - 대표 이미지(히어로 아래) / 추진체계도(추진 내용 안, **1개 또는 여러 장 배열 지원**) / 연구 성과 갤러리(4:3 × 3).
  - `outputs`가 있으면 "연구 성과물" 블록(특허·저작권 등) 렌더. 실제 이미지는 `public/`에 넣고 `media`에 `/파일명`으로 참조.

### "우리의 연구"(/research) · 연구 성과(/achievements) — 2026-07-18 도입, 07-19 프로덕션 반영
- 설계·계획: `docs/superpowers/specs/2026-07-18-showcase-and-promo-pages-design.md`, `.../plans/2026-07-18-showcase-and-promo-pages.md`. 서브에이전트 방식으로 구현 후 main 머지·배포 완료.
- **수행 과제 홍보 `/research`("우리의 연구")**: 부스홍보 PPT를 반응형 HTML로 재구성(결정 근거: 16:9 슬라이드는 모바일에서 뭉개짐). 데이터 `src/data/researchThemes.ts`(폭염·한파·홍수·가뭄 테마별 문제/해결/지표/도표). **v4 최종본으로 갱신 완료**(가뭄 5개 분야 포함). 연구 도표(figures)는 pptx 원본 도표를 추출해 `public/research/`에 배치(폭염 2·홍수 2·가뭄 5, **한파는 덱에 도표가 없어 미표시**). 도표 렌더는 2열 자연비율, 빈 테마는 아무것도 안 보임. **PDF 다운로드 작동**: LibreOffice(`soffice --headless --convert-to pdf`)로 v4→PDF 변환해 `public/research-deck.pdf`(3.77MB).
- **연구 성과 `/achievements`**: 심플 그리드+라이트박스(사진 아카이브). 데이터 `src/data/gallery.ts`(빈 배열, 순수 헬퍼 `groupGalleryItems`+테스트). **About에서 링크 제거 → 사이트 도달 경로 없음**(라우트·페이지는 남음, 완전 제거 여부 미정).
- **About 진입**: `AboutSection` 하단에 "우리의 연구"(→/research) **단일 카드**(연구 성과 카드는 제거함).
- **공유 부품**: `PageHero`, `MetricCard`, `Lightbox`(제어형·키보드), `ImageGrid`. 기존 `FooterSection` 재사용. `CtaSection`은 도입했다 푸터 문의처와 중복이라 제거함.
- **PPT→이미지/PDF 워크플로**: pptx는 zip이라 `ppt/media/`에서 원본 도표 이미지 직접 추출 가능(슬라이드 캡처보다 깔끔). 슬라이드 렌더는 `pdftoppm`, 리사이즈는 `sips -Z`, pptx→pdf는 `soffice`(전부 설치돼 있음).

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

### 방명록 (부스용, 2026-07-17 도입 → **07-19 개인정보 수집형으로 전환**)
- **성격/전환**: IAHR-APD2026 · SWGIC2026 부스용. **2026-07-19 운영 방침 변경**: 익명 공개 벽 → **참가자 명부(개인정보 수집)**. 목적: 참가자 명부·네트워킹 + 행사 후 연락 + 경품 추첨. 전환 설계·계획: `docs/superpowers/specs/2026-07-19-guestbook-pii-collection-design.md`, `.../plans/2026-07-19-guestbook-pii-collection.md`(A안). 원 익명 방명록 설계는 `2026-07-16-guestbook-*`.
- **수집·공개 모델(핵심)**: 이름·소속·이메일·메시지 **모두 필수** + **개인정보 수집·이용 동의 체크박스 필수(PIPA)**. **이름·소속·메시지는 공개, 이메일·동의시각(`consentAt`)은 비공개(관리자만)**. 공개 경로는 `PublicEntry`(id·name·affiliation·message·createdAt)로만 투영 → 이메일이 공개 API에 직렬화되지 않음. 투영은 `toPublicEntry` **단일 헬퍼**(types.ts)로 GET·POST 양쪽에서 재사용, `types.test.ts`가 email·consentAt 부재를 검증. 고지문은 초안 — **정확한 법적 문구는 기관 개인정보 보호책임자 확인 필요(열린 항목)**.
- **경계**: `api/guestbook.ts`(공개 GET 투영·POST) + `api/guestbook-export.ts`(관리자 전용) + `src/guestbook/`(폼·목록·검증·`csv.ts`·`GuestbookAdminPage`) + `/guestbook`·`/guestbook-admin` 라우트. 빌드 배관은 `tsconfig.api.json`·vitest.
- **데이터**: Upstash Redis 리스트 키 `guestbook:2026`. `LPUSH`+`LTRIM 0 499`+`EXPIREAT`를 `multi()`로 원자화. 절대 만료 `GUESTBOOK_EXPIRES_AT`(현재 `2026-07-28T23:59:59+09:00`)가 곧 **PIPA 보유기간** → 그 시각에 전체 자동 소멸.
- **검증 반전**: 이메일은 형식검증해 **필수 수집**(과거엔 차단). 단 **공개 필드(이름·소속·메시지)에는 전화·이메일 문자열 차단 유지**(공개 화면에 연락처 박힘 방지; 이메일 전용칸은 예외). 쓰기는 QR `?k=` + 서버가 `GUESTBOOK_WRITE_KEY` 대조(프론트 게이팅은 경험 분기).
- **관리자 열람(`/guestbook-admin`)**: 비밀키를 **암호 입력칸**에 넣어 **`Authorization: Bearer` 헤더**로 `api/guestbook-export` 호출(명단 표 + CSV 다운로드). **키를 URL/쿼리에 절대 넣지 않음**(최종 리뷰 반영: 전체 PII 반환 엔드포인트의 키가 로그·히스토리에 남는 것 방지). export는 **fail-closed**(헤더 없음/오키/키 미설정 → 403). CSV는 UTF-8 BOM + 수식 인젝션 가드(`= + - @ \t \r`). **삭제 UI 없음** — 지우려면 Upstash REST `LREM`(정확값) 또는 키 DEL.
- **환경변수**: `GUESTBOOK_WRITE_KEY`, **신규 `GUESTBOOK_ADMIN_KEY`(쓰기키와 다른 별도 시크릿; Vercel Production + 로컬 `.env.local` 양쪽 등록 필수)**, `GUESTBOOK_EXPIRES_AT`(수동). Redis는 `Redis.fromEnv()`가 `UPSTASH_REDIS_REST_URL/TOKEN` 없으면 **`KV_REST_API_URL/TOKEN`로 폴백**(Upstash Marketplace 주입 이름).

## 4. 컨벤션 / 함정

- **npm 설치는 `--legacy-peer-deps` 필수**: 기존 `@tokens-studio/sd-transforms`가 `style-dictionary@^5`를 요구하나 저장소는 `4.4.0` → 모든 install이 peer 충돌로 실패함.
- 애니메이션 import는 `'framer-motion'`에서 (`motion/react` 아님). `motion` 패키지가 framer-motion을 함께 제공.
- 검증 루틴: 변경 후 `npm run build`(tsc -b + vite build)로 타입체크 겸 빌드 확인. **단, `npm run build`는 클라이언트만 검증하고 `api/` 함수는 로컬에서 실행하지 않는다** → 함수 런타임 오류는 배포해야 드러난다. 배포 검증엔 인증된 `npx vercel@latest`(`ls`/`logs <deploy-url> --json`)로 프로덕션 로그를 본다.
- **ESM 함정 (함수)**: `package.json`이 `"type":"module"`이라 Vercel 함수는 네이티브 ESM으로 실행된다. `api/`의 **상대 import는 반드시 `.js` 확장자**를 붙여야 한다(`'../src/guestbook/validate.js'`). 안 붙이면 런타임 `ERR_MODULE_NOT_FOUND`로 함수가 통째로 죽는데(전 메서드 500 `FUNCTION_INVOCATION_FAILED`), `tsconfig.api.json`의 `moduleResolution:"bundler"`가 확장자 없는 import를 허용해 **로컬 tsc는 통과**한다 → 배포 전엔 안 보이는 함정. (`"bundler"`는 `.js`→`.ts` 매핑을 지원하므로 확장자를 붙여도 타입체크는 통과.)
- 과거 버그: 여러 섹션 `className` 앞에 선행 백틱(`` `py-20 ``) 오타로 상하 패딩이 빠졌던 이슈 → 전부 수정 완료.
- **`npm run lint`는 현재 깨져 있음(기존 이슈)**: 설치된 ESLint는 `8.57.1`인데 `eslint.config.js`는 ESLint 9용 API(`eslint/config`의 `defineConfig`/`globalIgnores`, flat-config 플러그인 프리셋)로 작성됨 → 실행 시 `ERR_PACKAGE_PATH_NOT_EXPORTED`로 아예 안 돌아감. 따라서 **검증 게이트는 `npm run build`(tsc+vite) + `npm run test`(vitest)로 잡는다.** lint를 억지로 통과시키려 config를 손대면 react-hooks/react-refresh 커버리지가 조용히 사라지므로 금지. (해결하려면 ESLint 8 호환 flat config로 포팅 또는 ESLint 9 업그레이드 — 별도 작업, 열린 항목.)

## 5. 열린 항목 (TODO)

- [x] ~~연구 과제 5건 실제 자료로 교체~~ (2026-07-19 완료)
- [x] ~~id:2 특허 등록번호 불일치~~ (2026-07-19 해결): 등록증 캡션을 이미지대로 `등록번호 제10-2719714호`로, 출원통지서는 `출원번호 10-2024-0036865`로 통일. (`10-2024-0036865`는 등록번호가 아니라 출원번호였음.)
- [ ] `og:image`용 공유 이미지(`public/og-image.png`) 추가 및 메타 연결
- [ ] 라이브 도메인 재배포 확인 + Google Search Console 색인 요청(검색 결과 갱신용)
- [ ] (선택) 3대 서비스(리스크 분석/정책 지원/인력 교육)를 About에서 아이콘 리스트로 시각화할지 결정
- [ ] **방명록 고지문 법적 문구 확정**: 현재 동의 고지문은 초안 → 기관 개인정보 보호책임자 확인 후 `GuestbookForm.tsx` 반영.
- [ ] **학회 종료 후 방명록 롤백**: PII 전환분은 `feat/guestbook-pii`를 **FF-머지**(머지 커밋 없음, `f1c9ba6..5e722be` 범위)했으므로 revert는 범위 되돌리기 또는 guestbook 파일 제거로. 원 방명록(`dd44a9f` no-ff 머지)도 함께 정리. 이어 Vercel 환경변수 `GUESTBOOK_*`(**`GUESTBOOK_ADMIN_KEY` 포함**) 삭제 + Marketplace Upstash 제거. 데이터는 `2026-07-28 23:59 KST` 자동 소멸.
- [ ] 실기기에서 QR(`/guestbook?k=<키>`) 스캔 → 제출까지 완주 테스트(현장 확인)
- [ ] (선택) 방명록 관리자 페이지 폴리시(비블로킹, 최종 리뷰 Minor): consentAt를 관리자 표에도 표시(동의 증빙 감사뷰), 비밀키 입력 trim, `KEY='guestbook:2026'` 두 api 파일 공유 상수화, export 500 로깅.
- [ ] **연구 성과 페이지(/achievements) 정리**: About 링크 제거로 도달 경로 없음 → 라우트·페이지·`gallery.ts`·`ImageGrid` 완전 삭제할지 결정(현재는 남겨둠). 살릴 경우 성과 사진(`public/gallery/*.webp`)+`achievementStats` 투입 필요.
- [ ] **가뭄 연구 도표 화질**: `/research` 가뭄 도표 원본이 640px로 다른 테마보다 저해상도 → 더 큰 원본 있으면 교체.
- [ ] **id:5 연구기간 확인**: 현재 `2023 - 2026`으로 두었으나 2단계로 이어지는 사업이라 종료연도 불확실 → 정확한 기간 확인 후 `projects.ts` 갱신.
- [ ] (선택) **id:5 미국특허 POA 이미지**: 성과 갤러리 3번째가 미국특허 위임장(POA)이라 성과물치곤 약함 → 다른 성과물/도표로 교체 고려. (현재 그대로 배포됨)
- [ ] (기존 이슈) `eslint.config.js` ESLint 8/9 불일치 정리(4절 참고) — 선택.

## 6. 세션 로그 (최신이 위로, `/session-log`로 갱신)

### 2026-07-19 (오후) — 방명록 개인정보 수집형 전환 설계→구현→배포·검증
- **운영 방침 변경**: 익명 공개 벽 → 참가자 명부(이름·소속·이메일·메시지 + PIPA 동의). 브레인스토밍으로 목적·공개범위·동의·관리자 열람을 확정하고 스펙·계획 문서화(A안: 단일 리스트 + 공개 투영 + 별도 관리자 export). 첫 작업으로 기존 테스트 글 2건 삭제.
- **서브에이전트 구동 개발**: 브랜치 `feat/guestbook-pii`(base `f1c9ba6`), Task1 검증반전→Task2 CSV헬퍼→Task3 백엔드→Task4 프론트엔드, 각 태스크 구현+리뷰(spec+quality) 루프. 검증 게이트는 `build`+`vitest`(lint는 base부터 깨짐, 4절). 43/43 테스트.
- **최종 전체 리뷰(opus)에서 Important 2건**: ①관리자 export 시크릿을 `?admin=` URL→**`Authorization: Bearer` 헤더**로(전체 PII 반환 엔드포인트 키가 로그에 남는 문제) ②이메일 유출 불변식 테스트 부재. 사용자 결정으로 **`/guestbook-admin` 관리자 페이지 신설**(키 암호칸→헤더) + `toPublicEntry`를 types.ts로 옮겨 `types.test.ts`로 불변식 고정 + CSV 가드에 `\t \r` 추가(Task6, 커밋 `72fbcfd`).
- **배포**: `GUESTBOOK_ADMIN_KEY` 로컬 `.env.local` + Vercel Production 등록 후 `feat/guestbook-pii`를 main **FF-머지**(`f1c9ba6..5e722be`, 8커밋) + push → 자동 배포. 브랜치 삭제.
- **프로덕션 검증(왕복)**: export는 헤더없음/오키/구쿼리 모두 403·올바른 Bearer 200; 이메일 포함 글 제출 → **공개 GET엔 email·consentAt 없음, 관리자 export엔 있음**, CSV(BOM+헤더+행) 정상. 검증글·세션 중 유입된 구스키마 테스트글(리뷰어가 예고한 legacy-entry, 유출 없음) 모두 `LREM` 정리 → 리스트 빈 상태.
- **함정 메모**: 자동승인 분류기가 `.env.local` source + 외부 curl + 파괴적 Redis 쓰기를 묶은 컴파운드 명령을 차단할 수 있음 → 읽기/파일작성/쓰기를 **단계 분리**하면 통과. heredoc과 파이프를 함께 stdin으로 주면 충돌(파이프 대신 값을 파일로).

### 2026-07-19 (오전) — 성과·홍보 페이지 프로덕션 반영 + 5개 연구 과제 실제 콘텐츠·이미지 전면 채움
- `feat/showcase-promo-pages`를 main 머지·push로 **프로덕션 배포**(라이브 반영을 번들 해시로 검증하는 루틴 사용: 로컬 `dist/index.html`의 `index-*.js`와 `curl https://www.infradna.or.kr/` 비교, ~45초).
- **5개 주요 연구 과제(`projects.ts`) 실제 자료로 교체**: 각 과제 발표자료/PDF(사용자가 `docs/<과제폴더>/`에 투입)를 읽고 본문·이미지 매핑. 이미지는 `pdftoppm`/`sips`/pptx media 추출로 최적화해 `public/projects/`에 배치, 원본은 gitignore. 상세 페이지에 **`natural`(원본 비율)·`diagram` 배열(추진내용 다중 이미지)·`outputs`(연구 성과물 블록)** 추가, **진척도 바 제거**.
- **"우리의 연구"(/research) v4 최종본 반영**: 업데이트된 부스홍보 v4 pptx로 4테마 전면 갱신(**가뭄 5개 분야 완성**). 각 테마 **연구 도표**를 pptx `ppt/media/`에서 원본 추출해 삽입(폭염2·홍수2·가뭄5, 한파는 도표 없어 미표시). **PDF 다운로드 실제 구현**(`soffice`로 v4→PDF, `public/research-deck.pdf`).
- **About 재디자인**: "연구 성과" 링크 카드 제거, "우리의 연구" 단일 카드로. `/achievements`는 도달 경로 없어짐(정리 여부 열린 항목).
- **작업 방식 메모**: 사용자가 자료를 폴더에 넣고 지시 → 확인·매핑·최적화·빌드·브라우저 검증·배포 반복. 판단 항목(카테고리·기간·저해상도·특허번호 불일치 등)은 그때그때 사용자에게 확인.
- **로컬 알림 훅**: 사용자 요청으로 `~/.claude/settings.json`에 Stop 훅(`afplay .../Glass.aiff`, async) 추가 — 매 턴 종료 시 소리 알림(프로젝트가 아니라 개인 CLI 설정).

### 2026-07-18 — 성과·홍보 페이지 설계→구현(서브에이전트 방식) + 브랜치 push
- 브레인스토밍으로 두 페이지의 성격을 분리(성과=증거/신뢰, 홍보=내러티브/설득) 후 스펙·계획 문서 작성(main 로컬 커밋 `1b927d9`, `2238f95`, 미push). PPT 검토로 원본이 5장·규칙구조임을 확인 → **이미지/PDF 임베드가 아니라 반응형 HTML 재구성**으로 방향 확정(모바일 가독성 근거).
- **서브에이전트 구동 개발**로 7개 태스크 실행(각 태스크: 구현 서브에이전트 → 리뷰 서브에이전트 → 수정 루프). 브랜치 `feat/showcase-promo-pages`(base `2238f95`), 9커밋. 31/31 테스트 통과, `npm run build` green, 브라우저로 육안 검증.
- **발견·수정**: (1) Task1 서브에이전트가 깨진 lint를 억지로 통과시키려 `eslint.config.js`·무관 파일을 수정 → 되돌리고 **검증을 build로 고정**(4절에 기록). (2) 성과 페이지 라이트박스 인덱스가 그룹정렬 순서와 어긋나던 버그 수정(`1f5f0e4`). (3) Lightbox 빈 배열 keydown 가드 추가(`6b2dba5`).
- **배치 결정**: 리뷰·검증 후 `origin`에 **브랜치만 push**(프로덕션 미반영). 라이브는 자산 채운 뒤 main 머지로.
- **진입 링크 배치(결정)**: 후보 3안(주요 연구 과제 유지 / 주요 연구 분야 이동 / About 이전)을 논의. `주요 연구 분야`(FocusSection)는 역량 카드 영역이라 "수행 과제 홍보"(과제) 링크와 라벨↔내용 미스매치 → 배제. **최종: `AboutSection`(우리가 하는 일) 하단으로 이전**(커밋 `76f8efc`). 근거: About 본문이 이미 폭염·침수·수자원 등 홍보 페이지 주제를 말로 약속 → 그 아래 링크가 "실제로 해온 일(증거)"로 자연스럽게 이어짐 + About이 2번째 섹션이라 가시성도 확보. ProjectSection 하단 링크는 제거(중복 방지).

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
