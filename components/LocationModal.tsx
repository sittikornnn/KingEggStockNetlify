"use client";

interface EggIntakeData {
  ID_Intake?: number;
  CreateDate: string;
  House: string;
  Room: string;
  Pallet: string;
  EggCategory: string;
  EggType: string;
  EggStack: number;
  EggTray: number;
  EggQty: number;
  Eggweight: number;
  Employee: string;
  Location?: string;
}
interface LocationData { ID_Location: number; Name_Building: string; Name_Location: string; }

interface LocationModalProps {
  onClose: () => void;
  editingRow: EggIntakeData | null;
  buildings: string[];
  selectedBuilding: string;
  setSelectedBuilding: (val: string) => void;
  setSelectedLocation: (val: string) => void;
  selectedLocation: string;
  filteredLocations: LocationData[];
  isSaving: boolean;
  onUpdate: () => void;
}

export default function LocationModal({
  onClose, editingRow, buildings, selectedBuilding, setSelectedBuilding,
  setSelectedLocation, selectedLocation, filteredLocations, isSaving, onUpdate
}: LocationModalProps) {
  if (!editingRow) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-opacity">
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-[#334155] animate-[in_0.2s_ease-out]">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#334155]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-5 bg-[#f59e0b] rounded-full inline-block"></span>
            จัดการข้อมูลและคลังจัดเก็บ
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#f59e0b] font-semibold text-xl">✕</button>
        </div>

        <div className="space-y-4 text-gray-300 text-sm">
          <div className="bg-[#0b1329] p-4 rounded-xl border border-[#1e293b] space-y-2.5">
            <p><strong className="text-gray-400">เล้า:</strong> <span className="text-white font-medium">{editingRow.House || "-"}</span></p>
            <p><strong className="text-gray-400">ห้อง / พาเลท:</strong> <span className="text-white">{editingRow.Room || "-"} / {editingRow.Pallet || "-"}</span></p>
            <p><strong className="text-gray-400">ประเภท / ชนิดไข่:</strong> <span className="text-[#f59e0b] font-semibold">{editingRow.EggCategory || "-"} ({editingRow.EggType || "-"})</span></p>
            <p><strong className="text-gray-400">จำนวน:</strong> <span className="text-cyan-400 font-mono font-bold">{editingRow.EggStack}</span> ตั้ง | <span className="text-cyan-400 font-mono font-bold">{editingRow.EggTray}</span> แผง | <span className="text-cyan-400 font-mono font-bold">{editingRow.EggQty}</span> ฟอง</p>
            <p><strong className="text-gray-400">น้ำหนักรวม:</strong> <span className="text-emerald-400 font-mono font-bold">{editingRow.Eggweight} kg</span></p>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-400">อาคาร (Building)</label>
            <select
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value);
                setSelectedLocation("");
              }}
              className="border border-[#334155] rounded-xl px-3 py-2 w-full text-white bg-[#0b1329] focus:border-[#f59e0b] focus:outline-none"
              required
            >
              <option value="" className="text-gray-500">-- เลือกอาคาร --</option>
              {buildings.map((bld, idx) => (
                <option key={idx} value={bld}>{bld}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-400">สถานที่ (Location)</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              disabled={!selectedBuilding}
              className="border border-[#334155] rounded-xl px-3 py-2 w-full text-white bg-[#0b1329] disabled:bg-slate-800 disabled:text-gray-600 disabled:cursor-not-allowed focus:border-[#f59e0b] focus:outline-none"
              required
            >
              <option value="" className="text-gray-500">
                {!selectedBuilding ? "⚠️ กรุณาเลือกอาคารก่อน" : "-- เลือกสถานที่ย่อย --"}
              </option>
              {filteredLocations.map((loc) => (
                <option key={loc.ID_Location} value={loc.ID_Location}>{loc.Name_Location}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-[#334155]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#334155] rounded-xl text-gray-300 bg-transparent hover:bg-slate-800 text-sm font-medium"
          >
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            onClick={onUpdate}
            disabled={isSaving}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 px-5 py-2 rounded-xl text-sm font-bold transition-all"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกตำแหน่ง"}
          </button>
        </div>
      </div>
    </div>
  );
}