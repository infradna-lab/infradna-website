import { motion } from 'framer-motion'
import { Mail, Phone } from 'lucide-react'

interface CtaSectionProps {
  title?: string
  description?: string
}

function CtaSection({
  title = '함께할 파트너를 찾습니다',
  description = '기후재난 대응 연구·정책·교육 협력을 환영합니다. 편하게 문의해 주세요.',
}: CtaSectionProps) {
  return (
    <section className="bg-[#1e3a5f] text-white px-4 md:px-8 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold break-keep mb-4">{title}</h2>
        <p className="text-blue-100 break-keep mb-10 leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:disastermanager2025@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-[#0891b2] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0aa4c9]"
          >
            <Mail size={18} /> disastermanager2025@gmail.com
          </a>
          <a
            href="tel:032-256-2407"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
          >
            <Phone size={18} /> 032-256-2407
          </a>
        </div>
      </motion.div>
    </section>
  )
}

export default CtaSection
