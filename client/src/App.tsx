import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import TeamMembers from "./pages/TeamMembers";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./_core/hooks/useAuth";

function Workspace({ children }: { children: React.ReactNode }) {
  useAuth();
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path={"/"}><Workspace><Home /></Workspace></Route>
      <Route path={"/team"}><Workspace><TeamMembers /></Workspace></Route>
      <Route path={"/clients"}><Workspace><Clients /></Workspace></Route>
      <Route path={"/projects"}><Workspace><Projects /></Workspace></Route>
      <Route path={"/tasks"}><Workspace><Tasks /></Workspace></Route>
      <Route path={"/reports"}><Workspace><Reports /></Workspace></Route>
      <Route path={"/notifications"}><Workspace><Notifications /></Workspace></Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
