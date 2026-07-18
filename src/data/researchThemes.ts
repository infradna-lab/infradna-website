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
  /** 연구 도표 (선택). 비어 있으면 placeholder 렌더. */
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
    eyebrowEN: 'URBAN THERMAL ENVIRONMENT',
    disaster: '폭염',
    title: 'Landsat 위성영상 분석과 공간통계로 찾아낸 폭염 취약지역·대응 우선지역',
    summary: '도시 열섬을 잡는 실측 기반 폭염 대응',
    problem:
      '기후변화·도시화로 열섬현상과 폭염이 심화되지만, 도시 내부 어느 지역이 더 취약한지 공간적으로 정량화하고 대응 정책을 뒷받침할 근거가 부족합니다.',
    solution:
      'Landsat 8 위성 지표면온도(LST)와 공간통계기법(Local Moran’s I, Getis-Ord Gi*)을 통합 적용해 행정동 단위 폭염 핫스팟을 식별하고, 취약계층 밀집지역과의 공간 중첩 분석으로 폭염 대응 우선지역을 도출했습니다.',
    metrics: [
      {
        value: '대응 우선지역 도출 알고리즘',
        label: '폭염 대응 우선지역 도출',
        caption: '블루·그린·그레이 인프라 기반 도시 폭염 대응 조치 제안 의사결정 지원 알고리즘 개발',
      },
      {
        value: '국내외 특허 출원',
        label: '폭염 취약지역 연구 특허 발명자 참여',
        caption: '도시 열섬에 따른 폭염 취약성과 취약계층 분포 공간관계 분석 기술 관련 국내·미국 특허 발명자 참여',
      },
      {
        value: '의사결정 지원 서비스',
        label: '폭염 대응 솔루션 서비스 개발',
        caption: '폭염 발생 시 취약 지역 파악·우선 대응순위·대응책 제시 의사결정 지원 서비스 개발',
      },
    ],
    figures: [
      { src: '/research/heat-1.png', alt: '폭염 쉼터 분포도 및 취약성 지표 분석' },
      { src: '/research/heat-2.png', alt: '과천시 폭염 대응 의사결정 지원 시스템' },
    ],
  },
  {
    id: 'coldwave',
    eyebrowEN: 'CLIMATE VULNERABILITY INDEX',
    disaster: '한파',
    title: '기후취약성 지수로 진단하는 한파 취약성',
    summary: '노출·민감도·적응력으로 읽는 한파 취약성',
    problem:
      '한파 대응이 기상특보 중심에 머물러 있어, 세부 지역 단위의 한파 노출도·민감도·적응능력 차이를 공간적으로 반영한 정책 결정 수단이 필요합니다.',
    solution:
      '과학적 근거 기반 정책결정으로 불확실성을 낮추고 자원의 효율적 분배를 위한 사회·경제적 합의를 돕도록, 취약계층·취약분야·취약지역 중심의 관리대책 우선순위를 제시하는 기후취약성 지수를 개발·적용했습니다.',
    metrics: [
      {
        value: 'LightGBM AI 예측 모델',
        label: '격자형 한파 영향 분포 예측',
        caption: 'LightGBM 기반 실시간 30m 격자형 지역 한파 기간 상세 열 분포 지도 생성',
      },
      {
        value: '정책 결정 과학적 근거',
        label: '한파 도시 기후영향평가',
        caption:
          '한파노출(최저기온)·민감도(한랭질환 사망·입원, 고령자비율)·적응능력(GRDP, 의료인력·기관 수) 기반 정량 분석',
      },
      {
        value: '지역별 대응 우선순위',
        label: '취약계층·분야·지역 공간분석',
        caption: '주요 취약인자를 파악해 취약계층·취약분야·취약지역 중심 관리대책 우선순위를 공간적으로 도출',
      },
    ],
    figures: [],
  },
  {
    id: 'flood',
    eyebrowEN: 'IoT SENSOR DATA QUALITY',
    disaster: '홍수·침수',
    title: '모니터링과 데이터 품질관리를 통한 실시간 홍수·침수 감지',
    summary: '센서 오류에도 흔들리지 않는 실시간 침수 감지',
    problem:
      '기후변화로 도시침수가 증가하고 있지만 침수 사각지대를 신속하게 파악하기 어렵고, IoT 센서 데이터의 오류로 실시간 관측정보의 신뢰성이 저하될 수 있습니다.',
    solution:
      'IoT 실시간 계측 센서와 CCTV 영상 데이터를 결합한 새로운 도시침수 상황감시 기술과, 센서 데이터의 이상치를 탐지·보정하는 AI 기반 품질관리 기술을 개발해 침수 정보의 신뢰성과 신속한 상황 인지·대응을 지원합니다.',
    metrics: [
      {
        value: '관로수위계·도로침수계',
        label: '스마트 도시침수 계측센서',
        caption: '현장 실증을 통한 도시침수 실시간 모니터링',
      },
      {
        value: 'AI 하이브리드 품질관리',
        label: '딥러닝 이상치 탐지·보정',
        caption: 'IoT 센서 데이터(하수관로 수위·도로침수심) 대상 딥러닝 기반 이상치 탐지·보정',
      },
      {
        value: 'IoT + CCTV 결합',
        label: '도시침수 상황감시',
        caption: '계측 센서와 CCTV 영상 데이터를 결합한 새로운 도시침수 상황감시 기술',
      },
    ],
    figures: [
      { src: '/research/flood-1.png', alt: '스마트 도시침수 계측센서(관로수위계·도로침수계)' },
      { src: '/research/flood-2.png', alt: 'AI 기반 하이브리드 품질관리 모델' },
    ],
  },
  {
    id: 'drought',
    eyebrowEN: 'MULTI-SECTOR DROUGHT RESPONSE INDEX',
    disaster: '가뭄',
    title: '물공급을 넘어, 5개 분야로 읽는 가뭄의 실제 영향',
    summary: '5개 분야로 읽는 가뭄의 실제 영향',
    problem:
      '가뭄은 물공급뿐 아니라 농업·에너지·물가·산불 등 여러 분야에 걸쳐 영향을 미치지만, 기존 가뭄정보는 계측 중심의 정형 데이터나 연간 통계에 그쳐 분야별·지역별 체감 피해를 실시간으로 파악하기 어렵습니다.',
    solution:
      '정형 데이터(기상·수자원·생산량)와 비정형 데이터(8개 분야 가뭄 뉴스)를 결합해 5개 분야 가뭄반응지표를 개발하고, 시군구 단위로 공간화했습니다.',
    metrics: [
      {
        value: '농산물 도매가격',
        label: '노지작물 가격·생산량 예측',
        caption: '배추·무·마늘·양파·고추 등 · 일 단위 · 시군구',
      },
      {
        value: '수력발전량',
        label: '다목적댐 발전량 변동 예측',
        caption: '소양강·충주·대청·합천 · 월 단위',
      },
      {
        value: '신선물가지수',
        label: '신선채소·신선과실 물가',
        caption: '물가지수를 가뭄 단계와 매칭 · 월 단위',
      },
      {
        value: '산불위험',
        label: '산불위험지수 변화',
        caption: '토양·식생 건조화에 따른 산불위험지수 변화 · 일 단위',
      },
      {
        value: '뉴스 기반 피해분석',
        label: '8개 분야 기사 감정분석',
        caption: '기사 수집·분류·감정분석 · 일 단위 · 시군구',
      },
    ],
    figures: [
      { src: '/research/drought-1.jpg', alt: '가뭄 감시 — 농업 토양수분·농산물 도매가격 영향 분석' },
      { src: '/research/drought-2.jpg', alt: '가뭄 분야별 영향 분석 대시보드' },
      { src: '/research/drought-3.jpg', alt: '신선물가지수 영향 분석' },
      { src: '/research/drought-4.jpg', alt: '가뭄 분야별 영향 분석 대시보드' },
      { src: '/research/drought-5.jpg', alt: '뉴스 기반 지역별·분야별 가뭄피해 영향 분석' },
    ],
  },
]
