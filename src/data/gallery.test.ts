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
