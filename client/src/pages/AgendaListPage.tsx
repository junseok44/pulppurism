import { useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CategoryFilter from "@/components/CategoryFilter";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";

export default function AgendaListPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("");

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
    {
      id: "4",
      title: "노후 놀이터 시설 개선 요청",
      category: "생활",
      status: "의견 접수",
      commentCount: 67,
      bookmarkCount: 45,
    },
  ];

  const filteredAgendas = selectedCategory
    ? mockAgendas.filter((a) => a.category === selectedCategory)
    : mockAgendas;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header title="안건" />
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {filteredAgendas.map((agenda) => (
          <AgendaCard
            key={agenda.id}
            {...agenda}
            onClick={() => setLocation(`/agenda/${agenda.id}`)}
          />
        ))}
      </div>
      <MobileNav />
    </div>
  );
}
