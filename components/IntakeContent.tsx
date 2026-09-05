"use client";

import { useState, useEffect, useCallback } from "react";
import IntakeHeader from "@/components/IntakeHeader";
import IntakeFormModal from "@/components/IntakeFormModal";
import LocationModal from "@/components/LocationModal";
import IntakeTable from "@/components/IntakeTable";
import IntakeNotify from "@/components/Notify";
import { createClient } from "@/lib/supabase/client";

interface ChickenHouse { ID_House: number; Name_House: string; }
interface Room { ID_Room: number; Name_Room: string; }
interface Pallet { ID_Pallet: number; Name_Pallet: string; }
interface EggCategory { ID_Category: number; Name_Category: string; }
interface EggType { ID_EggType: number; Name_EggType: string; ID_Category: number; }
interface LocationData { ID_Location: number; Name_Building: string; Name_Location: string; }

interface RawIntakeHistory {
  ID_Intake?: number;
  CreateDate: string;
  EggStack: number;
  EggTray: number;
  EggQty: number;
  EggWeight: number;
  Employee: string;
  ID_House?: { Name_House: string } | string;
  ID_Room?: { Name_Room: string } | string;
  ID_Pallet?: { Name_Pallet: string } | string;
  EggCategory?: { Name_Category: string } | string;
  EggType?: { Name_EggType: string } | string;
  ID_Location?: number | null;
  Location?: { Name_Location: string } | string;
}

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
  ID_House?: number;
  ID_Room?: number;
  ID_Pallet?: number;
  ID_Category?: number;
  ID_EggType?: number;
  ID_Location?: number;
}

interface AlertState {
  show: boolean;
  type: "success" | "warning" | "error";
  title: string;
  message: string;
}

export default function IntakeContent() {
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingRow, setEditingRow] = useState<EggIntakeData | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = new Date(
    today.setDate(today.getDate() - 1)
  )
    .toISOString()
    .split("T")[0];
  const [startDate, setStartDate] = useState(yesterdayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [chickenHouses, setChickenHouses] = useState<ChickenHouse[]>([]);
  const [Room, setRoom] = useState<Room[]>([]);
  const [Pallet, setPallet] = useState<Pallet[]>([]);
  const [eggCategories, setEggCategories] = useState<EggCategory[]>([]);
  const [allEggTypes, setAllEggTypes] = useState<EggType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [intakeList, setIntakeList] = useState<EggIntakeData[]>([]);

  const [selectedHouse, setSelectedHouse] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedPallet, setSelectedPallet] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedEggType, setSelectedEggType] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const [eggStack, setEggStack] = useState<number | string>(0);
  const [eggTray, setEggTray] = useState<number | string>(0);
  const [eggQty, setEggQty] = useState<number | string>(0);
  const [eggWeight, setEggWeight] = useState<number | string>(0.0);

  const [alertConfig, setAlertConfig] = useState<AlertState>({
    show: false, type: "success", title: "", message: "",
  });

  const now = new Date();
  const currentDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [dateTime, setDateTime] = useState(currentDateTime);
  const [isSaving, setIsSaving] = useState(false);

  const showAlert = useCallback((type: "success" | "warning" | "error", title: string, message: string) => {
    setAlertConfig({ show: true, type, title, message });
  }, []);

  const parseHistoryData = (rawList: RawIntakeHistory[]): EggIntakeData[] => {
    return rawList.map((item) => {
      const houseName = typeof item.ID_House === "object" ? item.ID_House?.Name_House : item.ID_House;
      const roomName = typeof item.ID_Room === "object" ? item.ID_Room?.Name_Room : item.ID_Room;
      const palletName = typeof item.ID_Pallet === "object" ? item.ID_Pallet?.Name_Pallet : item.ID_Pallet;
      const categoryName = typeof item.EggCategory === "object" ? item.EggCategory?.Name_Category : item.EggCategory;
      const typeName = typeof item.EggType === "object" ? item.EggType?.Name_EggType : item.EggType;
      const locationName = typeof item.Location === "object" ? item.Location?.Name_Location : item.Location;

      return {
        ID_Intake: item.ID_Intake,
        CreateDate: item.CreateDate,
        House: String(houseName || "-"),
        Room: String(roomName || "-"),
        Pallet: String(palletName || "-"),
        EggCategory: String(categoryName || "-"),
        EggType: String(typeName || "-"),
        EggStack: item.EggStack || 0,
        EggTray: item.EggTray || 0,
        EggQty: item.EggQty || 0,
        Eggweight: item.EggWeight || 0,
        Employee: String(item.Employee || "-"),
        Location: String(locationName || "-"),
        ID_Location: item.ID_Location || undefined,
      };
    });
  };

  // ดึงข้อมูล Master Data และ History ทั้งหมดในคำขอเดียว
  const fetchPageData = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/intake?startDate=${start}&endDate=${end}`);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        // อัปเดต Master Data
        setChickenHouses(json.data.ChickenHouses || []);
        setRoom(json.data.Room || []);
        setPallet(json.data.Pallet || []);
        setEggCategories(json.data.EggCategories || []);
        setAllEggTypes(json.data.EggTypes || []);
        if (json.data.buildings) setBuildings(json.data.buildings);
        if (json.data.locations) setLocations(json.data.locations);

        // อัปเดต Intake History
        if (json.data.intakeHistory) {
          const parsed = parseHistoryData(json.data.intakeHistory);
          setIntakeList(parsed);
        }
      }
    } catch (_error) {
      console.error("Fetch Page Data Error:", _error);
      showAlert("error", "ดึงข้อมูลล้มเหลว", "ไม่สามารถโหลดข้อมูลล่าสุดได้");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  const handleSave = async () => {
    const hasEggAmount =
      Number(eggStack) > 0 ||
      Number(eggTray) > 0 ||
      Number(eggQty) > 0 ||
      Number(eggWeight) > 0;

    if (!dateTime || !selectedHouse || !selectedRoom || !selectedPallet || !selectedCategory || !selectedEggType || !hasEggAmount) {
      showAlert("warning", "ข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลที่จำเป็นให้ครบทุกช่องก่อนทำการบันทึก");
      setShowForm(true);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateTime,
          idHouse: selectedHouse,
          idRoom: selectedRoom,
          idPallet: selectedPallet,
          idCategory: selectedCategory,
          idEggType: selectedEggType,
          eggStack: Number(eggStack) || 0,
          eggTray: Number(eggTray) || 0,
          eggQty: Number(eggQty) || 0,
          eggWeight: Number(eggWeight) || 0,
          idEmployee: userId
        })
      });

      const resData = await response.json();
      if (resData.status === "success") {
        showAlert("success", "บันทึกสำเร็จ!", "ระบบได้จัดเก็บข้อมูลการนับไข่เข้าสู่คลังเรียบร้อยแล้ว");

        // เคลียร์ค่าฟอร์ม
        setEggStack(0); setEggTray(0); setEggQty(0); setEggWeight(0);
        setSelectedPallet("");

        setShowForm(false);

        // โหลดข้อมูลทั้งหมดใหม่เพียง 1 รอบ
        await fetchPageData(startDate, endDate);
      } else {
        showAlert("error", "เกิดข้อผิดพลาดจากระบบ", resData.message || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (_error) {
      showAlert("error", "การเชื่อมต่อล้มเหลว", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRowDetails = async () => {
    if (!editingRow || !editingRow.ID_Intake) {
      showAlert("warning", "ข้อมูลไม่สมบูรณ์", "ไม่พบ รหัสรายการ (ID_Intake) ที่ต้องการอัปเดต");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/intake", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRow.ID_Intake,
          location: selectedLocation || null
        })
      });

      const resData = await response.json();
      if (resData.status === "success") {
        showAlert("success", "อัปเดตข้อมูลสำเร็จ", "ปรับเปลี่ยนตำแหน่งคลังจัดเก็บเรียบร้อยแล้ว");
        setShowLocationModal(false);
        setEditingRow(null);
        fetchPageData(startDate, endDate);
      } else {
        showAlert("error", "เกิดข้อผิดพลาด", resData.message || "ไม่สามารถบันทึกตำแหน่งได้");
      }
    } catch (_error) {
      showAlert("error", "การเชื่อมต่อล้มเหลว", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  const openLocationDetails = (item: EggIntakeData) => {
    setEditingRow({ ...item });
    setSelectedBuilding("");
    setSelectedLocation(item.ID_Location ? String(item.ID_Location) : "");
    setShowLocationModal(true);
  };

  // ดึงข้อมูล Authenticated User เพียงครั้งเดียวเมื่อ Render หน้าเว็บ
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserId(user.email);
      }
    }
    getUser();
  }, [supabase.auth]);

  // ดึงข้อมูลจาก API เฉพาะเมื่อช่วงวันที่เลือกมีการเปลี่ยนแปลง
  useEffect(() => {
    if (startDate && endDate) {
      fetchPageData(startDate, endDate);
    }
  }, [startDate, endDate, fetchPageData]);

  const filteredEggTypes = allEggTypes.filter(type => type.ID_Category === Number(selectedCategory));
  const filteredLocations = locations.filter(loc => loc.Name_Building === selectedBuilding);

  const filteredIntakeList = intakeList.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      String(item.House || "").toLowerCase().includes(searchLower) ||
      String(item.Room || "").toLowerCase().includes(searchLower) ||
      String(item.Pallet || "").toLowerCase().includes(searchLower) ||
      String(item.EggCategory || "").toLowerCase().includes(searchLower) ||
      String(item.EggType || "").toLowerCase().includes(searchLower) ||
      String(item.Employee || "").toLowerCase().includes(searchLower) ||
      String(item.Location || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 bg-[#020617] min-h-screen text-white">
      <IntakeHeader
        search={search} setSearch={setSearch}
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        onOpenForm={() => { setShowForm(true); setDateTime(currentDateTime); }}
      />

      <IntakeTable
        isLoading={isLoading}
        filteredIntakeList={filteredIntakeList}
        onOpenLocation={openLocationDetails}
      />

      {showForm && (
        <IntakeFormModal
          onClose={() => setShowForm(false)}
          dateTime={dateTime} setDateTime={setDateTime}
          chickenHouses={chickenHouses} selectedHouse={selectedHouse} setSelectedHouse={setSelectedHouse}
          Room={Room} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom}
          Pallet={Pallet} selectedPallet={selectedPallet} setSelectedPallet={setSelectedPallet}
          eggCategories={eggCategories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          filteredEggTypes={filteredEggTypes} selectedEggType={selectedEggType} setSelectedEggType={setSelectedEggType}
          eggStack={eggStack} setEggStack={setEggStack} eggTray={eggTray} setEggTray={setEggTray}
          eggQty={eggQty} setEggQty={setEggQty} eggWeight={eggWeight} setEggWeight={setEggWeight}
          isSaving={isSaving} onSave={handleSave}
        />
      )}

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          editingRow={editingRow}
          buildings={buildings}
          selectedBuilding={selectedBuilding} setSelectedBuilding={setSelectedBuilding}
          selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation}
          filteredLocations={filteredLocations}
          isSaving={isSaving}
          onUpdate={handleUpdateRowDetails}
        />
      )}

      <IntakeNotify
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}