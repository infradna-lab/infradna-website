export const NAME_MAX = 20
export const AFFILIATION_MAX = 40
export const EMAIL_MAX = 100
export const MESSAGE_MAX = 100

/**
 * 공개되는 이름·소속·메시지에 사용자가 적어 넣는 연락처를 걸러낸다.
 * 이메일은 전용 칸으로 받으므로 이 검사 대상에서 제외한다.
 */
const PHONE = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/
const EMAIL_IN_TEXT = /[\w.+-]+@[\w-]+\.[\w.]+/
/** 이메일 칸 형식 검증 — 문자열 전체가 하나의 주소여야 한다(앵커). */
const EMAIL_FORMAT = /^[\w.+-]+@[\w-]+\.[\w.]+$/

export type ValidationInput = {
  name?: string
  affiliation?: string
  email?: string
  message?: string
  consent?: boolean
}

export type ValidationError =
  | 'INVALID_INPUT'
  | 'INVALID_EMAIL'
  | 'PII_DETECTED'
  | 'CONSENT_REQUIRED'

export type ValidationResult =
  | { ok: true; name: string; affiliation: string; email: string; message: string }
  | { ok: false; error: ValidationError }

export function validateEntry(input: ValidationInput): ValidationResult {
  const name = (input.name ?? '').trim()
  const affiliation = (input.affiliation ?? '').trim()
  const email = (input.email ?? '').trim()
  const message = (input.message ?? '').trim()

  // 1) 필수 + 길이
  if (
    name.length === 0 || name.length > NAME_MAX ||
    affiliation.length === 0 || affiliation.length > AFFILIATION_MAX ||
    email.length === 0 || email.length > EMAIL_MAX ||
    message.length === 0 || message.length > MESSAGE_MAX
  ) {
    return { ok: false, error: 'INVALID_INPUT' }
  }

  // 2) 이메일 형식
  if (!EMAIL_FORMAT.test(email)) {
    return { ok: false, error: 'INVALID_EMAIL' }
  }

  // 3) 공개 필드의 연락처 차단 (이메일 칸 제외)
  const hasContact = (t: string) => PHONE.test(t) || EMAIL_IN_TEXT.test(t)
  if (hasContact(name) || hasContact(affiliation) || hasContact(message)) {
    return { ok: false, error: 'PII_DETECTED' }
  }

  // 4) 동의
  if (input.consent !== true) {
    return { ok: false, error: 'CONSENT_REQUIRED' }
  }

  return { ok: true, name, affiliation, email, message }
}
