import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Send,
  Clock,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",     path: "/dashboard" },
  { icon: Mail,            label: "Generate Email", path: "/generate"  },
  { icon: Send,            label: "Setor Email",    path: "/setor"     },
  { icon: Clock,           label: "Riwayat",        path: "/riwayat"   },
  { icon: Settings,        label: "Settings",       path: "/settings"  },
];

function NotifButton() {
  const { data: count } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
  const { data: notifs, refetch } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
  const mark = trpc.notifications.markAsRead.useMutation({ onSuccess: () => refetch() });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {!!count && count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-3 border-b">
          <p className="font-semibold text-sm">Notifikasi</p>
          <p className="text-xs text-muted-foreground">{count ?? 0} belum dibaca</p>
        </div>
        {notifs && notifs.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {[...notifs].reverse().map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${!n.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                onClick={() => !n.isRead && mark.mutate({ notificationId: n.id })}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleDateString("id-ID")}
                </p>
                {!n.isRead && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Tidak ada notifikasi</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 px-4 h-14 border-b shrink-0">
        <Send className="h-5 w-5 text-primary" />
        <span className="font-bold text-sm">Setor Email Pro</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map(({ icon: Icon, label, path }) => {
          const active = location === path || (path === "/dashboard" && location === "/");
          return (
            <button
              key={path}
              onClick={() => { setLocation(path); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
        {user?.role === "admin" && (
          <button
            onClick={() => { setLocation("/admin"); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              location === "/admin"
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Admin Panel
          </button>
        )}
      </nav>

      <div className="p-3 border-t shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{user?.name ?? "-"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? "-"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  const currentPage = NAV.find(
    (n) => n.path === location || (n.path === "/dashboard" && location === "/")
  )?.label ?? (location === "/admin" ? "Admin Panel" : "Dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-card shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">{currentPage}</span>
          </div>
          <NotifButton />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
