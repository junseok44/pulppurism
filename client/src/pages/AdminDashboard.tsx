import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { MessageSquare, FileText, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgendaCard from "@/components/AgendaCard";
import OpinionCard from "@/components/OpinionCard";

export default function AdminDashboard() {
  // todo: remove mock functionality
  const recentAgendas = [
    {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      status: "주민 투표",
      commentCount: 45,
      bookmarkCount: 23,
    },
  ];

  const reportedOpinions = [
    {
      id: "1",
      authorName: "익명",
      content: "신고된 부적절한 내용입니다...",
      likeCount: 0,
      commentCount: 0,
      timestamp: "1시간 전",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="신규 의견"
            value={142}
            trend={12}
            icon={<MessageSquare className="w-8 h-8" />}
          />
          <StatCard
            label="활발한 안건"
            value={23}
            trend={-5}
            icon={<FileText className="w-8 h-8" />}
          />
          <StatCard
            label="투표 참여자"
            value={1856}
            trend={8}
            icon={<TrendingUp className="w-8 h-8" />}
          />
          <StatCard
            label="신규 가입자"
            value={67}
            trend={0}
            icon={<Users className="w-8 h-8" />}
          />
        </div>

        <Tabs defaultValue="agendas" className="w-full">
          <TabsList>
            <TabsTrigger value="agendas" data-testid="tab-agendas">안건 관리</TabsTrigger>
            <TabsTrigger value="opinions" data-testid="tab-opinions">의견 관리</TabsTrigger>
            <TabsTrigger value="clusters" data-testid="tab-clusters">클러스터</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">사용자</TabsTrigger>
          </TabsList>

          <TabsContent value="agendas" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">전체 안건</h2>
            </div>
            {recentAgendas.map((agenda) => (
              <AgendaCard key={agenda.id} {...agenda} />
            ))}
          </TabsContent>

          <TabsContent value="opinions" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">신고된 의견</h2>
            </div>
            {reportedOpinions.map((opinion) => (
              <OpinionCard key={opinion.id} {...opinion} />
            ))}
          </TabsContent>

          <TabsContent value="clusters" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">클러스터 관리</h2>
            </div>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">교통 안전 관련</h3>
              <p className="text-sm text-muted-foreground mb-4">15개 의견 포함</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover-elevate active-elevate-2">
                  안건 생성
                </button>
                <button className="px-4 py-2 border rounded-lg hover-elevate active-elevate-2">
                  병합
                </button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">사용자 관리</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground">전체 사용자: 2,453명</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
