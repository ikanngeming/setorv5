import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LogOut, User } from "lucide-react";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
});
type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const { user, logout, refresh } = useAuth();
  const utils = trpc.useUtils();

  const updateProfile = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui");
      utils.auth.me.invalidate();
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "" },
  });

  useEffect(() => {
    if (user?.name) reset({ name: user.name });
  }, [user?.name, reset]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola profil dan akun kamu.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${
                user?.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={updateProfile.isPending} size="sm">
              {updateProfile.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Email" value={user?.email ?? "-"} />
          <Row label="Status" value={<StatusBadge status={user?.status ?? "active"} />} />
          <Row label="Bergabung" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} />
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              logout().then(() => { window.location.href = "/"; });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    suspended: "bg-yellow-100 text-yellow-700",
    banned:    "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
