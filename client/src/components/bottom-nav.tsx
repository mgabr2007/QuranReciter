import { Link, useLocation } from "wouter";
import { Home, Users, BarChart3, Heart, Book } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Book, label: "Recite", path: "/recite" },
  { icon: Users, label: "Communities", path: "/communities" },
  { icon: BarChart3, label: "Analytics", path: "/memorization" },
  { icon: Heart, label: "Bookmarks", path: "/bookmarks" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full transition-colors cursor-pointer",
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}
                data-testid={`bottom-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
