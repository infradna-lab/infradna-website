import { motion } from 'framer-motion'
import { Database, Activity, ShieldCheck } from 'lucide-react'

const areas = [
  {
    icon: Database,
    title: 'AI 기반 재난 데이터 관리',
    description:
      '재난 관련 빅데이터를 수집, 가공하여 AI 학습에 최적화된 고품질 데이터셋을 구축하고 관리합니다.',
  },
  {
    icon: Activity,
    title: '재난 피해 위험 분석 기술',
    description:
      '기후 및 환경 데이터를 종합적으로 분석하여 재난 발생 가능성과 잠재적 피해 규모를 과학적으로 예측합니다.',
  },
  {
    icon: ShieldCheck,
    title: '기후재난 데이터 품질관리',
    description:
      '데이터의 정확성과 신뢰성을 확보하기 위한 표준화된 품질 관리 체계를 수립하고 검증 기술을 개발합니다.',
  },
]

function FocusSection() {
    return (
        <section className='`py-20 md:py-32 px-4 md:px-8 w-full overflow-hidden bg-slate-50'>
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
                
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">
                        주요 연구 분야
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        데이터 과학과 인공지능 기술을 융합하여 재난 관리의 새로운 패러다임을
                        제시합니다.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {areas.map((area, index) => (
                        <div
                            key={index}
                            className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center mb-6 text-[#1e3a5f]">
                                <area.icon size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">
                                {area.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed break-keep text-sm md:text-base">
                                {area.description}
                            </p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </section>
        
    )
}

export default FocusSection

