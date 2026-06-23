import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RiwayatPage() {
  const { data: deposits, isLoading: loadingDeposits } = trpc.deposits.list.useQuery();
  const { data: emails,   isLoading: loadingEmails   } = trpc.emails.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Riwayat</h1>
        <p className="text-muted-foreground text-sm mt-1">Semua aktivitas akun kamu.</p>
      </div>

      <Tabs defaultValue="deposits">
        <TabsList>
          <TabsTrigger value="deposits">Riwayat Setor</TabsTrigger>
          <TabsTrigger value="emails">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Pengajuan Setor</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDeposits ? (
                <Loader />
              ) : deposits && deposits.length > 0 ? (
                <div className="divide-y">
                  {[...deposits].reverse().map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold">Rp {d.amount.toLocaleString("id-ID")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                        {d.approvedAt && (
                          <p className="text-xs text-muted-foreground">
                            Diproses: {new Date(d.approvedAt).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Belum ada riwayat setor." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar Email</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEmails ? (
                <Loader />
              ) : emails && emails.length > 0 ? (
                <div className="divide-y">
                  {[...emails].reverse().map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{e.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{e.provider} • {new Date(e.createdAt).toLocaleDateString("id-ID")}</p>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Belum ada email terdaftar." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
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
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

function Loader() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-8">{text}</p>;
}
