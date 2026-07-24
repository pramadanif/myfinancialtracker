"use client";

import { usePathname } from "next/navigation";
import { ActivityModeBanners } from "@/components/checkin/CheckinModeToggle";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isFullBleed = pathname === "/transactions";

  return (
    <main
      className={`min-h-screen max-w-lg mx-auto relative standalone-safe-top w-full overflow-x-hidden ${
        isLogin ? "bg-white" : isFullBleed ? "bg-background-secondary pb-[76px]" : "bg-background-secondary pb-[76px]"
      }`}
    >
      {/* Subtle phone-frame shadow on larger screens */}
      <div className="min-h-screen w-full max-w-full overflow-x-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <ActivityModeBanners />
        {children}
      </div>
    </main>
  );
}
