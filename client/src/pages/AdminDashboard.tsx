import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  ArrowLeft,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import ClusterWorkbench from "@/components/admin/ClusterWorkbench";
import ReportManagement from "@/components/admin/ReportManagement";
import AllOpinionsManagement from "@/components/admin/AllOpinionsManagement";
import AllAgendasManagement from "@/components/admin/AllAgendasManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import NewAgendaForm from "@/components/admin/NewAgendaForm";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [opinionSubView, setOpinionSubView] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">
            주민참여 플랫폼 전체를 관리합니다
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="opinions" data-testid="tab-opinions">
              <MessageSquare className="w-4 h-4 mr-2" />
              의견 관리
            </TabsTrigger>
            <TabsTrigger value="agendas" data-testid="tab-agendas">
              <FileText className="w-4 h-4 mr-2" />
              안건 관리
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              사용자 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">핵심 통계</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">오늘 신규 의견</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.today.newOpinions}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    주간: {stats.week.newOpinions}건
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">신규 가입자</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.today.newUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    주간: {stats.week.newUsers}명
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">활발한 안건</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.activeAgendas}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    진행 중
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground">투표 급증</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.trendingAgendas}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    24시간 내
                  </p>
                </Card>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  주목할 만한 클러스터
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpinionSubView("clusters");
                    setActiveTab("opinions");
                  }}
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{cluster.name}</h3>
                          {cluster.trending && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <TrendingUp className="w-3 h-3" />
                              화제
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-2 text-sm">
                          <Badge variant="outline">{cluster.category}</Badge>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="w-4 h-4" />
                            {cluster.opinionCount}개 의견
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Sparkles className="w-3 h-3" />
                            유사도 {(cluster.similarityScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{cluster.recentActivity}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpinionSubView("clusters");
                            setActiveTab("opinions");
                          }}
                          data-testid={`button-view-cluster-${cluster.id}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          의견 보기
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Create agenda from cluster", cluster.id);
                          }}
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
                    className="p-4 border-l-4 border-l-destructive"
                    data-testid={`urgent-item-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
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

            <div>
              <h2 className="text-xl font-semibold mb-4">투표 급증 안건</h2>
              <div className="space-y-3">
                {trendingAgendas.map((agenda) => (
                  <Card key={agenda.id} className="p-4" data-testid={`trending-${agenda.id}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{agenda.title}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            총 투표: {agenda.totalVotes}
                          </span>
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{agenda.voteIncrease}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        상세보기
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <Card key={activity.id} className="p-4" data-testid={`activity-${activity.id}`}>
                    <div className="flex items-center gap-3">
                      {activity.type === "agenda_created" && (
                        <FileText className="w-5 h-5 text-primary" />
                      )}
                      {activity.type === "response_added" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {activity.type === "cluster_created" && (
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      )}
                      {activity.type === "agenda_updated" && (
                        <Clock className="w-5 h-5 text-orange-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="opinions">
            <OpinionManagement
              initialSubView={opinionSubView}
              onSubViewChange={setOpinionSubView}
            />
          </TabsContent>

          <TabsContent value="agendas">
            <AgendaManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OpinionManagement({
  initialSubView,
  onSubViewChange,
}: {
  initialSubView?: string | null;
  onSubViewChange?: (view: string | null) => void;
}) {
  const [subView, setSubView] = useState<string | null>(initialSubView || null);

  useEffect(() => {
    if (initialSubView !== undefined) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const handleSubViewChange = (view: string | null) => {
    setSubView(view);
    onSubViewChange?.(view);
  };

  if (subView === "clusters") {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => handleSubViewChange(null)}
          data-testid="button-back-opinions"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <ClusterWorkbench />
      </div>
    );
  }

  if (subView === "reports") {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => handleSubViewChange(null)}
          data-testid="button-back-opinions"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <ReportManagement />
      </div>
    );
  }

  if (subView === "all") {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => handleSubViewChange(null)}
          data-testid="button-back-opinions"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <AllOpinionsManagement />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">주민 의견 관리</h2>
        <p className="text-muted-foreground">
          클러스터링, 신고 처리, 의견 관리 기능을 제공합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => handleSubViewChange("clusters")}
          data-testid="card-clusters"
        >
          <h3 className="font-semibold text-lg mb-2">클러스터 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            의견 클러스터를 관리하고 안건을 생성합니다
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary">12개 클러스터</Badge>
            <Badge variant="outline">5개 미분류</Badge>
          </div>
        </Card>

        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => handleSubViewChange("reports")}
          data-testid="card-reports"
        >
          <h3 className="font-semibold text-lg mb-2">신고 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            신고된 의견과 답글을 검토하고 조치합니다
          </p>
          <Badge variant="destructive">5건 대기 중</Badge>
        </Card>

        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => handleSubViewChange("all")}
          data-testid="card-all-opinions"
        >
          <h3 className="font-semibold text-lg mb-2">전체 의견 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            모든 의견을 검색하고 관리합니다
          </p>
          <Badge variant="secondary">1,234개 의견</Badge>
        </Card>
      </div>
    </div>
  );
}

function AgendaManagement() {
  const [subView, setSubView] = useState<string | null>(null);

  if (subView === "all") {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSubView(null)}
          data-testid="button-back-agendas"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <AllAgendasManagement />
      </div>
    );
  }

  if (subView === "categories") {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSubView(null)}
          data-testid="button-back-agendas"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <CategoryManagement />
      </div>
    );
  }

  if (subView === "new") {
    return (
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSubView(null)}
          data-testid="button-back-agendas"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <NewAgendaForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">안건 관리</h2>
          <p className="text-muted-foreground">
            안건 생성, 수정, 카테고리 관리를 합니다
          </p>
        </div>
        <Button
          onClick={() => setSubView("new")}
          data-testid="button-create-agenda"
        >
          <FileText className="w-4 h-4 mr-2" />
          새 안건 생성
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setSubView("all")}
          data-testid="card-all-agendas"
        >
          <h3 className="font-semibold text-lg mb-2">전체 안건 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            모든 안건을 조회하고 수정, 삭제할 수 있습니다
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary">진행 중: 12</Badge>
            <Badge variant="outline">완료: 45</Badge>
          </div>
        </Card>

        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setSubView("categories")}
          data-testid="card-categories"
        >
          <h3 className="font-semibold text-lg mb-2">카테고리 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            안건 카테고리를 생성, 수정, 삭제합니다
          </p>
          <Badge variant="secondary">11개 카테고리</Badge>
        </Card>
      </div>
    </div>
  );
}

function UserManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">사용자 관리</h2>
        <p className="text-muted-foreground">
          사용자 조회, 제재, 관리자 권한을 관리합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-all-users">
          <h3 className="font-semibold text-lg mb-2">전체 사용자</h3>
          <p className="text-sm text-muted-foreground mb-4">
            가입된 모든 사용자를 조회하고 검색합니다
          </p>
          <Badge variant="secondary">1,567명</Badge>
        </Card>

        <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-sanctions">
          <h3 className="font-semibold text-lg mb-2">제재 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            문제 사용자를 정지 처리합니다
          </p>
          <Badge variant="destructive">3명 정지 중</Badge>
        </Card>

        <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-admins">
          <h3 className="font-semibold text-lg mb-2">관리자 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            관리자를 초대하거나 권한을 관리합니다
          </p>
          <Badge variant="secondary">5명</Badge>
        </Card>
      </div>
    </div>
  );
}
