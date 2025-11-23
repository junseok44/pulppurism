import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import AgendaHeader from "@/components/AgendaHeader";
import OpinionCard from "@/components/OpinionCard";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Agenda, Category, Opinion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  isBookmarked?: boolean;
}

export default function AgendaOpinionsPage() {
  const [, setLocation] = useLocation();
  const [comment, setComment] = useState("");
  const [match, params] = useRoute("/agendas/:id/opinions");
  const agendaId = params?.id;
  const { toast } = useToast();

  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const { user } = useUser();

  const {
    data: agenda,
    isLoading: agendaLoading,
    error: agendaError,
  } = useQuery<AgendaWithCategory>({
    queryKey: [`/api/agendas/${agendaId}`],
    enabled: !!agendaId,
  });

  const { data: relatedOpinions = [], isLoading: opinionsLoading } = useQuery<
    Opinion[]
  >({
    queryKey: [`/api/agendas/${agendaId}/opinions`],
    enabled: !!agendaId,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (isBookmarked: boolean) => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/agendas/${agendaId}/bookmark`);
      } else {
        await apiRequest("POST", `/api/agendas/${agendaId}/bookmark`);
      }
    },
    onMutate: async (isBookmarked: boolean) => {
      // Optimistic update: 즉시 UI 업데이트
      await queryClient.cancelQueries({ queryKey: [`/api/agendas/${agendaId}`] });
      
      const previousAgenda = queryClient.getQueryData<AgendaWithCategory>([`/api/agendas/${agendaId}`]);
      
      if (previousAgenda) {
        queryClient.setQueryData<AgendaWithCategory>([`/api/agendas/${agendaId}`], {
          ...previousAgenda,
          isBookmarked: !isBookmarked,
        });
      }
      
      return { previousAgenda };
    },
    onError: (err, isBookmarked, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousAgenda) {
        queryClient.setQueryData([`/api/agendas/${agendaId}`], context.previousAgenda);
      }
      toast({
        title: "북마크 실패",
        description: "북마크 상태를 변경하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // 성공 시 쿼리 무효화하여 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas/bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/stats"] });
    },
  });

  const handleBookmarkClick = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "북마크 기능을 사용하려면 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }
    bookmarkMutation.mutate(agenda?.isBookmarked || false);
  };

  const opinionMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const res = await apiRequest(
        "POST",
        `/api/agendas/${agendaId}/opinions`,
        {
          content,
          type: "text",
        },
      );
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      toast({
        title: "의견이 제출되었습니다",
        description: "의견이 안건에 자동으로 연결되었습니다.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/agendas/${agendaId}/opinions`],
      });
    },
    onError: (error: any) => {
      console.error("Opinion submission error:", error);
      toast({
        title: "의견 제출 실패",
        description: error?.message || "의견을 제출하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "의견을 등록하려면 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!comment.trim()) {
      toast({
        title: "의견을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    if (!agendaId) {
      toast({
        title: "오류",
        description: "안건 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    opinionMutation.mutate(comment.trim());
  };

  const handleCommentFocus = () => {
    if (!user) {
      setShowLoginDialog(true);
    }
  };

  if (!match || !agendaId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">안건을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (agendaError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center">
            안건을 불러오는 데 실패했습니다.
          </div>
        </div>
      </div>
    );
  }

  if (agendaLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">안건을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto pb-32 md:pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="space-y-6">
            <AgendaHeader
              agenda={agenda}
              user={user}
              onBookmarkClick={handleBookmarkClick}
              bookmarkLoading={bookmarkMutation.isPending}
              showBackButton={true}
            />

            <div className="space-y-6">
              <h2 className="text-xl font-semibold">주민의견</h2>
              
              {opinionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : relatedOpinions.length > 0 ? (
                <div className="space-y-4">
                  {relatedOpinions.map((opinion) => (
                    <OpinionCard
                      key={opinion.id}
                      id={opinion.id}
                      authorName="익명"
                      content={opinion.content}
                      likeCount={opinion.likes}
                      commentCount={0}
                      timestamp={new Date(opinion.createdAt).toLocaleDateString(
                        "ko-KR",
                      )}
                      onClick={() => setLocation(`/opinion/${opinion.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">관련 의견이 없습니다.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-card border-t border-card-border p-4 z-30">
        <div className="max-w-5xl mx-auto flex gap-3">
          <Textarea
            placeholder="이 안건에 대한 의견을 입력하세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={handleCommentFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleCommentSubmit();
              }
            }}
            className="min-h-12 resize-none"
            data-testid="input-agenda-comment"
          />
          <Button
            onClick={handleCommentSubmit}
            disabled={!comment.trim() || opinionMutation.isPending}
            className="self-end"
            data-testid="button-submit-agenda-comment"
          >
            {opinionMutation.isPending ? "제출 중..." : "등록"}
          </Button>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}

