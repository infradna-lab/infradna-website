import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface LightboxImage {
  src: string
  alt: string
  caption?: string
}

interface LightboxProps {
  images: LightboxImage[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const count = images.length
  const current = images[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count)
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, count, onClose, onIndexChange])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
      >
        <X size={28} />
      </button>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onIndexChange((index - 1 + count) % count)
          }}
          aria-label="이전 이미지"
          className="absolute left-2 md:left-6 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      <figure className="max-h-[85vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[80vh] w-auto rounded-lg object-contain"
        />
        {current.caption && (
          <figcaption className="mt-4 text-center text-sm text-white/70 break-keep">
            {current.caption}
          </figcaption>
        )}
      </figure>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onIndexChange((index + 1) % count)
          }}
          aria-label="다음 이미지"
          className="absolute right-2 md:right-6 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ChevronRight size={36} />
        </button>
      )}
    </div>
  )
}

export default Lightbox
