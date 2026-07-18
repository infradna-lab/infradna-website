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
