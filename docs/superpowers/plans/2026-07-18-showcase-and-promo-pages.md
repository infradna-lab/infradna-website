# 연구 성과·수행 과제 홍보 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사진 기반 "연구 성과" 페이지(`/achievements`)와 PPT를 반응형 HTML로 재구성한 "수행 과제 홍보" 페이지(`/research`)를 기존 사이트에 추가한다.

**Architecture:** 두 페이지가 공유 UI 부품(`PageHero`, `MetricCard`, `CtaSection`, `Lightbox`, `ImageGrid`)을 쓰는 정적 프레젠테이션 페이지. 데이터는 신규 정적 소스(`gallery.ts`, `researchThemes.ts`)에 분리. PPT 내용은 이미지가 아니라 텍스트/숫자로 재구성해 PC·모바일 양쪽에서 리플로우된다. 원본 PPT는 PDF 다운로드로 보존.

**Tech Stack:** React 19 + TypeScript + Vite 7 + Tailwind v4(유틸+임의값), react-router-dom v7, framer-motion(=`motion` 패키지), lucide-react, vitest(순수함수 테스트).

## Global Constraints

- 신규 npm 의존성 추가 금지(YAGNI). 컴포넌트 테스트 라이브러리(@testing-library/react·jsdom)도 추가하지 않는다. 부득이 install이 필요하면 **반드시 `npm install --legacy-peer-deps`**(저장소 peer 충돌 회피).
- 애니메이션 import는 `'framer-motion'`에서 한다(`'motion/react'` 아님).
- 브랜드 색: 네이비 `#1e3a5f`, 시안 `#0891b2`. 중립은 `slate-*`. 한글 줄바꿈은 `break-keep`. 레이아웃은 `container mx-auto` 또는 `max-w-*xl mx-auto` + `px-4 md:px-8`.
- 새 Tailwind 테마/토큰 도입 금지(`tailwind.config.js`는 미로드 상태 유지).
- React는 `import React` 없이 JSX 사용(기존 관례). 타입은 `import type { ... } from 'react'`로 명시 import.
- 기관 연락처(공유 CTA용): 이메일 `disastermanager2025@gmail.com`, 전화 `032-256-2407`.
- 검증 명령: 타입체크·빌드 `npm run build`, 린트 `npm run lint`, 순수함수 테스트 `npm run test`, 육안 확인 `npm run dev`. 컴포넌트에는 단위 테스트가 없으므로 build+lint+dev로 검증한다(저장소 관례).

---

## File Structure

- Create `src/data/researchThemes.ts` — 홍보 페이지용 재난 테마 데이터(4개) + intro 카피 (Task 1)
- Create `src/data/gallery.ts` — 성과 갤러리 아이템 타입·데이터·앵커 지표 + 순수 그룹핑 헬퍼 (Task 2)
- Create `src/data/gallery.test.ts` — 그룹핑 헬퍼 vitest 테스트 (Task 2)
- Create `src/components/PageHero.tsx` — 네이비 히어로(제목/부제/뒤로가기/앵커 지표) (Task 3)
- Create `src/components/MetricCard.tsx` — 밝은 배경용 지표 카드(값/라벨/캡션) (Task 3)
- Create `src/components/CtaSection.tsx` — 협력·문의 CTA(연락처 링크) (Task 3)
- Create `src/components/Lightbox.tsx` — 이미지 확대 오버레이(제어형) (Task 4)
- Create `src/components/ImageGrid.tsx` — 반응형 이미지 그리드(클릭 시 콜백) (Task 4)
- Create `src/pages/AchievementsPage.tsx` — 연구 성과 페이지 (Task 5)
- Create `src/pages/ResearchPage.tsx` — 수행 과제 홍보 페이지 (Task 6)
- Modify `src/App.tsx` — 라우트 2개 추가 (Task 5, Task 6)
- Modify `src/components/ProjectSection.tsx` — 홈에서 두 페이지로 가는 진입 링크 (Task 7)

---

## Task 1: 홍보 페이지 데이터 (`researchThemes.ts`)

**Files:**
- Create: `src/data/researchThemes.ts`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `interface Metric { value: string; label: string; caption?: string }`
  - `interface ResearchFigure { src: string; alt: string }`
  - `interface ResearchTheme { id: string; eyebrowEN: string; disaster: string; title: string; summary: string; problem: string; solution: string; metrics: Metric[]; figures: ResearchFigure[] }`
  - `export const researchThemes: ResearchTheme[]`
  - `export const researchIntro: { title: string; subtitle: string }`

- [ ] **Step 1: 데이터 파일 작성**

부록 A(설계 문서)의 PPT 매핑을 그대로 옮긴다. 폭염·한파·홍수는 실측 문구, 가뭄은 텍스트가 이미지로 구워져 있어 확보 전까지 자리표시자(주석 명시).

```ts
// src/data/researchThemes.ts
export interface Metric {
  value: string
  label: string
  caption?: string
}

export interface ResearchFigure {
  src: string
  alt: string
}

export interface ResearchTheme {
  id: string
  eyebrowEN: string
  disaster: string
  title: string
  summary: string
  problem: string
  solution: string
  metrics: Metric[]
  /** PPT '이미지추가' 자리 — 연구 도표 확보 시 채운다. 비어 있으면 placeholder 렌더. */
  figures: ResearchFigure[]
}

export const researchIntro = {
  title: '실측 데이터로 짚어내는 폭염·한파·홍수·가뭄 대응 연구',
  subtitle:
    '위성·IoT 센서·시나리오 분석·빅데이터로 기후재난의 실제 영향을 진단하고, 행정동·시군구 단위 대응 전략을 제시합니다.',
}

export const researchThemes: ResearchTheme[] = [
  {
    id: 'heatwave',
    eyebrowEN: 'HEAT WAVE',
    disaster: '폭염',
    title: '과천시 지표면 온도로 찾아낸 폭염 취약지역',
    summary: '도시 열섬을 잡는 실측 기반 폭염 대응',
    problem:
      '도시 폭염 피해는 반복되지만, 행정동 단위로 어디가 더 위험한지 판단할 실측 근거가 부족합니다.',
    solution:
      'Landsat 위성 지표면온도와 도심 14개 지점 IoT 실측 기온을 결합해 검증하고(r=0.59, p<0.001), 열섬 클러스터 분석과 행정동 단위 대응 우선순위 지수(HRPAI)를 개발했습니다.',
    metrics: [
      {
        value: 'r = 0.59',
        label: '위성 LST · 실측기온 상관관계',
        caption: 'p<0.001, n=70 · 30m 해상도 LST와 IoT 센서 실측값 비교 검증',
      },
      {
        value: '38.96℃',
        label: '과천시 평균 LST (여름철)',
        caption: '최고 46.27℃~최저 29.93℃, 약 16℃ 공간 편차 · 별양동·과천동·부림동 상대적 고온',
      },
      {
        value: 'HRPAI',
        label: '폭염 대응 우선순위 지수',
        caption: 'Getis-Ord Gi*·LISA 공간통계로 고온 클러스터 도출, 행정동 단위 대응 인프라 우선순위 산출',
      },
    ],
    figures: [],
  },
  {
    id: 'coldwave',
    eyebrowEN: 'COLD WAVE',
    disaster: '한파',
    title: '노출·민감도·적응력으로 계산하는 한파 취약성',
    summary: '노출·민감도·적응력으로 읽는 한파 취약성',
    problem:
      '한파 대응은 기상특보 중심이라, 지역마다 다른 사회적 민감도와 대응 여력 차이가 반영되지 않습니다.',
    solution:
      '기후노출·민감도·적응력을 결합한 취약성 산정식을 개발하고, SSP 시나리오별 지역 간 격차를 진단했습니다.',
    metrics: [
      {
        value: 'V=0.4CE+0.3ST−0.3AC',
        label: '기후변화 취약성 산정식',
        caption: '노출(극한기후지수) · 민감도(고령자·한랭질환 비율) · 적응력(GRDP·응급의료 등)',
      },
      {
        value: 'SSP1→SSP3',
        label: '시나리오별 한파 영향도(CI_CW)',
        caption: '법정동 단위 비교 예시: 131.9 → 129.5 → 118.6 (시나리오 진행에 따른 변화)',
      },
      {
        value: '읍면동→집계구',
        label: '공간 단위별 취약성 표출',
        caption: '행정 단위별 세분화된 취약계층 분포와 대응 인프라(그린·그레이·블루) 연계 제시',
      },
    ],
    figures: [],
  },
  {
    id: 'flood',
    eyebrowEN: 'URBAN FLOOD',
    disaster: '홍수·침수',
    title: '모니터링과 데이터 품질관리를 통한 실시간 홍수·침수 감지',
    summary: '센서 오류에도 흔들리지 않는 실시간 침수 감지',
    problem:
      '기후변화로 인한 집중호우 증가로 도시침수가 늘고 있지만, 기존 계측장비와 육안관제만으로는 침수 사각지대를 신속히 파악하기 어렵고 IoT 센서 오류로 실시간 관측정보의 신뢰성이 저하됩니다.',
    solution:
      'IoT 실시간 계측 센서와 CCTV 영상 데이터를 결합한 도시침수 상황감시 기술을 개발하고, 센서 이상치를 탐지·보정하는 AI 기반 품질관리로 침수 정보의 신뢰성과 신속한 상황 인지를 확보했습니다.',
    metrics: [
      {
        value: '관로수위계·도로침수계',
        label: '스마트 도시침수 계측센서',
        caption: '현장 실증을 통한 도시침수 실시간 모니터링',
      },
      {
        value: 'AI 하이브리드 품질관리',
        label: '딥러닝 이상치 탐지·보정',
        caption: '하수관로 수위·도로 침수심 대상 이상치 탐지 및 보정 모델',
      },
      {
        value: 'IoT + CCTV',
        label: '결합 상황감시',
        caption: '계측 데이터와 영상 데이터를 결합한 새로운 도시침수 상황감시 기술',
      },
    ],
    figures: [],
  },
  {
    id: 'drought',
    eyebrowEN: 'DROUGHT',
    disaster: '가뭄',
    title: '물공급을 넘어, 5개 분야로 읽는 가뭄의 실제 영향',
    summary: '물공급을 넘어, 5개 분야로 읽는 가뭄의 실제 영향',
    // TODO(content): 가뭄 슬라이드는 텍스트가 이미지로 구워져 있어 원문 추출 불가.
    // 사용자에게 문제/해결/지표 문구를 받아 아래를 교체할 것.
    problem: '가뭄 슬라이드 본문(문제)은 원본 확보 후 채웁니다.',
    solution: '가뭄 슬라이드 본문(해결)은 원본 확보 후 채웁니다.',
    metrics: [],
    figures: [],
  },
]
```

- [ ] **Step 2: 타입체크·린트 통과 확인**

Run: `npm run build && npm run lint`
Expected: 에러 없이 종료(exit 0). 신규 데이터 파일이 tsc·eslint를 통과한다.

- [ ] **Step 3: Commit**

```bash
git add src/data/researchThemes.ts
git commit -m "feat: 수행 과제 홍보 페이지 데이터(researchThemes) 추가"
```

---

## Task 2: 성과 갤러리 데이터 + 그룹핑 헬퍼 (`gallery.ts`)

**Files:**
- Create: `src/data/gallery.ts`
- Test: `src/data/gallery.test.ts`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `interface GalleryItem { src: string; alt: string; caption?: string; group?: string }`
  - `interface GalleryGroup { group?: string; items: GalleryItem[] }`
  - `function groupGalleryItems(items: GalleryItem[]): GalleryGroup[]` — 첫 등장 순서로 그룹을 보존, 그룹 없는 아이템은 `group: undefined` 섹션으로 묶음
  - `export const galleryItems: GalleryItem[]`
  - `export const achievementStats: { value: string; label: string }[]`
  - `export const achievementIntro: { title: string; subtitle: string }`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/data/gallery.test.ts
import { describe, it, expect } from 'vitest'
import { groupGalleryItems, type GalleryItem } from './gallery'

const item = (src: string, group?: string): GalleryItem => ({ src, alt: src, group })

describe('groupGalleryItems', () => {
  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(groupGalleryItems([])).toEqual([])
  })

  it('그룹이 없으면 undefined 그룹 하나로 묶는다', () => {
    const items = [item('a'), item('b')]
    expect(groupGalleryItems(items)).toEqual([{ group: undefined, items }])
  })

  it('그룹을 첫 등장 순서로 보존하고 아이템 순서를 유지한다', () => {
    const a = item('a', '연구')
    const b = item('b', '교육')
    const c = item('c', '연구')
    expect(groupGalleryItems([a, b, c])).toEqual([
      { group: '연구', items: [a, c] },
      { group: '교육', items: [b] },
    ])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- gallery`
Expected: FAIL — `groupGalleryItems`/`gallery` 모듈이 없어 import 실패.

- [ ] **Step 3: 데이터 파일 작성(헬퍼 포함)**

실제 사진은 아직 없으므로 `galleryItems`는 빈 배열로 시작(페이지는 빈 상태를 정상 렌더). 앵커 지표·intro는 실제 값 확보 전까지 자리표시자(주석 명시).

```ts
// src/data/gallery.ts
export interface GalleryItem {
  src: string // '/gallery/xxx.webp' (public/ 기준 절대경로)
  alt: string
  caption?: string
  group?: string // 선택: 수동 그룹핑용 소제목
}

export interface GalleryGroup {
  group?: string
  items: GalleryItem[]
}

/**
 * 갤러리 아이템을 group 값으로 묶는다.
 * - 그룹 키는 '첫 등장 순서'를 보존한다.
 * - 각 그룹 내부의 아이템 순서도 입력 순서를 유지한다.
 * - group 이 없는(undefined) 아이템들은 group: undefined 섹션으로 묶인다.
 */
export function groupGalleryItems(items: GalleryItem[]): GalleryGroup[] {
  const order: (string | undefined)[] = []
  const buckets = new Map<string | undefined, GalleryItem[]>()
  for (const it of items) {
    const key = it.group
    if (!buckets.has(key)) {
      buckets.set(key, [])
      order.push(key)
    }
    buckets.get(key)!.push(it)
  }
  return order.map((group) => ({ group, items: buckets.get(group)! }))
}

export const achievementIntro = {
  title: '연구가 남긴 현장의 순간들',
  subtitle: '기후재난 대응 연구·교육·협력 활동의 기록입니다.',
}

// TODO(content): 실제 값으로 교체 (수행 과제 건수·협력기관·교육 인원 등)
export const achievementStats: { value: string; label: string }[] = []

// TODO(content): public/gallery/ 에 webp 이미지를 넣고 아래 배열을 채운다.
// 예: { src: '/gallery/2025-seminar-01.webp', alt: '2025 기후재난 세미나', group: '행사' }
export const galleryItems: GalleryItem[] = []
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- gallery`
Expected: PASS — 3개 테스트 통과.

- [ ] **Step 5: 타입체크·린트 통과 확인**

Run: `npm run build && npm run lint`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/data/gallery.ts src/data/gallery.test.ts
git commit -m "feat: 성과 갤러리 데이터 + 순수 그룹핑 헬퍼(테스트 포함)"
```

---

## Task 3: 공유 프리미티브 (`PageHero`, `MetricCard`, `CtaSection`)

**Files:**
- Create: `src/components/PageHero.tsx`
- Create: `src/components/MetricCard.tsx`
- Create: `src/components/CtaSection.tsx`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `PageHero` props: `{ eyebrow?: string; title: string; subtitle?: string; stats?: { value: string; label: string }[]; backTo?: string; backLabel?: string }`
  - `MetricCard` props: `{ value: string; label: string; caption?: string }`
  - `CtaSection` props: `{ title?: string; description?: string }`

- [ ] **Step 1: `PageHero` 작성**

네이비 히어로. 선택적 뒤로가기 링크, 선택적 앵커 지표(히어로 자체 스타일 — 밝은 배경용 `MetricCard`와 분리).

```tsx
// src/components/PageHero.tsx
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  stats?: { value: string; label: string }[]
  backTo?: string
  backLabel?: string
}

function PageHero({ eyebrow, title, subtitle, stats, backTo, backLabel }: PageHeroProps) {
  return (
    <section className="bg-[#1e3a5f] text-white px-4 md:px-8 pt-10 pb-16 md:pt-14 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-5xl mx-auto"
      >
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center text-blue-200 hover:text-white transition-colors mb-10 text-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> {backLabel ?? '홈으로'}
          </Link>
        )}

        {eyebrow && (
          <p className="mb-4 font-mono text-sm uppercase tracking-widest text-[#38bdf8]">{eyebrow}</p>
        )}
        <h1 className="text-3xl md:text-5xl font-bold leading-snug break-keep mb-6 max-w-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-blue-100 leading-relaxed break-keep max-w-3xl">
            {subtitle}
          </p>
        )}

        {stats && stats.length > 0 && (
          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 max-w-3xl">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-[#0891b2] pl-4">
                <dt className="text-2xl md:text-3xl font-bold text-white">{s.value}</dt>
                <dd className="mt-1 text-sm text-blue-200 break-keep">{s.label}</dd>
              </div>
            ))}
          </dl>
        )}
      </motion.div>
    </section>
  )
}

export default PageHero
```

- [ ] **Step 2: `MetricCard` 작성**

밝은 배경용 지표 카드. 값·라벨·캡션.

```tsx
// src/components/MetricCard.tsx
interface MetricCardProps {
  value: string
  label: string
  caption?: string
}

function MetricCard({ value, label, caption }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xl md:text-2xl font-bold text-[#1e3a5f] break-keep">{value}</p>
      <p className="mt-2 text-sm font-semibold text-[#0891b2] break-keep">{label}</p>
      {caption && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500 break-keep">{caption}</p>
      )}
    </div>
  )
}

export default MetricCard
```

- [ ] **Step 3: `CtaSection` 작성**

협력·문의 CTA. 연락처는 기관 상수(전역 제약)로 고정, 이메일/전화 링크.

```tsx
// src/components/CtaSection.tsx
import { motion } from 'framer-motion'
import { Mail, Phone } from 'lucide-react'

interface CtaSectionProps {
  title?: string
  description?: string
}

function CtaSection({
  title = '함께할 파트너를 찾습니다',
  description = '기후재난 대응 연구·정책·교육 협력을 환영합니다. 편하게 문의해 주세요.',
}: CtaSectionProps) {
  return (
    <section className="bg-[#1e3a5f] text-white px-4 md:px-8 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold break-keep mb-4">{title}</h2>
        <p className="text-blue-100 break-keep mb-10 leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:disastermanager2025@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-[#0891b2] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0aa4c9]"
          >
            <Mail size={18} /> disastermanager2025@gmail.com
          </a>
          <a
            href="tel:032-256-2407"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
          >
            <Phone size={18} /> 032-256-2407
          </a>
        </div>
      </motion.div>
    </section>
  )
}

export default CtaSection
```

- [ ] **Step 4: 타입체크·린트 통과 확인**

Run: `npm run build && npm run lint`
Expected: exit 0. (아직 어디서도 import 안 하므로 미사용 경고가 나면 다음 태스크에서 소비되니 무시 가능하나, eslint가 에러로 막지는 않는다.)

- [ ] **Step 5: Commit**

```bash
git add src/components/PageHero.tsx src/components/MetricCard.tsx src/components/CtaSection.tsx
git commit -m "feat: 공유 UI 프리미티브(PageHero·MetricCard·CtaSection) 추가"
```

---

## Task 4: 이미지 뷰어 (`Lightbox`, `ImageGrid`)

**Files:**
- Create: `src/components/Lightbox.tsx`
- Create: `src/components/ImageGrid.tsx`

**Interfaces:**
- Consumes: `GalleryItem` from `../data/gallery`
- Produces:
  - `interface LightboxImage { src: string; alt: string; caption?: string }`
  - `Lightbox` props: `{ images: LightboxImage[]; index: number; onClose: () => void; onIndexChange: (index: number) => void }`
  - `ImageGrid` props: `{ items: GalleryItem[]; onOpen: (localIndex: number) => void }`

- [ ] **Step 1: `Lightbox` 작성**

제어형 오버레이. Esc 닫기, ←/→ 이동. 인덱스 경계 방어. `GalleryItem`(캡션 포함)과 `ResearchFigure`가 모두 대입 가능하도록 `LightboxImage` 최소 형태를 export.

```tsx
// src/components/Lightbox.tsx
import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface LightboxImage {
  src: string
  alt: string
  caption?: string
}

interface LightboxProps {
  images: LightboxImage[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const count = images.length
  const current = images[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count)
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, count, onClose, onIndexChange])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
      >
        <X size={28} />
      </button>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onIndexChange((index - 1 + count) % count)
          }}
          aria-label="이전 이미지"
          className="absolute left-2 md:left-6 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      <figure className="max-h-[85vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[80vh] w-auto rounded-lg object-contain"
        />
        {current.caption && (
          <figcaption className="mt-4 text-center text-sm text-white/70 break-keep">
            {current.caption}
          </figcaption>
        )}
      </figure>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onIndexChange((index + 1) % count)
          }}
          aria-label="다음 이미지"
          className="absolute right-2 md:right-6 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ChevronRight size={36} />
        </button>
      )}
    </div>
  )
}

export default Lightbox
```

- [ ] **Step 2: `ImageGrid` 작성**

반응형 그리드. 각 이미지는 버튼(클릭 시 로컬 인덱스 콜백). 캡션 있으면 하단 표기.

```tsx
// src/components/ImageGrid.tsx
import type { GalleryItem } from '../data/gallery'

interface ImageGridProps {
  items: GalleryItem[]
  onOpen: (localIndex: number) => void
}

function ImageGrid({ items, onOpen }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <button
          key={item.src}
          type="button"
          onClick={() => onOpen(i)}
          className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
        >
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {item.caption && (
            <span className="block px-3 py-2 text-xs text-slate-500 break-keep">{item.caption}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export default ImageGrid
```

- [ ] **Step 3: 타입체크·린트 통과 확인**

Run: `npm run build && npm run lint`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/Lightbox.tsx src/components/ImageGrid.tsx
git commit -m "feat: 이미지 뷰어(Lightbox·ImageGrid) 추가"
```

---

## Task 5: 연구 성과 페이지 (`AchievementsPage`) + 라우트

**Files:**
- Create: `src/pages/AchievementsPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `PageHero`, `CtaSection`, `ImageGrid`, `Lightbox` (+ `LightboxImage`), `FooterSection`, `galleryItems`/`achievementStats`/`achievementIntro`/`groupGalleryItems` from `../data/gallery`
- Produces: `AchievementsPage` (default export), 라우트 `/achievements`

- [ ] **Step 1: 페이지 작성**

그룹핑 후 그룹별로 소제목 + `ImageGrid`. 라이트박스는 전체 평면 리스트 기준(그룹 누적 오프셋으로 전역 인덱스 계산). 사진이 없으면 빈 상태 안내.

```tsx
// src/pages/AchievementsPage.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ImageOff } from 'lucide-react'
import PageHero from '../components/PageHero'
import CtaSection from '../components/CtaSection'
import ImageGrid from '../components/ImageGrid'
import Lightbox from '../components/Lightbox'
import FooterSection from '../components/FooterSection'
import {
  galleryItems,
  achievementStats,
  achievementIntro,
  groupGalleryItems,
} from '../data/gallery'

function AchievementsPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const groups = groupGalleryItems(galleryItems)

  // 그룹별 시작 오프셋을 미리 계산해 전역 인덱스를 구한다.
  let offset = 0
  const groupsWithOffset = groups.map((g) => {
    const base = offset
    offset += g.items.length
    return { ...g, base }
  })

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        title={achievementIntro.title}
        subtitle={achievementIntro.subtitle}
        stats={achievementStats}
        backTo="/"
        backLabel="홈으로"
      />

      <section className="px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {galleryItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-24 text-slate-400">
              <ImageOff size={32} />
              <p className="text-sm text-slate-500 break-keep">성과 사진을 준비 중입니다.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {groupsWithOffset.map((g, gi) => (
                <motion.div
                  key={g.group ?? `group-${gi}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {g.group && (
                    <h2 className="mb-6 text-2xl font-bold text-[#1e3a5f] break-keep">{g.group}</h2>
                  )}
                  <ImageGrid items={g.items} onOpen={(local) => setLightboxIndex(g.base + local)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaSection />
      <FooterSection />

      {lightboxIndex !== null && (
        <Lightbox
          images={galleryItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  )
}

export default AchievementsPage
```

- [ ] **Step 2: 라우트 추가 (`App.tsx`)**

`src/App.tsx`에 import와 Route를 추가한다. 기존 import 블록 아래에 추가:

```tsx
import AchievementsPage from './pages/AchievementsPage'
```

`<Route path="/guestbook" ... />` 아래에 추가:

```tsx
        <Route path="/achievements" element={<AchievementsPage />} />
```

- [ ] **Step 3: 타입체크·린트 통과 확인**

Run: `npm run build && npm run lint`
Expected: exit 0.

- [ ] **Step 4: 육안 확인**

Run: `npm run dev`
브라우저에서 `http://localhost:5173/achievements` 접속.
Expected: 네이비 히어로 + "성과 사진을 준비 중입니다." 빈 상태 렌더. `홈으로` 링크가 `/`로 이동. 콘솔 에러 없음. (사진 데이터를 넣으면 그리드·라이트박스가 뜨는 것은 자산 투입 후 확인.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/AchievementsPage.tsx src/App.tsx
git commit -m "feat: 연구 성과 페이지(/achievements) 추가"
```

---

## Task 6: 수행 과제 홍보 페이지 (`ResearchPage`) + 라우트

**Files:**
- Create: `src/pages/ResearchPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `PageHero`, `MetricCard`, `CtaSection`, `Lightbox` (+ `LightboxImage`), `FooterSection`, `researchThemes`/`researchIntro` from `../data/researchThemes`
- Produces: `ResearchPage` (default export), 라우트 `/research`

- [ ] **Step 1: 페이지 작성**

표지 히어로 → 재난 테마 4블록(교차 배경, 문제/해결 2단, 지표 카드, 도표 자리) → PDF 다운로드 → CTA. 지표가 빈 테마(가뭄)는 카드 그리드를 생략. 도표(figures)가 있으면 클릭 시 그 테마 범위의 라이트박스를 연다.

```tsx
// src/pages/ResearchPage.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Thermometer, Snowflake, Waves, Droplets, Download, ImagePlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHero from '../components/PageHero'
import MetricCard from '../components/MetricCard'
import CtaSection from '../components/CtaSection'
import Lightbox, { type LightboxImage } from '../components/Lightbox'
import FooterSection from '../components/FooterSection'
import { researchThemes, researchIntro } from '../data/researchThemes'

const THEME_ICON: Record<string, LucideIcon> = {
  heatwave: Thermometer,
  coldwave: Snowflake,
  flood: Waves,
  drought: Droplets,
}

function ResearchPage() {
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="CLIMATE DISASTER RESPONSE RESEARCH"
        title={researchIntro.title}
        subtitle={researchIntro.subtitle}
        backTo="/"
        backLabel="홈으로"
      />

      {researchThemes.map((theme, ti) => {
        const Icon = THEME_ICON[theme.id] ?? ImagePlus
        const shaded = ti % 2 === 1
        return (
          <section
            key={theme.id}
            className={`px-4 md:px-8 py-16 md:py-24 ${shaded ? 'bg-slate-50' : 'bg-white'}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-5xl mx-auto"
            >
              <div className="mb-8 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
                  <Icon size={22} />
                </span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-[#0891b2]">
                    {theme.eyebrowEN} · {theme.disaster}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] break-keep">
                    {theme.title}
                  </h2>
                </div>
              </div>

              <p className="mb-10 text-lg text-slate-600 break-keep">{theme.summary}</p>

              <div className="mb-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    문제
                  </h3>
                  <p className="text-slate-700 leading-relaxed break-keep">{theme.problem}</p>
                </div>
                <div className="rounded-xl border border-[#0891b2]/30 bg-[#0891b2]/5 p-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#0891b2]">
                    우리의 해결
                  </h3>
                  <p className="text-slate-700 leading-relaxed break-keep">{theme.solution}</p>
                </div>
              </div>

              {theme.metrics.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {theme.metrics.map((m) => (
                    <MetricCard key={m.label} value={m.value} label={m.label} caption={m.caption} />
                  ))}
                </div>
              )}

              {/* 연구 도표 자리 */}
              {theme.figures.length > 0 ? (
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {theme.figures.map((fig, fi) => (
                    <button
                      key={fig.src}
                      type="button"
                      onClick={() => setLightbox({ images: theme.figures, index: fi })}
                      className="overflow-hidden rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    >
                      <img
                        src={fig.src}
                        alt={fig.alt}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-8 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  <ImagePlus size={26} />
                  <span className="text-sm text-slate-500">연구 도표 준비 중</span>
                </div>
              )}
            </motion.div>
          </section>
        )
      })}

      {/* 원본 자료 다운로드 */}
      <section className="px-4 md:px-8 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="mb-4 text-slate-600 break-keep">발표 자료 원본을 내려받을 수 있습니다.</p>
          <a
            href="/research-deck.pdf"
            download
            className="inline-flex items-center gap-2 rounded-full bg-[#1e3a5f] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0891b2]"
          >
            <Download size={18} /> 발표자료 PDF 다운로드
          </a>
        </div>
      </section>

      <CtaSection title="이 연구, 함께 확장하고 싶다면" />
      <FooterSection />

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}
    </div>
  )
}

export default ResearchPage
```

- [ ] **Step 2: 라우트 추가 (`App.tsx`)**

`src/App.tsx` import 블록에 추가:

```tsx
import ResearchPage from './pages/ResearchPage'
```

`<Route path="/achievements" ... />` 아래에 추가:

```tsx
        <Route path="/research" element={<ResearchPage />} />
```

- [ ] **Step 3: 타입체크·린트 통과 확인**

Run: `npm run build && npm run lint`
Expected: exit 0.

- [ ] **Step 4: 육안 확인 (PC·모바일 폭)**

Run: `npm run dev`
`http://localhost:5173/research` 접속.
Expected: 표지 히어로 → 폭염/한파/홍수/가뭄 4개 블록(교차 배경). 폭염·한파·홍수는 지표 카드 3개 표시, 가뭄은 지표 카드 없이 "본문 확보 후" 자리표시자 문구. 각 블록에 "연구 도표 준비 중" 점선 프레임. PDF 다운로드 버튼(파일 없으면 404지만 렌더는 정상). 브라우저 창 폭을 모바일 크기로 줄이면 2단→1단, 지표 3열→1열로 리플로우. 콘솔 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ResearchPage.tsx src/App.tsx
git commit -m "feat: 수행 과제 홍보 페이지(/research) 추가"
```

---

## Task 7: 홈 진입점 링크

**Files:**
- Modify: `src/components/ProjectSection.tsx`

**Interfaces:**
- Consumes: 라우트 `/achievements`, `/research` (Task 5·6)
- Produces: (없음 — 마무리 배선)

- [ ] **Step 1: 진입 링크 추가**

`ProjectSection.tsx`에서 카드 그리드(`<div className="grid md:grid-cols-2 gap-6"> ... </div>`) **닫는 태그 바로 다음**, `</motion.div>` 앞에 두 페이지로 가는 링크 행을 추가한다. 파일 상단 import도 `Link`가 이미 있으므로 `ArrowRight`만 재사용한다(이미 import됨).

추가할 블록:

```tsx
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <Link
                        to="/research"
                        className="group flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-6 py-5 transition-colors hover:bg-white/10"
                    >
                        <span>
                            <span className="block font-bold text-white">수행 과제 홍보</span>
                            <span className="block text-sm text-blue-200">폭염·한파·홍수·가뭄 대응 연구 한눈에 보기</span>
                        </span>
                        <ArrowRight size={18} className="text-blue-200 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                        to="/achievements"
                        className="group flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-6 py-5 transition-colors hover:bg-white/10"
                    >
                        <span>
                            <span className="block font-bold text-white">연구 성과</span>
                            <span className="block text-sm text-blue-200">연구·교육·협력 활동의 기록</span>
                        </span>
                        <ArrowRight size={18} className="text-blue-200 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
```

- [ ] **Step 2: 타입체크·린트 통과 확인**

Run: `npm run build && npm run lint`
Expected: exit 0.

- [ ] **Step 3: 육안 확인**

Run: `npm run dev`
`http://localhost:5173/` 접속 → "주요 연구 과제" 섹션 하단에 두 링크 카드가 보이고, 각각 `/research`·`/achievements`로 이동하는지 확인.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectSection.tsx
git commit -m "feat: 홈에서 성과·홍보 페이지로 가는 진입 링크 추가"
```

---

## 자산 투입 안내 (구현 후, 사용자 작업)

코드는 자산이 없어도 정상 렌더(빈 상태·placeholder). 실제 콘텐츠는 다음을 채운다.

1. **성과 사진**: 원본을 webp로 최적화(예: `sips`/`cwebp` 또는 이미지 툴)해 `public/gallery/`에 넣고, `src/data/gallery.ts`의 `galleryItems`에 `{ src:'/gallery/파일.webp', alt, caption?, group? }` 추가. 그룹핑 원하면 `group`에 소제목 지정.
2. **앵커 지표**: `gallery.ts`의 `achievementStats`에 실제 값(과제 건수·협력기관·교육 인원 등) 입력.
3. **홍보 PDF**: PPT를 PDF로 내보내 `public/research-deck.pdf`로 저장(파일명 일치).
4. **연구 도표**: 각 테마의 `figures`에 `{ src:'/research/파일.webp', alt }` 추가(자동으로 라이트박스 연동).
5. **가뭄 본문**: 가뭄 슬라이드의 문제/해결/지표 문구를 확보해 `researchThemes.ts`의 `drought` 항목 자리표시자를 교체.

---

## Self-Review

**Spec coverage:**
- 성과 페이지(심플 그리드+라이트박스, 앵커 지표, CTA) → Task 2·4·5 ✅
- 홍보 페이지(반응형 HTML 재구성, 표지→4테마→PDF→CTA) → Task 1·6 ✅
- 공유 부품(PageHero·ImageGrid·Lightbox·MetricCard·CtaSection, 기존 Footer 재사용) → Task 3·4 ✅
- 신규 데이터 소스(gallery.ts·researchThemes.ts, projects.ts와 분리) → Task 1·2 ✅
- 라우팅(/achievements·/research, ScrollManager 자동 적용) → Task 5·6 ✅
- 진입점(관련 섹션 하단 링크) → Task 7 ✅
- 자산 처리(webp·PDF·figures·가뭄 텍스트) → 자산 투입 안내 + 코드의 빈 상태/placeholder 처리 ✅
- 반응형/디자인 규칙(네이비·시안·break-keep, 모바일 리플로우) → 전 컴포넌트 ✅
- 수동 그룹핑(배열 순서 기반) → `groupGalleryItems`(Task 2) + AchievementsPage 렌더 ✅

**Placeholder scan:** 구현 단계에 "TBD/TODO 구현" 없음. 데이터의 `TODO(content)` 주석은 사용자 확보 대기 콘텐츠(가뭄 본문·지표 값·사진)로, 코드는 그 부재를 정상 처리한다 — 계획 자리표시자가 아니다.

**Type consistency:** `GalleryItem`(src/alt/caption?/group?)·`GalleryGroup`·`LightboxImage`(src/alt/caption?)·`Metric`·`ResearchTheme`·`ResearchFigure` 시그니처가 정의 태스크와 소비 태스크에서 일치. `Lightbox` props(`images/index/onClose/onIndexChange`)를 Task 5·6에서 동일하게 사용. `ImageGrid`(`items/onOpen`) 일치. `PageHero`의 `stats` 형태(`{value,label}[]`)와 `achievementStats` 형태 일치.
