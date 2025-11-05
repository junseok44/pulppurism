import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  MessageCircle, 
  Heart, 
  FileText, 
  Bookmark, 
  Bell,
  User,
  Settings,
  LogOut
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function MyPage() {
  // todo: remove mock functionality
  const userProfile = {
    name: "김철수",
    email: "kimcs@example.com",
    avatar: "",
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
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">마이페이지</h2>
          <Button variant="outline" size="sm" data-testid="button-edit-profile">
            <User className="w-4 h-4 mr-2" />
            프로필 수정
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6 space-y-6">
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
          <h3 className="text-lg font-semibold">내 활동</h3>
          
          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-my-opinions">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">내가 쓴 주민 의견</span>
              </div>
              <Badge variant="secondary">12</Badge>
            </div>
          </Card>

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-my-comments">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">내가 단 답글</span>
              </div>
              <Badge variant="secondary">34</Badge>
            </div>
          </Card>

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-liked-opinions">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">좋아요한 의견</span>
              </div>
              <Badge variant="secondary">23</Badge>
            </div>
          </Card>

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-my-agendas">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">내 의견이 포함된 안건</span>
              </div>
              <Badge variant="secondary">5</Badge>
            </div>
          </Card>

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-bookmarked-agendas">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">즐겨찾기한 안건</span>
              </div>
              <Badge variant="secondary">8</Badge>
            </div>
          </Card>
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

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-profile-settings">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">프로필 수정</span>
            </div>
          </Card>

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

          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid="card-logout">
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
