import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/api/auth"];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permitir archivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Obtener token de sesión
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // Si no hay sesión, redirigir a login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permisos por rol para rutas protegidas
  const userRole = token.roleCode as string;

  for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        // Para APIs, devolver 403
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Sin permisos" },
            { status: 403 }
          );
        }
        // Para páginas, redirigir al dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
