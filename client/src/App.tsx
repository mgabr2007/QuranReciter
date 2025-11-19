import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import Dashboard from "@/pages/dashboard";
import Recite from "@/pages/recite";
import History from "@/pages/history";
import Bookmarks from "@/pages/bookmarks";
import Memorization from "@/pages/memorization";
import Communities from "@/pages/communities";
import CreateCommunity from "@/pages/create-community";
import MyCommunities from "@/pages/my-communities";
import Search from "@/pages/search";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/recite" component={Recite} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/history" component={History} />
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/memorization" component={Memorization} />
        <Route path="/communities" component={Communities} />
        <Route path="/communities/create" component={CreateCommunity} />
        <Route path="/my-communities" component={MyCommunities} />
        <Route path="/search" component={Search} />
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
