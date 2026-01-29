import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const projects = [
  {
    id: 1,
    title: 'AI 기반 수자원 빅데이터 품질관리 기술 개발',
    period: '2022 - 2026',
    category: '수자원 관리',
  },
  {
    id: 2,
    title: '실측기반 가뭄영향평가 및 대응 기술',
    period: '2022 - 2026',
    category: '가뭄 대응',
  },
  {
    id: 3,
    title: '물부족시 수생태계 건강성 감시대응 기술 개발',
    period: '2022 - 2026',
    category: '생태계 모니터링',
  },
  {
    id: 4,
    title: '반지하 침수 조기 대응 및 피난이 가능한 통합 시스템 개발 및 실증',
    period: '2023 - 2026',
    category: '도시 안전',
  },
  {
    id: 5,
    title: '폭염 취약지역 지원을 위한 기상 사회 경제 융합 폭염정보 개발',
    period: '2023 - 2026',
    category: '기후 복지',
  },
]

function ProjectSection() {
    return (
        <section className='`py-20 md:py-32 px-4 md:px-8 w-full overflow-hidden bg-[#1e3a5f] text-white'>
            <motion.div
                initial={{
                opacity: 0,
                y: 30,
                }}
                whileInView={{
                opacity: 1,
                y: 0,
                }}
                viewport={{
                once: true,
                margin: '-100px',
                }}
                transition={{
                duration: 0.7,
                ease: 'easeOut',
                }}
                className="max-w-7xl mx-auto"
            >

                <div className="mb-16 border-b border-white/10 pb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        주요 연구 과제
                    </h2>
                    <p className="text-blue-200">
                        2022-2026 진행 중인 핵심 프로젝트
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{
                            opacity: 0,
                            y: 20,
                            }}
                            whileInView={{
                            opacity: 1,
                            y: 0,
                            }}
                            viewport={{
                            once: true,
                            }}
                            transition={{
                            delay: index * 0.1,
                            duration: 0.5,
                            }}
                            className="group bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-xl hover:bg-white/10 transition-colors duration-300 cursor-default"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#0891b2] text-white">
                                    {project.category}
                                </span>
                                <span className="text-blue-200 text-sm font-mono">
                                    {project.period}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 leading-snug break-keep group-hover:text-[#38bdf8] transition-colors">
                                {project.title}
                            </h3>
                            <div className="flex items-center text-sm text-blue-300 group-hover:text-white transition-colors">
                                <span className="mr-2">자세히 보기</span>
                                <ArrowRight
                                    size={16}
                                    className="transform group-hover:translate-x-1 transition-transform"
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>   
    )
}

export default ProjectSection