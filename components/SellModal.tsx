"use client";

import { useState, useEffect } from "react";

interface Stock {
  ID_Intake?: number;
  Pallet: string;
  Location: string;
  EggCategory: string;
  EggType: string;
  SumEggQty: number;
  EggWeight: number;
  Employee: string;
}

interface SellModalProps {
  selectedPallet: Stock;
  userEmail: string;
  onClose: () => void;
  onSubmit: (
    totalSellQty: number,
    totalSellWeight: number,
    transactionType: "REDUCE" | "ADD"
  ) => Promise<void>;
  isLoading: boolean;
  formatEggUnits: (totalEggs: number) => { stacks: number; trays: number; eggs: number };
  sellStacks: number;
  setSellStacks: (val: number) => void;
  sellTrays: number;
  setSellTrays: (val: number) => void;
  sellEggs: number;
  setSellEggs: (val: number) => void;
}

export default function SellModal({
  selectedPallet,
  userEmail,
  onClose,
  onSubmit,
  isLoading,
  formatEggUnits,
  sellStacks,
  setSellStacks,
  sellTrays,
  setSellTrays,
  sellEggs,
  setSellEggs,
}: SellModalProps) {
  const EGGS_PER_TRAY = 30;
  const EGGS_PER_STACK = 300;

  const [sellWeight, setSellWeight] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<"REDUCE" | "ADD">("REDUCE");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const isLiquidEgg = selectedPallet.EggWeight > 0 && selectedPallet.SumEggQty === 0;
  const maxAvailableUnits = formatEggUnits(selectedPallet.SumEggQty);
  const totalSellQty = sellStacks * EGGS_PER_STACK + sellTrays * EGGS_PER_TRAY + sellEggs;

  useEffect(() => {
    setSellWeight(0);
    setShowSuccess(false);
  }, [selectedPallet]);

  // ฟังก์ชันตั้งค่าจำนวนให้เต็มสต็อกทั้งหมด (ตัดขายทั้งหมด)
  const handleSelectAll = () => {
    if (isLiquidEgg) {
      setSellWeight(selectedPallet.EggWeight);
    } else {
      const units = formatEggUnits(selectedPallet.SumEggQty);
      setSellStacks(units.stacks);
      setSellTrays(units.trays);
      setSellEggs(units.eggs);
    }
  };

  const handleQtyChange = (type: "stack" | "tray" | "egg", value: number) => {
    const inputVal = Math.max(0, value);
    let tempStacks = sellStacks;
    let tempTrays = sellTrays;
    let tempEggs = sellEggs;

    if (type === "stack") tempStacks = inputVal;
    if (type === "tray") tempTrays = inputVal;
    if (type === "egg") tempEggs = inputVal;

    const projectedTotal = tempStacks * EGGS_PER_STACK + tempTrays * EGGS_PER_TRAY + tempEggs;

    if (transactionType === "ADD" || projectedTotal <= selectedPallet.SumEggQty) {
      if (type === "stack") setSellStacks(inputVal);
      if (type === "tray") setSellTrays(inputVal);
      if (type === "egg") setSellEggs(inputVal);
    } else {
      const maxUnits = formatEggUnits(selectedPallet.SumEggQty);
      setSellStacks(maxUnits.stacks);
      setSellTrays(maxUnits.trays);
      setSellEggs(maxUnits.eggs);
    }
  };

  const handleFormSubmit = async () => {
    try {
      await onSubmit(totalSellQty, sellWeight, transactionType);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Submit failed:", error);
    }
  };

  const isValid =
    (isLiquidEgg
      ? sellWeight > 0 && (transactionType === "ADD" || sellWeight <= selectedPallet.EggWeight)
      : totalSellQty > 0 && (transactionType === "ADD" || totalSellQty <= selectedPallet.SumEggQty)) &&
    userEmail !== "";

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      {!showSuccess ? (
        <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                📦 ทำรายการคลังสินค้า
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                พาเลท: <span className="text-amber-400 font-bold">{selectedPallet.Pallet}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
          </div>

          {/* เลือกประเภท Transaction */}
          <div className="grid grid-cols-2 gap-2 my-4 bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setTransactionType("REDUCE")}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                transactionType === "REDUCE"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🛒 ตัดขาย / เบิกออก (ลบ)
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("ADD")}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                transactionType === "ADD"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🔄 โยกย้าย / รับเข้า (เพิ่ม)
            </button>
          </div>

          {/* แสดงรายละเอียดสินค้า */}
          <div className="bg-slate-900 p-3 rounded-xl my-3 text-xs space-y-1.5 border border-slate-700/50">
            <div className="flex justify-between">
              <span className="text-slate-400">ตำแหน่งจัดเก็บ:</span>
              <span className="text-slate-200 font-medium">{selectedPallet.Location || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">หมวดหมู่ไข่:</span>
              <span className="text-slate-200 font-medium">{selectedPallet.EggCategory || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ประเภท/เบอร์:</span>
              <span className="text-slate-200 font-medium">{selectedPallet.EggType || "-"}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">คงเหลือปัจจุบัน:</span>
              <span className="text-emerald-400 font-bold">
                {isLiquidEgg
                  ? `${selectedPallet.EggWeight.toLocaleString()} KG`
                  : `${selectedPallet.SumEggQty.toLocaleString()} ฟอง (${maxAvailableUnits.stacks} ตั้ง / ${maxAvailableUnits.trays} แผง / ${maxAvailableUnits.eggs} ฟอง)`}
              </span>
            </div>
          </div>

          {/* ส่วนระบุจำนวนตัวเลข (ปรับการจัดวางตำแหน่ง Layout ใหม่) */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300">
                {transactionType === "REDUCE" ? "ระบุจำนวนที่ต้องการตัดออก:" : "ระบุจำนวนที่ต้องการเพิ่มเข้า:"}
              </label>
            </div>

            {isLiquidEgg ? (
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellWeight || ""}
                  onChange={(e) => setSellWeight(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 pr-24 bg-slate-950 border border-slate-700 text-amber-400 text-2xl text-center font-black rounded-xl focus:border-amber-500 outline-none"
                  placeholder="0.00"
                />
                <div className="absolute right-3 flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400">KG</span>
                  {transactionType === "REDUCE" && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold px-2 py-1 rounded-md border border-amber-500/40 transition active:scale-95"
                    >
                      ⚡ ทั้งหมด
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2 border border-slate-700 rounded-xl flex flex-col items-center">
                    <span className="text-[11px] font-bold text-amber-400 mb-1">ตั้ง</span>
                    <input
                      type="number"
                      min="0"
                      value={sellStacks || ""}
                      onChange={(e) => handleQtyChange("stack", parseInt(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg text-center font-mono font-bold text-lg outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="bg-slate-950 p-2 border border-slate-700 rounded-xl flex flex-col items-center">
                    <span className="text-[11px] font-bold text-sky-400 mb-1">แผง</span>
                    <input
                      type="number"
                      min="0"
                      value={sellTrays || ""}
                      onChange={(e) => handleQtyChange("tray", parseInt(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg text-center font-mono font-bold text-lg outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="bg-slate-950 p-2 border border-slate-700 rounded-xl flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-300 mb-1">เศษฟอง</span>
                    <input
                      type="number"
                      min="0"
                      value={sellEggs || ""}
                      onChange={(e) => handleQtyChange("egg", parseInt(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg text-center font-mono font-bold text-lg outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                {/* สรุปยอดรวมฟองด้านล่าง + ปุ่มเลือกทั้งหมด */}
                <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">
                    รวมทั้งสิ้น: <strong className="text-emerald-400 font-mono text-sm">{totalSellQty.toLocaleString()}</strong> ฟอง
                  </span>
                  {transactionType === "REDUCE" && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 transition active:scale-95"
                    >
                      ⚡ เลือกสต็อกทั้งหมด
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-slate-700/50 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isLoading || !isValid}
              className={`flex-1 py-3 font-extrabold rounded-xl text-xs transition shadow-lg ${
                transactionType === "ADD"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "⏳ กำลังบันทึก..." : "📥 ยืนยันทำรายการ"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl text-center text-white">
          ✅ บันทึกประวัติรายการเรียบร้อยแล้ว
        </div>
      )}
    </div>
  );
}