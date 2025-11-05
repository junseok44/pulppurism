import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import VotingWidget from "@/components/VotingWidget";
import Timeline from "@/components/Timeline";
import OpinionCard from "@/components/OpinionCard";
import { Card } from "@/components/ui/card";
import { ExternalLink, FileText } from "lucide-react";

export default function AgendaDetailPage() {
  // todo: remove mock functionality
  const timelineSteps = [
    { label: "의견 접수", status: "completed" as const, date: "2024.01.15" },
    { label: "안건 작성", status: "completed" as const, date: "2024.02.01" },
    { label: "주민 투표", status: "current" as const },
    { label: "검토 중", status: "upcoming" as const },
    { label: "답변 및 결과", status: "upcoming" as const },
  ];

  const relatedOpinions = [
    {
      id: "1",
      authorName: "김철수",
      content: "A초등학교 앞 도로가 너무 위험합니다. 아이들이 등하교할 때 차량 속도가 너무 빠릅니다.",
      likeCount: 12,
      commentCount: 5,
      timestamp: "2시간 전",
    },
    {
      id: "2",
      authorName: "이영희",
      content: "과속방지턱 설치에 찬성합니다. 우리 아이도 그 길로 등교합니다.",
      likeCount: 8,
      commentCount: 3,
      timestamp: "5시간 전",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header title="안건 상세" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">교통</Badge>
                <Badge variant="outline">주민 투표</Badge>
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-agenda-title">
                A초등학교 앞 과속방지턱 설치 요청
              </h1>
            </div>
            <Button size="icon" variant="ghost" data-testid="button-bookmark">
              <Bookmark className="w-5 h-5 fill-current text-primary" />
            </Button>
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
                  A초등학교 앞 도로는 아이들의 주요 등하교 경로입니다. 하지만 차량들의 과속으로 인해
                  안전사고 위험이 높습니다. 학부모들과 지역 주민들이 지속적으로 과속방지턱 설치를
                  요청하고 있으며, 이를 안건으로 상정하여 주민 의견을 수렴하고자 합니다.
                </p>
              </div>

              <VotingWidget
                agreeCount={156}
                neutralCount={34}
                disagreeCount={23}
                userVote="agree"
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

            <TabsContent value="opinions" className="space-y-4 mt-6">
              {relatedOpinions.map((opinion) => (
                <OpinionCard key={opinion.id} {...opinion} />
              ))}
            </TabsContent>

            <TabsContent value="references" className="space-y-4 mt-6">
              <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-reference-1">
                <div className="flex items-center gap-4">
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <h3 className="font-medium">타지역 과속방지턱 설치 사례</h3>
                    <p className="text-sm text-muted-foreground">
                      서울시 강남구 B초등학교 사례 분석
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-reference-2">
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <h3 className="font-medium">교통안전시설 설치 가이드라인.pdf</h3>
                    <p className="text-sm text-muted-foreground">PDF · 2.4 MB</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
