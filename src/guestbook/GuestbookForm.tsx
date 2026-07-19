import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  AFFILIATION_MAX,
  EMAIL_MAX,
  MESSAGE_MAX,
  NAME_MAX,
  validateEntry,
} from './validate'
import { errorMessage, GuestbookError } from './api'

type SubmitInput = {
  name: string
  affiliation: string
  email: string
  message: string
  consent: boolean
}

type Props = {
  onSubmit: (input: SubmitInput) => Promise<void>
  submitError: string | null
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:border-[#0891b2] focus:outline-none'

function GuestbookForm({ onSubmit, submitError }: Props) {
  const [name, setName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    // 즉각 피드백용. 실효적 방어는 서버 검증이다.
    const result = validateEntry({ name, affiliation, email, message, consent })
    if (!result.ok) {
      setLocalError(errorMessage(new GuestbookError(result.error)))
      return
    }
    setLocalError(null)
    setSubmitting(true)

    try {
      await onSubmit({ name, affiliation, email, message, consent })
      // 성공했을 때만 비운다
      setName('')
      setAffiliation('')
      setEmail('')
      setMessage('')
      setConsent(false)
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
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={NAME_MAX}
        placeholder="이름"
        className={`${inputClass} mb-2`}
      />
      <input
        type="text"
        value={affiliation}
        onChange={(e) => setAffiliation(e.target.value)}
        maxLength={AFFILIATION_MAX}
        placeholder="소속 (예: OO대학교 / OO연구원)"
        className={`${inputClass} mb-2`}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={EMAIL_MAX}
        placeholder="이메일 (공개되지 않습니다)"
        className={`${inputClass} mb-2`}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MESSAGE_MAX}
        rows={3}
        placeholder="부스에 남기고 싶은 말을 적어주세요"
        className={`${inputClass} resize-none break-keep`}
      />

      <div className="flex items-center justify-end mt-1 mb-3">
        <span className="text-xs text-slate-400 shrink-0">
          {message.length}/{MESSAGE_MAX}
        </span>
      </div>

      <label className="flex items-start gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 shrink-0 accent-[#0891b2]"
        />
        <span className="text-xs text-slate-600 break-keep leading-relaxed">
          <strong className="font-semibold text-slate-700">[필수] 개인정보 수집·이용 동의</strong>
          <br />
          수집 항목: 이름, 소속, 이메일 · 이용 목적: 행사 참가자 명부·네트워킹, 행사 후 연락 및 경품 추첨
          당첨자 연락 · 보유 기간: 행사 종료 후 일괄 파기. 동의를 거부할 수 있으며, 이 경우 방명록 참여가
          제한됩니다.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 break-keep mb-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !consent}
        className="w-full rounded-lg bg-[#0891b2] py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? '남기는 중…' : '남기기'}
      </button>
    </form>
  )
}

export default GuestbookForm
