"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import StockList from "@/components/StockList";
import SellModal from "@/components/SellModal";
import IntakeNotify from "@/components/Notify";
import { createClient } from "@/lib/supabase/client";

interface DBCategory {
  ID_Category: number;
  Name_Category: string;
}

interface RawSupabaseStockItem {
  ID_Intake: number;
  CreateDate: string;
  EggStack: number;
  EggTray: number;
  EggQty: number;
  EggWeight: number;
  Employee: string;
  LastUpdate?: string;
  ID_House?: { Name_House: string } | null;
  ID_Room?: { Name_Room: string } | null;
  ID_Pallet?: { Name_Pallet: string } | null;
  EggCategory?: { Name_Category: string } | null;
  EggType?: { Name_EggType: string } | null;
  ID_Location?: { Name_Location: string } | null;
}

export interface Stock {
  ID_Intake?: number;
  CreateDate: string;
  House: string;
  Room: string;
  Pallet: string;
  EggCategory: string;
  EggType: string;
  EggStack: number;
  EggTray: number;
  EggQty: number;
  SumEggQty: number;
  EggWeight: number;
  Employee: string;
  Location: string;
  Columns_Location: number;
  Row_Location: number;
}

interface AlertState {
  show: boolean;
  type: "success" | "warning" | "error";
  title: string;
  message: string;
}

// 👉 เพิ่ม Interface สำหรับ Response ของ Stock API เพื่อหลีกเลี่ยงการใช้ 'any'
interface StockApiResponse {
  success?: boolean;
  error?: string;
}

const EGGS_PER_TRAY = 30;
const EGGS_PER_STACK = 300;

function transformSupabaseToStock(rawData: RawSupabaseStockItem[]): Stock[] {
  return rawData.map((item) => {
    const stackEggs = Number(item.EggStack || 0) * EGGS_PER_STACK;
    const trayEggs = Number(item.EggTray || 0) * EGGS_PER_TRAY;
    const individualEggs = Number(item.EggQty || 0);
    const sumEggQty = stackEggs + trayEggs + individualEggs;

    return {
      ID_Intake: item.ID_Intake,
      CreateDate: item.CreateDate || new Date().toISOString(),
      House: item.ID_House?.Name_House || "-",
      Room: item.ID_Room?.Name_Room || "-",
      Pallet: item.ID_Pallet?.Name_Pallet || String(item.ID_Intake || "-"),
      EggCategory: item.EggCategory?.Name_Category || "-",
      EggType: item.EggType?.Name_EggType || "-",
      EggStack: Number(item.EggStack || 0),
      EggTray: Number(item.EggTray || 0),
      EggQty: Number(item.EggQty || 0),
      SumEggQty: sumEggQty,
      EggWeight: Number(item.EggWeight || 0),
      Employee: item.Employee || "-",
      Location: item.ID_Location?.Name_Location || "",
      Columns_Location: 0,
      Row_Location: 0,
    };
  });
}

export default function StockContent() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPallet, setSelectedPallet] = useState<Stock | null>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const [sellStacks, setSellStacks] = useState<number>(0);
  const [sellTrays, setSellTrays] = useState<number>(0);
  const [sellEggs, setSellEggs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [alertConfig, setAlertConfig] = useState<AlertState>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = useCallback(
    (type: "success" | "warning" | "error", title: string, message: string) => {
      setAlertConfig({ show: true, type, title, message });
    },
    []
  );

  // 🛠️ แก้ไข Warning: missing dependency 'fetchData' โดยการครอบด้วย useCallback
  const fetchData = useCallback(async () => {
    try {
      const [resStock, resCategory] = await Promise.all([
        fetch("/api/stock"),
        fetch("/api/egg-category"),
      ]);

      const stockData = await resStock.json();
      const categoryData = await resCategory.json();

      if (resStock.ok && Array.isArray(stockData)) {
        const formattedStocks = transformSupabaseToStock(stockData);
        setStocks(formattedStocks);
      } else {
        showAlert(
          "error",
          "ดึงข้อมูลล้มเหลว",
          stockData.error || "ไม่สามารถติดต่อฐานข้อมูลคลังสินค้าได้"
        );
      }

      if (resCategory.ok && Array.isArray(categoryData)) {
        setDbCategories(categoryData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      showAlert(
        "error",
        "การเชื่อมต่อล้มเหลว",
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
      );
    }
  }, [showAlert]);

  const fetchCurrentUser = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      setCurrentUserEmail(user.email);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCurrentUser();
  }, [fetchData, fetchCurrentUser]);

  const fifoStocks = useMemo(() => {
    return [...stocks]
      .filter((item) => {
        const hasQty = item.SumEggQty > 0 || item.EggWeight > 0;
        const hasLocation =
          Boolean(item.Location) &&
          item.Location.toString().trim().toUpperCase() !== "NULL";
        const matchCategory =
          selectedCategory === "ALL" || item.EggCategory === selectedCategory;
        return hasQty && hasLocation && matchCategory;
      })
      .sort(
        (a, b) =>
          new Date(a.CreateDate).getTime() - new Date(b.CreateDate).getTime()
      );
  }, [stocks, selectedCategory]);

  const formatEggUnits = (totalEggs: number) => {
    const stacks = Math.floor(totalEggs / EGGS_PER_STACK);
    const remainderAfterStacks = totalEggs % EGGS_PER_STACK;
    const trays = Math.floor(remainderAfterStacks / EGGS_PER_TRAY);
    const eggs = remainderAfterStacks % EGGS_PER_TRAY;
    return { stacks, trays, eggs };
  };

  const handleOpenModal = (item: Stock) => {
    setSelectedPallet(item);
    setSellStacks(0);
    setSellTrays(0);
    setSellEggs(0);
  };

  const handleCloseModal = () => {
    setSelectedPallet(null);
    setSellStacks(0);
    setSellTrays(0);
    setSellEggs(0);
  };

  const handleSellSubmit = async (
    totalSellQty: number,
    totalSellWeight: number,
    transactionType: "REDUCE" | "ADD"
  ) => {
    if (!selectedPallet) return;

    const isLiquidEgg =
      selectedPallet.EggWeight > 0 && selectedPallet.SumEggQty === 0;

    if (!currentUserEmail) {
      showAlert(
        "warning",
        "ข้อมูลไม่ครบถ้วน",
        "ไม่พบข้อมูลบัญชีผู้ใช้งานที่เข้าสู่ระบบ"
      );
      return;
    }

    if (transactionType === "REDUCE") {
      if (isLiquidEgg) {
        if (
          totalSellWeight <= 0 ||
          totalSellWeight > selectedPallet.EggWeight
        ) {
          showAlert(
            "warning",
            "น้ำหนักไม่ถูกต้อง",
            "กรุณาระบุน้ำหนักไข่ตอกให้ถูกต้อง และต้องไม่เกินยอดจริง"
          );
          return;
        }
      } else {
        if (totalSellQty <= 0 || totalSellQty > selectedPallet.SumEggQty) {
          showAlert(
            "warning",
            "จำนวนฟองไม่ถูกต้อง",
            "กรุณาระบุจำนวนฟองให้ถูกต้อง และต้องไม่เกินยอดจริง"
          );
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ID_Intake: selectedPallet.ID_Intake,
          reduceQty: totalSellQty,
          reduceWeight: totalSellWeight,
          employee: currentUserEmail,
          transactionType: transactionType,
        }),
      });

      const contentType = res.headers.get("content-type");
      let data: StockApiResponse = {}; // 🛠️ แก้ไข: เปลี่ยนชนิดข้อมูลจาก any เป็น StockApiResponse
      if (contentType && contentType.includes("application/json")) {
        data = (await res.json()) as StockApiResponse;
      }

      if (res.ok && data.success) {
        showAlert(
          "success",
          "บันทึกสำเร็จ!",
          "ระบบทำการลงบันทึกประวัติ Transaction เรียบร้อยแล้ว"
        );
        handleCloseModal();
        fetchData();
      } else {
        showAlert(
          "error",
          "ระบบขัดข้อง",
          data.error || `ข้อผิดพลาดรหัส ${res.status}`
        );
      }
    } catch (error) {
      console.error("Network Error:", error);
      showAlert(
        "error",
        "การเชื่อมต่อล้มเหลว",
        "ไม่สามารถติดต่อและเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้"
      );
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen w-full text-slate-100 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="bg-amber-500 text-slate-900 px-3 py-1 rounded-xl text-lg tracking-widest font-black animate-pulse">
              FIFO
            </span>
            หน้าจอคิวเบิกจ่ายไข่ตามหลักคลังสินค้า
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            ระบบจะจัดลำดับพาเลทที่เข้าคลังก่อนขึ้นมาเป็น{" "}
            <span className="text-amber-400 font-bold">
              คิวที่ 1 ในประเภทนั้นๆ เสมอ
            </span>{" "}
            เพื่อการหยิบสินค้าที่ถูกต้อง
          </p>
        </div>
      </div>

      <CategoryFilter
        stocks={stocks}
        dbCategories={dbCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <StockList
        fifoStocks={fifoStocks}
        selectedCategory={selectedCategory}
        onOpenModal={handleOpenModal}
        formatEggUnits={formatEggUnits}
      />

      {selectedPallet && (
        <SellModal
          selectedPallet={selectedPallet}
          userEmail={currentUserEmail}
          onClose={handleCloseModal}
          onSubmit={handleSellSubmit}
          isLoading={isLoading}
          formatEggUnits={formatEggUnits}
          sellStacks={sellStacks}
          setSellStacks={setSellStacks}
          sellTrays={sellTrays}
          setSellTrays={setSellTrays}
          sellEggs={sellEggs}
          setSellEggs={setSellEggs}
        />
      )}

      <IntakeNotify
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}