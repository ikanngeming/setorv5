import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { getLoginUrl } from "@/const";
import { Route, Switch } from "wouter";
import { useEffect, useRef } from "react";
import Layout from "./components/Layout";
import Skeleton from "./components/Skeleton";
import Dashboard from "./pages/Dashboard";
import GeneratePage from "./pages/GeneratePage";
import SetorPage from "./pages/SetorPage";
import RiwayatPage from "./pages/RiwayatPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

function Router() {
  const { user, loading } = useAuth();
  // Ref mencegah redirect loop — hanya redirect satu kali
  const redirected = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      redirected.current = false;
      return;
    }
    if (redirected.current) return;

    const url = getLoginUrl();
    if (!url || url === "/" || window.location.href === url) return;

    redirected.current = true;
    window.location.href = url;
  }, [loading, user]);

  if (loading || !user) return <Skeleton />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/generate" component={GeneratePage} />
        <Route path="/setor" component={SetorPage} />
        <Route path="/riwayat" component={RiwayatPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route
          path="/admin"
          component={() =>
            user.role === "admin" ? <AdminPage /> : <NotFound />
          }
        />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <Toaster richColors position="top-right" />
      <AuthProvider>
        <Router />
      </AuthProvider>
    </TooltipProvider>
  );
}
