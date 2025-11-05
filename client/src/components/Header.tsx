import { Link } from "wouter";

export default function Header() {
  return (
    <header className="sticky top-0 bg-card border-b border-card-border z-40" data-testid="header-main">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 px-3 py-2 rounded-lg" data-testid="logo">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">주</span>
            </div>
            <h1 className="text-lg font-bold">주민참여 플랫폼</h1>
          </div>
        </Link>
      </div>
    </header>
  );
}
