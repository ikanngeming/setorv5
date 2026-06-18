import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export default function SetorPage() {
  const [amount, setAmount] = useState("");
  const [emailAccountId, setEmailAccountId] = useState<string>("");

  const { data: emails } = trpc.emails.list.useQuery();

  const setorMutation = trpc.deposits.create.useMutation({
    onSuccess: () => {
      toast.success("Permintaan setor berhasil dibuat!");
      setAmount("");
      setEmailAccountId("");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat setor");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseInt(amount);

    if (!amount || amountNum < 10000) {
      toast.error("Minimum setor Rp 10.000");
      return;
    }

    setorMutation.mutate({
      amount: amountNum,
      emailAccountId: emailAccountId ? parseInt(emailAccountId) : undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Setor Email</h1>
        <p className="text-muted-foreground mt-2">
          Kirim email untuk mendapatkan saldo
        </p>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Account Select */}
          <div className="space-y-2">
            <Label htmlFor="email-account">Email Account (Opsional)</Label>
            <Select value={emailAccountId} onValueChange={setEmailAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih email account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tidak ada</SelectItem>
                {emails?.map((email) => (
                  <SelectItem key={email.id} value={email.id.toString()}>
                    {email.email} ({email.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Minimum 10.000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={setorMutation.isPending}
              min="10000"
              step="1000"
            />
            <p className="text-xs text-muted-foreground">
              Minimum setor Rp 10.000
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={setorMutation.isPending}
          >
            {setorMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat Setor...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Buat Permintaan Setor
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Info:</strong> Permintaan setor akan diproses oleh admin dalam 1-2 hari kerja. Saldo akan langsung masuk setelah disetujui.
        </p>
      </Card>
    </div>
  );
}
