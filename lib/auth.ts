import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as never,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip =
          (req?.headers?.["x-forwarded-for"] as string | undefined)
            ?.split(",")[0]
            ?.trim() ?? "unknown";

        const rl = await rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
        if (!rl.ok) {
          console.warn(`[auth] rate-limit hit for ip=${ip}`);
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        if (!credentials?.email || !credentials?.password) {
          console.warn("[auth] missing email or password");
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.warn(`[auth] no user found for email=${credentials.email}`);
          throw new Error("Invalid credentials");
        }

        if (!user.password) {
          console.warn(`[auth] user has no password hash: email=${credentials.email}`);
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          console.warn(`[auth] wrong password for email=${credentials.email}`);
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          console.warn(`[auth] suspended account: email=${credentials.email}`);
          throw new Error("ACCOUNT_SUSPENDED");
        }

        console.log(`[auth] login success: email=${credentials.email} role=${user.role}`);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
        token.isActive = (user as { isActive?: boolean }).isActive ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.isActive = token.isActive as boolean ?? true;
      }
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);

export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user;
};
