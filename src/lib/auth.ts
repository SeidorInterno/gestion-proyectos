import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authConfig } from "@/auth.config";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            role: true,
            consultorLevel: true,
          },
        });

        if (!user || !user.active) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roleCode: user.role.code,
          roleName: user.role.name,
          consultorLevelCode: user.consultorLevel?.code || null,
          consultorLevelName: user.consultorLevel?.name || null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as {
          id: string;
          roleCode: string;
          roleName: string;
          consultorLevelCode?: string | null;
          consultorLevelName?: string | null;
        };
        token.id = customUser.id;
        token.roleCode = customUser.roleCode;
        token.roleName = customUser.roleName;
        token.consultorLevelCode = customUser.consultorLevelCode;
        token.consultorLevelName = customUser.consultorLevelName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roleCode = token.roleCode as string;
        session.user.roleName = token.roleName as string;
        session.user.consultorLevelCode = token.consultorLevelCode as string | null;
        session.user.consultorLevelName = token.consultorLevelName as string | null;
      }
      return session;
    },
  },
});

// Función helper para hashear contraseñas
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Función helper para verificar contraseñas
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
