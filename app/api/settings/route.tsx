import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TableConfig {
  tableName: string;
  primaryKey: string;
  orderBy: string;
  ascending?: boolean;
}

// ใช้ Map เพื่อเพิ่มความเร็วในการ Lookup Key
const ALLOWED_TABLES = new Map<string, TableConfig>([
  [
    'eggcategory',
    {
      tableName: 'EggCategory',
      primaryKey: 'ID_Category',
      orderBy: 'ID_Category',
      ascending: true,
    },
  ],
  [
    'eggtype',
    {
      tableName: 'EggType',
      primaryKey: 'ID_EggType',
      orderBy: 'ID_EggType',
      ascending: true,
    },
  ],
  [
    'employee',
    {
      tableName: 'Employee',
      primaryKey: 'Email',
      orderBy: 'created_at',
      ascending: false,
    },
  ],
  [
    'house',
    {
      tableName: 'House',
      primaryKey: 'ID_House',
      orderBy: 'ID_House',
      ascending: true,
    },
  ],
  [
    'location',
    {
      tableName: 'LocationStock',
      primaryKey: 'ID_Location',
      orderBy: 'ID_Location',
      ascending: true,
    },
  ],
  [
    'pallet',
    {
      tableName: 'Pallet',
      primaryKey: 'ID_Pallet',
      orderBy: 'ID_Pallet',
      ascending: true,
    },
  ],
  [
    'room',
    {
      tableName: 'Room',
      primaryKey: 'ID_Room',
      orderBy: 'ID_Room',
      ascending: true,
    },
  ],
]);

function getTableConfig(tab: string | null): TableConfig | null {
  if (!tab) return null;
  return ALLOWED_TABLES.get(tab.toLowerCase().trim()) || null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export async function GET(request: NextRequest) {
  try {
    // ใช้ request.nextUrl โดยตรง เร็วกว่า new URL()
    const tab = request.nextUrl.searchParams.get('tab');
    const config = getTableConfig(tab);

    if (!config) {
      return NextResponse.json(
        { status: 'error', message: 'ตารางไม่ถูกต้อง หรือไม่ได้รับอนุญาต' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(config.tableName)
      .select('*')
      .order(config.orderBy, { ascending: config.ascending ?? true });

    if (error) throw error;

    return NextResponse.json(
      {
        status: 'success',
        tableName: config.tableName,
        primaryKey: config.primaryKey,
        data: data || [],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('❌ Master Data GET Error:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tab, data } = body;

    const config = getTableConfig(tab);
    if (!config || !data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'ข้อมูลหรือตารางไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const cleanedData: Record<string, unknown> = {};
    for (const key in data) {
      const val = data[key];
      if (val !== undefined && val !== null && val !== '') {
        cleanedData[key] = val;
      }
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedData, error } = await (supabase as any)
      .from(config.tableName)
      .insert(cleanedData)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { status: 'success', message: 'บันทึกข้อมูลสำเร็จ', data: insertedData },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('❌ Master Data POST Error:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tab, idColumn, idValue, data } = body;

    const config = getTableConfig(tab);
    if (!config || !data) {
      return NextResponse.json(
        { status: 'error', message: 'ข้อมูลสำหรับอัปเดตไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    const targetKey = idColumn || config.primaryKey;

    if (idValue === undefined || idValue === null || idValue === '') {
      return NextResponse.json(
        { status: 'error', message: 'ไม่พบค่า Primary Key สำหรับอัปเดต' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedData, error } = await (supabase as any)
      .from(config.tableName)
      .update(data)
      .eq(targetKey, idValue)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { status: 'success', message: 'อัปเดตข้อมูลสำเร็จ', data: updatedData },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('❌ Master Data PUT Error:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tab = request.nextUrl.searchParams.get('tab');
    const idValue = request.nextUrl.searchParams.get('idValue');
    const idColumn = request.nextUrl.searchParams.get('idColumn');

    const config = getTableConfig(tab);
    if (!config || !idValue) {
      return NextResponse.json(
        { status: 'error', message: 'พารามิเตอร์การลบไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const targetKey = idColumn || config.primaryKey;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from(config.tableName)
      .delete()
      .eq(targetKey, idValue);

    if (error) throw error;

    return NextResponse.json(
      { status: 'success', message: 'ลบข้อมูลสำเร็จ' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('❌ Master Data DELETE Error:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}