import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Heart, 
  FileText, 
  Bookmark, 
  Bell,
  User,
  Settings,
  LogOut
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface UserStats {
  myOpinionsCount: number;
  likedOpinionsCount: number;
  myAgendasCount: number;
  bookmarkedAgendasCount: number;
}

export default function MyPage() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery<UserStats>({
    queryKey: ['/api/users/me/stats'],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="max-w-4xl mx-auto px-4 pt-20">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-muted-foreground mb-6">
              마이페이지를 이용하려면 로그인해주세요.
            </p>
            <Button onClick={() => setLocation("/")}>
              홈으로 이동
            </Button>
          </Card>
        </div>
        <MobileNav />
      </div>
    );
  }

  const userProfile = {
    name: user.displayName || user.username,
    email: user.email || "",
    avatar: user.avatarUrl || "",
  };

  const notifications = [
    {
      id: "1",
      type: "reply",
      message: "내 의견에 새로운 답글이 달렸습니다",
      time: "2시간 전",
      isRead: false,
    },
    {
      id: "2",
      type: "agenda",
      message: "내 의견이 '학교 앞 교통안전' 안건에 포함되었습니다",
      time: "1일 전",
      isRead: false,
    },
    {
      id: "3",
      type: "update",
      message: "즐겨찾기한 '공원 소음 문제' 안건이 '검토 중'으로 변경되었습니다",
      time: "2일 전",
      isRead: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">마이페이지</h2>
          <Button variant="outline" size="sm" data-testid="button-edit-profile">
            <User className="w-4 h-4 mr-2" />
            프로필 수정
          </Button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20" data-testid="avatar-profile">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold" data-testid="text-username">
                {userProfile.name}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-email">
                {userProfile.email}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">활동 내역</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="p-6 hover-elevate active-elevate-2 cursor-pointer" 
              data-testid="card-my-opinions"
              onClick={() => setLocation('/my/opinions')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">내가 쓴 주민 의견</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p className="text-2xl font-bold mt-1" data-testid="count-my-opinions">
                      {stats?.myOpinionsCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card 
              className="p-6 hover-elevate active-elevate-2 cursor-pointer" 
              data-testid="card-liked-opinions"
              onClick={() => setLocation('/my/liked')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">좋아요한 의견</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p className="text-2xl font-bold mt-1" data-testid="count-liked-opinions">
                      {stats?.likedOpinionsCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card 
              className="p-6 hover-elevate active-elevate-2 cursor-pointer" 
              data-testid="card-my-agendas"
              onClick={() => setLocation('/my/agendas')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">내 의견이 포함된 안건</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p className="text-2xl font-bold mt-1" data-testid="count-my-agendas">
                      {stats?.myAgendasCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card 
              className="p-6 hover-elevate active-elevate-2 cursor-pointer" 
              data-testid="card-bookmarked-agendas"
              onClick={() => setLocation('/my/bookmarks')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">즐겨찾기한 안건</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p className="text-2xl font-bold mt-1" data-testid="count-bookmarked-agendas">
                      {stats?.bookmarkedAgendasCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">알림 내역</h3>
            <Button variant="ghost" size="sm" data-testid="button-view-all-notifications">
              전체보기
            </Button>
          </div>

          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 hover-elevate active-elevate-2 cursor-pointer ${
                  !notification.isRead ? "border-l-4 border-l-primary" : ""
                }`}
                data-testid={`card-notification-${notification.id}`}
              >
                <div className="flex items-start gap-3">
                  <Bell className={`w-5 h-5 mt-0.5 ${!notification.isRead ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className={notification.isRead ? "text-muted-foreground" : ""}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">계정 설정</h3>

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-account-settings">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">계정 정보</span>
            </div>
          </Card>

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-notification-settings">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">알림 설정</span>
            </div>
          </Card>

          <Card 
            className="p-4 hover-elevate active-elevate-2 cursor-pointer" 
            data-testid="card-logout"
            onClick={() => {
              logout();
              setLocation("/");
            }}
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">로그아웃</span>
            </div>
          </Card>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
