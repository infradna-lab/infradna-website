import { useState } from 'react'
import { motion } from 'framer-motion'
import { Thermometer, Snowflake, Waves, Droplets, Download, ImagePlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHero from '../components/PageHero'
import MetricCard from '../components/MetricCard'
import Lightbox, { type LightboxImage } from '../components/Lightbox'
import FooterSection from '../components/FooterSection'
import { researchThemes, researchIntro } from '../data/researchThemes'

const THEME_ICON: Record<string, LucideIcon> = {
  heatwave: Thermometer,
  coldwave: Snowflake,
  flood: Waves,
  drought: Droplets,
}

function ResearchPage() {
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="CLIMATE DISASTER RESPONSE RESEARCH"
        title={researchIntro.title}
        subtitle={researchIntro.subtitle}
        backTo="/"
        backLabel="홈으로"
      />

      {researchThemes.map((theme, ti) => {
        const Icon = THEME_ICON[theme.id] ?? ImagePlus
        const shaded = ti % 2 === 1
        return (
          <section
            key={theme.id}
            className={`px-4 md:px-8 py-16 md:py-24 ${shaded ? 'bg-slate-50' : 'bg-white'}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-5xl mx-auto"
            >
              <div className="mb-8 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
                  <Icon size={22} />
                </span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-[#0891b2]">
                    {theme.eyebrowEN} · {theme.disaster}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] break-keep">
                    {theme.title}
                  </h2>
                </div>
              </div>

              <p className="mb-10 text-lg text-slate-600 break-keep">{theme.summary}</p>

              <div className="mb-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    문제
                  </h3>
                  <p className="text-slate-700 leading-relaxed break-keep">{theme.problem}</p>
                </div>
                <div className="rounded-xl border border-[#0891b2]/30 bg-[#0891b2]/5 p-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#0891b2]">
                    우리의 해결
                  </h3>
                  <p className="text-slate-700 leading-relaxed break-keep">{theme.solution}</p>
                </div>
              </div>

              {theme.metrics.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {theme.metrics.map((m) => (
                    <MetricCard key={m.label} value={m.value} label={m.label} caption={m.caption} />
                  ))}
                </div>
              )}

              {/* 연구 도표 (있는 테마만 표시) */}
              {theme.figures.length > 0 && (
                <div className="mt-8 grid items-start gap-4 sm:grid-cols-2">
                  {theme.figures.map((fig, fi) => (
                    <button
                      key={fig.src}
                      type="button"
                      onClick={() => setLightbox({ images: theme.figures, index: fi })}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    >
                      <img src={fig.src} alt={fig.alt} loading="lazy" className="h-auto w-full" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </section>
        )
      })}

      {/* 원본 자료 다운로드 */}
      <section className="px-4 md:px-8 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="mb-4 text-slate-600 break-keep">연구 자료 원본을 내려받을 수 있습니다.</p>
          <a
            href="/research-deck.pdf"
            download="인프라재난관리진흥원_기후재난대응연구.pdf"
            className="inline-flex items-center gap-2 rounded-full bg-[#1e3a5f] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0891b2]"
          >
            <Download size={18} />PDF 다운로드
          </a>
        </div>
      </section>

      <FooterSection />

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}
    </div>
  )
}

export default ResearchPage