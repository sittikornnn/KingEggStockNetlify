import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .from('Location')
      .select('ID_Location, Name_Building, Name_Location, Columns_Location, Row_Location');

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: unknown) {
    console.error('❌ Location GET Error:', error);
    return NextResponse.json(
      { error: 'Database Error', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}