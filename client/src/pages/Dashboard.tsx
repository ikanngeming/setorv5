import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, Wallet, Clock } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: balance } = trpc.settings.getBalance.useQuery();
  const { data: emails } = trpc.emails.list.useQuery();
  const { data: deposits } = trpc.deposits.list.useQuery();

  const pendingDeposits = deposits?.filter((d) => d.status === "pending").length ?? 0;
  const verifiedEmails = emails?.filter((e) => e.status === "verified").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Selamat datang, {user?.name?.split(" ")[0] ?? "User"} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Ini ringkasan akun kamu hari ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Saldo"
          value={`Rp ${(balance ?? 0).toLocaleString("id-ID")}`}
          icon={<Wallet className="h-5 w-5 text-green-500" />}
          sub="Total saldo aktif"
        />
        <StatCard
          title="Email Terdaftar"
          value={emails?.length ?? 0}
          icon={<Mail className="h-5 w-5 text-blue-500" />}
          sub={`${verifiedEmails} terverifikasi`}
        />
        <StatCard
          title="Total Setor"
          value={deposits?.length ?? 0}
          icon={<Send className="h-5 w-5 text-purple-500" />}
          sub="Riwayat pengajuan setor"
        />
        <StatCard
          title="Menunggu Approval"
          value={pendingDeposits}
          icon={<Clock className="h-5 w-5 text-orange-500" />}
          sub="Setor menunggu konfirmasi"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Email Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {emails && emails.length > 0 ? (
              <div className="space-y-2">
                {emails.slice(-5).reverse().map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{e.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.provider}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Belum ada email terdaftar</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Riwayat Setor Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {deposits && deposits.length > 0 ? (
              <div className="space-y-2">
                {[...deposits].reverse().slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">Rp {d.amount.toLocaleString("id-ID")}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Belum ada riwayat setor</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, sub }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    verified: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    expired:  "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
