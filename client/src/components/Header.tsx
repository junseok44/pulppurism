import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogIn, LogOut, Search, Bell } from "lucide-react"; // 👈 Bell 아이콘 추가
import { useUser } from "@/hooks/useUser";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"; // 👈 Sheet 관련 컴포넌트 추가
import { SiGoogle, SiKakaotalk } from "react-icons/si";

interface AuthProviders {
  google: boolean;
  kakao: boolean;
}

// 🔔 [추가] 임시 알림 데이터
const MOCK_NOTIFICATIONS = [
  { id: 1, text: "내 안건 '가로등 설치'에 새 댓글이 달렸습니다.", time: "방금 전", read: false },
  { id: 2, text: "주민 투표가 시작되었습니다! 소중한 한 표를 행사해주세요.", time: "1시간 전", read: false },
  { id: 3, text: "회원가입을 축하합니다!", time: "1일 전", read: true },
];

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logout, isLoggingOut } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  // 🔔 [추가] 읽지 않은 알림 개수 계산
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders({ google: false, kakao: false }));
  }, []);

  const navItems = [
    { path: "/howto", label: "이용방법"},
    { path: "/opinions", label: "주민의 목소리" },
    { path: "/agendas", label: "안건보기"},
    { path: "/policy", label: "정책실현현황"}
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleKakaoLogin = () => {
    window.location.href = "/api/auth/kakao";
  };

  const hasAnyProvider = providers && (providers.google || providers.kakao);

  return (
    <>
      {/* 헤더 컨테이너 */}
      <div className="sticky top-0 z-50 w-full pt-4 pl-4 flex items-center gap-3" data-testid="header-main">    
      <header className="bg-ok_gray1 pointer-events-auto flex-grow bg-background/80 backdrop-blur-md border border-border shadow-sm rounded-full h-16 px-6 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            {/* PC 로고 */}
            <Link href="/">
              <div className="flex flex-col items-start cursor-pointer group select-none leading-none pb-[10px]" data-testid="logo">
                
                {/* 2. 윗쪽 박스: [두런두런 + 나뭇잎] */}
                <div className="flex items-end mb-[-17px]"> 
                  <span className="pb-[11px] pl-[3px] font-logosub text-[14px] text-ok_txtgray2 tracking-tighter">
                    두런두런
                  </span>
                  <img 
                    src="/icons/title.png" 
                    alt="Logo"
                    className="w-11 h-11 object-contain group-hover:rotate-12 transition-transform duration-300" 
                  />
                </div>

                {/* 3. 아랫쪽 박스: [옥천마루] */}
                <h1 className="font-bagel text-2xl text-ok_txtgray2 text-[#1e293b]">
                  옥천마루
                </h1>
                
              </div>
            </Link>
          </div>

          {/* PC 네비게이션 */}
          <nav className="hidden md:flex items-center gap-8" data-testid="nav-desktop">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`text-sm font-medium transition-colors hover:text-ok_sub1 ${
                  isActive(item.path) ? "text-ok_sub1 font-bold" : "text-muted-foreground"
                }`}
                data-testid={`nav-${item.label}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* PC 오른쪽 버튼들 */}
          <div className="flex items-center gap-2">
             {user ? (
               <>
                 {/* 🔔 [추가됨] 알림 서랍 (Sheet) 시작 */}
                 <Sheet>
                   <SheetTrigger asChild>
                     <button className="w-9 h-9 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-accent relative transition-transform hover:scale-105 mr-1">
                       <Bell className="w-4 h-4 text-gray-600" />
                       {/* 읽지 않은 알림 뱃지 */}
                       {unreadCount > 0 && (
                         <span className="absolute top-[-2px] right-[-2px] flex h-3 w-3">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok_sub1 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-ok_sub1 text-[8px] text-white justify-center items-center">
                             {unreadCount}
                           </span>
                         </span>
                       )}
                     </button>
                   </SheetTrigger>
                   
                   {/* 서랍 내용물 */}
                   <SheetContent className="w-[320px] sm:w-[380px] bg-ok_gray1">
                     <SheetHeader className="mb-6 text-left">
                       <SheetTitle className="font-bold text-xl">알림함</SheetTitle>
                     </SheetHeader>
                     <div className="space-y-4 overflow-y-auto max-h-[80vh]">
                       {MOCK_NOTIFICATIONS.length > 0 ? (
                         MOCK_NOTIFICATIONS.map((noti) => (
                           <div key={noti.id} className={`p-4 rounded-2xl border transition-colors cursor-pointer ${noti.read ? 'bg-ok_gray2 border-transparent' : 'bg-white border-gray-100 shadow-sm'}`}>
                             <p className={`text-sm mb-1 ${noti.read ? 'text-ok_txtgray0 font-bold' : 'text-ok_txtgray2 font-bold'}`}>
                               {noti.text}
                             </p>
                             <span className="text-xs text-ok_txtgray0">{noti.time}</span>
                           </div>
                         ))
                       ) : (
                         <div className="text-center py-10 text-gray-400 text-sm">
                           새로운 알림이 없습니다.
                         </div>
                       )}
                     </div>
                   </SheetContent>
                 </Sheet>
                 {/* 🔔 [끝] 알림 서랍 끝 */}

                 <button onClick={() => setLocation("/my")} className="w-9 h-9 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-accent">
                   <Avatar className="w-8 h-8"><AvatarFallback className="bg-transparent text-sm font-medium text-primary">{user.username[0].toUpperCase()}</AvatarFallback></Avatar>
                 </button>
                 <Button variant="outline" size="sm" className="rounded-full h-9 px-4 hidden sm:flex" onClick={() => logout()} disabled={isLoggingOut}><LogOut className="w-3.5 h-3.5 mr-2" />로그아웃</Button>
               </>
             ) : (
               <Button className="rounded-full px-6 font-bold shadow-sm" onClick={() => setShowLoginDialog(true)}><LogIn className="w-4 h-4 mr-2" />로그인</Button>
             )}
          </div>

        </header>

        <button 
          onClick={() => setLocation("/search")} 
          className="relative z-50 cursor-pointer rounded-full bg-primary w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
        
        <div>
      </div>
      </div>

      {/* 로그인 다이얼로그 */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent 
        data-testid="dialog-login"
        className = "bg-ok_gray1 sm:rounded-lg"
        >
          <DialogHeader>
            <DialogTitle>로그인</DialogTitle>
            <DialogDescription>
              {hasAnyProvider
                ? "소셜 계정으로 간편하게 로그인하세요"
                : "OAuth 인증 설정이 필요합니다"}
            </DialogDescription>
          </DialogHeader>
          {hasAnyProvider ? (
            <>
              <div className="space-y-3">
                {providers?.google && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={handleGoogleLogin}
                    data-testid="button-google-login"
                  >
                    <SiGoogle className="w-5 h-5" />
                    Google로 로그인
                  </Button>
                )}
                {providers?.kakao && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={handleKakaoLogin}
                    data-testid="button-kakao-login"
                  >
                    <SiKakaotalk className="w-5 h-5 text-yellow-500" />
                    Kakao로 로그인
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground text-center mt-4">
                로그인하면 서비스 이용약관에 동의하게 됩니다
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              <p className="mb-3">OAuth 인증 키가 설정되지 않았습니다.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}