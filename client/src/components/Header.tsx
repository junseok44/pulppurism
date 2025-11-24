import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogIn, LogOut, Menu, X, ChevronDown } from "lucide-react"; // 👈 X, ChevronDown 아이콘 추가
import { useUser } from "@/hooks/useUser";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet"; // 👈 SheetClose 추가
import { SiGoogle, SiKakaotalk } from "react-icons/si";

interface AuthProviders {
  google: boolean;
  kakao: boolean;
}

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logout, isLoggingOut } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders({ google: false, kakao: false }));
  }, []);

  const navItems = [
    { path: "/howto", label: "이용방법"},
    { path: "/agendas", label: "안건보기"},
    { path: "/opinions", label: "주민의 목소리" },
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
      <div className="bg-transparent sticky top-0 z-50 w-full flex flex-col items-center pt-4 px-4 pointer-events-none" data-testid="header-main">    
        <header className="bg-ok_gray1 pointer-events-auto w-full max-w-6xl bg-background/80 backdrop-blur-md border border-border shadow-sm rounded-full h-16 px-6 flex items-center justify-between transition-all">    
          <div className="flex items-center gap-3">
            {/* PC 로고 */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group" data-testid="logo">
                
                {/* 👇 [수정] 기존 동그라미 div 삭제하고 img 태그로 교체! */}
                <img 
                  src="/icons/title.png"  // 👈 여기에 네 파일 경로를 적어! (예: /icons/logo.png)
                  alt="Logo"
                  // object-contain: 이미지가 찌그러지지 않게 비율 유지
                  className="w-auto h-5 object-contain group-hover:scale-110 transition-transform"
                />

                {/* 👇 옆에 글씨('주민참여')는 남겨둘게. (이미지에 글씨까지 포함돼있으면 이 줄 삭제해!) */}
                <h1 className="font-bagel text-xl hidden sm:block">
                  풀뿌리광장
                </h1>
                
              </div>
            </Link>
          </div>

          {/* PC 네비게이션 */}
          <nav className="hidden md:flex items-center gap-8" data-testid="nav-desktop">
            {/* 👇 하드코딩 대신 navItems.map 사용! */}
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.path) ? "text-primary font-bold" : "text-muted-foreground"
                }`}
                data-testid={`nav-${item.label}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* PC 오른쪽 버튼들 */}
          <div className="flex items-center gap-2">
             {/* (기존 PC 버튼 코드 그대로 유지 - user check 등) */}
             {user ? (
               <>
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
      </div>

      {/* 👇 2. 로그인 다이얼로그 (이게 꼭 있어야 해!) */}
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