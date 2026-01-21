import type { NextAuthConfig } from "next-auth";

// Esta configuración es para el middleware (sin Prisma/bcrypt para mantenerlo ligero)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [], // Los providers se agregan en auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnApi = nextUrl.pathname.startsWith("/api") &&
                      !nextUrl.pathname.startsWith("/api/auth");
      const isPublic = nextUrl.pathname.startsWith("/login") ||
                       nextUrl.pathname.startsWith("/api/auth");

      if (isPublic) {
        return true;
      }

      if (isOnDashboard || isOnApi) {
        if (isLoggedIn) {
          // Verificar permisos por rol
          const userRole = auth?.user?.roleCode;
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

          for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
            if (nextUrl.pathname.startsWith(route)) {
              if (!userRole || !allowedRoles.includes(userRole)) {
                return Response.redirect(new URL("/dashboard", nextUrl));
              }
              break;
            }
          }
          return true;
        }
        return false; // Redirect to login
      }

      return true;
    },
  },
};
