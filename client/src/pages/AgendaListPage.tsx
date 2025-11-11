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

interface AgendaWithCategory extends Agenda {
  category?: Category;
  bookmarkCount?: number;
  isBookmarked?: boolean;
}

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectedCategory = categories?.find(c => c.name === selectedCategoryName);
  const selectedCategoryId = selectedCategory?.id;

  const agendasQueryKey = selectedCategoryId 
    ? `/api/agendas?categoryId=${selectedCategoryId}`
    : "/api/agendas";

  const { data: agendas, isLoading: agendasLoading, error: agendasError } = useQuery<AgendaWithCategory[]>({
    queryKey: [agendasQueryKey],
    enabled: !categoriesLoading,
  });

  const filteredAgendas = agendas || [];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "초안";
      case "active": return "활성";
      case "voting": return "투표 중";
      case "closed": return "종료";
      case "implemented": return "시행됨";
      default: return status;
    }
  };

  const isLoading = categoriesLoading || agendasLoading;
  const hasError = categoriesError || agendasError;

  return (
    <div className="h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-5xl mx-auto w-full px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" data-testid="heading-agendas">안건 현황</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/search")}
              data-testid="button-search-agenda"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          {categoriesError ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md" data-testid="error-categories">
              카테고리를 불러오는 데 실패했습니다.
            </div>
          ) : !categoriesLoading && categories && (
            <CategoryFilter
              categories={categories.map(c => c.name)}
              selected={selectedCategoryName}
              onSelect={setSelectedCategoryName}
            />
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
            {hasError && agendasError ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center" data-testid="error-agendas">
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
                  commentCount={agenda.voteCount}
                  bookmarkCount={agenda.bookmarkCount || 0}
                  isBookmarked={agenda.isBookmarked || false}
                  onClick={() => setLocation(`/agendas/${agenda.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg" data-testid="text-no-agendas">안건이 없어요</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
