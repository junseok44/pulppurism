import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogIn, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { SiGoogle, SiKakaotalk } from "react-icons/si";
import { queryClient } from "@/lib/queryClient";

interface AuthProviders {
  google: boolean;
  kakao: boolean;
}

export default function Header() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then(res => res.json())
      .then(data => setProviders(data))
      .catch(() => setProviders({ google: false, kakao: false }));
  }, []);

  const navItems = [
    { path: "/", label: "안건" },
    { path: "/opinions", label: "주민의견" },
    { path: "/my", label: "마이페이지" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
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
      <header className="sticky top-0 bg-card border-b border-card-border z-40" data-testid="header-main">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 px-3 py-2 rounded-lg" data-testid="logo">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">주</span>
              </div>
              <h1 className="text-lg font-bold">주민참여 플랫폼</h1>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2" data-testid="nav-desktop">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={`px-4 py-2 rounded-lg font-medium hover-elevate active-elevate-2 cursor-pointer ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                  data-testid={`nav-${item.label}`}
                >
                  {item.label}
                </div>
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/my">
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-profile">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowLoginDialog(true)}
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                로그인
              </Button>
            )}
          </nav>
        </div>
      </header>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent data-testid="dialog-login">
          <DialogHeader>
            <DialogTitle>로그인</DialogTitle>
            <DialogDescription>
              {hasAnyProvider 
                ? "소셜 계정으로 간편하게 로그인하세요"
                : "OAuth 인증 설정이 필요합니다"
              }
            </DialogDescription>
          </DialogHeader>
          {hasAnyProvider ? (
            <>
              <div className="space-y-3">
                {providers?.google && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
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
                    className="w-full justify-start gap-3"
                    onClick={handleKakaoLogin}
                    data-testid="button-kakao-login"
                  >
                    <SiKakaotalk className="w-5 h-5 text-yellow-500" />
                    Kakao로 로그인
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground text-center mt-4">
                로그인하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다
              </div>
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-auto p-0 hover:bg-transparent"
                  onClick={() => {
                    setShowLoginDialog(false);
                  }}
                  data-testid="button-signup"
                >
                  회원가입
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-auto p-0 hover:bg-transparent"
                  onClick={() => {
                    setShowLoginDialog(false);
                  }}
                  data-testid="button-find-account"
                >
                  계정 찾기
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              <p className="mb-3">OAuth 인증 키가 설정되지 않았습니다.</p>
              <p className="text-xs">
                관리자에게 문의하거나 환경 변수를 설정해주세요.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
