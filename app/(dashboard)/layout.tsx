import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 min-h-screen overflow-auto pb-16 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
