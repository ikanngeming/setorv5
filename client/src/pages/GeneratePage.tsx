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
import { Loader2, Mail } from "lucide-react";

export default function GeneratePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState("gmail");

  const generateMutation = trpc.emails.generate.useMutation({
    onSuccess: () => {
      toast.success("Email berhasil dibuat!");
      setEmail("");
      setPassword("");
      setProvider("gmail");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat email");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Semua field harus diisi");
      return;
    }

    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    generateMutation.mutate({
      email,
      password,
      provider: provider as "gmail" | "outlook" | "yahoo",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Generate Email Baru</h1>
        <p className="text-muted-foreground mt-2">
          Buat akun email baru untuk setor
        </p>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="contoh@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={generateMutation.isPending}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={generateMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Password harus minimal 8 karakter
            </p>
          </div>

          {/* Provider Select */}
          <div className="space-y-2">
            <Label htmlFor="provider">Email Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Generate Email
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Info:</strong> Email yang dibuat akan melalui proses verifikasi terlebih dahulu sebelum dapat digunakan untuk setor.
        </p>
      </Card>
    </div>
  );
}
