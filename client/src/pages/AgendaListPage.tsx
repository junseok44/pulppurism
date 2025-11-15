import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CategoryFilter from "@/components/CategoryFilter";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import type { Agenda, Category } from "@shared/schema";
import OkAgendaCard from "@/components/OkAgendaCard";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  bookmarkCount?: number;
  isBookmarked?: boolean;
}

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

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
  const filteredAgendas = selectedCategoryName
    ? allAgendas.filter(
        (agenda) => agenda.category?.name === selectedCategoryName,
      )
    : allAgendas;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "초안";
      case "active":
        return "활성";
      case "voting":
        return "투표 중";
      case "closed":
        return "종료";
      case "implemented":
        return "시행됨";
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
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🔥 투표 진행 중
              </h2>
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
            ) : filteredAgendas.length > 0 ? (
              filteredAgendas.map((agenda) => (
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
