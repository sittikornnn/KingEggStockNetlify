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

interface IntakeTableProps {
  isLoading: boolean;
  filteredIntakeList: EggIntakeData[];
  onOpenLocation: (item: EggIntakeData) => void;
}

export default function IntakeTable({
  isLoading,
  filteredIntakeList,
  onOpenLocation,
}: IntakeTableProps) {
  return (
    <div
      className="
        w-full
        overflow-x-auto
        rounded-2xl
        border
        border-[#1e293b]
        shadow-xl
        bg-[#0b1329]/40
        backdrop-blur-sm
      "
    >
      {isLoading && (
        <div
          className="
            absolute
            inset-0
            bg-[#0b1329]/70
            backdrop-blur-[2px]
            flex
            items-center
            justify-center
            z-10
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              text-[#f59e0b]
              font-bold
            "
          >
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="
                  M4 12a8 8 0 018-8V0C5.373
                  0 0 5.373 0 12h4zm2 5.291A7.962
                  7.962 0 014 12H0c0 3.042
                  1.135 5.824 3 7.938l3-2.647z
                "
              />
            </svg>
            กำลังโหลดข้อมูล...
          </div>
        </div>
      )}

      <table
        className="
          w-full
          table-fixed
          text-gray-200
          text-sm
        "
      >
        <thead
          className="
            bg-[#0f172a]
            border-b
            border-[#1e293b]
            text-gray-400
            uppercase
            text-xs
            font-semibold
          "
        >
          <tr>
            <th className="w-[120px] px-3 py-3 whitespace-nowrap">
              วันที่/เวลา
            </th>

            <th className="w-[70px] px-3 py-3 whitespace-nowrap">
              เล้า
            </th>

            <th className="w-[140px] px-3 py-3 whitespace-nowrap">
              ห้อง
            </th>

            <th className="w-[130px] px-3 py-3 whitespace-nowrap">
              พาเลท
            </th>

            <th className="w-[120px] px-3 py-3 whitespace-nowrap">
              ประเภทไข่
            </th>

            <th className="w-[120px] px-3 py-3 whitespace-nowrap">
              ชนิดไข่
            </th>

            <th className="w-[80px] px-3 py-3 text-right whitespace-nowrap">
              จำนวนตั้ง
            </th>

            <th className="w-[80px] px-3 py-3 text-right whitespace-nowrap">
              จำนวนแผง
            </th>

            <th className="w-[80px] px-3 py-3 text-right whitespace-nowrap">
              จำนวนฟอง
            </th>

            <th className="w-[90px] px-3 py-3 text-right whitespace-nowrap">
              น้ำหนัก
            </th>

            <th className="w-[120px] px-3 py-3 text-right whitespace-nowrap">
              ยอดรวม
            </th>

            <th className="w-[120px] px-3 py-3 whitespace-nowrap">
              ผู้บันทึก
            </th>

            <th className="w-[130px] px-3 py-3 text-center whitespace-nowrap">
              Location
            </th>
          </tr>
        </thead>

        <tbody
          className="
            divide-y
            divide-[#1e293b]
          "
        >
          {filteredIntakeList.length === 0 ? (
            <tr>
              <td
                colSpan={13}
                className="
                  text-center
                  py-16
                  text-gray-500
                  whitespace-nowrap
                "
              >
                {isLoading ? "กำลังอัปเดตระบบ..." : "❌ ไม่พบข้อมูล"}
              </td>
            </tr>
          ) : (
            filteredIntakeList.map((item, index) => {
              const totalEggs =
                (item.EggStack || 0) * 300 +
                (item.EggTray || 0) * 30 +
                (item.EggQty || 0);

              return (
                <tr
                  key={item.ID_Intake ?? index}
                  className="
                    hover:bg-[#0f172a]/70
                    transition
                  "
                >
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-400">
                    {item.CreateDate
                      ? new Date(item.CreateDate).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "-"}
                  </td>

                  <td
                    className="
                      px-3
                      py-3
                      whitespace-nowrap
                      font-bold
                      text-white
                    "
                  >
                    {item.House || "-"}
                  </td>

                  <td
                    className="
                      px-3
                      py-3
                      whitespace-nowrap
                      overflow-hidden
                      text-ellipsis
                    "
                    title={item.Room}
                  >
                    {item.Room || "-"}
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className="
                        bg-slate-800
                        border
                        border-[#334155]
                        px-2
                        py-1
                        rounded
                        text-xs
                        font-mono
                        text-cyan-400
                      "
                    >
                      {item.Pallet || "-"}
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className="
                        bg-[#f59e0b]/10
                        border
                        border-[#f59e0b]/30
                        text-[#f59e0b]
                        px-2
                        py-1
                        rounded
                        text-xs
                      "
                    >
                      {item.EggCategory || "-"}
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className="
                        bg-cyan-500/10
                        border
                        border-cyan-500/30
                        text-cyan-400
                        px-2
                        py-1
                        rounded
                        text-xs
                      "
                    >
                      {item.EggType || "-"}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-right whitespace-nowrap font-mono font-bold">
                    {item.EggStack?.toLocaleString() || 0}
                  </td>

                  <td className="px-3 py-3 text-right whitespace-nowrap font-mono font-bold">
                    {item.EggTray?.toLocaleString() || 0}
                  </td>

                  <td className="px-3 py-3 text-right whitespace-nowrap font-mono font-bold">
                    {item.EggQty?.toLocaleString() || 0}
                  </td>

                  <td
                    className="
                      px-3
                      py-3
                      text-right
                      whitespace-nowrap
                      font-mono
                      text-emerald-400
                      font-bold
                    "
                  >
                    {item.Eggweight
                      ? Number(item.Eggweight).toFixed(3)
                      : "0.000"}
                  </td>

                  <td
                    className="
                      px-3
                      py-3
                      text-right
                      whitespace-nowrap
                      font-mono
                      font-bold
                      text-[#f59e0b]
                      bg-[#f59e0b]/5
                    "
                  >
                    {totalEggs.toLocaleString()}
                  </td>

                  <td
                    className="
                      px-3
                      py-3
                      whitespace-nowrap
                      text-xs
                      text-gray-400
                      overflow-hidden
                      truncate
                    "
                    title={item.Employee}
                  >
                    {item.Employee || "-"}
                  </td>

                  <td
                    className="
                      px-3
                      py-3
                      text-center
                      whitespace-nowrap
                    "
                  >
                    <button
                      onClick={() => onOpenLocation(item)}
                      className="
                        bg-[#f59e0b]
                        hover:bg-[#d97706]
                        text-slate-950
                        font-bold
                        px-3
                        py-1.5
                        rounded-lg
                        text-xs
                        transition
                        active:scale-95
                        max-w-[120px]
                        truncate
                      "
                      title="แก้ไขตำแหน่งจัดเก็บ"
                    >
                      {item.Location || "ระบุตำแหน่ง"}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}