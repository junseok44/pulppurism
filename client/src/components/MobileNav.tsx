import { Link, useLocation } from "wouter";
import { FileText, MessageSquare, User, LogIn } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { SiGoogle, SiKakaotalk } from "react-icons/si";
import { queryClient } from "@/lib/queryClient";

interface AuthProviders {
  google: boolean;
  kakao: boolean;
}

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then(res => res.json())
      .then(data => setProviders(data))
      .catch(() => setProviders({ google: false, kakao: false }));
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleKakaoLogin = () => {
    window.location.href = "/api/auth/kakao";
  };

  const hasAnyProvider = providers && (providers.google || providers.kakao);

  const navItems = [
    { path: "/", icon: FileText, label: "안건" },
    { path: "/opinions", icon: MessageSquare, label: "주민의견" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border md:hidden z-50" data-testid="nav-mobile">
        <div className="flex items-center h-16">
          <div className="flex-1 flex justify-center">
            <Link href="/agendas">
              <button
                className={`flex flex-col items-center justify-center gap-1 px-6 py-2 hover-elevate active-elevate-2 rounded-lg ${
                  location === "/" ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-안건"
              >
                <FileText className={`w-5 h-5 ${location === "/" ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">안건</span>
              </button>
            </Link>
          </div>
          
          <div className="flex-1 flex justify-center">
            <Link href="/opinions">
              <button
                className={`flex flex-col items-center justify-center gap-1 px-6 py-2 hover-elevate active-elevate-2 rounded-lg ${
                  location === "/opinions" ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-주민의견"
              >
                <MessageSquare className={`w-5 h-5 ${location === "/opinions" ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">주민의견</span>
              </button>
            </Link>
          </div>
          
          <div className="flex-1 flex justify-center">
            {user ? (
              <Link href="/my">
                <button
                  className={`flex flex-col items-center justify-center gap-1 px-6 py-2 hover-elevate active-elevate-2 rounded-lg ${
                    location === "/my" ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid="nav-마이페이지"
                >
                  <User className={`w-5 h-5 ${location === "/my" ? "fill-current" : ""}`} />
                  <span className="text-xs font-medium">마이페이지</span>
                </button>
              </Link>
            ) : (
              <button
                onClick={() => setShowLoginDialog(true)}
                className="flex flex-col items-center justify-center gap-1 px-6 py-2 hover-elevate active-elevate-2 rounded-lg text-muted-foreground"
                data-testid="nav-로그인"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-xs font-medium">로그인</span>
              </button>
            )}
          </div>
        </div>
      </nav>

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
