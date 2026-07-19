import { describe, it, expect } from 'vitest'
import { validateEntry, normalizeEmail, isDuplicateEmail } from './validate'

const valid = {
  name: '홍길동',
  affiliation: '인프라재난관리진흥원',
  email: 'hong@example.com',
  message: '잘 봤습니다',
  consent: true,
}

describe('validateEntry', () => {
  it('정상 입력을 통과시키고 trim한다', () => {
    const result = validateEntry({
      name: ' 홍길동 ',
      affiliation: ' 인프라DNA ',
      email: ' hong@example.com ',
      message: '  좋아요  ',
      consent: true,
    })
    expect(result).toEqual({
      ok: true,
      name: '홍길동',
      affiliation: '인프라DNA',
      email: 'hong@example.com',
      message: '좋아요',
    })
  })

  it.each([
    ['name', { ...valid, name: '   ' }],
    ['affiliation', { ...valid, affiliation: '' }],
    ['email', { ...valid, email: '' }],
    ['message', { ...valid, message: '  ' }],
  ])('%s 가 비면 INVALID_INPUT', (_field, input) => {
    expect(validateEntry(input)).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it.each([
    ['name', { ...valid, name: 'ㄱ'.repeat(21) }],
    ['affiliation', { ...valid, affiliation: 'ㄱ'.repeat(41) }],
    ['email', { ...valid, email: 'a'.repeat(90) + '@example.com' }],
    ['message', { ...valid, message: 'ㄱ'.repeat(101) }],
  ])('%s 길이 상한 초과는 INVALID_INPUT', (_field, input) => {
    expect(validateEntry(input)).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it.each([
    ['plainstring', '골뱅이 없음'],
    ['no-domain@', '도메인 없음'],
    ['@example.com', '로컬파트 없음'],
    ['a@b', 'TLD 없음'],
    ['a b@example.com', '공백 포함'],
  ])('잘못된 이메일 형식은 INVALID_EMAIL: %s (%s)', (email) => {
    expect(validateEntry({ ...valid, email })).toEqual({ ok: false, error: 'INVALID_EMAIL' })
  })

  it.each([
    ['hong.gil-dong+test@sub.example.co.kr', '복잡한 유효 주소'],
    ['a@b.co', '최소 유효 주소'],
  ])('유효한 이메일은 통과: %s (%s)', (email) => {
    expect(validateEntry({ ...valid, email }).ok).toBe(true)
  })

  it.each([
    ['name', { ...valid, name: '홍길동 010-1234-5678' }],
    ['affiliation', { ...valid, affiliation: '문의 hong@ex.com' }],
    ['message', { ...valid, message: '연락 주세요 010-1234-5678' }],
  ])('공개 필드(%s)에 연락처가 있으면 PII_DETECTED', (_field, input) => {
    expect(validateEntry(input)).toEqual({ ok: false, error: 'PII_DETECTED' })
  })

  it('이메일 칸의 이메일은 PII로 막지 않는다', () => {
    expect(validateEntry(valid).ok).toBe(true)
  })

  it('동의하지 않으면 CONSENT_REQUIRED', () => {
    expect(validateEntry({ ...valid, consent: false })).toEqual({
      ok: false,
      error: 'CONSENT_REQUIRED',
    })
  })

  it('consent 미지정이면 CONSENT_REQUIRED', () => {
    const { consent: _omit, ...noConsent } = valid
    expect(validateEntry(noConsent)).toEqual({ ok: false, error: 'CONSENT_REQUIRED' })
  })

  it('길이 위반과 PII가 겹치면 길이 위반을 먼저 알린다', () => {
    const input = { ...valid, message: '010-1234-5678 ' + 'ㄱ'.repeat(100) }
    expect(validateEntry(input)).toEqual({ ok: false, error: 'INVALID_INPUT' })
  })

  it.each([
    ['2026년 학회 잘 봤습니다', '연도'],
    ['부스 010번에서 만나요', '짧은 숫자'],
    ['버전 1.0.5 업데이트', '버전 표기'],
  ])('전화번호가 아닌 숫자는 통과: %s (%s)', (message) => {
    expect(validateEntry({ ...valid, message }).ok).toBe(true)
  })
})

describe('normalizeEmail', () => {
  it('trim + 소문자로 정규화한다', () => {
    expect(normalizeEmail('  Hong@Example.COM ')).toBe('hong@example.com')
  })
})

describe('isDuplicateEmail', () => {
  const list = [{ email: 'a@example.com' }, { email: 'B@Example.com' }]

  it('대소문자·공백 무시하고 존재하면 true', () => {
    expect(isDuplicateEmail(list, 'A@EXAMPLE.COM')).toBe(true)
    expect(isDuplicateEmail(list, ' b@example.com ')).toBe(true)
  })

  it('없으면 false', () => {
    expect(isDuplicateEmail(list, 'new@example.com')).toBe(false)
  })

  it('빈 리스트면 false', () => {
    expect(isDuplicateEmail([], 'a@example.com')).toBe(false)
  })
})
