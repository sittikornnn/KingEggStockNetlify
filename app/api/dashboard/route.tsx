import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================
// Helper Functions
// =============================================================

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateEggQty(
  stack: number | null = 0,
  tray: number | null = 0,
  qty: number | null = 0
): number {
  return (
    Number(stack || 0) * 300 +
    Number(tray || 0) * 30 +
    Number(qty || 0)
  );
}

export async function GET() {
  try {
    const supabase = await createClient();

    // ===========================================================
    // Date Range Setup
    // ===========================================================
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // ===========================================================
    // Execute all independent database queries in parallel
    // ===========================================================
    const [
      storedDataResult,
      allTranDataResult,
      todayIntakeResult,
      todayTranResult,
      intake7Result,
      tran7Result,
      recentTransactionsResult,
    ] = await Promise.all([
      // 1. Get Egg Intake
      supabase.from("EggIntake").select(`
        ID_Intake,
        EggStack,
        EggTray,
        EggQty,
        EggWeight,
        ID_EggType:EggType(Name_EggType),
        ID_House:House(Name_House),
        ID_Pallet:Pallet(Name_Pallet),
        ID_Location:LocationStock(Name_Location)
      `),

      // 2. Get Egg Transactions
      supabase.from("EggTransaction").select(`
        ID_Intake,
        ReduceStack,
        ReduceTray,
        ReduceQty,
        ReduceWeight
      `),

      // 3. Today's Intake
      supabase
        .from("EggIntake")
        .select("EggStack, EggTray, EggQty")
        .gte("CreateDate", todayStart.toISOString())
        .lte("CreateDate", todayEnd.toISOString()),

      // 4. Today's Transaction
      supabase
        .from("EggTransaction")
        .select("ReduceStack, ReduceTray, ReduceQty")
        .gte("TransactionDate", todayStart.toISOString())
        .lte("TransactionDate", todayEnd.toISOString()),

      // 5. Last 7 Days Intake
      supabase
        .from("EggIntake")
        .select("CreateDate, EggStack, EggTray, EggQty")
        .gte("CreateDate", sevenDaysAgo.toISOString()),

      // 6. Last 7 Days Transaction
      supabase
        .from("EggTransaction")
        .select("TransactionDate, ReduceStack, ReduceTray, ReduceQty")
        .gte("TransactionDate", sevenDaysAgo.toISOString()),

      // 7. Recent 10 Transactions
      supabase
        .from("EggTransaction")
        .select(`
          ID_Transaction,
          TransactionDate,
          ReduceStack,
          ReduceTray,
          ReduceQty,
          ReduceWeight,
          Employee,
          TransactionType,
          EggIntake:ID_Intake (
            ID_Intake,
            ID_EggType:EggType(Name_EggType),
            ID_House:House(Name_House),
            ID_Pallet:Pallet(Name_Pallet),
            ID_Location:LocationStock(Name_Location)
          )
        `)
        .order("TransactionDate", { ascending: false })
        .limit(10),
    ]);

    // Check errors
    if (storedDataResult.error) throw storedDataResult.error;
    if (allTranDataResult.error) throw allTranDataResult.error;
    if (todayIntakeResult.error) throw todayIntakeResult.error;
    if (todayTranResult.error) throw todayTranResult.error;
    if (intake7Result.error) throw intake7Result.error;
    if (tran7Result.error) throw tran7Result.error;
    if (recentTransactionsResult.error) throw recentTransactionsResult.error;

    // Extract Data
    const storedData = storedDataResult.data ?? [];
    const allTranData = allTranDataResult.data ?? [];
    const todayIntakeData = todayIntakeResult.data ?? [];
    const todayTranData = todayTranResult.data ?? [];
    const intake7Data = intake7Result.data ?? [];
    const tran7Data = tran7Result.data ?? [];
    const recentTransactionsRaw = recentTransactionsResult.data ?? [];

    // ===========================================================
    // Process Transaction Usage Map (Single Pass)
    // ===========================================================
    const intakeUsageMap: Record<number, { qty: number; weight: number }> = {};
    let totalTranQty = 0;

    for (let i = 0; i < allTranData.length; i++) {
      const tran = allTranData[i];
      const id = tran.ID_Intake;
      const qty = calculateEggQty(tran.ReduceStack, tran.ReduceTray, tran.ReduceQty);
      const weight = Number(tran.ReduceWeight || 0);

      totalTranQty += qty;

      if (!intakeUsageMap[id]) {
        intakeUsageMap[id] = { qty: 0, weight: 0 };
      }
      intakeUsageMap[id].qty += qty;
      intakeUsageMap[id].weight += weight;
    }

    // ===========================================================
    // Process Stored Egg Intake
    // ===========================================================
    let totalIntakeQty = 0;
    let totalWeight = 0;
    const eggTypeMap: Record<string, number> = {};
    const houseMap: Record<string, number> = {};
    const lowStockList = [];

    for (let i = 0; i < storedData.length; i++) {
      const row = storedData[i];
      const inQty = calculateEggQty(row.EggStack, row.EggTray, row.EggQty);
      const inWeight = Number(row.EggWeight || 0);
      const usage = intakeUsageMap[row.ID_Intake] ?? { qty: 0, weight: 0 };

      const remainQty = Math.max(0, inQty - usage.qty);
      const remainWeight = Math.max(0, inWeight - usage.weight);

      totalIntakeQty += inQty;
      totalWeight += remainWeight;

      // Extract Relations safely
      const eggTypeRel = Array.isArray(row.ID_EggType) ? row.ID_EggType[0] : row.ID_EggType;
      const houseRel = Array.isArray(row.ID_House) ? row.ID_House[0] : row.ID_House;
      const palletRel = Array.isArray(row.ID_Pallet) ? row.ID_Pallet[0] : row.ID_Pallet;
      const locationRel = Array.isArray(row.ID_Location) ? row.ID_Location[0] : row.ID_Location;

      const eggTypeName = eggTypeRel?.Name_EggType ?? "ไม่ระบุประเภท";
      const houseName = houseRel?.Name_House ?? "ไม่ระบุโรงเรือน";
      const palletName = palletRel?.Name_Pallet ?? "-";
      const locationName = locationRel?.Name_Location ?? "-";

      eggTypeMap[eggTypeName] = (eggTypeMap[eggTypeName] ?? 0) + inQty;
      houseMap[houseName] = (houseMap[houseName] ?? 0) + remainQty;

      if (remainQty > 0) {
        lowStockList.push({
          Location: locationName,
          Pallet: palletName,
          EggType: eggTypeName,
          Qty: remainQty,
          Weight: Number(remainWeight.toFixed(2)),
        });
      }
    }

    const remainEggs = Math.max(0, totalIntakeQty - totalTranQty);

    // ===========================================================
    // Calculate Today's Totals
    // ===========================================================
    let todayIntake = 0;
    for (let i = 0; i < todayIntakeData.length; i++) {
      const row = todayIntakeData[i];
      todayIntake += calculateEggQty(row.EggStack, row.EggTray, row.EggQty);
    }

    let todayTransaction = 0;
    for (let i = 0; i < todayTranData.length; i++) {
      const row = todayTranData[i];
      todayTransaction += calculateEggQty(row.ReduceStack, row.ReduceTray, row.ReduceQty);
    }

    // ===========================================================
    // Calculate 7-Day Chart Data efficiently with Lookup Map
    // ===========================================================
    const labels: string[] = [];
    const intakeChartData: number[] = [];
    const transactionChartData: number[] = [];

    const intakeByDateMap: Record<string, number> = {};
    const tranByDateMap: Record<string, number> = {};

    for (let i = 0; i < intake7Data.length; i++) {
      const row = intake7Data[i];
      if (!row.CreateDate) continue;
      const dateKey = formatLocalDate(new Date(row.CreateDate));
      const qty = calculateEggQty(row.EggStack, row.EggTray, row.EggQty);
      intakeByDateMap[dateKey] = (intakeByDateMap[dateKey] ?? 0) + qty;
    }

    for (let i = 0; i < tran7Data.length; i++) {
      const row = tran7Data[i];
      if (!row.TransactionDate) continue;
      const dateKey = formatLocalDate(new Date(row.TransactionDate));
      const qty = calculateEggQty(row.ReduceStack, row.ReduceTray, row.ReduceQty);
      tranByDateMap[dateKey] = (tranByDateMap[dateKey] ?? 0) + qty;
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = formatLocalDate(d);

      labels.push(key);
      intakeChartData.push(intakeByDateMap[key] ?? 0);
      transactionChartData.push(tranByDateMap[key] ?? 0);
    }

    // ===========================================================
    // Format Recent Transactions
    // ===========================================================
    const recentTransactions = recentTransactionsRaw.map((row: any) => {
      const eggIntake = Array.isArray(row.EggIntake) ? row.EggIntake[0] : row.EggIntake;
      const eggTypeRel = Array.isArray(eggIntake?.ID_EggType) ? eggIntake.ID_EggType[0] : eggIntake?.ID_EggType;
      const houseRel = Array.isArray(eggIntake?.ID_House) ? eggIntake.ID_House[0] : eggIntake?.ID_House;
      const palletRel = Array.isArray(eggIntake?.ID_Pallet) ? eggIntake.ID_Pallet[0] : eggIntake?.ID_Pallet;
      const locationRel = Array.isArray(eggIntake?.ID_Location) ? eggIntake.ID_Location[0] : eggIntake?.ID_Location;

      return {
        ID_Transaction: row.ID_Transaction,
        TransactionDate: row.TransactionDate,
        TotalReduceQty: calculateEggQty(row.ReduceStack, row.ReduceTray, row.ReduceQty),
        ReduceWeight: row.ReduceWeight,
        Employee: row.Employee,
        TransactionType: row.TransactionType,
        EggType: eggTypeRel?.Name_EggType ?? "-",
        House: houseRel?.Name_House ?? "-",
        Pallet: palletRel?.Name_Pallet ?? "-",
        Location: locationRel?.Name_Location ?? "-",
      };
    });

    // ===========================================================
    // Response
    // ===========================================================
    return NextResponse.json({
      status: "success",
      data: {
        summary: {
          totalEggs: remainEggs,
          totalWeight: Number(totalWeight.toFixed(2)),
          todayIntake,
          todayTransaction,
        },
        lineChart: {
          labels,
          intake: intakeChartData,
          transaction: transactionChartData,
        },
        eggTypeChart: {
          labels: Object.keys(eggTypeMap),
          data: Object.values(eggTypeMap),
        },
        houseChart: {
          labels: Object.keys(houseMap),
          data: Object.values(houseMap),
        },
        recentTransactions,
        lowStock: lowStockList.sort((a, b) => a.Qty - b.Qty).slice(0, 5),
      },
    });
  } catch (err: unknown) {
    console.error("Dashboard API Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        status: "error",
        message: "Dashboard API Error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}