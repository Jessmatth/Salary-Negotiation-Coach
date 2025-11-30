import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Scorecard from "@/pages/scorecard";
import Quiz from "@/pages/quiz";
import Scripts from "@/pages/scripts";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/scorecard" component={Scorecard} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/scripts" component={Scripts} />
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
