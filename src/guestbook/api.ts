import type { ApiErrorCode, PublicEntry, SubmitResult } from './types'

/** 서버는 코드만 준다. 화면 문구는 여기서만 정의한다(서버 문자열을 그대로 렌더하지 않음). */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_KEY: '이 링크로는 글을 남길 수 없습니다. 부스의 QR 코드를 다시 스캔해 주세요.',
  INVALID_INPUT: '이름·소속·이메일·메시지를 모두 입력해 주세요.',
  INVALID_EMAIL: '이메일 주소 형식이 올바르지 않습니다.',
  PII_DETECTED: '이름·소속·메시지에는 전화번호나 이메일을 넣지 말아 주세요. 이메일은 이메일 칸에만 입력해 주세요.',
  CONSENT_REQUIRED: '개인정보 수집·이용에 동의해 주세요.',
  STORAGE_ERROR: '잠시 문제가 생겼습니다. 다시 시도해 주세요.',
  CONFIG_ERROR: '잠시 문제가 생겼습니다. 다시 시도해 주세요.',
  METHOD_NOT_ALLOWED: '잠시 문제가 생겼습니다. 다시 시도해 주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해 주세요.',
}

export class GuestbookError extends Error {
  // erasableSyntaxOnly: true 이므로 파라미터 프로퍼티를 쓸 수 없다.
  code: ApiErrorCode

  constructor(code: ApiErrorCode) {
    super(code)
    this.name = 'GuestbookError'
    this.code = code
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof GuestbookError) return ERROR_MESSAGES[error.code]
  return ERROR_MESSAGES.NETWORK_ERROR
}

/** 응답 본문을 JSON으로 읽는다. 파싱 실패 시 STORAGE_ERROR. */
async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new GuestbookError('STORAGE_ERROR')
  }
}

/** 응답 본문에서 에러 코드를 꺼낸다. 본문이 깨져 있으면 STORAGE_ERROR. */
async function toError(res: Response): Promise<GuestbookError> {
  try {
    const body = await parseJson<{ error?: string }>(res)
    if (body.error && body.error in ERROR_MESSAGES) {
      return new GuestbookError(body.error as ApiErrorCode)
    }
  } catch {
    // 파싱 실패 또는 알 수 없는 코드 — 아래 기본값으로.
  }
  return new GuestbookError('STORAGE_ERROR')
}

export async function fetchEntries(): Promise<PublicEntry[]> {
  let res: Response
  try {
    res = await fetch('/api/guestbook')
  } catch {
    throw new GuestbookError('NETWORK_ERROR')
  }
  if (!res.ok) throw await toError(res)

  const body = await parseJson<{ entries: PublicEntry[] }>(res)
  return body.entries
}

export async function postEntry(input: {
  key: string
  name: string
  affiliation: string
  email: string
  message: string
  consent: boolean
}): Promise<SubmitResult> {
  let res: Response
  try {
    res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new GuestbookError('NETWORK_ERROR')
  }
  if (!res.ok) throw await toError(res)

  return parseJson<SubmitResult>(res)
}
