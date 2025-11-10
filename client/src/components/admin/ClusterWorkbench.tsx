import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Cluster, Opinion } from "@shared/schema";
import {
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
  Loader2,
  Plus,
  FileText,
  Link2,
} from "lucide-react";
import { format } from "date-fns";

type OpinionWithUser = Opinion & {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [agendaTitle, setAgendaTitle] = useState(cluster.title);
  const [agendaDescription, setAgendaDescription] = useState(cluster.summary);
  const [selectedCategory, setSelectedCategory] = useState("");
  const { toast } = useToast();

  const { data: opinions = [], isLoading } = useQuery<OpinionWithUser[]>({
    queryKey: ["/api/clusters", cluster.id, "opinions"],
    enabled: isExpanded,
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const createAgendaMutation = useMutation({
    mutationFn: async () => {
      const votingStartDate = new Date();
      const votingEndDate = new Date();
      votingEndDate.setDate(votingEndDate.getDate() + 14);

      const res = await apiRequest("POST", "/api/agendas", {
        title: agendaTitle,
        description: agendaDescription,
        categoryId: selectedCategory,
        votingStartDate: votingStartDate.toISOString(),
        votingEndDate: votingEndDate.toISOString(),
      });
      const agenda = await res.json();

      await apiRequest("PATCH", `/api/clusters/${cluster.id}`, {
        agendaId: agenda.id,
      });

      return agenda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      setShowAgendaDialog(false);
      toast({
        title: "안건 생성 완료",
        description: "클러스터가 안건으로 생성되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "안건 생성 실패",
        description: "안건 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card className="overflow-hidden" data-testid={`cluster-${cluster.id}`}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{cluster.title}</h3>
                <Badge variant="secondary">클러스터</Badge>
                {cluster.agendaId && (
                  <Badge variant="default">안건 생성됨</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{cluster.summary}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {cluster.opinionCount}개 의견
                </span>
                {cluster.similarity && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    유사도 {cluster.similarity}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!cluster.agendaId && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAgendaDialog(true)}
                  data-testid={`button-create-agenda-${cluster.id}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  안건으로 만들기
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid={`button-toggle-${cluster.id}`}
              >
                {isExpanded ? (
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

      {isExpanded && (
        <div className="border-t bg-muted/30">
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">
                포함된 의견 ({opinions.length})
              </h4>
            </div>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                <p className="text-sm text-muted-foreground">로딩 중...</p>
              </div>
            ) : opinions.length > 0 ? (
              <div className="space-y-2">
                {opinions.map((opinion) => (
                  <Card
                    key={opinion.id}
                    className="p-4"
                    data-testid={`opinion-${opinion.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {opinion.displayName || opinion.username}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(opinion.createdAt), "yyyy-MM-dd")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {opinion.content.slice(0, 150)}
                          {opinion.content.length > 150 && "..."}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>좋아요 {opinion.likes}</span>
                        </div>
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

    <Dialog open={showAgendaDialog} onOpenChange={setShowAgendaDialog}>
      <DialogContent data-testid="dialog-create-agenda">
        <DialogHeader>
          <DialogTitle>안건 생성</DialogTitle>
          <DialogDescription>
            클러스터를 안건으로 만듭니다. 투표 기간은 생성일로부터 14일입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="agenda-title">제목</Label>
            <Input
              id="agenda-title"
              value={agendaTitle}
              onChange={(e) => setAgendaTitle(e.target.value)}
              data-testid="input-agenda-title"
            />
          </div>
          <div>
            <Label htmlFor="agenda-description">설명</Label>
            <Textarea
              id="agenda-description"
              value={agendaDescription}
              onChange={(e) => setAgendaDescription(e.target.value)}
              rows={4}
              data-testid="textarea-agenda-description"
            />
          </div>
          <div>
            <Label htmlFor="agenda-category">카테고리</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowAgendaDialog(false)}
            data-testid="button-cancel-agenda"
          >
            취소
          </Button>
          <Button
            onClick={() => createAgendaMutation.mutate()}
            disabled={!agendaTitle || !agendaDescription || !selectedCategory || createAgendaMutation.isPending}
            data-testid="button-confirm-agenda"
          >
            {createAgendaMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              "안건 생성"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default function ClusterWorkbench() {
  const [selectedOpinions, setSelectedOpinions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("clustered");
  const [showNewClusterDialog, setShowNewClusterDialog] = useState(false);
  const [showAddToClusterDialog, setShowAddToClusterDialog] = useState(false);
  const [newClusterTitle, setNewClusterTitle] = useState("");
  const [newClusterSummary, setNewClusterSummary] = useState("");
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const { toast } = useToast();

  const { data: clusters = [], isLoading: clustersLoading } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  const { data: unclusteredOpinions = [], isLoading: unclusteredLoading } = useQuery<OpinionWithUser[]>({
    queryKey: ["/api/opinions/unclustered"],
  });

  const runClusteringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/clusters/generate", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions/unclustered"] });
      toast({
        title: "클러스터링 완료",
        description: `${data.clustersCreated}개의 클러스터가 생성되었습니다. (${data.opinionsProcessed}개 의견 처리)`,
      });
    },
    onError: () => {
      toast({
        title: "클러스터링 실패",
        description: "클러스터링 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const createClusterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/clusters", {
        title: newClusterTitle,
        summary: newClusterSummary,
        opinionIds: selectedOpinions,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions/unclustered"] });
      setShowNewClusterDialog(false);
      setSelectedOpinions([]);
      setNewClusterTitle("");
      setNewClusterSummary("");
      toast({
        title: "클러스터 생성 완료",
        description: `${selectedOpinions.length}개의 의견으로 클러스터를 생성했습니다.`,
      });
    },
    onError: () => {
      toast({
        title: "클러스터 생성 실패",
        description: "클러스터 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const addToClusterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/clusters/${selectedClusterId}/opinions`, {
        opinionIds: selectedOpinions,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions/unclustered"] });
      setShowAddToClusterDialog(false);
      setSelectedOpinions([]);
      setSelectedClusterId("");
      toast({
        title: "클러스터에 추가 완료",
        description: `${selectedOpinions.length}개의 의견을 클러스터에 추가했습니다.`,
      });
    },
    onError: () => {
      toast({
        title: "클러스터 추가 실패",
        description: "클러스터에 의견 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSelectOpinion = (opinionId: string) => {
    setSelectedOpinions((prev) =>
      prev.includes(opinionId)
        ? prev.filter((id) => id !== opinionId)
        : [...prev, opinionId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">클러스터 관리</h2>
          <p className="text-muted-foreground">
            AI가 분류한 의견 클러스터를 관리하고 안건을 생성합니다
          </p>
        </div>
        <Button
          onClick={() => runClusteringMutation.mutate()}
          disabled={runClusteringMutation.isPending}
          data-testid="button-run-clustering"
        >
          {runClusteringMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              클러스터링 중...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              지금 클러스터링 실행
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clustered" data-testid="tab-clustered">
            클러스터된 의견
            {!clustersLoading && (
              <Badge variant="secondary" className="ml-2">
                {clusters.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unclustered" data-testid="tab-unclustered">
            미분류 의견
            {!unclusteredLoading && (
              <Badge variant="secondary" className="ml-2">
                {unclusteredOpinions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clustered" className="space-y-4 mt-6">
          {clustersLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            </div>
          ) : clusters.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  유사도가 높은 순서로 정렬됨
                </p>
              </div>

              {clusters.map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">클러스터가 없습니다</p>
              <p className="text-sm">
                "지금 클러스터링 실행" 버튼을 눌러 의견을 분석하세요
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unclustered" className="space-y-4 mt-6">
          {unclusteredLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            </div>
          ) : unclusteredOpinions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedOpinions.length}개 선택됨
                </p>
                {selectedOpinions.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddToClusterDialog(true)}
                      data-testid="button-add-to-cluster"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      기존 클러스터에 추가
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowNewClusterDialog(true)}
                      data-testid="button-create-cluster"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      새 클러스터 만들기
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
                          <p className="font-medium text-sm">
                            {opinion.displayName || opinion.username}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(opinion.createdAt), "yyyy-MM-dd")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {opinion.content.slice(0, 150)}
                          {opinion.content.length > 150 && "..."}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>좋아요 {opinion.likes}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">미분류 의견이 없습니다</p>
              <p className="text-sm">
                모든 승인된 의견이 클러스터에 포함되었습니다
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showNewClusterDialog} onOpenChange={setShowNewClusterDialog}>
        <DialogContent data-testid="dialog-new-cluster">
          <DialogHeader>
            <DialogTitle>새 클러스터 만들기</DialogTitle>
            <DialogDescription>
              선택한 {selectedOpinions.length}개의 의견으로 새로운 클러스터를 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cluster-title">제목</Label>
              <Input
                id="cluster-title"
                value={newClusterTitle}
                onChange={(e) => setNewClusterTitle(e.target.value)}
                placeholder="클러스터 제목 입력"
                data-testid="input-cluster-title"
              />
            </div>
            <div>
              <Label htmlFor="cluster-summary">요약</Label>
              <Textarea
                id="cluster-summary"
                value={newClusterSummary}
                onChange={(e) => setNewClusterSummary(e.target.value)}
                placeholder="클러스터 요약 입력"
                rows={3}
                data-testid="textarea-cluster-summary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewClusterDialog(false)}
              data-testid="button-cancel-cluster"
            >
              취소
            </Button>
            <Button
              onClick={() => createClusterMutation.mutate()}
              disabled={!newClusterTitle || !newClusterSummary || createClusterMutation.isPending}
              data-testid="button-confirm-cluster"
            >
              {createClusterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                "클러스터 생성"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddToClusterDialog} onOpenChange={setShowAddToClusterDialog}>
        <DialogContent data-testid="dialog-add-to-cluster">
          <DialogHeader>
            <DialogTitle>기존 클러스터에 추가</DialogTitle>
            <DialogDescription>
              선택한 {selectedOpinions.length}개의 의견을 기존 클러스터에 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="select-cluster">클러스터 선택</Label>
            <Select value={selectedClusterId} onValueChange={setSelectedClusterId}>
              <SelectTrigger data-testid="select-target-cluster">
                <SelectValue placeholder="클러스터 선택" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((cluster) => (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    {cluster.title} ({cluster.opinionCount}개 의견)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddToClusterDialog(false)}
              data-testid="button-cancel-add"
            >
              취소
            </Button>
            <Button
              onClick={() => addToClusterMutation.mutate()}
              disabled={!selectedClusterId || addToClusterMutation.isPending}
              data-testid="button-confirm-add"
            >
              {addToClusterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                "클러스터에 추가"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
