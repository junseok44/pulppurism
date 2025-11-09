import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogIn, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Header() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowAuthDialog(false);
      setEmail("");
      setPassword("");
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "로그인 실패",
        description: error.message || "이메일 또는 비밀번호를 확인해주세요",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string }) => {
      return await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowAuthDialog(false);
      setEmail("");
      setPassword("");
      setUsername("");
      toast({
        title: "회원가입 성공",
        description: "환영합니다!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "회원가입 실패",
        description: error.message || "다시 시도해주세요",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      if (!username.trim()) {
        toast({
          title: "입력 오류",
          description: "사용자 이름을 입력해주세요",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate({ username, email, password });
    }
  };

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
                onClick={() => {
                  setIsLogin(true);
                  setShowAuthDialog(true);
                }}
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                로그인
              </Button>
            )}
          </nav>
        </div>
      </header>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent data-testid="dialog-auth">
          <DialogHeader>
            <DialogTitle>{isLogin ? "로그인" : "회원가입"}</DialogTitle>
            <DialogDescription>
              {isLogin ? "이메일과 비밀번호로 로그인하세요" : "새 계정을 만들어 주민참여 플랫폼을 시작하세요"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">사용자 이름</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="홍길동"
                  required={!isLogin}
                  data-testid="input-username"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                required
                minLength={6}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || registerMutation.isPending}
              data-testid="button-submit-auth"
            >
              {loginMutation.isPending || registerMutation.isPending
                ? "처리 중..."
                : isLogin
                ? "로그인"
                : "회원가입"}
            </Button>
          </form>
          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
                setUsername("");
              }}
              className="text-primary hover:underline"
              data-testid="button-toggle-auth"
            >
              {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
