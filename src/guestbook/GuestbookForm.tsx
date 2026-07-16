import { useState } from 'react'
import type { FormEvent } from 'react'
import { DEFAULT_NICKNAME, MESSAGE_MAX, NICKNAME_MAX, validateEntry } from './validate'
import { errorMessage, GuestbookError } from './api'

type Props = {
  onSubmit: (input: { nickname: string; message: string }) => Promise<void>
  submitError: string | null
}

function GuestbookForm({ onSubmit, submitError }: Props) {
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    // 즉각 피드백용. 실효적 방어는 서버 검증이다.
    const result = validateEntry({ nickname, message })
    if (!result.ok) {
      setLocalError(errorMessage(new GuestbookError(result.error)))
      return
    }
    setLocalError(null)
    setSubmitting(true)

    try {
      await onSubmit({ nickname, message })
      // 성공했을 때만 비운다
      setNickname('')
      setMessage('')
    } catch {
      // 문구는 부모가 submitError로 내려준다. 입력값은 그대로 둔다.
    } finally {
      setSubmitting(false)
    }
  }

  const error = localError ?? submitError

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 mb-8">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={NICKNAME_MAX}
        placeholder={`닉네임 (선택, 비우면 '${DEFAULT_NICKNAME}')`}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:border-[#0891b2] focus:outline-none mb-2"
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MESSAGE_MAX}
        rows={3}
        placeholder="부스에 남기고 싶은 말을 적어주세요"
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:border-[#0891b2] focus:outline-none break-keep"
      />

      <div className="flex items-center justify-between gap-3 mt-1 mb-3">
        <p className="text-xs text-slate-400 break-keep">전화번호·이메일은 남기지 말아주세요.</p>
        <span className="text-xs text-slate-400 shrink-0">
          {message.length}/{MESSAGE_MAX}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 break-keep mb-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#0891b2] py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? '남기는 중…' : '남기기'}
      </button>
    </form>
  )
}

export default GuestbookForm
