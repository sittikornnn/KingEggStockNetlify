import { requireRole } from "@/lib/auth";
import DashboardContent from "@/components/Dashboardcontent";

export default async function DashboardPage() {
  await requireRole(["Admin", "Manager"]);

  return <DashboardContent />;
}