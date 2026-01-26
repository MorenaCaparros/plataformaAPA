import Sidebar from '@/components/layouts/Sidebar';
import AnimatedBackground from '@/components/layouts/AnimatedBackground';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative">
      {/* Background animado */}
      <AnimatedBackground />

      {/* Layout con Sidebar */}
      <div className="flex">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
