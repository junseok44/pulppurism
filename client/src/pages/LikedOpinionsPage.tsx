import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import OpinionCard from "@/components/OpinionCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function LikedOpinionsPage() {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const likedOpinions = [
    {
      id: "1",
      authorName: "이영희",
      content: "우리 동네 공원에서 밤늦게까지 술 마시고 소란을 피우는 사람들이 많아서 잠을 잘 수가 없습니다. CCTV 설치나 순찰 강화가 필요합니다.",
      likeCount: 8,
      commentCount: 3,
      isLiked: true,
      timestamp: "5시간 전",
    },
    {
      id: "2",
      authorName: "박민수",
      content: "지역 도서관이 평일 저녁 6시에 문을 닫아서 직장인들은 이용하기 어렵습니다. 주말과 저녁 시간대 운영 연장을 건의합니다.",
      likeCount: 15,
      commentCount: 7,
      isLiked: true,
      timestamp: "1일 전",
    },
    {
      id: "3",
      authorName: "최지영",
      content: "버스 노선 개편이 필요합니다. 출퇴근 시간대 배차 간격이 너무 길어 불편합니다.",
      likeCount: 20,
      commentCount: 12,
      isLiked: true,
      timestamp: "2일 전",
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
        <h2 className="text-2xl font-bold mb-6">좋아요한 의견</h2>
        <div className="space-y-4">
          {likedOpinions.map((opinion) => (
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
