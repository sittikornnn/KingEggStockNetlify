import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TableConfig {
  tableName: string;
  primaryKey: string;
  orderBy: string;
  ascending?: boolean;
}

const ALLOWED_TABLES: Record<string, TableConfig> = {
  eggcategory: {
    tableName: 'EggCategory',
    primaryKey: 'ID_Category',
    orderBy: 'ID_Category',
    ascending: true,
  },
  eggtype: {
    tableName: 'EggType',
    primaryKey: 'ID_EggType',
    orderBy: 'ID_EggType',
    ascending: true,
  },
  employee: {
    tableName: 'Employee',
    primaryKey: 'Email', // ใช้ Email เป็น Primary Key ตรงตามฐานข้อมูลจริง
    orderBy: 'created_at',
    ascending: false,
  },
  house: {
    tableName: 'House',
    primaryKey: 'ID_House',
    orderBy: 'ID_House',
    ascending: true,
  },
  location: {
    tableName: 'LocationStock',
    primaryKey: 'ID_Location',
    orderBy: 'ID_Location',
    ascending: true,
  },
  pallet: {
    tableName: 'Pallet',
    primaryKey: 'ID_Pallet',
    orderBy: 'ID_Pallet',
    ascending: true,
  },
  room: {
    tableName: 'Room',
    primaryKey: 'ID_Room',
    orderBy: 'ID_Room',
    ascending: true,
  },
};

function getTableConfig(tab: string | null): TableConfig | null {
  if (!tab) return null;
  const key = tab.toLowerCase().trim();
  return ALLOWED_TABLES[key] || null;
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
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab');
    const config = getTableConfig(tab);

    if (!config) {
      return NextResponse.json(
        { status: 'error', message: 'ตารางไม่ถูกต้อง หรือไม่ได้รับอนุญาต' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from(config.tableName as 'EggCategory')
      .select('*')
      .order(config.orderBy as never, { ascending: config.ascending ?? true });

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

    // กรองค่าที่เป็น null, undefined หรือ string ว่างออก
    const cleanedData: Record<string, unknown> = {};
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        cleanedData[key] = data[key];
      }
    });

    const supabase = await createClient();

    const { data: insertedData, error } = await supabase
      .from(config.tableName as 'EggCategory')
      .insert(cleanedData as never)
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

    const { data: updatedData, error } = await supabase
      .from(config.tableName as 'EggCategory')
      .update(data as never)
      .eq(targetKey as never, idValue)
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
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab');
    const idValue = searchParams.get('idValue');
    let idColumn = searchParams.get('idColumn');

    const config = getTableConfig(tab);
    if (!config || !idValue) {
      return NextResponse.json(
        { status: 'error', message: 'พารามิเตอร์การลบไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (!idColumn) {
      idColumn = config.primaryKey;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from(config.tableName as 'EggCategory')
      .delete()
      .eq(idColumn as never, idValue);

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