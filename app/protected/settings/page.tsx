// app/settings/page.tsx (หรือเส้นทางหน้าของคุณ)
import { requireRole } from "@/lib/auth";
import SettingsClient from "@/components/SettingContent";

export default async function SettingsPage() {
  // ตรวจสอบ Auth / Role บน Server Side
  await requireRole(["Admin"]);

  return <SettingsClient />;
}