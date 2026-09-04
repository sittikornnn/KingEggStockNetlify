"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCircle2, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เมื่อคลิกนอกพื้นที่ Component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700"
      >
        <UserCircle2 size={20} className="text-yellow-500" />
        <span className="max-w-[130px] truncate">{userEmail || "Guest"}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-700">
            <p className="text-xs text-gray-400">เข้าสู่ระบบด้วย</p>
            <p className="text-sm font-medium text-white truncate">{userEmail || "Guest"}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 mt-1 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      )}
    </div>
  );
}