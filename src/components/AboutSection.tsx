import { motion } from 'framer-motion'

function AboutSection() {
    return (
        <section className='py-20 md:py-32 px-4 md:px-8 w-full overflow-hidden bg-white'>
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
                <div className="grid md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-6 relative inline-block">
                            우리가 하는 일
                            <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#0891b2] rounded-full opacity-30"></span>
                        </h2>
                        <p className="text-[#0891b2] font-semibold tracking-wide text-sm uppercase">
                            About Us
                        </p>
                    </div>

                    <div className="md:col-span-8 space-y-6 text-lg text-slate-700 leading-relaxed break-keep">
                        <p>
                            <strong className="text-[#1e3a5f]">
                                재단법인 인프라재난관리진흥원(Infra DNA)
                            </strong>
                            은 2024년 7월 행정안전부로부터 설립허가를 받은 비영리 재단법인으로,
                            기후재난으로 인한 사회적·경제적 피해를 최소화하기 위해 데이터 기반의
                            분석·평가·예측·교육 서비스를 통합 제공하는 전문기관입니다.
                        </p>
                        <p>
                            우리는 AI와 데이터 분석 기술을 활용해 과학적·정량적 재난 리스크
                            분석을 수행하고, 지속가능한 재난 대응 전략 설계를 통해 정책 수립을
                            지원하며, 재난 대응 인프라 운영 인력을 위한 교육을 제공합니다.
                        </p>
                        <p>
                            특히 수자원 관리, 침수 피해 예방, 폭염 대응 등 실생활과 밀접한
                            인프라 재난 문제에 대한 실질적인 해결책을 연구·개발하여, 과학적이고
                            체계적인 재난 관리 체계를 통해 지속 가능한 안전 사회를 만들어가는
                            것이 우리의 핵심 미션입니다.
                        </p>
                    </div>
                </div>
            </motion.div>
        </section>
        
    )
}

export default AboutSection