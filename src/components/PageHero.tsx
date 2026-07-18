import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  stats?: { value: string; label: string }[]
  backTo?: string
  backLabel?: string
}

function PageHero({ eyebrow, title, subtitle, stats, backTo, backLabel }: PageHeroProps) {
  return (
    <section className="bg-[#1e3a5f] text-white px-4 md:px-8 pt-10 pb-16 md:pt-14 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-5xl mx-auto"
      >
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center text-blue-200 hover:text-white transition-colors mb-10 text-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> {backLabel ?? '홈으로'}
          </Link>
        )}

        {eyebrow && (
          <p className="mb-4 font-mono text-sm uppercase tracking-widest text-[#38bdf8]">{eyebrow}</p>
        )}
        <h1 className="text-3xl md:text-5xl font-bold leading-snug break-keep mb-6 max-w-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-blue-100 leading-relaxed break-keep max-w-3xl">
            {subtitle}
          </p>
        )}

        {stats && stats.length > 0 && (
          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 max-w-3xl">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-[#0891b2] pl-4">
                <dt className="text-2xl md:text-3xl font-bold text-white">{s.value}</dt>
                <dd className="mt-1 text-sm text-blue-200 break-keep">{s.label}</dd>
              </div>
            ))}
          </dl>
        )}
      </motion.div>
    </section>
  )
}

export default PageHero
