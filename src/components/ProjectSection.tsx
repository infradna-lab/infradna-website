import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'

function ProjectSection() {
    return (
        <section id="projects" className='py-20 md:py-32 px-4 md:px-8 w-full overflow-hidden bg-[#1e3a5f] text-white'>
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
                        >
                            <Link
                                to={`/projects/${project.id}`}
                                className="group block h-full bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-xl hover:bg-white/10 transition-colors duration-300"
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
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    )
}

export default ProjectSection
