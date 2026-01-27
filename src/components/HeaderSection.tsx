import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import logo from '../assets/logo.png'

function HeaderSection() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 z-0 opacity-[0.03]"
                style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e3a5f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
                <motion.div
                    initial={{
                        opacity: 0,
                        scale: 0.95,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    transition={{
                        duration: 0.8,
                        ease: 'easeOut',
                    }}
                    className="mb-12"
                >
                    <img
                        src={logo}
                        alt="로고"
                        className="h-32 md:h-48 w-auto mx-auto drop-shadow-sm"
                    />
                </motion.div>

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                    }}
                    className="max-w-4xl mx-auto space-y-6"
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-[#1e3a5f] tracking-tight leading-tight">
                        재단법인 인프라재난관리진흥원
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-light tracking-wide">
                        Infrastructure Disaster Navigation Agency
                    </p>

                    <div className="w-24 h-1 bg-[#0891b2] mx-auto my-8 rounded-full" />

                    <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed break-keep">
                        데이터와 AI 기술을 통해 기후재난으로부터
                        <br className="hidden md:block" />
                        안전한 사회 인프라를 구축합니다.
                    </p>
                </motion.div>
            </div>


            <motion.div
                initial={{
                opacity: 0,
                }}
                animate={{
                opacity: 1,
                }}
                transition={{
                delay: 1.5,
                duration: 1,
                }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            >
                <div className="animate-bounce text-[#1e3a5f]">
                <ChevronDown size={32} strokeWidth={1.5} />
                </div>
            </motion.div>
        </div>
    )
}

export default HeaderSection