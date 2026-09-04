import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // Ensures server-side rendering on every request

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("EggTransaction")
      .select(`
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
          House:ID_House (
            Name_House
          ),
          Room:ID_Room (
            Name_Room
          ),
          Pallet:ID_Pallet (
            Name_Pallet
          ),
          EggCategory:ID_Category (
            Name_Category
          ),
          EggType:ID_EggType (
            Name_EggType
          ),
          LocationStock:ID_Location (
            Name_Location
          )
        )
      `)
      .order("TransactionDate", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: "success",
      data: data,
    });
  } catch (error: unknown) {
    console.error("Database Error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to load transaction history.",
        details: getErrorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}