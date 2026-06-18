import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Mail,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
  Send,
} from "lucide-react";
import { useLocation } from "wouter";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: deposits } = trpc.deposits.list.useQuery();
  const { data: emails } = trpc.emails.list.useQuery();

  const totalEmails = emails?.length || 0;
  const balance = settings?.balance || 0;
  const pendingDeposits = deposits?.filter((d) => d.status === "pending").length || 0;
  const approvedDeposits = deposits?.filter((d) => d.status === "approved").length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Selamat datang, {settings?.name || "User"}! 👋</h1>
        <p className="text-muted-foreground mt-2">
          Kelola email dan deposit Anda dengan mudah
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Wallet}
          label="Saldo Anda"
          value={formatRupiah(balance)}
          color="#10b981"
        />
        <StatCard
          icon={Mail}
          label="Total Email"
          value={totalEmails}
          color="#3b82f6"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pendingDeposits}
          color="#f59e0b"
        />
        <StatCard
          icon={TrendingUp}
          label="Approved"
          value={approvedDeposits}
          color="#8b5cf6"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate("/generate")}
            className="h-auto py-4 flex items-center justify-between"
            variant="outline"
          >
            <div className="flex items-center gap-2">
              <Zap size={20} />
              <span>Generate Email</span>
            </div>
            <ArrowRight size={16} />
          </Button>
          <Button
            onClick={() => navigate("/setor")}
            className="h-auto py-4 flex items-center justify-between"
            variant="outline"
          >
            <div className="flex items-center gap-2">
              <Send size={20} />
              <span>Setor Email</span>
            </div>
            <ArrowRight size={16} />
          </Button>
          <Button
            onClick={() => navigate("/riwayat")}
            className="h-auto py-4 flex items-center justify-between"
            variant="outline"
          >
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span>Lihat Riwayat</span>
            </div>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      {/* Recent Deposits */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Deposit Terbaru</h2>
        <Card>
          {deposits && deposits.length > 0 ? (
            <div className="divide-y">
              {deposits.slice(-5).reverse().map((deposit) => (
                <div key={deposit.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{formatRupiah(deposit.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(deposit.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      deposit.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : deposit.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {deposit.status === "approved"
                      ? "Disetujui"
                      : deposit.status === "pending"
                      ? "Menunggu"
                      : "Ditolak"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Mail size={32} className="mx-auto mb-2 opacity-50" />
              <p>Belum ada deposit. Mulai setor email sekarang!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
