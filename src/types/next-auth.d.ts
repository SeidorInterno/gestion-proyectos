import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleCode: string;
      roleName: string;
      consultorLevelCode?: string | null;
      consultorLevelName?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    roleCode: string;
    roleName: string;
    consultorLevelCode?: string | null;
    consultorLevelName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    roleCode: string;
    roleName: string;
    consultorLevelCode?: string | null;
    consultorLevelName?: string | null;
  }
}
