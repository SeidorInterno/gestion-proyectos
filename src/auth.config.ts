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
    // Este callback es necesario para que roleCode esté disponible en el middleware
    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.id = u.id;
        token.roleCode = u.roleCode;
        token.roleName = u.roleName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id;
        (session.user as any).roleCode = token.roleCode;
        (session.user as any).roleName = token.roleName;
      }
      return session;
    },
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
