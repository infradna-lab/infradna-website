import { useState } from 'react'
import { motion } from 'framer-motion'
import { ImageOff } from 'lucide-react'
import PageHero from '../components/PageHero'
import CtaSection from '../components/CtaSection'
import ImageGrid from '../components/ImageGrid'
import Lightbox from '../components/Lightbox'
import FooterSection from '../components/FooterSection'
import {
  galleryItems,
  achievementStats,
  achievementIntro,
  groupGalleryItems,
} from '../data/gallery'

function AchievementsPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const groups = groupGalleryItems(galleryItems)

  // 그룹별 시작 오프셋을 미리 계산해 전역 인덱스를 구한다.
  let offset = 0
  const groupsWithOffset = groups.map((g) => {
    const base = offset
    offset += g.items.length
    return { ...g, base }
  })

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        title={achievementIntro.title}
        subtitle={achievementIntro.subtitle}
        stats={achievementStats}
        backTo="/"
        backLabel="홈으로"
      />

      <section className="px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {galleryItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-24 text-slate-400">
              <ImageOff size={32} />
              <p className="text-sm text-slate-500 break-keep">성과 사진을 준비 중입니다.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {groupsWithOffset.map((g, gi) => (
                <motion.div
                  key={g.group ?? `group-${gi}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {g.group && (
                    <h2 className="mb-6 text-2xl font-bold text-[#1e3a5f] break-keep">{g.group}</h2>
                  )}
                  <ImageGrid items={g.items} onOpen={(local) => setLightboxIndex(g.base + local)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaSection />
      <FooterSection />

      {lightboxIndex !== null && (
        <Lightbox
          images={galleryItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  )
}

export default AchievementsPage
