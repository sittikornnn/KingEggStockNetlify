import { ReactNode, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { requireAuthWithProfile } from "@/lib/auth";

// Line 5 removed: export const instant = false;

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, role } = await requireAuthWithProfile();

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar userEmail={user.email ?? ""} role={role} />
      <main className="w-full">
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
              <div className="animate-pulse text-lg">กำลังโหลด...</div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}