import { describe, it, expect } from 'vitest'
import { escapeCsvCell, toCsv } from './csv'

describe('escapeCsvCell', () => {
  it('평범한 값은 그대로', () => {
    expect(escapeCsvCell('홍길동')).toBe('홍길동')
  })

  it('콤마가 있으면 따옴표로 감싼다', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
  })

  it('내부 따옴표는 두 번으로 이스케이프하고 감싼다', () => {
    expect(escapeCsvCell('그는 "안녕"')).toBe('"그는 ""안녕"""')
  })

  it('줄바꿈이 있으면 따옴표로 감싼다', () => {
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"')
  })

  it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\t1', '\r1'])(
    '수식 시작 문자는 작은따옴표를 붙인다: %j',
    (v) => {
      // CR은 두 번째 가드(콤마·따옴표·개행)에도 걸려 전체가 큰따옴표로 추가 래핑된다.
      // CSV 파서가 그 바깥 따옴표를 벗기고 나면 실제 셀 값은 항상 작은따옴표로 시작한다.
      const out = escapeCsvCell(v)
      const unwrapped = out.startsWith('"') ? out.slice(1) : out
      expect(unwrapped.startsWith("'")).toBe(true)
    },
  )

  it('수식 문자 + 콤마는 접두 후 감싼다', () => {
    expect(escapeCsvCell('=1,2')).toBe('"\'=1,2"')
  })
})

describe('toCsv', () => {
  it('행을 CRLF로, 셀을 콤마로 결합한다', () => {
    const csv = toCsv([
      ['이름', '소속'],
      ['홍길동', '인프라DNA'],
    ])
    expect(csv).toBe('이름,소속\r\n홍길동,인프라DNA')
  })

  it('각 셀에 이스케이프를 적용한다', () => {
    expect(toCsv([['a,b', '=x']])).toBe('"a,b",\'=x')
  })
})
