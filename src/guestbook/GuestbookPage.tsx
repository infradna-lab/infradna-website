import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { PublicEntry } from './types'
import { errorMessage, fetchEntries, postEntry } from './api'
import GuestbookForm from './GuestbookForm'
import GuestbookList from './GuestbookList'

function GuestbookPage() {
  const [searchParams] = useSearchParams()
  // ?k= 가 있을 때만 폼을 렌더한다. 이것은 경험 분기일 뿐 방어가 아니다(방어는 서버).
  const writeKey = searchParams.get('k')

  const [entries, setEntries] = useState<PublicEntry[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setEntries(await fetchEntries())
      setLoadError(null)
    } catch (error) {
      setLoadError(errorMessage(error))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = useCallback(
    async (input: {
      name: string
      affiliation: string
      email: string
      message: string
      consent: boolean
    }) => {
      // 새 시도가 시작되면 이전 실패의 잔상을 바로 지운다.
      setSubmitError(null)
      try {
        await postEntry({ ...input, key: writeKey ?? '' })
        await load()
      } catch (error) {
        setSubmitError(errorMessage(error))
        // 폼이 입력값을 유지할 수 있도록 다시 던진다
        throw error
      }
    },
    [writeKey, load],
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] px-4 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto max-w-xl"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">방명록</h1>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0891b2]">
            IAHR-APD2026 · SWGIC2026
          </p>
        </motion.div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        {writeKey && <GuestbookForm onSubmit={handleSubmit} submitError={submitError} />}

        {loadError && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-600 break-keep mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              다시 시도
            </button>
          </div>
        )}

        {!loadError && entries === null && (
          <p className="py-16 text-center text-slate-400">불러오는 중…</p>
        )}

        {!loadError && entries !== null && <GuestbookList entries={entries} />}
      </main>
    </div>
  )
}

export default GuestbookPage
