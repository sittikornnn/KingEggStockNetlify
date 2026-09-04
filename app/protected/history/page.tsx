import { requireRole } from "@/lib/auth";
import HistoryContent from "@/components/Historycontent";

export default async function HistoryPage() {
  // ตรวจสอบสิทธิ์ฝั่ง Server
  await requireRole(["Admin", "Manager"]);

  return <HistoryContent />;
}