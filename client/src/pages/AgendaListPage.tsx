import { useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CategoryFilter from "@/components/CategoryFilter";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Clock, CheckCircle, Pause } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = ["돌봄", "의료", "환경", "교육", "생활", "교통", "경제", "문화", "정치", "행정", "복지"];

  // todo: remove mock functionality
  const mockAgendas = [
    {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      status: "주민 투표",
      commentCount: 45,
      bookmarkCount: 23,
      isBookmarked: true,
      votes: { agree: 145, neutral: 23, disagree: 12 },
    },
    {
      id: "2",
      title: "공원 내 야간 소음 문제 해결 방안",
      category: "환경",
      status: "검토 중",
      commentCount: 89,
      bookmarkCount: 56,
      votes: { agree: 98, neutral: 15, disagree: 8 },
    },
    {
      id: "3",
      title: "지역 도서관 운영 시간 연장 건의",
      category: "문화",
      status: "답변 완료",
      commentCount: 34,
      bookmarkCount: 12,
      votes: { agree: 78, neutral: 10, disagree: 5 },
    },
    {
      id: "4",
      title: "노후 놀이터 시설 개선 요청",
      category: "생활",
      status: "의견 접수",
      commentCount: 67,
      bookmarkCount: 45,
      votes: { agree: 52, neutral: 8, disagree: 3 },
    },
    {
      id: "5",
      title: "버스 노선 증편 요청",
      category: "교통",
      status: "진행 중",
      commentCount: 28,
      bookmarkCount: 18,
      votes: { agree: 65, neutral: 5, disagree: 2 },
    },
  ];

  const stats = {
    total: mockAgendas.length,
    voting: mockAgendas.filter((a) => a.status === "주민 투표").length,
    inProgress: mockAgendas.filter((a) => a.status === "진행 중" || a.status === "검토 중").length,
    completed: mockAgendas.filter((a) => a.status === "답변 완료").length,
  };

  const getStatusFilter = (agenda: any) => {
    switch (statusFilter) {
      case "voting":
        return agenda.status === "주민 투표";
      case "progress":
        return agenda.status === "진행 중" || agenda.status === "검토 중";
      case "completed":
        return agenda.status === "답변 완료";
      default:
        return true;
    }
  };

  const filteredAgendas = mockAgendas
    .filter((a) => (selectedCategory ? a.category === selectedCategory : true))
    .filter(getStatusFilter);

  return (
    <div className="h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-5xl mx-auto w-full px-4 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">안건 현황</h2>
              <p className="text-sm text-muted-foreground">
                주민들과 함께 만들어가는 우리 동네
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/search")}
              data-testid="button-search-agenda"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card
              className={`p-4 cursor-pointer transition-all ${
                statusFilter === "all"
                  ? "border-primary bg-primary/5"
                  : "hover-elevate"
              }`}
              onClick={() => setStatusFilter("all")}
              data-testid="card-stat-total"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">전체 안건</p>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all ${
                statusFilter === "voting"
                  ? "border-primary bg-primary/5"
                  : "hover-elevate"
              }`}
              onClick={() => setStatusFilter("voting")}
              data-testid="card-stat-voting"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">투표 중</p>
              </div>
              <p className="text-2xl font-bold">{stats.voting}</p>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all ${
                statusFilter === "progress"
                  ? "border-primary bg-primary/5"
                  : "hover-elevate"
              }`}
              onClick={() => setStatusFilter("progress")}
              data-testid="card-stat-progress"
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">진행 중</p>
              </div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all ${
                statusFilter === "completed"
                  ? "border-primary bg-primary/5"
                  : "hover-elevate"
              }`}
              onClick={() => setStatusFilter("completed")}
              data-testid="card-stat-completed"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">완료</p>
              </div>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </Card>
          </div>

          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
            {filteredAgendas.length > 0 ? (
              filteredAgendas.map((agenda) => (
                <AgendaCard
                  key={agenda.id}
                  {...agenda}
                  onClick={() => setLocation(`/agenda/${agenda.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  {selectedCategory
                    ? `'${selectedCategory}' 카테고리에 안건이 없어요`
                    : "안건이 없어요"}
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
