import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import AgendaHeader from "@/components/AgendaHeader";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, Trash2, Upload, ChevronRight } from "lucide-react";
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
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Agenda, Category, Opinion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { SiGoogle, SiKakaotalk } from "react-icons/si";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";

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

interface ExecutionTimelineItem {
  id: string;
  agendaId: string;
  userId: string;
  authorName: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
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
  const [editedStatus, setEditedStatus] = useState<
    "created" | "voting" | "proposing" | "answered" | "executing" | "executed"
  >("created");
  const [editedResponse, setEditedResponse] = useState("");
  const [editedOkinewsUrl, setEditedOkinewsUrl] = useState("");
  const [editedReferenceLinks, setEditedReferenceLinks] = useState<string[]>(
    [],
  );
  const [editedReferenceFiles, setEditedReferenceFiles] = useState<string[]>(
    [],
  );
  const [editedRegionalCases, setEditedRegionalCases] = useState<string[]>([]);
  const [newReferenceLink, setNewReferenceLink] = useState("");
  const [newRegionalCase, setNewRegionalCase] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timelineItems, setTimelineItems] = useState<
    Array<{
      id: string;
      authorName: string;
      content: string;
      image: File | null;
      date: string;
      imagePreview?: string;
      existingImageUrl?: string; // 기존 아이템의 이미지 URL
    }>
  >([]);
  const timelineImageInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const [showOkinewsForm, setShowOkinewsForm] = useState(false);
  const [showReferenceLinkForm, setShowReferenceLinkForm] = useState(false);
  const [showRegionalCaseForm, setShowRegionalCaseForm] = useState(false);
  const [tempOkinewsUrl, setTempOkinewsUrl] = useState("");
  const [tempReferenceLink, setTempReferenceLink] = useState("");
  const [tempRegionalCase, setTempRegionalCase] = useState("");
  
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [providers, setProviders] = useState<{google: boolean; kakao: boolean} | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then(res => res.json())
      .then(data => setProviders(data))
      .catch(() => setProviders({ google: false, kakao: false }));
  }, []);

  const { user } = useUser();

  const {
    data: agenda,
    isLoading: agendaLoading,
    error: agendaError,
  } = useQuery<AgendaWithCategory>({
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

  const { data: relatedOpinions = [], isLoading: opinionsLoading } = useQuery<
    Opinion[]
  >({
    queryKey: [`/api/agendas/${agendaId}/opinions`],
    enabled: !!agendaId,
  });

  const { data: executionTimelineItems = [], isLoading: executionTimelineLoading } = useQuery<
    ExecutionTimelineItem[]
  >({
    queryKey: [`/api/agendas/${agendaId}/execution-timeline`],
    enabled: !!agendaId && agenda?.status === "executing",
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
      queryClient.invalidateQueries({
        queryKey: [`/api/agendas/${agendaId}/votes`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/votes/user/${user?.id}/agenda/${agendaId}`],
      });
    },
  });

  const deleteVoteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      await apiRequest("DELETE", `/api/votes/user/${user.id}/agenda/${agendaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/agendas/${agendaId}/votes`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/votes/user/${user?.id}/agenda/${agendaId}`],
      });
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
      // 로그인 다이얼로그를 열기 위해 Header 컴포넌트에 접근할 수 없으므로
      // 홈으로 이동하거나 현재 페이지에 로그인 다이얼로그 표시
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
      status?: "created" | "voting" | "proposing" | "answered" | "executing" | "executed";
      response?: string | null;
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
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("File upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.fileUrl && data.agenda) {
        setEditedReferenceFiles(data.agenda.referenceFiles || []);
        queryClient.invalidateQueries({
          queryKey: [`/api/agendas/${agendaId}`],
        });
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

  const saveTimelineItemsMutation = useMutation({
    mutationFn: async (items: Array<{ id?: string; authorName: string; content: string; image?: File; date: string; existingImageUrl?: string; imagePreview?: string }>) => {
      const results = await Promise.all(
        items.map(async (item) => {
          const isExisting = item.id && !item.id.startsWith("temp-");
          
          if (isExisting) {
            // 기존 아이템 수정 (PATCH)
            const formData = new FormData();
            formData.append("authorName", item.authorName);
            formData.append("content", item.content);
            formData.append("createdAt", item.date);
            if (item.image) {
              formData.append("image", item.image);
            } else if (!item.existingImageUrl && item.imagePreview) {
              // 기존 이미지가 있었는데 제거된 경우
              formData.append("removeImage", "true");
            }
            
            const res = await fetch(`/api/agendas/${agendaId}/execution-timeline/${item.id}`, {
              method: "PATCH",
              body: formData,
              credentials: "include",
            });
            
            const contentType = res.headers.get("content-type") || "";
            const responseText = await res.text();
            
            if (!res.ok) {
              let errorMessage = `Failed to update timeline item (${res.status} ${res.statusText})`;
              if (contentType.includes("application/json")) {
                try {
                  const errorData = JSON.parse(responseText);
                  errorMessage = errorData.error?.message || errorData.error || errorData.message || errorMessage;
                } catch (e) {
                  console.error("Failed to parse error JSON:", e);
                }
              }
              throw new Error(errorMessage);
            }
            
            if (!contentType.includes("application/json")) {
              throw new Error("Server returned non-JSON response");
            }
            
            return JSON.parse(responseText);
          } else {
            // 새 아이템 생성 (POST)
            const formData = new FormData();
            formData.append("authorName", item.authorName);
            formData.append("content", item.content);
            formData.append("createdAt", item.date);
            if (item.image) {
              formData.append("image", item.image);
            }
            
            const res = await fetch(`/api/agendas/${agendaId}/execution-timeline`, {
              method: "POST",
              body: formData,
              credentials: "include",
            });
            
            const contentType = res.headers.get("content-type") || "";
            const responseText = await res.text();
            
            if (!res.ok) {
              let errorMessage = `Failed to add timeline item (${res.status} ${res.statusText})`;
              if (contentType.includes("application/json")) {
                try {
                  const errorData = JSON.parse(responseText);
                  errorMessage = errorData.error?.message || errorData.error || errorData.message || errorMessage;
                } catch (e) {
                  console.error("Failed to parse error JSON:", e);
                }
              }
              throw new Error(errorMessage);
            }
            
            if (!contentType.includes("application/json")) {
              throw new Error("Server returned non-JSON response");
            }
            
            return JSON.parse(responseText);
          }
        })
      );
      return results;
    },
    onSuccess: async () => {
      // 모든 변경사항 저장 후 목록 새로고침
      await queryClient.invalidateQueries({
        queryKey: [`/api/agendas/${agendaId}/execution-timeline`],
      });
      
      // 편집 다이얼로그가 열려있으면 목록도 새로고침
      if (editDialogOpen) {
        try {
          const res = await fetch(`/api/agendas/${agendaId}/execution-timeline`, {
            credentials: "include",
          });
          if (res.ok) {
            const updatedItems: ExecutionTimelineItem[] = await res.json();
            if (updatedItems && updatedItems.length > 0) {
              setTimelineItems(
                updatedItems.map((item) => ({
                  id: item.id,
                  authorName: item.authorName,
                  content: item.content,
                  image: null,
                  date: new Date(item.createdAt).toISOString().slice(0, 10),
                  imagePreview: item.imageUrl || undefined,
                  existingImageUrl: item.imageUrl || undefined,
                }))
              );
            }
          }
        } catch (error) {
          console.error("Failed to refresh timeline items in dialog:", error);
        }
      }
      
      toast({
        title: "저장 완료",
        description: "실행 과정이 성공적으로 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("Error saving timeline items:", error);
      const errorMessage = error?.message || "실행 과정 저장 중 오류가 발생했습니다.";
      toast({
        title: "저장 실패",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteTimelineItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/agendas/${agendaId}/execution-timeline/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete timeline item");
      }
    },
    onSuccess: (_, itemId) => {
      // 편집 다이얼로그에서도 제거
      setTimelineItems(timelineItems.filter((item) => item.id !== itemId));
      queryClient.invalidateQueries({
        queryKey: [`/api/agendas/${agendaId}/execution-timeline`],
      });
      toast({
        title: "삭제 완료",
        description: "실행 과정이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error) => {
      console.error("Error deleting timeline item:", error);
      toast({
        title: "삭제 실패",
        description: "실행 과정 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    if (comment.trim()) {
      opinionMutation.mutate(comment);
    }
  };

  const handleCommentFocus = () => {
    if (!user) {
      setShowLoginDialog(true);
    }
  };

  const handleVote = (voteType: "agree" | "disagree" | "neutral" | null) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    if (voteType === null) {
      deleteVoteMutation.mutate();
    } else {
      voteMutation.mutate(voteType);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleKakaoLogin = () => {
    window.location.href = "/api/auth/kakao";
  };

  const handleEditClick = () => {
    if (agenda) {
      setEditedTitle(agenda.title);
      setEditedDescription(agenda.description);
      setEditedStatus(agenda.status);
      setEditedResponse(agenda.response || "");
      setEditedOkinewsUrl(agenda.okinewsUrl || "");
      setEditedReferenceLinks(agenda.referenceLinks || []);
      setEditedReferenceFiles(agenda.referenceFiles || []);
      setEditedRegionalCases(agenda.regionalCases || []);
      
      // 실행 중 상태일 때 기존 실행 과정 불러오기
      if (agenda.status === "executing" && executionTimelineItems.length > 0) {
        setTimelineItems(
          executionTimelineItems.map((item) => ({
            id: item.id,
            authorName: item.authorName,
            content: item.content,
            image: null,
            date: new Date(item.createdAt).toISOString().slice(0, 10),
            imagePreview: item.imageUrl || undefined,
            existingImageUrl: item.imageUrl || undefined,
          }))
        );
      } else {
        setTimelineItems([]);
      }
      
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    // 안건 정보 저장
    await updateAgendaMutation.mutateAsync({
      title: editedTitle,
      description: editedDescription,
      status: editedStatus,
      response: (editedStatus === "answered" || editedStatus === "executing" || editedStatus === "executed") 
        ? (editedResponse.trim() || null) 
        : null,
      okinewsUrl: editedOkinewsUrl.trim() || null,
      referenceLinks: editedReferenceLinks,
      referenceFiles: editedReferenceFiles,
      regionalCases: editedRegionalCases,
    });

    // 실행 중 상태일 때 실행 과정도 저장
    if (editedStatus === "executing" && timelineItems.length > 0) {
      const validItems = timelineItems.filter(
        (item) => item.content.trim() && item.authorName.trim()
      );
      if (validItems.length > 0) {
        await saveTimelineItemsMutation.mutateAsync(
          validItems.map((item) => ({
            id: item.id,
            authorName: item.authorName.trim(),
            content: item.content.trim(),
            image: item.image || undefined,
            date: item.date,
            existingImageUrl: item.existingImageUrl,
            imagePreview: item.imagePreview,
          }))
        );
      }
    }
  };

  const handleAddReferenceLink = () => {
    if (newReferenceLink.trim()) {
      setEditedReferenceLinks([
        ...editedReferenceLinks,
        newReferenceLink.trim(),
      ]);
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


  const getTimelineSteps = (status: string, createdAt: string) => {
    const createdDate = new Date(createdAt)
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(/\.$/, "");

    const getStepStatus = (stepStatus: string) => {
      const statusOrder = ["created", "voting", "proposing", "answered", "executing", "executed"];
      const currentIndex = statusOrder.indexOf(status);
      const stepIndex = statusOrder.indexOf(stepStatus);

      if (stepIndex < currentIndex) {
        return "completed" as const;
      } else if (stepIndex === currentIndex) {
        return "current" as const;
      } else {
        return "upcoming" as const;
      }
    };

    return [
      {
        label: "안건 생성",
        status: getStepStatus("created"),
        date: createdDate,
      },
      {
        label: "투표 중",
        status: getStepStatus("voting"),
      },
      {
        label: "제안 중",
        status: getStepStatus("proposing"),
      },
      {
        label: "답변 완료",
        status: getStepStatus("answered"),
      },
      {
        label: "실행 중",
        status: getStepStatus("executing"),
      },
      {
        label: "실행 완료",
        status: getStepStatus("executed"),
      },
    ];
  };

  const timelineSteps = useMemo(() => {
    if (!agenda) return [];
    return getTimelineSteps(agenda.status, String(agenda.createdAt));
  }, [agenda]);

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
          <div
            className="w-full h-64 bg-muted rounded-lg overflow-hidden"
            data-testid="agenda-hero-image"
          >
            <img
              src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop"
              alt="안건 대표 이미지"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'%3E%3Crect width='1200' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3E안건 이미지%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          <AgendaHeader
            agenda={agenda}
            user={user}
            onBookmarkClick={handleBookmarkClick}
            onEditClick={handleEditClick}
            bookmarkLoading={bookmarkMutation.isPending}
          />

          <div className="space-y-12">
            {/* 타임라인 */}
            <Timeline steps={timelineSteps} />

            {/* 안건 소개 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">안건 소개</h2>
              <Card className="p-6">
                <p
                  className="text-base leading-relaxed"
                  data-testid="text-description"
                >
                  {agenda.description}
                </p>
              </Card>
            </div>

            {/* 투표 위젯 */}
            <VotingWidget
              agreeCount={voteStats?.agree || 0}
              neutralCount={voteStats?.neutral || 0}
              disagreeCount={voteStats?.disagree || 0}
              userVote={userVote?.voteType}
              onVote={handleVote}
              disabled={voteMutation.isPending}
            />

            {/* 관련 주민의견과 참고자료를 한 행에 배치 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* 관련 주민의견 섹션 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">관련 주민의견</h2>
                {opinionsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : relatedOpinions.length > 0 ? (
                  <>
                    {relatedOpinions.slice(0, 3).map((opinion) => (
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
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/agendas/${agendaId}/opinions`)}
                      data-testid="button-view-all-opinions-bottom"
                    >
                      주민의견 전체보기 ({relatedOpinions.length}개)
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">관련 의견이 없습니다.</p>
                  </Card>
                )}
              </div>

              {/* 참고자료 섹션 */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">참고자료</h2>
              
                {/* 참고자료 리스트 */}
                <div className="space-y-3">
                  {/* 옥천신문 */}
                  {agenda?.okinewsUrl ? (
                    <Card
                      className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                      data-testid="card-okinews-link"
                      onClick={() => window.open(agenda.okinewsUrl!, "_blank")}
                    >
                      <div className="flex items-center gap-4">
                        <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                              옥천신문
                            </span>
                          </div>
                          <h4 className="font-medium text-sm truncate" title={agenda.okinewsUrl}>
                            {agenda.okinewsUrl.length > 60 
                              ? `${agenda.okinewsUrl.substring(0, 60)}...` 
                              : agenda.okinewsUrl}
                          </h4>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4">
                      <div className="flex items-center gap-4">
                        <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                              옥천신문
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            아직 취재 전이에요.{" "}
                            <button
                              className="text-primary hover:underline"
                              onClick={() =>
                                window.open(
                                  "http://www.okinews.com/bbs/writeForm.html?mode=input&table=bbs_43&category=",
                                  "_blank",
                                )
                              }
                              data-testid="button-request-coverage"
                            >
                              취재 요청하기
                            </button>
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* 참고링크 - 1개만 표시 */}
                  {agenda?.referenceLinks && agenda.referenceLinks.length > 0 ? (
                    <Card
                      className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                      data-testid="card-reference-link-0"
                      onClick={() => window.open(agenda.referenceLinks![0], "_blank")}
                    >
                      <div className="flex items-center gap-4">
                        <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                              외부 링크
                            </span>
                          </div>
                          <h4 className="font-medium text-sm truncate" title={agenda.referenceLinks[0]}>
                            {agenda.referenceLinks[0].length > 60 
                              ? `${agenda.referenceLinks[0].substring(0, 60)}...` 
                              : agenda.referenceLinks[0]}
                          </h4>
                        </div>
                      </div>
                    </Card>
                  ) : null}

                  {/* 첨부파일 - 1개만 표시 */}
                  {agenda?.referenceFiles && agenda.referenceFiles.length > 0 ? (
                    <Card
                      className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                      data-testid="card-reference-file-0"
                      onClick={() => window.open(agenda.referenceFiles![0], "_blank")}
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                              첨부 파일
                            </span>
                          </div>
                          <h4 className="font-medium text-sm truncate" title={agenda.referenceFiles[0]}>
                            {(file => {
                              const fileName = file.split("/").pop() || file;
                              return fileName.length > 40 ? `${fileName.substring(0, 40)}...` : fileName;
                            })(agenda.referenceFiles[0])}
                          </h4>
                        </div>
                      </div>
                    </Card>
                  ) : null}

                  {/* 타 지역 정책 사례 - 1개만 표시 */}
                  {agenda?.regionalCases && agenda.regionalCases.length > 0 ? (
                    <Card
                      className="p-4"
                      data-testid="card-regional-case-0"
                    >
                      <div className="flex items-start gap-4">
                        <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                              타 지역 정책 사례
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2" title={agenda.regionalCases[0]}>
                            {agenda.regionalCases[0].length > 100 
                              ? `${agenda.regionalCases[0].substring(0, 100)}...` 
                              : agenda.regionalCases[0]}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : null}

                  {/* 참고자료가 없는 경우 */}
                  {(!agenda?.okinewsUrl || !agenda?.referenceLinks?.length) &&
                  !agenda?.referenceFiles?.length &&
                  !agenda?.regionalCases?.length ? (
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">등록된 참고자료가 없습니다.</p>
                    </Card>
                  ) : null}
                </div>

                {/* 참고자료 더보기 버튼 */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/agendas/${agendaId}/references`)}
                  data-testid="button-view-all-references-bottom"
                >
                  참고자료 전체보기
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* 답변 및 결과 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">답변 및 결과</h2>
              <Card className="p-6">
                {agenda.response ? (
                  <p className="text-base leading-relaxed whitespace-pre-wrap" data-testid="text-agenda-response">
                    {agenda.response}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    현재 주민 투표가 진행 중입니다. 투표 완료 후 공식 답변이
                    등록됩니다.
                  </p>
                )}
              </Card>
            </div>

            {/* 실행 중 타임라인 */}
            {agenda.status === "executing" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">실행 과정</h2>
                {executionTimelineLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : executionTimelineItems.length > 0 ? (
                  <div className="space-y-6">
                    {[...executionTimelineItems].sort((a, b) => {
                      const dateA = new Date(a.createdAt).getTime();
                      const dateB = new Date(b.createdAt).getTime();
                      return dateA - dateB; // 오름차순 (오래된 것부터)
                    }).map((item, index) => (
                      <div key={item.id} className="relative">
                        {/* 단계 번호와 연결선 */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border-4 border-background shadow-md">
                              {index + 1}
                            </div>
                            {index < executionTimelineItems.length - 1 && (
                              <div className="w-0.5 h-full min-h-16 bg-muted-foreground/20 mt-2"></div>
                            )}
                          </div>
                          
                          <Card className="flex-1 p-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="font-semibold text-lg">{item.authorName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                {user?.isAdmin && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm("이 실행 과정을 삭제하시겠습니까?")) {
                                        deleteTimelineItemMutation.mutate(item.id);
                                      }
                                    }}
                                    disabled={deleteTimelineItemMutation.isPending}
                                    data-testid={`button-delete-timeline-item-${item.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-base leading-relaxed whitespace-pre-wrap">
                                {item.content}
                              </p>
                              {item.imageUrl && (
                                <div className="rounded-lg overflow-hidden border">
                                  <img
                                    src={item.imageUrl}
                                    alt="실행 과정 이미지"
                                    className="w-full h-auto max-h-96 object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">
                      아직 등록된 실행 과정이 없습니다.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileNav />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-testid="dialog-edit-agenda"
          closeButtonTestId="button-close-edit-dialog"
        >
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
              <Select
                value={editedStatus}
                onValueChange={(value: any) => setEditedStatus(value)}
              >
                <SelectTrigger
                  id="edit-status"
                  data-testid="select-edit-status"
                >
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">안건 생성</SelectItem>
                  <SelectItem value="voting">투표 중</SelectItem>
                  <SelectItem value="proposing">제안 중</SelectItem>
                  <SelectItem value="answered">답변 완료</SelectItem>
                  <SelectItem value="executing">실행 중</SelectItem>
                  <SelectItem value="executed">실행 완료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(editedStatus === "answered" || editedStatus === "executing" || editedStatus === "executed") && (
              <div className="space-y-2">
                <Label htmlFor="edit-response">답변 및 결과</Label>
                <Textarea
                  id="edit-response"
                  value={editedResponse}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  placeholder="안건에 대한 최종 답변 및 결과를 입력하세요"
                  className="min-h-32"
                  data-testid="textarea-edit-response"
                />
              </div>
            )}

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
                        style={{ textOverflow: "ellipsis" }}
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
                      <span
                        className="text-sm truncate min-w-0 flex-1 block"
                        title={file.split("/").pop() || file}
                      >
                        {file.split("/").pop() || file}
                      </span>
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
                    {uploadFileMutation.isPending
                      ? "업로드 중..."
                      : "파일 업로드"}
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

            {/* 실행 타임라인 항목 추가 (실행 중 상태일 때만) */}
            {editedStatus === "executing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>실행 과정 추가</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newId = `temp-${Date.now()}`;
                      setTimelineItems([
                        ...timelineItems,
                        {
                          id: newId,
                          authorName: "",
                          content: "",
                          image: null,
                          date: new Date().toISOString().slice(0, 10),
                        },
                      ]);
                    }}
                    data-testid="button-add-timeline-item-form"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    항목 추가
                  </Button>
                </div>

                {timelineItems.length > 0 && (
                  <div className="space-y-4">
                    {timelineItems.map((item, index) => {
                      const isExisting = item.id && !item.id.startsWith("temp-");
                      return (
                        <Card key={item.id} className="p-4 space-y-4">
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (isExisting) {
                                // 기존 아이템은 서버에서 삭제
                                if (confirm("이 실행 과정을 삭제하시겠습니까?")) {
                                  deleteTimelineItemMutation.mutate(item.id!);
                                }
                              } else {
                                // 새 아이템은 로컬에서만 제거
                                setTimelineItems(timelineItems.filter((i) => i.id !== item.id));
                                if (item.imagePreview && !item.existingImageUrl) {
                                  URL.revokeObjectURL(item.imagePreview);
                                }
                              }
                            }}
                            data-testid={`button-remove-timeline-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* 모든 아이템 편집 가능 */}
                        <div className="space-y-2">
                          <Label htmlFor={`timeline-author-${item.id}`}>작성자</Label>
                          <Input
                            id={`timeline-author-${item.id}`}
                            type="text"
                            value={item.authorName}
                            onChange={(e) => {
                              setTimelineItems(
                                timelineItems.map((i) =>
                                  i.id === item.id ? { ...i, authorName: e.target.value } : i
                                )
                              );
                            }}
                            placeholder="작성자 이름을 입력하세요"
                            data-testid={`input-timeline-author-${index}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`timeline-date-${item.id}`}>날짜</Label>
                          <Input
                            id={`timeline-date-${item.id}`}
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              setTimelineItems(
                                timelineItems.map((i) =>
                                  i.id === item.id ? { ...i, date: e.target.value } : i
                                )
                              );
                            }}
                            data-testid={`input-timeline-date-${index}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`timeline-content-${item.id}`}>내용</Label>
                          <Textarea
                            id={`timeline-content-${item.id}`}
                            value={item.content}
                            onChange={(e) => {
                              setTimelineItems(
                                timelineItems.map((i) =>
                                  i.id === item.id ? { ...i, content: e.target.value } : i
                                )
                              );
                            }}
                            placeholder="실행 과정을 입력하세요"
                            className="min-h-24"
                            data-testid={`textarea-timeline-content-${index}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`timeline-image-${item.id}`}>
                            이미지 (선택사항)
                          </Label>
                          <div className="space-y-2">
                            {item.imagePreview && (
                              <div className="relative">
                                <img
                                  src={item.imagePreview}
                                  alt="미리보기"
                                  className="w-full h-auto max-h-48 object-cover rounded-md"
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    if (item.imagePreview && !item.existingImageUrl) {
                                      // 새로 선택한 이미지만 URL 해제
                                      URL.revokeObjectURL(item.imagePreview);
                                    }
                                    setTimelineItems(
                                      timelineItems.map((i) =>
                                        i.id === item.id
                                          ? { ...i, image: null, imagePreview: undefined, existingImageUrl: undefined }
                                          : i
                                      )
                                    );
                                    const input = timelineImageInputRefs.current[item.id];
                                    if (input) {
                                      input.value = "";
                                    }
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <input
                              ref={(el) => {
                                timelineImageInputRefs.current[item.id] = el;
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const preview = URL.createObjectURL(file);
                                  setTimelineItems(
                                    timelineItems.map((i) =>
                                      i.id === item.id
                                        ? { ...i, image: file, imagePreview: preview }
                                        : i
                                    )
                                  );
                                }
                              }}
                              data-testid={`input-timeline-image-${index}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = timelineImageInputRefs.current[item.id];
                                input?.click();
                              }}
                              className="w-full"
                              data-testid={`button-select-timeline-image-${index}`}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {item.imagePreview ? "이미지 변경" : "이미지 선택"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                    })}
                  </div>
                )}

                {timelineItems.length === 0 && (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      실행 과정 항목을 추가하려면 "항목 추가" 버튼을 클릭하세요.
                    </p>
                  </Card>
                )}
              </div>
            )}
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
              disabled={updateAgendaMutation.isPending || saveTimelineItemsMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateAgendaMutation.isPending || saveTimelineItemsMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent data-testid="dialog-login">
          <DialogHeader>
            <DialogTitle>로그인</DialogTitle>
            <DialogDescription>
              {providers && (providers.google || providers.kakao)
                ? "소셜 계정으로 간편하게 로그인하세요"
                : "OAuth 인증 설정이 필요합니다"
              }
            </DialogDescription>
          </DialogHeader>
          {providers && (providers.google || providers.kakao) ? (
            <>
              <div className="space-y-3">
                {providers?.google && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleGoogleLogin}
                    data-testid="button-google-login"
                  >
                    <SiGoogle className="w-5 h-5" />
                    Google로 로그인
                  </Button>
                )}
                {providers?.kakao && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleKakaoLogin}
                    data-testid="button-kakao-login"
                  >
                    <SiKakaotalk className="w-5 h-5 text-yellow-500" />
                    Kakao로 로그인
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground text-center mt-4">
                로그인하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              <p className="mb-3">OAuth 인증 키가 설정되지 않았습니다.</p>
              <p className="text-xs">
                관리자에게 문의하거나 환경 변수를 설정해주세요.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
