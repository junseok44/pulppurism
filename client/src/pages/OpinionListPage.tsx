import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import OpinionCard from "@/components/OpinionCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface OpinionWithUser {
  id: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function OpinionListPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();

  const { data: opinions = [], isLoading } = useQuery<OpinionWithUser[]>({
    queryKey: ["/api/opinions"],
  });

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="max-w-4xl mx-auto w-full px-4 pt-6 pb-4">
          <h2 className="text-2xl font-bold">주민의 목소리</h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl mx-auto w-full px-4 pb-32 md:pb-20 space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                의견을 불러오는 중...
              </div>
            ) : opinions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                아직 등록된 의견이 없습니다. 첫 번째로 의견을 제안해보세요!
              </div>
            ) : (
              opinions.map((opinion) => (
                <OpinionCard
                  key={opinion.id}
                  id={opinion.id}
                  authorName={opinion.displayName || opinion.username}
                  authorAvatar={opinion.avatarUrl || undefined}
                  content={opinion.content}
                  likeCount={opinion.likes}
                  commentCount={0}
                  timestamp={formatDistanceToNow(new Date(opinion.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                  isAuthor={user?.id === opinion.userId}
                  onClick={() => setLocation(`/opinion/${opinion.id}`)}
                />
              ))
            )}
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
