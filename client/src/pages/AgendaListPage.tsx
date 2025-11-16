import { useState } from "react";
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

type AgendaStatus = "all" | "voting" | "reviewing" | "completed";
type SortOption = "latest" | "views" | "votes";

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgendaStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("latest");

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
      (agenda) => agenda.status === statusFilter
    );
  }
  
  if (selectedCategoryName) {
    filteredAgendas = filteredAgendas.filter(
      (agenda) => agenda.category?.name === selectedCategoryName
    );
  }

  const sortedAgendas = [...filteredAgendas].sort((a, b) => {
    switch (sortOption) {
      case "latest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      case "completed":
        return "완료";
      default:
        return "진행상황에 따라 보기";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "voting":
        return "투표중";
      case "reviewing":
        return "검토중";
      case "completed":
        return "완료";
      default:
        return status;
    }
  };

  const isLoading = categoriesLoading || agendasLoading;
  const hasError = categoriesError || agendasError;
  const votingAgendas = allAgendas.filter(
    (agenda) => agenda.status === "voting",
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
          {votingAgendas.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  🔥 투표 진행 중
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/agendas/voting")}
                  className="text-muted-foreground text-sm"
                  data-testid="button-view-all-voting"
                >
                  더보기
                </Button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                {votingAgendas.map((agenda) => (
                  <div
                    key={agenda.id}
                    // 👇 모바일: 화면 너비의 85% 차지 (옆에 다음 카드가 살짝 보여서 넘기고 싶게 만듦)
                    // // 👇 PC(md): 너무 커지면 안 되니까 360px 정도로 고정
                    className="w-[42vw] md:w-[18vw] md:min-w-[220px] h-[30vh] md:h-[50vh] md:min-h-[180px] snap-center"
                  >
                    <OkAgendaCard
                      id={agenda.id}
                      title={agenda.title}
                      // ★ 여기가 핵심! 객체에서 .name만 쏙 빼서 넣어줘야 해!
                      category={agenda.category?.name || "카테고리 없음"}
                      status={getStatusLabel(agenda.status)}
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
          {/* 정렬 및 필터 */}
          <div className="flex items-center justify-between mb-3">
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
              <DropdownMenuContent align="end" data-testid="dropdown-status-menu">
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
                  onClick={() => setStatusFilter("completed")}
                  data-testid="menu-item-filter-completed"
                >
                  완료
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 카테고리 에러 체크 부분인데, 위에서 null로 막아둬서 무조건 통과됨 */}
          {categoriesError ? (
            <div>카테고리 에러!</div>
          ) : !categoriesLoading && categories ? ( // 👈 1. 로딩 중인지 확인! 2. 데이터 있는지 확인!
            <CategoryFilter
              categories={categories.map((c) => ({
                name: c.name,
                icons: c.icon,
              }))}
              selected={selectedCategoryName}
              onSelect={setSelectedCategoryName}
            />
          ) : null}
        </div>
        <div className="flex-1">
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
                  status={getStatusLabel(agenda.status)}
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
