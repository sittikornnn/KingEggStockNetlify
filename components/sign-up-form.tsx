"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSuccess?: () => void;
}

export function SignUpForm({ className, onSuccess, ...props }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      setIsLoading(false);
      return;
    }

    try {
      // 1. สมัครสมาชิก Auth ใน Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
        },
      });

      if (signUpError) throw signUpError;

      // 2. บันทึกข้อมูลพนักงานลงตาราง Employee (ใช้ Email เป็น PK และชื่อคอลัมน์ตรงกับ DB จริง)
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "employee",
          data: {
            Email: email,             // Primary Key
            created_at: new Date().toISOString(), // ส่ง Timestamp ปัจจุบัน
            FirstName: firstName,     // ชื่อคอลัมน์ตรงกับ DB
            LastName: lastName,       // ชื่อคอลัมน์ตรงกับ DB
            Role: role,               // บันทึกบทบาทลงตาราง
          },
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || "ไม่สามารถบันทึกข้อมูลพนักงานลงตาราง Employee ได้");
      }

      // รีเซ็ตค่าในฟอร์ม
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRepeatPassword("");

      // เรียก Callback Reload ตารางพนักงาน (ถ้ามี)
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/auth/sign-up-success");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)} {...props}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
            ➕ เพิ่มข้อมูลพนักงานใหม่ (Employee)
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            สร้างบัญชี Auth พร้อมเพิ่มชื่อ-นามสกุลเข้าฐานข้อมูล
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                ชื่อจริง <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ชื่อจริง"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="นามสกุล"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              บทบาท / ตำแหน่ง
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              อีเมลพนักงาน <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="example@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              รหัสผ่าน <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md mt-1"
          >
            {isLoading ? "⏳ กำลังสร้างบัญชี..." : "ยืนยันการเพิ่มพนักงาน"}
          </button>
        </form>
      </div>
    </div>
  );
}