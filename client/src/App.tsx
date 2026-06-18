import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import GeneratePage from "./pages/GeneratePage";
import SetorPage from "./pages/SetorPage";
import RiwayatPage from "./pages/RiwayatPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";

function ProtectedRoute({
  component: Component,
  requiredRole,
}: {
  component: React.ComponentType<any>;
  requiredRole?: "admin" | "user";
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return <DashboardLayoutSkeleton />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  // redirectOnUnauthenticated: true → useAuth will call getLoginUrl() lazily
  // inside useEffect and redirect. While waiting, show skeleton (not 404).
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });

  if (loading || !user) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/generate" component={GeneratePage} />
        <Route path="/setor" component={SetorPage} />
        <Route path="/riwayat" component={RiwayatPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route
          path="/admin"
          component={() => (
            <ProtectedRoute component={AdminPage} requiredRole="admin" />
          )}
        />
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
