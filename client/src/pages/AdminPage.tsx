import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Send, Users } from "lucide-react";
import { useState } from "react";

export default function AdminPage() {
  const utils = trpc.useUtils();
  const { data: pending, isLoading } = trpc.deposits.getPending.useQuery();

  const approve = trpc.deposits.approve.useMutation({
    onSuccess: () => {
      toast.success("Deposit di-approve ✅");
      utils.deposits.getPending.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reject = trpc.deposits.reject.useMutation({
    onSuccess: () => {
      toast.success("Deposit di-reject");
      utils.deposits.getPending.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola deposit dan kirim broadcast.</p>
      </div>

      <Tabs defaultValue="deposits">
        <TabsList>
          <TabsTrigger value="deposits">
            Deposit Pending
            {!!pending?.length && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permintaan Deposit Pending</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : pending && pending.length > 0 ? (
                <div className="divide-y">
                  {pending.map((d) => (
                    <DepositRow
                      key={d.id}
                      deposit={d}
                      onApprove={() => approve.mutate({ depositId: d.id })}
                      onReject={(reason) => reject.mutate({ depositId: d.id, reason })}
                      loading={approve.isPending || reject.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tidak ada deposit pending 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="mt-4">
          <BroadcastForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DepositRow({
  deposit,
  onApprove,
  onReject,
  loading,
}: {
  deposit: { id: number; userId: number; amount: number; createdAt: Date };
  onApprove: () => void;
  onReject: (reason: string) => void;
  loading: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Rp {deposit.amount.toLocaleString("id-ID")}</p>
          <p className="text-xs text-muted-foreground">
            User #{deposit.userId} · {new Date(deposit.createdAt).toLocaleDateString("id-ID", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
            onClick={onApprove}
            disabled={loading}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
            onClick={() => setRejecting((v) => !v)}
            disabled={loading}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </div>
      </div>
      {rejecting && (
        <div className="flex gap-2">
          <Input
            placeholder="Alasan penolakan (minimal 5 karakter)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-sm"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={reason.trim().length < 5 || loading}
            onClick={() => {
              onReject(reason.trim());
              setRejecting(false);
              setReason("");
            }}
          >
            Kirim
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setRejecting(false); setReason(""); }}
          >
            Batal
          </Button>
        </div>
      )}
    </div>
  );
}

function BroadcastForm() {
  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [target,  setTarget]  = useState<"all" | "user" | "admin">("all");

  const create = trpc.notifications.createBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setTitle(""); setContent("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Kirim Broadcast ke Semua User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Judul Broadcast</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Update Sistem Maintenance"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Isi Pesan</Label>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis pesan broadcast di sini..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Target Penerima</Label>
          <div className="flex gap-2 flex-wrap">
            {(["all", "user", "admin"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  target === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input hover:bg-muted text-muted-foreground"
                }`}
              >
                {t === "all" ? "🌐 Semua User" : t === "user" ? "👤 User Saja" : "🔧 Admin Saja"}
              </button>
            ))}
          </div>
        </div>
        <Button
          className="w-full"
          disabled={title.trim().length < 3 || content.trim().length < 10 || create.isPending}
          onClick={() => create.mutate({ title: title.trim(), content: content.trim(), targetRole: target })}
        >
          <Send className="h-4 w-4 mr-2" />
          {create.isPending ? "Mengirim..." : "Kirim Broadcast"}
        </Button>
      </CardContent>
    </Card>
  );
}
