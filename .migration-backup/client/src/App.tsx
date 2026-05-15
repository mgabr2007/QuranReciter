import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import Dashboard from "@/pages/dashboard";
import Recite from "@/pages/recite";
import History from "@/pages/history";
import Bookmarks from "@/pages/bookmarks";
import Memorization from "@/pages/memorization";
import Communities from "@/pages/communities";
import CreateCommunity from "@/pages/create-community";
import MyCommunities from "@/pages/my-communities";
import CommunityDetail from "@/pages/community-detail";
import JoinCommunity from "@/pages/join-community";
import Search from "@/pages/search";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/recite" component={Recite} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/communities" component={Communities} />
        <Route path="/communities/:id" component={CommunityDetail} />
        <Route path="/join-community/:id" component={JoinCommunity} />
        <Route path="/search" component={Search} />
        
        {/* Protected routes */}
        <Route path="/history">
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        </Route>
        <Route path="/bookmarks">
          <ProtectedRoute>
            <Bookmarks />
          </ProtectedRoute>
        </Route>
        <Route path="/memorization">
          <ProtectedRoute>
            <Memorization />
          </ProtectedRoute>
        </Route>
        <Route path="/communities/create">
          <ProtectedRoute>
            <CreateCommunity />
          </ProtectedRoute>
        </Route>
        <Route path="/my-communities">
          <ProtectedRoute>
            <MyCommunities />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
