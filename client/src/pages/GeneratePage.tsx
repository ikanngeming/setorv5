import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Mail, Plus } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  provider: z.enum(["gmail", "outlook", "yahoo"]),
});
type FormData = z.infer<typeof schema>;

export default function GeneratePage() {
  const utils = trpc.useUtils();
  const { data: emails, isLoading } = trpc.emails.list.useQuery();

  const generate = trpc.emails.generate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.emails.list.invalidate();
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { provider: "gmail" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate Email</h1>
        <p className="text-muted-foreground text-sm mt-1">Daftarkan akun email baru untuk di-setor.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form Generate Email</CardTitle>
          <CardDescription>Isi detail email yang ingin kamu daftarkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => generate.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Alamat Email</Label>
              <Input id="email" type="email" placeholder="contoh@gmail.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 karakter" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select defaultValue="gmail" onValueChange={(v) => setValue("provider", v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="outlook">Outlook</SelectItem>
                  <SelectItem value="yahoo">Yahoo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={generate.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {generate.isPending ? "Mendaftarkan..." : "Daftarkan Email"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : emails && emails.length > 0 ? (
            <div className="divide-y">
              {[...emails].reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{e.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.provider}</p>
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada email terdaftar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  "bg-yellow-100 text-yellow-700",
    verified: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    expired:  "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
