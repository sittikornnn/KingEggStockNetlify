import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import IntakeContent from "@/components/IntakeContent";

export default async function IntakePage() {
  await requireRole(["Admin", "Employee"]);

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
          <div className="animate-pulse text-lg">กำลังโหลดข้อมูล...</div>
        </div>
      }
    >
      <IntakeContent />
    </Suspense>
  );
}