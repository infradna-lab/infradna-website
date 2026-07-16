import { motion } from 'framer-motion'
import type { Entry } from './types'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`
}

function GuestbookList({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-slate-500 py-16 break-keep">
        아직 남겨진 메시지가 없습니다.
        <br />
        첫 번째 메시지를 남겨보세요.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry, index) => (
        <motion.li
          key={entry.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            // 목록이 길어도 마지막 항목이 0.4초 안에는 나타나게 상한을 둔다
            delay: Math.min(index * 0.04, 0.4),
            ease: 'easeOut',
          }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="font-semibold text-[#1e3a5f] text-sm break-keep">{entry.nickname}</span>
            <span className="text-xs text-slate-400 shrink-0">{formatTime(entry.createdAt)}</span>
          </div>
          <p className="text-slate-700 break-keep whitespace-pre-wrap leading-relaxed">
            {entry.message}
          </p>
        </motion.li>
      ))}
    </ul>
  )
}

export default GuestbookList
