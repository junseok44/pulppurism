import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2, Edit, Plus, X, Trash2, Upload } from "lucide-react";
import VotingWidget from "@/components/VotingWidget";
import Timeline from "@/components/Timeline";
import OpinionCard from "@/components/OpinionCard";
import { Card } from "@/components/ui/card";
import { ExternalLink, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedStatus, setEditedStatus] = useState<"voting" | "reviewing" | "completed">("voting");
  const [editedOkinewsUrl, setEditedOkinewsUrl] = useState("");
  const [editedReferenceLinks, setEditedReferenceLinks] = useState<string[]>([]);
  const [editedReferenceFiles, setEditedReferenceFiles] = useState<string[]>([]);
  const [editedRegionalCases, setEditedRegionalCases] = useState<string[]>([]);
  const [newReferenceLink, setNewReferenceLink] = useState("");
  const [newRegionalCase, setNewRegionalCase] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user } = useQuery<User>({ 
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const { data: agenda, isLoading: agendaLoading, error: agendaError } = useQuery<AgendaWithCategory>({
    queryKey: [`/api/agendas/${agendaId}`],
    enabled: !!agendaId,
  });

  useEffect(() => {
    if (agenda) {
      console.log("AgendaDetailPage - Agenda data received:", {
        id: agenda.id,
        okinewsUrl: agenda.okinewsUrl,
        regionalCases: agenda.regionalCases,
        referenceLinks: agenda.referenceLinks,
        referenceFiles: agenda.referenceFiles,
      });
    }
  }, [agenda]);

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

  const updateAgendaMutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      description?: string;
      status?: "voting" | "reviewing" | "completed";
      okinewsUrl?: string | null;
      referenceLinks?: string[];
      referenceFiles?: string[];
      regionalCases?: string[];
    }) => {
      const res = await apiRequest("PATCH", `/api/agendas/${agendaId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
      setEditDialogOpen(false);
      toast({
        title: "안건이 수정되었습니다",
        description: "변경사항이 성공적으로 저장되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "수정 실패",
        description: "안건을 수정하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/agendas/${agendaId}/files`, {
        method: "POST",
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error("File upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.fileUrl && data.agenda) {
        setEditedReferenceFiles(data.agenda.referenceFiles || []);
        queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
        toast({
          title: "파일 업로드 완료",
          description: "파일이 성공적으로 업로드되었습니다.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "업로드 실패",
        description: "파일 업로드 중 오류가 발생했습니다.",
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

  const handleEditClick = () => {
    if (agenda) {
      setEditedTitle(agenda.title);
      setEditedDescription(agenda.description);
      setEditedStatus(agenda.status);
      setEditedOkinewsUrl(agenda.okinewsUrl || "");
      setEditedReferenceLinks(agenda.referenceLinks || []);
      setEditedReferenceFiles(agenda.referenceFiles || []);
      setEditedRegionalCases(agenda.regionalCases || []);
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    updateAgendaMutation.mutate({
      title: editedTitle,
      description: editedDescription,
      status: editedStatus,
      okinewsUrl: editedOkinewsUrl.trim() || null,
      referenceLinks: editedReferenceLinks,
      referenceFiles: editedReferenceFiles,
      regionalCases: editedRegionalCases,
    });
  };

  const handleAddReferenceLink = () => {
    if (newReferenceLink.trim()) {
      setEditedReferenceLinks([...editedReferenceLinks, newReferenceLink.trim()]);
      setNewReferenceLink("");
    }
  };

  const handleRemoveReferenceLink = (index: number) => {
    setEditedReferenceLinks(editedReferenceLinks.filter((_, i) => i !== index));
  };

  const handleRemoveReferenceFile = (index: number) => {
    setEditedReferenceFiles(editedReferenceFiles.filter((_, i) => i !== index));
  };

  const handleAddRegionalCase = () => {
    if (newRegionalCase.trim()) {
      setEditedRegionalCases([...editedRegionalCases, newRegionalCase.trim()]);
      setNewRegionalCase("");
    }
  };

  const handleRemoveRegionalCase = (index: number) => {
    setEditedRegionalCases(editedRegionalCases.filter((_, i) => i !== index));
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
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
            <div className="flex items-center gap-2">
              {(user as any)?.isAdmin && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleEditClick}
                  data-testid="button-edit-agenda"
                >
                  <Edit className="w-5 h-5" />
                </Button>
              )}
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

            <TabsContent value="references" className="space-y-6 mt-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">옥천신문</h3>
                {agenda?.okinewsUrl ? (
                  <Card 
                    className="p-6 hover-elevate active-elevate-2 cursor-pointer" 
                    data-testid="card-okinews-link"
                    onClick={() => window.open(agenda.okinewsUrl!, '_blank')}
                  >
                    <div className="flex items-center gap-4">
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h4 className="font-medium break-all">{agenda.okinewsUrl}</h4>
                        <p className="text-sm text-muted-foreground">옥천신문 기사</p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">아직 취재 전이에요. 취재를 요청해보세요.</p>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('http://www.okinews.com/bbs/writeForm.html?mode=input&table=bbs_43&category=', '_blank')}
                      data-testid="button-request-coverage"
                    >
                      취재 요청하기
                    </Button>
                  </Card>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">참고링크</h3>
                {agenda?.referenceLinks && agenda.referenceLinks.length > 0 ? (
                  agenda.referenceLinks.map((link, index) => (
                    <Card 
                      key={`link-${index}`} 
                      className="p-6 hover-elevate active-elevate-2 cursor-pointer" 
                      data-testid={`card-reference-link-${index}`}
                      onClick={() => window.open(link, '_blank')}
                    >
                      <div className="flex items-center gap-4">
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <h4 className="font-medium break-all">{link}</h4>
                          <p className="text-sm text-muted-foreground">외부 링크</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">등록된 참고링크가 없습니다.</p>
                  </Card>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">첨부파일</h3>
                {agenda?.referenceFiles && agenda.referenceFiles.length > 0 ? (
                  agenda.referenceFiles.map((file, index) => (
                    <Card 
                      key={`file-${index}`} 
                      className="p-6 hover-elevate active-elevate-2 cursor-pointer" 
                      data-testid={`card-reference-file-${index}`}
                      onClick={() => window.open(file, '_blank')}
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <h4 className="font-medium">{file.split('/').pop() || file}</h4>
                          <p className="text-sm text-muted-foreground">첨부 파일</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">등록된 첨부파일이 없습니다.</p>
                  </Card>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">타 지역 정책 사례</h3>
                {agenda?.regionalCases && agenda.regionalCases.length > 0 ? (
                  agenda.regionalCases.map((caseItem, index) => (
                    <Card 
                      key={`case-${index}`} 
                      className="p-6" 
                      data-testid={`card-regional-case-${index}`}
                    >
                      <p className="text-sm">{caseItem}</p>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">등록된 타 지역 정책 사례가 없습니다.</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-agenda" closeButtonTestId="button-close-edit-dialog">
          <DialogHeader>
            <DialogTitle>안건 수정</DialogTitle>
            <DialogDescription>
              안건의 정보를 수정하고 참고자료를 관리할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">제목</Label>
              <Input
                id="edit-title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="안건 제목을 입력하세요"
                data-testid="input-edit-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="안건 설명을 입력하세요"
                className="min-h-32"
                data-testid="textarea-edit-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">상태</Label>
              <Select value={editedStatus} onValueChange={(value: any) => setEditedStatus(value)}>
                <SelectTrigger id="edit-status" data-testid="select-edit-status">
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voting">투표중</SelectItem>
                  <SelectItem value="reviewing">검토중</SelectItem>
                  <SelectItem value="completed">답변 및 결과</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-okinews-url">옥천신문 링크</Label>
              <Input
                id="edit-okinews-url"
                value={editedOkinewsUrl}
                onChange={(e) => setEditedOkinewsUrl(e.target.value)}
                placeholder="http://www.okinews.com/..."
                data-testid="input-edit-okinews-url"
              />
            </div>

            <div className="space-y-2">
              <Label>참고 링크</Label>
              <div className="space-y-2">
                {editedReferenceLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <Input
                        value={link}
                        readOnly
                        className="w-full"
                        style={{ textOverflow: 'ellipsis' }}
                        title={link}
                        data-testid={`input-reference-link-${index}`}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveReferenceLink(index)}
                      data-testid={`button-remove-reference-link-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newReferenceLink}
                    onChange={(e) => setNewReferenceLink(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                    data-testid="input-add-reference-link"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddReferenceLink}
                    disabled={!newReferenceLink.trim()}
                    data-testid="button-add-reference-link"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>첨부 파일</Label>
              <div className="space-y-2">
                {editedReferenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0 flex items-center gap-2 p-2 border rounded-md overflow-hidden">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate min-w-0 flex-1 block" title={file.split('/').pop() || file}>{file.split('/').pop() || file}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveReferenceFile(index)}
                      data-testid={`button-remove-reference-file-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadFileMutation.isPending}
                    className="w-full"
                    data-testid="button-upload-file"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadFileMutation.isPending ? "업로드 중..." : "파일 업로드"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>타 지역 정책 사례</Label>
              <div className="space-y-2">
                {editedRegionalCases.map((caseItem, index) => (
                  <div key={index} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <Input
                        value={caseItem}
                        readOnly
                        className="w-full"
                        title={caseItem}
                        data-testid={`input-regional-case-${index}`}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRegionalCase(index)}
                      data-testid={`button-remove-regional-case-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newRegionalCase}
                    onChange={(e) => setNewRegionalCase(e.target.value)}
                    placeholder="예: 서울시 ○○구의 ○○ 정책 사례"
                    className="flex-1"
                    data-testid="input-add-regional-case"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddRegionalCase}
                    disabled={!newRegionalCase.trim()}
                    data-testid="button-add-regional-case"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateAgendaMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateAgendaMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
