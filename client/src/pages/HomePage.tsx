import { useLocation } from "wouter";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. 상단 헤더 불러오기 */}
      <Header />
      {/* 2. 메인 컨텐츠 영역 */}
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] text-center">
        {/* 👇 [핵심] 벤토 그리드 레이아웃 시작 */}
        {/* 모바일: 1열 / PC(lg): 3열 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1️⃣ [메인 박스] 함께 피운 정책 (왼쪽, 넓게 2칸 차지) */}
          <div className="lg:col-span-2 bg-[#F3F4F6] rounded-[40px] p-8 md:p-12 flex flex-col justify-between min-h-[400px] relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-4">
                함께 피운 정책
              </h2>
              <p className="text-lg text-gray-500 max-w-md">
                주민들의 소중한 의견이 모여<br />
                실제 변화를 만들어낸 기록들입니다.
              </p>
            </div>
            
            {/* 하단 버튼 느낌 */}
            <div className="mt-8">
              <button className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
                정책 보러가기 <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2️⃣ [사이드 박스] 안건 (오른쪽, 1칸 차지, 세로로 김) */}
          <div className="lg:col-span-1 bg-[#E5E7EB] rounded-[40px] p-8 flex flex-col min-h-[400px] relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                지금<br />논의중인 안건
              </h2>
              {/* 우측 상단 장식 아이콘 등을 넣을 수 있음 */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                🔥
              </div>
            </div>

            {/* 안건 카드 예시 (이미지 느낌) */}
            <div className="mt-auto w-full bg-white rounded-[24px] p-5 shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full mb-3"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
            </div>
             <div className="absolute -bottom-10 left-8 right-8 bg-white/50 rounded-[24px] p-5 -z-10">
               {/* 뒤에 깔린 카드 장식 */}
            </div>
          </div>

          {/* 3️⃣ [하단 박스] 주민 의견 (전체 너비 3칸 차지) */}
          <div className="lg:col-span-3 bg-white border-2 border-gray-100 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 min-h-[250px] hover:border-gray-300 transition-colors">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                주민의 목소리
              </h2>
              <p className="text-gray-500">
                우리 동네에 필요한 점을<br />자유롭게 이야기해주세요.
              </p>
            </div>

            {/* 의견 리스트가 가로로 흘러가는 영역 (또는 버튼) */}
            <div className="flex-1 w-full bg-[#FAFAFA] rounded-[24px] p-6 h-full flex items-center justify-center border border-dashed border-gray-300">
              <span className="text-gray-400 font-medium">
                여기에 최근 의견들이 롤링되거나 리스트로 들어갑니다.
              </span>
            </div>
          </div>

        </div>
        {/* 벤토 그리드 끝 */}

      </main>

      {/* 3. 하단 내비게이션 (앱처럼 보이게 유지) */}
      <MobileNav />
    </div>
  );
}