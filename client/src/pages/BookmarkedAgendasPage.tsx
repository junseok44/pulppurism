import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import AgendaCard from "@/components/AgendaCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BookmarkedAgendasPage() {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const bookmarkedAgendas = [
    {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      status: "주민 투표",
      commentCount: 45,
      bookmarkCount: 23,
      isBookmarked: true,
    },
    {
      id: "2",
      title: "공원 내 야간 소음 문제 해결 방안",
      category: "환경",
      status: "검토 중",
      commentCount: 89,
      bookmarkCount: 56,
      isBookmarked: true,
    },
    {
      id: "3",
      title: "지역 도서관 운영 시간 연장 건의",
      category: "문화",
      status: "답변 완료",
      commentCount: 34,
      bookmarkCount: 12,
      isBookmarked: true,
    },
    {
      id: "4",
      title: "노후 놀이터 시설 개선 요청",
      category: "생활",
      status: "의견 접수",
      commentCount: 67,
      bookmarkCount: 45,
      isBookmarked: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/my")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <h2 className="text-2xl font-bold mb-6">즐겨찾기한 안건</h2>
        <div className="space-y-4">
          {bookmarkedAgendas.map((agenda) => (
            <AgendaCard
              key={agenda.id}
              {...agenda}
              onClick={() => setLocation(`/agenda/${agenda.id}`)}
            />
          ))}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
