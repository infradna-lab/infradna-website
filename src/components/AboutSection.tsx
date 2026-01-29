import { motion } from 'framer-motion'

function AboutSection() {
    return (
        <section className='`py-20 md:py-32 px-4 md:px-8 w-full overflow-hidden bg-white'>
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
                            은 기후변화로 인해 급증하는 자연재해와 사회적 재난으로부터 국민의
                            생명과 재산을 보호하기 위해 설립된 전문 연구기관입니다.
                        </p>
                        <p>
                            우리는 AI 기반의 데이터 분석 기술을 활용하여 재난 발생을 예측하고,
                            효율적인 대응 체계를 구축하는 데 주력하고 있습니다. 특히 수자원
                            관리, 침수 피해 예방, 폭염 대응 등 실생활과 밀접한 인프라 재난
                            관리에 대한 혁신적인 솔루션을 연구 개발합니다.
                        </p>
                        <p>
                            과학적이고 체계적인 재난 관리 시스템을 통해 지속 가능한 안전 사회를
                            만들어가는 것이 우리의 핵심 미션입니다.
                        </p>
                    </div>
                </div>
            </motion.div>
        </section>
        
    )
}

export default AboutSection