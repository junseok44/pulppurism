import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  Sparkles,
  Users,
  FileText,
  Edit,
  Trash2,
  GitMerge,
  GitBranch,
  ArrowRight,
} from "lucide-react";

export default function ClusterWorkbench() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [createAgendaDialog, setCreateAgendaDialog] = useState(false);

  // todo: remove mock functionality
  const clusters = [
    {
      id: "1",
      name: "초등학교 통학로 안전",
      opinionCount: 15,
      status: "검토 중",
      suggestedBy: "AI",
      category: "교통",
      keyPoints: [
        "과속방지턱 설치 요청",
        "신호등 추가 필요",
        "인도 확장",
      ],
      opinions: [
        { id: "o1", author: "김철수", summary: "A초등학교 앞 과속방지턱 필요" },
        { id: "o2", author: "이영희", summary: "B초등학교 신호등 설치 요청" },
        { id: "o3", author: "박민수", summary: "통학로 인도 확장 건의" },
      ],
    },
    {
      id: "2",
      name: "도서관 운영 시간 연장",
      opinionCount: 12,
      status: "안건 생성됨",
      suggestedBy: "AI",
      category: "문화",
      keyPoints: ["평일 저녁 연장", "주말 운영", "야간 자습실"],
      opinions: [],
    },
    {
      id: "3",
      name: "공원 소음 문제",
      opinionCount: 8,
      status: "보류",
      suggestedBy: "관리자",
      category: "생활",
      keyPoints: ["야간 소음 규제", "운동 시간 제한"],
      opinions: [],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "검토 중":
        return "secondary";
      case "안건 생성됨":
        return "default";
      case "보류":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">의견 클러스터 워크벤치</h2>
          <p className="text-muted-foreground">
            AI가 제안한 클러스터를 관리하고 안건을 생성합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="review">검토 중</SelectItem>
              <SelectItem value="created">안건 생성됨</SelectItem>
              <SelectItem value="hold">보류</SelectItem>
            </SelectContent>
          </Select>
          <Button data-testid="button-create-cluster">
            <Sparkles className="w-4 h-4 mr-2" />
            수동 클러스터 생성
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {clusters.map((cluster) => (
          <Card key={cluster.id} className="p-6" data-testid={`cluster-${cluster.id}`}>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{cluster.name}</h3>
                    <Badge variant={getStatusColor(cluster.status)}>
                      {cluster.status}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {cluster.suggestedBy === "AI" ? (
                        <Sparkles className="w-3 h-3" />
                      ) : null}
                      {cluster.suggestedBy}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {cluster.opinionCount}개 의견
                    </span>
                    <Badge variant="secondary">{cluster.category}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {cluster.status !== "안건 생성됨" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setCreateAgendaDialog(true)}
                      data-testid={`button-create-agenda-${cluster.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      안건 생성
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedCluster(
                        selectedCluster === cluster.id ? null : cluster.id
                      )
                    }
                    data-testid={`button-toggle-${cluster.id}`}
                  >
                    {selectedCluster === cluster.id ? "접기" : "상세보기"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {cluster.keyPoints.map((point, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {point}
                  </Badge>
                ))}
              </div>

              {selectedCluster === cluster.id && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">포함된 의견 ({cluster.opinions.length})</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" data-testid="button-edit-cluster">
                        <Edit className="w-4 h-4 mr-2" />
                        이름 변경
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-merge-cluster">
                        <GitMerge className="w-4 h-4 mr-2" />
                        병합
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-split-cluster">
                        <GitBranch className="w-4 h-4 mr-2" />
                        분리
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-delete-cluster">
                        <Trash2 className="w-4 h-4 mr-2" />
                        삭제
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cluster.opinions.map((opinion) => (
                      <div
                        key={opinion.id}
                        className="p-3 rounded-lg bg-muted/50 flex items-center justify-between"
                        data-testid={`opinion-${opinion.id}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{opinion.author}</p>
                          <p className="text-sm text-muted-foreground">
                            {opinion.summary}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={createAgendaDialog} onOpenChange={setCreateAgendaDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-agenda">
          <DialogHeader>
            <DialogTitle>클러스터에서 안건 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">안건 제목</label>
              <Input
                placeholder="안건 제목을 입력하세요"
                data-testid="input-agenda-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <Select>
                <SelectTrigger data-testid="select-agenda-category">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic">교통</SelectItem>
                  <SelectItem value="culture">문화</SelectItem>
                  <SelectItem value="education">교육</SelectItem>
                  <SelectItem value="welfare">복지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">안건 개요</label>
              <Textarea
                placeholder="안건 내용을 입력하세요"
                className="min-h-32"
                data-testid="input-agenda-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateAgendaDialog(false)}
              data-testid="button-cancel-agenda"
            >
              취소
            </Button>
            <Button data-testid="button-confirm-create-agenda">안건 생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
