"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Bell } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import type { UserRole } from "@/lib/auth";

const menus: { title: string; href: string; roles: UserRole[] }[] = [
  { title: "Dashboard", href: "/protected/dashboard", roles: ["Admin", "Manager"] },
  { title: "การนับไข่", href: "/protected/intake", roles: ["Admin", "Employee"] },
  { title: "การจัดเก็บ", href: "/protected/stock", roles: ["Admin", "Employee"] },
  { title: "ประวัติ", href: "/protected/history", roles: ["Admin", "Manager"] },
  { title: "การตั้งค่า", href: "/protected/settings", roles: ["Admin"] },
];

export default function Navbar({
  userEmail,
  role,
}: {
  userEmail?: string | null;
  role?: UserRole;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // ถ้าไม่มี role ส่งมา (ยังโหลดไม่เสร็จ หรือไม่ได้ login) จะไม่โชว์เมนูที่จำกัดสิทธิ์เลย
  const visibleMenus = menus.filter((m) => role && m.roles.includes(role));

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 shadow-sm text-white">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative h-10 w-10 md:h-12 md:w-12">
            <Image
              src="/Images/logo.jpg"
              alt="EggStock Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <div className="hidden lg:flex flex-col">
            <h1 className="text-xl font-bold text-yellow-500">EggStock</h1>
            <span className="text-xs text-gray-400">Management System</span>
          </div>
        </Link>

        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {visibleMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={
                pathname === menu.href
                  ? `font-semibold text-yellow-500 border-b-2 border-yellow-500 py-1`
                  : `text-gray-300 hover:text-yellow-400 py-1`
              }
            >
              {menu.title}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex ml-auto items-center gap-4">
          <button className="rounded-full bg-slate-800 p-2 hover:bg-slate-700 text-gray-300">
            <Bell size={20} />
          </button>
          <UserMenu userEmail={userEmail} />
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="ml-auto rounded-lg bg-slate-800 p-2 text-white hover:bg-slate-700 lg:hidden border border-slate-700"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-800 bg-slate-900 lg:hidden p-4">
          <div className="flex flex-col space-y-2">
            {visibleMenus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-center text-gray-300 hover:bg-slate-800 rounded-lg"
              >
                {menu.title}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-800 flex justify-center">
              <UserMenu userEmail={userEmail} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}