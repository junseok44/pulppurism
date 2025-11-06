import { useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import OpinionCard from "@/components/OpinionCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function OpinionListPage() {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const mockOpinions = [
    {
      id: "1",
      authorName: "김철수",
      content: "A초등학교 앞 도로가 너무 위험합니다. 아이들이 등하교할 때 차량 속도가 너무 빠르고, 횡단보도도 부족합니다. 과속방지턱과 신호등 설치가 시급합니다.",
      likeCount: 12,
      commentCount: 5,
      isLiked: true,
      timestamp: "2시간 전",
      isAuthor: true,
    },
    {
      id: "2",
      authorName: "이영희",
      content: "우리 동네 공원에서 밤늦게까지 술 마시고 소란을 피우는 사람들이 많아서 잠을 잘 수가 없습니다. CCTV 설치나 순찰 강화가 필요합니다.",
      likeCount: 8,
      commentCount: 3,
      timestamp: "5시간 전",
    },
    {
      id: "3",
      authorName: "박민수",
      content: "지역 도서관이 평일 저녁 6시에 문을 닫아서 직장인들은 이용하기 어렵습니다. 주말과 저녁 시간대 운영 연장을 건의합니다.",
      likeCount: 15,
      commentCount: 7,
      timestamp: "1일 전",
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="max-w-4xl mx-auto w-full px-4 pt-6 pb-4">
          <h2 className="text-2xl font-bold">주민의 목소리</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl mx-auto w-full px-4 pb-32 md:pb-20 space-y-4">
            {mockOpinions.map((opinion) => (
              <OpinionCard
                key={opinion.id}
                {...opinion}
                onClick={() => setLocation(`/opinion/${opinion.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
      <Button
        className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 h-14 px-6 rounded-full shadow-lg z-50 w-32 md:w-36"
        onClick={() => setLocation("/opinion/new")}
        data-testid="button-add-opinion"
      >
        <Plus className="w-5 h-5 mr-2" />
        <span className="font-semibold">제안하기</span>
      </Button>
      <MobileNav />
    </div>
  );
}
