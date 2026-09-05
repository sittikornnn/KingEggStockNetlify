import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get Query Parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Base Query
    let query = supabase
      .from("EggTransaction")
      .select(
        `
        ID_Transaction,
        TransactionDate,
        ReduceStack,
        ReduceTray,
        ReduceQty,
        ReduceWeight,
        TransactionType,
        Employee,
        ID_Intake,
        EggIntake (
          ID_Intake,
          CreateDate,
          EggStack,
          EggTray,
          EggQty,
          EggWeight,
          Employee,
          House:ID_House ( Name_House ),
          Room:ID_Room ( Name_Room ),
          Pallet:ID_Pallet ( Name_Pallet ),
          EggCategory:ID_Category ( Name_Category ),
          EggType:ID_EggType ( Name_EggType ),
          LocationStock:ID_Location ( Name_Location )
        )
      `,
        { count: "exact" }
      );

    // Apply Search Filter on DB Level if search is present
    if (search) {
      query = query.or(
        `Employee.ilike.%${search}%,TransactionType.ilike.%${search}%`
      );
    }

    // Apply Pagination and Ordering
    const { data, count, error } = await query
      .order("TransactionDate", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      status: "success",
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error: unknown) {
    console.error("Database Error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to load transaction history.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}