"use client";

import { useEffect, useState, useCallback } from "react";

interface ApiEggIntake {
  ID_Intake: number;
  CreateDate: string;
  EggStack: number;
  EggTray: number;
  EggQty: number;
  EggWeight: number;
  Employee: string;
  House?: { Name_House: string } | null;
  Room?: { Name_Room: string } | null;
  Pallet?: { Name_Pallet: string } | null;
  EggCategory?: { Name_Category: string } | null;
  EggType?: { Name_EggType: string } | null;
  LocationStock?: { Name_Location: string } | null;
}

interface ApiTransaction {
  ID_Transaction: number;
  TransactionDate: string;
  ReduceStack: number;
  ReduceTray: number;
  ReduceQty: number;
  ReduceWeight: number;
  TransactionType: string;
  Employee: string;
  ID_Intake: number;
  EggIntake: ApiEggIntake | null;
}

interface TransactionUI {
  ID_Transaction: number;
  TransactionDate: string;
  Name_Pallet: string;
  From_Location: string;
  From_House: string;
  From_Room: string;
  Name_Category: string;
  Name_EggType: string;
  ReduceStack: number;
  ReduceTray: number;
  ReduceEggRemainder: number;
  ReduceTotalQty: number;
  ReduceWeight: number;
  TransactionType: string;
  TransactionTypeLabel: string;
  Employee: string;
}

const PAGE_SIZE = 20;

function formatDate(dateString: string, includeTime = false) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return `${day}/${month}/${year}`;
}

function getTransactionTypeLabel(type: string) {
  if (!type) return "-";
  const cleanType = String(type).trim().toUpperCase();

  switch (cleanType) {
    case "ADD":
      return "รับเข้า / โยกย้าย";
    case "REDUCE":
      return "เบิกจ่าย / ตัดออก";
    default:
      return type;
  }
}

export default function HistoryContent() {
  const [history, setHistory] = useState<TransactionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async (currentPage: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await fetch(`/api/history?${params.toString()}`);
      const json = await res.json();

      if (json.status === "success" && Array.isArray(json.data)) {
        const mappedData: TransactionUI[] = json.data.map((item: ApiTransaction) => {
          const intake = item.EggIntake;

          const stackEggs = (item.ReduceStack || 0) * 300;
          const trayEggs = (item.ReduceTray || 0) * 30;
          const totalQty = item.ReduceQty || 0;
          const remainderEggs = Math.max(0, totalQty - (stackEggs + trayEggs));

          const rawType = item.TransactionType || "";

          return {
            ID_Transaction: item.ID_Transaction,
            TransactionDate: formatDate(item.TransactionDate, true),
            Name_Pallet: intake?.Pallet?.Name_Pallet || "-",
            From_Location: intake?.LocationStock?.Name_Location || "-",
            From_House: intake?.House?.Name_House || "-",
            From_Room: intake?.Room?.Name_Room || "-",
            Name_Category: intake?.EggCategory?.Name_Category || "-",
            Name_EggType: intake?.EggType?.Name_EggType || "-",
            ReduceStack: item.ReduceStack || 0,
            ReduceTray: item.ReduceTray || 0,
            ReduceEggRemainder: remainderEggs,
            ReduceTotalQty: totalQty,
            ReduceWeight: item.ReduceWeight || 0,
            TransactionType: rawType,
            TransactionTypeLabel: getTransactionTypeLabel(rawType),
            Employee: item.Employee || "-",
          };
        });

        setHistory(mappedData);
        if (json.pagination) {
          setTotalItems(json.pagination.totalItems);
          setTotalPages(json.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input to avoid spamming requests
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(page, search);
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search, fetchHistory]);

  return (
    <div className="min-h-screen bg-[#020617] p-6 text-white font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            📜 ประวัติรายการเบิกจ่าย (Transaction History)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            บันทึกประวัติการรับเข้า เบิกจ่าย และเคลื่อนย้ายสต็อกไข่ไก่
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="ค้นหา (ผู้ทำรายการ, ประเภท)..."
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 w-full md:w-80 text-sm focus:border-amber-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-2xl bg-slate-900/50">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5 font-bold">วัน-เวลา</th>
              <th className="p-3.5 font-bold">ประเภท</th>
              <th className="p-3.5 font-bold">พาเลท</th>
              <th className="p-3.5 font-bold">ตำแหน่ง</th>
              <th className="p-3.5 font-bold">โรงเรือน</th>
              <th className="p-3.5 font-bold">ห้อง</th>
              <th className="p-3.5 font-bold">หมวดหมู่</th>
              <th className="p-3.5 font-bold">ประเภท/เบอร์</th>
              <th className="p-3.5 text-right font-bold text-amber-400">ตั้ง</th>
              <th className="p-3.5 text-right font-bold text-sky-400">แผง</th>
              <th className="p-3.5 text-right font-bold text-slate-300">เศษฟอง</th>
              <th className="p-3.5 text-right font-bold text-emerald-400">รวมฟอง</th>
              <th className="p-3.5 text-right font-bold text-purple-400">น้ำหนัก (KG)</th>
              <th className="p-3.5 font-bold">ผู้ทำรายการ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={14} className="text-center p-12 text-slate-400">
                  ⏳ กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center p-12 text-slate-500">
                  🚫 ไม่พบข้อมูลประวัติรายการ
                </td>
              </tr>
            ) : (
              history.map((item) => {
                const isAdd = item.TransactionType?.toUpperCase() === "ADD";
                const isReduce = item.TransactionType?.toUpperCase() === "REDUCE";

                return (
                  <tr
                    key={item.ID_Transaction}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3.5 whitespace-nowrap text-xs text-slate-300 font-mono">
                      {item.TransactionDate}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isAdd
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : isReduce
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-slate-700/30 text-slate-300 border-slate-600/30"
                        }`}
                      >
                        {item.TransactionTypeLabel}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-amber-400 font-mono">
                      {item.Name_Pallet}
                    </td>
                    <td className="p-3.5 text-slate-200 font-medium">{item.From_Location}</td>
                    <td className="p-3.5 text-slate-300">{item.From_House}</td>
                    <td className="p-3.5 text-slate-300">{item.From_Room}</td>
                    <td className="p-3.5 text-slate-300">{item.Name_Category}</td>
                    <td className="p-3.5 text-slate-300">{item.Name_EggType}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">
                      {item.ReduceStack.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-sky-400">
                      {item.ReduceTray.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">
                      {item.ReduceEggRemainder.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      {item.ReduceTotalQty.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-purple-400">
                      {item.ReduceWeight > 0 ? item.ReduceWeight.toFixed(2) : "-"}
                    </td>
                    <td className="p-3.5 text-xs text-slate-400 truncate max-w-[150px]">
                      {item.Employee}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-5 text-xs text-slate-400">
        <div>
          แสดงข้อมูล {totalItems > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} ถึง{" "}
          {Math.min(page * PAGE_SIZE, totalItems)} จากทั้งหมด{" "}
          <strong className="text-white">{totalItems}</strong> รายการ
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
          >
            Previous
          </button>

          <span className="px-3 py-1.5 font-bold text-slate-300">
            {page} / {totalPages || 1}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0 || loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}