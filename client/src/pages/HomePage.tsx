import { useLocation } from "wouter";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { ArrowRight, MessageSquare, Loader2 } from "lucide-react";
import type { Opinion } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const [, setLocation] = useLocation();

  // 1️⃣ 실제 의견 데이터 가져오기 (홈페이지용 - 최신 10개만)
  const { data: opinions, isLoading } = useQuery<Opinion[]>({
    queryKey: ["/api/opinions", "preview"],
    queryFn: async () => {
      const response = await fetch("/api/opinions?limit=10");
      if (!response.ok) throw new Error("Failed to fetch opinions");
      return response.json();
    },
  });

  // 2️⃣ 최신순 정렬 (ID가 높을수록 최신이라고 가정하거나, 날짜순 정렬) 후 10개만 자르기
  // 보통 DB에서 가져올 때 정렬되어 오지만, 혹시 모르니 클라이언트에서도 안전하게 처리
  const recentOpinions = opinions
    ? [...opinions].slice(0, 10)
    : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. 상단 헤더 불러오기 */}
      <Header />
      {/* 2. 메인 컨텐츠 영역 */}
      <main className="w-full mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] text-center">
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1️⃣ [메인 박스] 여기에 onClick 추가! 👇 */}
          <div 
            onClick={() => setLocation("/policy")} 
            className="lg:col-span-2 bg-[#F3F4F6] rounded-[40px] p-8 md:p-12 flex flex-col justify-between min-h-[400px] relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]"
          >
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-4">
                함께 피우는 정책
              </h2>
              <p className="text-lg text-gray-500 max-w-md text-left">
                주민들의 소중한 의견이 모여<br />
                실제 변화를 만들어낸 기록들입니다.
              </p>
            </div>
            
            {/* 하단 버튼 (박스 전체가 눌리니까 버튼의 기능은 장식용이 됨) */}
            <div className="mt-8 text-left">
              <button className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
                정책 보러가기 <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2️⃣ [사이드 박스] 안건 */}
          <div 
            // 나중에 여기도 연결하려면 똑같이 onClick={() => setLocation("/agenda")} 넣으면 돼
            className="lg:col-span-1 bg-[#E5E7EB] rounded-[40px] p-8 flex flex-col min-h-[400px] relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                지금<br />논의중인 안건
              </h2>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                🔥
              </div>
            </div>

            <div className="mt-auto w-full bg-white rounded-[24px] p-5 shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full mb-3"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
            </div>
             <div className="absolute -bottom-10 left-8 right-8 bg-white/50 rounded-[24px] p-5 -z-10"></div>
          </div>

          {/* 3️⃣ [하단 박스] 주민 의견 */}
          <div className="lg:col-span-3 bg-white border-2 border-gray-100 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 min-h-[250px] hover:border-gray-300 transition-colors">
            <div className="md:w-1/3 text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                주민의 목소리
              </h2>
              <p className="text-gray-500">
                우리 동네에 필요한 점을<br />자유롭게 이야기해주세요.
              </p>
              <button 
                onClick={() => setLocation("/opinions")}
                className="text-sm font-bold text-gray-900 underline underline-offset-4 hover:text-blue-600"
              >
                전체보기 &rarr;
              </button>
            </div>

            <div className="flex-1 w-full overflow-x-auto pb-4 scrollbar-hide">
              {isLoading ? (
                // 로딩 중일 때
                <div className="flex items-center justify-center h-40 w-full text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  의견을 불러오는 중...
                </div>
              ) : recentOpinions.length > 0 ? (
                // 데이터가 있을 때 (가로 스크롤 컨테이너)
                <div className="flex gap-4">
                  {recentOpinions.map((opinion) => (
                    <div 
                      key={opinion.id} 
                      className="min-w-[240px] w-[240px] bg-gray-50 rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer text-left"
                      onClick={() => setLocation(`/opinions/${opinion.id}`)}
                    >
                      <div className="mb-3">
                        <MessageSquare className="w-8 h-8 text-blue-500 bg-blue-100 p-1.5 rounded-full mb-3" />
                        
                        {/* 👇 [수정] title -> content 로 변경! */}
                        <p className="text-gray-900 font-bold line-clamp-2 leading-snug">
                          {opinion.content}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                        {/* 날짜 형식은 그대로 유지 */}
                        <span>{new Date(opinion.createdAt).toLocaleDateString()}</span>
                        
                        {/* 👇 [수정] agreementCount -> likes 로 변경! (없으면 0 표시) */}
                        <span className="flex items-center gap-1">
                          👍 {opinion.likes || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* 더보기 카드 (맨 끝에 추가) */}
                  <div 
                    onClick={() => setLocation("/opinions")}
                    className="min-w-[100px] flex items-center justify-center bg-gray-50 rounded-3xl cursor-pointer hover:bg-gray-100 text-gray-400 font-bold text-sm"
                  >
                    더보기 +
                  </div>
                </div>
              ) : (
                // 데이터가 없을 때
                <div className="flex items-center justify-center h-40 w-full bg-gray-50 rounded-3xl text-gray-400">
                  아직 등록된 의견이 없습니다. 😅
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}