import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "Admin" | "Manager" | "Employee";

export type UserProfile = {
  Email: string;
  FirstName: string | null;
  LastName: string | null;
  Role: UserRole;
  created_at: string;
};

/**
 * ตารางกำหนดสิทธิ์แต่ละหน้า ใช้ร่วมกันทั้ง proxy (middleware) และ page-level guard
 * แก้ตรงนี้ที่เดียว ถ้าจะเพิ่ม/ลดหน้า หรือเปลี่ยนสิทธิ์
 */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/protected/dashboard": ["Admin", "Manager"],
  "/protected/intake": ["Admin", "Employee"],
  "/protected/stock": ["Admin", "Employee"],
  "/protected/history": ["Admin", "Manager"],
  "/protected/settings": ["Admin"],
};

/**
 * ดึงข้อมูล User ปัจจุบัน หากไม่มีจะ Redirect ไปหน้า Login ทันที
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

/**
 * ดึงข้อมูล User ปัจจุบันโดยไม่ Redirect (คืนค่า null ถ้าไม่ได้ Login)
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * ดึง Profile (Role, FirstName, LastName) จากตาราง Employee ด้วย Email ของ user ที่ login อยู่
 */
async function fetchProfileByEmail(email: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("Employee")
    .select("Email, FirstName, LastName, Role, created_at")
    .eq("Email", email)
    .single<UserProfile>();

  return profile ?? null;
}

/**
 * ดึง User + Profile (Role, FirstName, LastName) — Redirect ไป login ถ้ายังไม่ได้ล็อกอิน
 */
export async function requireAuthWithProfile() {
  const user = await requireAuth();
  const profile = user.email ? await fetchProfileByEmail(user.email) : null;

  return {
    user,
    profile,
    role: (profile?.Role ?? "Employee") as UserRole,
  };
}

/**
 * เหมือน requireAuthWithProfile แต่ไม่ Redirect (คืนค่า null ถ้าไม่ได้ Login)
 */
export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = user.email ? await fetchProfileByEmail(user.email) : null;

  return {
    user,
    profile,
    role: (profile?.Role ?? "Employee") as UserRole,
  };
}

/**
 * เช็คว่า User ปัจจุบันมี Role อยู่ใน allowedRoles หรือไม่
 * ถ้าไม่ใช่ Redirect ไปหน้าที่กำหนด (default: /protected/dashboard)
 * ใช้เป็นด่านที่สองในแต่ละหน้า page.tsx ควบคู่กับ proxy
 */
export async function requireRole(
  allowedRoles: UserRole[],
  redirectTo: string = "/protected/dashboard"
) {
  const { user, role, profile } = await requireAuthWithProfile();

  if (!allowedRoles.includes(role)) {
    redirect(redirectTo);
  }

  return { user, role, profile };
}