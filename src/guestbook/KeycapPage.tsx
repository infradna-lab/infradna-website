import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

type KeycapStatus = 'claimed' | 'already_claimed'
type KeycapState = { status?: KeycapStatus }

function KeycapImage() {
  const [ok, setOk] = useState(true)
  if (!ok) {
    return (
      <div className="mx-auto mb-6 flex aspect-square w-48 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-sm text-slate-400">
        키캡 이미지
      </div>
    )
  }
  return (
    <img
      src="/keycap.png"
      alt="키캡"
      onError={() => setOk(false)}
      className="mx-auto mb-6 w-48 max-w-full rounded-2xl"
    />
  )
}

function KeycapPage() {
  const state = (useLocation().state ?? {}) as KeycapState
  const status = state.status

  const claimed = status === 'claimed'
  const alreadyClaimed = status === 'already_claimed'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        {claimed && (
          <>
            <KeycapImage />
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2 break-keep">
              안내 데스크에서 키캡을 수령하세요
            </h1>
            <p className="text-slate-500 break-keep">이 화면을 안내 데스크 직원에게 보여주세요.</p>
          </>
        )}

        {alreadyClaimed && (
          <>
            <div className="mx-auto mb-6 flex aspect-square w-48 items-center justify-center rounded-2xl bg-slate-100 text-5xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2 break-keep">
              키캡을 이미 수령하셨습니다
            </h1>
            <p className="text-slate-500 break-keep">
              이 이메일로는 이미 방명록을 작성해 주셨습니다. 감사합니다!
            </p>
          </>
        )}

        {!claimed && !alreadyClaimed && (
          <>
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2 break-keep">키캡 수령 안내</h1>
            <p className="text-slate-500 break-keep mb-6">
              방명록을 작성하시면 키캡 수령 안내가 표시됩니다.
            </p>
            <Link
              to="/guestbook"
              className="inline-block rounded-lg bg-[#0891b2] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              방명록으로 가기
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default KeycapPage
