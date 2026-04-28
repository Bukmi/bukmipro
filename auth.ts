import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import type { UserRole, OnboardingStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      onboardingStatus: OnboardingStatus;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    onboardingStatus: OnboardingStatus;
  }
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-email",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const parsed = loginSchema.safeParse(creds);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;
        if (user.suspendedAt) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          onboardingStatus: user.onboardingStatus,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: UserRole }).role;
        token.onboardingStatus = (user as { onboardingStatus: OnboardingStatus }).onboardingStatus;
      }
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingStatus: true, role: true },
        });
        if (fresh) {
          token.onboardingStatus = fresh.onboardingStatus;
          token.role = fresh.role;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.onboardingStatus = token.onboardingStatus as OnboardingStatus;
      return session;
    },
  },
});
