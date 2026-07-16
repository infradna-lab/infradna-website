import { describe, it, expect } from 'vitest'
import { validateEntry, DEFAULT_NICKNAME } from './validate'

describe('validateEntry', () => {
  it('정상 입력을 통과시킨다', () => {
    const result = validateEntry({ nickname: '방문객', message: '잘 봤습니다' })
    expect(result).toEqual({ ok: true, nickname: '방문객', message: '잘 봤습니다' })
  })

  it('닉네임이 비면 기본값으로 대체한다', () => {
    const result = validateEntry({ nickname: '   ', message: '안녕하세요' })
    expect(result).toEqual({ ok: true, nickname: DEFAULT_NICKNAME, message: '안녕하세요' })
  })

  it('앞뒤 공백을 제거한다', () => {
    const result = validateEntry({ nickname: ' 김 ', message: '  좋아요  ' })
    expect(result).toEqual({ ok: true, nickname: '김', message: '좋아요' })
  })

  it('빈 메시지를 거부한다', () => {
    expect(validateEntry({ message: '   ' })).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it('100자를 넘는 메시지를 거부한다', () => {
    expect(validateEntry({ message: 'ㄱ'.repeat(101) })).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it('정확히 100자는 통과시킨다', () => {
    const result = validateEntry({ message: 'ㄱ'.repeat(100) })
    expect(result.ok).toBe(true)
  })

  it('12자를 넘는 닉네임을 거부한다', () => {
    expect(validateEntry({ nickname: 'ㄱ'.repeat(13), message: '안녕' })).toEqual({
      ok: false,
      error: 'INVALID_INPUT',
    })
  })

  it.each([
    ['010-1234-5678', '하이픈 구분'],
    ['01012345678', '구분자 없음'],
    ['010 1234 5678', '공백 구분'],
    ['010.1234.5678', '점 구분'],
    ['연락 주세요 010-1234-5678 입니다', '문장 속'],
  ])('전화번호를 거부한다: %s (%s)', (message) => {
    expect(validateEntry({ message })).toEqual({ ok: false, error: 'PII_DETECTED' })
  })

  it.each([
    ['hong@example.com', '기본'],
    ['메일은 hong.gil-dong+test@sub.example.co.kr 입니다', '문장 속 복잡한 주소'],
  ])('이메일을 거부한다: %s (%s)', (message) => {
    expect(validateEntry({ message })).toEqual({ ok: false, error: 'PII_DETECTED' })
  })

  it('닉네임에 있는 개인정보도 거부한다', () => {
    expect(validateEntry({ nickname: 'hong@ex.com', message: '안녕' })).toEqual({
      ok: false,
      error: 'PII_DETECTED',
    })
  })

  it('연도처럼 전화번호가 아닌 숫자는 통과시킨다', () => {
    expect(validateEntry({ message: '2026년 학회 잘 봤습니다' }).ok).toBe(true)
  })

  it('길이 위반과 개인정보가 겹치면 길이 위반을 먼저 알린다', () => {
    const message = '010-1234-5678 ' + 'ㄱ'.repeat(100)
    expect(validateEntry({ message })).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })
})
