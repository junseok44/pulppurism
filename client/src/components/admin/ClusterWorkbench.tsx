import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Sparkles,
  Users,
  FileText,
  Trash2,
  ArrowRight,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

export default function ClusterWorkbench() {
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [createAgendaDialog, setCreateAgendaDialog] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedOpinions, setSelectedOpinions] = useState<string[]>([]);
  const [createClusterDialog, setCreateClusterDialog] = useState(false);
  const [addToClusterDialog, setAddToClusterDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("clustered");

  // todo: remove mock functionality
  const clusters = [
    {
      id: "1",
      name: "초등학교 통학로 안전",
      opinionCount: 15,
      similarityScore: 0.89,
      category: "교통",
      keyPoints: ["과속방지턱 설치", "신호등 추가", "인도 확장"],
      opinions: [
        {
          id: "o1",
          author: "김철수",
          summary: "A초등학교 앞 과속방지턱 필요",
          content: "아이들 안전을 위해 과속방지턱이 필요합니다",
          likes: 12,
          createdAt: "2024-01-15",
        },
        {
          id: "o2",
          author: "이영희",
          summary: "B초등학교 신호등 설치 요청",
          content: "등하교 시간 차량이 많아 위험합니다",
          likes: 8,
          createdAt: "2024-01-14",
        },
        {
          id: "o3",
          author: "박민수",
          summary: "통학로 인도 확장 건의",
          content: "인도가 좁아서 아이들이 차도로 내려갑니다",
          likes: 15,
          createdAt: "2024-01-13",
        },
      ],
    },
    {
      id: "2",
      name: "도서관 운영 시간 연장",
      opinionCount: 12,
      similarityScore: 0.85,
      category: "문화",
      keyPoints: ["평일 저녁 연장", "주말 운영", "야간 자습실"],
      opinions: [
        {
          id: "o4",
          author: "정민호",
          summary: "평일 도서관 운영 시간 연장 요청",
          content: "직장인들도 이용할 수 있도록 연장해주세요",
          likes: 20,
          createdAt: "2024-01-12",
        },
      ],
    },
    {
      id: "3",
      name: "공원 소음 문제",
      opinionCount: 8,
      similarityScore: 0.78,
      category: "생활",
      keyPoints: ["야간 소음 규제", "운동 시간 제한"],
      opinions: [],
    },
  ];

  const unclusteredOpinions = [
    {
      id: "u1",
      author: "강서연",
      title: "주차장 부족 문제",
      content: "아파트 단지 주차공간이 부족합니다",
      category: "교통",
      likes: 5,
      createdAt: "2024-01-10",
    },
    {
      id: "u2",
      author: "윤지훈",
      title: "공공 와이파이 설치",
      content: "공원에 무료 와이파이를 설치해주세요",
      category: "생활",
      likes: 3,
      createdAt: "2024-01-09",
    },
    {
      id: "u3",
      author: "송민지",
      title: "자전거 도로 확충",
      content: "자전거 전용 도로가 필요합니다",
      category: "교통",
      likes: 10,
      createdAt: "2024-01-08",
    },
  ];

  const handleSelectOpinion = (opinionId: string) => {
    setSelectedOpinions((prev) =>
      prev.includes(opinionId)
        ? prev.filter((id) => id !== opinionId)
        : [...prev, opinionId]
    );
  };

  const handleRemoveFromCluster = (clusterId: string, opinionId: string) => {
    console.log("Remove opinion", opinionId, "from cluster", clusterId);
  };

  const handleCreateAgenda = (clusterId: string) => {
    setSelectedClusterId(clusterId);
    setCreateAgendaDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">클러스터 관리</h2>
        <p className="text-muted-foreground">
          AI가 분류한 의견 클러스터를 관리하고 안건을 생성합니다
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clustered" data-testid="tab-clustered">
            클러스터된 의견
          </TabsTrigger>
          <TabsTrigger value="unclustered" data-testid="tab-unclustered">
            미분류 의견
            <Badge variant="secondary" className="ml-2">
              {unclusteredOpinions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clustered" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              유사도가 높은 순서로 정렬됨
            </p>
          </div>

          {clusters.map((cluster) => (
            <Card key={cluster.id} className="overflow-hidden" data-testid={`cluster-${cluster.id}`}>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{cluster.name}</h3>
                      <Badge variant="secondary">{cluster.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {cluster.opinionCount}개 의견
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        유사도 {(cluster.similarityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cluster.keyPoints.map((point, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleCreateAgenda(cluster.id)}
                      data-testid={`button-create-agenda-${cluster.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      안건 생성
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedCluster(
                          expandedCluster === cluster.id ? null : cluster.id
                        )
                      }
                      data-testid={`button-toggle-${cluster.id}`}
                    >
                      {expandedCluster === cluster.id ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          접기
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          의견 보기
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {expandedCluster === cluster.id && (
                <div className="border-t bg-muted/30">
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">
                        포함된 의견 ({cluster.opinions.length})
                      </h4>
                    </div>
                    {cluster.opinions.length > 0 ? (
                      <div className="space-y-2">
                        {cluster.opinions.map((opinion) => (
                          <Card
                            key={opinion.id}
                            className="p-4"
                            data-testid={`opinion-${opinion.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">
                                    {opinion.author}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {opinion.createdAt}
                                  </span>
                                </div>
                                <p className="font-medium mb-1">{opinion.summary}</p>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {opinion.content}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>👍 {opinion.likes}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-view-${opinion.id}`}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveFromCluster(cluster.id, opinion.id)
                                  }
                                  data-testid={`button-remove-${opinion.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">의견이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unclustered" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedOpinions.length}개 선택됨
            </p>
            {selectedOpinions.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setCreateClusterDialog(true)}
                  data-testid="button-create-new-cluster"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 클러스터 생성
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddToClusterDialog(true)}
                  data-testid="button-add-to-cluster"
                >
                  기존 클러스터에 추가
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {unclusteredOpinions.map((opinion) => (
              <Card key={opinion.id} className="p-4" data-testid={`unclustered-${opinion.id}`}>
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedOpinions.includes(opinion.id)}
                    onCheckedChange={() => handleSelectOpinion(opinion.id)}
                    data-testid={`checkbox-${opinion.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{opinion.author}</p>
                      <Badge variant="outline" className="text-xs">
                        {opinion.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {opinion.createdAt}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{opinion.title}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {opinion.content}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>👍 {opinion.likes}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`button-view-unclustered-${opinion.id}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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

      <Dialog open={createClusterDialog} onOpenChange={setCreateClusterDialog}>
        <DialogContent data-testid="dialog-create-cluster">
          <DialogHeader>
            <DialogTitle>새 클러스터 생성</DialogTitle>
            <DialogDescription>
              선택한 {selectedOpinions.length}개의 의견으로 새 클러스터를
              생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">클러스터 이름</label>
              <Input
                placeholder="클러스터 이름을 입력하세요"
                data-testid="input-cluster-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <Select>
                <SelectTrigger data-testid="select-cluster-category">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateClusterDialog(false)}
              data-testid="button-cancel-cluster"
            >
              취소
            </Button>
            <Button data-testid="button-confirm-create-cluster">
              클러스터 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addToClusterDialog} onOpenChange={setAddToClusterDialog}>
        <DialogContent data-testid="dialog-add-to-cluster">
          <DialogHeader>
            <DialogTitle>기존 클러스터에 추가</DialogTitle>
            <DialogDescription>
              선택한 {selectedOpinions.length}개의 의견을 기존 클러스터에
              추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">클러스터 선택</label>
              <Select>
                <SelectTrigger data-testid="select-target-cluster">
                  <SelectValue placeholder="클러스터를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {cluster.name} ({cluster.opinionCount}개 의견)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddToClusterDialog(false)}
              data-testid="button-cancel-add"
            >
              취소
            </Button>
            <Button data-testid="button-confirm-add">추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
