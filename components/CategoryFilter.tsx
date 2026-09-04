"use client";

interface DBCategory {
  ID_Category: number;
  Name_Category: string;
}

interface Stock {
  SumEggQty: number;
  EggWeight: number;
  Location: string;
  EggCategory: string;
}

interface CategoryFilterProps {
  stocks: Stock[];
  dbCategories: DBCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  stocks,
  dbCategories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  
  const isValidStock = (s: Stock) =>
    (s.SumEggQty > 0 || s.EggWeight > 0 ) && s.Location && s.Location !== "NULL" && s.Location !== "";

  const allCount = stocks.filter(isValidStock).length;

  return (
    <div className="mb-6">
      <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
        🗂️ เลือกประเภทไข่ที่ต้องการเบิกจ่ายออก (ดึงหมวดหมู่เรียลไทม์จากฐานข้อมูล)
      </label>
      <div className="flex flex-wrap gap-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => onSelectCategory("ALL")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            selectedCategory === "ALL"
              ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/10 scale-105"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
          }`}
        >
          📦 ดูทุกประเภทไข่
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] ${
              selectedCategory === "ALL" ? "bg-slate-950/20 text-slate-900" : "bg-slate-900 text-slate-400"
            }`}
          >
            {allCount}
          </span>
        </button>

        {dbCategories.map((cat) => {
          const count = stocks.filter(
            (s) => isValidStock(s) && s.EggCategory === cat.Name_Category
          ).length;

          return (
            <button
              key={cat.ID_Category}
              onClick={() => onSelectCategory(cat.Name_Category)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                selectedCategory === cat.Name_Category
                  ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/10 scale-105"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
              }`}
            >
              🥚 {cat.Name_Category}
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] ${
                  selectedCategory === cat.Name_Category ? "bg-slate-950/20 text-slate-900" : "bg-slate-900 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}