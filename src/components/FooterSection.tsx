import { MapPin, Phone, Printer, Mail } from 'lucide-react'

function FooterSection() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16 px-4 border-t border-slate-800">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
                <div>
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-lg">
                                재단법인 인프라재난관리진흥원
                            </span>
                            <span className="text-xs text-slate-500">
                                Infrastructure Disaster Navigation Agency
                            </span>
                        </div>
                    </div>

                    <dl className="mb-6 space-y-2 text-sm">
                        <div className="flex gap-3">
                            <dt className="w-14 shrink-0 text-slate-500">설립일</dt>
                            <dd className="text-slate-400">2024년 8월 4일</dd>
                        </div>
                        <div className="flex gap-3">
                            <dt className="w-14 shrink-0 text-slate-500">대표자</dt>
                            <dd className="text-slate-400">박상식</dd>
                        </div>
                    </dl>

                    <p className="text-xs text-slate-600">
                        © 2024 재단법인 인프라재난관리진흥원. All rights reserved.
                    </p>
                </div>

                <div className="space-y-6">
                    <h3 className="text-white font-bold text-lg mb-4">문의하기</h3>

                    <div className="flex items-start space-x-4">
                        <MapPin size={20} className="text-[#0891b2] mt-1 shrink-0" />
                        <div>
                            <p className="text-white font-medium">주소</p>
                            <p className="text-sm text-slate-400">
                                인천광역시 연수구 송도미래로 9, BRC연구소 3동 803호 (우 21988)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <Phone size={20} className="text-[#0891b2] mt-1 shrink-0" />
                        <div>
                            <p className="text-white font-medium">전화</p>
                            <p className="text-sm text-slate-400">032-256-2407</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <Printer size={20} className="text-[#0891b2] mt-1 shrink-0" />
                        <div>
                            <p className="text-white font-medium">팩스</p>
                            <p className="text-sm text-slate-400">032-232-4407</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <Mail size={20} className="text-[#0891b2] mt-1 shrink-0" />
                        <div>
                            <p className="text-white font-medium">이메일</p>
                            <p className="text-sm text-slate-400">disastermanager2025@gmail.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default FooterSection