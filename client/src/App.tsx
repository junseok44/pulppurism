import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AgendaListPage from "@/pages/AgendaListPage";
import OpinionListPage from "@/pages/OpinionListPage";
import MyPage from "@/pages/MyPage";
import AgendaDetailPage from "@/pages/AgendaDetailPage";
import OpinionDetailPage from "@/pages/OpinionDetailPage";
import SearchPage from "@/pages/SearchPage";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AgendaListPage} />
      <Route path="/opinions" component={OpinionListPage} />
      <Route path="/my" component={MyPage} />
      <Route path="/agenda/:id" component={AgendaDetailPage} />
      <Route path="/opinion/:id" component={OpinionDetailPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
