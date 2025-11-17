import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/use-auth";
import Home from "@/pages/home";
import History from "@/pages/history";
import Bookmarks from "@/pages/bookmarks";
import Memorization from "@/pages/memorization";
import Communities from "@/pages/communities";
import CreateCommunity from "@/pages/create-community";
import MyCommunities from "@/pages/my-communities";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/history" component={History} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/memorization" component={Memorization} />
      <Route path="/communities" component={Communities} />
      <Route path="/communities/create" component={CreateCommunity} />
      <Route path="/my-communities" component={MyCommunities} />
      <Route component={NotFound} />
    </Switch>
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
