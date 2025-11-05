import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Heart, FileText, Bookmark, Bell, Settings, LogOut } from "lucide-react";
import OpinionCard from "@/components/OpinionCard";
import AgendaCard from "@/components/AgendaCard";

export default function MyPage() {
  // todo: remove mock functionality
  const myOpinions = [
    {
      id: "1",
      authorName: "김철수",
      content: "A초등학교 앞 도로가 너무 위험합니다. 과속방지턱 설치가 시급합니다.",
      likeCount: 12,
      commentCount: 5,
      isLiked: true,
      timestamp: "2시간 전",
      isAuthor: true,
    },
  ];

  const bookmarkedAgendas = [
    {
      id: "1",
      title: "A초등학교 앞 과속방지턱 설치 요청",
      category: "교통",
      status: "주민 투표",
      commentCount: 45,
      bookmarkCount: 23,
      isBookmarked: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <h2 className="text-2xl font-bold mb-6">마이페이지</h2>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20" data-testid="avatar-profile">
              <AvatarImage src="" />
              <AvatarFallback>김</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold" data-testid="text-username">김철수</h2>
              <p className="text-sm text-muted-foreground">user@example.com</p>
            </div>
            <Button variant="outline" data-testid="button-edit-profile">
              프로필 수정
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">내 의견</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-8 h-8 text-muted-foreground" />
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-muted-foreground">좋아요</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">포함된 안건</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex flex-col items-center gap-2">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">즐겨찾기</p>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="opinions" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="opinions" data-testid="tab-my-opinions">내 의견</TabsTrigger>
            <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">즐겨찾기</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">알림</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">설정</TabsTrigger>
          </TabsList>

          <TabsContent value="opinions" className="space-y-4 mt-6">
            {myOpinions.map((opinion) => (
              <OpinionCard key={opinion.id} {...opinion} />
            ))}
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-4 mt-6">
            {bookmarkedAgendas.map((agenda) => (
              <AgendaCard key={agenda.id} {...agenda} />
            ))}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card className="p-4">
              <div className="flex gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">새로운 답글</p>
                  <p className="text-sm text-muted-foreground">
                    회원님의 의견에 새로운 답글이 달렸습니다.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">2시간 전</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <Card className="p-4">
              <div className="space-y-4">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-alarm-settings">
                  <Bell className="w-5 h-5 mr-3" />
                  알림 설정
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="button-account-settings">
                  <Settings className="w-5 h-5 mr-3" />
                  계정 설정
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive" data-testid="button-logout">
                  <LogOut className="w-5 h-5 mr-3" />
                  로그아웃
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <MobileNav />
    </div>
  );
}
