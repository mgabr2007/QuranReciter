import { Link, useLocation } from "wouter";
import { Home, Users, BarChart3, Heart, History, Search, Book } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Book, label: "Recite", path: "/recite" },
  { icon: Users, label: "Communities", path: "/communities" },
  { icon: BarChart3, label: "Analytics", path: "/memorization" },
  { icon: Heart, label: "Bookmarks", path: "/bookmarks" },
  { icon: History, label: "History", path: "/history" },
  { icon: Search, label: "Search", path: "/search" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-card">
      <div className="flex items-center gap-2 h-16 px-6 border-b border-border">
        <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <span className="font-bold text-lg">Tilawah</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
