import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, CheckCircle, XCircle, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AdminPage() {
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDepositId, setSelectedDepositId] = useState<number | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastRole, setBroadcastRole] = useState("all");

  const { data: pendingDeposits } = trpc.deposits.getPending.useQuery();
  const { data: broadcasts } = trpc.notifications.getBroadcasts.useQuery();

  const approveMutation = trpc.deposits.approve.useMutation({
    onSuccess: () => {
      toast.success("Deposit berhasil di-approve");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal approve deposit");
    },
  });

  const rejectMutation = trpc.deposits.reject.useMutation({
    onSuccess: () => {
      toast.success("Deposit berhasil di-reject");
      setRejectReason("");
      setSelectedDepositId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal reject deposit");
    },
  });

  const createBroadcastMutation = trpc.notifications.createBroadcast.useMutation({
    onSuccess: () => {
      toast.success("Broadcast berhasil dibuat");
      setBroadcastTitle("");
      setBroadcastContent("");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat broadcast");
    },
  });

  const publishBroadcastMutation = trpc.notifications.publishBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal publish broadcast");
    },
  });

  const handleApprove = (depositId: number) => {
    approveMutation.mutate({ depositId });
  };

  const handleReject = () => {
    if (!selectedDepositId || !rejectReason) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    rejectMutation.mutate({
      depositId: selectedDepositId,
      reason: rejectReason,
    });
  };

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();

    if (!broadcastTitle || !broadcastContent) {
      toast.error("Judul dan konten harus diisi");
      return;
    }

    createBroadcastMutation.mutate({
      title: broadcastTitle,
      content: broadcastContent,
      targetRole: broadcastRole as "all" | "user" | "admin",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">
          Kelola approval deposit dan broadcast
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposits">Pending Deposits</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
        </TabsList>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4">
          <Card>
            {pendingDeposits && pendingDeposits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">User ID</th>
                      <th className="text-left p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Created</th>
                      <th className="text-right p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{deposit.userId}</td>
                        <td className="p-4 font-medium">
                          {formatRupiah(deposit.amount)}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-700">
                            Pending
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(deposit.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(deposit.id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedDepositId(deposit.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Deposit</DialogTitle>
                                <DialogDescription>
                                  Masukkan alasan penolakan deposit ini
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Alasan penolakan..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <Button
                                  onClick={handleReject}
                                  disabled={rejectMutation.isPending}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  {rejectMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Rejecting...
                                    </>
                                  ) : (
                                    "Reject"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>Tidak ada deposit yang menunggu approval</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast" className="space-y-4">
          {/* Create Broadcast Form */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Buat Broadcast Baru</h2>
            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  placeholder="Judul broadcast..."
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  disabled={createBroadcastMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Konten</Label>
                <Textarea
                  id="content"
                  placeholder="Konten broadcast..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  disabled={createBroadcastMutation.isPending}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Target Role</Label>
                <select
                  id="role"
                  value={broadcastRole}
                  onChange={(e) => setBroadcastRole(e.target.value)}
                  disabled={createBroadcastMutation.isPending}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Semua Pengguna</option>
                  <option value="user">User Biasa</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={createBroadcastMutation.isPending}
                className="w-full"
              >
                {createBroadcastMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Buat Broadcast
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Published Broadcasts */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Broadcast Terpublikasi</h2>
              {broadcasts && broadcasts.length > 0 ? (
                <div className="space-y-4">
                  {broadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className="p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <h3 className="font-semibold">{broadcast.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {broadcast.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(broadcast.publishedAt!).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Belum ada broadcast terpublikasi
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
