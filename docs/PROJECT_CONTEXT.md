# 프로젝트 컨텍스트 — infradna-website

> 이 문서는 **재단법인 인프라재난관리진흥원(Infra DNA)** 웹사이트의 모든 결정·맥락을 담은 단일 기록입니다.
> 새 세션 시작 시 `SessionStart` 훅이 이 문서를 컨텍스트에 자동 주입합니다.
> 세션을 마무리할 때는 `/session-log` 스킬로 이 문서를 보완하세요. (운영 방식은 `CLAUDE.md`의 "프로젝트 기억 체계" 참고)

---

## 1. 스냅샷

- **제품**: 재단법인 인프라재난관리진흥원 소개 단일 페이지 웹사이트 (마케팅/기관 소개)
- **스택**: React 19 + TypeScript + Vite 7 + Tailwind CSS v4, react-router-dom v7, framer-motion(=`motion` 패키지), lucide-react, @vercel/analytics
- **저장소**: `git@github.com:infradna-lab/infradna-website.git` (기본 브랜치 `main`)
- **배포**: Vercel(추정). 라이브 도메인 `https://www.infradna.or.kr`
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
- **SPA 새로고침 404 대응**: `vercel.json`에 `rewrites: [{ source:"/(.*)", destination:"/index.html" }]`. 정적 파일은 먼저 서빙되므로 안전.

## 4. 컨벤션 / 함정

- **npm 설치는 `--legacy-peer-deps` 필수**: 기존 `@tokens-studio/sd-transforms`가 `style-dictionary@^5`를 요구하나 저장소는 `4.4.0` → 모든 install이 peer 충돌로 실패함.
- 애니메이션 import는 `'framer-motion'`에서 (`motion/react` 아님). `motion` 패키지가 framer-motion을 함께 제공.
- 검증 루틴: 변경 후 `npm run build`(tsc -b + vite build)로 타입체크 겸 빌드 확인.
- 과거 버그: 여러 섹션 `className` 앞에 선행 백틱(`` `py-20 ``) 오타로 상하 패딩이 빠졌던 이슈 → 전부 수정 완료.

## 5. 열린 항목 (TODO)

- [ ] 연구 과제 5건의 상세 본문·사이드바 정보를 **실제 자료로 교체** (`src/data/projects.ts`)
- [ ] `og:image`용 공유 이미지(`public/og-image.png`) 추가 및 메타 연결
- [ ] 라이브 도메인 재배포 확인 + Google Search Console 색인 요청(검색 결과 갱신용)
- [ ] (선택) 3대 서비스(리스크 분석/정책 지원/인력 교육)를 About에서 아이콘 리스트로 시각화할지 결정

## 6. 세션 로그 (최신이 위로, `/session-log`로 갱신)

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
