"use client";

interface IntakeHeaderProps {
  search: string;
  setSearch: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onOpenForm: () => void;
}

export default function IntakeHeader({
  search,
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onOpenForm,
}: IntakeHeaderProps) {
  
  // ฟังก์ชันช่วยสั่งให้ปฏิทินเด้งเปิดขึ้นมาทันทีเมื่อคลิกที่ช่องอินพุต
  const handleDatePickerClick = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      // สั่งเปิดตัวเลือกปฏิทินของเบราว์เซอร์ทันที
      e.currentTarget.showPicker();
    } catch (error) {
      console.error("Browser does not support showPicker", error);
    }
  };

  return (
    <div className="bg-[#0b1329]/60 backdrop-blur-md p-6 rounded-2xl border border-[#1e293b] mb-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Intake</h1>
          <p className="text-sm text-gray-400 mt-1">ระบบบริหารจัดการและบันทึกข้อมูลไข่เข้าคลัง</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ค้นหา (เล้า, ห้อง, ผู้บันทึก)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-[#334155] rounded-xl pl-4 pr-4 py-2 w-64 text-white text-sm bg-[#0b1329] focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] focus:outline-none transition-all placeholder-gray-500"
            />
          </div>
          <div className="h-6 w-[1px] bg-[#334155] hidden sm:block" />
          <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
            <span>ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={handleDatePickerClick} // เพิ่มจุดนี้: คลิกปุ๊บปฏิทินเปิดทันที
              className="border border-[#334155] rounded-lg px-2 py-1.5 text-white bg-[#0b1329] focus:border-[#f59e0b] focus:outline-none cursor-pointer select-none"
            />
            <span>ถึง:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={handleDatePickerClick} // เพิ่มจุดนี้: คลิกปุ๊บปฏิทินเปิดทันที
              className="border border-[#334155] rounded-lg px-2 py-1.5 text-white bg-[#0b1329] focus:border-[#f59e0b] focus:outline-none cursor-pointer select-none"
            />
          </div>
          <button
            onClick={onOpenForm}
            className="bg-[#f59e0b] text-slate-950 px-5 py-2 rounded-xl text-sm font-bold hover:bg-[#d97706] active:scale-95 transition-all shadow-md ml-auto lg:ml-2"
          >
            + เพิ่มข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}