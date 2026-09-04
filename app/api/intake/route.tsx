import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // เรียกใช้ Supabase Server Client

interface LocationItem {
  ID_Location: number;
  Name_Building: string | null;
  Name_Location: string | null;
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
    const supabase = await createClient();

    // ดึงช่วงวันที่จาก URL Query Parameters
    const { searchParams } = new URL(request.url);
    const todayStr = new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') || todayStr;
    const endDate = searchParams.get('endDate') || todayStr;

    // รัน Query ดึงข้อมูลจาก View และ Table พร้อมกันแบบ Parallel
    const [
      housesRes,
      roomsRes,
      palletsRes,
      categoriesRes,
      eggTypesRes,
      empRes,
      intakeHistoryRes,
      locationsRes
    ] = await Promise.all([
      // 1. เล้าไก่
      supabase.from('House').select('ID_House, Name_House'),

      // 2. ห้อง
      supabase.from('Room').select('ID_Room, Name_Room'),

      // 3. Pallet
      supabase.from('Pallet').select('ID_Pallet, Name_Pallet').or('Using_Pallet.is.null,Using_Pallet.eq.false'),

      // 4. ประเภทไข่
      supabase.from('EggCategory').select('ID_Category, Name_Category'),

      // 5. ชนิดไข่
      supabase.from('EggType').select('ID_EggType, Name_EggType, ID_Category'),

      // 6. พนักงาน
      supabase.from('Employee').select('ID_Emp, FirstName_Emp, LastName_Emp'),

      // 7. ประวัติการบันทึกไข่เข้าคลัง (กรองช่วงวันที่ และ Location เป็น NULL)
      supabase
        .from('EggIntake')
        .select(`
          ID_Intake,
          CreateDate,
          EggStack,
          EggTray,
          EggQty,
          EggWeight,
          ID_House:House(Name_House),
          ID_Room:Room(Name_Room),
          ID_Pallet:Pallet(Name_Pallet),
          EggCategory:EggCategory(Name_Category),
          EggType:EggType(Name_EggType),
          Employee,
          ID_Location:LocationStock(Name_Location)
        `)
        .gte('CreateDate', `${startDate}T00:00:00`)
        .lte('CreateDate', `${endDate}T23:59:59`)
        .is('ID_Location', null)
        .order('CreateDate', { ascending: false }),

      // 8. Location
      supabase.from('LocationStock').select('ID_Location, Name_Building, Name_Location')
    ]);

    // ตรวจสอบข้อผิดพลาดของ Query
    if (intakeHistoryRes.error) throw intakeHistoryRes.error;

    const rawLocations: LocationItem[] = locationsRes.data || [];

    // สกัดรายชื่อ Building ไม่ให้ซ้ำกัน
    const uniqueBuildings = Array.from(
      new Set(rawLocations.map((loc) => loc.Name_Building).filter((building): building is string => Boolean(building)))
    );

    return NextResponse.json({
      status: 'success',
      data: {
        ChickenHouses: housesRes.data || [],
        Room: roomsRes.data || [],
        Pallet: palletsRes.data || [],
        EggCategories: categoriesRes.data || [],
        EggTypes: eggTypesRes.data || [],
        emp: empRes.data || [],
        intakeHistory: intakeHistoryRes.data || [],
        buildings: uniqueBuildings,
        locations: rawLocations
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ Supabase GET Error Details:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch intake dropdown and history data',
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      dateTime,
      idHouse,
      idRoom,
      idPallet,
      idCategory,
      idEggType,
      eggStack,
      eggTray,
      eggQty,
      eggWeight,
      idEmployee
    } = body;

    const payload = {
      CreateDate: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
      ID_House: idHouse || null,
      ID_Room: idRoom || null,
      ID_Pallet: idPallet || null,
      ID_Category: idCategory || null,
      ID_EggType: idEggType || null,
      EggStack: Number(eggStack) || 0,
      EggTray: Number(eggTray) || 0,
      EggQty: Number(eggQty) || 0,
      EggWeight: Number(eggWeight) || 0,
      Employee: idEmployee || null,
      LastUpdate: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString()
    };

    // 1. Insert ลงตาราง EggIntake
    const { error: intakeError } = await supabase
      .from('EggIntake')
      .insert([payload]);

    if (intakeError) throw intakeError;

    // 2. อัปเดตสถานะ Pallet เป็น true (ถูกใช้งานแล้ว) หากมีการเลือก Pallet มา
    if (idPallet) {
      const { error: palletError } = await supabase
        .from('Pallet')
        .update({ Using_Pallet: true })
        .eq('ID_Pallet', idPallet);

      if (palletError) {
        console.error('⚠️ Warning: Failed to update Pallet status:', palletError);
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Data saved successfully and Pallet updated'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ Supabase POST Error Details:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to save intake data',
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, location } = body; // รับ ID_Intake มาใช้งาน

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'ไม่พบ ID รายการที่ต้องการอัปเดต (ID_Intake)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // อัปเดต ID_Location ในตาราง EggIntake ตาม ID_Intake
    const { error } = await supabase
      .from('EggIntake')
      .update({
        ID_Location: location ? Number(location) : null,
        LastUpdate: new Date().toISOString()
      })
      .eq('ID_Intake', id);

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      message: 'อัปเดตตำแหน่งคลังสินค้าเรียบร้อยแล้ว'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ Supabase Update location error:', error);
    return NextResponse.json({
      status: 'error',
      message: getErrorMessage(error) || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล'
    }, { status: 500 });
  }
}