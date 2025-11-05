import { Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

export default function Header({ title = "주민참여 플랫폼" }: { title?: string }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 bg-card border-b border-card-border z-40" data-testid="header-main">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold" data-testid="text-title">{title}</h1>
        <div className="flex items-center gap-2">
          <Link href="/search">
            <Button size="icon" variant="ghost" data-testid="button-search">
              <Search className="w-5 h-5" />
            </Button>
          </Link>
          <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
