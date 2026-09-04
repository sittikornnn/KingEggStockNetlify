import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { ROUTE_ROLES, type UserRole } from "@/lib/auth";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // ---- เพิ่มส่วนเช็ค Role สำหรับหน้าใน ROUTE_ROLES (เช่น /protected/*) ----
  // ทำหลังจากเช็ค auth ด้านบนแล้วเท่านั้น เพื่อไม่ให้ไปยุ่งกับ logic ที่คุมเรื่อง cookie/session
  const path = request.nextUrl.pathname;
  const requiredRoles = ROUTE_ROLES[path];
  const userEmail = (user as { email?: string } | undefined)?.email;

  if (user && userEmail && requiredRoles) {
    const { data: profile } = await supabase
      .from("Employee")
      .select("Role")
      .eq("Email", userEmail)
      .single<{ Role: UserRole }>();

    const role = profile?.Role ?? "Employee";

    if (!requiredRoles.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/protected/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}