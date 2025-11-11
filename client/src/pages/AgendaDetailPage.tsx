import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2 } from "lucide-react";
import VotingWidget from "@/components/VotingWidget";
import Timeline from "@/components/Timeline";
import OpinionCard from "@/components/OpinionCard";
import { Card } from "@/components/ui/card";
import { ExternalLink, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Agenda, Category, Opinion, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  isBookmarked?: boolean;
}

interface VoteStats {
  total: number;
  agree: number;
  disagree: number;
  neutral: number;
}

interface Vote {
  id: string;
  userId: string;
  agendaId: string;
  voteType: "agree" | "disagree" | "neutral";
}

export default function AgendaDetailPage() {
  const [, setLocation] = useLocation();
  const [comment, setComment] = useState("");
  const [match, params] = useRoute("/agendas/:id");
  const agendaId = params?.id;
  const { toast } = useToast();

  const { data: user } = useQuery<User>({ 
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const { data: agenda, isLoading: agendaLoading, error: agendaError } = useQuery<AgendaWithCategory>({
    queryKey: [`/api/agendas/${agendaId}`],
    enabled: !!agendaId,
  });

  const { data: voteStats, isLoading: voteStatsLoading } = useQuery<VoteStats>({
    queryKey: [`/api/agendas/${agendaId}/votes`],
    enabled: !!agendaId,
  });

  const { data: userVote } = useQuery<Vote | null>({
    queryKey: [`/api/votes/user/${user?.id}/agenda/${agendaId}`],
    enabled: !!agendaId && !!user,
  });

  const { data: relatedOpinions = [], isLoading: opinionsLoading } = useQuery<Opinion[]>({
    queryKey: [`/api/agendas/${agendaId}/opinions`],
    enabled: !!agendaId,
  });

  const voteMutation = useMutation({
    mutationFn: async (voteType: "agree" | "disagree" | "neutral") => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const res = await apiRequest("POST", "/api/votes", {
        userId: user.id,
        agendaId,
        voteType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}/votes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/votes/user/${user?.id}/agenda/${agendaId}`] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (isBookmarked: boolean) => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/agendas/${agendaId}/bookmark`);
      } else {
        await apiRequest("POST", `/api/agendas/${agendaId}/bookmark`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/agendas/bookmarked'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/stats'] });
    },
  });

  const handleBookmarkClick = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "북마크 기능을 사용하려면 로그인해주세요.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    bookmarkMutation.mutate(agenda?.isBookmarked || false);
  };

  const opinionMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const res = await apiRequest("POST", `/api/agendas/${agendaId}/opinions`, {
        content,
        type: "text",
      });
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      toast({
        title: "의견이 제출되었습니다",
        description: "의견이 안건에 자동으로 연결되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}/opinions`] });
    },
    onError: (error) => {
      toast({
        title: "의견 제출 실패",
        description: "의견을 제출하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "의견을 작성하려면 로그인해주세요.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    if (comment.trim()) {
      opinionMutation.mutate(comment);
    }
  };

  const handleVote = (voteType: "agree" | "disagree" | "neutral") => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "투표 기능을 사용하려면 로그인해주세요.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    voteMutation.mutate(voteType);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "voting": return "투표중";
      case "reviewing": return "검토중";
      case "completed": return "답변 및 결과";
      default: return status;
    }
  };

  const getTimelineSteps = (status: string, createdAt: string) => {
    const createdDate = new Date(createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');

    const steps = [
      { 
        label: "안건 생성", 
        status: "completed" as const,
        date: createdDate
      },
      { 
        label: "투표중", 
        status: status === "voting" ? "current" as const : (status === "reviewing" || status === "completed" ? "completed" as const : "upcoming" as const)
      },
      { 
        label: "검토중", 
        status: status === "reviewing" ? "current" as const : (status === "completed" ? "completed" as const : "upcoming" as const)
      },
      { 
        label: "답변 및 결과", 
        status: status === "completed" ? "current" as const : "upcoming" as const
      },
    ];

    return steps;
  };

  const timelineSteps = agenda ? getTimelineSteps(agenda.status, String(agenda.createdAt)) : [];

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="w-full h-64 bg-muted rounded-lg overflow-hidden" data-testid="agenda-hero-image">
            <img 
              src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop" 
              alt="안건 대표 이미지"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'%3E%3Crect width='1200' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3E안건 이미지%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{agenda.category?.name || "기타"}</Badge>
                <Badge variant="outline">{getStatusLabel(agenda.status)}</Badge>
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-agenda-title">
                {agenda.title}
              </h1>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleBookmarkClick}
              disabled={bookmarkMutation.isPending}
              data-testid="button-bookmark"
            >
              <Bookmark className={`w-5 h-5 ${agenda?.isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" data-testid="tab-overview">개요</TabsTrigger>
              <TabsTrigger value="opinions" data-testid="tab-opinions">주민의견</TabsTrigger>
              <TabsTrigger value="references" data-testid="tab-references">참고자료</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">안건 소개</h2>
                <p className="text-base leading-relaxed" data-testid="text-description">
                  {agenda.description}
                </p>
              </div>

              <VotingWidget
                agreeCount={voteStats?.agree || 0}
                neutralCount={voteStats?.neutral || 0}
                disagreeCount={voteStats?.disagree || 0}
                userVote={userVote?.voteType}
                onVote={handleVote}
                disabled={voteMutation.isPending}
              />

              <Timeline steps={timelineSteps} />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">답변 및 결과</h2>
                <Card className="p-6">
                  <p className="text-muted-foreground">
                    현재 주민 투표가 진행 중입니다. 투표 완료 후 공식 답변이 등록됩니다.
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="opinions" className="space-y-4 mt-6 pb-32">
              {opinionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : relatedOpinions.length > 0 ? (
                relatedOpinions.map((opinion) => (
                  <OpinionCard
                    key={opinion.id}
                    id={opinion.id}
                    authorName="익명"
                    content={opinion.content}
                    likeCount={opinion.likes}
                    commentCount={0}
                    timestamp={new Date(opinion.createdAt).toLocaleDateString('ko-KR')}
                    onClick={() => setLocation(`/opinion/${opinion.id}`)}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">관련 의견이 없습니다.</p>
                </div>
              )}
              
              <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-card border-t border-card-border p-4 z-30">
                <div className="max-w-7xl mx-auto flex gap-3">
                  <Textarea
                    placeholder="이 안건에 대한 의견을 입력하세요..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
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
            </TabsContent>

            <TabsContent value="references" className="space-y-4 mt-6">
              <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-reference-1">
                <div className="flex items-center gap-4">
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <h3 className="font-medium">타지역 과속방지턱 설치 사례</h3>
                    <p className="text-sm text-muted-foreground">
                      서울시 강남구 B초등학교 사례 분석
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-reference-2">
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <h3 className="font-medium">교통안전시설 설치 가이드라인.pdf</h3>
                    <p className="text-sm text-muted-foreground">PDF · 2.4 MB</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
