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

type AgendaStatus = "all" | "created" | "voting" | "proposing" | "answered" | "executing" | "executed";
type SortOption = "latest" | "views" | "votes";
type SpotlightSection = "voting" | "executed";

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgendaStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const { toast } = useToast();
  const { user } = useUser();

  const spotlightSection = useMemo<SpotlightSection>(() => {
    const sections: SpotlightSection[] = ["voting", "executed"];
    return sections[Math.floor(Math.random() * sections.length)];
  }, []);

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectedCategory = categories?.find(
    (c) => c.name === selectedCategoryName,
  );
  const selectedCategoryId = selectedCategory?.id;

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
      case "all":
        return "전체";
      case "created":
        return "안건 생성";
      case "voting":
        return "투표 중";
      case "proposing":
        return "제안 중";
      case "answered":
        return "답변 완료";
      case "executing":
        return "실행 중";
      case "executed":
        return "실행 완료";
      default:
        return "진행상황에 따라 보기";
    }
  };

  const getSpotlightConfig = () => {
    switch (spotlightSection) {
      case "voting":
        return {
          emoji: "🔥",
          title: "투표 진행 중",
          testId: "button-view-all-voting",
        };
      case "executed":
        return {
          emoji: "✅",
          title: "실행 완료 된 안건",
          testId: "button-view-all-executed",
        };
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
      // Optimistic update: 즉시 UI 업데이트
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
      // 에러 발생 시 이전 상태로 롤백
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
      // 성공 시 쿼리 무효화하여 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: [agendasQueryKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas/bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/stats"] });
    },
  });

  const handleBookmarkClick = (agendaId: string, isBookmarked: boolean) => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "북마크 기능을 사용하려면 로그인해주세요.",
        variant: "destructive",
      });
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
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
              {spotlightAgendas.map((agenda) => (
                <div
                  key={agenda.id}
                  className="w-[42vw] min-w-[130px] md:w-[18vw] md:min-w-[220px] h-[30vh] md:h-[50vh] md:min-h-[180px] snap-center"
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
              <DropdownMenuItem
                onClick={() => setSortOption("latest")}
                data-testid="menu-item-sort-latest"
              >
                최신순
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption("views")}
                data-testid="menu-item-sort-views"
              >
                조회수순
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption("votes")}
                data-testid="menu-item-sort-votes"
              >
                투표순
              </DropdownMenuItem>
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
              <DropdownMenuItem
                onClick={() => setStatusFilter("all")}
                data-testid="menu-item-filter-all"
              >
                전체
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("created")}
                data-testid="menu-item-filter-created"
              >
                안건 생성
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("voting")}
                data-testid="menu-item-filter-voting"
              >
                투표 중
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("proposing")}
                data-testid="menu-item-filter-proposing"
              >
                제안 중
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("answered")}
                data-testid="menu-item-filter-answered"
              >
                답변 완료
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
        </div>

        <div className="py-6 space-y-4" id="agenda-list-section">
          {hasError && agendasError ? (
            <div
              className="p-4 bg-destructive/10 text-destructive rounded-md text-center"
              data-testid="error-agendas"
            >
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
              <p
                className="text-muted-foreground text-lg"
                data-testid="text-no-agendas"
              >
                안건이 없어요
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
