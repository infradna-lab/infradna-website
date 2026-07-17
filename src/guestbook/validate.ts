export const NICKNAME_MAX = 12
export const MESSAGE_MAX = 100
export const DEFAULT_NICKNAME = '익명 방문자'

/**
 * 방문객이 스스로 적어 넣는 연락처를 걸러낸다.
 * 휴대전화(010~019)뿐 아니라 070 인터넷전화, 지역번호 유선전화(02, 031, 032 등)까지
 * "0으로 시작하는 8~11자리 번호" 형태로 폭넓게 잡아낸다. 국제 표기(+82, +1 등)는 범위 밖이다.
 * 앞자리 0을 필수로 요구해 2026 같은 연도 표기가 오탐되지 않도록 한다.
 * 의도적 한계: "공대 김씨"처럼 패턴에 걸리지 않는 자기 식별은 통과한다.
 * 실질 위험(연락처가 공개 페이지에 박제되는 것)만 차단하는 것이 목표다.
 */
const PHONE = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/

export type ValidationResult =
  | { ok: true; nickname: string; message: string }
  | { ok: false; error: 'INVALID_INPUT' | 'PII_DETECTED' }

export function validateEntry(input: { nickname?: string; message?: string }): ValidationResult {
  const nickname = (input.nickname ?? '').trim()
  const message = (input.message ?? '').trim()

  if (message.length === 0 || message.length > MESSAGE_MAX) {
    return { ok: false, error: 'INVALID_INPUT' }
  }
  if (nickname.length > NICKNAME_MAX) {
    return { ok: false, error: 'INVALID_INPUT' }
  }

  const containsPii = (text: string) => PHONE.test(text) || EMAIL.test(text)
  if (containsPii(message) || containsPii(nickname)) {
    return { ok: false, error: 'PII_DETECTED' }
  }

  return { ok: true, nickname: nickname || DEFAULT_NICKNAME, message }
}
