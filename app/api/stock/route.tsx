import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EGGS_PER_TRAY = 30;
const EGGS_PER_STACK = 300;

// Helper function to safely extract error messages without using `any`
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

// 1. [GET] ดึงสต็อกสินค้าโดยคำนวณสุทธิจาก EggIntake + EggTransaction
export async function GET() {
  try {
    const supabase = await createClient();

    // ดึงรายการ Intake ทั้งหมดที่อยู่ในคลัง (ID_Location ไม่เป็น null)
    const { data: intakeData, error: intakeError } = await supabase
      .from("EggIntake")
      .select(`
        ID_Intake,
        CreateDate,
        EggStack,
        EggTray,
        EggQty,
        EggWeight,
        Employee,
        LastUpdate,
        ID_House:House(Name_House),
        ID_Room:Room(Name_Room),
        ID_Pallet:Pallet(Name_Pallet),
        EggCategory:EggCategory(Name_Category),
        EggType:EggType(Name_EggType),
        ID_Location:LocationStock(Name_Location)
      `)
      .not("ID_Location", "is", null)
      .order("CreateDate", { ascending: true });

    if (intakeError) throw intakeError;

    // ดึงประวัติ Transaction ทั้งหมด
    const { data: trxData, error: trxError } = await supabase
      .from("EggTransaction")
      .select("ID_Intake, ReduceQty, ReduceWeight, TransactionType");

    if (trxError) throw trxError;

    // คำนวณยอดคงเหลือสุทธิแต่ละ ID_Intake
    const calculatedStock = intakeData
      .map((item) => {
        // ยอดเริ่มต้น: หาก EggQty ใน Intake เก็บเป็นยอดรวมอยู่แล้ว ให้ใช้ EggQty
        // แต่ถ้า EggQty เก็บแค่เศษ ให้คำนวณรวมจาก Stack + Tray + Qty
        const initialTotalEggs =
          Number(item.EggQty || 0) > 0 && Number(item.EggStack || 0) === 0
            ? Number(item.EggQty || 0)
            : Number(item.EggStack || 0) * EGGS_PER_STACK +
              Number(item.EggTray || 0) * EGGS_PER_TRAY +
              Number(item.EggQty || 0);

        let netEggs = initialTotalEggs;
        let netWeight = Number(item.EggWeight || 0);

        // กรองประวัติ Transaction เฉพาะของ Intake นี้
        const relatedTrx =
          trxData?.filter((t) => t.ID_Intake === item.ID_Intake) || [];

        relatedTrx.forEach((trx) => {
          const qty = Number(trx.ReduceQty || 0);
          const weight = Number(trx.ReduceWeight || 0);

          if (trx.TransactionType === "ADD") {
            netEggs += qty;
            netWeight += weight;
          } else {
            // REDUCE
            netEggs -= qty;
            netWeight -= weight;
          }
        });

        // ป้องกันยอดติดลบ
        netEggs = Math.max(0, netEggs);
        netWeight = Math.max(0, Number(netWeight.toFixed(2)));

        // แปลงยอดสุทธิกลับเป็น ตั้ง / แผง / เศษฟอง
        const currentStack = Math.floor(netEggs / EGGS_PER_STACK);
        const remainderAfterStack = netEggs % EGGS_PER_STACK;
        const currentTray = Math.floor(remainderAfterStack / EGGS_PER_TRAY);
        const currentQty = remainderAfterStack % EGGS_PER_TRAY;

        return {
          ...item,
          SumEggQty: netEggs, // ยอดฟองสุทธิรวมส่งให้ Modal ใช้
          EggStack: currentStack,
          EggTray: currentTray,
          EggQty: currentQty,
          EggWeight: netWeight,
        };
      })
      // แสดงเฉพาะรายการที่ยังมีจำนวนไข่เหลืออยู่ (> 0 ฟอง หรือกรณีไข่เหลวที่น้ำหนัก > 0)
      .filter((item) => item.SumEggQty > 0 || item.EggWeight > 0);

    return NextResponse.json(calculatedStock);
  } catch (error: unknown) {
    console.error("Backend GET Error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// 2. [POST] บันทึกประวัติการเบิกจ่าย / ขาย / โยกย้าย ลงตาราง EggTransaction
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      ID_Intake,
      reduceQty,
      reduceWeight,
      employee,
      transactionType = "REDUCE",
    } = body;

    if (!ID_Intake || !employee) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุข้อมูลรหัสพาเลทและพนักงานผู้ทำรายการ" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. ดึงข้อมูล EggIntake
    const { data: intakeData, error: intakeFetchError } = await supabase
      .from("EggIntake")
      .select("ID_Intake, ID_Pallet, EggStack, EggTray, EggQty, EggWeight")
      .eq("ID_Intake", ID_Intake)
      .single();

    if (intakeFetchError || !intakeData) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลรายการพาเลทที่ระบุ" },
        { status: 404 }
      );
    }

    // คำนวณจำนวนตั้ง และ แผง จากจำนวนฟองที่ส่งมาให้ถูกต้อง
    const totalQty = Number(reduceQty || 0);
    const reduceStack = Math.floor(totalQty / EGGS_PER_STACK);
    const remainderAfterStack = totalQty % EGGS_PER_STACK;
    const reduceTray = Math.floor(remainderAfterStack / EGGS_PER_TRAY);

    // 2. บันทึกลงตาราง EggTransaction
    const { error: insertTrxError } = await supabase
      .from("EggTransaction")
      .insert({
        TransactionDate: new Date().toISOString(),
        ID_Intake: ID_Intake,
        ReduceStack: reduceStack,       // จำนวนตั้ง
        ReduceTray: reduceTray,         // จำนวนแผง
        ReduceQty: totalQty,           // จำนวนฟองรวมจริง (เช่น 6000)
        ReduceWeight: Number(reduceWeight || 0),
        Employee: employee,
        TransactionType: transactionType,
      });

    if (insertTrxError) throw insertTrxError;

    // 3. คำนวณยอดคงเหลือสุทธิล่าสุด
    const { data: allTrx, error: allTrxError } = await supabase
      .from("EggTransaction")
      .select("ReduceQty, ReduceWeight, TransactionType")
      .eq("ID_Intake", ID_Intake);

    if (allTrxError) throw allTrxError;

    const initialTotalEggs =
      Number(intakeData.EggQty || 0) > 0 && Number(intakeData.EggStack || 0) === 0
        ? Number(intakeData.EggQty || 0)
        : Number(intakeData.EggStack || 0) * EGGS_PER_STACK +
          Number(intakeData.EggTray || 0) * EGGS_PER_TRAY +
          Number(intakeData.EggQty || 0);

    let netEggs = initialTotalEggs;
    let netWeight = Number(intakeData.EggWeight || 0);

    allTrx?.forEach((trx) => {
      const q = Number(trx.ReduceQty || 0);
      const w = Number(trx.ReduceWeight || 0);
      if (trx.TransactionType === "ADD") {
        netEggs += q;
        netWeight += w;
      } else {
        netEggs -= q;
        netWeight -= w;
      }
    });

    netEggs = Math.max(0, netEggs);
    netWeight = Math.max(0, Number(netWeight.toFixed(2)));

    // 4. กรณีตัดขาย/เบิกหมด ( netEggs <= 0 ) -> ปลด Location และคืนสถานะ Pallet
    if (netEggs <= 0 && netWeight <= 0 && transactionType === "REDUCE") {
      const { error: updateIntakeError } = await supabase
        .from("EggIntake")
        .update({ ID_Location: null })
        .eq("ID_Intake", ID_Intake);

      if (updateIntakeError) throw updateIntakeError;

      if (intakeData.ID_Pallet) {
        const { error: updatePalletError } = await supabase
          .from("Pallet")
          .update({ Using_Pallet: false })
          .eq("ID_Pallet", intakeData.ID_Pallet);

        if (updatePalletError) throw updatePalletError;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "บันทึกรายการสำเร็จ",
        remainingEggs: netEggs,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("POST Transaction Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}