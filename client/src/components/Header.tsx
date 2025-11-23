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
    { path: "/", label: "안건보기"},
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
      <div className="sticky top-0 z-50 w-full flex flex-col items-center pt-4 px-4 pointer-events-none" data-testid="header-main">
        
        <header className="pointer-events-auto w-full max-w-6xl bg-background/80 backdrop-blur-md border border-border shadow-sm rounded-full h-16 px-6 flex items-center justify-between transition-all">
          
          <div className="flex items-center gap-3">
            
            {/* 👇 [모바일 메뉴] 사진처럼 전체 화면을 덮는 베이지색 카드 스타일 */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2 rounded-full">
                    <Menu className="w-6 h-6 text-black-n1" />
                  </Button>
                </SheetTrigger>
                
                {/* 👇 SheetContent 부분 전체 교체! */}
                <SheetContent 
                  side="bottom"
                  // 1. [&>button]:hidden -> 이게 핵심! Shadcn이 자동으로 만드는 닫기 버튼(오른쪽 위)을 숨김.
                  className="h-[96%] w-[96%] left-[2%] right-[2%] bottom-[2%] rounded-[32px] bg-ok_gray2 border-none p-0 focus:outline-none flex flex-col [&>button]:hidden"
                >
                  {/* 1. 상단 헤더 (왼쪽 X + 중앙 로고) */}
                  <div className="flex items-center justify-between px-6 py-6">
                    {/* 왼쪽 커스텀 X 버튼 */}
                    <SheetClose asChild>
                      <button className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-black-n1" />
                      </button>
                    </SheetClose>
                    
                    <span className="text-2xl font-bold tracking-tighter text-black-n1 font-['Pretendard_Variable'] absolute left-1/2 -translate-x-1/2">
                      옥천광장
                    </span>
                    
                    <div className="w-10" /> {/* 균형 맞추기용 빈 공간 */}
                  </div>

                  {/* 2. 메뉴 리스트 (스크롤 영역) */}
                  <div className="flex-1 overflow-y-auto px-8">
                    <div className="flex flex-col">
                      {navItems.map((item) => (
                        <Link key={item.path} href={item.path}>
                          <a
                            className="py-5 border-b border-[#EBE8E0] text-xl font-medium text-black-n1 flex items-center gap-3 hover:text-ok_sub1 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.label}
                          </a>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* 3. 하단 버튼 영역 (Buy Now 삭제됨!) */}
                  <div className="p-6 flex flex-col gap-4 mt-auto">
                    
                    {user ? (
                      // ✅ 로그인 상태: [마이페이지 (주황색)] + [로그아웃 (작게)]
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => { setLocation("/my"); setIsMobileMenuOpen(false); }}
                          className="flex-1 h-14 rounded-full bg-primary hover:bg-primary_hov text-white text-lg font-bold shadow-none"
                        >
                          마이페이지
                        </Button>
                        <Button 
                          onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                          variant="ghost"
                          className="h-14 w-14 rounded-full text-muted-foreground hover:bg-black/5"
                        >
                          <LogOut className="w-6 h-6" />
                        </Button>
                      </div>
                    ) : (
                      // ✅ 비로그인 상태: [Login (주황색)] 하나만 크게!
                      <Button 
                        onClick={() => { setShowLoginDialog(true); setIsMobileMenuOpen(false); }}
                        className="w-full h-14 rounded-full bg-primary hover:bg-primary_hov text-white text-lg font-bold shadow-none"
                      >
                        Login
                      </Button>
                    )}
                  </div>

                </SheetContent>
              </Sheet>
            </div>

            {/* PC 로고 */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group" data-testid="logo">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-primary-foreground font-bold text-lg">주</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight hidden sm:block">주민참여</h1>
              </div>
            </Link>
          </div>

          {/* PC 네비게이션 */}
          <nav className="hidden md:flex items-center gap-8" data-testid="nav-desktop">
            {/* 👇 하드코딩 대신 navItems.map 사용! */}
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.path) ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                  data-testid={`nav-${item.label}`}
                >
                  {item.label}
                </a>
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

      {/* 로그인 다이얼로그 (변동 없음) */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
         {/* ... (기존 다이얼로그 내용) ... */}
         <DialogContent><DialogHeader><DialogTitle>로그인</DialogTitle></DialogHeader>{/* ...내용... */}</DialogContent>
      </Dialog>
    </>
  );
}