import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send } from "lucide-react";

const schema = z.object({
  amount: z.number({ invalid_type_error: "Masukkan nominal" }).min(10000, "Minimum Rp 10.000"),
});
type FormData = z.infer<typeof schema>;

export default function SetorPage() {
  const utils = trpc.useUtils();
  const { data: emails } = trpc.emails.list.useQuery();

  const setor = trpc.deposits.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.deposits.list.invalidate();
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const verifiedEmails = emails?.filter((e) => e.status === "verified") ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Setor Email</h1>
        <p className="text-muted-foreground text-sm mt-1">Ajukan permintaan setor saldo.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form Setor</CardTitle>
          <CardDescription>Masukkan nominal setor. Minimal Rp 10.000.</CardDescription>
        </CardHeader>
        <CardContent>
          {verifiedEmails.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Kamu belum memiliki email yang terverifikasi. Generate dan verifikasi email terlebih dahulu.
              </p>
            </div>
          )}
          <form
            onSubmit={handleSubmit((d) => setor.mutate({ amount: d.amount }))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="amount">Nominal Setor (Rp)</Label>
              <Input
                id="amount"
                type="number"
                min={10000}
                step={1000}
                placeholder="Contoh: 50000"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={setor.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {setor.isPending ? "Mengajukan..." : "Ajukan Setor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
