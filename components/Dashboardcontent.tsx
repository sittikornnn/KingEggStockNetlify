"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Pie, Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface RecentTransaction {
  ID_Transaction: number;
  TransactionDate: string;
  TotalReduceQty: number;
  ReduceWeight: number;
  Employee: string;
  TransactionType: string;
  EggType: string;
  House: string;
  Pallet: string;
  Location: string;
}

interface LowStockItem {
  Location: string;
  Pallet: string;
  EggType: string;
  Qty: number;
  Weight: number;
}

interface DashboardData {
  summary: {
    totalEggs: number;
    totalWeight: number;
    todayIntake: number;
    todayTransaction: number;
  };
  lineChart: {
    labels: string[];
    intake: number[];
    transaction: number[];
  };
  eggTypeChart: {
    labels: string[];
    data: number[];
  };
  houseChart: {
    labels: string[];
    data: number[];
  };
  recentTransactions: RecentTransaction[];
  lowStock: LowStockItem[];
}

interface CardProps {
  title: string;
  value: string;
  color: string;
}

const EGG_TYPE_COLORS = [
  "#38bdf8",
  "#4ade80",
  "#facc15",
  "#fb7185",
  "#c084fc",
  "#22d3ee",
  "#fb923c",
  "#a3e635",
];

export default function DashboardContent() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();

      if (json.status === "success") {
        setDashboard(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white text-xl font-medium">
        Loading Dashboard...
      </div>
    );
  }

  const pieData = dashboard.eggTypeChart.labels
    .map((label, index) => ({
      label,
      value: dashboard.eggTypeChart.data[index],
    }))
    .filter((item) => item.value > 0);

  const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-[#020617] p-8 text-white">
      <h1 className="text-4xl font-bold mb-8 tracking-tight">📊 Dashboard</h1>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card
          title="Remain Eggs"
          value={dashboard.summary.totalEggs.toLocaleString()}
          color="text-blue-400"
        />
        <Card
          title="Today's Intake"
          value={dashboard.summary.todayIntake.toLocaleString()}
          color="text-green-400"
        />
        <Card
          title="Today's Weight (KG)"
          value={dashboard.summary.totalWeight.toLocaleString()}
          color="text-yellow-400"
        />
        <Card
          title="Today's Transaction"
          value={dashboard.summary.todayTransaction.toLocaleString()}
          color="text-red-400"
        />
      </div>

      {/* Primary Charts (Line + Pie) */}
      <div className="grid xl:grid-cols-2 gap-6 mb-8">
        {/* Line Chart */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-5">Last 7 Days</h2>
          <div className="h-87.5">
            <Line
              data={{
                labels: dashboard.lineChart.labels,
                datasets: [
                  {
                    label: "Intake",
                    data: dashboard.lineChart.intake,
                    borderColor: "#4ade80",
                    backgroundColor: "#4ade80",
                    tension: 0.4,
                  },
                  {
                    label: "Transaction",
                    data: dashboard.lineChart.transaction,
                    borderColor: "#fb7185",
                    backgroundColor: "#fb7185",
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  datalabels: { display: false },
                },
              }}
            />
          </div>
        </div>

        {/* Pie Chart: Intake by Egg Type */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-5">Intake by Egg Type</h2>
          <div className="h-87.5">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                No Intake Data
              </div>
            ) : (
              <Pie
                data={{
                  labels: pieData.map((x) => x.label),
                  datasets: [
                    {
                      data: pieData.map((x) => x.value),
                      backgroundColor: pieData.map(
                        (_, i) => EGG_TYPE_COLORS[i % EGG_TYPE_COLORS.length]
                      ),
                      borderColor: "#020617",
                      borderWidth: 3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "right",
                      labels: {
                        color: "#e2e8f0",
                        font: { size: 13, weight: "bold" },
                        padding: 15,
                      },
                    },
                    tooltip: {
                      backgroundColor: "#020617",
                      titleColor: "#ffffff",
                      bodyColor: "#cbd5e1",
                      borderColor: "#334155",
                      borderWidth: 1,
                      callbacks: {
                        label: (context) => {
                          const value = context.raw as number;
                          const percent = ((value / pieTotal) * 100).toFixed(1);
                          return ` ${value.toLocaleString()} ฟอง (${percent}%)`;
                        },
                      },
                    },
                    datalabels: {
                      color: "#ffffff",
                      font: { size: 12, weight: "bold" },
                      textAlign: "center",
                      formatter: (value: number, ctx) => {
                        const percent = (value / pieTotal) * 100;
                        if (percent < 3) return "";

                        const label =
                          ctx.chart.data.labels?.[ctx.dataIndex] ?? "";
                        return [label, `${percent.toFixed(1)}%`];
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Secondary Row (Remain Stock at House + Low Stock Alert Table) */}
      <div className="grid xl:grid-cols-2 gap-6 mb-8">
        {/* House Bar Chart */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-5">Remain Stock at House</h2>
          <div className="h-87.5">
            <Bar
              data={{
                labels: dashboard.houseChart.labels,
                datasets: [
                  {
                    label: "Eggs",
                    data: dashboard.houseChart.data,
                    backgroundColor: "#38bdf8",
                    borderRadius: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  datalabels: { display: false },
                },
                scales: {
                  x: {
                    ticks: { color: "#94a3b8" },
                    grid: { color: "#334155" },
                  },
                  y: {
                    ticks: { color: "#94a3b8" },
                    grid: { color: "#334155" },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Low Stock Panel Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
              <span className="text-amber-400">⚠</span> Low Stock
            </h2>

            <div className="overflow-x-auto max-h-87.5 overflow-y-auto pr-1">
              {dashboard.lowStock.length === 0 ? (
                <div className="text-slate-400 py-8 text-center">
                  All stock levels are optimal.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider sticky top-0 bg-slate-900">
                      <th className="py-2.5 px-3">Pallet</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">EggType</th>
                      <th className="py-2.5 px-3 text-right">TotalEggQty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {dashboard.lowStock.map((item, idx) => (
                      <tr
                        key={`${item.Pallet}-${item.Location}-${idx}`}
                        className="hover:bg-slate-800/50 transition-colors text-slate-300"
                      >
                        <td className="py-3 px-3 font-medium text-slate-200">
                          {item.Pallet}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {item.Location}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {item.EggType}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-400">
                          {item.Qty.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-xl font-bold mb-5">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-175">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="text-left py-3 w-[22%]">Date</th>
                <th className="text-left w-[12%]">Pallet</th>
                <th className="text-left w-[14%]">Location</th>
                <th className="text-left w-[14%]">Egg Type</th>
                <th className="text-right w-[13%] pr-6">Qty</th>
                <th className="text-left w-[25%] pl-6">Employee</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentTransactions.map((row) => (
                <tr
                  key={row.ID_Transaction}
                  className="border-b border-slate-800 hover:bg-slate-800/60 transition-colors text-slate-300 text-sm"
                >
                  <td className="py-3.5">
                    {new Date(row.TransactionDate).toLocaleString("th-TH")}
                  </td>
                  <td>{row.Pallet}</td>
                  <td>{row.Location}</td>
                  <td>{row.EggType}</td>
                  <td className="text-right pr-6 font-semibold text-slate-200">
                    {row.TotalReduceQty.toLocaleString()}
                  </td>
                  <td className="pl-6 truncate">{row.Employee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }: CardProps) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg flex flex-col justify-between">
      <div className="text-slate-400 text-sm font-medium">{title}</div>
      <div className={`text-3xl font-extrabold mt-3 tracking-tight ${color}`}>
        {value}
      </div>
    </div>
  );
}