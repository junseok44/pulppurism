import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import OpinionCard from "@/components/OpinionCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function MyOpinionsPage() {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const myOpinions = [
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
      authorName: "김철수",
      content: "지역 도서관이 평일 저녁 6시에 문을 닫아서 직장인들은 이용하기 어렵습니다. 주말과 저녁 시간대 운영 연장을 건의합니다.",
      likeCount: 15,
      commentCount: 7,
      timestamp: "1일 전",
      isAuthor: true,
    },
    {
      id: "3",
      authorName: "김철수",
      content: "노후 놀이터 시설 개선이 필요합니다. 안전 점검과 함께 새로운 놀이 기구 설치를 요청드립니다.",
      likeCount: 8,
      commentCount: 3,
      timestamp: "3일 전",
      isAuthor: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/my")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <h2 className="text-2xl font-bold mb-6">내가 쓴 주민 의견</h2>
        <div className="space-y-4">
          {myOpinions.map((opinion) => (
            <OpinionCard
              key={opinion.id}
              {...opinion}
              onClick={() => setLocation(`/opinion/${opinion.id}`)}
            />
          ))}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
