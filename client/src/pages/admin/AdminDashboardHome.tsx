import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  AlertTriangle,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Database,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type DashboardStats = {
  today: {
    newOpinions: number;
    newUsers: number;
  };
  week: {
    newOpinions: number;
    newUsers: number;
  };
  activeAgendas: number;
  pendingReports: number;
  recentClusters: Array<{
    id: string;
    title: string;
    summary: string;
    opinionCount: number;
    similarity: number | null;
    createdAt: Date;
  }>;
};

export default function AdminDashboardHome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const seedOpinionsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/dev/seed-opinions"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions/unclustered"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "의견 생성 완료",
        description: data.message || "100개의 의견이 생성되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "의견 생성 실패",
        description: "의견 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const pendingReports = reports.filter((r) => r.status === "pending");

  if (statsLoading || reportsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">통계를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">대시보드</h1>
          <p className="text-muted-foreground">
            주민참여 플랫폼의 주요 지표와 활동을 한눈에 확인하세요
          </p>
        </div>
        <Button
          onClick={() => seedOpinionsMutation.mutate()}
          disabled={seedOpinionsMutation.isPending}
          variant="outline"
          data-testid="button-seed-opinions"
        >
          {seedOpinionsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              테스트 의견 100개 생성
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">오늘 신규 의견</p>
          </div>
          <p className="text-3xl font-bold">{stats.today.newOpinions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            주간: {stats.week.newOpinions}건
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">신규 가입자</p>
          </div>
          <p className="text-3xl font-bold">{stats.today.newUsers}</p>
          <p className="text-xs text-muted-foreground mt-1">
            주간: {stats.week.newUsers}명
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">활발한 안건</p>
          </div>
          <p className="text-3xl font-bold">{stats.activeAgendas}</p>
          <p className="text-xs text-muted-foreground mt-1">진행 중</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <p className="text-sm font-medium text-muted-foreground">미처리 신고</p>
          </div>
          <p className="text-3xl font-bold">{stats.pendingReports}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingReports.length}건 대기 중
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              최근 생성된 클러스터
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/opinions/clusters")}
              data-testid="button-view-all-clusters"
            >
              전체 보기
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {stats.recentClusters.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  생성된 클러스터가 없습니다
                </p>
              </Card>
            ) : (
              stats.recentClusters.map((cluster) => (
                <Card
                  key={cluster.id}
                  className="p-4 hover-elevate active-elevate-2"
                  data-testid={`cluster-card-${cluster.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 line-clamp-1">
                          {cluster.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {cluster.summary}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MessageSquare className="w-3 h-3" />
                            {cluster.opinionCount}개
                          </span>
                          {cluster.similarity && (
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Sparkles className="w-3 h-3" />
                              {Math.round(cluster.similarity * 100)}%
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(cluster.createdAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation("/admin/opinions/clusters")}
                        data-testid={`button-view-cluster-${cluster.id}`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        의견 보기
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/admin/agendas/new?clusterId=${cluster.id}`)}
                        data-testid={`button-create-agenda-${cluster.id}`}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        안건 생성
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              미처리 신고
            </h2>
            <Badge variant="destructive">{pendingReports.length}</Badge>
          </div>
          <div className="space-y-3">
            {pendingReports.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  처리할 신고가 없습니다
                </p>
              </Card>
            ) : (
              pendingReports.slice(0, 5).map((report) => (
                <Card
                  key={report.id}
                  className="p-4 hover-elevate active-elevate-2"
                  data-testid={`urgent-item-${report.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {report.opinionId ? "의견" : "안건"}
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          {report.reportType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {report.description || "사유 없음"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setLocation("/admin/opinions/reports")}
                      data-testid={`button-handle-${report.id}`}
                    >
                      처리하기
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
