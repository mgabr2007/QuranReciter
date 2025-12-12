import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, History, Heart, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.clear(); // Clear all cached data on logout
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm" data-testid="button-login">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" data-testid="button-signup">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2" data-testid="button-user-menu">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="hidden md:inline-block font-medium">
            {user.displayName || user.username}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div>
            <p className="font-medium">{user.displayName || user.username}</p>
            {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/my-communities">
          <DropdownMenuItem className="cursor-pointer" data-testid="menu-my-communities">
            <Users className="mr-2 h-4 w-4" />
            <span>My Communities</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/history">
          <DropdownMenuItem className="cursor-pointer" data-testid="menu-history">
            <History className="mr-2 h-4 w-4" />
            <span>Listening History</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/bookmarks">
          <DropdownMenuItem className="cursor-pointer" data-testid="menu-bookmarks">
            <Heart className="mr-2 h-4 w-4" />
            <span>Bookmarks</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer" data-testid="menu-settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="cursor-pointer text-red-600 dark:text-red-400"
          data-testid="menu-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{logoutMutation.isPending ? "Logging out..." : "Log Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
