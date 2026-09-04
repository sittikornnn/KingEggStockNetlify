"use client";

import { useState, useEffect, useCallback } from "react";
import { SignUpForm } from "@/components/sign-up-form";

interface House { ID_House: number; Name_House: string; }
interface Room { ID_Room: number; Name_Room: string; }
interface Pallet { ID_Pallet: number; Name_Pallet: string; }
interface EggCategory { ID_Category: number; Name_Category: string; }
interface EggType { ID_EggType: number; Name_EggType: string; ID_Category: number; }

interface Employee { 
  ID_Emp?: number; 
  FirstName_Emp?: string; 
  LastName_Emp?: string; 
  Email?: string;
  Role?: string;
}

type SettingTab = "house" | "room" | "pallet" | "category" | "eggtype" | "employee";

type ItemRecord = Record<string, string | number | boolean | null>;

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<SettingTab>("house");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [houses, setHouses] = useState<House[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [categories, setCategories] = useState<EggCategory[]>([]);
  const [eggTypes, setEggTypes] = useState<EggType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    extraName: "", 
    categoryId: ""  
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({
    name: "",
    extraName: "",
    categoryId: 0
  });

  const extractArrayData = <T,>(resData: unknown): T[] => {
    if (Array.isArray(resData)) return resData as T[];
    if (
      resData && 
      typeof resData === "object" && 
      "data" in resData && 
      Array.isArray((resData as { data: unknown }).data)
    ) {
      return (resData as { data: T[] }).data;
    }
    return [];
  };

  const fetchData = useCallback(async () => {
    try {
      const apiTab = activeTab === "category" ? "eggcategory" : activeTab;
      const res = await fetch(`/api/settings?tab=${apiTab}`);
      const rawData = await res.json();

      if (activeTab === "house") setHouses(extractArrayData<House>(rawData));
      if (activeTab === "room") setRooms(extractArrayData<Room>(rawData));
      if (activeTab === "pallet") setPallets(extractArrayData<Pallet>(rawData));
      if (activeTab === "category") setCategories(extractArrayData<EggCategory>(rawData));
      if (activeTab === "eggtype") setEggTypes(extractArrayData<EggType>(rawData));
      if (activeTab === "employee") setEmployees(extractArrayData<Employee>(rawData));
    } catch (err) {
      console.error("Failed to fetch setting data:", err);
    }
  }, [activeTab]);

  const fetchCategoriesOnly = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?tab=eggcategory`);
      const rawData = await res.json();
      const safeData = extractArrayData<EggCategory>(rawData);
      setCategories(safeData);
    } catch (err) {
      console.error("Failed to fetch categories only:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (activeTab !== "category") {
      fetchCategoriesOnly();
    }
    setFormData({ id: "", name: "", extraName: "", categoryId: "" });
    setEditingId(null);
  }, [activeTab, fetchData, fetchCategoriesOnly]);

  const triggerSuccessAlert = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getTabSchema = () => {
    switch (activeTab) {
      case "house":
        return { idCol: "ID_House", nameCol: "Name_House", idLabel: "[ID_House]", nameLabel: "[Name_House]", placeholder: "เช่น PH07" };
      case "room":
        return { idCol: "ID_Room", nameCol: "Name_Room", idLabel: "[ID_Room]", nameLabel: "[Name_Room]", placeholder: "เช่น Room 01" };
      case "pallet":
        return { idCol: "ID_Pallet", nameCol: "Name_Pallet", idLabel: "[ID_Pallet]", nameLabel: "[Name_Pallet]", placeholder: "เช่น PL01" };
      case "category":
        return { idCol: "ID_Category", nameCol: "Name_Category", idLabel: "[ID_Category]", nameLabel: "[Name_Category]", placeholder: "เช่น ไข่ไก่สด" };
      case "eggtype":
        return { idCol: "ID_EggType", nameCol: "Name_EggType", idLabel: "[ID_EggType]", nameLabel: "[Name_EggType]", placeholder: "เช่น M, L, JUMBO" };
      case "employee":
        return { idCol: "ID_Emp", nameCol: "FirstName_Emp", idLabel: "[ID_Emp]", nameLabel: "[FirstName_Emp]", placeholder: "ชื่อจริงพนักงาน" };
    }
  };

  const schema = getTabSchema();

  const handleInsertData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payloadData: ItemRecord = {};
    if (formData.id) payloadData[schema.idCol] = Number(formData.id);
    payloadData[schema.nameCol] = formData.name;

    if (activeTab === "employee") {
      payloadData["LastName_Emp"] = formData.extraName;
    } else if (activeTab === "eggtype") {
      payloadData["ID_Category"] = Number(formData.categoryId);
    }

    try {
      const apiTab = activeTab === "category" ? "eggcategory" : activeTab;
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: apiTab,
          data: payloadData,
        }),
      });

      if (response.ok) {
        triggerSuccessAlert();
        setFormData({ id: "", name: "", extraName: "", categoryId: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Error inserting data:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (id: number, currentName: string, currentExtra: string | number = "") => {
    setEditingId(id);
    setEditFields({
      name: currentName,
      extraName: typeof currentExtra === "string" ? currentExtra : "",
      categoryId: typeof currentExtra === "number" ? currentExtra : 0
    });
  };

  const handleUpdateData = async (id: number) => {
    setIsSaving(true);

    const updateData: ItemRecord = {};
    updateData[schema.nameCol] = editFields.name;

    if (activeTab === "employee") {
      updateData["LastName_Emp"] = editFields.extraName;
    } else if (activeTab === "eggtype") {
      updateData["ID_Category"] = editFields.categoryId;
    }

    try {
      const apiTab = activeTab === "category" ? "eggcategory" : activeTab;
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: apiTab,
          idColumn: schema.idCol,
          idValue: id,
          data: updateData,
        }),
      });

      if (response.ok) {
        triggerSuccessAlert();
        setEditingId(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error updating data:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteData = async (id: number) => {
    if (!confirm("คุณมั่นใจที่จะลบข้อมูลรายการนี้ออกจากระบบใช่หรือไม่?")) return;
    try {
      const apiTab = activeTab === "category" ? "eggcategory" : activeTab;
      const response = await fetch(
        `/api/settings?tab=${apiTab}&idColumn=${schema.idCol}&idValue=${id}`, 
        { method: "DELETE" }
      );
      if (response.ok) {
        triggerSuccessAlert();
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          ⚙️ ระบบจัดการข้อมูลหลักฐานข้อมูล (Master Data Settings)
        </h1>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
        {(["house", "room", "pallet", "category", "eggtype", "employee"] as SettingTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "employee" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <SignUpForm onSuccess={fetchData} />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2">
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center justify-between">
              <span>👤 รายชื่อพนักงานในระบบ ({employees.length})</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono font-bold">
                    <th className="p-3 text-center w-16">ID</th>
                    <th className="p-3">ชื่อ-นามสกุล</th>
                    <th className="p-3">อีเมล</th>
                    <th className="p-3 text-center">บทบาท</th>
                    <th className="p-3 text-center w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-medium">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">
                        ยังไม่มีข้อมูลพนักงาน
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, index) => {
                      const empId = emp.ID_Emp ?? index;
                      const fullName = `${emp.FirstName_Emp || ""} ${emp.LastName_Emp || ""}`.trim() || "-";
                      
                      return (
                        <tr key={empId} className="hover:bg-slate-900/40">
                          <td className="p-3 text-center text-amber-400 font-mono">
                            {emp.ID_Emp ?? "-"}
                          </td>
                          <td className="p-3 text-white font-semibold">
                            {fullName}
                          </td>
                          <td className="p-3 text-slate-400 font-mono">
                            {emp.Email || "-"}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">
                              {emp.Role || "พนักงาน"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {emp.ID_Emp && (
                              <button 
                                onClick={() => handleDeleteData(emp.ID_Emp!)} 
                                className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 hover:bg-rose-500/20"
                              >
                                ลบ
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4">
              ➕ เพิ่มข้อมูลแท็บ {activeTab.toUpperCase()}
            </h2>
            <form onSubmit={handleInsertData} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{schema.idLabel}</label>
                <input
                  type="number"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="ปล่อยว่างหากระบบรันอัตโนมัติ (Identity)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {schema.nameLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={schema.placeholder}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {activeTab === "eggtype" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">[ID_Category] สังกัด *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:border-amber-500 focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- เลือก ID_Category --</option>
                    {categories.map((c) => (
                      <option key={c.ID_Category} value={c.ID_Category}>{c.Name_Category}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer"
              >
                {isSaving ? "⏳ บันทึกข้อมูล..." : "ปุ่มกดเพิ่มข้อมูล"}
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2">
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">
              📋 ตารางข้อมูลอ้างอิงตรงคอลัมน์ SQL Server
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono font-bold">
                    <th className="p-3 text-center w-28">{schema.idLabel}</th>
                    <th className="p-3">{schema.nameLabel}</th>
                    {activeTab === "eggtype" && <th className="p-3">[ID_Category]</th>}
                    <th className="p-3 text-center w-40">เครื่องมือจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-medium">
                  {activeTab === "house" && houses.map((h) => (
                    <tr key={h.ID_House} className="hover:bg-slate-900/40">
                      <td className="p-3 text-center text-amber-400 font-mono">{h.ID_House}</td>
                      <td className="p-3">
                        {editingId === h.ID_House ? (
                          <input type="text" value={editFields.name} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} className="bg-slate-900 border border-amber-500 text-white rounded px-2 py-1 text-xs w-full" />
                        ) : (
                          <span className="text-white font-semibold">{h.Name_House}</span>
                        )}
                      </td>
                      <td className="p-3 text-center flex justify-center gap-1.5">
                        {editingId === h.ID_House ? (
                          <>
                            <button onClick={() => handleUpdateData(h.ID_House)} className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px]">บันทึก</button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px]">ยกเลิก</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(h.ID_House, h.Name_House)} className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20">แก้ไข</button>
                            <button onClick={() => handleDeleteData(h.ID_House)} className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 hover:bg-rose-500/20">ลบ</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {activeTab === "room" && rooms.map((r) => (
                    <tr key={r.ID_Room} className="hover:bg-slate-900/40">
                      <td className="p-3 text-center text-amber-400 font-mono">{r.ID_Room}</td>
                      <td className="p-3">
                        {editingId === r.ID_Room ? (
                          <input type="text" value={editFields.name} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} className="bg-slate-900 border border-amber-500 text-white rounded px-2 py-1 text-xs w-full" />
                        ) : (
                          <span className="text-white font-semibold">{r.Name_Room}</span>
                        )}
                      </td>
                      <td className="p-3 text-center flex justify-center gap-1.5">
                        {editingId === r.ID_Room ? (
                          <>
                            <button onClick={() => handleUpdateData(r.ID_Room)} className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px]">บันทึก</button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px]">ยกเลิก</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(r.ID_Room, r.Name_Room)} className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20">แก้ไข</button>
                            <button onClick={() => handleDeleteData(r.ID_Room)} className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 hover:bg-rose-500/20">ลบ</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {activeTab === "pallet" && pallets.map((p) => (
                    <tr key={p.ID_Pallet} className="hover:bg-slate-900/40">
                      <td className="p-3 text-center text-amber-400 font-mono">{p.ID_Pallet}</td>
                      <td className="p-3">
                        {editingId === p.ID_Pallet ? (
                          <input type="text" value={editFields.name} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} className="bg-slate-900 border border-amber-500 text-white rounded px-2 py-1 text-xs w-full" />
                        ) : (
                          <span className="text-white font-semibold">{p.Name_Pallet}</span>
                        )}
                      </td>
                      <td className="p-3 text-center flex justify-center gap-1.5">
                        {editingId === p.ID_Pallet ? (
                          <>
                            <button onClick={() => handleUpdateData(p.ID_Pallet)} className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px]">บันทึก</button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px]">ยกเลิก</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(p.ID_Pallet, p.Name_Pallet)} className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20">แก้ไข</button>
                            <button onClick={() => handleDeleteData(p.ID_Pallet)} className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 hover:bg-rose-500/20">ลบ</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {activeTab === "category" && categories.map((c) => (
                    <tr key={c.ID_Category} className="hover:bg-slate-900/40">
                      <td className="p-3 text-center text-amber-400 font-mono">{c.ID_Category}</td>
                      <td className="p-3">
                        {editingId === c.ID_Category ? (
                          <input type="text" value={editFields.name} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} className="bg-slate-900 border border-amber-500 text-white rounded px-2 py-1 text-xs w-full" />
                        ) : (
                          <span className="text-white font-semibold">{c.Name_Category}</span>
                        )}
                      </td>
                      <td className="p-3 text-center flex justify-center gap-1.5">
                        {editingId === c.ID_Category ? (
                          <>
                            <button onClick={() => handleUpdateData(c.ID_Category)} className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px]">บันทึก</button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px]">ยกเลิก</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(c.ID_Category, c.Name_Category)} className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20">แก้ไข</button>
                            <button onClick={() => handleDeleteData(c.ID_Category)} className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 hover:bg-rose-500/20">ลบ</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {activeTab === "eggtype" && eggTypes.map((t) => (
                    <tr key={t.ID_EggType} className="hover:bg-slate-900/40">
                      <td className="p-3 text-center text-amber-400 font-mono">{t.ID_EggType}</td>
                      <td className="p-3">
                        {editingId === t.ID_EggType ? (
                          <input type="text" value={editFields.name} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} className="bg-slate-900 border border-amber-500 text-white rounded px-2 py-1 text-xs w-full" />
                        ) : (
                          <span className="text-white font-semibold">{t.Name_EggType}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {editingId === t.ID_EggType ? (
                          <select value={editFields.categoryId} onChange={(e) => setEditFields({ ...editFields, categoryId: Number(e.target.value) })} className="bg-slate-900 border border-amber-500 text-white rounded p-1 text-xs w-full cursor-pointer">
                            {categories.map((c) => (
                              <option key={c.ID_Category} value={c.ID_Category}>{c.Name_Category}</option>
                            ))}
                          </select>
                        ) : (
                          categories.find(c => c.ID_Category === t.ID_Category)?.Name_Category || t.ID_Category
                        )}
                      </td>
                      <td className="p-3 text-center flex justify-center gap-1.5">
                        {editingId === t.ID_EggType ? (
                          <>
                            <button onClick={() => handleUpdateData(t.ID_EggType)} className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px]">บันทึก</button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px]">ยกเลิก</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(t.ID_EggType, t.Name_EggType, t.ID_Category)} className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20">แก้ไข</button>
                            <button onClick={() => handleDeleteData(t.ID_EggType)} className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 hover:bg-rose-500/20">ลบ</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-xs text-center">
            <p className="text-emerald-400 text-sm font-bold">✔️ ซิงค์ฐานข้อมูล SQL Server สำเร็จ</p>
          </div>
        </div>
      )}
    </div>
  );
}