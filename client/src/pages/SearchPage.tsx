import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Agenda, Category } from "@shared/schema";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  bookmarkCount?: number;
  isBookmarked?: boolean;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // 실제 안건 데이터 가져오기
  const {
    data: allAgendas,
    isLoading: agendasLoading,
    error: agendasError,
  } = useQuery<AgendaWithCategory[]>({
    queryKey: ["/api/agendas"],
  });

  // 제목으로 검색 필터링
  const filteredAgendas = useMemo(() => {
    if (!searchQuery.trim() || !allAgendas) return [];
    const query = searchQuery.toLowerCase().trim();
    return allAgendas.filter((agenda) =>
      agenda.title.toLowerCase().includes(query)
    );
  }, [searchQuery, allAgendas]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* 뒤로 가기 버튼 */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/agendas")}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="안건 제목을 검색하세요..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              data-testid="input-search"
            />
          </div>

          {searchQuery && (
            <div className="space-y-4">
              {agendasLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : agendasError ? (
                <div className="text-center py-12">
                  <p className="text-destructive">
                    안건을 불러오는 데 실패했습니다.
                  </p>
                </div>
              ) : filteredAgendas.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {filteredAgendas.length}개의 검색 결과
                  </p>
                  {filteredAgendas.map((agenda) => (
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
                    />
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    검색 결과가 없습니다
                  </p>
                </div>
              )}
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                안건 제목을 검색해보세요
              </p>
            </div>
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
