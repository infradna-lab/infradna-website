import { describe, it, expect } from 'vitest'
import { toPublicEntry } from './types'
import type { Entry } from './types'

describe('toPublicEntry', () => {
  it('공개 필드만 남기고 email·consentAt은 제거한다', () => {
    const full: Entry = {
      id: 'x',
      name: '홍길동',
      affiliation: '인프라DNA',
      email: 'secret@example.com',
      message: '안녕하세요',
      consentAt: '2026-07-19T00:00:00.000Z',
      createdAt: '2026-07-19T01:00:00.000Z',
    }
    const pub = toPublicEntry(full)
    expect(pub).toEqual({
      id: 'x',
      name: '홍길동',
      affiliation: '인프라DNA',
      message: '안녕하세요',
      createdAt: '2026-07-19T01:00:00.000Z',
    })
    expect('email' in pub).toBe(false)
    expect('consentAt' in pub).toBe(false)
  })
})
