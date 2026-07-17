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
    ['070-1234-5678', '070 인터넷전화'],
    ['02-1234-5678', '서울 지역번호(2자리)'],
    ['031-123-4567', '경기 지역번호(3자리+3자리)'],
    ['032-256-2407', '인천 지역번호 실제 형식'],
    ['021234567', '유선전화, 구분자 없음'],
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

  it.each([
    ['2026년 학회 잘 봤습니다', '연도'],
    ['학회 날짜는 2026-07-16 입니다', '하이픈으로 구분된 날짜'],
    ['실험 결과가 0.5초 단축되었습니다', '소수점 숫자'],
    ['오전 08:30에 뵙겠습니다', '콜론으로 구분된 시각'],
    ['010번 부스에서 만나요', '부스 번호처럼 짧은 숫자'],
    ['우편번호는 06134 입니다', '5자리 우편번호'],
    ['버전 1.0.5 로 업데이트했습니다', '버전 표기'],
  ])('전화번호가 아닌 숫자는 통과시킨다: %s (%s)', (message) => {
    expect(validateEntry({ message }).ok).toBe(true)
  })

  it('길이 위반과 개인정보가 겹치면 길이 위반을 먼저 알린다', () => {
    const message = '010-1234-5678 ' + 'ㄱ'.repeat(100)
    expect(validateEntry({ message })).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })
})
