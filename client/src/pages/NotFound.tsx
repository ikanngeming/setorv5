import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground text-sm">Halaman yang kamu cari tidak ada.</p>
      <Button onClick={() => setLocation("/dashboard")}>Kembali ke Dashboard</Button>
    </div>
  );
}
