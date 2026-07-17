/** 방명록 항목 1건. Redis에 JSON으로 저장되고 API가 그대로 반환한다. */
export type Entry = {
  id: string
  nickname: string
  message: string
  /** ISO 8601, 서버 생성 */
  createdAt: string
}

/** 서버가 반환하는 기계용 에러 코드. 한국어 문구 매핑은 클라이언트 책임. */
export type ApiErrorCode =
  | 'INVALID_KEY'
  | 'INVALID_INPUT'
  | 'PII_DETECTED'
  | 'STORAGE_ERROR'
  | 'CONFIG_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'NETWORK_ERROR'
