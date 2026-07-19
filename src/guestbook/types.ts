/** 방명록 항목 1건 전체. Redis에 JSON으로 저장된다(이메일·동의시각은 관리자만). */
export type Entry = {
  id: string
  name: string          // 이름 (공개)
  affiliation: string   // 소속 (공개)
  email: string         // 이메일 (비공개)
  message: string       // 메시지 (공개)
  /** 동의 시각 ISO 8601 — 동의 증빙 */
  consentAt: string
  /** ISO 8601, 서버 생성 */
  createdAt: string
}

/** 공개 목록/응답 전용 투영. 이메일·동의시각을 포함하지 않는다. */
export type PublicEntry = Pick<Entry, 'id' | 'name' | 'affiliation' | 'message' | 'createdAt'>

/** 서버가 반환하는 기계용 에러 코드. 한국어 문구 매핑은 클라이언트 책임. */
export type ApiErrorCode =
  | 'INVALID_KEY'
  | 'INVALID_INPUT'
  | 'INVALID_EMAIL'
  | 'PII_DETECTED'
  | 'CONSENT_REQUIRED'
  | 'STORAGE_ERROR'
  | 'CONFIG_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'NETWORK_ERROR'

/** 저장 항목을 공개 응답 형태로 투영한다. email·consentAt은 절대 포함되지 않는다. */
export function toPublicEntry(e: Entry): PublicEntry {
  return {
    id: e.id,
    name: e.name,
    affiliation: e.affiliation,
    message: e.message,
    createdAt: e.createdAt,
  }
}
