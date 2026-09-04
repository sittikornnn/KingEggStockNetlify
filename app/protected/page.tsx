import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { Suspense } from "react";

// กำหนด Mapping เส้นทางตาม Role
const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  user: "/protected", // หน้าเริ่มต้นของ User ทั่วไป
};

async function UserDetails() {
  const supabase = await createClient();
  
  // ดึงข้อมูล User Session
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // ดึง Role จาก user_metadata (หรือ app_metadata ตามโครงสร้างที่คุณใช้เก็บ)
  const userRole = user.user_metadata?.role || "user";

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-amber-400">
        Current Role: <span className="uppercase">{userRole}</span>
      </p>
      <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto bg-slate-900">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ตรวจสอบ Role และ Redirect ถ้าไม่อยู่ในหน้าที่ถูกต้อง
  const role = (user.user_metadata?.role as string) || "user";

  // ใช้ ROLE_ROUTES เพื่อ redirect อัตโนมัติถ้ามี route ที่กำหนดไว้สำหรับ role นั้นๆ
  if (role !== "user" && ROLE_ROUTES[role]) {
    redirect(ROLE_ROUTES[role]);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-6">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page for authenticated users.
        </div>
      </div>
      
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your User Details</h2>
        <Suspense fallback={<p className="text-sm">Loading user data...</p>}>
          <UserDetails />
        </Suspense>
      </div>

      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}