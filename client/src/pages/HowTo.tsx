import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Mic, MessageSquare, Sparkles, Vote, FileText, ArrowRight } from "lucide-react";

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header />
      
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        {/* 페이지 제목 */}
        <div className="mb-8 text-center space-y-2 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            풀뿌리광장 100% 활용하기
          </h1>
          <p className="text-gray-500">
            여러분의 목소리가 정책이 되는 과정을 소개합니다.
          </p>
        </div>

        {/* 🍱 벤토 그리드 시작 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. 입력 (음성/텍스트) - 강조를 위해 색상 추가 */}
          <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="z-10">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. 쉽고 편하게 말하세요</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                글쓰기가 어렵다면 마이크를 켜세요.<br/>
                할머니, 할아버지도 말 한마디면 의견을 낼 수 있어요.<br/>
                물론 텍스트 입력도 가능합니다.
              </p>
            </div>
            {/* 장식용 배경 아이콘 */}
            <Mic className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-50 opacity-50 group-hover:scale-110 transition-transform" />
          </div>

          {/* 2. 주민 의견 등록 */}
          <div className="col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">2. 주민 의견 공유</h3>
            <p className="text-gray-600 text-sm">
              등록된 의견은 '주민의견' 게시판에 실시간으로 올라가 이웃들과 공유됩니다.
            </p>
          </div>

          {/* 3. AI 클러스터링 (가장 중요한 기술 부분이라 그라데이션!) */}
          <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-md text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">3. AI가 척척 정리해줘요</h3>
                <p className="text-indigo-100 text-sm md:text-base opacity-90">
                  비슷한 의견이 많으면 복잡하겠죠? <br className="md:hidden"/>
                  관리자가 <strong>AI 기술</strong>을 활용해 흩어진 의견들을 <br className="hidden md:inline"/>
                  비슷한 주제끼리 묶어서 <strong>'핵심 안건'</strong>으로 만듭니다.
                </p>
              </div>
            </div>
            {/* 반짝이 효과 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>

          {/* 4. 투표 */}
          <div className="col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600">
              <Vote className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">4. 투표와 토론</h3>
            <p className="text-gray-600 text-sm">
              정리된 안건에 투표하고 댓글로 토론하며 우리 마을의 우선순위를 정합니다.
            </p>
          </div>

          {/* 5. 정책 제안 */}
          <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-2">5. 실제 정책으로 제안</h3>
              <p className="text-gray-600 text-sm">
                많은 공감을 얻은 안건은 정식 공문으로 만들어져 지자체와 의회에 전달됩니다.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
               <ArrowRight className="text-gray-300 w-6 h-6" />
            </div>
          </div>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}