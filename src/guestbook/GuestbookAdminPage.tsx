import { useState } from 'react'

type AdminEntry = {
  id: string
  name: string
  affiliation: string
  email: string
  message: string
  consentAt: string
  createdAt: string
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:border-[#0891b2] focus:outline-none'

function GuestbookAdminPage() {
  const [key, setKey] = useState('')
  const [entries, setEntries] = useState<AdminEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const authFetch = (url: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${key}` } })

  const errorFor = (status: number) =>
    status === 403 ? '비밀키가 올바르지 않습니다.' : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'

  const loadJson = async () => {
    if (!key) {
      setError('비밀키를 입력해 주세요.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await authFetch('/api/guestbook-export')
      if (!res.ok) {
        setError(errorFor(res.status))
        setEntries(null)
        return
      }
      const body = (await res.json()) as { entries: AdminEntry[] }
      setEntries(body.entries)
    } catch {
      setError('네트워크 연결을 확인해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  const downloadCsv = async () => {
    if (!key) {
      setError('비밀키를 입력해 주세요.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await authFetch('/api/guestbook-export?format=csv')
      if (!res.ok) {
        setError(errorFor(res.status))
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'guestbook.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('네트워크 연결을 확인해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">방명록 관리자</h1>
          <p className="text-sm text-[#0891b2]">수집된 명단 조회 · CSV 다운로드</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="관리자 비밀키"
            autoComplete="off"
            className={`${inputClass} mb-3`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadJson()}
              disabled={loading}
              className="rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '처리 중…' : '명단 조회'}
            </button>
            <button
              type="button"
              onClick={() => void downloadCsv()}
              disabled={loading}
              className="rounded-lg bg-[#0891b2] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              CSV 다운로드
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 break-keep mt-3">
              {error}
            </p>
          )}
        </div>

        {entries !== null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500 mb-3">총 {entries.length}건</p>
            {entries.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">아직 수집된 항목이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-200">
                      <th className="py-2 pr-3 font-medium">이름</th>
                      <th className="py-2 pr-3 font-medium">소속</th>
                      <th className="py-2 pr-3 font-medium">이메일</th>
                      <th className="py-2 pr-3 font-medium">메시지</th>
                      <th className="py-2 font-medium">작성시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-3 break-keep">{e.name}</td>
                        <td className="py-2 pr-3 break-keep">{e.affiliation}</td>
                        <td className="py-2 pr-3 break-all">{e.email}</td>
                        <td className="py-2 pr-3 break-keep whitespace-pre-wrap">{e.message}</td>
                        <td className="py-2 text-slate-400 whitespace-nowrap">{e.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default GuestbookAdminPage
