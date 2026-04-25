import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-50">
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
