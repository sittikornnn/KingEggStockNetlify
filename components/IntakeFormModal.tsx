"use client";

import { useState } from "react";

interface ChickenHouse { ID_House: number; Name_House: string; }
interface Room { ID_Room: number; Name_Room: string; }
interface Pallet { ID_Pallet: number; Name_Pallet: string; }
interface EggCategory { ID_Category: number; Name_Category: string; }
interface EggType { ID_EggType: number; Name_EggType: string; ID_Category: number; }

interface IntakeFormModalProps {
  onClose: () => void;
  dateTime: string;
  setDateTime: (val: string) => void;
  chickenHouses: ChickenHouse[];
  selectedHouse: string;
  setSelectedHouse: (val: string) => void;
  Room: Room[];
  selectedRoom: string;
  setSelectedRoom: (val: string) => void;
  Pallet: Pallet[];
  selectedPallet: string;
  setSelectedPallet: (val: string) => void;
  eggCategories: EggCategory[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  filteredEggTypes: EggType[];
  selectedEggType: string;
  setSelectedEggType: (val: string) => void;
  eggStack: number | string;
  setEggStack: (val: number | string) => void;
  eggTray: number | string;
  setEggTray: (val: number | string) => void;
  eggQty: number | string;
  setEggQty: (val: number | string) => void;
  eggWeight: number | string;
  setEggWeight: (val: number | string) => void;
  isSaving: boolean;
  onSave: () => void | Promise<void>; // รองรับฟังก์ชันเซฟแบบ Async 
}

export default function IntakeFormModal({
  onClose, dateTime, setDateTime, chickenHouses, selectedHouse, setSelectedHouse,
  Room, selectedRoom, setSelectedRoom, Pallet, selectedPallet, setSelectedPallet,
  eggCategories, selectedCategory, setSelectedCategory, filteredEggTypes, selectedEggType, setSelectedEggType,
  eggStack, setEggStack, eggTray, setEggTray, eggQty, setEggQty, eggWeight, setEggWeight,
  isSaving, onSave
}: IntakeFormModalProps) {
  
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleSaveClick = async () => {
    try {
      await onSave();
      // เมื่อการเซฟสำเร็จย้ายไปเปิดหน้าต่างแสดงความสำเร็จและนับถอยหลัง 2 วิเพื่อเปิด-ปิด
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4 backdrop-blur-md transition-opacity duration-300">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bouncePop {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progressBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes checkmark {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />

      {!showSuccess ? (
        /* --- หน้าจอแบบฟอร์มกรอกข้อมูลสไตล์เดิม ดัดแปลงแอนิเมชันตอนเกิด --- */
        <div className="bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[95vh] overflow-y-auto border border-[#334155] animate-[bouncePop_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#334155]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#f59e0b] rounded-full inline-block"></span>
              เพิ่มข้อมูล การนับไข่
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-[#f59e0b] text-2xl font-semibold transition-colors">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">วันที่</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white focus:border-[#f59e0b] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">เล้า</label>
                <select
                  value={selectedHouse}
                  onChange={(e) => setSelectedHouse(e.target.value)}
                  className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white focus:border-[#f59e0b] focus:outline-none"
                  required
                >
                  <option value="" className="text-gray-500">-- เลือกเล้าไก่ --</option>
                  {chickenHouses.map((house) => (
                    <option key={house.ID_House} value={house.ID_House}>{house.Name_House}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">ห้อง</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white focus:border-[#f59e0b] focus:outline-none"
                  required
                >
                  <option value="" className="text-gray-500">-- เลือกห้อง --</option>
                  {Room.map((room) => (
                    <option key={room.ID_Room} value={room.ID_Room}>{room.Name_Room}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">พาเลท</label>
                <select
                  value={selectedPallet}
                  onChange={(e) => setSelectedPallet(e.target.value)}
                  className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white focus:border-[#f59e0b] focus:outline-none"
                  required
                >
                  <option value="" className="text-gray-500">-- เลือกพาเลท --</option>
                  {Pallet.map((pallet) => (
                    <option key={pallet.ID_Pallet} value={pallet.ID_Pallet}>{pallet.Name_Pallet}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">ประเภทของไข่</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedEggType("");
                  }}
                  className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white focus:border-[#f59e0b] focus:outline-none"
                  required
                >
                  <option value="" className="text-gray-500">-- เลือกประเภทของไข่ --</option>
                  {eggCategories.map((cat) => (
                    <option key={cat.ID_Category} value={cat.ID_Category}>{cat.Name_Category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">ชนิดของไข่</label>
                <select
                  value={selectedEggType}
                  onChange={(e) => setSelectedEggType(e.target.value)}
                  disabled={!selectedCategory}
                  className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed focus:border-[#f59e0b] focus:outline-none"
                  required
                >
                  <option value="" className="text-gray-500">
                    {!selectedCategory ? "⚠️ กรุณาเลือกประเภทของไข่ก่อน" : "-- เลือกชนิดของไข่ --"}
                  </option>
                  {filteredEggTypes.map((type) => (
                    <option key={type.ID_EggType} value={type.ID_EggType}>{type.Name_EggType}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">จำนวนตั้ง</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={eggStack}
                    onChange={(e) => setEggStack(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white placeholder-gray-600 focus:border-[#f59e0b] focus:outline-none text-right font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">จำนวนแผง</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={eggTray}
                    onChange={(e) => setEggTray(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white placeholder-gray-600 focus:border-[#f59e0b] focus:outline-none text-right font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">จำนวนฟอง</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={eggQty}
                    onChange={(e) => setEggQty(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white placeholder-gray-600 focus:border-[#f59e0b] focus:outline-none text-right font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">จำนวนน้ำหนัก (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    value={eggWeight}
                    onChange={(e) => setEggWeight(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="border border-[#334155] rounded-xl px-3 py-2 w-full bg-[#0b1329] text-white placeholder-gray-600 focus:border-[#f59e0b] focus:outline-none text-right font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl border border-[#334155] text-gray-300 bg-transparent hover:bg-slate-800 hover:text-white transition-all text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 active:scale-95 disabled:bg-emerald-800 transition-all text-sm"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      ) : (
        /* 🌟 --- หน้าจอความสำเร็จที่ขยายตัวขึ้นมาใหม่เมื่อประมวลผลเสร็จ --- */
        <div className="bg-[#0f172a] border border-[#334155] w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden animate-[bouncePop_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20 animate-pulse">
            <svg
              className="h-8 w-8 animate-[checkmark_0.3s_ease-in-out_forwards]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-xl font-black text-white mb-1">บันทึกสำเร็จ!</h3>
          <p className="text-sm text-gray-400 mb-5">เพิ่มข้อมูลการนับไข่เข้าสู่ระบบเรียบร้อย</p>

          {/* Progress Bar วิ่งจับเวลา 2 วินาทีใต้กรอบ Modal */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div className="h-full bg-linear-to-r from-emerald-500 to-teal-400 animate-[progressBar_2s_linear_forwards]" />
          </div>
        </div>
      )}
    </div>
  );
}