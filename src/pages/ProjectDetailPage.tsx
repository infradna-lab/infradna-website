import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Target,
  ListChecks,
  Sparkles,
  Building2,
  Landmark,
  CalendarDays,
  ImagePlus,
  Workflow,
  Images,
  Award,
} from 'lucide-react'
import { projects, type MediaItem } from '../data/projects'
import FooterSection from '../components/FooterSection'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1e3a5f]">
          <Icon size={18} />
        </span>
        <h2 className="text-2xl font-bold text-[#1e3a5f]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

/**
 * 이미지 자리. media.src 가 있으면 이미지를, 없으면 점선 placeholder 를 렌더한다.
 */
function MediaFrame({
  media,
  label,
  hint = '이미지 준비 중',
  aspect = 'aspect-[16/9]',
  icon: Icon = ImagePlus,
  natural = false,
}: {
  media?: MediaItem
  label: string
  hint?: string
  aspect?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  /** true 면 고정 비율/크롭 없이 이미지 원본 비율 그대로 표시 */
  natural?: boolean
}) {
  const caption = media?.caption
  return (
    <figure>
      {media?.src ? (
        <img
          src={media.src}
          alt={caption ?? label}
          className={
            natural
              ? 'w-full h-auto rounded-xl border border-slate-200'
              : `w-full ${aspect} rounded-xl border border-slate-200 object-cover`
          }
        />
      ) : (
        <div
          className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400`}
        >
          <Icon size={26} />
          <span className="text-sm font-medium text-slate-500">{label}</span>
          <span className="text-xs text-slate-400">{hint}</span>
        </div>
      )}
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-slate-500 break-keep">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

function ProjectDetailPage() {
  const { id } = useParams()
  const index = projects.findIndex((p) => p.id === Number(id))
  const project = index >= 0 ? projects[index] : undefined

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <p className="text-6xl font-bold text-[#1e3a5f] mb-4">404</p>
        <p className="text-slate-600 mb-8 break-keep">요청하신 연구 과제를 찾을 수 없습니다.</p>
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 rounded-full bg-[#1e3a5f] px-6 py-3 text-white hover:bg-[#0891b2] transition-colors"
        >
          <ArrowLeft size={16} /> 주요 연구 과제로 돌아가기
        </Link>
      </div>
    )
  }

  const prev = index > 0 ? projects[index - 1] : null
  const next = index < projects.length - 1 ? projects[index + 1] : null

  // 성과 이미지: 데이터가 있으면 사용, 없으면 자리 3칸을 보여준다.
  const gallery: (MediaItem | undefined)[] =
    project.media?.gallery && project.media.gallery.length > 0
      ? project.media.gallery
      : [undefined, undefined, undefined]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#1e3a5f] text-white px-4 md:px-8 pt-10 pb-16 md:pt-14 md:pb-24">
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-5xl mx-auto"
        >
          <Link
            to="/#projects"
            className="inline-flex items-center text-blue-200 hover:text-white transition-colors mb-10 text-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> 주요 연구 과제로 돌아가기
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="inline-block rounded-full bg-[#0891b2] px-3 py-1 text-xs font-medium text-white">
              {project.category}
            </span>
            <span className="font-mono text-sm text-blue-200">{project.period}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-snug break-keep mb-6 max-w-4xl">
            {project.title}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 leading-relaxed break-keep max-w-3xl">
            {project.summary}
          </p>
        </motion.div>
      </section>

      {/* Body */}
      <section className="px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {/* 대표 이미지 */}
          <div className="mb-16">
            <MediaFrame
              media={project.media?.hero}
              label="대표 이미지"
              hint="연구를 대표하는 이미지를 추가하세요"
              aspect="aspect-[21/9]"
              natural
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-16">
              <Block icon={FileText} title="연구 개요">
                <p className="text-slate-700 leading-relaxed break-keep text-base md:text-lg">
                  {project.overview}
                </p>
              </Block>

              <Block icon={Target} title="연구 목표">
                <ul className="space-y-3">
                  {project.objectives.map((obj, i) => (
                    <li key={i} className="flex gap-3 text-slate-700 break-keep leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0891b2]" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block icon={ListChecks} title="추진 내용">
                <ol className="space-y-4">
                  {project.methods.map((m, i) => (
                    <li
                      key={i}
                      className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-[#1e3a5f] mb-1">{m.title}</h3>
                        <p className="text-sm text-slate-600 break-keep leading-relaxed">{m.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* 추진체계도 (1개 또는 여러 개) */}
                <div className="mt-6 space-y-6">
                  {(Array.isArray(project.media?.diagram)
                    ? project.media.diagram
                    : [project.media?.diagram]
                  ).map((d, i) => (
                    <MediaFrame
                      key={i}
                      media={d}
                      label="추진체계도"
                      hint="연구 추진 체계 다이어그램을 추가하세요"
                      icon={Workflow}
                      natural
                    />
                  ))}
                </div>
              </Block>

              <Block icon={Sparkles} title="기대효과 및 활용방안">
                <ul className="space-y-3">
                  {project.outcomes.map((out, i) => (
                    <li key={i} className="flex gap-3 text-slate-700 break-keep leading-relaxed">
                      <ArrowUpRight size={18} className="mt-1 shrink-0 text-[#0891b2]" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              {project.outputs && project.outputs.length > 0 && (
                <Block icon={Award} title="연구 성과물">
                  <ul className="space-y-3">
                    {project.outputs.map((out, i) => (
                      <li key={i} className="flex gap-3 text-slate-700 break-keep leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0891b2]" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              {/* 연구 성과 이미지 */}
              <Block icon={Images} title="연구 성과">
                <div className="grid gap-4 sm:grid-cols-3">
                  {gallery.map((item, i) => (
                    <MediaFrame
                      key={i}
                      media={item}
                      label={`성과 이미지 ${i + 1}`}
                      hint="이미지 추가"
                      aspect="aspect-[4/3]"
                    />
                  ))}
                </div>
              </Block>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0891b2] mb-5">
                  과제 정보
                </h2>
                <dl className="space-y-5">
                  <div className="flex items-start gap-3">
                    <CalendarDays size={18} className="mt-0.5 shrink-0 text-[#1e3a5f]" />
                    <div>
                      <dt className="text-xs text-slate-500">연구기간</dt>
                      <dd className="font-medium text-slate-800">{project.period}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 size={18} className="mt-0.5 shrink-0 text-[#1e3a5f]" />
                    <div>
                      <dt className="text-xs text-slate-500">주관기관</dt>
                      <dd className="font-medium text-slate-800 break-keep">
                        {project.info.organization}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Landmark size={18} className="mt-0.5 shrink-0 text-[#1e3a5f]" />
                    <div>
                      <dt className="text-xs text-slate-500">지원</dt>
                      <dd className="font-medium text-slate-800 break-keep">
                        {project.info.support}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Prev / Next */}
      <nav className="border-t border-slate-100 px-4 md:px-8 py-10">
        <div className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-2">
          {prev ? (
            <Link
              to={`/projects/${prev.id}`}
              className="group flex flex-col rounded-xl border border-slate-200 p-5 transition-colors hover:border-[#0891b2] hover:bg-slate-50"
            >
              <span className="mb-1 inline-flex items-center text-xs text-slate-500">
                <ArrowLeft size={14} className="mr-1" /> 이전 과제
              </span>
              <span className="font-medium text-[#1e3a5f] break-keep group-hover:text-[#0891b2]">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/projects/${next.id}`}
              className="group flex flex-col rounded-xl border border-slate-200 p-5 text-right transition-colors hover:border-[#0891b2] hover:bg-slate-50 sm:items-end"
            >
              <span className="mb-1 inline-flex items-center text-xs text-slate-500">
                다음 과제 <ArrowRight size={14} className="ml-1" />
              </span>
              <span className="font-medium text-[#1e3a5f] break-keep group-hover:text-[#0891b2]">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </nav>

      <FooterSection />
    </div>
  )
}

export default ProjectDetailPage
