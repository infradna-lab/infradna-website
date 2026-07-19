/**
 * CSV 한 셀을 안전하게 인코딩한다.
 * - 수식 인젝션 방어: = + - @ 로 시작하면 앞에 작은따옴표를 붙인다.
 * - 특수문자(콤마·따옴표·줄바꿈)가 있으면 전체를 큰따옴표로 감싸고 내부 따옴표는 두 번 쓴다.
 */
export function escapeCsvCell(value: string): string {
  let v = value
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v
  if (/[",\n\r]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"'
  return v
}

/** 행 배열(각 행은 셀 문자열 배열)을 CSV 텍스트로 변환한다. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}
