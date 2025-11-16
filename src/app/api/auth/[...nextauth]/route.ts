import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { dbUsers } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        // Verificar si la cuenta está bloqueada
        const isLocked = await dbUsers.isAccountLocked(credentials.email);
        if (isLocked) {
          throw new Error("Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta en 15 minutos.");
        }

        // Verificar credenciales
        const isValid = await dbUsers.verifyPassword(credentials.email, credentials.password);
        
        if (!isValid) {
          await dbUsers.incrementLoginAttempts(credentials.email);
          const user = await dbUsers.findByEmail(credentials.email);
          const attemptsLeft = user ? 5 - user.loginAttempts : 5;
          
          if (attemptsLeft > 0) {
            throw new Error(`Credenciales inválidas. Te quedan ${attemptsLeft} intentos.`);
          } else {
            throw new Error("Cuenta bloqueada por múltiples intentos fallidos.");
          }
        }

        // Login exitoso - resetear intentos
        await dbUsers.resetLoginAttempts(credentials.email);
        
        const user = await dbUsers.findByEmail(credentials.email);
        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  pages: {
    signIn: '/signIn',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
