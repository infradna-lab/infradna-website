import type { ApiErrorCode, Entry } from './types'

/** 서버는 코드만 준다. 화면 문구는 여기서만 정의한다(서버 문자열을 그대로 렌더하지 않음). */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_KEY: '이 링크로는 글을 남길 수 없습니다. 부스의 QR 코드를 다시 스캔해 주세요.',
  INVALID_INPUT: '메시지를 1자 이상 100자 이하로 입력해 주세요.',
  PII_DETECTED: '전화번호나 이메일은 남길 수 없습니다. 연락처를 빼고 다시 시도해 주세요.',
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

/** 응답 본문을 JSON으로 읽는다. 파싱에 실패하면(예: 2xx인데 HTML 본문 등) STORAGE_ERROR로 처리. */
async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new GuestbookError('STORAGE_ERROR')
  }
}

/** 응답 본문에서 에러 코드를 꺼낸다. 본문이 깨져 있으면 STORAGE_ERROR로 처리. */
async function toError(res: Response): Promise<GuestbookError> {
  try {
    const body = await parseJson<{ error?: string }>(res)
    if (body.error && body.error in ERROR_MESSAGES) {
      return new GuestbookError(body.error as ApiErrorCode)
    }
  } catch {
    // 본문 파싱 실패, 또는 알 수 없는 에러 코드 — 아래 기본값으로 떨어진다
  }
  return new GuestbookError('STORAGE_ERROR')
}

export async function fetchEntries(): Promise<Entry[]> {
  let res: Response
  try {
    res = await fetch('/api/guestbook')
  } catch {
    throw new GuestbookError('NETWORK_ERROR')
  }
  if (!res.ok) throw await toError(res)

  const body = await parseJson<{ entries: Entry[] }>(res)
  return body.entries
}

export async function postEntry(input: {
  key: string
  nickname: string
  message: string
}): Promise<Entry> {
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

  const body = await parseJson<{ entry: Entry }>(res)
  return body.entry
}
