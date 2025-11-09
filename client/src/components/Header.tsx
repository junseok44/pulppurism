import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogIn, LogOut, User } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, login, logout, isLoggingIn, isLoggingOut } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [username, setUsername] = useState("");

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

  const handleLogin = () => {
    if (username.trim()) {
      login(username.trim());
      setShowLoginDialog(false);
      setUsername("");
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
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                사용자 이름
              </label>
              <Input
                placeholder="사용자 이름을 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={isLoggingIn}
                data-testid="input-username"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLoginDialog(false)}
                disabled={isLoggingIn}
                data-testid="button-cancel-login"
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleLogin}
                disabled={!username.trim() || isLoggingIn}
                data-testid="button-submit-login"
              >
                {isLoggingIn ? "로그인 중..." : "로그인"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
