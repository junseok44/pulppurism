import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Hammer, Loader2, Info, Filter, ChevronDown, Calendar } from "lucide-react";
import type { Agenda, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategoryFilter from "@/components/CategoryFilter";

interface AgendaWithCategory extends Agenda {
  category?: Category;
}

interface ExecutionTimelineItem {
  id: string;
  agendaId: string;
  userId: string;
  authorName: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

interface AgendaWithTimeline extends AgendaWithCategory {
  latestTimelineItem?: ExecutionTimelineItem;
}

const ITEMS_PER_PAGE = 10;

type StatusFilter = "all" | "executing" | "executed";
type PeriodFilter = "all" | "1month" | "1year";

export default function AgendaToPolicy() {
  const [, setLocation] = useLocation();
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  // 모든 안건 가져오기
  const {
    data: allAgendas,
    isLoading: agendasLoading,
    error: agendasError,
  } = useQuery<AgendaWithCategory[]>({
    queryKey: ["/api/agendas"],
  });

  // 카테고리 가져오기
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // 필터링된 안건 목록
  const filteredAgendas = useMemo(() => {
    if (!allAgendas) return [];
    
    let filtered = allAgendas.filter(
      (agenda) => agenda.status === "executing" || agenda.status === "executed"
    );

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter((agenda) => agenda.status === statusFilter);
    }

    // 카테고리 필터
    if (selectedCategoryName) {
      filtered = filtered.filter(
        (agenda) => agenda.category?.name === selectedCategoryName
      );
    }

    // 기간 필터
    if (periodFilter !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (periodFilter === "1month") {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (periodFilter === "1year") {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter((agenda) => {
        const agendaDate = new Date(agenda.createdAt);
        return agendaDate >= cutoffDate;
      });
    }

    return filtered;
  }, [allAgendas, statusFilter, selectedCategoryName, periodFilter]);

  // 통계 계산 (필터 적용 전 전체 데이터 기준)
  const stats = useMemo(() => {
    if (!allAgendas) return { executedCount: 0, executingCount: 0, realizationRate: 0 };
    
    const executingAgendas = allAgendas.filter(
      (agenda) => agenda.status === "executing" || agenda.status === "executed"
    );
    
    const executedCount = executingAgendas.filter(
      (a) => a.status === "executed"
    ).length;
    const executingCount = executingAgendas.filter(
      (a) => a.status === "executing"
    ).length;
    const totalAgendas = allAgendas.length;
    const realizationRate = totalAgendas > 0 
      ? Math.round((executingAgendas.length / totalAgendas) * 100)
      : 0;
    return { executedCount, executingCount, realizationRate };
  }, [allAgendas]);

  // 표시할 안건 목록 (무한스크롤)
  const displayedAgendas = filteredAgendas.slice(0, displayedCount);

  // 각 안건의 실행 과정 아이템 가져오기
  const timelineQueries = useQueries({
    queries: displayedAgendas.map((agenda) => ({
      queryKey: [`/api/agendas/${agenda.id}/execution-timeline`],
      queryFn: async () => {
        const res = await fetch(`/api/agendas/${agenda.id}/execution-timeline`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch timeline");
        return res.json() as Promise<ExecutionTimelineItem[]>;
      },
      enabled: !!agenda.id,
      select: (data: ExecutionTimelineItem[]) => {
        // 날짜순으로 정렬하고 가장 최근 아이템 반환
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return sorted;
      },
    })),
  });

  // 안건과 최근 실행 과정 아이템 결합
  const agendasWithTimeline: AgendaWithTimeline[] = useMemo(() => {
    return displayedAgendas.map((agenda, index) => {
      const timelineData = timelineQueries[index]?.data;
      return {
        ...agenda,
        latestTimelineItem: timelineData && timelineData.length > 0 ? timelineData[0] : undefined,
      };
    });
  }, [displayedAgendas, timelineQueries]);

  // 무한스크롤 처리
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 100
      ) {
        if (displayedCount < filteredAgendas.length) {
          setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredAgendas.length));
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [displayedCount, filteredAgendas.length]);

  // 필터 변경 시 표시 개수 리셋
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [statusFilter, periodFilter, selectedCategoryName]);

  const isLoading = agendasLoading || timelineQueries.some((q) => q.isLoading || q.isFetching);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="w-full max-w-5xl mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            정책 실현 현황 🚀
          </h1>
          <p className="text-gray-500">
            주민의 의견이 현실이 되는 과정을 투명하게 공개합니다.
          </p>
        </div>

        {/* 통계 요약 카드 */}
        <TooltipProvider>
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-gray-100">
              <div className="text-2xl font-bold text-blue-600">
                {stats.executedCount}건
              </div>
              <div className="text-xs text-gray-400">실현 완료</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-gray-100">
              <div className="text-2xl font-bold text-orange-500">
                {stats.executingCount}건
              </div>
              <div className="text-xs text-gray-400">진행 중</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-gray-100 relative">
              <div className="text-2xl font-bold text-gray-700">
                {stats.realizationRate}%
              </div>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                정책 실현율
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      전체 안건 중 실행 중 또는 실행 완료 상태인 안건의 비율입니다.
                      <br />
                      (실행 중 + 실행 완료) / 전체 안건 × 100
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </TooltipProvider>

        {/* 필터 섹션 */}
        <div className="mb-6 space-y-4">
          {/* 카테고리 필터 */}
          {!categoriesLoading && categories && (
            <CategoryFilter
              categories={categories.map((c) => ({
                name: c.name,
                icons: c.icon,
              }))}
              selected={selectedCategoryName}
              onSelect={setSelectedCategoryName}
            />
          )}

          {/* 상태 및 기간 필터 */}
          <div className="flex items-center gap-3 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-status-filter"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {statusFilter === "all" && "전체"}
                  {statusFilter === "executing" && "실행 중"}
                  {statusFilter === "executed" && "실행 완료"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => setStatusFilter("all")}
                  data-testid="menu-item-filter-all"
                >
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("executing")}
                  data-testid="menu-item-filter-executing"
                >
                  실행 중
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("executed")}
                  data-testid="menu-item-filter-executed"
                >
                  실행 완료
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-period-filter"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {periodFilter === "all" && "전체 기간"}
                  {periodFilter === "1month" && "최근 1개월"}
                  {periodFilter === "1year" && "최근 1년"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => setPeriodFilter("all")}
                  data-testid="menu-item-period-all"
                >
                  전체 기간
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPeriodFilter("1month")}
                  data-testid="menu-item-period-1month"
                >
                  최근 1개월
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPeriodFilter("1year")}
                  data-testid="menu-item-period-1year"
                >
                  최근 1년
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 정책 리스트 그리드 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : agendasError ? (
          <div className="text-center py-20">
            <p className="text-destructive">안건을 불러오는 데 실패했습니다.</p>
          </div>
        ) : agendasWithTimeline.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agendasWithTimeline.map((agenda) => (
              <PolicyCard key={agenda.id} agenda={agenda} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              실행 중이거나 실행 완료된 안건이 없습니다.
            </p>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

// 정책 카드 컴포넌트
function PolicyCard({ agenda }: { agenda: AgendaWithTimeline }) {
  const [, setLocation] = useLocation();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "executed":
        return {
          color: "bg-green-100 text-green-700",
          icon: CheckCircle2,
          text: "실현 완료",
        };
      case "executing":
        return {
          color: "bg-blue-100 text-blue-700",
          icon: Hammer,
          text: "진행 중",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700",
          icon: CheckCircle2,
          text: "대기 중",
        };
    }
  };

  const statusStyle = getStatusStyle(agenda.status);
  const StatusIcon = statusStyle.icon;

  // 최근 업데이트 날짜 포맷팅
  const getLatestUpdateDate = () => {
    if (!agenda.latestTimelineItem) return null;
    const date = new Date(agenda.latestTimelineItem.createdAt);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="bg-ok_gray1 rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between h-full group cursor-pointer"
      onClick={() => setLocation(`/agendas/${agenda.id}`)}
    >
      <div>
        {/* 상단 뱃지 영역 */}
        <div className="flex justify-between items-start mb-4">
          <Badge
            variant="secondary"
            className={`${statusStyle.color} border-0 px-3 py-1`}
          >
            <StatusIcon className="w-3.5 h-3.5 mr-1" />
            {statusStyle.text}
          </Badge>
          <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full">
            {agenda.category?.name || "카테고리 없음"}
          </span>
        </div>

        {/* 타이틀 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {agenda.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-6">
          {agenda.description}
        </p>
      </div>

      {/* 하단 정보 */}
      <div className="bg-gray-50 rounded-2xl p-4 mt-auto">
        {agenda.latestTimelineItem ? (
          <>
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                  {agenda.latestTimelineItem.authorName[0] || "관"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {agenda.latestTimelineItem.authorName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getLatestUpdateDate()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {agenda.latestTimelineItem.content}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                최근 업데이트: {getLatestUpdateDate()}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <span className="text-xs text-gray-500">
              아직 실행 과정이 등록되지 않았습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
