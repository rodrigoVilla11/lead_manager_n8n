import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <Header />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
