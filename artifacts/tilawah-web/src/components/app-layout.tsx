import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { UserMenu } from "./user-menu";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  
  // Don't show layout on login/signup pages
  const isAuthPage = location === "/login" || location === "/signup";
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content area - uses ps (padding-start) which respects RTL/LTR direction */}
      <div className="lg:ps-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center lg:hidden gap-2">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">T</span>
              </div>
              <span className="font-bold">Tilawah</span>
            </div>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
