import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  AlertTriangle,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboardHome() {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const stats = {
    today: {
      newOpinions: 24,
      newUsers: 8,
    },
    week: {
      newOpinions: 156,
      newUsers: 42,
    },
    activeAgendas: 12,
    trendingAgendas: 3,
  };

  const urgentItems = [
    {
      id: "1",
      type: "report",
      title: "부적절한 표현이 포함된 의견 신고",
      description: "김철수님의 의견에 대해 3건의 신고가 접수되었습니다.",
      time: "10분 전",
    },
    {
      id: "2",
      type: "report",
      title: "답글 신고 접수",
      description: "이영희님의 답글에 대해 신고가 접수되었습니다.",
      time: "1시간 전",
    },
  ];

  const recentActivities = [
    {
      id: "1",
      type: "agenda_created",
      title: "새 안건 생성: A초등학교 앞 과속방지턱 설치",
      time: "30분 전",
    },
    {
      id: "2",
      type: "response_added",
      title: "공식 답변 등록: 공원 소음 문제 해결 방안",
      time: "2시간 전",
    },
    {
      id: "3",
      type: "cluster_created",
      title: "새 클러스터 생성: 도서관 운영 시간 관련 의견 15건",
      time: "3시간 전",
    },
    {
      id: "4",
      type: "agenda_updated",
      title: "안건 상태 변경: 놀이터 개선 → 검토 중",
      time: "5시간 전",
    },
  ];

  const trendingAgendas = [
    {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      voteIncrease: 45,
      totalVotes: 213,
    },
    {
      id: "2",
      title: "공원 내 야간 소음 문제 해결 방안",
      voteIncrease: 38,
      totalVotes: 178,
    },
    {
      id: "3",
      title: "지역 도서관 운영 시간 연장 건의",
      voteIncrease: 29,
      totalVotes: 145,
    },
  ];

  const noteworthyClusters = [
    {
      id: "1",
      name: "초등학교 통학로 안전",
      opinionCount: 24,
      category: "교통",
      similarityScore: 0.92,
      recentActivity: "3시간 전",
      trending: true,
    },
    {
      id: "2",
      name: "도서관 운영 시간 연장",
      opinionCount: 18,
      category: "문화",
      similarityScore: 0.88,
      recentActivity: "5시간 전",
      trending: false,
    },
    {
      id: "3",
      name: "주차장 부족 문제",
      opinionCount: 15,
      category: "교통",
      similarityScore: 0.85,
      recentActivity: "1일 전",
      trending: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">대시보드</h1>
        <p className="text-muted-foreground">
          주민참여 플랫폼의 주요 지표와 활동을 한눈에 확인하세요
        </p>
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
            <TrendingUp className="w-5 h-5 text-destructive" />
            <p className="text-sm font-medium text-muted-foreground">투표 급증</p>
          </div>
          <p className="text-3xl font-bold">{stats.trendingAgendas}</p>
          <p className="text-xs text-muted-foreground mt-1">24시간 내</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              주목할 만한 클러스터
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
            {noteworthyClusters.map((cluster) => (
              <Card
                key={cluster.id}
                className="p-4 hover-elevate active-elevate-2"
                data-testid={`cluster-card-${cluster.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{cluster.name}</h3>
                        {cluster.trending && (
                          <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                            <TrendingUp className="w-3 h-3" />
                            화제
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Badge variant="outline" className="text-xs">{cluster.category}</Badge>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <MessageSquare className="w-3 h-3" />
                          {cluster.opinionCount}개
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Sparkles className="w-3 h-3" />
                          {(cluster.similarityScore * 100).toFixed(0)}%
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
                      onClick={() => console.log("Create agenda from cluster", cluster.id)}
                      data-testid={`button-create-agenda-${cluster.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      안건 생성
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              긴급 처리 필요
            </h2>
            <Badge variant="destructive">{urgentItems.length}</Badge>
          </div>
          <div className="space-y-3">
            {urgentItems.map((item) => (
              <Card
                key={item.id}
                className="p-4 hover-elevate active-elevate-2"
                data-testid={`urgent-item-${item.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <Button size="sm" data-testid={`button-handle-${item.id}`}>
                    처리하기
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">투표 급증 안건</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trendingAgendas.map((agenda) => (
            <Card key={agenda.id} className="p-4 hover-elevate active-elevate-2" data-testid={`trending-${agenda.id}`}>
              <h3 className="font-semibold mb-2 line-clamp-2">{agenda.title}</h3>
              <div className="flex items-center gap-3 text-sm mb-3">
                <span className="text-muted-foreground">
                  총 투표: {agenda.totalVotes}
                </span>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{agenda.voteIncrease}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                상세보기
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
        <div className="space-y-2">
          {recentActivities.map((activity) => (
            <Card key={activity.id} className="p-4 hover-elevate active-elevate-2" data-testid={`activity-${activity.id}`}>
              <div className="flex items-center gap-3">
                {activity.type === "agenda_created" && (
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                )}
                {activity.type === "response_added" && (
                  <div className="shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
                {activity.type === "cluster_created" && (
                  <div className="shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                {activity.type === "agenda_updated" && (
                  <div className="shrink-0 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
