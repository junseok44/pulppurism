import { useLocation } from "wouter";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. 상단 헤더 불러오기 */}
      <Header />

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] text-center">
        
        {/* 로고나 환영 문구 (아까 설정한 베이글 폰트 적용!) */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 font-bagel">
            풀뿌리광장
          </h1>
          <p className="text-gray-500 text-lg">
            우리 마을의 변화, <br />
            여기서부터 시작됩니다.
          </p>
        </div>

        {/* 안건 보러가기 버튼 */}
        <Button 
          size="lg" 
          className="w-full max-w-xs text-lg font-bold h-12 shadow-md"
          onClick={() => setLocation("/agenda")}
        >
          안건 살펴보기
        </Button>
        
        {/* 추가적인 정보나 이미지가 있다면 여기에 배치 */}
        <div className="mt-12 p-6 bg-white rounded-2xl shadow-sm w-full max-w-md border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-2">📢 공지사항</h3>
          <p className="text-sm text-gray-500">
            지금 가장 뜨거운 안건에 투표해보세요!
            주민 여러분의 의견이 마을을 바꿉니다.
          </p>
        </div>

      </main>

      {/* 3. 하단 내비게이션 (앱처럼 보이게 유지) */}
      <MobileNav />
    </div>
  );
}