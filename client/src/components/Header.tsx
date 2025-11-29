import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogIn, LogOut, Search} from "lucide-react"; // 👈 X, ChevronDown 아이콘 추가
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
                
                {/* 2. 윗쪽 박스: [두런두런 + 나뭇잎] -> 가로(Row) 정렬 */}
                <div className="flex items-end mb-[-17px]"> {/* mb-[-2px]: 옥천마루와 간격 좁히기 */}
                  <span className="pb-[11px] pl-[3px] font-logosub text-[14px] tracking-tighter">
                    두런두런
                  </span>
                  <img 
                    src="/icons/title.png" 
                    alt="Logo"
                    // w-4 h-4: 작은 글씨에 맞춰 아이콘 크기도 작게 조절
                    className="w-11 h-11 object-contain group-hover:rotate-12 transition-transform duration-300" 
                  />
                </div>

                {/* 3. 아랫쪽 박스: [옥천마루] */}
                <h1 className="font-bagel text-2xl text-[#1e293b]">
                  옥천마루
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

        <button 
          onClick={() => setLocation("/search")} 
          // 👇 여기에 relative, z-50, cursor-pointer 추가!
          className="relative z-50 cursor-pointer rounded-full bg-primary w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
        
        <div>
      </div>
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