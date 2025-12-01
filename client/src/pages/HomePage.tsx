import { useLocation } from "wouter";
import Header from "@/components/Header";
import { ArrowRight, MessageSquare, Loader2, HelpCircle, Heart, X } from "lucide-react"; // X 아이콘 추가
import type { Opinion, Agenda, Category } from "@shared/schema";
import { useQuery, useQueries } from "@tanstack/react-query";
import HomeAgendaCard from "@/components/HomeAgendaCard";
import { useMemo, useState, useEffect } from "react"; // useState, useEffect 추가
import PolicyCard from "@/components/PolicyCard";
import HomeOpinionCard from "@/components/HomeOpinionCard";

// 타임라인 아이템 타입 정의
interface ExecutionTimelineItem {
  id: string;
  authorName: string;
  createdAt: string;
}

export default function HomePage() {
  const [, setLocation] = useLocation();

  // 0️⃣ 배너 상태 관리 (localStorage 연동)
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // 컴포넌트 마운트 시 localStorage 확인
    const isHidden = localStorage.getItem("hide-guide-banner");
    if (isHidden === "true") {
      setShowBanner(false);
    }
  }, []);

  const handleCloseBanner = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모의 onClick(페이지 이동) 이벤트 전파 방지
    setShowBanner(false);
    localStorage.setItem("hide-guide-banner", "true"); // 로컬 스토리지에 저장
  };

  // 1️⃣ 의견 데이터 가져오기
  const { data: opinions, isLoading: isOpinionsLoading } = useQuery<Opinion[]>({
    queryKey: ["/api/opinions", "preview"],
    queryFn: async () => {
      const response = await fetch("/api/opinions?limit=10");
      if (!response.ok) throw new Error("Failed to fetch opinions");
      return response.json();
    },
  });

  const recentOpinions = opinions ? [...opinions].slice(0, 10) : [];

  // 2️⃣ 안건 데이터 가져오기
  const { data: agendas, isLoading: isAgendasLoading } = useQuery<(Agenda & {
    category: Category | null;
    bookmarkCount: number;
    isBookmarked: boolean;
  })[]>({
    queryKey: ["/api/agendas", "home-spotlight"],
    queryFn: async () => {
      const response = await fetch("/api/agendas");
      if (!response.ok) throw new Error("Failed to fetch agendas");
      return response.json();
    },
  });

  // 3️⃣ 정책 실현 데이터 필터링
  const realizedPolicies = useMemo(() => {
    if (!agendas) return [];
    return agendas
      .filter(a => a.status === 'executed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [agendas]);

  // 4️⃣ 각 정책의 타임라인(작성자 정보) 가져오기
  const timelineQueries = useQueries({
    queries: realizedPolicies.map((policy) => ({
      queryKey: [`/api/agendas/${policy.id}/execution-timeline`],
      queryFn: async () => {
        const res = await fetch(`/api/agendas/${policy.id}/execution-timeline`);
        if (!res.ok) throw new Error("Failed to fetch timeline");
        return res.json() as Promise<ExecutionTimelineItem[]>;
      },
      enabled: !!policy.id,
    })),
  });

  // 5️⃣ 안건 정보 + 타임라인 정보(작성자) 합치기
  const policiesWithAuthor = useMemo(() => {
    return realizedPolicies.map((policy, index) => {
      const timelineData = timelineQueries[index]?.data;
      let latestAuthor = "옥천군청";
      
      if (timelineData && timelineData.length > 0) {
        const sorted = [...timelineData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        latestAuthor = sorted[0].authorName;
      }

      return {
        ...policy,
        agency: latestAuthor
      };
    });
  }, [realizedPolicies, timelineQueries]);

  // 랜덤 스포트라이트 로직
  const spotlightData = useMemo(() => {
    if (!agendas || agendas.length === 0) {
      return { title: "등록된 안건이 없어요.", data: [] };
    }

    const groups = [
      {
        status: 'voting',
        title: "지금 투표가 진행 중인 안건입니다.\n소중한 한 표를 행사해주세요!",
        data: agendas.filter(a => a.status === 'voting')
      },
      {
        status: 'proposing',
        title: "담당 기관에 정책 제안을 진행 중인 안건들입니다. \n 답변을 기다리고 있어요.",
        data: agendas.filter(a => a.status === 'proposing')
      },
      {
        status: 'executing',
        title: "우리 마을이 바뀌고 있어요.\n현재 실행 중인 안건들입니다.",
        data: agendas.filter(a => a.status === 'executing')
      },
      {
        status: 'completed',
        title: "우리가 함께 만들어낸 변화입니다.\n해결된 안건들을 확인해보세요.",
        data: agendas.filter(a => ['passed', 'executed', 'rejected'].includes(a.status))
      }
    ];

    const validGroups = groups.filter(g => g.data.length > 0);

    if (validGroups.length === 0) {
      return {
        title: "최근 등록된 안건들입니다.\n어떤 이야기들이 있는지 확인해보세요 👀",
        data: [...agendas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
      };
    }

    const randomIndex = Math.floor(Math.random() * validGroups.length);
    return validGroups[randomIndex];

  }, [agendas]);

  const { title: boxDescription, data: spotlightAgendas } = spotlightData;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* 이용안내 배너 (showBanner가 true일 때만 표시) */}
      {showBanner && (
        <div
          onClick={() => setLocation("/howto")}
          className="w-[98vw] mx-auto mt-4 rounded-2xl bg-ok_sand text-ok_sandtxt py-3 px-4 flex items-center justify-center cursor-pointer hover:bg-ok_sandhover transition-colors text-sm md:text-base font-medium animate-in slide-in-from-top duration-300 relative"
        >
          {/* 내용 컨테이너 (중앙 정렬 유지) */}
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            <span>
              옥천마루에 처음 오셨나요? 이용 안내 보러가기
            </span>
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* 닫기 버튼 (우측 끝 고정) */}
          <button
            onClick={handleCloseBanner}
            className="absolute right-4 p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="배너 닫기"
          >
            <X className="w-4 h-4 text-ok_sandtxt" />
          </button>
        </div>
      )}

      <main className="w-full mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] text-center">

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1️⃣ [메인 박스 - 정책 실현 현황] */}
          <div
            className="lg:col-span-2 bg-ok_gray2 rounded-[40px] p-8 md:p-10 flex flex-col justify-start gap-6 min-h-[450px] relative overflow-hidden group transition-transform"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full z-10 text-left gap-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-2 leading-tight">
                  함께 피우는 정책
                </h2>
                <p className="text-sm md:text-base text-gray-500">
                  주민들의 소중한 의견이 모여 실제 변화를 만들어낸 기록입니다.
                </p>
              </div>
              
              <button
                onClick={() => setLocation("/policy")}
                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm md:text-base flex items-center gap-2 hover:bg-ok_sub1 transition-colors shadow-md hover:shadow-lg shrink-0"
              >
                전체보기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 w-full flex items-start overflow-hidden mt-2">
              {policiesWithAuthor.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x w-full">
                  {policiesWithAuthor.map((policy) => (
                    <div key={policy.id} className="min-w-[280px] md:min-w-[320px] snap-center">
                      <PolicyCard
                        title={policy.title}
                        content={(policy.response as string) || policy.description}
                        agency={policy.agency}
                        date={new Date(policy.updatedAt).toLocaleDateString()}
                        onClick={() => setLocation(`/agendas/${policy.id}`)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-40 flex flex-col items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-white/50 p-6 text-gray-400">
                  <p className="text-lg font-bold mb-1">아직 실현된 정책이 없어요</p>
                  <p className="text-xs">여러분의 의견으로 첫 번째 변화를 만들어주세요!</p>
                </div>
              )}
            </div>
          </div>

          {/* 2️⃣ [사이드 박스] 안건 보기 */}
          <div className="lg:col-span-1 bg-primary rounded-[40px] p-8 md:p-12 flex flex-col min-h-[400px] relative overflow-hidden">
            <div className="text-left mb-6 relative z-10">
              <div className="flex justify-between items-start">
                <h2 className="text-4xl font-extrabold text-ok_gray1 mb-2">
                  안건 보기
                </h2>
                <div
                  onClick={() => setLocation("/agendas")}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shadow-sm shrink-0"
                >
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-ok_gray1 whitespace-pre-wrap leading-relaxed text-m">
                {boxDescription}
              </p>
            </div>

            <div className="flex-1 w-full flex items-end">
              {isAgendasLoading ? (
                <div className="w-full h-40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : spotlightAgendas.length > 0 ? (
                <div className="flex gap-3 md:gap-5 overflow-x-auto pb-4 -mx-4 px-2 scrollbar-hide snap-x font-sans">
                  {spotlightAgendas.map((agenda) => (
                    <div
                      key={agenda.id}
                      className="shrink-0 snap-center w-[250px] md:w-[260px] h-auto"
                    >
                      <HomeAgendaCard
                        title={agenda.title}
                        description={agenda.description}
                        imageUrl={agenda.imageUrl}
                        category={agenda.category?.name || "기타"}
                        status={agenda.status}
                        onClick={() => setLocation(`/agendas/${agenda.id}`)}
                        bookmarkCount={agenda.bookmarkCount || 0}
                        isBookmarked={agenda.isBookmarked}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-white/50 rounded-2xl p-6 text-gray-500 text-sm">
                  표시할 안건이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 3️⃣ [하단 박스] 주민 의견 */}
          <div className="lg:col-span-3 bg-ok_sand border-2 border-ok_gray2 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 min-h-[250px] hover:border-ok_gray3 transition-colors">
            <div className="md:w-1/3 text-left">
              <h2 className="text-3xl font-extrabold text-ok_txtgray2 mb-2">
                주민의 목소리
              </h2>
              <p className="text-ok_txtgray1">
                우리 동네에 필요한 점을<br />자유롭게 이야기해주세요.
              </p>
              <button
                onClick={() => setLocation("/opinions")}
                className="text-sm font-bold text-ok_txtgray2 underline underline-offset-4 hover:text-ok_sub1"
              >
                전체보기 &rarr;
              </button>
            </div>

            <div className="flex-1 w-full overflow-x-auto pb-4 scrollbar-hide">
              {isOpinionsLoading ? (
                <div className="flex items-center justify-center h-40 w-full text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  의견을 불러오는 중...
                </div>
              ) : recentOpinions.length > 0 ? (
                <div className="flex gap-4">
                  {recentOpinions.map((opinion) => (
                    <HomeOpinionCard 
                    key={opinion.id}
                    opinion={opinion}
                    onClick={() => setLocation(`/opinion/${opinion.id}`)}
                  />
                  ))}
                  <div
                    onClick={() => setLocation("/opinions")}
                    className="min-w-[100px] flex items-center justify-center bg-gray-50 rounded-3xl cursor-pointer hover:bg-gray-100 text-gray-400 font-bold text-sm"
                  >
                    더보기 +
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 w-full bg-gray-50 rounded-3xl text-gray-400">
                  아직 등록된 의견이 없습니다. 😅
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}