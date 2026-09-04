"use client";

// 1. นิยามโครงสร้างข้อมูลร่วมกัน (เพิ่ม ID_Intake เพื่อให้ตรงกับหน้าหลัก page.tsx)
export interface Stock {
  ID_Intake?: number; // 👈 เพิ่มฟิลด์นี้แก้ปัญหา Type Mismatch
  CreateDate: string;
  House: string;
  Room: string;
  Pallet: string;
  EggCategory: string;
  EggType: string;
  EggStack: number;
  EggTray: number;
  EggQty: number;
  EggWeight: number; // ใช้ W ใหญ่ ตามโครงสร้างหลัก
  SumEggQty: number; // ใช้ยอดรวมตัวนี้ตามหน้าหลัก
  Employee: string;
  Location: string;
  Columns_Location: number;
  Row_Location: number;
}

interface StockListProps {
  fifoStocks: Stock[] | undefined | null; // อนุญาตให้รับค่าว่างจาก API ได้เพื่อความปลอดภัย
  selectedCategory: string;
  onOpenModal: (item: Stock) => void;
  formatEggUnits?: (totalEggs: number) => { stacks: number; trays: number; eggs: number };
}

export default function StockList({
  fifoStocks,
  selectedCategory,
  onOpenModal,
}: StockListProps) {
  
  // 🛠️ ตรวจสอบความปลอดภัย (Defensive Check) ป้องกัน Error .length ของ undefined
  if (!fifoStocks || !Array.isArray(fifoStocks) || fifoStocks.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl text-slate-400 text-lg italic">
        🔍 ไม่พบไข่คงคลังในหมวดหมู่ &quot;{selectedCategory === "ALL" ? "ทั้งหมด" : selectedCategory}&quot; ที่พร้อมเบิกจ่ายในขณะนี้
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {fifoStocks.map((item, index) => {
        const isPriorityOne = index === 0;

        return (
          <div
            key={`${item.Pallet}-${item.EggType}-${index}`}
            className={`border rounded-2xl p-5 shadow-xl flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 transition-all duration-200 ${
              isPriorityOne
                ? "bg-gradient-to-r from-amber-500/10 via-slate-800/95 to-slate-800/95 border-amber-500 ring-4 ring-amber-500/10"
                : "bg-slate-800/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800"
            }`}
          >
            {/* 📦 คอลัมน์ที่ 1: ลำดับคิว และ ID สินค้า (ฝั่งซ้ายสุด) */}
            <div className="flex items-center gap-4 min-w-55 shrink-0">
              <div
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner shrink-0 ${
                  isPriorityOne ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-200"
                }`}
              >
                <span className="text-[11px] uppercase font-bold tracking-wider opacity-90">คิวที่</span>
                <span className="text-2xl -mt-1 font-mono">{index + 1}</span>
              </div>
              <div className="space-y-1.5">
                {isPriorityOne && (
                  <span className="inline-flex items-center bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse shadow-sm shadow-rose-600/30">
                    🔥 ต้องออกก่อน
                  </span>
                )}
                <h4 className="text-base font-black font-mono text-white tracking-wide">
                  📦 ID: {item.Pallet}
                </h4>
                <div className="text-xs bg-slate-950/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                  <span className="text-amber-400">📍 พิกัด:</span> {item.Location}
                </div>
              </div>
            </div>

            {/* 📊 คอลัมน์ที่ 2: ตารางข้อมูลเชิงลึก ชนิดไข่ และตัวเลขทั้งหมด (พื้นที่ตรงกลาง) */}
            <div className="flex flex-col lg:flex-row gap-4 flex-1 w-full">
              {/* ชนิดไข่ */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 lg:w-44 shrink-0 flex flex-col justify-center">
                <span className="text-xs text-slate-400 font-semibold tracking-wide">🥚 ชนิด / ประเภท</span>
                <span className="font-black text-slate-100 text-base mt-1 truncate">
                  {item.EggCategory}
                </span>
                <span className="text-amber-400 font-medium text-xs mt-0.5">
                  {item.EggType ? `(${item.EggType})` : "-"}
                </span>
              </div>

              {/* ชุดตัวเลขจำนวนนับ */}
              <div className="grid grid-cols-3 gap-3 flex-1 min-w-65">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 text-center flex flex-col justify-center transition-colors hover:bg-slate-900">
                  <span className="text-xs text-slate-300 font-bold mb-1 block">จำนวนตั้ง</span>
                  <span className="font-mono font-black text-amber-400 text-xl">{item.EggStack}</span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 text-center flex flex-col justify-center transition-colors hover:bg-slate-900">
                  <span className="text-xs text-slate-300 font-bold mb-1 block">จำนวนแผง</span>
                  <span className="font-mono font-black text-sky-400 text-xl">{item.EggTray}</span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 text-center flex flex-col justify-center transition-colors hover:bg-slate-900">
                  <span className="text-xs text-slate-300 font-bold mb-1 block">เศษฟอง</span>
                  <span className="font-mono font-black text-slate-200 text-xl">{item.EggQty}</span>
                </div>
              </div>

              {/* สรุปน้ำหนักและยอดรวมสุทธิ */}
              <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 lg:w-44 shrink-0">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-center flex flex-col justify-center">
                  <span className="text-xs text-slate-400 font-semibold mb-0.5">น้ำหนักไข่ตอก</span>
                  <span className="font-mono font-black text-slate-200 text-base">
                    {item.EggWeight || "-"} <span className="text-[11px] text-slate-400 font-sans">KG</span>
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border text-center flex flex-col justify-center ${
                  isPriorityOne ? "bg-emerald-500/15 border-emerald-500/40" : "bg-emerald-500/10 border-emerald-500/20"
                }`}>
                  <span className="text-xs text-emerald-400/90 font-bold mb-0.5">ยอดรวมสุทธิ</span>
                  <span className="font-mono font-black text-emerald-400 text-lg">
                    {item.SumEggQty} <span className="text-[11px] font-sans font-medium text-emerald-300">ฟอง</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ⏱️ คอลัมน์ที่ 3: โซนจัดการเวลา + ปุ่ม Action จัดกลุ่มคู่กันแนวตั้ง */}
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 w-full sm:w-auto xl:w-45 shrink-0 justify-between">
              
              {/* ส่วนบน: วันที่นำเข้าคลัง */}
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-center flex-1 sm:flex-initial xl:w-full">
                <span className="text-[11px] text-slate-400 font-bold block mb-1.5">🗓️ วันที่นำเข้าคลัง</span>
                {item.CreateDate ? (
                  <div className="flex flex-row xl:flex-col justify-center items-center gap-2 xl:gap-0 bg-slate-950 py-1.5 px-2 rounded-lg border border-slate-800/85 font-mono text-xs">
                    <span className="font-black text-slate-100">
                      {(() => {
                        const delimiter = item.CreateDate.includes("T") ? "T" : " ";
                        const datePart = item.CreateDate.split(delimiter)[0];
                        if (datePart.includes("-")) {
                          const [y, m, d] = datePart.split("-");
                          return `${d}/${m}/${y}`;
                        }
                        return datePart;
                      })()}
                    </span>
                    <span className="hidden xl:block border-t border-slate-800/60 my-1 w-full"></span>
                    <span className="font-bold text-amber-400">
                      {(() => {
                        const delimiter = item.CreateDate.includes("T") ? "T" : " ";
                        const parts = item.CreateDate.split(delimiter);
                        return parts[1] ? parts[1].substring(0, 5) : "--:--";
                      })()} น.
                    </span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-slate-500 bg-slate-950 py-1.5 rounded-lg border border-slate-800 block text-xs">-</span>
                )}
              </div>

              {/* ส่วนล่าง: ปุ่มกดขาย */}
              <button
                onClick={() => onOpenModal(item)}
                className={`flex-1 sm:flex-initial xl:w-full py-3.5 px-4 rounded-xl text-sm font-black transition-all duration-150 active:scale-[0.97] tracking-wide shadow-md flex items-center justify-center gap-1.5 ${
                  isPriorityOne
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/10 hover:shadow-amber-400/20"
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/10"
                }`}
              >
                <span>🛒</span>
                <span>กดขายรายการนี้</span>
              </button>

            </div>

          </div>
        );
      })}
    </div>
  );
}