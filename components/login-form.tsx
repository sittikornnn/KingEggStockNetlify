"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import type { UserRole } from "@/lib/auth";

// หน้าแรกที่จะพาไปหลัง login ตาม Role
const HOME_BY_ROLE: Record<UserRole, string> = {
  Admin: "/protected/dashboard",
  Manager: "/protected/dashboard",
  Employee: "/protected/intake",
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // ดึง Role จากตาราง Users เพื่อตัดสินใจปลายทาง
    const { data: profile } = await supabase
      .from("Users")
      .select("Role")
      .eq("Email", data.user.email)
      .single<{ Role: UserRole }>();

    const role = profile?.Role ?? "Employee";
    const destination = HOME_BY_ROLE[role] ?? "/protected/intake";

    router.push(destination);
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm text-card-foreground">
      <div className="flex flex-col items-center gap-2 mb-6 text-center">
        <div className="relative w-28 h-28 overflow-hidden rounded-full border border-border shadow-inner">
          <Image
            src="/Images/logo.jpg"
            alt="EggStock Logo"
            width={112}
            height={112}
            priority // ช่วยเร่งการโหลด LCP
            sizes="112px"
            className="object-cover"
          />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">EggStock</h1>
        <p className="text-xs text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}