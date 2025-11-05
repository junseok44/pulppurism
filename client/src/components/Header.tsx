import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

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

  return (
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
        </nav>
      </div>
    </header>
  );
}
