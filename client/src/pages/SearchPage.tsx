import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const allAgendas = [
    {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      status: "주민 투표",
      commentCount: 45,
      bookmarkCount: 23,
    },
    {
      id: "2",
      title: "공원 내 야간 소음 문제 해결 방안",
      category: "환경",
      status: "검토 중",
      commentCount: 89,
      bookmarkCount: 56,
    },
    {
      id: "3",
      title: "지역 도서관 운영 시간 연장 건의",
      category: "문화",
      status: "답변 완료",
      commentCount: 34,
      bookmarkCount: 12,
    },
  ];

  const filteredAgendas = searchQuery
    ? allAgendas.filter((agenda) =>
        agenda.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
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
              {filteredAgendas.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {filteredAgendas.length}개의 검색 결과
                  </p>
                  {filteredAgendas.map((agenda) => (
                    <AgendaCard
                      key={agenda.id}
                      {...agenda}
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
