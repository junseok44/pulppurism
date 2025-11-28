import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Sprout, TreeDeciduous, MessageCircle, ArrowRight, ArrowDown } from "lucide-react";

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        
        {/* 1. 페이지 제목 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            풀뿌리광장 성장 과정 🌱
          </h1>
          <p className="text-gray-500 text-lg">
            작은 씨앗이 거대한 나무가 되기까지의 여정
          </p>
        </div>

        {/* 2. [핵심] 성장 과정 다이어그램 (그림 대신 코드로 구현) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-20">
          
          {/* 단계 1: 씨앗 (주민의견) */}
          <StepCard 
            icon={<MessageCircle className="w-10 h-10 text-amber-600" />}
            title="씨앗"
            subtitle="주민의 목소리"
            color="bg-amber-100"
            description="우리 마을에 필요한 것이 있나요? 작은 아이디어(씨앗)를 심어주세요."
          />

          {/* 화살표 (모바일: 아래 / PC: 오른쪽) */}
          <ArrowIcon />

          {/* 단계 2: 새싹 (안건) */}
          <StepCard 
            icon={<Sprout className="w-10 h-10 text-green-600" />}
            title="새싹"
            subtitle="안건 토론"
            color="bg-green-100"
            description="AI가 비슷한 의견을 모아 '안건'으로 틔웁니다. 함께 의견을 모아주세요."
          />

          {/* 화살표 */}
          <ArrowIcon />

          {/* 단계 3: 나무 (정책) */}
          <StepCard 
            icon={<TreeDeciduous className="w-10 h-10 text-emerald-700" />}
            title="나무"
            subtitle="정책 실현"
            color="bg-emerald-100"
            description="무럭무럭 자란 안건은 지자체에 전달되어 든든한 '정책(나무)'이 됩니다."
          />

        </div>

        {/* 3. 상세 설명 (텍스트 박스) */}
        <div className="bg-gray-50 rounded-[40px] p-8 md:p-12 text-center border border-gray-100">
          <h3 className="text-xl font-bold mb-4">함께 키우는 숲 🌳</h3>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            풀뿌리 광장은 여러분의 참여로 자라납니다.<br />
            나 혼자만의 불평이 아닌, <strong>우리 모두의 해결책</strong>이 되는 과정.<br />
            지금 바로 여러분만의 씨앗을 심어보세요!
          </p>
        </div>

      </main>

      <MobileNav />
    </div>
  );
}

// 🧩 내부 컴포넌트: 단계별 카드 (동그라미 + 텍스트)
function StepCard({ icon, title, subtitle, color, description }: any) {
  return (
    <div className="flex flex-col items-center text-center max-w-[280px] group">
      {/* 동그라미 아이콘 영역 */}
      <div className={`w-32 h-32 ${color} rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      
      {/* 텍스트 영역 */}
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{title}</h3>
      <span className="text-sm font-bold text-blue-600 mb-3 block">{subtitle}</span>
      <p className="text-gray-500 text-sm leading-keep word-break-keep">
        {description}
      </p>
    </div>
  );
}

// 🧩 내부 컴포넌트: 반응형 화살표
function ArrowIcon() {
  return (
    <div className="text-gray-300 my-4 md:my-0">
      <ArrowRight className="hidden md:block w-8 h-8" /> {/* PC용 */}
      <ArrowDown className="md:hidden w-8 h-8" />      {/* 모바일용 */}
    </div>
  );
}