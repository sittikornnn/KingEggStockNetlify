import { requireRole } from "@/lib/auth";
import StockContent from "@/components/StockContent";

export default async function StockPage() {
  await requireRole(["Admin", "Employee"]);

  return <StockContent />;
}