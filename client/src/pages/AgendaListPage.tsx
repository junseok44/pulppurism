import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import CategoryFilter from "@/components/CategoryFilter";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Filter, ChevronDown } from "lucide-react";
import type { Agenda, Category } from "@shared/schema";
import OkAgendaCard from "@/components/OkAgendaCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TitleCard from "@/components/TitleCard";
import { useUser } from "@/hooks/useUser";
import LoginDialog from "@/components/LoginDialog"; // 👈 LoginDialog import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  bookmarkCount?: number;
  isBookmarked?: boolean;
}

// 🚀 [수정] AgendaStatus 타입에 'rejected' 추가 및 전체 상태 정의
type AgendaStatus = "all" | "created" | "voting" | "proposing" | "answered" | "executing" | "executed" | "rejected";
type SortOption = "latest" | "views" | "votes";

// 🚀 [수정] SpotlightSection 타입 확장 (모든 상태 포함)
type SpotlightSection = Exclude<AgendaStatus, "all">;

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgendaStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const { toast } = useToast();
  const { user } = useUser();

  // 1️⃣ [추가] 로그인 팝업 상태 관리
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const agendasQueryKey = "/api/agendas";

  const {
    data: agendas,
    isLoading: agendasLoading,
    error: agendasError,
  } = useQuery<AgendaWithCategory[]>({
    queryKey: [agendasQueryKey],
    enabled: !categoriesLoading,
  });

  const allAgendas = agendas || [];

  const spotlightSection = useMemo<SpotlightSection>(() => {
    const allSections: SpotlightSection[] = [
      "created",
      "voting",
      "proposing",
      "answered",
      "executing",
      "executed",
      "rejected"
    ];
    // 데이터가 아직 로딩 중이거나 하나도 없으면 기본값 'voting' 리턴
    if (allAgendas.length === 0) return "voting";

    // 실제로 데이터가 하나라도 들어있는 상태만 골라내기
    const validSections = allSections.filter(section =>
      allAgendas.some(agenda => agenda.status === section)
    );

    // 모든 상태에 안건이 하나도 없다면? (예외 처리) -> 그냥 'voting' 리턴
    if (validSections.length === 0) return "voting";

    // 유효한 섹션 중에서 랜덤 선택
    return validSections[Math.floor(Math.random() * validSections.length)];
  }, [allAgendas]);

  let filteredAgendas = allAgendas;

  if (statusFilter !== "all") {
    filteredAgendas = filteredAgendas.filter(
      (agenda) => agenda.status === statusFilter,
    );
  }

  if (selectedCategoryName) {
    filteredAgendas = filteredAgendas.filter(
      (agenda) => agenda.category?.name === selectedCategoryName,
    );
  }

  const sortedAgendas = [...filteredAgendas].sort((a, b) => {
    switch (sortOption) {
      case "latest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "views":
        return b.viewCount - a.viewCount;
      case "votes":
        return b.voteCount - a.voteCount;
      default:
        return 0;
    }
  });


  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case "all": return "전체";
      case "created": return "안건 생성";
      case "voting": return "투표 중";
      case "proposing": return "제안 중";
      case "answered": return "답변 완료";
      case "executing": return "실행 중";
      case "executed": return "실행 완료";
      case "rejected": return "반려됨"; // 반려 라벨 추가
      default: return "진행상황에 따라 보기";
    }
  };

  // 3️⃣ [수정] 스포트라이트 설정 확장 (모든 상태에 대한 텍스트/이모지 정의)
  const getSpotlightConfig = () => {
    switch (spotlightSection) {
      case "created":
        return { emoji: "🆕", title: "새로 등록된 안건", testId: "button-view-all-created" };
      case "voting":
        return { emoji: "🔥", title: "지금 투표 중인 안건", testId: "button-view-all-voting" };
      case "proposing":
        return { emoji: "📢", title: "제안이 진행 중인 안건", testId: "button-view-all-proposing" };
      case "answered":
        return { emoji: "💬", title: "답변이 완료된 안건", testId: "button-view-all-answered" };
      case "executing":
        return { emoji: "🚧", title: "실행 중인 안건", testId: "button-view-all-executing" };
      case "executed":
        return { emoji: "✅", title: "실행 완료된 안건", testId: "button-view-all-executed" };
      case "rejected":
        return { emoji: "🛑", title: "반려된 안건", testId: "button-view-all-rejected" };
      default:
        return { emoji: "👀", title: "주목할 만한 안건", testId: "button-view-all" };
    }
  };

  const spotlightConfig = getSpotlightConfig();

  const bookmarkMutation = useMutation({
    mutationFn: async ({ agendaId, isBookmarked }: { agendaId: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/agendas/${agendaId}/bookmark`);
      } else {
        await apiRequest("POST", `/api/agendas/${agendaId}/bookmark`);
      }
    },
    onMutate: async ({ agendaId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: [agendasQueryKey] });
      const previousAgendas = queryClient.getQueryData<AgendaWithCategory[]>([agendasQueryKey]);

      if (previousAgendas) {
        const updatedAgendas = previousAgendas.map((agenda) =>
          agenda.id === agendaId
            ? {
              ...agenda,
              isBookmarked: !isBookmarked,
              bookmarkCount: isBookmarked
                ? (agenda.bookmarkCount || 0) - 1
                : (agenda.bookmarkCount || 0) + 1,
            }
            : agenda
        );
        queryClient.setQueryData<AgendaWithCategory[]>([agendasQueryKey], updatedAgendas);
      }
      return { previousAgendas };
    },
    onError: (err, variables, context) => {
      if (context?.previousAgendas) {
        queryClient.setQueryData([agendasQueryKey], context.previousAgendas);
      }
      console.error("북마크 에러:", err);
      toast({
        title: "북마크 실패",
        description: err instanceof Error ? err.message : "북마크 상태를 변경하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [agendasQueryKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas/bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/stats"] });
    },
  });

  // 4️⃣ [수정] 북마크 핸들러: 로그인 안되어있으면 팝업 띄우기
  const handleBookmarkClick = (agendaId: string, isBookmarked: boolean) => {
    if (!user) {
      setIsLoginOpen(true); // 로그인 팝업 열기
      return;
    }
    bookmarkMutation.mutate({ agendaId, isBookmarked });
  };

  const isLoading = categoriesLoading || agendasLoading;
  const hasError = categoriesError || agendasError;
  const spotlightAgendas = allAgendas.filter(
    (agenda) => agenda.status === spotlightSection,
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <TitleCard
          title="안건 보기"
          description="비슷한 목소리가 많이 모이면, 관리자가 안건으로 채택하게 됩니다."
        />
        {spotlightAgendas.length > 0 && spotlightConfig && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {spotlightConfig.emoji} {spotlightConfig.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter(spotlightSection);
                  document
                    .getElementById("agenda-list-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-muted-foreground text-sm"
                data-testid={spotlightConfig.testId}
              >
                더보기
              </Button>
            </div>
            <div className="flex gap-1 md:gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
              {spotlightAgendas.map((agenda) => (
                <div
                  key={agenda.id}
                  className="
                      shrink-0 snap-center
                      w-[60vw] min-w-[240px] 
                      h-[35vh] min-h-[220px] 
                      md:w-[22vw] md:min-w-[280px] 
                      md:h-[50vh] md:min-h-[300px]
                    "
                >
                  <OkAgendaCard
                    id={agenda.id}
                    title={agenda.title}
                    category={agenda.category?.name || "카테고리 없음"}
                    status={agenda.status}
                    content={agenda.description}
                    commentCount={agenda.voteCount}
                    bookmarkCount={agenda.bookmarkCount || 0}
                    isBookmarked={agenda.isBookmarked || false}
                    okinews={agenda.okinews}
                    imageUrl={agenda.imageUrl}
                    onClick={() => setLocation(`/agendas/${agenda.id}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {categoriesError ? (
          <div>카테고리 에러!</div>
        ) : !categoriesLoading && categories ? (
          <CategoryFilter
            categories={categories.map((c) => ({
              name: c.name,
              icons: c.icon,
            }))}
            selected={selectedCategoryName}
            onSelect={setSelectedCategoryName}
          />
        ) : null}

        <div className="flex items-center justify-between mb-3 mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-sort-dropdown"
              >
                {sortOption === "latest" && "최신순"}
                {sortOption === "views" && "조회수순"}
                {sortOption === "votes" && "투표순"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" data-testid="dropdown-sort-menu">
              <DropdownMenuItem onClick={() => setSortOption("latest")}>최신순</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("views")}>조회수순</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("votes")}>투표순</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-status-filter-dropdown"
              >
                <Filter className="mr-2 h-4 w-4" />
                {getStatusFilterLabel()}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              data-testid="dropdown-status-menu"
            >
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>전체</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("created")}>안건 생성</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("voting")}>투표 중</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("proposing")}>제안 중</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("answered")}>답변 완료</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("executing")}>실행 중</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("executed")}>실행 완료</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>반려됨</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="py-6 space-y-4" id="agenda-list-section">
          {hasError && agendasError ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center">
              안건 목록을 불러오는 데 실패했습니다.
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedAgendas.length > 0 ? (
            sortedAgendas.map((agenda) => (
              <AgendaCard
                key={agenda.id}
                id={agenda.id}
                title={agenda.title}
                category={agenda.category?.name || ""}
                status={agenda.status}
                commentCount={agenda.voteCount}
                bookmarkCount={agenda.bookmarkCount || 0}
                isBookmarked={agenda.isBookmarked || false}
                onClick={() => setLocation(`/agendas/${agenda.id}`)}
                onBookmarkClick={() =>
                  handleBookmarkClick(agenda.id, agenda.isBookmarked || false)
                }
              />
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">안건이 없어요</p>
            </div>
          )}
        </div>
      </main>

      {/* 5️⃣ [추가] 로그인 팝업 배치 */}
      <LoginDialog
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
      />
    </div>
  );
}