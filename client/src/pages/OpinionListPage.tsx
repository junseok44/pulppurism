import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import OpinionCard from "@/components/OpinionCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useRef } from "react";
import TitleCard from "@/components/TitleCard";

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

const PAGE_SIZE = 20;

export default function OpinionListPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<OpinionWithUser[]>({
    queryKey: ["/api/opinions", "infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/opinions?limit=${PAGE_SIZE}&offset=${pageParam}`
      );
      if (!response.ok) throw new Error("Failed to fetch opinions");
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });

  const opinions = data?.pages.flatMap((page) => page) ?? [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto w-full px-4 pt-12">
        <TitleCard
          title="주민의 목소리 🫒"
          description="우리 마을에 필요한 것이 있나요? 여러분의 생각을 자유롭게 남겨주세요."
        />
        </div>
        <div className="flex-1 min-h-0">
          <div className="max-w-4xl mx-auto w-full px-4 space-y-4 min-h-full">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                의견을 불러오는 중...
              </div>
            ) : opinions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                아직 등록된 의견이 없습니다. 첫 번째로 의견을 제안해보세요!
              </div>
            ) : (
              <>
                {opinions.map((opinion) => (
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
                ))}
                
                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="py-8">
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>더 많은 의견을 불러오는 중...</span>
                    </div>
                  )}
                  {!hasNextPage && opinions.length > 0 && (
                    <div className="text-center text-muted-foreground">
                      모든 의견을 불러왔습니다
                    </div>
                  )}
                </div>
              </>
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
