import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas protegidas por rol
const roleProtectedRoutes: Record<string, string[]> = {
  "/dashboard/usuarios": ["MANAGER"],
  "/dashboard/configuracion": ["MANAGER"],
  "/dashboard/clientes": ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
  "/dashboard/reportes": ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
  "/api/roles": ["MANAGER"],
  "/api/levels": ["MANAGER"],
  "/api/clients": ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
  "/api/reports": ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Obtener token JWT (ligero, no necesita Prisma)
  // NextAuth v5 usa AUTH_SECRET, pero también soporta NEXTAUTH_SECRET
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  });

  // Si no hay token, redirigir a login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permisos por rol
  const userRole = token.roleCode as string;

  for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
