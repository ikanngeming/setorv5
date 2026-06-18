import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, DollarSign } from "lucide-react";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function RiwayatPage() {
  const { data: deposits } = trpc.deposits.list.useQuery();
  const { data: emails } = trpc.emails.list.useQuery();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Riwayat</h1>
        <p className="text-muted-foreground mt-2">
          Lihat riwayat deposit dan email Anda
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposits">Deposit</TabsTrigger>
          <TabsTrigger value="emails">Email</TabsTrigger>
        </TabsList>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4">
          <Card>
            {deposits && deposits.length > 0 ? (
              <div className="divide-y">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{formatRupiah(deposit.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(deposit.createdAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                <p>Belum ada riwayat deposit</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails" className="space-y-4">
          <Card>
            {emails && emails.length > 0 ? (
              <div className="divide-y">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium font-mono text-sm">{email.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {email.provider.charAt(0).toUpperCase() + email.provider.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          email.status === "verified"
                            ? "bg-green-100 text-green-700"
                            : email.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : email.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {email.status === "verified"
                          ? "Terverifikasi"
                          : email.status === "pending"
                          ? "Menunggu"
                          : email.status === "rejected"
                          ? "Ditolak"
                          : "Kadaluarsa"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Mail size={32} className="mx-auto mb-2 opacity-50" />
                <p>Belum ada email</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
