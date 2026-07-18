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
