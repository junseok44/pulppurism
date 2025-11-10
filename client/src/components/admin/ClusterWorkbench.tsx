import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { format } from "date-fns";

type OpinionWithUser = Opinion & {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: opinions = [], isLoading } = useQuery<OpinionWithUser[]>({
    queryKey: [`/api/clusters/${cluster.id}/opinions`],
    enabled: isExpanded,
  });

  return (
    <Card className="overflow-hidden" data-testid={`cluster-${cluster.id}`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{cluster.title}</h3>
              <Badge variant="secondary">클러스터</Badge>
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
  );
}

export default function ClusterWorkbench() {
  const [selectedOpinions, setSelectedOpinions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("clustered");
  const { toast } = useToast();

  const { data: clusters = [], isLoading: clustersLoading } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  const { data: unclusteredOpinions = [], isLoading: unclusteredLoading } = useQuery<OpinionWithUser[]>({
    queryKey: ["/api/opinions/unclustered"],
  });

  const runClusteringMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/clusters/generate", {
        method: "POST",
        body: JSON.stringify({}),
      });
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
    </div>
  );
}
