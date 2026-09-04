import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      .from("EggCategory")
      .select("ID_Category, Name_Category");

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}