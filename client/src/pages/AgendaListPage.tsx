import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CategoryFilter from "@/components/CategoryFilter";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Filter, ChevronDown } from "lucide-react";
import type { Agenda, Category } from "@shared/schema";
import OkAgendaCard from "@/components/OkAgendaCard";
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

type AgendaStatus = "all" | "voting" | "reviewing" | "passed" | "rejected";
type SortOption = "latest" | "views" | "votes";
type SpotlightSection = "voting" | "passed" | "rejected";

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgendaStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("latest");

  const spotlightSection = useMemo<SpotlightSection>(() => {
    const sections: SpotlightSection[] = ["voting", "passed", "rejected"];
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
      case "voting":
        return "투표중";
      case "reviewing":
        return "검토중";
      case "passed":
        return "통과";
      case "rejected":
        return "반려";
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
      case "passed":
        return {
          emoji: "✅",
          title: "통과 된 안건",
          testId: "button-view-all-passed",
        };
      case "rejected":
        return {
          emoji: "❌",
          title: "반려 된 안건",
          testId: "button-view-all-rejected",
        };
    }
  };

  const spotlightConfig = getSpotlightConfig();

  const isLoading = categoriesLoading || agendasLoading;
  const hasError = categoriesError || agendasError;
  const spotlightAgendas = allAgendas.filter(
    (agenda) => agenda.status === spotlightSection,
  );

  return (
    <div className="h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" data-testid="heading-agendas">
              안건 현황
            </h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/search")}
              data-testid="button-search-agenda"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          {spotlightAgendas.length > 0 && (
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
                    className="w-[55vw] md:w-[18vw] md:min-w-[220px] h-[28vh] md:h-[50vh] md:min-h-[180px] snap-center"
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
          {/* 카테고리 필터 */}
          {categoriesError ? (
            <div>카테고리 에러!</div>
          ) : !categoriesLoading && categories ? (
            <CategoryFilter
              categories={categories.map((c) => ({
                name: c.name,
                icons: c.icon, // CategoryFilter는 icons를 prop으로 받음
              }))}
              selected={selectedCategoryName}
              onSelect={setSelectedCategoryName}
            />
          ) : null}

          {/* 정렬 및 필터 */}
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
              <DropdownMenuContent
                align="start"
                data-testid="dropdown-sort-menu"
              >
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
                  onClick={() => setStatusFilter("voting")}
                  data-testid="menu-item-filter-voting"
                >
                  투표중
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("reviewing")}
                  data-testid="menu-item-filter-reviewing"
                >
                  검토중
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("passed")}
                  data-testid="menu-item-filter-passed"
                >
                  통과
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("rejected")}
                  data-testid="menu-item-filter-rejected"
                >
                  반려
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex-1" id="agenda-list-section">
          <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
            {/* 안건 에러 체크 부분 */}
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
                  commentCount={agenda.voteCount} // 변수명 매핑
                  bookmarkCount={agenda.bookmarkCount || 0}
                  isBookmarked={agenda.isBookmarked || false}
                  onClick={() => setLocation(`/agendas/${agenda.id}`)}
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
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
