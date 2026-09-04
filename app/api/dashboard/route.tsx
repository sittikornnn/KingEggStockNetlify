import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================
// Types
// =============================================================

interface EggTypeRelation {
  Name_EggType?: string | null;
}

interface HouseRelation {
  Name_House?: string | null;
}

interface PalletRelation {
  Name_Pallet?: string | null;
}

interface LocationRelation {
  Name_Location?: string | null;
}

// -------------------------------------------------------------
// EggIntake
// -------------------------------------------------------------

interface StoredEggRow {
  ID_Intake: number;
  EggStack: number | null;
  EggTray: number | null;
  EggQty: number | null;
  EggWeight: number | null;

  ID_EggType?: EggTypeRelation[] | null;
  ID_House?: HouseRelation[] | null;
  ID_Pallet?: PalletRelation[] | null;
  ID_Location?: LocationRelation[] | null;
}

// -------------------------------------------------------------
// EggTransaction
// -------------------------------------------------------------

interface EggTransactionRow {
  ID_Intake: number;
  ReduceStack: number | null;
  ReduceTray: number | null;
  ReduceQty: number | null;
  ReduceWeight: number | null;
}

// -------------------------------------------------------------
// Today Intake
// -------------------------------------------------------------

interface TodayIntakeRow {
  EggStack: number | null;
  EggTray: number | null;
  EggQty: number | null;
}

// -------------------------------------------------------------
// Today Transaction
// -------------------------------------------------------------

interface TodayTransactionRow {
  ReduceStack: number | null;
  ReduceTray: number | null;
  ReduceQty: number | null;
}

// -------------------------------------------------------------
// 7 Days Intake
// -------------------------------------------------------------

interface Intake7DayRow {
  CreateDate: string | null;
  EggStack: number | null;
  EggTray: number | null;
  EggQty: number | null;
}

// -------------------------------------------------------------
// 7 Days Transaction
// -------------------------------------------------------------

interface Transaction7DayRow {
  TransactionDate: string | null;
  ReduceStack: number | null;
  ReduceTray: number | null;
  ReduceQty: number | null;
}

// -------------------------------------------------------------
// Recent Transaction
// -------------------------------------------------------------

interface RecentEggIntake {
  ID_Intake: number;

  ID_EggType?: EggTypeRelation[] | null;
  ID_House?: HouseRelation[] | null;
  ID_Pallet?: PalletRelation[] | null;
  ID_Location?: LocationRelation[] | null;
}

interface RecentTransactionRow {
  ID_Transaction: number;
  TransactionDate: string | null;

  ReduceStack: number | null;
  ReduceTray: number | null;
  ReduceQty: number | null;
  ReduceWeight: number | null;

  Employee: string | null;
  TransactionType: string | null;

  EggIntake?: RecentEggIntake[] | null;
}

// -------------------------------------------------------------
// Usage Map
// -------------------------------------------------------------

interface IntakeUsage {
  qty: number;
  weight: number;
}

// -------------------------------------------------------------
// Low Stock
// -------------------------------------------------------------

interface LowStockItem {
  Location: string;
  Pallet: string;
  EggType: string;
  Qty: number;
  Weight: number;
}

// =============================================================
// Helper Functions
// =============================================================

// -------------------------------------------------------------
// Format Local Date
// YYYY-MM-DD
// -------------------------------------------------------------

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// Calculate Egg Quantity
//
// 1 Stack = 300 eggs
// 1 Tray  = 30 eggs
// -------------------------------------------------------------

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

// =============================================================
// GET Dashboard
// =============================================================

export async function GET() {
  try {
    const supabase = await createClient();

    // ===========================================================
    // Date Range
    // ===========================================================

    const now = new Date();

    // -----------------------------------------------------------
    // Today Start
    // -----------------------------------------------------------

    const todayStart = new Date(now);

    todayStart.setHours(
      0,
      0,
      0,
      0
    );

    // -----------------------------------------------------------
    // Today End
    // -----------------------------------------------------------

    const todayEnd = new Date(now);

    todayEnd.setHours(
      23,
      59,
      59,
      999
    );

    // -----------------------------------------------------------
    // 7 Days Ago
    // -----------------------------------------------------------

    const sevenDaysAgo = new Date(now);

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );

    sevenDaysAgo.setHours(
      0,
      0,
      0,
      0
    );

    // ===========================================================
    // 1. Get All Egg Intake
    // ===========================================================

    const {
      data: storedData,
      error: storedError,
    } = await supabase
      .from("EggIntake")
      .select(`
        ID_Intake,
        EggStack,
        EggTray,
        EggQty,
        EggWeight,
        ID_EggType:EggType(Name_EggType),
        ID_House:House(Name_House),
        ID_Pallet:Pallet(Name_Pallet),
        ID_Location:LocationStock(Name_Location)
      `);

    if (storedError) {
      throw storedError;
    }

    // ===========================================================
    // 2. Get All Transactions
    // ===========================================================

    const {
      data: allTranData,
      error: allTranError,
    } = await supabase
      .from("EggTransaction")
      .select(`
        ID_Intake,
        ReduceStack,
        ReduceTray,
        ReduceQty,
        ReduceWeight
      `);

    if (allTranError) {
      throw allTranError;
    }

    // ===========================================================
    // Transaction Usage Map
    // ===========================================================

    const intakeUsageMap: Record<
      number,
      IntakeUsage
    > = {};

    const typedAllTranData =
      allTranData as EggTransactionRow[] | null;

    (typedAllTranData ?? []).forEach(
      (tran) => {
        const id = tran.ID_Intake;

        const qty = calculateEggQty(
          tran.ReduceStack,
          tran.ReduceTray,
          tran.ReduceQty
        );

        const weight = Number(
          tran.ReduceWeight || 0
        );

        if (!intakeUsageMap[id]) {
          intakeUsageMap[id] = {
            qty: 0,
            weight: 0,
          };
        }

        intakeUsageMap[id].qty += qty;

        intakeUsageMap[id].weight += weight;
      }
    );

    // ===========================================================
    // Dashboard Calculation Variables
    // ===========================================================

    let totalIntakeQty = 0;

    let totalTranQty = 0;

    let totalWeight = 0;

    const eggTypeMap: Record<
      string,
      number
    > = {};

    const houseMap: Record<
      string,
      number
    > = {};

    const lowStockList: LowStockItem[] = [];

    // ===========================================================
    // Process Stored Egg Intake
    // ===========================================================

    const typedStoredData =
      storedData as StoredEggRow[] | null;

    (typedStoredData ?? []).forEach(
      (row) => {
        // -------------------------------------------------------
        // Intake Quantity
        // -------------------------------------------------------

        const inQty = calculateEggQty(
          row.EggStack,
          row.EggTray,
          row.EggQty
        );

        // -------------------------------------------------------
        // Intake Weight
        // -------------------------------------------------------

        const inWeight = Number(
          row.EggWeight || 0
        );

        // -------------------------------------------------------
        // Transaction Usage
        // -------------------------------------------------------

        const usage =
          intakeUsageMap[row.ID_Intake] ?? {
            qty: 0,
            weight: 0,
          };

        // -------------------------------------------------------
        // Remaining Quantity
        // -------------------------------------------------------

        const remainQty = Math.max(
          0,
          inQty - usage.qty
        );

        // -------------------------------------------------------
        // Remaining Weight
        // -------------------------------------------------------

        const remainWeight = Math.max(
          0,
          inWeight - usage.weight
        );

        // -------------------------------------------------------
        // Total Intake
        // -------------------------------------------------------

        totalIntakeQty += inQty;

        // -------------------------------------------------------
        // Total Remaining Weight
        // -------------------------------------------------------

        totalWeight += remainWeight;

        // -------------------------------------------------------
        // Relation Names
        //
        // Supabase relation returns arrays.
        // -------------------------------------------------------

        const eggTypeName =
          row.ID_EggType?.[0]
            ?.Name_EggType ??
          "ไม่ระบุประเภท";

        const houseName =
          row.ID_House?.[0]
            ?.Name_House ??
          "ไม่ระบุโรงเรือน";

        const palletName =
          row.ID_Pallet?.[0]
            ?.Name_Pallet ??
          "-";

        const locationName =
          row.ID_Location?.[0]
            ?.Name_Location ??
          "-";

        // -------------------------------------------------------
        // Egg Type Chart
        // -------------------------------------------------------

        eggTypeMap[eggTypeName] =
          (eggTypeMap[eggTypeName] ?? 0) +
          inQty;

        // -------------------------------------------------------
        // House Chart
        // -------------------------------------------------------

        houseMap[houseName] =
          (houseMap[houseName] ?? 0) +
          remainQty;

        // -------------------------------------------------------
        // Low Stock
        // -------------------------------------------------------

        if (remainQty > 0) {
          lowStockList.push({
            Location: locationName,

            Pallet: palletName,

            EggType: eggTypeName,

            Qty: remainQty,

            Weight: Number(
              remainWeight.toFixed(2)
            ),
          });
        }
      }
    );

    // ===========================================================
    // Calculate Total Transaction
    // ===========================================================

    (typedAllTranData ?? []).forEach(
      (tran) => {
        totalTranQty += calculateEggQty(
          tran.ReduceStack,
          tran.ReduceTray,
          tran.ReduceQty
        );
      }
    );

    // ===========================================================
    // Remaining Eggs
    // ===========================================================

    const remainEggs = Math.max(
      0,
      totalIntakeQty - totalTranQty
    );

    // ===========================================================
    // 3. Today's Intake
    // ===========================================================

    const {
      data: todayIntakeData,
      error: todayIntakeError,
    } = await supabase
      .from("EggIntake")
      .select(`
        EggStack,
        EggTray,
        EggQty
      `)
      .gte(
        "CreateDate",
        todayStart.toISOString()
      )
      .lte(
        "CreateDate",
        todayEnd.toISOString()
      );

    if (todayIntakeError) {
      throw todayIntakeError;
    }

    const typedTodayIntakeData =
      todayIntakeData as TodayIntakeRow[] | null;

    const todayIntake =
      (typedTodayIntakeData ?? []).reduce(
        (acc, row) => {
          return (
            acc +
            calculateEggQty(
              row.EggStack,
              row.EggTray,
              row.EggQty
            )
          );
        },
        0
      );

    // ===========================================================
    // 4. Today's Transaction
    // ===========================================================

    const {
      data: todayTranData,
      error: todayTranError,
    } = await supabase
      .from("EggTransaction")
      .select(`
        ReduceStack,
        ReduceTray,
        ReduceQty
      `)
      .gte(
        "TransactionDate",
        todayStart.toISOString()
      )
      .lte(
        "TransactionDate",
        todayEnd.toISOString()
      );

    if (todayTranError) {
      throw todayTranError;
    }

    const typedTodayTranData =
      todayTranData as TodayTransactionRow[] | null;

    const todayTransaction =
      (typedTodayTranData ?? []).reduce(
        (acc, row) => {
          return (
            acc +
            calculateEggQty(
              row.ReduceStack,
              row.ReduceTray,
              row.ReduceQty
            )
          );
        },
        0
      );

    // ===========================================================
    // 5. Last 7 Days
    // ===========================================================

    const {
      data: intake7Data,
      error: intake7Error,
    } = await supabase
      .from("EggIntake")
      .select(`
        CreateDate,
        EggStack,
        EggTray,
        EggQty
      `)
      .gte(
        "CreateDate",
        sevenDaysAgo.toISOString()
      );

    if (intake7Error) {
      throw intake7Error;
    }

    const {
      data: tran7Data,
      error: tran7Error,
    } = await supabase
      .from("EggTransaction")
      .select(`
        TransactionDate,
        ReduceStack,
        ReduceTray,
        ReduceQty
      `)
      .gte(
        "TransactionDate",
        sevenDaysAgo.toISOString()
      );

    if (tran7Error) {
      throw tran7Error;
    }

    const typedIntake7Data =
      intake7Data as Intake7DayRow[] | null;

    const typedTran7Data =
      tran7Data as Transaction7DayRow[] | null;

    // ===========================================================
    // Chart Data
    // ===========================================================

    const labels: string[] = [];

    const intakeChartData: number[] = [];

    const transactionChartData: number[] = [];

    // -----------------------------------------------------------
    // Generate 7 Days
    // -----------------------------------------------------------

    for (
      let i = 6;
      i >= 0;
      i--
    ) {
      const d = new Date(now);

      d.setDate(
        d.getDate() - i
      );

      const key =
        formatLocalDate(d);

      labels.push(key);

      // ---------------------------------------------------------
      // Daily Intake
      // ---------------------------------------------------------

      const dailyIntake =
        (typedIntake7Data ?? [])
          .filter(
            (x) =>
              x.CreateDate &&
              formatLocalDate(
                new Date(
                  x.CreateDate
                )
              ) === key
          )
          .reduce(
            (acc, row) =>
              acc +
              calculateEggQty(
                row.EggStack,
                row.EggTray,
                row.EggQty
              ),
            0
          );

      // ---------------------------------------------------------
      // Daily Transaction
      // ---------------------------------------------------------

      const dailyTran =
        (typedTran7Data ?? [])
          .filter(
            (x) =>
              x.TransactionDate &&
              formatLocalDate(
                new Date(
                  x.TransactionDate
                )
              ) === key
          )
          .reduce(
            (acc, row) =>
              acc +
              calculateEggQty(
                row.ReduceStack,
                row.ReduceTray,
                row.ReduceQty
              ),
            0
          );

      intakeChartData.push(
        dailyIntake
      );

      transactionChartData.push(
        dailyTran
      );
    }

    // ===========================================================
    // 6. Recent 10 Transactions
    // ===========================================================

    const {
      data: recentTransactionsRaw,
      error: recentError,
    } = await supabase
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
      .order(
        "TransactionDate",
        {
          ascending: false,
        }
      )
      .limit(10);

    if (recentError) {
      throw recentError;
    }

    // ===========================================================
    // Format Recent Transactions
    // ===========================================================

    const typedRecentTransactions =
      recentTransactionsRaw as RecentTransactionRow[] | null;

    const recentTransactions =
      (typedRecentTransactions ?? []).map(
        (row) => {
          // -----------------------------------------------------
          // Supabase returns EggIntake as an array
          // -----------------------------------------------------

          const eggIntake =
            row.EggIntake?.[0];

          // -----------------------------------------------------
          // Relation arrays
          // -----------------------------------------------------

          const eggType =
            eggIntake
              ?.ID_EggType?.[0]
              ?.Name_EggType ?? "-";

          const house =
            eggIntake
              ?.ID_House?.[0]
              ?.Name_House ?? "-";

          const pallet =
            eggIntake
              ?.ID_Pallet?.[0]
              ?.Name_Pallet ?? "-";

          const location =
            eggIntake
              ?.ID_Location?.[0]
              ?.Name_Location ?? "-";

          return {
            ID_Transaction:
              row.ID_Transaction,

            TransactionDate:
              row.TransactionDate,

            TotalReduceQty:
              calculateEggQty(
                row.ReduceStack,
                row.ReduceTray,
                row.ReduceQty
              ),

            ReduceWeight:
              row.ReduceWeight,

            Employee:
              row.Employee,

            TransactionType:
              row.TransactionType,

            EggType:
              eggType,

            House:
              house,

            Pallet:
              pallet,

            Location:
              location,
          };
        }
      );

    // ===========================================================
    // 7. Response
    // ===========================================================

    return NextResponse.json({
      status: "success",

      data: {
        // -------------------------------------------------------
        // Summary
        // -------------------------------------------------------

        summary: {
          totalEggs:
            remainEggs,

          totalWeight:
            Number(
              totalWeight.toFixed(2)
            ),

          todayIntake:
            todayIntake,

          todayTransaction:
            todayTransaction,
        },

        // -------------------------------------------------------
        // Line Chart
        // -------------------------------------------------------

        lineChart: {
          labels:
            labels,

          intake:
            intakeChartData,

          transaction:
            transactionChartData,
        },

        // -------------------------------------------------------
        // Egg Type Chart
        // -------------------------------------------------------

        eggTypeChart: {
          labels:
            Object.keys(
              eggTypeMap
            ),

          data:
            Object.values(
              eggTypeMap
            ),
        },

        // -------------------------------------------------------
        // House Chart
        // -------------------------------------------------------

        houseChart: {
          labels:
            Object.keys(
              houseMap
            ),

          data:
            Object.values(
              houseMap
            ),
        },

        // -------------------------------------------------------
        // Recent Transactions
        // -------------------------------------------------------

        recentTransactions:

          recentTransactions,

        // -------------------------------------------------------
        // Low Stock
        // -------------------------------------------------------

        lowStock:
          lowStockList
            .sort(
              (a, b) =>
                a.Qty - b.Qty
            )
            .slice(0, 5),
      },
    });
  } catch (err: unknown) {
    // ===========================================================
    // Error Handler
    // ===========================================================

    console.error(
      "Dashboard API Error:",
      err
    );

    const errorMessage =
      err instanceof Error
        ? err.message
        : "Unknown error";

    return NextResponse.json(
      {
        status: "error",

        message:
          "Dashboard API Error",

        details:
          errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}